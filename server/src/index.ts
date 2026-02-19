import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { Server as IOServer } from "socket.io";
import fs from "fs";
import db from "./db.js";
import rateLimit from "express-rate-limit";

import authRouter from "./routes.auth.js";
import profilesRouter from "./routes.profiles.js";
import likesRouter from "./routes.likes.js";
import matchesRouter from "./routes.matches.js";
import chillRouter from "./routes.chill.js";
import chatRouter from "./routes.chat.js";
import notificationsRouter from "./routes.notifications.js";
import safetyRouter from "./routes.safety.js";
import premiumRouter from "./routes.premium.js";
import analyticsRouter from "./routes.analytics.js";
import adminRouter from "./routes.admin.js";
import plansRouter from "./routes.plans.js";
import leaderboardRouter from "./routes.leaderboard.js";
import configRouter from "./routes.config.js";
import feedbackRouter from "./routes.feedback.js";
import { initSocket } from "./socket.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const NODE_ENV = process.env.NODE_ENV || "development";
const isProduction = NODE_ENV === "production";

const PROD_ORIGINS = ["https://chillmate.in", "https://www.chillmate.in"];
const DEV_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"];
const allowedOrigins = isProduction ? PROD_ORIGINS : [...PROD_ORIGINS, ...DEV_ORIGINS];

function isAllowedOrigin(origin?: string) {
  if (!origin) return true;
  return allowedOrigins.includes(origin);
}

app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

if (isProduction) {
  app.use((req, res, next) => {
    const forwardedProto = (req.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0]?.trim();
    if (req.secure || forwardedProto === "https") return next();
    const host = req.headers.host;
    if (!host) return next();
    return res.redirect(301, `https://${host}${req.originalUrl}`);
  });
}

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error("CORS blocked for this origin"));
    },
    credentials: true,
  })
);
app.use(express.json());

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    if (req.method === "GET" && res.statusCode < 400) return;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`);
  });
  next();
});

app.use((req, res, next) => {
  const originalCookie = res.cookie.bind(res);
  (res as any).cookie = (name: string, value: any, options: Record<string, any> = {}) =>
    originalCookie(name, value, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      ...options,
    });
  next();
});

const uploadsDir = path.join(__dirname, "..", "public", "uploads");
app.locals.uploadsBaseUrl = process.env.UPLOADS_BASE_URL || "";
app.use(
  "/uploads",
  express.static(uploadsDir, {
    etag: true,
    maxAge: isProduction ? "7d" : 0,
  })
);

app.use("/auth", authRouter);
app.use("/profiles", profilesRouter);
app.use("/likes", likesRouter);
app.use("/likes-you", likesRouter);
app.use("/matches", matchesRouter);
app.use("/chill", chillRouter);
app.use("/chat", chatRouter);
app.use("/notifications", notificationsRouter);
app.use("/safety", safetyRouter);
app.use("/premium", premiumRouter);
app.use("/analytics", analyticsRouter);
app.use("/admin", adminRouter);
app.use("/internal/admin", adminRouter);
app.use("/plans", plansRouter);
app.use("/leaderboard", leaderboardRouter);
app.use("/config", configRouter);
app.use("/feedback", feedbackRouter);

app.get("/health", (_req, res) => {
  let dbOk = false;
  let uploadsOk = false;
  let dbError: string | null = null;

  try {
    db.prepare("SELECT 1 as ok").get();
    dbOk = true;
  } catch (err) {
    dbError = err instanceof Error ? err.message : "DB check failed";
  }

  uploadsOk = fs.existsSync(uploadsDir);
  const jwtLoaded = Boolean(process.env.JWT_SECRET);

  const checks = {
    db: { ok: dbOk, error: dbError },
    uploadsDir: { ok: uploadsOk, path: uploadsDir },
    jwtSecret: { ok: jwtLoaded },
  };

  const allOk = checks.db.ok && checks.uploadsDir.ok && checks.jwtSecret.ok;
  res.status(allOk ? 200 : 503).json({
    ok: allOk,
    name: "Chill Mate",
    env: NODE_ENV,
    timestamp: new Date().toISOString(),
    checks,
  });
});

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const server = http.createServer(app);
const io = new IOServer(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin || undefined)) return callback(null, true);
      return callback(new Error("CORS blocked for this origin"));
    },
    credentials: true,
  },
});
initSocket(io);

const PORT = Number(process.env.PORT || 4000);
server.listen(PORT, () => {
  console.log(`Chill Mate API running at http://localhost:${PORT}`);
  console.log(`[startup] NODE_ENV=${NODE_ENV}`);
  console.log(`[startup] PORT=${PORT}`);
  console.log(`[startup] JWT loaded=${Boolean(process.env.JWT_SECRET)}`);
  console.log(`[startup] Rate limiting active=true (auth endpoints)`);
  console.log(`[startup] Admin routes active=true (/admin, /internal/admin)`);
});
