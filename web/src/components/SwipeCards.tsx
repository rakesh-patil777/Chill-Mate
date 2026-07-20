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
    null,
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
      if (filters.interests?.trim())
        query.set("interests", filters.interests.trim());
      if (filters.gender?.trim()) query.set("gender", filters.gender.trim());
      if (filters.branch?.trim()) query.set("branch", filters.branch.trim());
      if (filters.year) query.set("year", String(filters.year));
      const data = await api<User[]>(
        `/profiles/discover${query.toString() ? `?${query.toString()}` : ""}`,
      );
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
      setError(
        raw.includes("SWIPE_LIMIT") || raw.includes("Daily swipe limit reached")
          ? "Daily swipe limit reached for free plan."
          : "Swipe failed. Try again.",
      );
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
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-pink-500 border-t-transparent mb-3" />
        <div className="text-rose-600 text-base font-semibold animate-pulse font-display">
          Discovering vibe partners...
        </div>
      </div>
    );
  }

  if (currentIndex >= users.length) {
    return (
      <div className="glass-panel rounded-3xl p-8 text-center max-w-sm w-full mx-auto animate-[fadeIn_250ms_ease-out]">
        <span className="text-4xl">🎓</span>
        <h3 className="mt-4 text-xl font-bold text-slate-800 font-display">No more campus vibes nearby</h3>
        <p className="mt-2 text-slate-500 text-sm">
          Try loosening your filter preferences or check back later!
        </p>
      </div>
    );
  }

  const user = users[currentIndex];
  const nextUser = users[currentIndex + 1];
  const thirdUser = users[currentIndex + 2];
  const dragRotation = dragX / 20;
  const revealStrength = Math.min(Math.abs(dragX) / 220, 1);

  if (!user) return null;

  const hobbyList = user.hobbies
    ? user.hobbies.split(",").map((h) => h.trim()).filter(Boolean)
    : [];

  return (
    <>
      <div className="flex flex-col items-center justify-center w-full h-full pb-4">
        {/* Swiping Stack */}
        <div className="relative w-full max-w-[340px] h-[60vh] max-h-[500px] min-h-[420px] select-none">
          {/* Card Stack Background 2 */}
          {thirdUser && (
            <div className="absolute inset-0 translate-y-6 scale-[0.88] rounded-[28px] bg-white/20 border border-white/30 backdrop-blur-md opacity-60 shadow-md" />
          )}

          {/* Card Stack Background 1 */}
          {nextUser && (
            <div
              className="absolute inset-0 rounded-[28px] overflow-hidden border border-white/40 shadow-lg bg-white/50 backdrop-blur-md transition-all duration-300"
              style={{
                transform: `translateY(${12 - revealStrength * 12}px) scale(${
                  0.94 + revealStrength * 0.06
                })`,
              }}
            >
              <img
                src={nextUser.avatarUrl || "/default-avatar.png"}
                alt={nextUser.fullName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
            </div>
          )}

          {/* Active Card */}
          <div
            className={`absolute inset-0 ${
              isAnimating
                ? "transition-transform duration-300 ease-out"
                : "transition-transform duration-200 ease-out"
            }`}
            style={{
              transform: `translate3d(${dragX}px, ${
                dragY + Math.abs(dragX) * 0.08
              }px, 0) rotate(${dragRotation}deg)`,
              opacity: 1 - Math.min(Math.abs(dragX) / 520, 0.4),
            }}
          >
            <div
              className="relative h-full w-full rounded-[28px] overflow-hidden shadow-xl bg-white border border-white/50 cursor-grab active:cursor-grabbing hover-lift"
              onPointerDown={(e) => {
                (e.currentTarget as HTMLDivElement).setPointerCapture(
                  e.pointerId,
                );
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
                className="w-full h-full object-cover object-center"
                draggable={false}
              />

              {/* Scrim Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent pointer-events-none rounded-[28px]" />

              {/* Like / Nope / Superlike Badges */}
              {dragX > 35 && (
                <div className="absolute top-9 left-6 text-emerald-400 text-2xl font-black -rotate-[12deg] border-4 border-emerald-400 px-3.5 py-1 rounded-2xl tracking-wider pointer-events-none shadow-md backdrop-blur-sm bg-black/10">
                  LIKE
                </div>
              )}

              {dragX < -35 && (
                <div className="absolute top-9 right-6 text-rose-500 text-2xl font-black rotate-[12deg] border-4 border-rose-500 px-3.5 py-1 rounded-2xl tracking-wider pointer-events-none shadow-md backdrop-blur-sm bg-black/10">
                  NOPE
                </div>
              )}

              {dragY < -45 && Math.abs(dragX) < 140 && (
                <div className="absolute top-9 left-1/2 -translate-x-1/2 text-sky-400 text-xl font-black border-4 border-sky-400 px-3.5 py-1 rounded-2xl tracking-wider pointer-events-none shadow-md backdrop-blur-sm bg-black/10">
                  SUPER LIKE
                </div>
              )}

              {/* Info Area (Outfit font names, Inter text) */}
              <div className="absolute bottom-24 left-6 right-6 text-white z-10 pointer-events-none">
                <h2 className="text-2xl font-bold drop-shadow-md flex items-center flex-wrap gap-2 font-display">
                  {user.fullName}, {user.age}
                </h2>
                
                <p className="mt-1 text-xs font-semibold text-white/90 drop-shadow-sm flex items-center gap-1.5 capitalize">
                  <span>🏢</span>
                  <span>{user.branch || "Unspecified Branch"} {user.year ? `• Year ${user.year}` : ""}</span>
                </p>

                {user.bio && (
                  <p className="mt-2 text-xs text-slate-200 line-clamp-2 leading-relaxed drop-shadow">
                    {user.bio}
                  </p>
                )}

                {/* Hobbies / Interests tags */}
                {hobbyList.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {hobbyList.slice(0, 3).map((hobby) => (
                      <span
                        key={hobby}
                        className="rounded-full bg-white/20 border border-white/10 px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur-sm"
                      >
                        {hobby}
                      </span>
                    ))}
                  </div>
                )}

                {/* Streak */}
                {(user.swipeStreak ?? 0) > 0 && (
                  <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-amber-500/25 border border-amber-400/40 px-2.5 py-1 text-[10px] text-amber-200 font-bold tracking-wide backdrop-blur-sm shadow-sm">
                    <span>🔥</span>
                    <span>{user.swipeStreak}-DAY STREAK</span>
                  </div>
                )}
              </div>

              {/* Quick report actions */}
              <div className="absolute top-4 left-4 right-4 flex justify-between gap-2 z-10">
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
                  className="text-[10px] font-bold tracking-wide uppercase bg-black/40 hover:bg-black/60 text-white/80 px-2.5 py-1 rounded-full border border-white/10 backdrop-blur-sm"
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
                  className="text-[10px] font-bold tracking-wide uppercase bg-black/40 hover:bg-black/60 text-white/80 px-2.5 py-1 rounded-full border border-white/10 backdrop-blur-sm"
                >
                  Report
                </button>
              </div>

              <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-5 z-30 px-4">
                {/* Dislike / Pass Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    animateSwipe("dislike");
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="w-14 h-14 shrink-0 bg-white hover:bg-slate-50 text-rose-500 rounded-full flex items-center justify-center shadow-lg border-[5px] border-slate-100 hover:scale-105 active:scale-95 transition-all duration-200"
                  aria-label="Pass Profile"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3.5} stroke="currentColor" className="w-7 h-7">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Super Like Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    animateSwipe("superlike");
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="w-12 h-12 shrink-0 bg-white hover:bg-slate-50 text-sky-400 rounded-full flex items-center justify-center shadow-md border-4 border-slate-100 hover:scale-105 active:scale-95 transition-all duration-200"
                  aria-label="Super Like"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                </button>

                {/* Like Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    animateSwipe("like");
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="w-14 h-14 shrink-0 bg-white hover:bg-slate-50 text-emerald-500 rounded-full flex items-center justify-center shadow-lg border-[5px] border-slate-100 hover:scale-105 active:scale-95 transition-all duration-200"
                  aria-label="Like Profile"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-7 h-7">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily remaining swipes footer */}
      {(!swipeMeta.premium &&
        swipeMeta.remainingSwipes !== undefined &&
        swipeMeta.remainingSwipes !== null) && (
        <div className="mt-3 shrink-0 text-center w-full py-1 pointer-events-none z-10 animate-[fadeIn_200ms_ease-out]">
          <p className="text-xs text-slate-500 font-bold tracking-wide uppercase">
            Swipes left: {swipeMeta.remainingSwipes}
            {swipeMeta.freeDailyLimit ? ` / ${swipeMeta.freeDailyLimit}` : ""}
          </p>
        </div>
      )}

      {/* Match Celebration Dialog */}
      {matchUser && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-[32px] bg-gradient-to-b from-rose-100 to-pink-50 p-6 text-center shadow-2xl border border-white/60 animate-[fadeIn_220ms_ease-out]">
            <p className="text-[11px] font-extrabold tracking-[0.25em] uppercase text-rose-600 font-display">
              It's a Match! 🎉
            </p>
            <h3 className="mt-2 text-3xl font-black text-slate-800 font-display">
              You & {matchUser.fullName.split(" ")[0]}
            </h3>
            
            <div className="relative w-28 h-28 mx-auto mt-6">
              <img
                src={matchUser.avatarUrl || "/default-avatar.png"}
                alt={matchUser.fullName}
                className="w-full h-full rounded-full object-cover border-4 border-white shadow-md"
              />
              <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-pink-500 to-rose-500 w-9 h-9 rounded-full flex items-center justify-center text-white text-base shadow border border-white">
                ♥
              </div>
            </div>

            <p className="mt-5 text-sm text-slate-600 leading-relaxed px-2">
              You both matched over mutual interest. Start a real campus conversation now!
            </p>
            
            <div className="mt-6.5 flex flex-col gap-2">
              <button
                type="button"
                className="w-full rounded-2xl bg-gradient-to-r from-pink-600 to-rose-500 text-white font-bold py-3.5 hover:scale-[1.01] transition-all shadow-md soft-glow-brand"
                onClick={() => {
                  setMatchUser(null);
                  navigate("/matches");
                }}
              >
                Go to Matches
              </button>
              <button
                type="button"
                className="w-full rounded-2xl bg-white/70 hover:bg-white text-slate-700 font-semibold py-3 transition-all border border-slate-200"
                onClick={() => setMatchUser(null)}
              >
                Keep Swiping
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
