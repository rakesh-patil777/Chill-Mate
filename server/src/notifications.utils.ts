import db from "./db.js";
import { emitToUser } from "./socket.js";

export type NotificationType =
  | "like"
  | "match"
  | "plan_near_full"
  | "plan_join"
  | "streak_warning";

type CreateNotificationInput = {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  referenceId?: number | null;
  emit?: boolean;
};

export function createNotification({
  userId,
  type,
  title,
  message,
  referenceId = null,
  emit = true,
}: CreateNotificationInput) {
  const result = db
    .prepare(
      `INSERT INTO notifications (userId, type, title, message, referenceId)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(userId, type, title, message, referenceId);

  const row = db
    .prepare(
      `SELECT id, userId, type, title, message, referenceId, isRead, createdAt
       FROM notifications
       WHERE id = ?`
    )
    .get(result.lastInsertRowid) as
    | {
        id: number;
        userId: number;
        type: string;
        title: string;
        message: string;
        referenceId?: number | null;
        isRead: number;
        createdAt: string;
      }
    | undefined;

  if (emit && row) {
    emitToUser(userId, "notification:new", row);
  }

  return row;
}

