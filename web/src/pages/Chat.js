import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { getSocket } from "../socket";
function parseServerDate(value) {
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
        return new Date(value.replace(" ", "T") + "Z");
    }
    return new Date(value);
}
export default function Chat() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const mode = searchParams.get("mode") === "campus" ? "campus" : "dating";
    const preferredUserId = Number(searchParams.get("userId") || 0);
    const [conversations, setConversations] = useState([]);
    const [campusPlans, setCampusPlans] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [typingPeerId, setTypingPeerId] = useState(null);
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [error, setError] = useState(null);
    const bottomRef = useRef(null);
    const myIdRef = useRef(null);
    const typingTimerRef = useRef(null);
    const imageInputRef = useRef(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const datingBg = "bg-[radial-gradient(1200px_380px_at_50%_-120px,rgba(190,24,93,0.24),transparent),linear-gradient(120deg,#f5d0fe_0%,#fbcfe8_45%,#ddd6fe_100%)]";
    const campusBg = "bg-gradient-to-b from-rose-100 via-amber-50 to-white";
    useEffect(() => {
        api("/profiles/me")
            .then((me) => {
            myIdRef.current = me.id;
        })
            .catch(() => {
            myIdRef.current = null;
        });
    }, []);
    useEffect(() => {
        let cancelled = false;
        api("/plans")
            .then((rows) => {
            if (cancelled)
                return;
            const list = (Array.isArray(rows) ? rows : []).filter((p) => Boolean(p.isJoined));
            setCampusPlans(list);
        })
            .catch(() => {
            if (!cancelled)
                setCampusPlans([]);
        });
        return () => {
            cancelled = true;
        };
    }, []);
    useEffect(() => {
        if (mode !== "dating")
            return;
        let cancelled = false;
        let timer;
        async function pollConversations() {
            try {
                const data = await api("/chat/conversations");
                const list = Array.isArray(data) ? data : [];
                if (cancelled)
                    return;
                setConversations(list);
                if (list.length === 0) {
                    setSelectedUserId(null);
                }
                else if (preferredUserId && list.some((x) => x.userId === preferredUserId)) {
                    setSelectedUserId(preferredUserId);
                }
                else if (!selectedUserId || !list.some((x) => x.userId === selectedUserId)) {
                    setSelectedUserId(list[0].userId);
                }
            }
            catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : "Failed to load chats");
                }
            }
            finally {
                if (!cancelled) {
                    setLoadingConversations(false);
                    timer = window.setTimeout(pollConversations, 7000);
                }
            }
        }
        void pollConversations();
        return () => {
            cancelled = true;
            if (timer)
                window.clearTimeout(timer);
        };
    }, [mode, preferredUserId, selectedUserId]);
    useEffect(() => {
        if (mode !== "dating")
            return;
        if (!selectedUserId)
            return;
        let cancelled = false;
        let timer;
        async function pollMessages() {
            try {
                setLoadingMessages(true);
                const data = await api(`/chat/${selectedUserId}/messages`);
                if (!cancelled)
                    setMessages(Array.isArray(data) ? data : []);
            }
            catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : "Failed to load messages");
                }
            }
            finally {
                if (!cancelled) {
                    setLoadingMessages(false);
                    timer = window.setTimeout(pollMessages, 3500);
                }
            }
        }
        void pollMessages();
        return () => {
            cancelled = true;
            if (timer)
                window.clearTimeout(timer);
        };
    }, [mode, selectedUserId]);
    useEffect(() => {
        if (mode !== "dating")
            return;
        const socket = getSocket();
        if (!socket)
            return;
        const onNewMessage = (payload) => {
            if (!selectedUserId ||
                !myIdRef.current ||
                !((payload.fromUserId === selectedUserId && payload.toUserId === myIdRef.current) ||
                    (payload.toUserId === selectedUserId && payload.fromUserId === myIdRef.current))) {
                return;
            }
            setMessages((prev) => {
                if (prev.some((m) => m.id === payload.id))
                    return prev;
                return [...prev, payload];
            });
        };
        const onTyping = (payload) => {
            if (!selectedUserId || payload.fromUserId !== selectedUserId)
                return;
            setTypingPeerId(payload.isTyping ? payload.fromUserId || null : null);
        };
        const onSeen = (payload) => {
            if (!selectedUserId || payload.fromUserId !== selectedUserId)
                return;
            setMessages((prev) => {
                const next = [...prev];
                for (let i = next.length - 1; i >= 0; i -= 1) {
                    if (next[i].toUserId === selectedUserId) {
                        next[i] = { ...next[i], seenAt: new Date().toISOString() };
                        break;
                    }
                }
                return next;
            });
        };
        socket.on("chat:new-message", onNewMessage);
        socket.on("chat:typing", onTyping);
        socket.on("chat:seen", onSeen);
        return () => {
            socket.off("chat:new-message", onNewMessage);
            socket.off("chat:typing", onTyping);
            socket.off("chat:seen", onSeen);
        };
    }, [mode, selectedUserId]);
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages.length, typingPeerId]);
    const selectedConversation = useMemo(() => conversations.find((c) => c.userId === selectedUserId) || null, [conversations, selectedUserId]);
    const myLastMessage = useMemo(() => {
        const mine = [...messages].reverse().find((m) => m.toUserId === selectedUserId);
        return mine || null;
    }, [messages, selectedUserId]);
    async function sendMessage(e) {
        e.preventDefault();
        if (!selectedUserId)
            return;
        const payload = text.trim();
        if (!payload)
            return;
        setText("");
        try {
            const sent = await api(`/chat/${selectedUserId}/messages`, {
                method: "POST",
                body: JSON.stringify({ text: payload }),
            });
            setMessages((prev) => {
                if (prev.some((m) => m.id === sent.id))
                    return prev;
                return [...prev, sent];
            });
            setSearchParams({ mode: "dating", userId: String(selectedUserId) });
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Failed to send message");
            setText(payload);
        }
    }
    async function uploadAndSendImage(file) {
        if (!selectedUserId)
            return;
        if (!file.type.startsWith("image/")) {
            setError("Only image files are allowed.");
            return;
        }
        setUploadingImage(true);
        try {
            const formData = new FormData();
            formData.append("image", file);
            const upload = await api("/chat/upload", {
                method: "POST",
                body: formData,
            });
            const sent = await api(`/chat/${selectedUserId}/messages`, {
                method: "POST",
                body: JSON.stringify({ text: upload.imageUrl, type: "image" }),
            });
            setMessages((prev) => {
                if (prev.some((m) => m.id === sent.id))
                    return prev;
                return [...prev, sent];
            });
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Failed to send image");
        }
        finally {
            setUploadingImage(false);
            if (imageInputRef.current)
                imageInputRef.current.value = "";
        }
    }
    function handleTyping(value) {
        setText(value);
        if (!selectedUserId)
            return;
        const socket = getSocket();
        if (!socket)
            return;
        socket.emit("chat:typing", { toUserId: selectedUserId, isTyping: true });
        if (typingTimerRef.current)
            window.clearTimeout(typingTimerRef.current);
        typingTimerRef.current = window.setTimeout(() => {
            socket.emit("chat:typing", { toUserId: selectedUserId, isTyping: false });
        }, 1200);
    }
    return (_jsxs("div", { className: `min-h-screen ${mode === "dating" ? datingBg : campusBg} px-2 sm:px-4 py-4 sm:py-6`, children: [_jsx("div", { className: "max-w-6xl mx-auto mb-3", children: _jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.24em] text-slate-500", children: mode === "campus" ? "Campus Chats" : "Dating Chats" }) }), mode === "campus" ? (_jsxs("div", { className: "max-w-6xl mx-auto bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6", children: [_jsx("h2", { className: "text-xl font-black text-slate-900", children: "Campus Plan Chats" }), _jsx("p", { className: "mt-1 text-sm text-slate-600", children: "Open chat rooms for plans you joined." }), campusPlans.length === 0 ? (_jsx("p", { className: "mt-4 text-sm text-slate-500", children: "No joined plan chats yet." })) : (_jsx("div", { className: "mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3", children: campusPlans.map((plan) => {
                            const started = plan.startAt ? parseServerDate(plan.startAt).getTime() < Date.now() : false;
                            const completed = String(plan.status ?? "").toLowerCase() === "completed" || started;
                            return (_jsxs("button", { type: "button", onClick: () => navigate(`/plans/${plan.id}/chat`), className: "text-left rounded-xl border border-slate-200 bg-slate-50 p-3 hover:bg-slate-100 transition", children: [_jsx("p", { className: "text-sm font-semibold text-slate-900", children: plan.title }), _jsx("p", { className: "text-xs text-slate-500 mt-1", children: plan.startAt
                                            ? parseServerDate(plan.startAt).toLocaleString([], {
                                                month: "short",
                                                day: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })
                                            : "TBA" }), _jsx("span", { className: `mt-2 inline-block text-[11px] px-2 py-0.5 rounded-full ${completed ? "bg-slate-200 text-slate-600" : "bg-orange-100 text-orange-700"}`, children: completed ? "Completed" : "Open chat" })] }, plan.id));
                        }) }))] })) : (_jsxs("div", { className: "max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[300px_1fr] gap-3 sm:gap-4", children: [_jsxs("aside", { className: "bg-white rounded-2xl border border-slate-100 p-3 shadow-sm", children: [_jsx("h2", { className: "text-lg font-bold text-slate-900 px-2 py-1", children: "Chats" }), loadingConversations ? (_jsx("p", { className: "px-2 py-4 text-sm text-slate-500", children: "Loading chats..." })) : conversations.length === 0 ? (_jsx("p", { className: "px-2 py-4 text-sm text-slate-500", children: "No chats yet." })) : (_jsx("div", { className: "mt-2 space-y-1", children: conversations.map((c) => (_jsxs("button", { type: "button", onClick: () => {
                                        setSelectedUserId(c.userId);
                                        setSearchParams({ mode: "dating", userId: String(c.userId) });
                                    }, className: `w-full text-left px-2 py-2 rounded-xl transition ${c.userId === selectedUserId ? "bg-rose-100" : "hover:bg-slate-50"}`, children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("span", { className: "text-sm font-semibold text-slate-900 truncate", children: c.fullName }), (c.unreadCount ?? 0) > 0 && (_jsx("span", { className: "text-[11px] bg-rose-500 text-white rounded-full px-2 py-0.5", children: c.unreadCount }))] }), _jsx("p", { className: "text-xs text-slate-500 truncate mt-1", children: c.lastMessage || "Start chatting" })] }, c.userId))) }))] }), _jsxs("section", { className: "bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col min-h-[76vh]", children: [_jsxs("header", { className: "px-4 py-3 border-b border-slate-100", children: [_jsx("h3", { className: "font-bold text-slate-900", children: selectedConversation ? selectedConversation.fullName : "Select a chat" }), selectedConversation && (_jsxs("p", { className: "text-xs text-slate-500", children: ["Age ", selectedConversation.age] }))] }), _jsxs("div", { className: "flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-2", children: [error && (_jsx("p", { className: "text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-lg p-2", children: error })), loadingMessages && selectedUserId && (_jsx("p", { className: "text-xs text-slate-500", children: "Syncing messages..." })), selectedUserId && messages.length === 0 && !loadingMessages && (_jsx("p", { className: "text-sm text-slate-500", children: "Say hi to start the conversation." })), messages.map((m) => {
                                        const mine = m.toUserId === selectedUserId;
                                        return (_jsx("div", { className: `flex ${mine ? "justify-end" : "justify-start"}`, children: _jsxs("div", { className: `max-w-[84%] sm:max-w-[78%] px-3 py-2 rounded-2xl ${mine
                                                    ? "bg-rose-500 text-white rounded-br-md"
                                                    : "bg-slate-100 text-slate-900 rounded-bl-md"}`, children: [m.type === "image" ? (_jsx("a", { href: m.text, target: "_blank", rel: "noreferrer", children: _jsx("img", { src: m.text, alt: "Chat upload", className: "max-h-64 rounded-lg object-cover border border-slate-200" }) })) : (_jsx("p", { className: "text-sm whitespace-pre-wrap break-words", children: m.text })), _jsx("p", { className: `text-[10px] mt-1 ${mine ? "text-rose-100" : "text-slate-500"}`, children: parseServerDate(m.createdAt).toLocaleTimeString([], {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        }) })] }) }, m.id));
                                    }), typingPeerId && (_jsx("p", { className: "text-xs text-slate-500 px-1", children: "Typing..." })), _jsx("div", { ref: bottomRef })] }), _jsxs("footer", { className: "border-t border-slate-100 p-3", children: [selectedUserId && myLastMessage && (_jsx("p", { className: "text-[11px] text-slate-500 mb-2", children: myLastMessage.seenAt ? "Seen" : "Sent" })), _jsxs("form", { onSubmit: sendMessage, className: "flex gap-2", children: [_jsx("input", { ref: imageInputRef, type: "file", accept: "image/*", className: "hidden", onChange: (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file)
                                                        void uploadAndSendImage(file);
                                                } }), _jsx("button", { type: "button", disabled: !selectedUserId || uploadingImage, onClick: () => imageInputRef.current?.click(), className: "px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold disabled:opacity-50", children: uploadingImage ? "Uploading..." : "Image" }), _jsx("input", { type: "text", value: text, disabled: !selectedUserId || uploadingImage, onChange: (e) => handleTyping(e.target.value), className: "flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm", placeholder: selectedUserId ? "Write a message..." : "Select a chat first" }), _jsx("button", { type: "submit", disabled: !selectedUserId || !text.trim() || uploadingImage, className: "px-4 py-2 rounded-xl bg-rose-500 text-white text-sm font-semibold disabled:opacity-50", children: "Send" })] })] })] })] }))] }));
}
