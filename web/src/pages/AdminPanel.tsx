import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";

type AdminStats = {
  totalUsers: number;
  totalMatches: number;
  reportsOpen: number;
  swipesToday: number;
};

type Analytics = {
  swipesToday: number;
  matchesToday: number;
  activeUsers7d: number;
  retention7d: number;
  dailyActiveUsers: number;
};

type AdminUser = {
  id: number;
  collegeId: string;
  fullName: string;
  age: number;
  gender?: string | null;
  isAdmin: number;
  branch?: string | null;
  year?: number | null;
};

type AdminReport = {
  id: number;
  reason: string;
  status: string;
  reporterName: string;
  reportedName: string;
  createdAt: string;
};

type AdminFeedback = {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  category: "bug" | "feature" | "ui" | "performance" | "other";
  rating: number;
  status: "new" | "reviewed" | "closed";
  subject: string;
  message: string;
  createdAt: string;
  collegeId: string;
  age?: number | null;
  gender?: string | null;
  branch?: string | null;
  year?: number | null;
};

type SectionView = "overview" | "reports" | "users" | "feedback";

export default function AdminPanel() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [feedback, setFeedback] = useState<AdminFeedback[]>([]);
  const [feedbackQuery, setFeedbackQuery] = useState("");
  const [feedbackStatusFilter, setFeedbackStatusFilter] =
    useState<"all" | "new" | "reviewed" | "closed">("all");
  const [feedbackCategoryFilter, setFeedbackCategoryFilter] =
    useState<"all" | "bug" | "feature" | "ui" | "performance" | "other">("all");
  const [feedbackRatingFilter, setFeedbackRatingFilter] = useState<"all" | "1" | "2" | "3" | "4" | "5">("all");
  const [activeSection, setActiveSection] = useState<SectionView>("overview");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const section = searchParams.get("section");
    if (section === "overview" || section === "reports" || section === "users" || section === "feedback") {
      setActiveSection(section);
    }
  }, [searchParams]);

  function handleSectionChange(section: SectionView) {
    setActiveSection(section);
    const next = new URLSearchParams(searchParams);
    next.set("section", section);
    setSearchParams(next, { replace: true });
  }

  async function loadAll() {
    try {
      const feedbackPath = (() => {
        const params = new URLSearchParams();
        if (feedbackQuery.trim()) params.set("q", feedbackQuery.trim());
        if (feedbackStatusFilter !== "all") params.set("status", feedbackStatusFilter);
        if (feedbackCategoryFilter !== "all") params.set("category", feedbackCategoryFilter);
        if (feedbackRatingFilter !== "all") params.set("rating", feedbackRatingFilter);
        const qs = params.toString();
        return qs ? `/admin/feedback?${qs}` : "/admin/feedback";
      })();

      const [s, a, u, r, f] = await Promise.all([
        api<AdminStats>("/admin/stats"),
        api<Analytics>("/analytics/overview"),
        api<AdminUser[]>("/admin/users"),
        api<AdminReport[]>("/admin/reports"),
        api<AdminFeedback[]>(feedbackPath),
      ]);
      setStats(s);
      setAnalytics(a);
      setUsers(Array.isArray(u) ? u : []);
      setReports(Array.isArray(r) ? r : []);
      setFeedback(Array.isArray(f) ? f : []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin panel");
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const me = await api<{ isAdmin?: boolean | number }>("/profiles/me");
        const isAdmin = me?.isAdmin === true || me?.isAdmin === 1;
        if (!isAdmin) {
          navigate("/", { replace: true });
          return;
        }
        if (!cancelled) {
          await loadAll();
        }
      } catch {
        navigate("/", { replace: true });
      } finally {
        if (!cancelled) setCheckingAccess(false);
      }
    }
    void init();
    return () => {
      cancelled = true;
    };
  }, [navigate, feedbackQuery, feedbackStatusFilter, feedbackCategoryFilter, feedbackRatingFilter]);

  if (checkingAccess) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-white px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-4">
        <h1 className="text-3xl font-black text-slate-900">Admin Dashboard</h1>
        {error && <p className="text-sm text-rose-700 bg-rose-50 p-2 rounded-lg">{error}</p>}

        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-3 flex flex-wrap gap-2">
          {(["overview", "reports", "users", "feedback"] as SectionView[]).map((section) => (
            <button
              key={section}
              type="button"
              onClick={() => handleSectionChange(section)}
              className={[
                "px-3 py-2 rounded-xl text-sm font-semibold transition",
                activeSection === section
                  ? "bg-pink-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200",
              ].join(" ")}
            >
              {section === "overview"
                ? "Overview"
                : section === "reports"
                ? "Reports"
                : section === "users"
                ? "Users"
                : "Feedback"}
            </button>
          ))}
        </div>

        {(activeSection === "overview" || activeSection === "reports" || activeSection === "users" || activeSection === "feedback") && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Users" value={stats?.totalUsers ?? 0} />
            <StatCard label="Matches" value={stats?.totalMatches ?? 0} />
            <StatCard label="Open Reports" value={stats?.reportsOpen ?? 0} />
            <StatCard label="Swipes Today" value={stats?.swipesToday ?? 0} />
          </div>
        )}

        {activeSection === "overview" && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard label="DAU" value={analytics?.dailyActiveUsers ?? 0} />
            <StatCard label="Swipes/Day" value={analytics?.swipesToday ?? 0} />
            <StatCard label="Matches/Day" value={analytics?.matchesToday ?? 0} />
            <StatCard label="Active 7D" value={analytics?.activeUsers7d ?? 0} />
            <StatCard label="Retention 7D" value={`${analytics?.retention7d ?? 0}%`} />
          </div>
        )}

        {(activeSection === "reports" || activeSection === "overview") && (
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <h2 className="font-bold text-slate-900 mb-3">Reports</h2>
          <div className="space-y-2">
            {reports.map((r) => (
              <div key={r.id} className="border border-slate-100 rounded-xl p-3 text-sm">
                <p>
                  <span className="font-semibold">{r.reporterName}</span> reported{" "}
                  <span className="font-semibold">{r.reportedName}</span>
                </p>
                <p className="text-slate-600">{r.reason}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-slate-500">{r.status}</span>
                  <button
                    type="button"
                    onClick={async () => {
                      await api(`/admin/reports/${r.id}/status`, {
                        method: "POST",
                        body: JSON.stringify({ status: "reviewed" }),
                      });
                      void loadAll();
                    }}
                    className="text-xs bg-slate-900 text-white px-2 py-1 rounded"
                  >
                    Mark reviewed
                  </button>
                </div>
              </div>
            ))}
            {reports.length === 0 && <p className="text-sm text-slate-500">No reports.</p>}
          </div>
          </section>
        )}

        {(activeSection === "users" || activeSection === "overview") && (
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <h2 className="font-bold text-slate-900 mb-3">Users</h2>
          <div className="space-y-2">
            {users.map((u) => (
              <div
                key={u.id}
                className="border border-slate-100 rounded-xl p-3 flex items-center justify-between gap-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {u.fullName} ({u.collegeId})
                  </p>
                  <p className="text-slate-500">
                    {u.gender || "N/A"} • {u.branch || "N/A"} • Year {u.year || "-"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await api(`/admin/users/${u.id}`, { method: "DELETE" });
                    void loadAll();
                  }}
                  className="text-xs bg-rose-600 text-white px-3 py-1.5 rounded-lg"
                >
                  Delete
                </button>
              </div>
            ))}
            {users.length === 0 && <p className="text-sm text-slate-500">No users.</p>}
          </div>
          </section>
        )}

        {(activeSection === "feedback" || activeSection === "overview") && (
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <h2 className="font-bold text-slate-900 mb-3">Feedback</h2>
          <div className="mb-3 grid grid-cols-1 md:grid-cols-4 gap-2">
            <input
              value={feedbackQuery}
              onChange={(e) => setFeedbackQuery(e.target.value)}
              placeholder="Search name, email, subject..."
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
            <select
              value={feedbackStatusFilter}
              onChange={(e) => setFeedbackStatusFilter(e.target.value as typeof feedbackStatusFilter)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="all">All status</option>
              <option value="new">New</option>
              <option value="reviewed">Reviewed</option>
              <option value="closed">Closed</option>
            </select>
            <select
              value={feedbackCategoryFilter}
              onChange={(e) => setFeedbackCategoryFilter(e.target.value as typeof feedbackCategoryFilter)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="all">All categories</option>
              <option value="bug">Bug</option>
              <option value="feature">Feature</option>
              <option value="ui">UI/UX</option>
              <option value="performance">Performance</option>
              <option value="other">Other</option>
            </select>
            <select
              value={feedbackRatingFilter}
              onChange={(e) => setFeedbackRatingFilter(e.target.value as typeof feedbackRatingFilter)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="all">All ratings</option>
              <option value="5">5</option>
              <option value="4">4</option>
              <option value="3">3</option>
              <option value="2">2</option>
              <option value="1">1</option>
            </select>
          </div>
          <div className="space-y-2">
            {feedback.map((item) => (
              <div key={item.id} className="border border-slate-100 rounded-xl p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">
                    {item.fullName} ({item.collegeId})
                  </p>
                  <span className="text-xs text-slate-500">
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 text-slate-600">
                  {item.email} • {item.gender || "N/A"} • Age {item.age ?? "-"} •{" "}
                  {item.branch || "N/A"} • Year {item.year ?? "-"}
                </p>
                <p className="mt-1 text-slate-700">
                  <span className="font-semibold">Category:</span> {item.category} •{" "}
                  <span className="font-semibold">Rating:</span> {item.rating}/5
                </p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span
                    className={[
                      "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold border",
                      item.status === "new"
                        ? "bg-sky-50 text-sky-700 border-sky-200"
                        : item.status === "reviewed"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-700 border-slate-200",
                    ].join(" ")}
                  >
                    {item.status}
                  </span>
                  <div className="flex items-center gap-1">
                    {(["new", "reviewed", "closed"] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={async () => {
                          await api(`/admin/feedback/${item.id}/status`, {
                            method: "PATCH",
                            body: JSON.stringify({ status }),
                          });
                          await loadAll();
                        }}
                        className={[
                          "px-2 py-1 rounded text-xs font-semibold border transition",
                          item.status === status
                            ? "bg-pink-600 text-white border-pink-600"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
                        ].join(" ")}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="mt-1 font-semibold text-slate-900">{item.subject}</p>
                <p className="mt-1 text-slate-700 whitespace-pre-wrap">{item.message}</p>
              </div>
            ))}
            {feedback.length === 0 && <p className="text-sm text-slate-500">No feedback yet.</p>}
          </div>
          </section>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-black text-slate-900">{value}</p>
    </div>
  );
}
