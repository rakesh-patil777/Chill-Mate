import { Router } from "express";
import db from "./db.js";
import { auth } from "./middleware.js";

const router = Router();

router.post("/report", auth, (req: any, res) => {
  const reporterUserId = req.user.id;
  const reportedUserId = Number(req.body?.reportedUserId);
  const reason = String(req.body?.reason ?? "").trim();

  if (!Number.isInteger(reportedUserId) || reportedUserId <= 0 || reportedUserId === reporterUserId) {
    return res.status(400).json({ error: "Invalid reported user" });
  }
  if (!reason) return res.status(400).json({ error: "Reason is required" });

  try {
    db.prepare(
      `INSERT INTO user_reports (reporterUserId, reportedUserId, reason)
       VALUES (?, ?, ?)`
    ).run(reporterUserId, reportedUserId, reason.slice(0, 1000));
    res.json({ ok: true });
  } catch (err) {
    console.error("Report user error:", err);
    res.status(500).json({ error: "Failed to submit report" });
  }
});

router.post("/block", auth, (req: any, res) => {
  const blockerUserId = req.user.id;
  const blockedUserId = Number(req.body?.blockedUserId);

  if (!Number.isInteger(blockedUserId) || blockedUserId <= 0 || blockedUserId === blockerUserId) {
    return res.status(400).json({ error: "Invalid blocked user" });
  }

  try {
    db.prepare(
      `INSERT OR IGNORE INTO user_blocks (blockerUserId, blockedUserId)
       VALUES (?, ?)`
    ).run(blockerUserId, blockedUserId);
    res.json({ ok: true });
  } catch (err) {
    console.error("Block user error:", err);
    res.status(500).json({ error: "Failed to block user" });
  }
});

router.get("/blocked", auth, (req: any, res) => {
  const userId = req.user.id;
  try {
    const rows = db
      .prepare(
        `SELECT b.blockedUserId AS userId, u.fullName, u.age
         FROM user_blocks b
         JOIN users u ON u.id = b.blockedUserId
         WHERE b.blockerUserId = ?
         ORDER BY b.createdAt DESC`
      )
      .all(userId);
    res.json(rows);
  } catch (err) {
    console.error("Blocked list error:", err);
    res.status(500).json({ error: "Failed to load blocked users" });
  }
});

export default router;
