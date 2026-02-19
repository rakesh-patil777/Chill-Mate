import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
export default function DiscoverUserDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const userId = Number(id);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!Number.isInteger(userId) || userId <= 0) {
            setError("Invalid profile");
            setLoading(false);
            return;
        }
        api(`/profiles/${userId}`)
            .then((data) => setUser(data))
            .catch((err) => setError(err instanceof Error ? err.message : "Failed to load profile"))
            .finally(() => setLoading(false));
    }, [userId]);
    const chips = useMemo(() => {
        if (!user)
            return [];
        const values = [user.gender, user.branch, user.year ? `Year ${user.year}` : null].filter(Boolean);
        return values;
    }, [user]);
    async function react(reaction) {
        if (!user || acting)
            return;
        setActing(true);
        try {
            await api("/likes", {
                method: "POST",
                body: JSON.stringify({ targetUserId: user.id, reaction }),
            });
            navigate("/discover");
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Action failed");
            setActing(false);
        }
    }
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-fuchsia-100 via-pink-100 to-violet-100 flex items-center justify-center", children: _jsx("p", { className: "text-slate-700 font-semibold", children: "Loading profile..." }) }));
    }
    if (!user) {
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-fuchsia-100 via-pink-100 to-violet-100 flex items-center justify-center", children: _jsx("p", { className: "text-rose-700", children: error || "Profile not found." }) }));
    }
    const interestList = (user.interests || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    const hobbyList = (user.hobbies || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    const gallery = [user.avatarUrl, ...(Array.isArray(user.photos) ? user.photos : [])]
        .filter((x) => Boolean(x))
        .slice(0, 6);
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-fuchsia-100 via-pink-100 to-violet-100 px-4 py-6", children: _jsxs("div", { className: "max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5", children: [_jsxs("aside", { className: "rounded-3xl overflow-hidden shadow-xl border border-white/40 bg-black relative min-h-[540px]", children: [_jsx("img", { src: user.avatarUrl || "/default-avatar.png", alt: user.fullName, className: "w-full h-full object-cover" }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" }), _jsx("button", { type: "button", onClick: () => navigate("/discover"), className: "absolute top-3 left-3 rounded-lg bg-black/50 text-white text-xs px-3 py-1.5", children: "Back" }), _jsxs("div", { className: "absolute bottom-5 left-5 right-5 text-white", children: [_jsxs("h1", { className: "text-4xl font-black leading-none", children: [user.fullName, ", ", user.age] }), chips.length > 0 && _jsx("p", { className: "mt-2 text-sm text-white/85", children: chips.join(" | ") })] })] }), _jsxs("section", { className: "rounded-3xl bg-white/90 border border-white/70 shadow-md p-5", children: [gallery.length > 1 && (_jsx("div", { className: "mb-4 grid grid-cols-3 sm:grid-cols-4 gap-2", children: gallery.map((img, idx) => (_jsx("img", { src: img, alt: `${user.fullName} photo ${idx + 1}`, className: "h-20 w-full rounded-xl object-cover border border-slate-200" }, `${img}-${idx}`))) })), _jsxs("h2", { className: "text-2xl font-black text-slate-900", children: ["About ", user.fullName] }), _jsx("p", { className: "mt-2 text-slate-700", children: user.bio || "Hi there! I am using Chill Mate." }), (user.swipeStreak ?? 0) > 0 && (_jsxs("p", { className: "mt-2 inline-flex rounded-full border border-amber-200 bg-amber-50 text-amber-700 text-xs px-2.5 py-1 font-semibold", children: [user.swipeStreak, "-day streak"] })), _jsxs("div", { className: "mt-6", children: [_jsx("h3", { className: "text-sm uppercase tracking-[0.2em] text-slate-500 font-semibold", children: "Interests" }), _jsx("div", { className: "mt-2 flex flex-wrap gap-2", children: (interestList.length ? interestList : ["Not added"]).map((item) => (_jsx("span", { className: "rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700", children: item }, `i-${item}`))) })] }), _jsxs("div", { className: "mt-5", children: [_jsx("h3", { className: "text-sm uppercase tracking-[0.2em] text-slate-500 font-semibold", children: "More About Me" }), _jsx("div", { className: "mt-2 flex flex-wrap gap-2", children: (hobbyList.length ? hobbyList : ["No hobbies added"]).map((item) => (_jsx("span", { className: "rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700", children: item }, `h-${item}`))) })] }), error && (_jsx("p", { className: "mt-4 text-sm rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-700", children: error })), _jsxs("div", { className: "mt-8 flex items-center gap-3 justify-center lg:justify-start", children: [_jsx("button", { type: "button", disabled: acting, onClick: () => react("dislike"), className: "h-14 px-5 rounded-full border border-slate-200 bg-white text-rose-600 font-black hover:scale-105 transition disabled:opacity-60", children: "Nope" }), _jsx("button", { type: "button", disabled: acting, onClick: () => react("superlike"), className: "h-14 px-5 rounded-2xl bg-sky-500 text-white font-black hover:scale-105 transition disabled:opacity-60", children: "SL" }), _jsx("button", { type: "button", disabled: acting, onClick: () => react("like"), className: "h-14 px-5 rounded-full border border-slate-200 bg-white text-emerald-600 font-black hover:scale-105 transition disabled:opacity-60", children: "Like" })] })] })] }) }));
}
