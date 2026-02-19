import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { getSocket } from "../socket";
function parseServerDate(value) {
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
        return new Date(value.replace(" ", "T") + "Z");
    }
    return new Date(value);
}
function toReadableError(err, fallback) {
    const raw = err instanceof Error ? err.message : fallback;
    try {
        const parsed = JSON.parse(raw);
        if (parsed?.error)
            return parsed.error;
    }
    catch {
    }
    return raw || fallback;
}
export default function PlanChat() {
    const { id } = useParams();
    const navigate = useNavigate();
    const planId = Number(id);
    const [planTitle, setPlanTitle] = useState("Plan Chat");
    const [planStatus, setPlanStatus] = useState(null);
    const [startAt, setStartAt] = useState(null);
    const [messages, setMessages] = useState([]);
    const [myUserId, setMyUserId] = useState(null);
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [error, setError] = useState(null);
    const bottomRef = useRef(null);
    const fileRef = useRef(null);
    const isCompleted = useMemo(() => {
        const completed = String(planStatus ?? "").toLowerCase() === "completed";
        const started = startAt ? Date.parse(startAt) < Date.now() : false;
        return completed || started;
    }, [planStatus, startAt]);
    useEffect(() => {
        api("/profiles/me")
            .then((me) => setMyUserId(me.id))
            .catch(() => setMyUserId(null));
    }, []);
    useEffect(() => {
        if (!Number.isInteger(planId) || planId <= 0) {
            setError("Invalid plan id");
            setLoading(false);
            return;
        }
        let mounted = true;
        api(`/plans/${planId}/chat`)
            .then((data) => {
            if (!mounted)
                return;
            setPlanTitle(data.planTitle || "Plan Chat");
            setPlanStatus(data.planStatus ?? null);
            setStartAt(data.startAt ?? null);
            setMessages(Array.isArray(data.messages) ? data.messages : []);
        })
            .catch((err) => {
            if (!mounted)
                return;
            const readable = toReadableError(err, "Failed to load plan chat");
            if (readable.toLowerCase().includes("only attendees can access plan chat")) {
                setError("Only attendees can access plan chat.");
                return;
            }
            setError(readable);
        })
            .finally(() => {
            if (mounted)
                setLoading(false);
        });
        return () => {
            mounted = false;
        };
    }, [planId]);
    useEffect(() => {
        if (!Number.isInteger(planId) || planId <= 0)
            return;
        const socket = getSocket();
        if (!socket)
            return;
        socket.emit("plan:join", { planId }, (ack) => {
            if (!ack?.ok) {
                if ((ack.error ?? "").toLowerCase().includes("not an attendee")) {
                    setError("Only attendees can access plan chat.");
                }
                else if (ack?.error) {
                    setError(ack.error);
                }
            }
        });
        const onMessage = (incoming) => {
            if (incoming.planId !== planId)
                return;
            setMessages((prev) => {
                if (prev.some((m) => m.id === incoming.id))
                    return prev;
                return [...prev, incoming];
            });
        };
        socket.on("plan:new-message", onMessage);
        return () => {
            socket.emit("plan:leave", { planId });
            socket.off("plan:new-message", onMessage);
        };
    }, [planId]);
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages.length]);
    async function sendText(e) {
        e.preventDefault();
        if (isCompleted || sending)
            return;
        const content = text.trim();
        if (!content)
            return;
        setSending(true);
        setError(null);
        try {
            const sent = await api(`/plans/${planId}/chat`, {
                method: "POST",
                body: JSON.stringify({ content, type: "text" }),
            });
            setMessages((prev) => {
                if (prev.some((m) => m.id === sent.id))
                    return prev;
                return [...prev, sent];
            });
            setText("");
            const socket = getSocket();
            socket?.emit("plan:message", { planId, messageId: sent.id });
        }
        catch (err) {
            setError(toReadableError(err, "Failed to send message"));
        }
        finally {
            setSending(false);
        }
    }
    async function uploadAndSendImage(file) {
        if (isCompleted || uploadingImage || sending)
            return;
        if (!file.type.startsWith("image/")) {
            setError("Only image files are allowed.");
            return;
        }
        setUploadingImage(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append("image", file);
            const upload = await api(`/plans/${planId}/chat/upload`, {
                method: "POST",
                body: formData,
            });
            const sent = await api(`/plans/${planId}/chat`, {
                method: "POST",
                body: JSON.stringify({ content: upload.imageUrl, type: "image" }),
            });
            setMessages((prev) => {
                if (prev.some((m) => m.id === sent.id))
                    return prev;
                return [...prev, sent];
            });
            const socket = getSocket();
            socket?.emit("plan:message", { planId, messageId: sent.id });
        }
        catch (err) {
            setError(toReadableError(err, "Failed to send image"));
        }
        finally {
            setUploadingImage(false);
            if (fileRef.current)
                fileRef.current.value = "";
        }
    }
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-r from-rose-100 via-amber-100 to-orange-100 flex items-center justify-center", children: _jsx("p", { className: "text-slate-700", children: "Loading plan chat..." }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-r from-rose-100 via-amber-100 to-orange-100 px-3 sm:px-4 py-4 sm:py-6", children: _jsxs("div", { className: "max-w-4xl mx-auto bg-white/95 border border-amber-100 rounded-2xl shadow-sm min-h-[78vh] flex flex-col", children: [_jsxs("header", { className: "px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-lg sm:text-xl font-black text-slate-900", children: planTitle }), _jsx("p", { className: "text-xs text-slate-500", children: "Group Chat" })] }), _jsx("button", { type: "button", onClick: () => navigate("/plans"), className: "text-sm font-semibold text-slate-600 hover:text-slate-900", children: "Back" })] }), _jsxs("div", { className: "flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-3", children: [error && (_jsx("p", { className: "text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-lg p-2", children: error })), messages.length === 0 && (_jsx("p", { className: "text-sm text-slate-500", children: "No messages yet. Start the conversation." })), messages.map((m) => {
                            const mine = myUserId !== null && m.senderId === myUserId;
                            return (_jsx("div", { className: `flex ${mine ? "justify-end" : "justify-start"}`, children: _jsxs("div", { className: `max-w-[88%] sm:max-w-[76%] rounded-2xl px-3 py-2 ${mine
                                        ? "bg-orange-500 text-white rounded-br-md"
                                        : "bg-slate-100 text-slate-900 rounded-bl-md"}`, children: [_jsx("p", { className: `text-xs font-semibold ${mine ? "text-orange-100" : "text-slate-700"}`, children: mine ? "You" : m.senderName }), m.type === "image" ? (_jsx("a", { href: m.content, target: "_blank", rel: "noreferrer", children: _jsx("img", { src: m.content, alt: "Plan chat upload", className: "mt-2 max-h-64 rounded-lg object-cover border border-slate-200" }) })) : (_jsx("p", { className: "text-sm whitespace-pre-wrap break-words mt-1", children: m.content })), _jsx("p", { className: `text-[10px] mt-1 ${mine ? "text-orange-100" : "text-slate-500"}`, children: parseServerDate(m.createdAt).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            }) })] }) }, m.id));
                        }), _jsx("div", { ref: bottomRef })] }), _jsxs("footer", { className: "border-t border-slate-100 p-3", children: [isCompleted && (_jsx("p", { className: "text-xs text-slate-500 mb-2", children: "Plan completed. Chat is read-only." })), _jsxs("form", { onSubmit: sendText, className: "flex items-center gap-2", children: [_jsx("input", { ref: fileRef, type: "file", accept: "image/*", className: "hidden", onChange: (e) => {
                                        const file = e.target.files?.[0];
                                        if (file)
                                            void uploadAndSendImage(file);
                                    } }), _jsx("button", { type: "button", disabled: isCompleted || uploadingImage || sending, onClick: () => fileRef.current?.click(), className: "px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 disabled:opacity-50", children: uploadingImage ? "Uploading..." : "Image" }), _jsx("input", { type: "text", value: text, disabled: isCompleted || sending || uploadingImage, onChange: (e) => setText(e.target.value), placeholder: isCompleted ? "Plan completed" : "Message the group...", className: "flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm" }), _jsx("button", { type: "submit", disabled: isCompleted || sending || uploadingImage || !text.trim(), className: "px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold disabled:opacity-50", children: sending ? "Sending..." : "Send" })] })] })] }) }));
}
