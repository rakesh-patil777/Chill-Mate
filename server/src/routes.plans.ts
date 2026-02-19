import { Router } from "express";
import db from "./db.js";
import { auth, type AuthenticatedRequest } from "./middleware.js";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createNotification } from "./notifications.utils.js";

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "..", "public", "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const API_BASE = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 4000}`;

const planChatStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (req: AuthenticatedRequest, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `plan-chat-${req.user.id}-${Date.now()}${ext}`);
  },
});

const planChatUpload = multer({
  storage: planChatStorage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image uploads are allowed"));
      return;
    }
    cb(null, true);
  },
});

function listPlans(userId: number) {
  const rows = db
    .prepare(
      `SELECT
        cp.*,
        u.fullName AS hostName,
        (SELECT COUNT(*) FROM plan_attendees pa WHERE pa.planId = cp.id) AS attendeeCount,
        EXISTS(
          SELECT 1
          FROM plan_attendees pa2
          WHERE pa2.planId = cp.id AND pa2.userId = ?
        ) AS isJoined
      FROM chill_plans cp
      JOIN users u ON u.id = cp.hostUserId
      ORDER BY cp.createdAt DESC
      LIMIT 100`
    )
    .all(userId) as Array<{
    id: number;
    hostUserId: number;
    startAt?: string | null;
    status?: string | null;
    attendeeCount?: number;
    maxGuests?: number | null;
    isJoined?: number;
    [k: string]: unknown;
  }>;

  return rows.map((row) => {
    const attendeeCount = Number(row.attendeeCount ?? 0);
    const maxGuests =
      typeof row.maxGuests === "number" ? row.maxGuests : null;
    const isFull =
      maxGuests !== null && maxGuests > 0 ? attendeeCount >= maxGuests : false;
    const isCompleted =
      String(row.status ?? "").toLowerCase() === "completed" ||
      (Boolean(row.startAt) && Date.parse(String(row.startAt)) < Date.now());
    const isCancelled = String(row.status ?? "").toLowerCase() === "cancelled";

    return {
      ...row,
      attendeeCount,
      maxGuests,
      isJoined: Boolean(row.isJoined),
      isHost: row.hostUserId === userId,
      isFull,
      isCompleted,
      isCancelled,
    };
  });
}

function getPlanForAccess(planId: number) {
  return db
    .prepare("SELECT id, title, startAt, status FROM chill_plans WHERE id = ?")
    .get(planId) as
    | { id: number; title: string; startAt?: string | null; status?: string | null }
    | undefined;
}

function isPlanAttendee(planId: number, userId: number) {
  return db
    .prepare("SELECT 1 FROM plan_attendees WHERE planId = ? AND userId = ?")
    .get(planId, userId);
}

const CreateSchema = z.object({
  title: z.string().min(2).max(80),
  description: z.string().max(500).optional(),
  location: z.string().max(120).optional(),
  startAt: z.string().optional(),
  maxGuests: z.number().int().positive().optional(),
});

const PlanChatMessageSchema = z.object({
  content: z.string().trim().min(1).max(2000),
  type: z.enum(["text", "image"]).default("text"),
});

const UpdatePlanStatusSchema = z.object({
  status: z.enum(["completed", "cancelled"]),
});
const RateHostSchema = z.object({
  rating: z.number().int().min(1).max(5),
  feedback: z.string().trim().max(500).optional(),
});

function toIsoDay(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function yesterdayIsoDay(todayIso: string) {
  const d = new Date(`${todayIso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return toIsoDay(d);
}

function updateCampusStreak(userId: number) {
  const user = db
    .prepare("SELECT lastActiveDate, campusStreak FROM users WHERE id = ?")
    .get(userId) as { lastActiveDate?: string | null; campusStreak?: number } | undefined;
  if (!user) return;

  const today = toIsoDay();
  const yesterday = yesterdayIsoDay(today);
  let next = 1;

  if (user.lastActiveDate === today) {
    next = Number(user.campusStreak ?? 0);
  } else if (user.lastActiveDate === yesterday) {
    next = Number(user.campusStreak ?? 0) + 1;
  }

  db.prepare(
    `UPDATE users
     SET campusStreak = ?, lastActiveDate = ?
     WHERE id = ?`
  ).run(next, today, userId);
}

router.post("/", auth, (req: AuthenticatedRequest, res) => {
  const parsed = CreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const hostUserId = req.user.id;
  const { title, description, location, startAt, maxGuests } = parsed.data;

  const info = db
    .prepare(
      `INSERT INTO chill_plans (hostUserId, title, description, location, startAt, maxGuests)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      hostUserId,
      title,
      description ?? null,
      location ?? null,
      startAt ?? null,
      maxGuests ?? null
    );

  db.prepare(
    `UPDATE users
     SET plansHosted = plansHosted + 1
     WHERE id = ?`
  ).run(hostUserId);

  db.prepare(
    `INSERT OR IGNORE INTO plan_attendees (planId, userId)
     VALUES (?, ?)`
  ).run(Number(info.lastInsertRowid), hostUserId);

  return res.json({ id: info.lastInsertRowid });
});

router.get("/", auth, (req: AuthenticatedRequest, res) =>
  res.json(listPlans(req.user.id))
);
router.get("/browse", auth, (req: AuthenticatedRequest, res) =>
  res.json(listPlans(req.user.id))
);

router.get("/:id", auth, (req: AuthenticatedRequest, res) => {
  const planId = Number(req.params.id);
  const userId = req.user.id;

  if (!Number.isInteger(planId) || planId <= 0) {
    return res.status(400).json({ error: "Invalid plan id" });
  }

  try {
    const plan = db
      .prepare(
        `SELECT
          cp.id,
          cp.title,
          cp.description,
          cp.location,
          cp.startAt,
          cp.maxGuests,
          cp.status,
          u.id AS hostId,
          u.fullName AS hostFullName,
          p.avatarUrl AS hostAvatarUrl
        FROM chill_plans cp
        JOIN users u ON u.id = cp.hostUserId
        LEFT JOIN profiles p ON p.userId = u.id
        WHERE cp.id = ?`
      )
      .get(planId) as
      | {
          id: number;
          title: string;
          description?: string | null;
          location?: string | null;
          startAt?: string | null;
          maxGuests?: number | null;
          status?: string | null;
          hostId: number;
          hostFullName: string;
          hostAvatarUrl?: string | null;
        }
      | undefined;

    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    const attendees = db
      .prepare(
        `SELECT
          u.id,
          u.fullName,
          p.avatarUrl,
          pa.attended,
          pa.markedByHost
        FROM plan_attendees pa
        JOIN users u ON u.id = pa.userId
        LEFT JOIN profiles p ON p.userId = u.id
        WHERE pa.planId = ?
        ORDER BY pa.joinedAt ASC`
      )
      .all(planId) as Array<{
      id: number;
      fullName: string;
      avatarUrl?: string | null;
      attended?: number;
      markedByHost?: number;
    }>;

    const attendeeCount = attendees.length;
    const isJoined = attendees.some((a) => a.id === userId);
    const isHost = plan.hostId === userId;
    const maxGuests =
      typeof plan.maxGuests === "number" ? plan.maxGuests : null;
    const isFull =
      maxGuests !== null && maxGuests > 0 ? attendeeCount >= maxGuests : false;
    const isCompleted =
      String(plan.status ?? "").toLowerCase() === "completed" ||
      (Boolean(plan.startAt) && Date.parse(String(plan.startAt)) < Date.now());
    const isCancelled = String(plan.status ?? "").toLowerCase() === "cancelled";

    return res.json({
      id: plan.id,
      title: plan.title,
      description: plan.description ?? null,
      location: plan.location ?? null,
      startAt: plan.startAt ?? null,
      maxGuests,
      status: plan.status ?? "active",
      host: {
        id: plan.hostId,
        fullName: plan.hostFullName,
        avatarUrl: plan.hostAvatarUrl ?? null,
      },
      attendees: attendees.map((a) => ({
        id: a.id,
        fullName: a.fullName,
        avatarUrl: a.avatarUrl ?? null,
        attended: Boolean(a.attended),
        markedByHost: Boolean(a.markedByHost),
      })),
      attendeeCount,
      isJoined,
      isHost,
      isFull,
      isCompleted,
      isCancelled,
    });
  } catch (err) {
    console.error("Get plan detail error:", err);
    return res.status(500).json({ error: "Failed to load plan detail" });
  }
});

router.get("/:id/chat", auth, (req: AuthenticatedRequest, res) => {
  const planId = Number(req.params.id);
  const userId = req.user.id;

  if (!Number.isInteger(planId) || planId <= 0) {
    return res.status(400).json({ error: "Invalid plan id" });
  }

  const plan = getPlanForAccess(planId);
  if (!plan) return res.status(404).json({ error: "Plan not found" });
  if (!isPlanAttendee(planId, userId)) {
    return res.status(403).json({ error: "Only attendees can access plan chat" });
  }

  const messages = db
    .prepare(
      `SELECT
        m.id,
        m.planId,
        m.fromUserId AS senderId,
        u.fullName AS senderName,
        m.text AS content,
        m.type,
        m.createdAt
      FROM messages m
      JOIN users u ON u.id = m.fromUserId
      WHERE m.planId = ?
      ORDER BY m.id ASC`
    )
    .all(planId);

  return res.json({
    planId: plan.id,
    planTitle: plan.title,
    planStatus: plan.status ?? null,
    startAt: plan.startAt ?? null,
    messages,
  });
});

router.post("/:id/chat", auth, (req: AuthenticatedRequest, res) => {
  const planId = Number(req.params.id);
  const userId = req.user.id;
  if (!Number.isInteger(planId) || planId <= 0) {
    return res.status(400).json({ error: "Invalid plan id" });
  }

  const parsed = PlanChatMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const plan = getPlanForAccess(planId);
  if (!plan) return res.status(404).json({ error: "Plan not found" });
  if (!isPlanAttendee(planId, userId)) {
    return res.status(403).json({ error: "Only attendees can send plan messages" });
  }

  const started = plan.startAt ? Date.parse(plan.startAt) < Date.now() : false;
  const completed = String(plan.status ?? "").toLowerCase() === "completed" || started;
  if (completed) {
    return res.status(400).json({ error: "Plan is completed. Chat is read-only." });
  }

  const { content, type } = parsed.data;
  const info = db
    .prepare(
      `INSERT INTO messages (fromUserId, toUserId, text, planId, type)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(userId, userId, content, planId, type);

  const message = db
    .prepare(
      `SELECT
        m.id,
        m.planId,
        m.fromUserId AS senderId,
        u.fullName AS senderName,
        m.text AS content,
        m.type,
        m.createdAt
      FROM messages m
      JOIN users u ON u.id = m.fromUserId
      WHERE m.id = ?`
    )
    .get(info.lastInsertRowid);

  return res.status(201).json(message);
});

router.post(
  "/:id/chat/upload",
  auth,
  planChatUpload.single("image"),
  (req: any, res) => {
    const planId = Number(req.params.id);
    const userId = req.user.id;
    if (!Number.isInteger(planId) || planId <= 0) {
      return res.status(400).json({ error: "Invalid plan id" });
    }

    const plan = getPlanForAccess(planId);
    if (!plan) return res.status(404).json({ error: "Plan not found" });
    if (!isPlanAttendee(planId, userId)) {
      return res.status(403).json({ error: "Only attendees can upload" });
    }
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });

    const imageUrl = `${API_BASE}/uploads/${req.file.filename}`;
    return res.status(201).json({ imageUrl });
  }
);

router.post("/:id/join", auth, (req: AuthenticatedRequest, res) => {
  const planId = Number(req.params.id);
  const userId = req.user.id;

  if (!Number.isInteger(planId) || planId <= 0) {
    return res.status(400).json({ error: "Invalid plan id" });
  }

  try {
    const plan = db
      .prepare("SELECT id, title, hostUserId, maxGuests FROM chill_plans WHERE id = ?")
      .get(planId) as
      | { id: number; title: string; hostUserId: number; maxGuests?: number | null }
      | undefined;

    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    const attendeeCountBefore = Number(
      (
        db
          .prepare("SELECT COUNT(*) as c FROM plan_attendees WHERE planId = ?")
          .get(planId) as { c: number }
      ).c
    );

    const insert = db.prepare(
      `INSERT OR IGNORE INTO plan_attendees (planId, userId)
       VALUES (?, ?)`
    ).run(planId, userId);

    if (insert.changes > 0) {
      updateCampusStreak(userId);

      if (plan.hostUserId !== userId) {
        createNotification({
          userId: plan.hostUserId,
          type: "plan_join",
          title: "New attendee joined 🎉",
          message: "Someone just joined your campus plan.",
          referenceId: planId,
        });
      }

      const attendeeCountAfter = attendeeCountBefore + 1;
      const maxGuests =
        typeof plan.maxGuests === "number" && plan.maxGuests > 0
          ? plan.maxGuests
          : null;
      if (maxGuests) {
        const beforeRatio = attendeeCountBefore / maxGuests;
        const afterRatio = attendeeCountAfter / maxGuests;
        if (beforeRatio < 0.8 && afterRatio >= 0.8) {
          createNotification({
            userId: plan.hostUserId,
            type: "plan_near_full",
            title: "Your plan is almost full 🔥",
            message: "Only a few spots left.",
            referenceId: planId,
          });
        }
      }
    }

    const attendee = db
      .prepare(
        `SELECT joinedAt
         FROM plan_attendees
         WHERE planId = ? AND userId = ?`
      )
      .get(planId, userId) as { joinedAt: string } | undefined;

    return res.json({
      success: true,
      joined: insert.changes > 0,
      planId,
      userId,
      joinedAt: attendee?.joinedAt ?? null,
    });
  } catch (err) {
    console.error("Join plan error:", err);
    return res.status(500).json({ error: "Failed to join plan" });
  }
});

router.post("/:id/leave", auth, (req: AuthenticatedRequest, res) => {
  const planId = Number(req.params.id);
  const userId = req.user.id;

  if (!Number.isInteger(planId) || planId <= 0) {
    return res.status(400).json({ error: "Invalid plan id" });
  }

  try {
    const plan = db
      .prepare("SELECT id FROM chill_plans WHERE id = ?")
      .get(planId) as { id: number } | undefined;

    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    db.prepare(
      `DELETE FROM plan_attendees
       WHERE planId = ? AND userId = ?`
    ).run(planId, userId);

    return res.json({ success: true, left: true, planId, userId });
  } catch (err) {
    console.error("Leave plan error:", err);
    return res.status(500).json({ error: "Failed to leave plan" });
  }
});

router.delete("/:id/leave", auth, (req: AuthenticatedRequest, res) => {
  const planId = Number(req.params.id);
  const userId = req.user.id;

  if (!Number.isInteger(planId) || planId <= 0) {
    return res.status(400).json({ error: "Invalid plan id" });
  }

  try {
    const plan = db
      .prepare("SELECT id, hostUserId FROM chill_plans WHERE id = ?")
      .get(planId) as { id: number; hostUserId: number } | undefined;

    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }
    if (plan.hostUserId === userId) {
      return res.status(400).json({ error: "Host cannot leave their own plan" });
    }

    const attendee = db
      .prepare("SELECT 1 FROM plan_attendees WHERE planId = ? AND userId = ?")
      .get(planId, userId);
    if (!attendee) {
      return res.status(400).json({ error: "You are not an attendee" });
    }

    db.prepare(
      `DELETE FROM plan_attendees
       WHERE planId = ? AND userId = ?`
    ).run(planId, userId);

    const attendeeCount = Number(
      (
        db
          .prepare("SELECT COUNT(*) as c FROM plan_attendees WHERE planId = ?")
          .get(planId) as { c: number }
      ).c
    );

    return res.json({ success: true, left: true, planId, userId, attendeeCount });
  } catch (err) {
    console.error("Leave plan error:", err);
    return res.status(500).json({ error: "Failed to leave plan" });
  }
});

router.patch("/:id/status", auth, (req: AuthenticatedRequest, res) => {
  const planId = Number(req.params.id);
  const userId = req.user.id;

  if (!Number.isInteger(planId) || planId <= 0) {
    return res.status(400).json({ error: "Invalid plan id" });
  }

  const parsed = UpdatePlanStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const plan = db
      .prepare("SELECT id, hostUserId FROM chill_plans WHERE id = ?")
      .get(planId) as { id: number; hostUserId: number } | undefined;

    if (!plan) return res.status(404).json({ error: "Plan not found" });
    if (plan.hostUserId !== userId) {
      return res.status(403).json({ error: "Only host can update plan status" });
    }

    db.prepare("UPDATE chill_plans SET status = ? WHERE id = ?").run(parsed.data.status, planId);

    const updated = db
      .prepare("SELECT id, title, status, startAt FROM chill_plans WHERE id = ?")
      .get(planId);

    return res.json(updated);
  } catch (err) {
    console.error("Update plan status error:", err);
    return res.status(500).json({ error: "Failed to update plan status" });
  }
});

router.patch("/:id/attendance/:userId", auth, (req: AuthenticatedRequest, res) => {
  const planId = Number(req.params.id);
  const targetUserId = Number(req.params.userId);
  const requesterId = req.user.id;

  if (!Number.isInteger(planId) || planId <= 0 || !Number.isInteger(targetUserId) || targetUserId <= 0) {
    return res.status(400).json({ error: "Invalid ids" });
  }

  try {
    const plan = db
      .prepare("SELECT id, hostUserId FROM chill_plans WHERE id = ?")
      .get(planId) as { id: number; hostUserId: number } | undefined;
    if (!plan) return res.status(404).json({ error: "Plan not found" });
    if (plan.hostUserId !== requesterId) {
      return res.status(403).json({ error: "Only host can mark attendance" });
    }

    const attendee = db
      .prepare("SELECT 1 FROM plan_attendees WHERE planId = ? AND userId = ?")
      .get(planId, targetUserId);
    if (!attendee) {
      return res.status(404).json({ error: "Attendee not found in this plan" });
    }

    db.prepare(
      `UPDATE plan_attendees
       SET attended = 1, markedByHost = 1
       WHERE planId = ? AND userId = ?`
    ).run(planId, targetUserId);

    return res.json({ success: true, planId, userId: targetUserId, attended: true, markedByHost: true });
  } catch (err) {
    console.error("Mark attendance error:", err);
    return res.status(500).json({ error: "Failed to mark attendance" });
  }
});

router.post("/:id/rate-host", auth, (req: AuthenticatedRequest, res) => {
  const planId = Number(req.params.id);
  const reviewerUserId = req.user.id;
  if (!Number.isInteger(planId) || planId <= 0) {
    return res.status(400).json({ error: "Invalid plan id" });
  }

  const parsed = RateHostSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const plan = db
      .prepare("SELECT id, hostUserId, status FROM chill_plans WHERE id = ?")
      .get(planId) as { id: number; hostUserId: number; status?: string | null } | undefined;
    if (!plan) return res.status(404).json({ error: "Plan not found" });
    if (plan.hostUserId === reviewerUserId) {
      return res.status(400).json({ error: "Host cannot rate their own plan" });
    }
    if (String(plan.status ?? "").toLowerCase() !== "completed") {
      return res.status(400).json({ error: "Host can be rated only after plan is completed" });
    }

    const attendee = db
      .prepare(
        "SELECT attended FROM plan_attendees WHERE planId = ? AND userId = ?"
      )
      .get(planId, reviewerUserId) as { attended?: number } | undefined;
    if (!attendee) {
      return res.status(403).json({ error: "Only attendees can rate host" });
    }
    if (!Boolean(attendee.attended)) {
      return res.status(403).json({ error: "Only attendees marked as attended can rate host" });
    }

    const { rating, feedback } = parsed.data;
    const info = db
      .prepare(
        `INSERT INTO host_ratings (planId, hostUserId, reviewerUserId, rating, feedback)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(planId, reviewerUserId)
         DO UPDATE SET rating = excluded.rating, feedback = excluded.feedback, createdAt = datetime('now')`
      )
      .run(planId, plan.hostUserId, reviewerUserId, rating, feedback ?? null);

    return res.status(201).json({
      success: true,
      id: Number(info.lastInsertRowid) || undefined,
      planId,
      hostUserId: plan.hostUserId,
      reviewerUserId,
      rating,
      feedback: feedback ?? null,
    });
  } catch (err) {
    console.error("Rate host error:", err);
    return res.status(500).json({ error: "Failed to rate host" });
  }
});

router.delete("/:id/attendees/:userId", auth, (req: AuthenticatedRequest, res) => {
  const planId = Number(req.params.id);
  const requesterId = req.user.id;
  const targetUserId = Number(req.params.userId);

  if (!Number.isInteger(planId) || planId <= 0 || !Number.isInteger(targetUserId) || targetUserId <= 0) {
    return res.status(400).json({ error: "Invalid ids" });
  }

  try {
    const plan = db
      .prepare("SELECT id, hostUserId FROM chill_plans WHERE id = ?")
      .get(planId) as { id: number; hostUserId: number } | undefined;

    if (!plan) return res.status(404).json({ error: "Plan not found" });
    if (plan.hostUserId !== requesterId) {
      return res.status(403).json({ error: "Only host can remove attendees" });
    }
    if (targetUserId === plan.hostUserId) {
      return res.status(400).json({ error: "Host cannot be removed" });
    }

    db.prepare(
      `DELETE FROM plan_attendees
       WHERE planId = ? AND userId = ?`
    ).run(planId, targetUserId);

    const attendeeCount = Number(
      (
        db
          .prepare("SELECT COUNT(*) as c FROM plan_attendees WHERE planId = ?")
          .get(planId) as { c: number }
      ).c
    );

    return res.json({ success: true, planId, userId: targetUserId, attendeeCount });
  } catch (err) {
    console.error("Remove attendee error:", err);
    return res.status(500).json({ error: "Failed to remove attendee" });
  }
});

router.get("/:id/attendees", auth, (req: AuthenticatedRequest, res) => {
  const planId = Number(req.params.id);

  if (!Number.isInteger(planId) || planId <= 0) {
    return res.status(400).json({ error: "Invalid plan id" });
  }

  try {
    const plan = db
      .prepare("SELECT id FROM chill_plans WHERE id = ?")
      .get(planId) as { id: number } | undefined;

    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    const rows = db
      .prepare(
        `SELECT
           u.id,
           u.collegeId,
           u.fullName,
           u.age,
           u.gender,
           p.avatarUrl,
           pa.joinedAt
         FROM plan_attendees pa
         JOIN users u ON u.id = pa.userId
         LEFT JOIN profiles p ON p.userId = u.id
         WHERE pa.planId = ?
         ORDER BY pa.joinedAt ASC`
      )
      .all(planId);

    return res.json({
      planId,
      attendees: rows,
      count: rows.length,
    });
  } catch (err) {
    console.error("List plan attendees error:", err);
    return res.status(500).json({ error: "Failed to load attendees" });
  }
});

export default router;
