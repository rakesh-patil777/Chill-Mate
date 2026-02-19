import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { api } from "../api";
function Row({ user, rightText, }) {
    return (_jsxs("div", { className: "flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2", children: [_jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [_jsx("img", { src: user.avatarUrl || "/default-avatar.png", alt: user.fullName, className: "w-10 h-10 rounded-full object-cover border border-slate-200" }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "font-semibold text-slate-800 truncate", children: user.fullName }), user.campusTier && (_jsx("p", { className: "text-[11px] text-slate-500", children: user.campusTier }))] })] }), _jsx("p", { className: "text-sm text-slate-600 font-semibold", children: rightText })] }));
}
export default function Leaderboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        api("/leaderboard")
            .then((resp) => setData(resp))
            .catch((err) => setError(err instanceof Error ? err.message : "Failed to load leaderboard"))
            .finally(() => setLoading(false));
    }, []);
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-r from-rose-100 via-amber-100 to-orange-100 flex items-center justify-center", children: _jsx("p", { className: "text-slate-700 font-semibold", children: "Loading leaderboard..." }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-r from-rose-100 via-amber-100 to-orange-100 px-4 py-8", children: _jsxs("div", { className: "max-w-4xl mx-auto space-y-6", children: [error && (_jsx("p", { className: "rounded-xl border border-rose-200 bg-rose-50 text-rose-700 p-3 text-sm", children: error })), _jsxs("section", { className: "rounded-2xl bg-white/90 border border-amber-100 shadow-sm p-4 space-y-3", children: [_jsx("h2", { className: "text-xl font-black text-amber-700", children: "\uD83C\uDFC6 Top Hosts" }), (data?.topHosts ?? []).map((u) => (_jsx(Row, { user: u, rightText: `${u.plansHosted ?? 0} hosted` }, `host-${u.id}`)))] }), _jsxs("section", { className: "rounded-2xl bg-white/90 border border-amber-100 shadow-sm p-4 space-y-3", children: [_jsx("h2", { className: "text-xl font-black text-slate-700", children: "\uD83D\uDEE1 Most Reliable" }), (data?.mostReliable ?? []).map((u) => (_jsx(Row, { user: u, rightText: `${u.reliabilityScore ?? 0}%` }, `rel-${u.id}`)))] }), _jsxs("section", { className: "rounded-2xl bg-white/90 border border-amber-100 shadow-sm p-4 space-y-3", children: [_jsx("h2", { className: "text-xl font-black text-orange-700", children: "\uD83D\uDD25 Most Active" }), (data?.mostActive ?? []).map((u) => (_jsx(Row, { user: u, rightText: `${u.activityScore ?? 0} pts` }, `act-${u.id}`)))] }), _jsxs("section", { className: "rounded-2xl bg-white/90 border border-amber-100 shadow-sm p-4 space-y-3", children: [_jsx("h2", { className: "text-xl font-black text-rose-700", children: "\uD83D\uDD25 Highest Streak" }), (data?.highestStreak ?? []).map((u) => (_jsx(Row, { user: u, rightText: `${u.highestStreak ?? 0} days` }, `streak-${u.id}`)))] }), _jsxs("section", { className: "rounded-2xl bg-white/90 border border-amber-100 shadow-sm p-4 space-y-3", children: [_jsx("h2", { className: "text-xl font-black text-violet-700", children: "\uD83C\uDFC6 Campus Icons" }), (data?.topCampusIcons ?? []).map((u) => (_jsx(Row, { user: u, rightText: `${u.campusScore ?? 0} pts` }, `campus-${u.id}`)))] })] }) }));
}
