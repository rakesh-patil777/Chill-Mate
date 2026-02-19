import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import PlanCard, { Plan, PlanJoinState } from "../components/PlanCard";

type PlanRow = {
  id: number;
  title: string;
  description?: string | null;
  location?: string | null;
  startAt?: string | null;
  maxGuests?: number | null;
  hostName: string;
  attendeeCount?: number;
  status?: string | null;
  isJoined?: number | boolean;
  isHost?: number | boolean;
  isFull?: number | boolean;
  isCompleted?: number | boolean;
  isCancelled?: number | boolean;
};

export default function Plans() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [joinStateByPlanId, setJoinStateByPlanId] = useState<Record<number, PlanJoinState>>({});
  const [joinErrorByPlanId, setJoinErrorByPlanId] = useState<Record<number, string | null>>({});

  function isPastPlan(plan: Pick<Plan, "startAt" | "status">) {
    const startMs = new Date(plan.startAt).getTime();
    const started = Number.isFinite(startMs) && startMs < Date.now();
    const completed = (plan.status ?? "").toLowerCase() === "completed";
    return started || completed;
  }

  useEffect(() => {
    api<PlanRow[]>("/plans")
      .then((rows) => {
        const mapped = (Array.isArray(rows) ? rows : [])
          .filter((r) => Boolean(r.startAt))
          .map((r) => ({
            id: r.id,
            title: r.title,
            description: r.description || "No description yet.",
            location: r.location || "TBA",
            startAt: r.startAt as string,
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

        const joinStateInit: Record<number, PlanJoinState> = {};
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

  async function handleJoinPlan(planId: number) {
    const currentJoinState = joinStateByPlanId[planId] ?? "idle";
    if (currentJoinState === "joining" || currentJoinState === "joined" || currentJoinState === "request_sent") {
      return;
    }

    try {
      setJoinErrorByPlanId((prev) => ({ ...prev, [planId]: null }));
      setJoinStateByPlanId((prev) => ({ ...prev, [planId]: "joining" }));

      const result = await api<{
        success: boolean;
        joined?: boolean;
        requestSent?: boolean;
        requiresApproval?: boolean;
      }>(`/plans/${planId}/join`, {
        method: "POST",
      });

      const requiresApproval = Boolean(result.requestSent || result.requiresApproval);

      if (requiresApproval) {
        setJoinStateByPlanId((prev) => ({ ...prev, [planId]: "request_sent" }));
        return;
      }

      if (result.joined) {
        setPlans((prev) =>
          prev.map((plan) =>
            plan.id === planId
              ? { ...plan, attendeeCount: plan.attendeeCount + 1 }
              : plan
          )
        );
      }

      setJoinStateByPlanId((prev) => ({ ...prev, [planId]: "joined" }));
    } catch (err) {
      setJoinStateByPlanId((prev) => ({ ...prev, [planId]: "idle" }));
      setJoinErrorByPlanId((prev) => ({
        ...prev,
        [planId]: err instanceof Error ? err.message : "Failed to join plan",
      }));
    }
  }

  const trendingOnCampus = useMemo(
    () =>
      [...plans]
        .filter((p) => !isPastPlan(p))
        .sort((a, b) => b.attendeeCount - a.attendeeCount)
        .slice(0, 3),
    [plans]
  );
  const happeningSoon = useMemo(
    () =>
      [...plans]
        .filter((p) => !isPastPlan(p))
        .sort(
          (a, b) =>
            new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
        )
        .slice(0, 3),
    [plans]
  );
  const allUpcoming = useMemo(
    () => plans.filter((p) => !isPastPlan(p)),
    [plans]
  );
  const pastPlans = useMemo(
    () =>
      [...plans]
        .filter((p) => isPastPlan(p))
        .sort(
          (a, b) =>
            new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
        ),
    [plans]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-rose-100 via-amber-100 to-orange-100 px-4 sm:px-6 py-8 sm:py-10 flex items-center justify-center">
        <p className="text-slate-700 text-lg font-semibold">Loading plans...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-rose-100 via-amber-100 to-orange-100 px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-5xl mx-auto space-y-8 sm:space-y-10">
        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 p-3">
            {error}
          </div>
        )}

        <section>
          <h2 className="text-2xl sm:text-3xl font-black text-orange-700">
            Trending on Campus
          </h2>
          <div className="mt-4 space-y-4">
            {trendingOnCampus.map((plan) => (
              <PlanCard
                key={`trending-${plan.id}`}
                plan={plan}
                onJoin={handleJoinPlan}
                onOpenChat={(id) => navigate(`/plans/${id}/chat`)}
                joinState={joinStateByPlanId[plan.id] ?? "idle"}
                errorMessage={joinErrorByPlanId[plan.id] ?? null}
              />
            ))}
            {trendingOnCampus.length === 0 && (
              <p className="text-slate-700">No trending plans right now.</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-2xl sm:text-3xl font-black text-rose-700">
            Happening Soon
          </h2>
          <div className="mt-4 space-y-4">
            {happeningSoon.map((plan) => (
              <PlanCard
                key={`soon-${plan.id}`}
                plan={plan}
                onJoin={handleJoinPlan}
                onOpenChat={(id) => navigate(`/plans/${id}/chat`)}
                joinState={joinStateByPlanId[plan.id] ?? "idle"}
                errorMessage={joinErrorByPlanId[plan.id] ?? null}
              />
            ))}
            {happeningSoon.length === 0 && (
              <p className="text-slate-700">Nothing happening soon yet.</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-2xl sm:text-3xl font-black text-amber-700">
            All Upcoming Plans
          </h2>
          <div className="mt-4 space-y-4">
            {allUpcoming.map((plan) => (
              <PlanCard
                key={`all-${plan.id}`}
                plan={plan}
                onJoin={handleJoinPlan}
                onOpenChat={(id) => navigate(`/plans/${id}/chat`)}
                joinState={joinStateByPlanId[plan.id] ?? "idle"}
                errorMessage={joinErrorByPlanId[plan.id] ?? null}
              />
            ))}
            {allUpcoming.length === 0 && !error && (
              <p className="text-slate-700">
                No upcoming plans available yet. Tap + to create one.
              </p>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-500">
            🕘 Past Plans
          </h2>
          <div className="mt-4 space-y-4">
            {pastPlans.map((plan) => (
              <PlanCard
                key={`past-${plan.id}`}
                plan={plan}
                onOpenChat={(id) => navigate(`/plans/${id}/chat`)}
                joinState={joinStateByPlanId[plan.id] ?? "idle"}
                errorMessage={joinErrorByPlanId[plan.id] ?? null}
                completed
              />
            ))}
            {pastPlans.length === 0 && (
              <p className="text-slate-500">No past plans yet.</p>
            )}
          </div>
        </section>
      </div>

      <button
        type="button"
        onClick={() => navigate("/plans/create")}
        className="fixed right-5 bottom-20 sm:right-8 sm:bottom-10 w-14 h-14 rounded-full bg-orange-500 text-white text-3xl font-bold shadow-xl hover:bg-orange-600 active:scale-95 transition z-40"
        aria-label="Create Plan"
        title="Create Plan"
      >
        +
      </button>
    </div>
  );
}
