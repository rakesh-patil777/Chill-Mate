import { Router } from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { fileURLToPath } from "url";
import db from "./db.js";
import { auth } from "./middleware.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "..", "public", "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req: any, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const uniqueName = `${req.user.id}-${Date.now()}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

const API_BASE = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 4000}`;

const router = Router();

function parsePhotos(raw?: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => typeof item === "string" && item.trim().length > 0);
  } catch {
    return [];
  }
}

function getReputationStats(userId: number) {
  const plansJoined = Number(
    (
      db
        .prepare("SELECT COUNT(*) AS c FROM plan_attendees WHERE userId = ?")
        .get(userId) as { c: number }
    ).c
  );
  const plansAttended = Number(
    (
      db
        .prepare("SELECT COUNT(*) AS c FROM plan_attendees WHERE userId = ? AND attended = 1")
        .get(userId) as { c: number }
    ).c
  );
  const noShows = Math.max(0, plansJoined - plansAttended);
  const reliabilityScore =
    plansJoined > 0 ? Math.round((plansAttended / plansJoined) * 100) : 0;
  const avgHostRatingRaw = db
    .prepare("SELECT AVG(rating) AS avgRating FROM host_ratings WHERE hostUserId = ?")
    .get(userId) as { avgRating?: number | null };

  return {
    plansJoined,
    plansAttended,
    noShows,
    reliabilityScore,
    avgHostRating:
      typeof avgHostRatingRaw.avgRating === "number"
        ? Number(avgHostRatingRaw.avgRating.toFixed(2))
        : null,
  };
}

type CampusLevel = {
  campusScore: number;
  campusTier: "Freshman" | "Explorer" | "Connector" | "Influencer" | "Campus Icon";
};

function getCampusLevel(input: {
  plansHosted?: number;
  plansAttended?: number;
  inviteCount?: number;
  swipeStreak?: number;
  campusStreak?: number;
  avgHostRating?: number | null;
  reputationBoost?: number;
}): CampusLevel {
  const scoreRaw =
    Number(input.plansHosted ?? 0) * 5 +
    Number(input.plansAttended ?? 0) * 3 +
    Number(input.inviteCount ?? 0) * 4 +
    Number(input.swipeStreak ?? 0) * 2 +
    Number(input.campusStreak ?? 0) * 3 +
    Number(input.avgHostRating ?? 0) * 5 +
    Number(input.reputationBoost ?? 0);
  const campusScore = Math.max(0, Math.round(scoreRaw));

  let campusTier: CampusLevel["campusTier"] = "Freshman";
  if (campusScore >= 500) campusTier = "Campus Icon";
  else if (campusScore >= 250) campusTier = "Influencer";
  else if (campusScore >= 120) campusTier = "Connector";
  else if (campusScore >= 50) campusTier = "Explorer";

  return { campusScore, campusTier };
}

// GET /profiles/discover — exclude self and already swiped
router.get("/discover", auth, (req: any, res) => {
  const userId = req.user.id;
  const minAge = Number(req.query?.minAge || 0);
  const maxAge = Number(req.query?.maxAge || 0);
  const interests = String(req.query?.interests || "").trim().toLowerCase();
  const gender = String(req.query?.gender || "").trim().toLowerCase();
  const branch = String(req.query?.branch || "").trim().toLowerCase();
  const year = Number(req.query?.year || 0);

  const where: string[] = [
    "u.id != ?",
    "u.id NOT IN (SELECT toUserId FROM likes WHERE fromUserId = ?)",
    `u.id NOT IN (
       SELECT blockedUserId FROM user_blocks WHERE blockerUserId = ?
       UNION
       SELECT blockerUserId FROM user_blocks WHERE blockedUserId = ?
     )`,
  ];
  const args: any[] = [userId, userId, userId, userId];

  if (Number.isInteger(minAge) && minAge > 0) {
    where.push("u.age >= ?");
    args.push(minAge);
  }
  if (Number.isInteger(maxAge) && maxAge > 0) {
    where.push("u.age <= ?");
    args.push(maxAge);
  }
  if (interests) {
    where.push("LOWER(COALESCE(p.interests, '')) LIKE ?");
    args.push(`%${interests}%`);
  }
  if (gender && gender !== "all") {
    where.push("LOWER(COALESCE(u.gender, '')) = ?");
    args.push(gender);
  }
  if (branch) {
    where.push("LOWER(COALESCE(p.branch, '')) = ?");
    args.push(branch);
  }
  if (Number.isInteger(year) && year > 0) {
    where.push("p.year = ?");
    args.push(year);
  }

  try {
    const list = db
      .prepare(
        `SELECT u.id, u.fullName, u.age, u.gender, p.bio, p.hobbies, p.interests, p.branch, p.year, p.avatarUrl
                , u.swipeStreak
         FROM users u
         LEFT JOIN profiles p ON u.id = p.userId
         WHERE ${where.join(" AND ")}
         ORDER BY
           CASE
             WHEN u.profileBoostUntil IS NOT NULL
              AND datetime(u.profileBoostUntil) > datetime('now')
             THEN 1 ELSE 0
           END DESC,
           COALESCE(u.reputationBoost, 0) DESC,
           u.id ASC`
      )
      .all(...args);
    res.json(list);
  } catch (err) {
    console.error("Discover error:", err);
    res.status(500).json({ error: "Failed to load profiles" });
  }
});

// GET /profiles/me
router.get("/me", auth, (req: any, res) => {
  const userId = req.user.id;
  try {
    const user = db
      .prepare(
        "SELECT id, collegeId, fullName, age, gender, isAdmin, premiumUntil, profileBoostUntil, inviteCount, plansHosted, reputationBoost, swipeStreak, campusStreak FROM users WHERE id = ?"
      )
      .get(userId) as
      | {
          id: number;
          collegeId: string;
          fullName: string;
          age: number;
          gender?: string | null;
          isAdmin?: number;
          premiumUntil?: string | null;
          profileBoostUntil?: string | null;
          inviteCount?: number;
          plansHosted?: number;
          reputationBoost?: number;
          swipeStreak?: number;
          campusStreak?: number;
        }
      | undefined;
    if (!user) return res.status(404).json({ error: "User not found" });
    const profile = db
      .prepare("SELECT bio, hobbies, interests, branch, year, avatarUrl, photos FROM profiles WHERE userId = ?")
      .get(userId) as
      | {
          bio?: string | null;
          hobbies?: string | null;
          interests?: string | null;
          branch?: string | null;
          year?: number | null;
          avatarUrl?: string | null;
          photos?: string | null;
        }
      | undefined;

    const completionParts = [
      Boolean(user.fullName?.trim()),
      Boolean(user.age && user.age >= 18),
      Boolean(user.gender?.trim()),
      Boolean(profile?.bio?.trim()),
      Boolean(profile?.hobbies?.trim()),
      Boolean(profile?.interests?.trim()),
      Boolean(profile?.avatarUrl?.trim()),
      Boolean(profile?.branch?.trim()),
      Boolean(profile?.year),
    ];
    const completionScore = Math.round(
      (completionParts.filter(Boolean).length / completionParts.length) * 100
    );
    const isPremium =
      Boolean(user.premiumUntil) && Date.parse(String(user.premiumUntil)) > Date.now();

    const reputation = getReputationStats(userId);
    const campusLevel = getCampusLevel({
      plansHosted: user.plansHosted,
      plansAttended: reputation.plansAttended,
      inviteCount: user.inviteCount,
      swipeStreak: user.swipeStreak,
      campusStreak: user.campusStreak,
      avgHostRating: reputation.avgHostRating,
      reputationBoost: user.reputationBoost,
    });
    res.json({
      ...user,
      ...profile,
      photos: parsePhotos(profile?.photos),
      completionScore,
      isPremium,
      ...reputation,
      ...campusLevel,
    });
  } catch (err) {
    console.error("Profile me error:", err);
    res.status(500).json({ error: "Failed to load profile" });
  }
});

// POST /profiles/me/avatar — upload profile photo from device
router.post("/me/avatar", auth, upload.single("avatar"), (req: any, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const userId = req.user.id;
  const avatarUrl = `${API_BASE}/uploads/${req.file.filename}`;
  try {
    const exists = db.prepare("SELECT userId FROM profiles WHERE userId = ?").get(userId);
    if (exists) db.prepare("UPDATE profiles SET avatarUrl = ? WHERE userId = ?").run(avatarUrl, userId);
    else db.prepare("INSERT INTO profiles (userId, avatarUrl) VALUES (?, ?)").run(userId, avatarUrl);
    res.json({ avatarUrl });
  } catch (err) {
    console.error("Avatar upload error:", err);
    res.status(500).json({ error: "Failed to save avatar" });
  }
});

router.post("/me/photos", auth, upload.single("photo"), (req: any, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const userId = req.user.id;
  const photoUrl = `${API_BASE}/uploads/${req.file.filename}`;
  try {
    const profile = db
      .prepare("SELECT photos FROM profiles WHERE userId = ?")
      .get(userId) as { photos?: string | null } | undefined;
    const list = parsePhotos(profile?.photos);
    const next = [...list, photoUrl].slice(0, 6);
    db.prepare("UPDATE profiles SET photos = ? WHERE userId = ?").run(JSON.stringify(next), userId);
    res.json({ photos: next });
  } catch (err) {
    console.error("Gallery upload error:", err);
    res.status(500).json({ error: "Failed to add photo" });
  }
});

router.delete("/me/photos/:index", auth, (req: any, res) => {
  const userId = req.user.id;
  const index = Number(req.params.index);
  if (!Number.isInteger(index) || index < 0) {
    return res.status(400).json({ error: "Invalid index" });
  }
  try {
    const profile = db
      .prepare("SELECT photos FROM profiles WHERE userId = ?")
      .get(userId) as { photos?: string | null } | undefined;
    const list = parsePhotos(profile?.photos);
    if (index >= list.length) return res.status(400).json({ error: "Invalid index" });
    const next = list.filter((_photo, idx) => idx !== index);
    db.prepare("UPDATE profiles SET photos = ? WHERE userId = ?").run(JSON.stringify(next), userId);
    res.json({ photos: next });
  } catch (err) {
    console.error("Gallery remove error:", err);
    res.status(500).json({ error: "Failed to remove photo" });
  }
});

// PUT /profiles/me
router.put("/me", auth, (req: any, res) => {
  const userId = req.user.id;
  const { fullName, age, gender, bio, hobbies, interests, branch, year, avatarUrl, photos } = req.body;
  try {
    if (fullName != null) db.prepare("UPDATE users SET fullName = ? WHERE id = ?").run(fullName, userId);
    if (typeof age === "number") db.prepare("UPDATE users SET age = ? WHERE id = ?").run(age, userId);
    if (gender !== undefined) db.prepare("UPDATE users SET gender = ? WHERE id = ?").run(gender, userId);
    const prof = db.prepare("SELECT userId FROM profiles WHERE userId = ?").get(userId);
    if (prof) {
      const updates: string[] = [];
      const values: any[] = [];
      if (bio !== undefined) { updates.push("bio = ?"); values.push(bio); }
      if (hobbies !== undefined) { updates.push("hobbies = ?"); values.push(hobbies); }
      if (interests !== undefined) { updates.push("interests = ?"); values.push(interests); }
      if (branch !== undefined) { updates.push("branch = ?"); values.push(branch); }
      if (year !== undefined) { updates.push("year = ?"); values.push(year); }
      if (avatarUrl !== undefined) { updates.push("avatarUrl = ?"); values.push(avatarUrl); }
      if (photos !== undefined) {
        const normalized = Array.isArray(photos)
          ? photos.filter((item: unknown) => typeof item === "string" && item.trim().length > 0).slice(0, 6)
          : [];
        updates.push("photos = ?");
        values.push(JSON.stringify(normalized));
      }
      if (values.length) {
        values.push(userId);
        db.prepare(`UPDATE profiles SET ${updates.join(", ")} WHERE userId = ?`).run(...values);
      }
    } else {
      db.prepare(
        "INSERT INTO profiles (userId, bio, hobbies, interests, branch, year, avatarUrl, photos) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      ).run(
        userId,
        bio ?? "",
        hobbies ?? "",
        interests ?? "",
        branch ?? "",
        year ?? null,
        avatarUrl ?? null,
        JSON.stringify(
          Array.isArray(photos)
            ? photos.filter((item: unknown) => typeof item === "string" && item.trim().length > 0).slice(0, 6)
            : []
        )
      );
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

router.get("/:id", auth, (req: any, res) => {
  const targetUserId = Number(req.params.id);
  if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  try {
    const user = db
      .prepare(
        "SELECT id, collegeId, fullName, age, gender, isAdmin, premiumUntil, profileBoostUntil, inviteCount, plansHosted, reputationBoost, swipeStreak, campusStreak FROM users WHERE id = ?"
      )
      .get(targetUserId) as
      | {
          id: number;
          collegeId: string;
          fullName: string;
          age: number;
          gender?: string | null;
          isAdmin?: number;
          premiumUntil?: string | null;
          profileBoostUntil?: string | null;
          inviteCount?: number;
          plansHosted?: number;
          reputationBoost?: number;
          swipeStreak?: number;
          campusStreak?: number;
        }
      | undefined;
    if (!user) return res.status(404).json({ error: "User not found" });

    const profile = db
      .prepare("SELECT bio, hobbies, interests, branch, year, avatarUrl, photos FROM profiles WHERE userId = ?")
      .get(targetUserId) as
      | {
          bio?: string | null;
          hobbies?: string | null;
          interests?: string | null;
          branch?: string | null;
          year?: number | null;
          avatarUrl?: string | null;
          photos?: string | null;
        }
      | undefined;

    const completionParts = [
      Boolean(user.fullName?.trim()),
      Boolean(user.age && user.age >= 18),
      Boolean(user.gender?.trim()),
      Boolean(profile?.bio?.trim()),
      Boolean(profile?.hobbies?.trim()),
      Boolean(profile?.interests?.trim()),
      Boolean(profile?.avatarUrl?.trim()),
      Boolean(profile?.branch?.trim()),
      Boolean(profile?.year),
    ];
    const completionScore = Math.round(
      (completionParts.filter(Boolean).length / completionParts.length) * 100
    );
    const isPremium =
      Boolean(user.premiumUntil) && Date.parse(String(user.premiumUntil)) > Date.now();
    const reputation = getReputationStats(targetUserId);
    const campusLevel = getCampusLevel({
      plansHosted: user.plansHosted,
      plansAttended: reputation.plansAttended,
      inviteCount: user.inviteCount,
      swipeStreak: user.swipeStreak,
      campusStreak: user.campusStreak,
      avgHostRating: reputation.avgHostRating,
      reputationBoost: user.reputationBoost,
    });

    return res.json({
      ...user,
      ...profile,
      photos: parsePhotos(profile?.photos),
      completionScore,
      isPremium,
      ...reputation,
      ...campusLevel,
    });
  } catch (err) {
    console.error("Profile by id error:", err);
    return res.status(500).json({ error: "Failed to load profile" });
  }
});

export default router;
