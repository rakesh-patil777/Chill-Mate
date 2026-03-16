import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import db from "./db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createNotification } from "./notifications.utils.js";
import rateLimit from "express-rate-limit";
import { body, validationResult } from "express-validator";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;
const COLLEGE_EMAIL_REGEX = /^[a-zA-Z]+\.[a-zA-Z0-9]+@presidencyuniversity\.in$/i;
const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=])[A-Za-z\d@$!%*?&#^()_\-+=]{8,}$/;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is required. Set it in your environment.");
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Try again later." },
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many registration attempts. Try again later." },
});

const registerValidation = [
  body("collegeId")
    .trim()
    .notEmpty()
    .withMessage("College email is required")
    .matches(COLLEGE_EMAIL_REGEX)
    .withMessage("Only Presidency University email IDs are allowed."),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .matches(STRONG_PASSWORD_REGEX)
    .withMessage(
      "Password must be at least 8 chars and include uppercase, lowercase, number, and special character."
    ),
  body("fullName").trim().notEmpty().withMessage("Full name is required"),
  body("age").notEmpty().withMessage("Age is required"),
];

const loginValidation = [
  body("collegeId")
    .trim()
    .notEmpty()
    .withMessage("College email is required")
    .matches(COLLEGE_EMAIL_REGEX)
    .withMessage("Only Presidency University email IDs are allowed."),
  body("password").notEmpty().withMessage("Password is required"),
];

function validateRequest(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0]?.msg || "Invalid request" });
  }
  next();
}

function toIsoDay(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function yesterdayIsoDay(todayIso: string) {
  const d = new Date(`${todayIso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return toIsoDay(d);
}

/* REGISTER */
router.post("/register", registerLimiter, registerValidation, validateRequest, async (req, res) => {
  try {
    const { collegeId, password, fullName, age, gender, referrerId } = req.body;
    const normalizedCollegeId = String(collegeId ?? "").trim().toLowerCase();

    if (!collegeId || !password || !fullName || !age) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (!COLLEGE_EMAIL_REGEX.test(normalizedCollegeId)) {
      return res
        .status(400)
        .json({ error: "Only Presidency University email IDs are allowed." });
    }
    if (!STRONG_PASSWORD_REGEX.test(String(password))) {
      return res.status(400).json({
        error:
          "Password must be at least 8 chars and include uppercase, lowercase, number, and special character.",
      });
    }

    const exists = db
      .prepare("SELECT * FROM users WHERE collegeId = ? COLLATE NOCASE")
      .get(normalizedCollegeId);

    if (exists) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const userCount = Number(
      (db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number }).c
    );
    const launchMode = String(
      (
        db
          .prepare("SELECT value FROM app_config WHERE key = 'launchMode'")
          .get() as { value?: string } | undefined
      )?.value || "open"
    );

    const parsedReferrerId = Number(referrerId);
    const hasValidReferrer =
      Number.isInteger(parsedReferrerId) && parsedReferrerId > 0;

    const registeringAsBootstrapAdmin = userCount === 0;
    if (launchMode === "closed" && !registeringAsBootstrapAdmin) {
      return res.status(403).json({ error: "Registrations are currently closed" });
    }
    if (launchMode === "invite-only" && !registeringAsBootstrapAdmin && !hasValidReferrer) {
      return res.status(403).json({ error: "Invite required to register right now" });
    }

    const isAdmin = userCount === 0 ? 1 : 0;
    const validReferrerId =
      Number.isInteger(parsedReferrerId) && parsedReferrerId > 0
        ? parsedReferrerId
        : null;
    if (validReferrerId !== null) {
      const referrerExists = db
        .prepare("SELECT id FROM users WHERE id = ?")
        .get(validReferrerId) as { id: number } | undefined;
      if (!referrerExists) {
        return res.status(400).json({ error: "Invalid referrerId" });
      }
    }

    const insertUser = db
      .prepare(
        `INSERT INTO users (collegeId, password, fullName, age, gender, isAdmin, referredBy)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(normalizedCollegeId, hashed, fullName, age, gender, isAdmin, validReferrerId);

    const userId = insertUser.lastInsertRowid;

    db.prepare(
      `INSERT INTO profiles (userId) VALUES (?)`
    ).run(userId);

    if (validReferrerId !== null) {
      db.prepare(
        `UPDATE users
         SET inviteCount = inviteCount + 1,
             reputationBoost = reputationBoost + 1
         WHERE id = ?`
      ).run(validReferrerId);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Server error during registration" });
  }
});

/* LOGIN */
router.post("/login", loginLimiter, loginValidation, validateRequest, async (req, res) => {
  try {
    const { collegeId, password } = req.body;
    const normalizedCollegeId = String(collegeId ?? "").trim().toLowerCase();
    if (!COLLEGE_EMAIL_REGEX.test(normalizedCollegeId)) {
      return res
        .status(400)
        .json({ error: "Only Presidency University email IDs are allowed." });
    }

    const user = db
      .prepare("SELECT * FROM users WHERE collegeId = ? COLLATE NOCASE")
      .get(normalizedCollegeId);

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({ error: "Wrong password" });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });

    const today = toIsoDay();
    const yesterday = yesterdayIsoDay(today);
    const shouldWarn =
      String((user as any).lastActiveDate ?? "") === yesterday &&
      Number((user as any).swipeStreak ?? 0) > 0;
    if (shouldWarn) {
      const alreadyCreatedToday = db
        .prepare(
          `SELECT 1 FROM notifications
           WHERE userId = ? AND type = 'streak_warning' AND date(createdAt) = date('now')
           LIMIT 1`
        )
        .get((user as any).id);
      if (!alreadyCreatedToday) {
        createNotification({
          userId: (user as any).id,
          type: "streak_warning",
          title: "Don’t lose your streak 🔥",
          message: "Swipe today to keep it alive.",
          emit: false,
        });
      }
    }

    res.json({ token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error during login" });
  }
});

export default router;
