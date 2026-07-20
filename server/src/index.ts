import "dotenv/config";
import path from "path";
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

const __dirname = path.resolve();
const app = express();
const NODE_ENV = process.env.NODE_ENV || "development";
const isProduction = NODE_ENV === "production";

app.set("trust proxy", 1);

const isAllowedOrigin = (origin: string): boolean => {
  if (
    origin === "https://chillmate.in" ||
    origin === "https://www.chillmate.in" ||
    origin === "http://chillmate.in" ||
    origin === "https://api.chillmate.in" ||
    origin === "http://api.chillmate.in" ||
    origin === "http://localhost:5173"
  ) {
    return true;
  }

  // Support Vercel Preview Deployments (wildcards)
  if (/^https:\/\/.*\.vercel\.app$/.test(origin)) {
    return true;
  }

  // Support configured frontend URL
  if (process.env.FRONTEND_URL) {
    const extraOrigins = process.env.FRONTEND_URL.split(",").map((o) => o.trim());
    if (extraOrigins.includes(origin)) {
      return true;
    }
  }

  return false;
};

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);

app.use(cors(corsOptions));

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !isProduction,
});
app.use(globalLimiter);

app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    if (req.method === "GET" && res.statusCode < 400) return;
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`,
    );
  });
  next();
});

app.use((req, res, next) => {
  const originalCookie = res.cookie.bind(res);
  (res as any).cookie = (
    name: string,
    value: any,
    options: Record<string, any> = {},
  ) =>
    originalCookie(name, value, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      ...options,
    });
  next();
});

const uploadsDir = path.join(__dirname, "public", "uploads");
app.locals.uploadsBaseUrl = process.env.UPLOADS_BASE_URL || "";
app.use(
  "/uploads",
  express.static(uploadsDir, {
    etag: true,
    maxAge: isProduction ? "7d" : 0,
  }),
);

const mountRoutes = (prefix = "") => {
  app.use(`${prefix}`, authRouter);
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

// API-only: no frontend static serving (frontend is on Vercel)
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("Unhandled server error:", err);
    res.status(500).json({ error: "Internal server error" });
  },
);

const server = http.createServer(app);
const io = new IOServer(server, {
  cors: corsOptions,
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
