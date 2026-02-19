import { io, Socket } from "socket.io-client";

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE ?? "http://localhost:4000";

let socketRef: Socket | null = null;

export function getSocket() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  if (socketRef) return socketRef;

  socketRef = io(API_BASE, {
    transports: ["websocket", "polling"],
    auth: { token },
  });
  return socketRef;
}

export function disconnectSocket() {
  if (!socketRef) return;
  socketRef.disconnect();
  socketRef = null;
}
