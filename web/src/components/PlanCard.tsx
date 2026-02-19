import { useNavigate } from "react-router-dom";

export type Plan = {
  id: number;
  title: string;
  description: string;
  location: string;
  startAt: string;
  attendeeCount: number;
  maxGuests?: number | null;
  hostName: string;
  status?: string | null;
  isJoined?: boolean;
  isHost?: boolean;
  isFull?: boolean;
  isCompleted?: boolean;
  isCancelled?: boolean;
};

export type PlanJoinState = "idle" | "joining" | "joined" | "request_sent";

type PlanCardProps = {
  plan: Plan;
  onJoin?: (planId: number) => void;
  onOpenChat?: (planId: number) => void;
  joinState?: PlanJoinState;
  errorMessage?: string | null;
  completed?: boolean;
};

function formatStartTime(startAt: string) {
  const d = new Date(startAt);
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export default function PlanCard({
  plan,
  onJoin,
  onOpenChat,
  joinState = "idle",
  errorMessage = null,
  completed = false,
}: PlanCardProps) {
  const navigate = useNavigate();
  const computedIsFull =
    typeof plan.maxGuests === "number" && plan.maxGuests > 0
      ? plan.attendeeCount >= plan.maxGuests
      : false;
  const isFull = Boolean(plan.isFull ?? computedIsFull);
  const isHost = Boolean(plan.isHost);
  const isCancelled =
    Boolean(plan.isCancelled) ||
    String(plan.status ?? "").toLowerCase() === "cancelled";
  const isCompleted =
    Boolean(plan.isCompleted) ||
    String(plan.status ?? "").toLowerCase() === "completed" ||
    completed;
  const isJoined = joinState === "joined";
  const isRequestSent = joinState === "request_sent";
  const isJoining = joinState === "joining";
  const isDisabled =
    isCancelled || isCompleted || isFull || isHost || isJoining || isJoined || isRequestSent;

  let buttonLabel = "Join Plan";
  if (isCancelled) buttonLabel = "Cancelled";
  else if (isCompleted) buttonLabel = "Completed";
  else if (isHost) buttonLabel = "Host";
  else if (isFull) buttonLabel = "Plan Full";
  else if (isJoining) buttonLabel = "Joining...";
  else if (isRequestSent) buttonLabel = "Request Sent";
  else if (isJoined) buttonLabel = "Joined";

  const maxGuests =
    typeof plan.maxGuests === "number" && plan.maxGuests > 0 ? plan.maxGuests : null;
  const progressPercent =
    maxGuests !== null ? Math.max(0, Math.min(100, (plan.attendeeCount / maxGuests) * 100)) : 0;

  return (
    <article
      className="rounded-2xl border border-amber-100 bg-white/90 shadow-sm p-4 sm:p-5 cursor-pointer"
      onClick={() => navigate(`/plans/${plan.id}`)}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-black text-slate-900 leading-tight">
          {plan.title}
        </h3>
        <div className="flex flex-col items-end gap-1">
          {isHost && (
            <span className="shrink-0 rounded-full bg-amber-100 text-amber-700 text-[11px] font-semibold px-2 py-0.5 shadow-sm">
              👑 Host
            </span>
          )}
          {(isJoined || Boolean(plan.isJoined)) && (
            <span className="shrink-0 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-semibold px-2 py-0.5 shadow-sm">
              🟢 Joined
            </span>
          )}
          {isFull && (
            <span className="shrink-0 rounded-full bg-rose-100 text-rose-700 text-[11px] font-semibold px-2 py-0.5 shadow-sm">
              🔴 Full
            </span>
          )}
          {isCancelled && (
            <span className="shrink-0 rounded-full bg-violet-100 text-violet-700 text-[11px] font-semibold px-2 py-0.5 shadow-sm">
              🟣 Cancelled
            </span>
          )}
          {isCompleted && (
            <span className="shrink-0 rounded-full bg-slate-200 text-slate-700 text-[11px] font-semibold px-2 py-0.5 shadow-sm">
              ⚫ Completed
            </span>
          )}
        </div>
      </div>

      <p className="mt-2 text-sm text-slate-600 leading-relaxed">
        {plan.description}
      </p>

      <div className="mt-3">
        <p className="text-xs text-slate-600">
          {maxGuests !== null
            ? `${plan.attendeeCount} / ${maxGuests} spots filled`
            : `${plan.attendeeCount} spots filled`}
        </p>
        {maxGuests !== null && (
          <div className="mt-1 h-2 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      <div className="mt-3 space-y-1.5 text-sm text-slate-700">
        <p>
          <span className="font-semibold">Location:</span> {plan.location}
        </p>
        <p>
          <span className="font-semibold">Starts:</span>{" "}
          {formatStartTime(plan.startAt)}
        </p>
        <p>
          <span className="font-semibold">Host:</span> {plan.hostName}
        </p>
        <p>
          <span className="font-semibold">Attendees:</span> {plan.attendeeCount}
          {maxGuests !== null ? ` / ${maxGuests}` : ""}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          type="button"
          disabled={isDisabled}
          onClick={(e) => {
            e.stopPropagation();
            onJoin?.(plan.id);
          }}
          className={`w-full rounded-xl py-2.5 text-sm font-semibold transition ${
            isDisabled
              ? "bg-slate-200 text-slate-500 cursor-not-allowed"
              : "bg-orange-500 text-white hover:bg-orange-600"
          }`}
        >
          {buttonLabel}
        </button>
        {!isCancelled ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenChat?.(plan.id);
            }}
            className="w-full rounded-xl py-2.5 text-sm font-semibold transition bg-white border border-slate-200 text-slate-700 hover:border-orange-300 hover:text-orange-700"
          >
            Open Chat
          </button>
        ) : (
          <div className="w-full rounded-xl py-2.5 text-sm font-semibold text-center bg-slate-100 text-slate-500">
            Chat Disabled
          </div>
        )}
      </div>

      {errorMessage && (
        <p className="mt-2 text-xs text-rose-700">{errorMessage}</p>
      )}
    </article>
  );
}
