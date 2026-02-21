import { io } from "socket.io-client";
const rawApiBase = import.meta.env?.VITE_API_URL ??
    import.meta.env?.VITE_API_BASE ??
    "";
const API_BASE = String(rawApiBase).replace(/\/$/, "");
const SOCKET_BASE = API_BASE.replace(/\/api$/, "");
let socketRef = null;
export function getSocket() {
    const token = localStorage.getItem("token");
    if (!token)
        return null;
    if (socketRef)
        return socketRef;
    socketRef = io(SOCKET_BASE || undefined, {
        transports: ["websocket", "polling"],
        auth: { token },
    });
    return socketRef;
}
export function disconnectSocket() {
    if (!socketRef)
        return;
    socketRef.disconnect();
    socketRef = null;
}
