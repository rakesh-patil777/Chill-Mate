import { Router } from "express";
import db from "./db.js";
import { auth } from "./middleware.js";

const router = Router();

type FeedbackCategory = "bug" | "feature" | "ui" | "performance" | "other";
const ALLOWED_CATEGORIES = new Set<FeedbackCategory>([
  "bug",
  "feature",
  "ui",
  "performance",
  "other",
]);

router.post("/", auth, (req: any, res) => {
  try {
    const userId = Number(req.user?.id);
    const fullName = String(req.body?.fullName || "").trim();
    const email = String(req.body?.email || "").trim();
    const category = String(req.body?.category || "").trim() as FeedbackCategory;
    const rating = Number(req.body?.rating || 0);
    const subject = String(req.body?.subject || "").trim();
    const message = String(req.body?.message || "").trim();

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!fullName || !email || !subject || !message) {
      return res.status(400).json({ error: "Missing required feedback fields" });
    }
    if (!ALLOWED_CATEGORIES.has(category)) {
      return res.status(400).json({ error: "Invalid feedback category" });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    db.prepare(
      `INSERT INTO feedback_submissions
       (userId, fullName, email, category, rating, subject, message)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(userId, fullName, email, category, rating, subject, message);

    return res.json({ ok: true });
  } catch (err) {
    console.error("Feedback submit error:", err);
    return res.status(500).json({ error: "Failed to submit feedback" });
  }
});

export default router;
