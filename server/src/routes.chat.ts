import { Router } from "express";
import db from "./db.js";
import { auth } from "./middleware.js";
import { emitToUser } from "./socket.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "..", "public", "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });
const API_BASE = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 4000}`;

const chatUploadStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (req: any, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `dating-chat-${req.user.id}-${Date.now()}${ext}`);
  },
});

const chatUpload = multer({
  storage: chatUploadStorage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) return cb(new Error("Only image uploads are allowed"));
    cb(null, true);
  },
});

function areMatched(userA: number, userB: number) {
  const a = Math.min(userA, userB);
  const b = Math.max(userA, userB);
  return db
    .prepare("SELECT 1 FROM matches WHERE userA = ? AND userB = ?")
    .get(a, b);
}

function isBlocked(userA: number, userB: number) {
  return db
    .prepare(
      `SELECT 1 FROM user_blocks
       WHERE (blockerUserId = ? AND blockedUserId = ?)
          OR (blockerUserId = ? AND blockedUserId = ?)`
    )
    .get(userA, userB, userB, userA);
}

router.get("/conversations", auth, (req: any, res) => {
  const userId = req.user.id;

  try {
    const rows = db
      .prepare(
        `SELECT
           u.id AS userId,
           u.fullName,
           u.age,
           p.avatarUrl,
           lm.text AS lastMessage,
           lm.createdAt AS lastMessageAt,
           (
             SELECT COUNT(*)
             FROM messages um
             WHERE um.fromUserId = u.id AND um.toUserId = ? AND um.seenAt IS NULL
           ) AS unreadCount
         FROM matches m
         JOIN users u ON (u.id = m.userA OR u.id = m.userB)
         LEFT JOIN profiles p ON p.userId = u.id
         LEFT JOIN messages lm ON lm.id = (
           SELECT m2.id
           FROM messages m2
           WHERE
             (m2.fromUserId = ? AND m2.toUserId = u.id) OR
             (m2.fromUserId = u.id AND m2.toUserId = ?)
           ORDER BY m2.id DESC
           LIMIT 1
         )
         WHERE (m.userA = ? OR m.userB = ?) AND u.id != ?
           AND u.id NOT IN (
             SELECT blockedUserId FROM user_blocks WHERE blockerUserId = ?
             UNION
             SELECT blockerUserId FROM user_blocks WHERE blockedUserId = ?
           )
         GROUP BY u.id
         ORDER BY COALESCE(lm.createdAt, m.createdAt) DESC`
      )
      .all(userId, userId, userId, userId, userId, userId, userId, userId);

    res.json(rows);
  } catch (err) {
    console.error("Conversations error:", err);
    res.status(500).json({ error: "Failed to load conversations" });
  }
});

router.get("/:otherUserId/messages", auth, (req: any, res) => {
  const userId = req.user.id;
  const otherUserId = Number(req.params.otherUserId);

  if (!Number.isInteger(otherUserId) || otherUserId <= 0 || otherUserId === userId) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  if (!areMatched(userId, otherUserId)) {
    return res.status(403).json({ error: "Only matches can chat" });
  }
  if (isBlocked(userId, otherUserId)) {
    return res.status(403).json({ error: "Chat unavailable" });
  }

  try {
    const rows = db
      .prepare(
        `SELECT id, fromUserId, toUserId, text, createdAt, seenAt, type
         FROM messages
         WHERE
           (fromUserId = ? AND toUserId = ?) OR
           (fromUserId = ? AND toUserId = ?)
         ORDER BY id ASC`
      )
      .all(userId, otherUserId, otherUserId, userId);

    db.prepare(
      `UPDATE messages
       SET seenAt = datetime('now')
       WHERE fromUserId = ? AND toUserId = ? AND seenAt IS NULL`
    ).run(otherUserId, userId);
    emitToUser(otherUserId, "chat:seen", { fromUserId: userId });

    res.json(rows);
  } catch (err) {
    console.error("Get messages error:", err);
    res.status(500).json({ error: "Failed to load messages" });
  }
});

router.post("/:otherUserId/messages", auth, (req: any, res) => {
  const userId = req.user.id;
  const otherUserId = Number(req.params.otherUserId);
  const text = String(req.body?.text ?? "").trim();
  const type = String(req.body?.type ?? "text").trim().toLowerCase();

  if (!Number.isInteger(otherUserId) || otherUserId <= 0 || otherUserId === userId) {
    return res.status(400).json({ error: "Invalid user id" });
  }
  if (!text) return res.status(400).json({ error: "Message text is required" });
  if (text.length > 1000) return res.status(400).json({ error: "Message too long" });
  if (!["text", "image"].includes(type)) return res.status(400).json({ error: "Invalid message type" });

  if (!areMatched(userId, otherUserId)) {
    return res.status(403).json({ error: "Only matches can chat" });
  }
  if (isBlocked(userId, otherUserId)) {
    return res.status(403).json({ error: "Chat unavailable" });
  }

  try {
    const result = db
      .prepare(
        `INSERT INTO messages (fromUserId, toUserId, text, type) VALUES (?, ?, ?, ?)`
      )
      .run(userId, otherUserId, text, type);

    const message = db
      .prepare(
        `SELECT id, fromUserId, toUserId, text, createdAt, seenAt, type
         FROM messages
         WHERE id = ?`
      )
      .get(result.lastInsertRowid);

    emitToUser(otherUserId, "chat:new-message", message);
    emitToUser(otherUserId, "notification:new-message", { userId, messageId: (message as any)?.id });

    res.status(201).json(message);
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

router.post("/upload", auth, chatUpload.single("image"), (req: any, res) => {
  if (!req.file) return res.status(400).json({ error: "No image uploaded" });
  const imageUrl = `${API_BASE}/uploads/${req.file.filename}`;
  return res.status(201).json({ imageUrl });
});

export default router;
