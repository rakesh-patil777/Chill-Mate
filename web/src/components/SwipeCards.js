import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import { useNavigate } from "react-router-dom";
export default function SwipeCards({ filters }) {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [dragX, setDragX] = useState(0);
    const [dragY, setDragY] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [matchUser, setMatchUser] = useState(null);
    const [error, setError] = useState(null);
    const [swipeMeta, setSwipeMeta] = useState({});
    const [startPoint, setStartPoint] = useState(null);
    const fetchCancelledRef = useRef(false);
    const hasMovedRef = useRef(false);
    useEffect(() => {
        fetchCancelledRef.current = false;
        void fetchProfiles();
        return () => {
            fetchCancelledRef.current = true;
        };
    }, [filters]);
    async function fetchProfiles() {
        try {
            setLoading(true);
            const query = new URLSearchParams();
            if (filters.minAge)
                query.set("minAge", String(filters.minAge));
            if (filters.maxAge)
                query.set("maxAge", String(filters.maxAge));
            if (filters.interests?.trim())
                query.set("interests", filters.interests.trim());
            if (filters.gender?.trim())
                query.set("gender", filters.gender.trim());
            if (filters.branch?.trim())
                query.set("branch", filters.branch.trim());
            if (filters.year)
                query.set("year", String(filters.year));
            const data = await api(`/profiles/discover${query.toString() ? `?${query.toString()}` : ""}`);
            const list = Array.isArray(data) ? data : [];
            if (!fetchCancelledRef.current) {
                setUsers(list);
                setCurrentIndex(0);
                setError(null);
            }
        }
        catch (err) {
            console.error("Failed to load profiles", err);
            if (!fetchCancelledRef.current)
                setUsers([]);
        }
        finally {
            if (!fetchCancelledRef.current)
                setLoading(false);
        }
    }
    async function submitSwipe(target, reaction) {
        try {
            const result = await api("/likes", {
                method: "POST",
                body: JSON.stringify({
                    targetUserId: target.id,
                    reaction,
                }),
            });
            setSwipeMeta({
                remainingSwipes: result?.remainingSwipes ?? null,
                freeDailyLimit: result?.freeDailyLimit ?? null,
                premium: Boolean(result?.premium),
            });
            if (result?.match) {
                setMatchUser(target);
            }
        }
        catch (err) {
            console.warn("Swipe request failed", err);
            const raw = err instanceof Error ? err.message : "Swipe failed";
            setError(raw.includes("SWIPE_LIMIT") || raw.includes("Daily swipe limit reached")
                ? "Daily swipe limit reached for free plan."
                : "Swipe failed. Try again.");
        }
        finally {
            setCurrentIndex((prev) => prev + 1);
            setDragX(0);
            setDragY(0);
            setStartPoint(null);
            setIsAnimating(false);
        }
    }
    function animateSwipe(direction) {
        const user = users[currentIndex];
        if (!user || isAnimating)
            return;
        setIsAnimating(true);
        if (direction === "like") {
            setDragX(520);
            setDragY(-30);
        }
        else if (direction === "dislike") {
            setDragX(-520);
            setDragY(-10);
        }
        else {
            setDragX(0);
            setDragY(-640);
        }
        window.setTimeout(() => {
            void submitSwipe(user, direction);
        }, 280);
    }
    function startDrag(x, y) {
        if (isAnimating)
            return;
        hasMovedRef.current = false;
        setStartPoint({ x, y });
    }
    function handleDrag(x, y) {
        if (!startPoint || isAnimating)
            return;
        if (Math.abs(x - startPoint.x) > 8 || Math.abs(y - startPoint.y) > 8) {
            hasMovedRef.current = true;
        }
        setDragX(x - startPoint.x);
        setDragY(y - startPoint.y);
    }
    function endDrag() {
        if (!startPoint || isAnimating)
            return;
        const likeThreshold = 120;
        const superLikeThreshold = -140;
        if (dragY < superLikeThreshold && Math.abs(dragX) < 120) {
            animateSwipe("superlike");
        }
        else if (dragX > likeThreshold) {
            animateSwipe("like");
        }
        else if (dragX < -likeThreshold) {
            animateSwipe("dislike");
        }
        else {
            setDragX(0);
            setDragY(0);
        }
        setStartPoint(null);
    }
    if (loading) {
        return (_jsx("div", { className: "text-white text-xl font-semibold animate-pulse", children: "Loading profiles..." }));
    }
    if (currentIndex >= users.length) {
        return (_jsx("div", { className: "text-slate-700 text-lg sm:text-2xl font-semibold text-center px-4", children: "No more profiles with current filters." }));
    }
    const user = users[currentIndex];
    const nextUser = users[currentIndex + 1];
    const thirdUser = users[currentIndex + 2];
    const dragRotation = dragX / 18;
    const revealStrength = Math.min(Math.abs(dragX) / 220, 1);
    if (!user)
        return null;
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "flex items-center justify-center px-0 sm:px-4", children: _jsxs("div", { className: "relative w-full max-w-[320px] h-[62vh] sm:h-[500px] select-none", children: [thirdUser && (_jsx("div", { className: "absolute inset-0 translate-y-5 scale-[0.9] rounded-3xl overflow-hidden bg-black/35 border border-white/10" })), nextUser && (_jsxs("div", { className: "absolute inset-0 rounded-3xl overflow-hidden shadow-xl border border-white/10 transition-all duration-300", style: {
                                transform: `translateY(${12 - revealStrength * 10}px) scale(${0.94 + revealStrength * 0.04})`,
                            }, children: [_jsx("img", { src: nextUser.avatarUrl || "/default-avatar.png", alt: nextUser.fullName, className: "w-full h-full object-cover" }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" })] })), _jsxs("div", { className: `absolute inset-0 rounded-3xl overflow-hidden shadow-2xl bg-black border border-white/10 cursor-grab active:cursor-grabbing ${isAnimating
                                ? "transition-transform duration-300 ease-out"
                                : "transition-transform duration-200 ease-out"}`, style: {
                                transform: `translate3d(${dragX}px, ${dragY + Math.abs(dragX) * 0.07}px, 0) rotate(${dragRotation}deg)`,
                                opacity: 1 - Math.min(Math.abs(dragX) / 520, 0.5),
                            }, onPointerDown: (e) => {
                                e.currentTarget.setPointerCapture(e.pointerId);
                                startDrag(e.clientX, e.clientY);
                            }, onPointerMove: (e) => handleDrag(e.clientX, e.clientY), onPointerUp: endDrag, onPointerCancel: endDrag, onPointerLeave: () => {
                                if (!startPoint)
                                    return;
                                endDrag();
                            }, onClick: (e) => {
                                const target = e.target;
                                if (target?.closest("button"))
                                    return;
                                if (hasMovedRef.current || isAnimating)
                                    return;
                                navigate(`/discover/user/${user.id}`);
                            }, children: [_jsx("img", { src: user.avatarUrl || "/default-avatar.png", alt: user.fullName, className: "w-full h-full object-cover", draggable: false }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" }), dragX > 35 && (_jsx("div", { className: "absolute top-9 left-5 text-emerald-300 text-3xl font-extrabold -rotate-[14deg] border-4 border-emerald-300 px-3 py-1 rounded-lg tracking-wider", children: "LIKE" })), dragX < -35 && (_jsx("div", { className: "absolute top-9 right-5 text-rose-300 text-3xl font-extrabold rotate-[14deg] border-4 border-rose-300 px-3 py-1 rounded-lg tracking-wider", children: "NOPE" })), dragY < -45 && Math.abs(dragX) < 140 && (_jsx("div", { className: "absolute top-9 left-1/2 -translate-x-1/2 text-sky-300 text-2xl font-extrabold border-4 border-sky-300 px-3 py-1 rounded-lg tracking-wide", children: "SUPER LIKE" })), _jsxs("div", { className: "absolute bottom-24 left-6 right-6 text-white z-10", children: [_jsxs("h2", { className: "text-3xl font-extrabold drop-shadow-xl", children: [user.fullName, ", ", user.age] }), (user.swipeStreak ?? 0) > 0 && (_jsxs("p", { className: "mt-1 inline-flex items-center gap-1 rounded-full bg-black/35 border border-white/20 px-2.5 py-1 text-[11px] text-amber-100 font-semibold", children: [_jsx("span", { children: "\uD83D\uDD25" }), _jsxs("span", { children: [user.swipeStreak, "-day streak"] })] })), _jsx("p", { className: "mt-2 text-base opacity-90 leading-relaxed", children: user.bio || "Hi there! I am using Chill Mate." }), _jsx("p", { className: "mt-1 text-xs opacity-80", children: [user.gender, user.branch, user.year].filter(Boolean).join(" | ") })] }), _jsxs("div", { className: "absolute bottom-6 left-0 right-0 flex justify-center gap-3 sm:gap-5 z-10 px-2", children: [_jsx("button", { type: "button", onClick: (e) => {
                                                e.stopPropagation();
                                                animateSwipe("dislike");
                                            }, onPointerDown: (e) => e.stopPropagation(), className: "w-14 h-14 bg-white/95 rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition", "aria-label": "Dislike", children: _jsx("span", { className: "text-sm text-rose-500 font-black", children: "NOPE" }) }), _jsx("button", { type: "button", onClick: (e) => {
                                                e.stopPropagation();
                                                animateSwipe("superlike");
                                            }, onPointerDown: (e) => e.stopPropagation(), className: "w-14 h-14 bg-sky-500 rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition", "aria-label": "Super like", children: _jsx("span", { className: "text-lg text-white font-black", children: "SL" }) }), _jsx("button", { type: "button", onClick: (e) => {
                                                e.stopPropagation();
                                                animateSwipe("like");
                                            }, onPointerDown: (e) => e.stopPropagation(), className: "w-14 h-14 bg-white/95 rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition", "aria-label": "Like", children: _jsx("span", { className: "text-sm text-pink-600 font-black", children: "LIKE" }) })] }), _jsxs("div", { className: "absolute top-3 left-3 right-3 flex justify-between gap-2 z-10", children: [_jsx("button", { type: "button", onClick: async () => {
                                                await api("/safety/block", {
                                                    method: "POST",
                                                    body: JSON.stringify({ blockedUserId: user.id }),
                                                });
                                                setCurrentIndex((prev) => prev + 1);
                                            }, onPointerDown: (e) => e.stopPropagation(), className: "text-[11px] bg-black/45 text-white px-2 py-1 rounded-lg", children: "Block" }), _jsx("button", { type: "button", onClick: async () => {
                                                const reason = window.prompt("Report reason");
                                                if (!reason)
                                                    return;
                                                await api("/safety/report", {
                                                    method: "POST",
                                                    body: JSON.stringify({ reportedUserId: user.id, reason }),
                                                });
                                            }, onPointerDown: (e) => e.stopPropagation(), className: "text-[11px] bg-black/45 text-white px-2 py-1 rounded-lg", children: "Report" })] })] })] }) }), (error || (!swipeMeta.premium && swipeMeta.remainingSwipes !== undefined && swipeMeta.remainingSwipes !== null)) && (_jsxs("div", { className: "mt-3 text-center", children: [error && _jsx("p", { className: "text-sm text-rose-700", children: error }), !swipeMeta.premium &&
                        swipeMeta.remainingSwipes !== undefined &&
                        swipeMeta.remainingSwipes !== null && (_jsxs("p", { className: "text-xs text-slate-600", children: ["Swipes left today: ", swipeMeta.remainingSwipes, swipeMeta.freeDailyLimit ? ` / ${swipeMeta.freeDailyLimit}` : ""] }))] })), matchUser && (_jsx("div", { className: "fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4", children: _jsxs("div", { className: "w-full max-w-sm rounded-3xl bg-gradient-to-b from-rose-200 to-pink-100 p-6 text-center shadow-2xl border border-white/60 animate-[fadeIn_220ms_ease-out]", children: [_jsx("p", { className: "text-sm uppercase tracking-[0.35em] text-pink-700 font-semibold", children: "It's a match" }), _jsxs("h3", { className: "mt-2 text-3xl font-black text-pink-700", children: ["You and ", matchUser.fullName] }), _jsx("img", { src: matchUser.avatarUrl || "/default-avatar.png", alt: matchUser.fullName, className: "w-24 h-24 rounded-full object-cover mx-auto mt-5 border-4 border-white shadow-md" }), _jsx("p", { className: "mt-4 text-slate-700", children: "You both liked each other. Start a conversation from Matches." }), _jsx("button", { type: "button", className: "mt-6 w-full rounded-2xl bg-pink-600 text-white font-semibold py-3 hover:bg-pink-700 transition", onClick: () => setMatchUser(null), children: "Keep Swiping" })] }) }))] }));
}
