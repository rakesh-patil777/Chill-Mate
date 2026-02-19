import { Request, Response, NextFunction } from "express";
import { verifyJwt } from "./utils.js";
import db from "./db.js";

export const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is required. Set it in your environment.");
}

export interface AuthUser {
  id: number;
  isAdmin: boolean;
}

export type PremiumLikeUser = {
  premiumUntil?: string | null;
} | null | undefined;

export type AuthenticatedRequest = Request & { user: AuthUser };

export function auth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const raw = authHeader.slice(7);
  if (!raw) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const payload = verifyJwt<{ id: number }>(raw, JWT_SECRET);
  if (!payload?.id) {
    return res.status(401).json({ error: "Invalid token" });
  }

  const user = db
    .prepare("SELECT id, isAdmin FROM users WHERE id = ?")
    .get(payload.id) as { id: number; isAdmin?: number } | undefined;

  if (!user) {
    return res.status(401).json({ error: "Invalid token" });
  }

  (req as Request & { user: AuthUser }).user = {
    id: user.id,
    isAdmin: user.isAdmin === 1,
  };
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const request = req as Request & { user?: AuthUser };
  if (!request.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (!request.user.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
}

export function isPremium(user: PremiumLikeUser) {
  if (!user?.premiumUntil) return false;
  return Date.parse(String(user.premiumUntil)) > Date.now();
}
