import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { Link } from "react-router-dom";

type MatchRow = {
  id: number;
  userId: number;
  fullName: string;
  age: number;
  bio?: string | null;
  avatarUrl?: string | null;
  createdAt?: string;
};

export default function Matches() {
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<MatchRow[]>("/matches")
      .then((data) => {
        setMatches(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load matches");
        setMatches([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const newest = useMemo(() => matches[0], [matches]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(1200px_380px_at_50%_-120px,rgba(190,24,93,0.24),transparent),linear-gradient(120deg,#f5d0fe_0%,#fbcfe8_45%,#ddd6fe_100%)] flex items-center justify-center">
        <p className="text-slate-700 text-lg animate-pulse">Loading matches...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_380px_at_50%_-120px,rgba(190,24,93,0.24),transparent),linear-gradient(120deg,#f5d0fe_0%,#fbcfe8_45%,#ddd6fe_100%)] px-4 sm:px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-3xl bg-white/80 border border-white shadow-md p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.35em] text-rose-600 font-semibold">
            Connections
          </p>
          <h1 className="mt-2 text-3xl sm:text-4xl text-slate-900 font-black">
            Your Matches
          </h1>
          <p className="mt-2 text-slate-600">
            {matches.length > 0
              ? `You have ${matches.length} match${matches.length > 1 ? "es" : ""}.`
              : "No matches yet. Keep swiping to find someone."}
          </p>
          {newest?.createdAt && (
            <p className="mt-1 text-sm text-slate-500">
              Latest match:{" "}
              {new Date(newest.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 p-3">
            {error}
          </div>
        )}

        {matches.length === 0 ? (
          <div className="mt-8 rounded-3xl bg-white p-8 text-center shadow-sm border border-slate-100">
            <p className="text-lg text-slate-700 font-semibold">
              No matches yet.
            </p>
            <p className="mt-2 text-slate-500">
              Swipe right or super-like profiles in Discover.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {matches.map((m, idx) => (
              <article
                key={m.id}
                className="group relative overflow-hidden rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl transition duration-300 animate-[fadeIn_240ms_ease-out]"
                style={{ animationDelay: `${idx * 45}ms` }}
              >
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-rose-300 to-amber-200 opacity-60" />

                <div className="relative p-5">
                  <img
                    src={m.avatarUrl || "/default-avatar.png"}
                    alt={m.fullName}
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                  />

                  <h2 className="mt-4 text-xl font-extrabold text-slate-900">
                    {m.fullName}, {m.age}
                  </h2>

                  <p className="mt-2 text-sm text-slate-600 min-h-[40px] line-clamp-2">
                    {m.bio || "No bio yet."}
                  </p>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-full px-2.5 py-1">
                      Matched
                    </span>
                    {m.createdAt && (
                      <span className="text-xs text-slate-500">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <Link
                    to={`/chat?userId=${m.userId}`}
                    className="mt-4 inline-block text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 px-3 py-1.5 rounded-lg transition"
                  >
                    Message
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
