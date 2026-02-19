import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { getSocket } from "../socket";

type PlanChatMessage = {
  id: number;
  planId: number;
  senderId: number;
  senderName: string;
  content: string;
  type: "text" | "image";
  createdAt: string;
};

type PlanChatResponse = {
  planId: number;
  planTitle: string;
  planStatus?: string | null;
  startAt?: string | null;
  messages: PlanChatMessage[];
};

function parseServerDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
    return new Date(value.replace(" ", "T") + "Z");
  }
  return new Date(value);
}

function toReadableError(err: unknown, fallback: string) {
  const raw = err instanceof Error ? err.message : fallback;
  try {
    const parsed = JSON.parse(raw) as { error?: string };
    if (parsed?.error) return parsed.error;
  } catch {
  }
  return raw || fallback;
}

export default function PlanChat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const planId = Number(id);
  const [planTitle, setPlanTitle] = useState("Plan Chat");
  const [planStatus, setPlanStatus] = useState<string | null>(null);
  const [startAt, setStartAt] = useState<string | null>(null);
  const [messages, setMessages] = useState<PlanChatMessage[]>([]);
  const [myUserId, setMyUserId] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const isCompleted = useMemo(() => {
    const completed = String(planStatus ?? "").toLowerCase() === "completed";
    const started = startAt ? Date.parse(startAt) < Date.now() : false;
    return completed || started;
  }, [planStatus, startAt]);

  useEffect(() => {
    api<{ id: number }>("/profiles/me")
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
    api<PlanChatResponse>(`/plans/${planId}/chat`)
      .then((data) => {
        if (!mounted) return;
        setPlanTitle(data.planTitle || "Plan Chat");
        setPlanStatus(data.planStatus ?? null);
        setStartAt(data.startAt ?? null);
        setMessages(Array.isArray(data.messages) ? data.messages : []);
      })
      .catch((err) => {
        if (!mounted) return;
        const readable = toReadableError(err, "Failed to load plan chat");
        if (readable.toLowerCase().includes("only attendees can access plan chat")) {
          setError("Only attendees can access plan chat.");
          return;
        }
        setError(readable);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [planId]);

  useEffect(() => {
    if (!Number.isInteger(planId) || planId <= 0) return;
    const socket = getSocket();
    if (!socket) return;

    socket.emit(
      "plan:join",
      { planId },
      (ack: { ok: boolean; error?: string }) => {
        if (!ack?.ok) {
          if ((ack.error ?? "").toLowerCase().includes("not an attendee")) {
            setError("Only attendees can access plan chat.");
          } else if (ack?.error) {
            setError(ack.error);
          }
        }
      }
    );

    const onMessage = (incoming: PlanChatMessage) => {
      if (incoming.planId !== planId) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === incoming.id)) return prev;
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

  async function sendText(e: FormEvent) {
    e.preventDefault();
    if (isCompleted || sending) return;
    const content = text.trim();
    if (!content) return;

    setSending(true);
    setError(null);
    try {
      const sent = await api<PlanChatMessage>(`/plans/${planId}/chat`, {
        method: "POST",
        body: JSON.stringify({ content, type: "text" }),
      });
      setMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev;
        return [...prev, sent];
      });
      setText("");

      const socket = getSocket();
      socket?.emit("plan:message", { planId, messageId: sent.id });
    } catch (err) {
      setError(toReadableError(err, "Failed to send message"));
    } finally {
      setSending(false);
    }
  }

  async function uploadAndSendImage(file: File) {
    if (isCompleted || uploadingImage || sending) return;
    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed.");
      return;
    }

    setUploadingImage(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const upload = await api<{ imageUrl: string }>(`/plans/${planId}/chat/upload`, {
        method: "POST",
        body: formData,
      });

      const sent = await api<PlanChatMessage>(`/plans/${planId}/chat`, {
        method: "POST",
        body: JSON.stringify({ content: upload.imageUrl, type: "image" }),
      });

      setMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev;
        return [...prev, sent];
      });

      const socket = getSocket();
      socket?.emit("plan:message", { planId, messageId: sent.id });
    } catch (err) {
      setError(toReadableError(err, "Failed to send image"));
    } finally {
      setUploadingImage(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-rose-100 via-amber-100 to-orange-100 flex items-center justify-center">
        <p className="text-slate-700">Loading plan chat...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-rose-100 via-amber-100 to-orange-100 px-3 sm:px-4 py-4 sm:py-6">
      <div className="max-w-4xl mx-auto bg-white/95 border border-amber-100 rounded-2xl shadow-sm min-h-[78vh] flex flex-col">
        <header className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900">{planTitle}</h1>
            <p className="text-xs text-slate-500">Group Chat</p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/plans")}
            className="text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            Back
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-3">
          {error && (
            <p className="text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-lg p-2">
              {error}
            </p>
          )}
          {messages.length === 0 && (
            <p className="text-sm text-slate-500">No messages yet. Start the conversation.</p>
          )}
          {messages.map((m) => {
            const mine = myUserId !== null && m.senderId === myUserId;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[88%] sm:max-w-[76%] rounded-2xl px-3 py-2 ${
                    mine
                      ? "bg-orange-500 text-white rounded-br-md"
                      : "bg-slate-100 text-slate-900 rounded-bl-md"
                  }`}
                >
                  <p className={`text-xs font-semibold ${mine ? "text-orange-100" : "text-slate-700"}`}>
                    {mine ? "You" : m.senderName}
                  </p>
                  {m.type === "image" ? (
                    <a href={m.content} target="_blank" rel="noreferrer">
                      <img
                        src={m.content}
                        alt="Plan chat upload"
                        className="mt-2 max-h-64 rounded-lg object-cover border border-slate-200"
                      />
                    </a>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap break-words mt-1">
                      {m.content}
                    </p>
                  )}
                  <p className={`text-[10px] mt-1 ${mine ? "text-orange-100" : "text-slate-500"}`}>
                    {parseServerDate(m.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <footer className="border-t border-slate-100 p-3">
          {isCompleted && (
            <p className="text-xs text-slate-500 mb-2">Plan completed. Chat is read-only.</p>
          )}
          <form onSubmit={sendText} className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadAndSendImage(file);
              }}
            />
            <button
              type="button"
              disabled={isCompleted || uploadingImage || sending}
              onClick={() => fileRef.current?.click()}
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 disabled:opacity-50"
            >
              {uploadingImage ? "Uploading..." : "Image"}
            </button>
            <input
              type="text"
              value={text}
              disabled={isCompleted || sending || uploadingImage}
              onChange={(e) => setText(e.target.value)}
              placeholder={isCompleted ? "Plan completed" : "Message the group..."}
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={isCompleted || sending || uploadingImage || !text.trim()}
              className="px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
}
