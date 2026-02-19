import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import PlanCard from "../components/PlanCard";
export default function Plans() {
    const navigate = useNavigate();
    const [plans, setPlans] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [joinStateByPlanId, setJoinStateByPlanId] = useState({});
    const [joinErrorByPlanId, setJoinErrorByPlanId] = useState({});
    function isPastPlan(plan) {
        const startMs = new Date(plan.startAt).getTime();
        const started = Number.isFinite(startMs) && startMs < Date.now();
        const completed = (plan.status ?? "").toLowerCase() === "completed";
        return started || completed;
    }
    useEffect(() => {
        api("/plans")
            .then((rows) => {
            const mapped = (Array.isArray(rows) ? rows : [])
                .filter((r) => Boolean(r.startAt))
                .map((r) => ({
                id: r.id,
                title: r.title,
                description: r.description || "No description yet.",
                location: r.location || "TBA",
                startAt: r.startAt,
                attendeeCount: Number(r.attendeeCount ?? 0),
                maxGuests: r.maxGuests ?? null,
                hostName: r.hostName || "Campus Host",
                status: r.status ?? null,
                isJoined: Boolean(r.isJoined),
                isHost: Boolean(r.isHost),
                isFull: Boolean(r.isFull),
                isCompleted: Boolean(r.isCompleted),
                isCancelled: Boolean(r.isCancelled),
            }));
            setPlans(mapped);
            const joinStateInit = {};
            for (const r of Array.isArray(rows) ? rows : []) {
                if (Boolean(r.isJoined)) {
                    joinStateInit[r.id] = "joined";
                }
            }
            setJoinStateByPlanId(joinStateInit);
        })
            .catch((err) => {
            setError(err instanceof Error ? err.message : "Failed to load plans");
            setPlans([]);
        })
            .finally(() => setLoading(false));
    }, []);
    async function handleJoinPlan(planId) {
        const currentJoinState = joinStateByPlanId[planId] ?? "idle";
        if (currentJoinState === "joining" || currentJoinState === "joined" || currentJoinState === "request_sent") {
            return;
        }
        try {
            setJoinErrorByPlanId((prev) => ({ ...prev, [planId]: null }));
            setJoinStateByPlanId((prev) => ({ ...prev, [planId]: "joining" }));
            const result = await api(`/plans/${planId}/join`, {
                method: "POST",
            });
            const requiresApproval = Boolean(result.requestSent || result.requiresApproval);
            if (requiresApproval) {
                setJoinStateByPlanId((prev) => ({ ...prev, [planId]: "request_sent" }));
                return;
            }
            if (result.joined) {
                setPlans((prev) => prev.map((plan) => plan.id === planId
                    ? { ...plan, attendeeCount: plan.attendeeCount + 1 }
                    : plan));
            }
            setJoinStateByPlanId((prev) => ({ ...prev, [planId]: "joined" }));
        }
        catch (err) {
            setJoinStateByPlanId((prev) => ({ ...prev, [planId]: "idle" }));
            setJoinErrorByPlanId((prev) => ({
                ...prev,
                [planId]: err instanceof Error ? err.message : "Failed to join plan",
            }));
        }
    }
    const trendingOnCampus = useMemo(() => [...plans]
        .filter((p) => !isPastPlan(p))
        .sort((a, b) => b.attendeeCount - a.attendeeCount)
        .slice(0, 3), [plans]);
    const happeningSoon = useMemo(() => [...plans]
        .filter((p) => !isPastPlan(p))
        .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
        .slice(0, 3), [plans]);
    const allUpcoming = useMemo(() => plans.filter((p) => !isPastPlan(p)), [plans]);
    const pastPlans = useMemo(() => [...plans]
        .filter((p) => isPastPlan(p))
        .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime()), [plans]);
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-r from-rose-100 via-amber-100 to-orange-100 px-4 sm:px-6 py-8 sm:py-10 flex items-center justify-center", children: _jsx("p", { className: "text-slate-700 text-lg font-semibold", children: "Loading plans..." }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-r from-rose-100 via-amber-100 to-orange-100 px-4 sm:px-6 py-8 sm:py-10", children: [_jsxs("div", { className: "max-w-5xl mx-auto space-y-8 sm:space-y-10", children: [error && (_jsx("div", { className: "rounded-xl bg-rose-50 border border-rose-200 text-rose-700 p-3", children: error })), _jsxs("section", { children: [_jsx("h2", { className: "text-2xl sm:text-3xl font-black text-orange-700", children: "Trending on Campus" }), _jsxs("div", { className: "mt-4 space-y-4", children: [trendingOnCampus.map((plan) => (_jsx(PlanCard, { plan: plan, onJoin: handleJoinPlan, onOpenChat: (id) => navigate(`/plans/${id}/chat`), joinState: joinStateByPlanId[plan.id] ?? "idle", errorMessage: joinErrorByPlanId[plan.id] ?? null }, `trending-${plan.id}`))), trendingOnCampus.length === 0 && (_jsx("p", { className: "text-slate-700", children: "No trending plans right now." }))] })] }), _jsxs("section", { children: [_jsx("h2", { className: "text-2xl sm:text-3xl font-black text-rose-700", children: "Happening Soon" }), _jsxs("div", { className: "mt-4 space-y-4", children: [happeningSoon.map((plan) => (_jsx(PlanCard, { plan: plan, onJoin: handleJoinPlan, onOpenChat: (id) => navigate(`/plans/${id}/chat`), joinState: joinStateByPlanId[plan.id] ?? "idle", errorMessage: joinErrorByPlanId[plan.id] ?? null }, `soon-${plan.id}`))), happeningSoon.length === 0 && (_jsx("p", { className: "text-slate-700", children: "Nothing happening soon yet." }))] })] }), _jsxs("section", { children: [_jsx("h2", { className: "text-2xl sm:text-3xl font-black text-amber-700", children: "All Upcoming Plans" }), _jsxs("div", { className: "mt-4 space-y-4", children: [allUpcoming.map((plan) => (_jsx(PlanCard, { plan: plan, onJoin: handleJoinPlan, onOpenChat: (id) => navigate(`/plans/${id}/chat`), joinState: joinStateByPlanId[plan.id] ?? "idle", errorMessage: joinErrorByPlanId[plan.id] ?? null }, `all-${plan.id}`))), allUpcoming.length === 0 && !error && (_jsx("p", { className: "text-slate-700", children: "No upcoming plans available yet. Tap + to create one." }))] })] }), _jsxs("section", { children: [_jsx("h2", { className: "text-2xl sm:text-3xl font-black text-slate-500", children: "\uD83D\uDD58 Past Plans" }), _jsxs("div", { className: "mt-4 space-y-4", children: [pastPlans.map((plan) => (_jsx(PlanCard, { plan: plan, onOpenChat: (id) => navigate(`/plans/${id}/chat`), joinState: joinStateByPlanId[plan.id] ?? "idle", errorMessage: joinErrorByPlanId[plan.id] ?? null, completed: true }, `past-${plan.id}`))), pastPlans.length === 0 && (_jsx("p", { className: "text-slate-500", children: "No past plans yet." }))] })] })] }), _jsx("button", { type: "button", onClick: () => navigate("/plans/create"), className: "fixed right-5 bottom-20 sm:right-8 sm:bottom-10 w-14 h-14 rounded-full bg-orange-500 text-white text-3xl font-bold shadow-xl hover:bg-orange-600 active:scale-95 transition z-40", "aria-label": "Create Plan", title: "Create Plan", children: "+" })] }));
}
