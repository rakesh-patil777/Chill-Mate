import { Router } from "express";
import db from "./db.js";
import { auth, requireAdmin } from "./middleware.js";
import fs from "fs";
import path from "path";

const router = Router();
const BACKUP_DIR = process.env.BACKUP_DIR || "/backups";

router.use(auth, requireAdmin);

router.patch("/make-admin/:userId", (req, res) => {
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ error: "Invalid user id" });
  }
  try {
    const existing = db
      .prepare("SELECT id, isAdmin FROM users WHERE id = ?")
      .get(userId) as { id: number; isAdmin?: number } | undefined;
    if (!existing) {
      return res.status(404).json({ error: "User not found" });
    }
    db.prepare("UPDATE users SET isAdmin = 1 WHERE id = ?").run(userId);
    return res.json({ ok: true, userId, isAdmin: true });
  } catch (err) {
    console.error("Admin make-admin error:", err);
    return res.status(500).json({ error: "Failed to update admin status" });
  }
});

router.get("/backup", async (_req, res) => {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      return res.status(404).json({ error: "Backup directory not found" });
    }

    const files = await fs.promises.readdir(BACKUP_DIR);
    const backupFiles = files
      .filter((file) => file.startsWith("chillmate-") && file.endsWith(".db"))
      .map((file) => path.join(BACKUP_DIR, file));

    if (backupFiles.length === 0) {
      return res.status(404).json({ error: "No backup files found" });
    }

    const statPairs = await Promise.all(
      backupFiles.map(async (file) => ({
        file,
        stat: await fs.promises.stat(file),
      }))
    );

    statPairs.sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);
    const latestBackup = statPairs[0]?.file;
    if (!latestBackup) {
      return res.status(404).json({ error: "No backup files found" });
    }

    return res.download(latestBackup, path.basename(latestBackup));
  } catch (err) {
    console.error("Admin backup download error:", err);
    return res.status(500).json({ error: "Failed to download backup" });
  }
});

router.get("/stats", (_req, res) => {
  try {
    const totalUsers = Number((db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number }).c);
    const totalMatches = Number((db.prepare("SELECT COUNT(*) as c FROM matches").get() as { c: number }).c);
    const reportsOpen = Number(
      (db.prepare("SELECT COUNT(*) as c FROM user_reports WHERE status = 'open'").get() as { c: number }).c
    );
    const swipesToday = Number(
      (db.prepare("SELECT COUNT(*) as c FROM swipe_events WHERE date(createdAt) = date('now')").get() as { c: number }).c
    );
    res.json({ totalUsers, totalMatches, reportsOpen, swipesToday });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ error: "Failed to load stats" });
  }
});

router.get("/users", (_req, res) => {
  try {
    const users = db
      .prepare(
        `SELECT u.id, u.collegeId, u.fullName, u.age, u.gender, u.isAdmin, u.premiumUntil, u.createdAt,
                p.branch, p.year
         FROM users u
         LEFT JOIN profiles p ON p.userId = u.id
         ORDER BY u.id DESC`
      )
      .all();
    res.json(users);
  } catch (err) {
    console.error("Admin users error:", err);
    res.status(500).json({ error: "Failed to load users" });
  }
});

router.get("/feedback", (req, res) => {
  try {
    const q = String(req.query?.q || "").trim().toLowerCase();
    const status = String(req.query?.status || "").trim().toLowerCase();
    const category = String(req.query?.category || "").trim().toLowerCase();
    const rating = Number(req.query?.rating || 0);

    const where: string[] = [];
    const args: any[] = [];

    if (status && ["new", "reviewed", "closed"].includes(status)) {
      where.push("LOWER(f.status) = ?");
      args.push(status);
    }
    if (category && ["bug", "feature", "ui", "performance", "other"].includes(category)) {
      where.push("LOWER(f.category) = ?");
      args.push(category);
    }
    if (Number.isInteger(rating) && rating >= 1 && rating <= 5) {
      where.push("f.rating = ?");
      args.push(rating);
    }
    if (q) {
      where.push(
        "(LOWER(f.fullName) LIKE ? OR LOWER(f.email) LIKE ? OR LOWER(f.subject) LIKE ? OR LOWER(f.message) LIKE ? OR LOWER(u.collegeId) LIKE ?)"
      );
      const like = `%${q}%`;
      args.push(like, like, like, like, like);
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
    const feedback = db
      .prepare(
        `SELECT f.id, f.userId, f.fullName, f.email, f.category, f.rating, f.status, f.subject, f.message, f.createdAt,
                u.collegeId, u.age, u.gender,
                p.branch, p.year
         FROM feedback_submissions f
         JOIN users u ON u.id = f.userId
         LEFT JOIN profiles p ON p.userId = f.userId
         ${whereSql}
         ORDER BY f.createdAt DESC`
      )
      .all(...args);
    res.json(feedback);
  } catch (err) {
    console.error("Admin feedback error:", err);
    res.status(500).json({ error: "Failed to load feedback" });
  }
});

router.patch("/feedback/:id/status", (req, res) => {
  const feedbackId = Number(req.params.id);
  const status = String(req.body?.status || "").trim().toLowerCase();
  if (!Number.isInteger(feedbackId) || feedbackId <= 0) {
    return res.status(400).json({ error: "Invalid feedback id" });
  }
  if (!["new", "reviewed", "closed"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  try {
    const existing = db
      .prepare("SELECT id FROM feedback_submissions WHERE id = ?")
      .get(feedbackId) as { id: number } | undefined;
    if (!existing) return res.status(404).json({ error: "Feedback not found" });

    db.prepare("UPDATE feedback_submissions SET status = ? WHERE id = ?").run(status, feedbackId);
    res.json({ ok: true, id: feedbackId, status });
  } catch (err) {
    console.error("Admin feedback status error:", err);
    res.status(500).json({ error: "Failed to update feedback status" });
  }
});

router.delete("/users/:id", (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ error: "Invalid user id" });
  }
  try {
    db.prepare("DELETE FROM users WHERE id = ?").run(userId);
    res.json({ ok: true });
  } catch (err) {
    console.error("Admin delete user error:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

router.get("/reports", (_req, res) => {
  try {
    const reports = db
      .prepare(
        `SELECT r.id, r.reason, r.status, r.createdAt,
                ru.fullName as reporterName,
                tu.fullName as reportedName,
                r.reporterUserId, r.reportedUserId
         FROM user_reports r
         JOIN users ru ON ru.id = r.reporterUserId
         JOIN users tu ON tu.id = r.reportedUserId
         ORDER BY r.createdAt DESC`
      )
      .all();
    res.json(reports);
  } catch (err) {
    console.error("Admin reports error:", err);
    res.status(500).json({ error: "Failed to load reports" });
  }
});

router.post("/reports/:id/status", (req, res) => {
  const reportId = Number(req.params.id);
  const status = String(req.body?.status || "").trim();
  if (!Number.isInteger(reportId) || reportId <= 0) {
    return res.status(400).json({ error: "Invalid report id" });
  }
  if (!["open", "reviewed", "closed"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  try {
    db.prepare("UPDATE user_reports SET status = ? WHERE id = ?").run(status, reportId);
    res.json({ ok: true });
  } catch (err) {
    console.error("Admin report status error:", err);
    res.status(500).json({ error: "Failed to update report status" });
  }
});

router.patch("/config", (req, res) => {
  const launchMode = String(req.body?.launchMode || "").trim();
  if (!["open", "invite-only", "closed"].includes(launchMode)) {
    return res.status(400).json({ error: "Invalid launchMode" });
  }

  try {
    db.prepare(
      `INSERT INTO app_config (key, value)
       VALUES ('launchMode', ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    ).run(launchMode);

    const currentUserCount = Number(
      (db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number }).c
    );
    const thresholdRow = db
      .prepare("SELECT value FROM app_config WHERE key = 'campusUnlockThreshold'")
      .get() as { value?: string } | undefined;

    res.json({
      launchMode,
      currentUserCount,
      campusUnlockThreshold: Number(thresholdRow?.value || 100),
    });
  } catch (err) {
    console.error("Admin config update error:", err);
    res.status(500).json({ error: "Failed to update config" });
  }
});

export default router;
