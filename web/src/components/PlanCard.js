import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from "react-router-dom";
function formatStartTime(startAt) {
    const d = new Date(startAt);
    return new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(d);
}
export default function PlanCard({ plan, onJoin, onOpenChat, joinState = "idle", errorMessage = null, completed = false, }) {
    const navigate = useNavigate();
    const computedIsFull = typeof plan.maxGuests === "number" && plan.maxGuests > 0
        ? plan.attendeeCount >= plan.maxGuests
        : false;
    const isFull = Boolean(plan.isFull ?? computedIsFull);
    const isHost = Boolean(plan.isHost);
    const isCancelled = Boolean(plan.isCancelled) ||
        String(plan.status ?? "").toLowerCase() === "cancelled";
    const isCompleted = Boolean(plan.isCompleted) ||
        String(plan.status ?? "").toLowerCase() === "completed" ||
        completed;
    const isJoined = joinState === "joined";
    const isRequestSent = joinState === "request_sent";
    const isJoining = joinState === "joining";
    const isDisabled = isCancelled || isCompleted || isFull || isHost || isJoining || isJoined || isRequestSent;
    let buttonLabel = "Join Plan";
    if (isCancelled)
        buttonLabel = "Cancelled";
    else if (isCompleted)
        buttonLabel = "Completed";
    else if (isHost)
        buttonLabel = "Host";
    else if (isFull)
        buttonLabel = "Plan Full";
    else if (isJoining)
        buttonLabel = "Joining...";
    else if (isRequestSent)
        buttonLabel = "Request Sent";
    else if (isJoined)
        buttonLabel = "Joined";
    const maxGuests = typeof plan.maxGuests === "number" && plan.maxGuests > 0 ? plan.maxGuests : null;
    const progressPercent = maxGuests !== null ? Math.max(0, Math.min(100, (plan.attendeeCount / maxGuests) * 100)) : 0;
    return (_jsxs("article", { className: "rounded-2xl border border-amber-100 bg-white/90 shadow-sm p-4 sm:p-5 cursor-pointer", onClick: () => navigate(`/plans/${plan.id}`), children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsx("h3", { className: "text-lg font-black text-slate-900 leading-tight", children: plan.title }), _jsxs("div", { className: "flex flex-col items-end gap-1", children: [isHost && (_jsx("span", { className: "shrink-0 rounded-full bg-amber-100 text-amber-700 text-[11px] font-semibold px-2 py-0.5 shadow-sm", children: "\uD83D\uDC51 Host" })), (isJoined || Boolean(plan.isJoined)) && (_jsx("span", { className: "shrink-0 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-semibold px-2 py-0.5 shadow-sm", children: "\uD83D\uDFE2 Joined" })), isFull && (_jsx("span", { className: "shrink-0 rounded-full bg-rose-100 text-rose-700 text-[11px] font-semibold px-2 py-0.5 shadow-sm", children: "\uD83D\uDD34 Full" })), isCancelled && (_jsx("span", { className: "shrink-0 rounded-full bg-violet-100 text-violet-700 text-[11px] font-semibold px-2 py-0.5 shadow-sm", children: "\uD83D\uDFE3 Cancelled" })), isCompleted && (_jsx("span", { className: "shrink-0 rounded-full bg-slate-200 text-slate-700 text-[11px] font-semibold px-2 py-0.5 shadow-sm", children: "\u26AB Completed" }))] })] }), _jsx("p", { className: "mt-2 text-sm text-slate-600 leading-relaxed", children: plan.description }), _jsxs("div", { className: "mt-3", children: [_jsx("p", { className: "text-xs text-slate-600", children: maxGuests !== null
                            ? `${plan.attendeeCount} / ${maxGuests} spots filled`
                            : `${plan.attendeeCount} spots filled` }), maxGuests !== null && (_jsx("div", { className: "mt-1 h-2 rounded-full bg-slate-200 overflow-hidden", children: _jsx("div", { className: "h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full", style: { width: `${progressPercent}%` } }) }))] }), _jsxs("div", { className: "mt-3 space-y-1.5 text-sm text-slate-700", children: [_jsxs("p", { children: [_jsx("span", { className: "font-semibold", children: "Location:" }), " ", plan.location] }), _jsxs("p", { children: [_jsx("span", { className: "font-semibold", children: "Starts:" }), " ", formatStartTime(plan.startAt)] }), _jsxs("p", { children: [_jsx("span", { className: "font-semibold", children: "Host:" }), " ", plan.hostName] }), _jsxs("p", { children: [_jsx("span", { className: "font-semibold", children: "Attendees:" }), " ", plan.attendeeCount, maxGuests !== null ? ` / ${maxGuests}` : ""] })] }), _jsxs("div", { className: "mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2", children: [_jsx("button", { type: "button", disabled: isDisabled, onClick: (e) => {
                            e.stopPropagation();
                            onJoin?.(plan.id);
                        }, className: `w-full rounded-xl py-2.5 text-sm font-semibold transition ${isDisabled
                            ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                            : "bg-orange-500 text-white hover:bg-orange-600"}`, children: buttonLabel }), !isCancelled ? (_jsx("button", { type: "button", onClick: (e) => {
                            e.stopPropagation();
                            onOpenChat?.(plan.id);
                        }, className: "w-full rounded-xl py-2.5 text-sm font-semibold transition bg-white border border-slate-200 text-slate-700 hover:border-orange-300 hover:text-orange-700", children: "Open Chat" })) : (_jsx("div", { className: "w-full rounded-xl py-2.5 text-sm font-semibold text-center bg-slate-100 text-slate-500", children: "Chat Disabled" }))] }), errorMessage && (_jsx("p", { className: "mt-2 text-xs text-rose-700", children: errorMessage }))] }));
}
