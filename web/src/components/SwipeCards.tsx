import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import { useNavigate } from "react-router-dom";

interface User {
  id: number;
  fullName: string;
  age: number;
  gender?: string | null;
  branch?: string | null;
  year?: number | null;
  bio: string | null;
  hobbies: string | null;
  interests: string | null;
  avatarUrl: string | null;
  swipeStreak?: number;
}

type SwipeReaction = "like" | "dislike" | "superlike";

export type DiscoverFilters = {
  minAge?: number;
  maxAge?: number;
  interests?: string;
  gender?: string;
  branch?: string;
  year?: number;
};

export default function SwipeCards({ filters }: { filters: DiscoverFilters }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [matchUser, setMatchUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [swipeMeta, setSwipeMeta] = useState<{
    remainingSwipes?: number | null;
    freeDailyLimit?: number | null;
    premium?: boolean;
  }>({});
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(
    null
  );
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
      if (filters.minAge) query.set("minAge", String(filters.minAge));
      if (filters.maxAge) query.set("maxAge", String(filters.maxAge));
      if (filters.interests?.trim()) query.set("interests", filters.interests.trim());
      if (filters.gender?.trim()) query.set("gender", filters.gender.trim());
      if (filters.branch?.trim()) query.set("branch", filters.branch.trim());
      if (filters.year) query.set("year", String(filters.year));
      const data = await api<User[]>(`/profiles/discover${query.toString() ? `?${query.toString()}` : ""}`);
      const list = Array.isArray(data) ? data : [];
      if (!fetchCancelledRef.current) {
        setUsers(list);
        setCurrentIndex(0);
        setError(null);
      }
    } catch (err) {
      console.error("Failed to load profiles", err);
      if (!fetchCancelledRef.current) setUsers([]);
    } finally {
      if (!fetchCancelledRef.current) setLoading(false);
    }
  }

  async function submitSwipe(target: User, reaction: SwipeReaction) {
    try {
      const result = await api<{ match?: boolean }>("/likes", {
        method: "POST",
        body: JSON.stringify({
          targetUserId: target.id,
          reaction,
        }),
      });
      setSwipeMeta({
        remainingSwipes: (result as any)?.remainingSwipes ?? null,
        freeDailyLimit: (result as any)?.freeDailyLimit ?? null,
        premium: Boolean((result as any)?.premium),
      });

      if (result?.match) {
        setMatchUser(target);
      }
    } catch (err) {
      console.warn("Swipe request failed", err);
      const raw = err instanceof Error ? err.message : "Swipe failed";
      setError(raw.includes("SWIPE_LIMIT") || raw.includes("Daily swipe limit reached")
        ? "Daily swipe limit reached for free plan."
        : "Swipe failed. Try again.");
    } finally {
      setCurrentIndex((prev) => prev + 1);
      setDragX(0);
      setDragY(0);
      setStartPoint(null);
      setIsAnimating(false);
    }
  }

  function animateSwipe(direction: SwipeReaction) {
    const user = users[currentIndex];
    if (!user || isAnimating) return;

    setIsAnimating(true);

    if (direction === "like") {
      setDragX(520);
      setDragY(-30);
    } else if (direction === "dislike") {
      setDragX(-520);
      setDragY(-10);
    } else {
      setDragX(0);
      setDragY(-640);
    }

    window.setTimeout(() => {
      void submitSwipe(user, direction);
    }, 280);
  }

  function startDrag(x: number, y: number) {
    if (isAnimating) return;
    hasMovedRef.current = false;
    setStartPoint({ x, y });
  }

  function handleDrag(x: number, y: number) {
    if (!startPoint || isAnimating) return;
    if (Math.abs(x - startPoint.x) > 8 || Math.abs(y - startPoint.y) > 8) {
      hasMovedRef.current = true;
    }
    setDragX(x - startPoint.x);
    setDragY(y - startPoint.y);
  }

  function endDrag() {
    if (!startPoint || isAnimating) return;

    const likeThreshold = 120;
    const superLikeThreshold = -140;

    if (dragY < superLikeThreshold && Math.abs(dragX) < 120) {
      animateSwipe("superlike");
    } else if (dragX > likeThreshold) {
      animateSwipe("like");
    } else if (dragX < -likeThreshold) {
      animateSwipe("dislike");
    } else {
      setDragX(0);
      setDragY(0);
    }

    setStartPoint(null);
  }

    if (loading) {
    return (
      <div className="text-white text-xl font-semibold animate-pulse">
        Loading profiles...
      </div>
    );
  }

  if (currentIndex >= users.length) {
    return (
      <div className="text-slate-700 text-lg sm:text-2xl font-semibold text-center px-4">
        No more profiles with current filters.
      </div>
    );
  }

  const user = users[currentIndex];
  const nextUser = users[currentIndex + 1];
  const thirdUser = users[currentIndex + 2];
  const dragRotation = dragX / 18;
  const revealStrength = Math.min(Math.abs(dragX) / 220, 1);

  if (!user) return null;

  return (
    <>
      <div className="flex items-center justify-center px-0 sm:px-4">
        <div className="relative w-full max-w-[320px] h-[62vh] sm:h-[500px] select-none">
          {thirdUser && (
            <div className="absolute inset-0 translate-y-5 scale-[0.9] rounded-3xl overflow-hidden bg-black/35 border border-white/10" />
          )}

          {nextUser && (
            <div
              className="absolute inset-0 rounded-3xl overflow-hidden shadow-xl border border-white/10 transition-all duration-300"
              style={{
                transform: `translateY(${12 - revealStrength * 10}px) scale(${
                  0.94 + revealStrength * 0.04
                })`,
              }}
            >
              <img
                src={nextUser.avatarUrl || "/default-avatar.png"}
                alt={nextUser.fullName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
            </div>
          )}

          <div
            className={`absolute inset-0 rounded-3xl overflow-hidden shadow-2xl bg-black border border-white/10 cursor-grab active:cursor-grabbing ${
              isAnimating
                ? "transition-transform duration-300 ease-out"
                : "transition-transform duration-200 ease-out"
            }`}
            style={{
              transform: `translate3d(${dragX}px, ${
                dragY + Math.abs(dragX) * 0.07
              }px, 0) rotate(${dragRotation}deg)`,
              opacity: 1 - Math.min(Math.abs(dragX) / 520, 0.5),
            }}
            onPointerDown={(e) => {
              (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
              startDrag(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => handleDrag(e.clientX, e.clientY)}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onPointerLeave={() => {
              if (!startPoint) return;
              endDrag();
            }}
            onClick={(e) => {
              const target = e.target as HTMLElement | null;
              if (target?.closest("button")) return;
              if (hasMovedRef.current || isAnimating) return;
              navigate(`/discover/user/${user.id}`);
            }}
          >
            <img
              src={user.avatarUrl || "/default-avatar.png"}
              alt={user.fullName}
              className="w-full h-full object-cover"
              draggable={false}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

            {dragX > 35 && (
              <div className="absolute top-9 left-5 text-emerald-300 text-3xl font-extrabold -rotate-[14deg] border-4 border-emerald-300 px-3 py-1 rounded-lg tracking-wider">
                LIKE
              </div>
            )}

            {dragX < -35 && (
              <div className="absolute top-9 right-5 text-rose-300 text-3xl font-extrabold rotate-[14deg] border-4 border-rose-300 px-3 py-1 rounded-lg tracking-wider">
                NOPE
              </div>
            )}

            {dragY < -45 && Math.abs(dragX) < 140 && (
              <div className="absolute top-9 left-1/2 -translate-x-1/2 text-sky-300 text-2xl font-extrabold border-4 border-sky-300 px-3 py-1 rounded-lg tracking-wide">
                SUPER LIKE
              </div>
            )}

            <div className="absolute bottom-24 left-6 right-6 text-white z-10">
              <h2 className="text-3xl font-extrabold drop-shadow-xl">
                {user.fullName}, {user.age}
              </h2>
              {(user.swipeStreak ?? 0) > 0 && (
                <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-black/35 border border-white/20 px-2.5 py-1 text-[11px] text-amber-100 font-semibold">
                  <span>🔥</span>
                  <span>{user.swipeStreak}-day streak</span>
                </p>
              )}
              <p className="mt-2 text-base opacity-90 leading-relaxed">
                {user.bio || "Hi there! I am using Chill Mate."}
              </p>
              <p className="mt-1 text-xs opacity-80">
                {[user.gender, user.branch, user.year].filter(Boolean).join(" | ")}
              </p>
            </div>

            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3 sm:gap-5 z-10 px-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  animateSwipe("dislike");
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="w-14 h-14 bg-white/95 rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition"
                aria-label="Dislike"
              >
                <span className="text-sm text-rose-500 font-black">NOPE</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  animateSwipe("superlike");
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="w-14 h-14 bg-sky-500 rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition"
                aria-label="Super like"
              >
                <span className="text-lg text-white font-black">SL</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  animateSwipe("like");
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="w-14 h-14 bg-white/95 rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition"
                aria-label="Like"
              >
                <span className="text-sm text-pink-600 font-black">LIKE</span>
              </button>
            </div>
            <div className="absolute top-3 left-3 right-3 flex justify-between gap-2 z-10">
              <button
                type="button"
                onClick={async () => {
                  await api("/safety/block", {
                    method: "POST",
                    body: JSON.stringify({ blockedUserId: user.id }),
                  });
                  setCurrentIndex((prev) => prev + 1);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="text-[11px] bg-black/45 text-white px-2 py-1 rounded-lg"
              >
                Block
              </button>
              <button
                type="button"
                onClick={async () => {
                  const reason = window.prompt("Report reason");
                  if (!reason) return;
                  await api("/safety/report", {
                    method: "POST",
                    body: JSON.stringify({ reportedUserId: user.id, reason }),
                  });
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="text-[11px] bg-black/45 text-white px-2 py-1 rounded-lg"
              >
                Report
              </button>
            </div>
          </div>
        </div>
      </div>
      {(error || (!swipeMeta.premium && swipeMeta.remainingSwipes !== undefined && swipeMeta.remainingSwipes !== null)) && (
        <div className="mt-3 text-center">
          {error && <p className="text-sm text-rose-700">{error}</p>}
          {!swipeMeta.premium &&
            swipeMeta.remainingSwipes !== undefined &&
            swipeMeta.remainingSwipes !== null && (
              <p className="text-xs text-slate-600">
                Swipes left today: {swipeMeta.remainingSwipes}
                {swipeMeta.freeDailyLimit ? ` / ${swipeMeta.freeDailyLimit}` : ""}
              </p>
            )}
        </div>
      )}

      {matchUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-rose-200 to-pink-100 p-6 text-center shadow-2xl border border-white/60 animate-[fadeIn_220ms_ease-out]">
            <p className="text-sm uppercase tracking-[0.35em] text-pink-700 font-semibold">
              It's a match
            </p>
            <h3 className="mt-2 text-3xl font-black text-pink-700">
              You and {matchUser.fullName}
            </h3>
            <img
              src={matchUser.avatarUrl || "/default-avatar.png"}
              alt={matchUser.fullName}
              className="w-24 h-24 rounded-full object-cover mx-auto mt-5 border-4 border-white shadow-md"
            />
            <p className="mt-4 text-slate-700">
              You both liked each other. Start a conversation from Matches.
            </p>
            <button
              type="button"
              className="mt-6 w-full rounded-2xl bg-pink-600 text-white font-semibold py-3 hover:bg-pink-700 transition"
              onClick={() => setMatchUser(null)}
            >
              Keep Swiping
            </button>
          </div>
        </div>
      )}
    </>
  );
}
