import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api";

type NotificationItem = {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  referenceId?: number | null;
  isRead: boolean;
  createdAt: string;
};

type AlertSummary = {
  total: number;
  newMessageCount: number;
  datingMessageCount?: number;
  campusMessageCount?: number;
  likesYouCount: number;
  newMatchCount: number;
  campusNotificationCount?: number;
  activityNotificationCount?: number;
};

const typeMeta: Record<
  string,
  { icon: string; group: "dating" | "campus" | "activity"; borderClass: string }
> = {
  like: { icon: "💖", group: "dating", borderClass: "border-rose-300" },
  match: { icon: "🎉", group: "dating", borderClass: "border-pink-300" },
  plan_join: { icon: "🎓", group: "campus", borderClass: "border-amber-300" },
  plan_near_full: { icon: "🔥", group: "campus", borderClass: "border-orange-300" },
  streak_warning: { icon: "🔥", group: "activity", borderClass: "border-violet-300" },
};

function parseServerDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
    return new Date(value.replace(" ", "T") + "Z");
  }
  return new Date(value);
}

export default function Alerts() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") === "campus" ? "campus" : "dating";
  const datingBg =
    "bg-[radial-gradient(1200px_380px_at_50%_-120px,rgba(190,24,93,0.24),transparent),linear-gradient(120deg,#f5d0fe_0%,#fbcfe8_45%,#ddd6fe_100%)]";
  const campusBg = "bg-gradient-to-b from-rose-100 via-amber-50 to-white";
  const [summary, setSummary] = useState<AlertSummary | null>(null);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [marking, setMarking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  async function loadData() {
    const [summaryData, list] = await Promise.all([
      api<AlertSummary>("/notifications/summary"),
      api<NotificationItem[]>("/notifications"),
    ]);
    setSummary(summaryData);
    setItems(Array.isArray(list) ? list : []);
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadData()
      .catch(() => {
        if (!cancelled) {
          setSummary(null);
          setItems([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const grouped = useMemo(() => {
    const dating: NotificationItem[] = [];
    const campus: NotificationItem[] = [];
    const activity: NotificationItem[] = [];

    for (const item of items) {
      const meta = typeMeta[item.type];
      if (!meta) {
        activity.push(item);
        continue;
      }
      if (meta.group === "dating") dating.push(item);
      if (meta.group === "campus") campus.push(item);
      if (meta.group === "activity") activity.push(item);
    }

    return { dating, campus, activity };
  }, [items]);

  return (
    <div className={`min-h-screen ${mode === "dating" ? datingBg : campusBg} px-4 py-8`}>
      <div className="max-w-3xl mx-auto rounded-3xl bg-white border border-slate-100 shadow-sm p-6">
        <h1 className="text-3xl font-black text-slate-900">Alerts</h1>
        <p className="mt-1 text-sm text-slate-600">
          {mode === "campus" ? "Campus alerts" : "Dating alerts"}
        </p>

        <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-700">
            Unread chat messages: {summary?.newMessageCount ?? 0}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Dating: {summary?.datingMessageCount ?? 0} | Campus: {summary?.campusMessageCount ?? 0}
          </p>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-slate-500">Loading alerts...</p>
        ) : (
          <div className="mt-6 space-y-6">
            <section>
              <h2 className="text-sm font-black uppercase tracking-wide text-rose-700">💖 Dating</h2>
              {grouped.dating.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">No dating alerts.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {grouped.dating.map((item) => {
                    const meta = typeMeta[item.type];
                    return (
                      <div
                        key={item.id}
                        className={`rounded-xl border-l-4 ${meta?.borderClass ?? "border-slate-300"} bg-white border border-slate-100 p-3`}
                      >
                        <p className="text-sm font-semibold text-slate-900">
                          {meta?.icon ?? "🔔"} {item.title}
                        </p>
                        <p className="text-sm text-slate-600 mt-0.5">{item.message}</p>
                        <p className="text-[11px] text-slate-500 mt-1.5">
                          {parseServerDate(item.createdAt).toLocaleString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-sm font-black uppercase tracking-wide text-amber-700">🎓 Campus</h2>
              {grouped.campus.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">No campus alerts.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {grouped.campus.map((item) => {
                    const meta = typeMeta[item.type];
                    return (
                      <div
                        key={item.id}
                        className={`rounded-xl border-l-4 ${meta?.borderClass ?? "border-slate-300"} bg-white border border-slate-100 p-3`}
                      >
                        <p className="text-sm font-semibold text-slate-900">
                          {meta?.icon ?? "🔔"} {item.title}
                        </p>
                        <p className="text-sm text-slate-600 mt-0.5">{item.message}</p>
                        <p className="text-[11px] text-slate-500 mt-1.5">
                          {parseServerDate(item.createdAt).toLocaleString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-sm font-black uppercase tracking-wide text-violet-700">🔥 Activity</h2>
              {grouped.activity.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">No activity alerts.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {grouped.activity.map((item) => {
                    const meta = typeMeta[item.type];
                    return (
                      <div
                        key={item.id}
                        className={`rounded-xl border-l-4 ${meta?.borderClass ?? "border-slate-300"} bg-white border border-slate-100 p-3`}
                      >
                        <p className="text-sm font-semibold text-slate-900">
                          {meta?.icon ?? "🔔"} {item.title}
                        </p>
                        <p className="text-sm text-slate-600 mt-0.5">{item.message}</p>
                        <p className="text-[11px] text-slate-500 mt-1.5">
                          {parseServerDate(item.createdAt).toLocaleString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        <p className="mt-6 text-sm font-semibold text-slate-700">Overall total unread: {summary?.total ?? 0}</p>
        {message && <p className="mt-2 text-xs text-slate-600">{message}</p>}

        <button
          type="button"
          disabled={marking}
          className="mt-4 px-4 py-2 rounded-xl bg-pink-600 text-white font-semibold hover:bg-pink-700 disabled:opacity-60"
          onClick={async () => {
            try {
              setMarking(true);
              setMessage(null);
              await api("/notifications/read", { method: "POST" });
              await loadData();
              setMessage("All alerts marked as read.");
            } catch {
              setMessage("Could not mark alerts as read. Try again.");
            } finally {
              setMarking(false);
            }
          }}
        >
          {marking ? "Marking..." : "Mark all as read"}
        </button>
      </div>
    </div>
  );
}
