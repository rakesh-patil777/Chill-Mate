import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";

type UserDetail = {
  id: number;
  fullName: string;
  age: number;
  gender?: string | null;
  bio?: string | null;
  hobbies?: string | null;
  interests?: string | null;
  branch?: string | null;
  year?: number | null;
  avatarUrl?: string | null;
  photos?: string[];
  swipeStreak?: number;
};

type Reaction = "like" | "dislike" | "superlike";

export default function DiscoverUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const userId = Number(id);
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isInteger(userId) || userId <= 0) {
      setError("Invalid profile");
      setLoading(false);
      return;
    }
    api<UserDetail>(`/profiles/${userId}`)
      .then((data) => setUser(data))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load profile"))
      .finally(() => setLoading(false));
  }, [userId]);

  const chips = useMemo(() => {
    if (!user) return [];
    const values = [user.gender, user.branch, user.year ? `Year ${user.year}` : null].filter(Boolean);
    return values as string[];
  }, [user]);

  async function react(reaction: Reaction) {
    if (!user || acting) return;
    setActing(true);
    try {
      await api("/likes", {
        method: "POST",
        body: JSON.stringify({ targetUserId: user.id, reaction }),
      });
      navigate("/discover");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
      setActing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-fuchsia-100 via-pink-100 to-violet-100 flex items-center justify-center">
        <p className="text-slate-700 font-semibold">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-fuchsia-100 via-pink-100 to-violet-100 flex items-center justify-center">
        <p className="text-rose-700">{error || "Profile not found."}</p>
      </div>
    );
  }

  const interestList = (user.interests || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const hobbyList = (user.hobbies || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const gallery = [user.avatarUrl, ...(Array.isArray(user.photos) ? user.photos : [])]
    .filter((x): x is string => Boolean(x))
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-100 via-pink-100 to-violet-100 px-4 py-6">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
        <aside className="rounded-3xl overflow-hidden shadow-xl border border-white/40 bg-black relative min-h-[540px]">
          <img
            src={user.avatarUrl || "/default-avatar.png"}
            alt={user.fullName}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
          <button
            type="button"
            onClick={() => navigate("/discover")}
            className="absolute top-3 left-3 rounded-lg bg-black/50 text-white text-xs px-3 py-1.5"
          >
            Back
          </button>
          <div className="absolute bottom-5 left-5 right-5 text-white">
            <h1 className="text-4xl font-black leading-none">
              {user.fullName}, {user.age}
            </h1>
            {chips.length > 0 && <p className="mt-2 text-sm text-white/85">{chips.join(" | ")}</p>}
          </div>
        </aside>

        <section className="rounded-3xl bg-white/90 border border-white/70 shadow-md p-5">
          {gallery.length > 1 && (
            <div className="mb-4 grid grid-cols-3 sm:grid-cols-4 gap-2">
              {gallery.map((img, idx) => (
                <img
                  key={`${img}-${idx}`}
                  src={img}
                  alt={`${user.fullName} photo ${idx + 1}`}
                  className="h-20 w-full rounded-xl object-cover border border-slate-200"
                />
              ))}
            </div>
          )}
          <h2 className="text-2xl font-black text-slate-900">About {user.fullName}</h2>
          <p className="mt-2 text-slate-700">{user.bio || "Hi there! I am using Chill Mate."}</p>
          {(user.swipeStreak ?? 0) > 0 && (
            <p className="mt-2 inline-flex rounded-full border border-amber-200 bg-amber-50 text-amber-700 text-xs px-2.5 py-1 font-semibold">
              {user.swipeStreak}-day streak
            </p>
          )}

          <div className="mt-6">
            <h3 className="text-sm uppercase tracking-[0.2em] text-slate-500 font-semibold">Interests</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {(interestList.length ? interestList : ["Not added"]).map((item) => (
                <span
                  key={`i-${item}`}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <h3 className="text-sm uppercase tracking-[0.2em] text-slate-500 font-semibold">More About Me</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {(hobbyList.length ? hobbyList : ["No hobbies added"]).map((item) => (
                <span
                  key={`h-${item}`}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          {error && (
            <p className="mt-4 text-sm rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-700">
              {error}
            </p>
          )}

          <div className="mt-8 flex items-center gap-3 justify-center lg:justify-start">
            <button
              type="button"
              disabled={acting}
              onClick={() => react("dislike")}
              className="h-14 px-5 rounded-full border border-slate-200 bg-white text-rose-600 font-black hover:scale-105 transition disabled:opacity-60"
            >
              Nope
            </button>
            <button
              type="button"
              disabled={acting}
              onClick={() => react("superlike")}
              className="h-14 px-5 rounded-2xl bg-sky-500 text-white font-black hover:scale-105 transition disabled:opacity-60"
            >
              SL
            </button>
            <button
              type="button"
              disabled={acting}
              onClick={() => react("like")}
              className="h-14 px-5 rounded-full border border-slate-200 bg-white text-emerald-600 font-black hover:scale-105 transition disabled:opacity-60"
            >
              Like
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
