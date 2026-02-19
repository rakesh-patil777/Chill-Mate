import { Server as IOServer } from "socket.io";
import { verifyJwt } from "./utils.js";
import { JWT_SECRET } from "./middleware.js";
import db from "./db.js";

let ioRef: IOServer | null = null;

export function initSocket(io: IOServer) {
  ioRef = io;

  io.use((socket, next) => {
    const token =
      (socket.handshake.auth?.token as string | undefined) ??
      (socket.handshake.query?.token as string | undefined);
    if (!token) return next(new Error("Unauthorized"));
    const payload = verifyJwt<{ id: number }>(token, JWT_SECRET);
    if (!payload?.id) return next(new Error("Unauthorized"));
    (socket.data as { userId?: number }).userId = payload.id;
    return next();
  });

  io.on("connection", (socket) => {
    const userId = (socket.data as { userId?: number }).userId;
    if (!userId) return;
    socket.join(`user:${userId}`);

    socket.on("chat:typing", (payload: { toUserId?: number; isTyping?: boolean }) => {
      const toUserId = Number(payload?.toUserId);
      if (!Number.isInteger(toUserId) || toUserId <= 0) return;
      io.to(`user:${toUserId}`).emit("chat:typing", {
        fromUserId: userId,
        isTyping: Boolean(payload?.isTyping),
      });
    });

    socket.on(
      "plan:join",
      (payload: { planId?: number }, ack?: (response: { ok: boolean; error?: string }) => void) => {
        const planId = Number(payload?.planId);
        if (!Number.isInteger(planId) || planId <= 0) {
          ack?.({ ok: false, error: "Invalid plan id" });
          return;
        }

        const attendee = db
          .prepare("SELECT 1 FROM plan_attendees WHERE planId = ? AND userId = ?")
          .get(planId, userId);
        if (!attendee) {
          ack?.({ ok: false, error: "Not an attendee" });
          return;
        }

        socket.join(`plan_${planId}`);
        ack?.({ ok: true });
      }
    );

    socket.on("plan:leave", (payload: { planId?: number }) => {
      const planId = Number(payload?.planId);
      if (!Number.isInteger(planId) || planId <= 0) return;
      socket.leave(`plan_${planId}`);
    });

    socket.on("plan:message", (payload: { planId?: number; messageId?: number }) => {
      const planId = Number(payload?.planId);
      const messageId = Number(payload?.messageId);
      if (!Number.isInteger(planId) || planId <= 0) return;
      if (!Number.isInteger(messageId) || messageId <= 0) return;

      const attendee = db
        .prepare("SELECT 1 FROM plan_attendees WHERE planId = ? AND userId = ?")
        .get(planId, userId);
      if (!attendee) return;

      const msg = db
        .prepare(
          `SELECT m.id,
                  m.planId,
                  m.fromUserId AS senderId,
                  u.fullName AS senderName,
                  m.text AS content,
                  m.type,
                  m.createdAt
           FROM messages m
           JOIN users u ON u.id = m.fromUserId
           WHERE m.id = ? AND m.planId = ?`
        )
        .get(messageId, planId);
      if (!msg) return;

      io.to(`plan_${planId}`).emit("plan:new-message", msg);
    });
  });
}

export function emitToUser(userId: number, event: string, payload: unknown) {
  if (!ioRef) return;
  ioRef.to(`user:${userId}`).emit(event, payload);
}

export function emitToPlanRoom(planId: number, event: string, payload: unknown) {
  if (!ioRef) return;
  ioRef.to(`plan_${planId}`).emit(event, payload);
}
