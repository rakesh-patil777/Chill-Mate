import { Router } from "express";
import db from "./db.js";
import { auth } from "./middleware.js";

const router = Router();

router.get("/overview", auth, (_req: any, res) => {
  try {
    const swipesToday = Number(
      (db.prepare("SELECT COUNT(*) as c FROM swipe_events WHERE date(createdAt) = date('now')").get() as { c: number }).c
    );
    const matchesToday = Number(
      (db.prepare("SELECT COUNT(*) as c FROM matches WHERE date(createdAt) = date('now')").get() as { c: number }).c
    );
    const activeUsers7d = Number(
      (
        db
          .prepare(
            `SELECT COUNT(DISTINCT userId) as c
             FROM swipe_events
             WHERE datetime(createdAt) >= datetime('now', '-7 days')`
          )
          .get() as { c: number }
      ).c
    );
    const usersToday = Number(
      (
        db
          .prepare(
            `SELECT COUNT(DISTINCT userId) as c
             FROM swipe_events
             WHERE date(createdAt) = date('now')`
          )
          .get() as { c: number }
      ).c
    );
    const usersPrev7d = Number(
      (
        db
          .prepare(
            `SELECT COUNT(DISTINCT userId) as c
             FROM swipe_events
             WHERE datetime(createdAt) >= datetime('now', '-14 days')
               AND datetime(createdAt) < datetime('now', '-7 days')`
          )
          .get() as { c: number }
      ).c
    );
    const retention7d = usersPrev7d > 0 ? Number(((activeUsers7d / usersPrev7d) * 100).toFixed(1)) : 0;

    res.json({
      swipesToday,
      matchesToday,
      activeUsers7d,
      retention7d,
      dailyActiveUsers: usersToday,
    });
  } catch (err) {
    console.error("Analytics overview error:", err);
    res.status(500).json({ error: "Failed to load analytics" });
  }
});

export default router;
