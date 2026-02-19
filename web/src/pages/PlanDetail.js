import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
function parseServerDate(value) {
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
        return new Date(value.replace(" ", "T") + "Z");
    }
    return new Date(value);
}
function parseError(err, fallback) {
    const raw = err instanceof Error ? err.message : fallback;
    try {
        const parsed = JSON.parse(raw);
        return parsed.error || raw;
    }
    catch {
        return raw;
    }
}
export default function PlanDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const planId = Number(id);
    const [plan, setPlan] = useState(null);
    const [viewerId, setViewerId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState(null);
    const [rateOpen, setRateOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState("");
    const [ratingPending, setRatingPending] = useState(false);
    const [ratingMessage, setRatingMessage] = useState(null);
    async function loadPlan() {
        const data = await api(`/plans/${planId}`);
        setPlan(data);
    }
    useEffect(() => {
        if (!Number.isInteger(planId) || planId <= 0) {
            setError("Invalid plan.");
            setLoading(false);
            return;
        }
        let active = true;
        Promise.all([
            loadPlan(),
            api("/profiles/me").then((me) => setViewerId(me.id)),
        ])
            .catch((err) => {
            if (!active)
                return;
            setError(parseError(err, "Failed to load plan."));
        })
            .finally(() => {
            if (active)
                setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [planId]);
    const isCompleted = useMemo(() => Boolean(plan?.isCompleted), [plan]);
    const isCancelled = useMemo(() => Boolean(plan?.isCancelled), [plan]);
    const canOpenChat = useMemo(() => Boolean(plan && !isCancelled && (plan.isJoined || plan.isHost)), [plan, isCancelled]);
    const viewerAttendance = useMemo(() => {
        if (!plan || viewerId == null)
            return null;
        return plan.attendees.find((a) => a.id === viewerId) ?? null;
    }, [plan, viewerId]);
    const canRateHost = useMemo(() => Boolean(plan &&
        !plan.isHost &&
        isCompleted &&
        viewerAttendance &&
        viewerAttendance.attended), [plan, isCompleted, viewerAttendance]);
    async function onJoin() {
        if (!plan || pending)
            return;
        try {
            setPending(true);
            setError(null);
            await api(`/plans/${plan.id}/join`, { method: "POST" });
            await loadPlan();
        }
        catch (err) {
            setError(parseError(err, "Could not join plan."));
        }
        finally {
            setPending(false);
        }
    }
    async function onLeave() {
        if (!plan || pending)
            return;
        try {
            setPending(true);
            setError(null);
            await api(`/plans/${plan.id}/leave`, { method: "DELETE" });
            await loadPlan();
        }
        catch (err) {
            setError(parseError(err, "Could not leave plan."));
        }
        finally {
            setPending(false);
        }
    }
    async function updateStatus(status) {
        if (!plan || pending)
            return;
        try {
            setPending(true);
            setError(null);
            await api(`/plans/${plan.id}/status`, {
                method: "PATCH",
                body: JSON.stringify({ status }),
            });
            await loadPlan();
        }
        catch (err) {
            setError(parseError(err, "Could not update plan."));
        }
        finally {
            setPending(false);
        }
    }
    async function removeAttendee(targetUserId) {
        if (!plan || pending)
            return;
        try {
            setPending(true);
            setError(null);
            await api(`/plans/${plan.id}/attendees/${targetUserId}`, { method: "DELETE" });
            await loadPlan();
        }
        catch (err) {
            setError(parseError(err, "Could not remove attendee."));
        }
        finally {
            setPending(false);
        }
    }
    async function markAttendance(targetUserId) {
        if (!plan || pending)
            return;
        try {
            setPending(true);
            setError(null);
            await api(`/plans/${plan.id}/attendance/${targetUserId}`, { method: "PATCH" });
            await loadPlan();
        }
        catch (err) {
            setError(parseError(err, "Could not mark attendance."));
        }
        finally {
            setPending(false);
        }
    }
    async function submitHostRating() {
        if (!plan || ratingPending)
            return;
        if (rating < 1 || rating > 5) {
            setRatingMessage("Please select a rating from 1 to 5.");
            return;
        }
        try {
            setRatingPending(true);
            setRatingMessage(null);
            await api(`/plans/${plan.id}/rate-host`, {
                method: "POST",
                body: JSON.stringify({
                    rating,
                    feedback: feedback.trim() ? feedback.trim() : undefined,
                }),
            });
            setRatingMessage("Thanks. Your rating was submitted.");
            setRateOpen(false);
        }
        catch (err) {
            setRatingMessage(parseError(err, "Could not submit host rating."));
        }
        finally {
            setRatingPending(false);
        }
    }
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-r from-rose-100 via-amber-100 to-orange-100 flex items-center justify-center", children: _jsx("p", { className: "text-slate-700", children: "Loading plan details..." }) }));
    }
    if (!plan) {
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-r from-rose-100 via-amber-100 to-orange-100 px-4 py-8", children: _jsxs("div", { className: "max-w-3xl mx-auto rounded-2xl bg-white border border-slate-100 p-6", children: [_jsx("p", { className: "text-rose-700", children: error || "Plan not found." }), _jsx("button", { type: "button", onClick: () => navigate("/plans"), className: "mt-4 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold", children: "Back to Plans" })] }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-r from-rose-100 via-amber-100 to-orange-100 px-4 py-6 sm:py-8", children: [_jsxs("div", { className: "max-w-4xl mx-auto rounded-3xl bg-white/95 border border-amber-100 shadow-sm p-5 sm:p-7", children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl sm:text-4xl font-black text-slate-900", children: plan.title }), _jsx("p", { className: "mt-2 text-slate-600", children: plan.description || "No description yet." }), _jsxs("div", { className: "mt-3", children: [_jsx("p", { className: "text-xs text-slate-600", children: typeof plan.maxGuests === "number" && plan.maxGuests > 0
                                                    ? `${plan.attendeeCount} / ${plan.maxGuests} spots filled`
                                                    : `${plan.attendeeCount} spots filled` }), typeof plan.maxGuests === "number" && plan.maxGuests > 0 && (_jsx("div", { className: "mt-1 h-2 rounded-full bg-slate-200 overflow-hidden max-w-xs", children: _jsx("div", { className: "h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full", style: {
                                                        width: `${Math.max(0, Math.min(100, (plan.attendeeCount / plan.maxGuests) * 100))}%`,
                                                    } }) }))] })] }), _jsxs("div", { className: "flex flex-wrap gap-2 justify-end", children: [plan.isHost && (_jsx("span", { className: "rounded-full bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-1 shadow-sm", children: "\uD83D\uDC51 Host" })), plan.isJoined && (_jsx("span", { className: "rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-1 shadow-sm", children: "\uD83D\uDFE2 Joined" })), plan.isFull && (_jsx("span", { className: "rounded-full bg-rose-100 text-rose-700 text-xs font-semibold px-2.5 py-1 shadow-sm", children: "\uD83D\uDD34 Full" })), isCancelled && (_jsx("span", { className: "rounded-full bg-violet-100 text-violet-700 text-xs font-semibold px-2.5 py-1 shadow-sm", children: "\uD83D\uDFE3 Cancelled" })), isCompleted && (_jsx("span", { className: "rounded-full bg-slate-200 text-slate-700 text-xs font-semibold px-2.5 py-1 shadow-sm", children: "\u26AB Completed" }))] })] }), _jsxs("div", { className: "mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-700", children: [_jsxs("p", { children: [_jsx("span", { className: "font-semibold", children: "Location:" }), " ", plan.location || "TBA"] }), _jsxs("p", { children: [_jsx("span", { className: "font-semibold", children: "Date:" }), " ", plan.startAt
                                        ? parseServerDate(plan.startAt).toLocaleString([], {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })
                                        : "TBA"] }), _jsxs("p", { children: [_jsx("span", { className: "font-semibold", children: "Attendees:" }), " ", plan.attendeeCount, typeof plan.maxGuests === "number" && plan.maxGuests > 0 ? ` / ${plan.maxGuests}` : ""] })] }), _jsxs("section", { className: "mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4", children: [_jsx("p", { className: "text-xs uppercase tracking-[0.2em] text-slate-500", children: "Hosted by" }), _jsxs("div", { className: "mt-2 flex items-center gap-3", children: [_jsx("img", { src: plan.host.avatarUrl || "/default-avatar.png", alt: plan.host.fullName, className: "w-12 h-12 rounded-full object-cover border border-slate-200" }), _jsx("p", { className: "text-slate-900 font-semibold", children: plan.host.fullName })] })] }), _jsxs("section", { className: "mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4", children: [_jsx("p", { className: "text-xs uppercase tracking-[0.2em] text-slate-500", children: "Attendees" }), _jsxs("p", { className: "mt-1 text-sm text-slate-700", children: [plan.attendeeCount, " joined"] }), _jsx("div", { className: "mt-3 space-y-2", children: plan.attendees.map((a) => (_jsxs("div", { className: "flex items-center justify-between gap-3 rounded-xl bg-white border border-slate-200 px-3 py-2", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("img", { src: a.avatarUrl || "/default-avatar.png", alt: a.fullName, title: a.fullName, className: "w-9 h-9 rounded-full object-cover border border-slate-200" }), _jsx("p", { className: "text-sm text-slate-800 font-semibold", children: a.fullName })] }), plan.isHost && a.id !== plan.host.id && (_jsxs("div", { className: "flex items-center gap-2", children: [isCompleted && (_jsx("button", { type: "button", disabled: pending || Boolean(a.attended), onClick: () => markAttendance(a.id), className: "text-xs px-3 py-1 rounded-lg bg-emerald-100 text-emerald-700 font-semibold hover:bg-emerald-200 disabled:opacity-60", children: a.attended ? "Attended" : "Mark Attended" })), _jsx("button", { type: "button", disabled: pending, onClick: () => removeAttendee(a.id), className: "text-xs px-3 py-1 rounded-lg bg-rose-100 text-rose-700 font-semibold hover:bg-rose-200 disabled:opacity-60", children: "Remove" })] }))] }, a.id))) })] }), plan.isHost && (_jsxs("section", { className: "mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4", children: [_jsx("p", { className: "text-xs uppercase tracking-[0.2em] text-slate-500 mb-2", children: "Host Controls" }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx("button", { type: "button", disabled: pending || isCompleted, onClick: () => updateStatus("completed"), className: "px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 disabled:opacity-60", children: "Mark Completed" }), _jsx("button", { type: "button", disabled: pending || isCancelled, onClick: () => updateStatus("cancelled"), className: "px-4 py-2 rounded-xl bg-violet-100 text-violet-700 font-semibold hover:bg-violet-200 disabled:opacity-60", children: "Cancel Plan" })] })] })), error && (_jsx("p", { className: "mt-4 text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-lg p-2", children: error })), _jsxs("div", { className: "mt-6 flex flex-wrap gap-2", children: [isCancelled ? (_jsx("button", { type: "button", disabled: true, className: "px-4 py-2 rounded-xl bg-slate-200 text-slate-500 font-semibold cursor-not-allowed", children: "Cancelled" })) : isCompleted ? (_jsx("button", { type: "button", disabled: true, className: "px-4 py-2 rounded-xl bg-slate-200 text-slate-500 font-semibold cursor-not-allowed", children: "Completed" })) : plan.isJoined ? (_jsx(_Fragment, { children: !plan.isHost && (_jsx("button", { type: "button", disabled: pending, onClick: onLeave, className: "px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 disabled:opacity-60", children: pending ? "Processing..." : "Leave Plan" })) })) : plan.isFull ? (_jsx("button", { type: "button", disabled: true, className: "px-4 py-2 rounded-xl bg-slate-200 text-slate-500 font-semibold cursor-not-allowed", children: "Full" })) : (_jsx("button", { type: "button", disabled: pending, onClick: onJoin, className: "px-4 py-2 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 disabled:opacity-60", children: pending ? "Joining..." : "Join" })), canOpenChat && (_jsx("button", { type: "button", onClick: () => navigate(`/plans/${plan.id}/chat`), className: "px-4 py-2 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600", children: "Open Chat" })), canRateHost && (_jsx("button", { type: "button", onClick: () => setRateOpen(true), className: "px-4 py-2 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600", children: "Rate Host" }))] }), ratingMessage && (_jsx("p", { className: "mt-3 text-xs rounded-lg border border-amber-200 bg-amber-50 text-amber-800 p-2", children: ratingMessage }))] }), rateOpen && (_jsx("div", { className: "fixed inset-0 z-50 bg-slate-900/40 px-4 flex items-center justify-center", children: _jsxs("div", { className: "w-full max-w-md rounded-2xl bg-white p-5 border border-slate-200 shadow-xl", children: [_jsx("h2", { className: "text-xl font-bold text-slate-900", children: "Rate Host" }), _jsx("p", { className: "mt-1 text-sm text-slate-600", children: "Share your experience for this completed plan." }), _jsx("div", { className: "mt-4 flex items-center gap-2", children: [1, 2, 3, 4, 5].map((n) => (_jsx("button", { type: "button", onClick: () => setRating(n), className: `w-10 h-10 rounded-xl text-lg font-bold border ${n <= rating
                                    ? "bg-amber-500 text-white border-amber-500"
                                    : "bg-white text-slate-500 border-slate-200"}`, children: "*" }, n))) }), _jsx("textarea", { value: feedback, onChange: (e) => setFeedback(e.target.value), rows: 4, maxLength: 500, placeholder: "Optional feedback", className: "mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800" }), _jsxs("div", { className: "mt-4 flex gap-2", children: [_jsx("button", { type: "button", onClick: () => setRateOpen(false), className: "px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200", children: "Cancel" }), _jsx("button", { type: "button", disabled: ratingPending, onClick: submitHostRating, className: "px-4 py-2 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600 disabled:opacity-60", children: ratingPending ? "Submitting..." : "Submit Rating" })] })] }) }))] }));
}
