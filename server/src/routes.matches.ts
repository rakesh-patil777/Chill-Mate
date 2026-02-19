import { Router } from "express";
import db from "./db.js";
import { auth } from "./middleware.js";

const router = Router();

router.post("/check", auth, (req: any, res) => {
  const userId = req.user.id;
  const targetUserId = Number(req.body?.targetUserId);
  if (!targetUserId) return res.status(400).json({ error: "targetUserId required" });
  try {
    const reverse = db.prepare(
      "SELECT 1 FROM likes WHERE fromUserId = ? AND toUserId = ? AND liked = 1"
    ).get(targetUserId, userId);
    if (!reverse) return res.json({ matched: false });
    const userA = Math.min(userId, targetUserId);
    const userB = Math.max(userId, targetUserId);
    db.prepare("INSERT OR IGNORE INTO matches (userA, userB) VALUES (?, ?)").run(userA, userB);
    return res.json({ matched: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/", auth, (req: any, res) => {
  const userId = req.user.id;
  try {
    const rows = db
      .prepare(
        `SELECT m.rowid as id, m.createdAt, u.id as userId, u.fullName, u.age, p.bio, p.avatarUrl
         FROM matches m
         JOIN users u ON (u.id = m.userA OR u.id = m.userB)
         LEFT JOIN profiles p ON u.id = p.userId
         WHERE (m.userA = ? OR m.userB = ?) AND u.id != ?
         AND u.id NOT IN (
           SELECT blockedUserId FROM user_blocks WHERE blockerUserId = ?
           UNION
           SELECT blockerUserId FROM user_blocks WHERE blockedUserId = ?
         )
         ORDER BY m.createdAt DESC`
      )
      .all(userId, userId, userId, userId, userId);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
