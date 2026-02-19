import { Router } from "express";
import db from "./db.js";
import { auth, isPremium } from "./middleware.js";
import { emitToUser } from "./socket.js";
import { createNotification } from "./notifications.utils.js";

const router = Router();
const FREE_DAILY_SWIPE_LIMIT = Number(process.env.FREE_DAILY_SWIPE_LIMIT || 20);

function toIsoDay(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function yesterdayIsoDay(todayIso: string) {
  const d = new Date(`${todayIso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return toIsoDay(d);
}

function updateSwipeStreak(userId: number) {
  const user = db
    .prepare("SELECT lastActiveDate, swipeStreak FROM users WHERE id = ?")
    .get(userId) as { lastActiveDate?: string | null; swipeStreak?: number } | undefined;
  if (!user) return;

  const today = toIsoDay();
  const yesterday = yesterdayIsoDay(today);
  let next = 1;

  if (user.lastActiveDate === today) {
    next = Number(user.swipeStreak ?? 0);
  } else if (user.lastActiveDate === yesterday) {
    next = Number(user.swipeStreak ?? 0) + 1;
  }

  db.prepare(
    `UPDATE users
     SET swipeStreak = ?, lastActiveDate = ?
     WHERE id = ?`
  ).run(next, today, userId);
}

function getUserPremiumRow(userId: number) {
  return db
    .prepare("SELECT premiumUntil FROM users WHERE id = ?")
    .get(userId) as { premiumUntil?: string | null } | undefined;
}

function getLikesYouHandler(req: any, res: any) {
  const userId = req.user.id;
  const premium = isPremium(getUserPremiumRow(userId));

  try {
    const rows = db
      .prepare(
        `SELECT
           l.fromUserId AS userId,
           u.fullName,
           u.age,
           p.bio,
           p.avatarUrl,
           l.reaction,
           l.createdAt
         FROM likes l
         JOIN users u ON u.id = l.fromUserId
         LEFT JOIN profiles p ON p.userId = u.id
         WHERE l.toUserId = ? AND l.liked = 1
           AND l.fromUserId NOT IN (
             SELECT blockedUserId FROM user_blocks WHERE blockerUserId = ?
             UNION
             SELECT blockerUserId FROM user_blocks WHERE blockedUserId = ?
           )
         ORDER BY l.createdAt DESC`
      )
      .all(userId, userId, userId);

    return res.json(
      rows.map((row: any) =>
        premium
          ? { ...row, isBlurred: false, canReveal: true }
          : {
              ...row,
              fullName: "Hidden",
              avatarUrl: row.avatarUrl || "/default-avatar.png",
              isBlurred: true,
              canReveal: false,
            }
      )
    );
  } catch (err) {
    console.error("Received likes error:", err);
    return res.status(500).json({ error: "Failed to load likes" });
  }
}

router.get("/received", auth, getLikesYouHandler);
router.get("/likes-you", auth, getLikesYouHandler);
router.get("/", auth, getLikesYouHandler);

router.post("/", auth, (req: any, res) => {
  const userId = req.user.id;
  const { targetUserId, liked, reaction: rawReaction } = req.body;

  const reaction =
    typeof rawReaction === "string"
      ? rawReaction
      : typeof liked === "boolean"
      ? liked
        ? "like"
        : "dislike"
      : undefined;

  if (
    targetUserId == null ||
    !reaction ||
    !["like", "dislike", "superlike"].includes(reaction)
  ) {
    return res
      .status(400)
      .json({ error: "targetUserId and valid reaction required" });
  }

  const toId = Number(targetUserId);
  if (!Number.isInteger(toId) || toId === userId) {
    return res.status(400).json({ error: "Invalid targetUserId" });
  }

  try {
    const blocked = db
      .prepare(
        `SELECT 1
         FROM user_blocks
         WHERE (blockerUserId = ? AND blockedUserId = ?)
            OR (blockerUserId = ? AND blockedUserId = ?)`
      )
      .get(userId, toId, toId, userId);
    if (blocked) {
      return res.status(403).json({ error: "User is unavailable" });
    }

    const premium = isPremium(getUserPremiumRow(userId));
    let remainingSwipes: number | null = null;

    if (!premium) {
      const usedToday = Number(
        (
          db
            .prepare(
              `SELECT COUNT(*) as c
               FROM swipe_events
               WHERE userId = ? AND date(createdAt) = date('now')`
            )
            .get(userId) as { c: number }
        ).c
      );
      if (usedToday >= FREE_DAILY_SWIPE_LIMIT) {
        return res.status(429).json({
          error: "Daily swipe limit reached",
          code: "SWIPE_LIMIT",
          remainingSwipes: 0,
        });
      }
      remainingSwipes = Math.max(0, FREE_DAILY_SWIPE_LIMIT - usedToday - 1);
    }

    const likedValue = reaction === "dislike" ? 0 : 1;

    // Upsert like (prevent duplicate: one row per fromUserId + toUserId)
    db.prepare(
      `INSERT INTO likes (fromUserId, toUserId, liked, reaction) VALUES (?, ?, ?, ?)
       ON CONFLICT(fromUserId, toUserId) DO UPDATE
       SET liked = excluded.liked, reaction = excluded.reaction`
    ).run(userId, toId, likedValue, reaction);
    db.prepare(
      `INSERT INTO swipe_events (userId, targetUserId, reaction) VALUES (?, ?, ?)`
    ).run(userId, toId, reaction);
    updateSwipeStreak(userId);

    let isMatch = false;

    if (likedValue === 1) {
      const reverse = db
        .prepare(
          `SELECT 1 FROM likes WHERE fromUserId = ? AND toUserId = ? AND liked = 1`
        )
        .get(toId, userId);

      if (reverse) {
        isMatch = true;
        const userA = Math.min(userId, toId);
        const userB = Math.max(userId, toId);
        db.prepare(
          `INSERT OR IGNORE INTO matches (userA, userB) VALUES (?, ?)`
        ).run(userA, userB);
        createNotification({
          userId: toId,
          type: "match",
          title: "It's a Match! 🎉",
          message: "Start chatting now.",
          referenceId: userId,
        });
        createNotification({
          userId,
          type: "match",
          title: "It's a Match! 🎉",
          message: "Start chatting now.",
          referenceId: toId,
        });
        emitToUser(toId, "notification:new-match", { userId });
        emitToUser(userId, "notification:new-match", { userId: toId });
      }
    }

    if (likedValue === 1) {
      createNotification({
        userId: toId,
        type: "like",
        title: "Someone liked you 💖",
        message: "Open Likes to see who.",
        referenceId: userId,
      });
      emitToUser(toId, "notification:new-like", { userId, reaction });
    }

    res.json({
      success: true,
      match: isMatch,
      reaction,
      remainingSwipes,
      premium,
      freeDailyLimit: FREE_DAILY_SWIPE_LIMIT,
    });
  } catch (err) {
    console.error("Like error:", err);
    res.status(500).json({ error: "Failed to save like" });
  }
});

export default router;
