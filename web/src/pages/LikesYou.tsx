import { useEffect, useState } from "react";
import { api } from "../api";
import { Link, useNavigate } from "react-router-dom";

type LikeRow = {
  userId: number;
  fullName: string;
  age: number;
  bio?: string | null;
  avatarUrl?: string | null;
  reaction?: "like" | "superlike";
  createdAt?: string;
  isBlurred?: boolean;
  canReveal?: boolean;
};

export default function LikesYou() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<LikeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    Promise.all([
      api<LikeRow[]>("/likes/received"),
      api<{ isPremium?: boolean }>("/premium/status"),
    ])
      .then(([likes, premium]) => {
        setRows(Array.isArray(likes) ? likes : []);
        setIsPremium(Boolean(premium?.isPremium));
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load likes");
        setRows([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(1200px_380px_at_50%_-120px,rgba(190,24,93,0.24),transparent),linear-gradient(120deg,#f5d0fe_0%,#fbcfe8_45%,#ddd6fe_100%)]">
        <p className="text-slate-700">Loading likes...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_380px_at_50%_-120px,rgba(190,24,93,0.24),transparent),linear-gradient(120deg,#f5d0fe_0%,#fbcfe8_45%,#ddd6fe_100%)] px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-3xl bg-white/80 border border-white shadow-md p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.35em] text-rose-600 font-semibold">
            Likes
          </p>
          <h1 className="mt-2 text-3xl sm:text-4xl text-slate-900 font-black">
            People Who Liked You
          </h1>
          <p className="mt-2 text-slate-600">
            Free plan shows blurred previews. Premium reveals full details.
          </p>
        </div>
        {!isPremium && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 flex items-center justify-between gap-3">
            <p className="text-sm text-amber-800">Upgrade to see who liked you.</p>
            <Link to="/premium" className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600">
              Upgrade
            </Link>
          </div>
        )}
        {error && (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 p-3">
            {error}
          </p>
        )}

        {rows.length === 0 ? (
          <div className="mt-8 rounded-3xl bg-white p-8 text-center shadow-sm border border-slate-100">
            <p className="text-lg text-slate-700 font-semibold">No incoming likes yet.</p>
            <p className="mt-2 text-slate-500">Keep your profile active to get more visibility.</p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {rows.map((row, idx) => (
              <article
                key={`${row.userId}-${row.createdAt ?? ""}`}
                className={`group relative overflow-hidden rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl transition duration-300 animate-[fadeIn_240ms_ease-out] ${
                  isPremium && !row.isBlurred ? "cursor-pointer" : ""
                }`}
                style={{ animationDelay: `${idx * 45}ms` }}
                onClick={() => {
                  if (!isPremium || row.isBlurred) return;
                  navigate(`/discover/user/${row.userId}`);
                }}
              >
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-rose-300 to-amber-200 opacity-60" />
                <div className="relative p-5">
                  <img
                    src={row.avatarUrl || "/default-avatar.png"}
                    alt="Blurred profile preview"
                    className={`w-24 h-24 rounded-full object-cover border-4 border-white shadow-md ${
                      row.isBlurred ? "blur-md scale-[1.04]" : ""
                    }`}
                  />

                  <h2 className="mt-4 text-xl font-extrabold text-slate-900">
                    {row.canReveal ? row.fullName : "Hidden"}, {row.age}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600 min-h-[40px] line-clamp-2">
                    {row.bio || "No bio yet."}
                  </p>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-full px-2.5 py-1">
                      {row.reaction === "superlike" ? "Super Like" : "Like"}
                    </span>
                    {row.createdAt && (
                      <span className="text-xs text-slate-500">
                        {new Date(row.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
