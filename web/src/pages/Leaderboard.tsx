import { useEffect, useState } from "react";
import { api } from "../api";

type LeaderboardUser = {
  id: number;
  fullName: string;
  avatarUrl?: string | null;
  plansHosted?: number;
  reliabilityScore?: number;
  activityScore?: number;
  highestStreak?: number;
  campusScore?: number;
  campusTier?: "Freshman" | "Explorer" | "Connector" | "Influencer" | "Campus Icon";
};

type LeaderboardResponse = {
  topHosts: LeaderboardUser[];
  mostReliable: LeaderboardUser[];
  mostActive: LeaderboardUser[];
  highestStreak: LeaderboardUser[];
  topCampusIcons: LeaderboardUser[];
};

function Row({
  user,
  rightText,
}: {
  user: LeaderboardUser;
  rightText: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2">
      <div className="flex items-center gap-3 min-w-0">
        <img
          src={user.avatarUrl || "/default-avatar.png"}
          alt={user.fullName}
          className="w-10 h-10 rounded-full object-cover border border-slate-200"
        />
        <div className="min-w-0">
          <p className="font-semibold text-slate-800 truncate">{user.fullName}</p>
          {user.campusTier && (
            <p className="text-[11px] text-slate-500">{user.campusTier}</p>
          )}
        </div>
      </div>
      <p className="text-sm text-slate-600 font-semibold">{rightText}</p>
    </div>
  );
}

export default function Leaderboard() {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<LeaderboardResponse>("/leaderboard")
      .then((resp) => setData(resp))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load leaderboard")
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-rose-100 via-amber-100 to-orange-100 flex items-center justify-center">
        <p className="text-slate-700 font-semibold">Loading leaderboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-rose-100 via-amber-100 to-orange-100 px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {error && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 p-3 text-sm">
            {error}
          </p>
        )}

        <section className="rounded-2xl bg-white/90 border border-amber-100 shadow-sm p-4 space-y-3">
          <h2 className="text-xl font-black text-amber-700">🏆 Top Hosts</h2>
          {(data?.topHosts ?? []).map((u) => (
            <Row key={`host-${u.id}`} user={u} rightText={`${u.plansHosted ?? 0} hosted`} />
          ))}
        </section>

        <section className="rounded-2xl bg-white/90 border border-amber-100 shadow-sm p-4 space-y-3">
          <h2 className="text-xl font-black text-slate-700">🛡 Most Reliable</h2>
          {(data?.mostReliable ?? []).map((u) => (
            <Row key={`rel-${u.id}`} user={u} rightText={`${u.reliabilityScore ?? 0}%`} />
          ))}
        </section>

        <section className="rounded-2xl bg-white/90 border border-amber-100 shadow-sm p-4 space-y-3">
          <h2 className="text-xl font-black text-orange-700">🔥 Most Active</h2>
          {(data?.mostActive ?? []).map((u) => (
            <Row key={`act-${u.id}`} user={u} rightText={`${u.activityScore ?? 0} pts`} />
          ))}
        </section>

        <section className="rounded-2xl bg-white/90 border border-amber-100 shadow-sm p-4 space-y-3">
          <h2 className="text-xl font-black text-rose-700">🔥 Highest Streak</h2>
          {(data?.highestStreak ?? []).map((u) => (
            <Row key={`streak-${u.id}`} user={u} rightText={`${u.highestStreak ?? 0} days`} />
          ))}
        </section>

        <section className="rounded-2xl bg-white/90 border border-amber-100 shadow-sm p-4 space-y-3">
          <h2 className="text-xl font-black text-violet-700">🏆 Campus Icons</h2>
          {(data?.topCampusIcons ?? []).map((u) => (
            <Row key={`campus-${u.id}`} user={u} rightText={`${u.campusScore ?? 0} pts`} />
          ))}
        </section>
      </div>
    </div>
  );
}

