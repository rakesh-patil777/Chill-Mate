import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api";
const typeMeta = {
    like: { icon: "💖", group: "dating", borderClass: "border-rose-300" },
    match: { icon: "🎉", group: "dating", borderClass: "border-pink-300" },
    plan_join: { icon: "🎓", group: "campus", borderClass: "border-amber-300" },
    plan_near_full: { icon: "🔥", group: "campus", borderClass: "border-orange-300" },
    streak_warning: { icon: "🔥", group: "activity", borderClass: "border-violet-300" },
};
function parseServerDate(value) {
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
        return new Date(value.replace(" ", "T") + "Z");
    }
    return new Date(value);
}
export default function Alerts() {
    const [searchParams] = useSearchParams();
    const mode = searchParams.get("mode") === "campus" ? "campus" : "dating";
    const datingBg = "bg-[radial-gradient(1200px_380px_at_50%_-120px,rgba(190,24,93,0.24),transparent),linear-gradient(120deg,#f5d0fe_0%,#fbcfe8_45%,#ddd6fe_100%)]";
    const campusBg = "bg-gradient-to-b from-rose-100 via-amber-50 to-white";
    const [summary, setSummary] = useState(null);
    const [items, setItems] = useState([]);
    const [marking, setMarking] = useState(false);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);
    async function loadData() {
        const [summaryData, list] = await Promise.all([
            api("/notifications/summary"),
            api("/notifications"),
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
            if (!cancelled)
                setLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, []);
    const grouped = useMemo(() => {
        const dating = [];
        const campus = [];
        const activity = [];
        for (const item of items) {
            const meta = typeMeta[item.type];
            if (!meta) {
                activity.push(item);
                continue;
            }
            if (meta.group === "dating")
                dating.push(item);
            if (meta.group === "campus")
                campus.push(item);
            if (meta.group === "activity")
                activity.push(item);
        }
        return { dating, campus, activity };
    }, [items]);
    return (_jsx("div", { className: `min-h-screen ${mode === "dating" ? datingBg : campusBg} px-4 py-8`, children: _jsxs("div", { className: "max-w-3xl mx-auto rounded-3xl bg-white border border-slate-100 shadow-sm p-6", children: [_jsx("h1", { className: "text-3xl font-black text-slate-900", children: "Alerts" }), _jsx("p", { className: "mt-1 text-sm text-slate-600", children: mode === "campus" ? "Campus alerts" : "Dating alerts" }), _jsxs("div", { className: "mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4", children: [_jsxs("p", { className: "text-sm font-semibold text-slate-700", children: ["Unread chat messages: ", summary?.newMessageCount ?? 0] }), _jsxs("p", { className: "text-xs text-slate-500 mt-1", children: ["Dating: ", summary?.datingMessageCount ?? 0, " | Campus: ", summary?.campusMessageCount ?? 0] })] }), loading ? (_jsx("p", { className: "mt-6 text-sm text-slate-500", children: "Loading alerts..." })) : (_jsxs("div", { className: "mt-6 space-y-6", children: [_jsxs("section", { children: [_jsx("h2", { className: "text-sm font-black uppercase tracking-wide text-rose-700", children: "\uD83D\uDC96 Dating" }), grouped.dating.length === 0 ? (_jsx("p", { className: "mt-2 text-sm text-slate-500", children: "No dating alerts." })) : (_jsx("div", { className: "mt-2 space-y-2", children: grouped.dating.map((item) => {
                                        const meta = typeMeta[item.type];
                                        return (_jsxs("div", { className: `rounded-xl border-l-4 ${meta?.borderClass ?? "border-slate-300"} bg-white border border-slate-100 p-3`, children: [_jsxs("p", { className: "text-sm font-semibold text-slate-900", children: [meta?.icon ?? "🔔", " ", item.title] }), _jsx("p", { className: "text-sm text-slate-600 mt-0.5", children: item.message }), _jsx("p", { className: "text-[11px] text-slate-500 mt-1.5", children: parseServerDate(item.createdAt).toLocaleString() })] }, item.id));
                                    }) }))] }), _jsxs("section", { children: [_jsx("h2", { className: "text-sm font-black uppercase tracking-wide text-amber-700", children: "\uD83C\uDF93 Campus" }), grouped.campus.length === 0 ? (_jsx("p", { className: "mt-2 text-sm text-slate-500", children: "No campus alerts." })) : (_jsx("div", { className: "mt-2 space-y-2", children: grouped.campus.map((item) => {
                                        const meta = typeMeta[item.type];
                                        return (_jsxs("div", { className: `rounded-xl border-l-4 ${meta?.borderClass ?? "border-slate-300"} bg-white border border-slate-100 p-3`, children: [_jsxs("p", { className: "text-sm font-semibold text-slate-900", children: [meta?.icon ?? "🔔", " ", item.title] }), _jsx("p", { className: "text-sm text-slate-600 mt-0.5", children: item.message }), _jsx("p", { className: "text-[11px] text-slate-500 mt-1.5", children: parseServerDate(item.createdAt).toLocaleString() })] }, item.id));
                                    }) }))] }), _jsxs("section", { children: [_jsx("h2", { className: "text-sm font-black uppercase tracking-wide text-violet-700", children: "\uD83D\uDD25 Activity" }), grouped.activity.length === 0 ? (_jsx("p", { className: "mt-2 text-sm text-slate-500", children: "No activity alerts." })) : (_jsx("div", { className: "mt-2 space-y-2", children: grouped.activity.map((item) => {
                                        const meta = typeMeta[item.type];
                                        return (_jsxs("div", { className: `rounded-xl border-l-4 ${meta?.borderClass ?? "border-slate-300"} bg-white border border-slate-100 p-3`, children: [_jsxs("p", { className: "text-sm font-semibold text-slate-900", children: [meta?.icon ?? "🔔", " ", item.title] }), _jsx("p", { className: "text-sm text-slate-600 mt-0.5", children: item.message }), _jsx("p", { className: "text-[11px] text-slate-500 mt-1.5", children: parseServerDate(item.createdAt).toLocaleString() })] }, item.id));
                                    }) }))] })] })), _jsxs("p", { className: "mt-6 text-sm font-semibold text-slate-700", children: ["Overall total unread: ", summary?.total ?? 0] }), message && _jsx("p", { className: "mt-2 text-xs text-slate-600", children: message }), _jsx("button", { type: "button", disabled: marking, className: "mt-4 px-4 py-2 rounded-xl bg-pink-600 text-white font-semibold hover:bg-pink-700 disabled:opacity-60", onClick: async () => {
                        try {
                            setMarking(true);
                            setMessage(null);
                            await api("/notifications/read", { method: "POST" });
                            await loadData();
                            setMessage("All alerts marked as read.");
                        }
                        catch {
                            setMessage("Could not mark alerts as read. Try again.");
                        }
                        finally {
                            setMarking(false);
                        }
                    }, children: marking ? "Marking..." : "Mark all as read" })] }) }));
}
