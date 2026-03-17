import { io, Socket } from "socket.io-client";

const API_URL = String((import.meta as any).env?.VITE_API_URL ?? "").replace(/\/$/, "");
const SOCKET_BASE = API_URL.replace(/\/api$/, "");

let socketRef: Socket | null = null;

export function getSocket() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  if (socketRef) return socketRef;

  socketRef = io(SOCKET_BASE || undefined, {
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
