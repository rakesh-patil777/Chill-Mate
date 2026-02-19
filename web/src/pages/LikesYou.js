import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { api } from "../api";
import { Link, useNavigate } from "react-router-dom";
export default function LikesYou() {
    const navigate = useNavigate();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isPremium, setIsPremium] = useState(false);
    useEffect(() => {
        Promise.all([
            api("/likes/received"),
            api("/premium/status"),
        ])
            .then(([likes, premium]) => {
            setRows(Array.isArray(likes) ? likes : []);
            setIsPremium(Boolean(premium?.isPremium));
        })
            .catch((err) => {
            setError(err instanceof Error ? err.message : "Failed to load likes");
            setRows([]);
        })
            .finally(() => setLoading(false));
    }, []);
    if (loading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-[radial-gradient(1200px_380px_at_50%_-120px,rgba(190,24,93,0.24),transparent),linear-gradient(120deg,#f5d0fe_0%,#fbcfe8_45%,#ddd6fe_100%)]", children: _jsx("p", { className: "text-slate-700", children: "Loading likes..." }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-[radial-gradient(1200px_380px_at_50%_-120px,rgba(190,24,93,0.24),transparent),linear-gradient(120deg,#f5d0fe_0%,#fbcfe8_45%,#ddd6fe_100%)] px-4 py-8", children: _jsxs("div", { className: "max-w-6xl mx-auto", children: [_jsxs("div", { className: "rounded-3xl bg-white/80 border border-white shadow-md p-6 sm:p-8", children: [_jsx("p", { className: "text-xs uppercase tracking-[0.35em] text-rose-600 font-semibold", children: "Likes" }), _jsx("h1", { className: "mt-2 text-3xl sm:text-4xl text-slate-900 font-black", children: "People Who Liked You" }), _jsx("p", { className: "mt-2 text-slate-600", children: "Free plan shows blurred previews. Premium reveals full details." })] }), !isPremium && (_jsxs("div", { className: "mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 flex items-center justify-between gap-3", children: [_jsx("p", { className: "text-sm text-amber-800", children: "Upgrade to see who liked you." }), _jsx(Link, { to: "/premium", className: "px-3 py-1.5 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600", children: "Upgrade" })] })), error && (_jsx("p", { className: "mt-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 p-3", children: error })), rows.length === 0 ? (_jsxs("div", { className: "mt-8 rounded-3xl bg-white p-8 text-center shadow-sm border border-slate-100", children: [_jsx("p", { className: "text-lg text-slate-700 font-semibold", children: "No incoming likes yet." }), _jsx("p", { className: "mt-2 text-slate-500", children: "Keep your profile active to get more visibility." })] })) : (_jsx("div", { className: "mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5", children: rows.map((row, idx) => (_jsxs("article", { className: `group relative overflow-hidden rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl transition duration-300 animate-[fadeIn_240ms_ease-out] ${isPremium && !row.isBlurred ? "cursor-pointer" : ""}`, style: { animationDelay: `${idx * 45}ms` }, onClick: () => {
                            if (!isPremium || row.isBlurred)
                                return;
                            navigate(`/discover/user/${row.userId}`);
                        }, children: [_jsx("div", { className: "absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-rose-300 to-amber-200 opacity-60" }), _jsxs("div", { className: "relative p-5", children: [_jsx("img", { src: row.avatarUrl || "/default-avatar.png", alt: "Blurred profile preview", className: `w-24 h-24 rounded-full object-cover border-4 border-white shadow-md ${row.isBlurred ? "blur-md scale-[1.04]" : ""}` }), _jsxs("h2", { className: "mt-4 text-xl font-extrabold text-slate-900", children: [row.canReveal ? row.fullName : "Hidden", ", ", row.age] }), _jsx("p", { className: "mt-2 text-sm text-slate-600 min-h-[40px] line-clamp-2", children: row.bio || "No bio yet." }), _jsxs("div", { className: "mt-4 flex items-center justify-between", children: [_jsx("span", { className: "text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-full px-2.5 py-1", children: row.reaction === "superlike" ? "Super Like" : "Like" }), row.createdAt && (_jsx("span", { className: "text-xs text-slate-500", children: new Date(row.createdAt).toLocaleDateString() }))] })] })] }, `${row.userId}-${row.createdAt ?? ""}`))) }))] }) }));
}
