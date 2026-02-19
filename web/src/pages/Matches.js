import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { Link } from "react-router-dom";
export default function Matches() {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        api("/matches")
            .then((data) => {
            setMatches(Array.isArray(data) ? data : []);
        })
            .catch((err) => {
            setError(err instanceof Error ? err.message : "Failed to load matches");
            setMatches([]);
        })
            .finally(() => setLoading(false));
    }, []);
    const newest = useMemo(() => matches[0], [matches]);
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-[radial-gradient(1200px_380px_at_50%_-120px,rgba(190,24,93,0.24),transparent),linear-gradient(120deg,#f5d0fe_0%,#fbcfe8_45%,#ddd6fe_100%)] flex items-center justify-center", children: _jsx("p", { className: "text-slate-700 text-lg animate-pulse", children: "Loading matches..." }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-[radial-gradient(1200px_380px_at_50%_-120px,rgba(190,24,93,0.24),transparent),linear-gradient(120deg,#f5d0fe_0%,#fbcfe8_45%,#ddd6fe_100%)] px-4 sm:px-6 py-8", children: _jsxs("div", { className: "max-w-6xl mx-auto", children: [_jsxs("div", { className: "rounded-3xl bg-white/80 border border-white shadow-md p-6 sm:p-8", children: [_jsx("p", { className: "text-xs uppercase tracking-[0.35em] text-rose-600 font-semibold", children: "Connections" }), _jsx("h1", { className: "mt-2 text-3xl sm:text-4xl text-slate-900 font-black", children: "Your Matches" }), _jsx("p", { className: "mt-2 text-slate-600", children: matches.length > 0
                                ? `You have ${matches.length} match${matches.length > 1 ? "es" : ""}.`
                                : "No matches yet. Keep swiping to find someone." }), newest?.createdAt && (_jsxs("p", { className: "mt-1 text-sm text-slate-500", children: ["Latest match:", " ", new Date(newest.createdAt).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                })] }))] }), error && (_jsx("div", { className: "mt-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 p-3", children: error })), matches.length === 0 ? (_jsxs("div", { className: "mt-8 rounded-3xl bg-white p-8 text-center shadow-sm border border-slate-100", children: [_jsx("p", { className: "text-lg text-slate-700 font-semibold", children: "No matches yet." }), _jsx("p", { className: "mt-2 text-slate-500", children: "Swipe right or super-like profiles in Discover." })] })) : (_jsx("div", { className: "mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5", children: matches.map((m, idx) => (_jsxs("article", { className: "group relative overflow-hidden rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl transition duration-300 animate-[fadeIn_240ms_ease-out]", style: { animationDelay: `${idx * 45}ms` }, children: [_jsx("div", { className: "absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-rose-300 to-amber-200 opacity-60" }), _jsxs("div", { className: "relative p-5", children: [_jsx("img", { src: m.avatarUrl || "/default-avatar.png", alt: m.fullName, className: "w-24 h-24 rounded-full object-cover border-4 border-white shadow-md" }), _jsxs("h2", { className: "mt-4 text-xl font-extrabold text-slate-900", children: [m.fullName, ", ", m.age] }), _jsx("p", { className: "mt-2 text-sm text-slate-600 min-h-[40px] line-clamp-2", children: m.bio || "No bio yet." }), _jsxs("div", { className: "mt-4 flex items-center justify-between", children: [_jsx("span", { className: "text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-full px-2.5 py-1", children: "Matched" }), m.createdAt && (_jsx("span", { className: "text-xs text-slate-500", children: new Date(m.createdAt).toLocaleDateString() }))] }), _jsx(Link, { to: `/chat?userId=${m.userId}`, className: "mt-4 inline-block text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 px-3 py-1.5 rounded-lg transition", children: "Message" })] })] }, m.id))) }))] }) }));
}
