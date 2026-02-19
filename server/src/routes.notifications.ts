import { Router } from "express";
import db from "./db.js";
import { auth } from "./middleware.js";

const router = Router();

type NotificationRow = {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  referenceId?: number | null;
  isRead: number;
  createdAt: string;
};

router.get("/", auth, (req: any, res) => {
  const userId = req.user.id;

  try {
    const rows = db
      .prepare(
        `SELECT id, userId, type, title, message, referenceId, isRead, createdAt
         FROM notifications
         WHERE userId = ?
         ORDER BY datetime(createdAt) DESC, id DESC`
      )
      .all(userId) as NotificationRow[];

    res.json(
      rows.map((row) => ({
        ...row,
        isRead: Boolean(row.isRead),
      }))
    );
  } catch (err) {
    console.error("Notifications list error:", err);
    res.status(500).json({ error: "Failed to load notifications" });
  }
});

router.get("/summary", auth, (req: any, res) => {
  const userId = req.user.id;

  try {
    db.prepare(
      `INSERT OR IGNORE INTO notification_reads (userId, lastSeenAt)
       VALUES (?, '1970-01-01 00:00:00')`
    ).run(userId);

    const unreadByType = db
      .prepare(
        `SELECT type, COUNT(*) AS c
         FROM notifications
         WHERE userId = ? AND isRead = 0
         GROUP BY type`
      )
      .all(userId) as Array<{ type: string; c: number }>;

    const unreadLikeCount = Number(
      unreadByType.find((r) => r.type === "like")?.c ?? 0
    );
    const unreadMatchCount = Number(
      unreadByType.find((r) => r.type === "match")?.c ?? 0
    );
    const unreadCampusCount = Number(
      unreadByType
        .filter((r) => r.type === "plan_join" || r.type === "plan_near_full")
        .reduce((sum, item) => sum + Number(item.c || 0), 0)
    );
    const unreadActivityCount = Number(
      unreadByType
        .filter((r) => r.type === "streak_warning")
        .reduce((sum, item) => sum + Number(item.c || 0), 0)
    );

    const datingMessageCount = Number(
      (
        db
          .prepare(
            `SELECT COUNT(*) AS c
             FROM messages
             WHERE toUserId = ? AND seenAt IS NULL AND planId IS NULL`
          )
          .get(userId) as { c: number }
      ).c
    );

    const campusMessageCount = Number(
      (
        db
          .prepare(
            `SELECT COUNT(*) AS c
             FROM messages m
             WHERE m.planId IS NOT NULL
               AND m.fromUserId != ?
               AND m.createdAt > COALESCE((SELECT lastSeenAt FROM notification_reads WHERE userId = ?), '1970-01-01 00:00:00')
               AND EXISTS (
                 SELECT 1
                 FROM plan_attendees pa
                 WHERE pa.planId = m.planId AND pa.userId = ?
               )`
          )
          .get(userId, userId, userId) as { c: number }
      ).c
    );

    const newMessageCount = datingMessageCount + campusMessageCount;
    const notificationCount =
      unreadLikeCount + unreadMatchCount + unreadCampusCount + unreadActivityCount;

    res.json({
      newMatchCount: unreadMatchCount,
      likesYouCount: unreadLikeCount,
      datingMessageCount,
      campusMessageCount,
      campusNotificationCount: unreadCampusCount,
      activityNotificationCount: unreadActivityCount,
      newMessageCount,
      total: notificationCount + newMessageCount,
    });
  } catch (err) {
    console.error("Notification summary error:", err);
    res.status(500).json({ error: "Failed to load notifications" });
  }
});

router.post("/read", auth, (req: any, res) => {
  const userId = req.user.id;

  try {
    db.prepare(
      `UPDATE messages
       SET seenAt = datetime('now')
       WHERE toUserId = ? AND seenAt IS NULL AND planId IS NULL`
    ).run(userId);

    db.prepare(
      `UPDATE notifications
       SET isRead = 1
       WHERE userId = ? AND isRead = 0`
    ).run(userId);

    db.prepare(
      `INSERT INTO notification_reads (userId, lastSeenAt)
       VALUES (?, datetime('now'))
       ON CONFLICT(userId) DO UPDATE SET lastSeenAt = datetime('now')`
    ).run(userId);

    res.json({ ok: true });
  } catch (err) {
    console.error("Notification read error:", err);
    res.status(500).json({ error: "Failed to mark notifications read" });
  }
});

export default router;
