import { Router } from "express";
import db from "./db.js";
import { auth } from "./middleware.js";

const router = Router();

function tierFromScore(score: number) {
  if (score >= 500) return "Campus Icon";
  if (score >= 250) return "Influencer";
  if (score >= 120) return "Connector";
  if (score >= 50) return "Explorer";
  return "Freshman";
}

router.get("/", auth, (_req, res) => {
  try {
    const topHosts = db
      .prepare(
        `SELECT
          u.id,
          u.fullName,
          p.avatarUrl,
          u.plansHosted,
          COALESCE(AVG(hr.rating), 0) AS avgHostRating
        FROM users u
        LEFT JOIN profiles p ON p.userId = u.id
        LEFT JOIN host_ratings hr ON hr.hostUserId = u.id
        GROUP BY u.id, u.fullName, p.avatarUrl, u.plansHosted
        ORDER BY u.plansHosted DESC, avgHostRating DESC, u.id ASC
        LIMIT 10`
      )
      .all();

    const mostReliable = db
      .prepare(
        `SELECT
          u.id,
          u.fullName,
          p.avatarUrl,
          COUNT(pa.planId) AS plansJoined,
          SUM(CASE WHEN pa.attended = 1 THEN 1 ELSE 0 END) AS plansAttended,
          CASE
            WHEN COUNT(pa.planId) = 0 THEN 0
            ELSE ROUND(
              (SUM(CASE WHEN pa.attended = 1 THEN 1 ELSE 0 END) * 100.0) / COUNT(pa.planId),
              0
            )
          END AS reliabilityScore
        FROM users u
        LEFT JOIN profiles p ON p.userId = u.id
        LEFT JOIN plan_attendees pa ON pa.userId = u.id
        GROUP BY u.id, u.fullName, p.avatarUrl
        HAVING COUNT(pa.planId) > 0
        ORDER BY reliabilityScore DESC, plansAttended DESC, plansJoined DESC, u.id ASC
        LIMIT 10`
      )
      .all();

    const mostActive = db
      .prepare(
        `SELECT
          u.id,
          u.fullName,
          p.avatarUrl,
          COUNT(pa.planId) AS plansJoined,
          u.plansHosted,
          u.inviteCount,
          (COUNT(pa.planId) + u.plansHosted + u.inviteCount) AS activityScore
        FROM users u
        LEFT JOIN profiles p ON p.userId = u.id
        LEFT JOIN plan_attendees pa ON pa.userId = u.id
        GROUP BY u.id, u.fullName, p.avatarUrl, u.plansHosted, u.inviteCount
        ORDER BY activityScore DESC, u.plansHosted DESC, plansJoined DESC, u.id ASC
        LIMIT 10`
      )
      .all();

    const highestStreak = db
      .prepare(
        `SELECT
          u.id,
          u.fullName,
          p.avatarUrl,
          COALESCE(u.swipeStreak, 0) AS swipeStreak,
          COALESCE(u.campusStreak, 0) AS campusStreak,
          CASE
            WHEN COALESCE(u.swipeStreak, 0) >= COALESCE(u.campusStreak, 0)
            THEN COALESCE(u.swipeStreak, 0)
            ELSE COALESCE(u.campusStreak, 0)
          END AS highestStreak
        FROM users u
        LEFT JOIN profiles p ON p.userId = u.id
        ORDER BY highestStreak DESC, swipeStreak DESC, campusStreak DESC, u.id ASC
        LIMIT 10`
      )
      .all();

    const topCampusIcons = db
      .prepare(
        `SELECT
          u.id,
          u.fullName,
          p.avatarUrl,
          u.plansHosted,
          u.inviteCount,
          u.swipeStreak,
          u.campusStreak,
          u.reputationBoost,
          SUM(CASE WHEN pa.attended = 1 THEN 1 ELSE 0 END) AS plansAttended,
          COALESCE(AVG(hr.rating), 0) AS avgHostRating,
          (
            (u.plansHosted * 5) +
            (SUM(CASE WHEN pa.attended = 1 THEN 1 ELSE 0 END) * 3) +
            (u.inviteCount * 4) +
            (u.swipeStreak * 2) +
            (u.campusStreak * 3) +
            (COALESCE(AVG(hr.rating), 0) * 5) +
            u.reputationBoost
          ) AS campusScore
        FROM users u
        LEFT JOIN profiles p ON p.userId = u.id
        LEFT JOIN plan_attendees pa ON pa.userId = u.id
        LEFT JOIN host_ratings hr ON hr.hostUserId = u.id
        GROUP BY
          u.id, u.fullName, p.avatarUrl,
          u.plansHosted, u.inviteCount, u.swipeStreak, u.campusStreak, u.reputationBoost
        ORDER BY campusScore DESC, u.id ASC
        LIMIT 10`
      )
      .all()
      .map((row: any) => {
        const campusScore = Math.max(0, Math.round(Number(row.campusScore ?? 0)));
        return {
          ...row,
          campusScore,
          campusTier: tierFromScore(campusScore),
        };
      });

    return res.json({ topHosts, mostReliable, mostActive, highestStreak, topCampusIcons });
  } catch (err) {
    console.error("Leaderboard error:", err);
    return res.status(500).json({ error: "Failed to load leaderboard" });
  }
});

export default router;
