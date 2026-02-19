import { Router } from "express";
import db from "./db.js";
import { auth, isPremium } from "./middleware.js";

const router = Router();
const FREE_DAILY_SWIPE_LIMIT = Number(process.env.FREE_DAILY_SWIPE_LIMIT || 20);

function getPremiumState(userId: number) {
  const row = db
    .prepare("SELECT premiumUntil, profileBoostUntil FROM users WHERE id = ?")
    .get(userId) as
    | { premiumUntil?: string | null; profileBoostUntil?: string | null }
    | undefined;
  const premiumUntil = row?.premiumUntil || null;
  const profileBoostUntil = row?.profileBoostUntil || null;
  const premium = isPremium({ premiumUntil });
  const boostRemainingSeconds = Number(
    (
      db
        .prepare(
          `SELECT
             CASE
               WHEN profileBoostUntil IS NOT NULL AND datetime(profileBoostUntil) > datetime('now')
               THEN CAST(strftime('%s', profileBoostUntil) - strftime('%s', 'now') AS INTEGER)
               ELSE 0
             END AS secs
           FROM users
           WHERE id = ?`
        )
        .get(userId) as { secs?: number }
    ).secs ?? 0
  );
  const isBoosted = boostRemainingSeconds > 0;
  return {
    premiumUntil,
    profileBoostUntil,
    isPremium: premium,
    isBoosted,
    boostRemainingSeconds: Math.max(0, boostRemainingSeconds),
  };
}

router.get("/status", auth, (req: any, res) => {
  const userId = req.user.id;
  try {
    const premium = getPremiumState(userId);
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
    res.json({
      ...premium,
      freeDailySwipeLimit: FREE_DAILY_SWIPE_LIMIT,
      remainingSwipes: premium.isPremium
        ? null
        : Math.max(0, FREE_DAILY_SWIPE_LIMIT - usedToday),
      canSeeLikesYouUnblurred: premium.isPremium,
      canBoost: premium.isPremium,
      unlimitedSwipes: premium.isPremium,
    });
  } catch (err) {
    console.error("Premium status error:", err);
    res.status(500).json({ error: "Failed to load premium status" });
  }
});

router.post("/test-activate", auth, (req: any, res) => {
  const userId = req.user.id;
  try {
    db.prepare(
      `UPDATE users
       SET premiumUntil = datetime('now', '+7 days')
       WHERE id = ?`
    ).run(userId);
    const updated = getPremiumState(userId);
    return res.json({ ok: true, premiumUntil: updated.premiumUntil, isPremium: updated.isPremium });
  } catch (err) {
    console.error("Test premium activation error:", err);
    return res.status(500).json({ error: "Failed to activate premium" });
  }
});

router.post("/boost", auth, (req: any, res) => {
  const userId = req.user.id;
  const premium = getPremiumState(userId);
  if (!premium.isPremium) {
    return res.status(403).json({ error: "Premium required" });
  }

  try {
    db.prepare(
      `UPDATE users
       SET profileBoostUntil = datetime('now', '+24 hours')
       WHERE id = ?`
    ).run(userId);
    const updated = getPremiumState(userId);
    return res.json({
      ok: true,
      profileBoostUntil: updated.profileBoostUntil,
      boostRemainingSeconds: updated.boostRemainingSeconds,
    });
  } catch (err) {
    console.error("Boost error:", err);
    return res.status(500).json({ error: "Failed to boost profile" });
  }
});

export default router;
