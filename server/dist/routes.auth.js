import { Router } from "express";
import db from "./db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createNotification } from "./notifications.utils.js";
import rateLimit from "express-rate-limit";
const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;
const COLLEGE_EMAIL_REGEX = /^[a-zA-Z]+\.[a-zA-Z0-9]+@presidencyuniversity\.in$/i;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=])[A-Za-z\d@$!%*?&#^()_\-+=]{8,}$/;
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
function toIsoDay(date = new Date()) {
    return date.toISOString().slice(0, 10);
}
function yesterdayIsoDay(todayIso) {
    const d = new Date(`${todayIso}T00:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    return toIsoDay(d);
}
/* REGISTER */
router.post("/register", registerLimiter, async (req, res) => {
    try {
        const { collegeId, password, fullName, age, gender, referrerId } = req.body;
        if (!collegeId || !password || !fullName || !age) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        if (!COLLEGE_EMAIL_REGEX.test(String(collegeId).trim())) {
            return res
                .status(400)
                .json({ error: "Only Presidency University email IDs are allowed." });
        }
        if (!STRONG_PASSWORD_REGEX.test(String(password))) {
            return res.status(400).json({
                error: "Password must be at least 8 chars and include uppercase, lowercase, number, and special character.",
            });
        }
        const exists = db
            .prepare("SELECT * FROM users WHERE collegeId = ?")
            .get(collegeId);
        if (exists) {
            return res.status(400).json({ error: "User already exists" });
        }
        const hashed = await bcrypt.hash(password, 10);
        const userCount = Number(db.prepare("SELECT COUNT(*) as c FROM users").get().c);
        const launchMode = String(db
            .prepare("SELECT value FROM app_config WHERE key = 'launchMode'")
            .get()?.value || "open");
        const parsedReferrerId = Number(referrerId);
        const hasValidReferrer = Number.isInteger(parsedReferrerId) && parsedReferrerId > 0;
        const registeringAsBootstrapAdmin = userCount === 0;
        if (launchMode === "closed" && !registeringAsBootstrapAdmin) {
            return res.status(403).json({ error: "Registrations are currently closed" });
        }
        if (launchMode === "invite-only" && !registeringAsBootstrapAdmin && !hasValidReferrer) {
            return res.status(403).json({ error: "Invite required to register right now" });
        }
        const isAdmin = userCount === 0 ? 1 : 0;
        const validReferrerId = Number.isInteger(parsedReferrerId) && parsedReferrerId > 0
            ? parsedReferrerId
            : null;
        if (validReferrerId !== null) {
            const referrerExists = db
                .prepare("SELECT id FROM users WHERE id = ?")
                .get(validReferrerId);
            if (!referrerExists) {
                return res.status(400).json({ error: "Invalid referrerId" });
            }
        }
        const insertUser = db
            .prepare(`INSERT INTO users (collegeId, password, fullName, age, gender, isAdmin, referredBy)
         VALUES (?, ?, ?, ?, ?, ?, ?)`)
            .run(collegeId, hashed, fullName, age, gender, isAdmin, validReferrerId);
        const userId = insertUser.lastInsertRowid;
        db.prepare(`INSERT INTO profiles (userId) VALUES (?)`).run(userId);
        if (validReferrerId !== null) {
            db.prepare(`UPDATE users
         SET inviteCount = inviteCount + 1,
             reputationBoost = reputationBoost + 1
         WHERE id = ?`).run(validReferrerId);
        }
        res.json({ ok: true });
    }
    catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ error: "Server error during registration" });
    }
});
/* LOGIN */
router.post("/login", loginLimiter, async (req, res) => {
    try {
        const { collegeId, password } = req.body;
        if (!COLLEGE_EMAIL_REGEX.test(String(collegeId).trim())) {
            return res
                .status(400)
                .json({ error: "Only Presidency University email IDs are allowed." });
        }
        const user = db
            .prepare("SELECT * FROM users WHERE collegeId = ?")
            .get(collegeId);
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
        const shouldWarn = String(user.lastActiveDate ?? "") === yesterday &&
            Number(user.swipeStreak ?? 0) > 0;
        if (shouldWarn) {
            const alreadyCreatedToday = db
                .prepare(`SELECT 1 FROM notifications
           WHERE userId = ? AND type = 'streak_warning' AND date(createdAt) = date('now')
           LIMIT 1`)
                .get(user.id);
            if (!alreadyCreatedToday) {
                createNotification({
                    userId: user.id,
                    type: "streak_warning",
                    title: "Don’t lose your streak 🔥",
                    message: "Swipe today to keep it alive.",
                    emit: false,
                });
            }
        }
        res.json({ token });
    }
    catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Server error during login" });
    }
});
export default router;
