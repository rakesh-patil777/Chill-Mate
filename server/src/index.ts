import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { Server as IOServer } from "socket.io";
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

const mountRoutes = (prefix = "") => {
  app.use(`${prefix}/auth`, authRouter);
  app.use(`${prefix}/profiles`, profilesRouter);
  app.use(`${prefix}/likes`, likesRouter);
  app.use(`${prefix}/likes-you`, likesRouter);
  app.use(`${prefix}/matches`, matchesRouter);
  app.use(`${prefix}/chill`, chillRouter);
  app.use(`${prefix}/chat`, chatRouter);
  app.use(`${prefix}/notifications`, notificationsRouter);
  app.use(`${prefix}/safety`, safetyRouter);
  app.use(`${prefix}/premium`, premiumRouter);
  app.use(`${prefix}/analytics`, analyticsRouter);
  app.use(`${prefix}/admin`, adminRouter);
  app.use(`${prefix}/leaderboard`, leaderboardRouter);
  app.use(`${prefix}/plans`, plansRouter);
  app.use(`${prefix}/config`, configRouter);
  app.use(`${prefix}/feedback`, feedbackRouter);
};

mountRoutes("");
mountRoutes("/api");

const healthHandler = (_req: express.Request, res: express.Response) => {
  res.status(200).json({ status: "ok" });
};

app.get("/health", healthHandler);
app.get("/api/health", healthHandler);

app.get("/", (_req, res) => {
  res.send("ChillMate API is running");
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
