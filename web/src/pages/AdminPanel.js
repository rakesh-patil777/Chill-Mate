import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
export default function AdminPanel() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [checkingAccess, setCheckingAccess] = useState(true);
    const [stats, setStats] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [users, setUsers] = useState([]);
    const [reports, setReports] = useState([]);
    const [feedback, setFeedback] = useState([]);
    const [feedbackQuery, setFeedbackQuery] = useState("");
    const [feedbackStatusFilter, setFeedbackStatusFilter] = useState("all");
    const [feedbackCategoryFilter, setFeedbackCategoryFilter] = useState("all");
    const [feedbackRatingFilter, setFeedbackRatingFilter] = useState("all");
    const [activeSection, setActiveSection] = useState("overview");
    const [error, setError] = useState(null);
    useEffect(() => {
        const section = searchParams.get("section");
        if (section === "overview" || section === "reports" || section === "users" || section === "feedback") {
            setActiveSection(section);
        }
    }, [searchParams]);
    function handleSectionChange(section) {
        setActiveSection(section);
        const next = new URLSearchParams(searchParams);
        next.set("section", section);
        setSearchParams(next, { replace: true });
    }
    async function loadAll() {
        try {
            const feedbackPath = (() => {
                const params = new URLSearchParams();
                if (feedbackQuery.trim())
                    params.set("q", feedbackQuery.trim());
                if (feedbackStatusFilter !== "all")
                    params.set("status", feedbackStatusFilter);
                if (feedbackCategoryFilter !== "all")
                    params.set("category", feedbackCategoryFilter);
                if (feedbackRatingFilter !== "all")
                    params.set("rating", feedbackRatingFilter);
                const qs = params.toString();
                return qs ? `/admin/feedback?${qs}` : "/admin/feedback";
            })();
            const [s, a, u, r, f] = await Promise.all([
                api("/admin/stats"),
                api("/analytics/overview"),
                api("/admin/users"),
                api("/admin/reports"),
                api(feedbackPath),
            ]);
            setStats(s);
            setAnalytics(a);
            setUsers(Array.isArray(u) ? u : []);
            setReports(Array.isArray(r) ? r : []);
            setFeedback(Array.isArray(f) ? f : []);
            setError(null);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load admin panel");
        }
    }
    useEffect(() => {
        let cancelled = false;
        async function init() {
            try {
                const me = await api("/profiles/me");
                const isAdmin = me?.isAdmin === true || me?.isAdmin === 1;
                if (!isAdmin) {
                    navigate("/", { replace: true });
                    return;
                }
                if (!cancelled) {
                    await loadAll();
                }
            }
            catch {
                navigate("/", { replace: true });
            }
            finally {
                if (!cancelled)
                    setCheckingAccess(false);
            }
        }
        void init();
        return () => {
            cancelled = true;
        };
    }, [navigate, feedbackQuery, feedbackStatusFilter, feedbackCategoryFilter, feedbackRatingFilter]);
    if (checkingAccess)
        return null;
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-b from-slate-100 to-white px-4 py-8", children: _jsxs("div", { className: "max-w-6xl mx-auto space-y-4", children: [_jsx("h1", { className: "text-3xl font-black text-slate-900", children: "Admin Dashboard" }), error && _jsx("p", { className: "text-sm text-rose-700 bg-rose-50 p-2 rounded-lg", children: error }), _jsx("div", { className: "rounded-2xl bg-white border border-slate-100 shadow-sm p-3 flex flex-wrap gap-2", children: ["overview", "reports", "users", "feedback"].map((section) => (_jsx("button", { type: "button", onClick: () => handleSectionChange(section), className: [
                            "px-3 py-2 rounded-xl text-sm font-semibold transition",
                            activeSection === section
                                ? "bg-pink-600 text-white"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                        ].join(" "), children: section === "overview"
                            ? "Overview"
                            : section === "reports"
                                ? "Reports"
                                : section === "users"
                                    ? "Users"
                                    : "Feedback" }, section))) }), (activeSection === "overview" || activeSection === "reports" || activeSection === "users" || activeSection === "feedback") && (_jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [_jsx(StatCard, { label: "Users", value: stats?.totalUsers ?? 0 }), _jsx(StatCard, { label: "Matches", value: stats?.totalMatches ?? 0 }), _jsx(StatCard, { label: "Open Reports", value: stats?.reportsOpen ?? 0 }), _jsx(StatCard, { label: "Swipes Today", value: stats?.swipesToday ?? 0 })] })), activeSection === "overview" && (_jsxs("div", { className: "grid grid-cols-2 md:grid-cols-5 gap-3", children: [_jsx(StatCard, { label: "DAU", value: analytics?.dailyActiveUsers ?? 0 }), _jsx(StatCard, { label: "Swipes/Day", value: analytics?.swipesToday ?? 0 }), _jsx(StatCard, { label: "Matches/Day", value: analytics?.matchesToday ?? 0 }), _jsx(StatCard, { label: "Active 7D", value: analytics?.activeUsers7d ?? 0 }), _jsx(StatCard, { label: "Retention 7D", value: `${analytics?.retention7d ?? 0}%` })] })), (activeSection === "reports" || activeSection === "overview") && (_jsxs("section", { className: "bg-white rounded-2xl border border-slate-100 shadow-sm p-4", children: [_jsx("h2", { className: "font-bold text-slate-900 mb-3", children: "Reports" }), _jsxs("div", { className: "space-y-2", children: [reports.map((r) => (_jsxs("div", { className: "border border-slate-100 rounded-xl p-3 text-sm", children: [_jsxs("p", { children: [_jsx("span", { className: "font-semibold", children: r.reporterName }), " reported", " ", _jsx("span", { className: "font-semibold", children: r.reportedName })] }), _jsx("p", { className: "text-slate-600", children: r.reason }), _jsxs("div", { className: "mt-2 flex items-center gap-2", children: [_jsx("span", { className: "text-xs text-slate-500", children: r.status }), _jsx("button", { type: "button", onClick: async () => {
                                                        await api(`/admin/reports/${r.id}/status`, {
                                                            method: "POST",
                                                            body: JSON.stringify({ status: "reviewed" }),
                                                        });
                                                        void loadAll();
                                                    }, className: "text-xs bg-slate-900 text-white px-2 py-1 rounded", children: "Mark reviewed" })] })] }, r.id))), reports.length === 0 && _jsx("p", { className: "text-sm text-slate-500", children: "No reports." })] })] })), (activeSection === "users" || activeSection === "overview") && (_jsxs("section", { className: "bg-white rounded-2xl border border-slate-100 shadow-sm p-4", children: [_jsx("h2", { className: "font-bold text-slate-900 mb-3", children: "Users" }), _jsxs("div", { className: "space-y-2", children: [users.map((u) => (_jsxs("div", { className: "border border-slate-100 rounded-xl p-3 flex items-center justify-between gap-3 text-sm", children: [_jsxs("div", { children: [_jsxs("p", { className: "font-semibold text-slate-900", children: [u.fullName, " (", u.collegeId, ")"] }), _jsxs("p", { className: "text-slate-500", children: [u.gender || "N/A", " \u2022 ", u.branch || "N/A", " \u2022 Year ", u.year || "-"] })] }), _jsx("button", { type: "button", onClick: async () => {
                                                await api(`/admin/users/${u.id}`, { method: "DELETE" });
                                                void loadAll();
                                            }, className: "text-xs bg-rose-600 text-white px-3 py-1.5 rounded-lg", children: "Delete" })] }, u.id))), users.length === 0 && _jsx("p", { className: "text-sm text-slate-500", children: "No users." })] })] })), (activeSection === "feedback" || activeSection === "overview") && (_jsxs("section", { className: "bg-white rounded-2xl border border-slate-100 shadow-sm p-4", children: [_jsx("h2", { className: "font-bold text-slate-900 mb-3", children: "Feedback" }), _jsxs("div", { className: "mb-3 grid grid-cols-1 md:grid-cols-4 gap-2", children: [_jsx("input", { value: feedbackQuery, onChange: (e) => setFeedbackQuery(e.target.value), placeholder: "Search name, email, subject...", className: "rounded-xl border border-slate-200 px-3 py-2 text-sm" }), _jsxs("select", { value: feedbackStatusFilter, onChange: (e) => setFeedbackStatusFilter(e.target.value), className: "rounded-xl border border-slate-200 px-3 py-2 text-sm", children: [_jsx("option", { value: "all", children: "All status" }), _jsx("option", { value: "new", children: "New" }), _jsx("option", { value: "reviewed", children: "Reviewed" }), _jsx("option", { value: "closed", children: "Closed" })] }), _jsxs("select", { value: feedbackCategoryFilter, onChange: (e) => setFeedbackCategoryFilter(e.target.value), className: "rounded-xl border border-slate-200 px-3 py-2 text-sm", children: [_jsx("option", { value: "all", children: "All categories" }), _jsx("option", { value: "bug", children: "Bug" }), _jsx("option", { value: "feature", children: "Feature" }), _jsx("option", { value: "ui", children: "UI/UX" }), _jsx("option", { value: "performance", children: "Performance" }), _jsx("option", { value: "other", children: "Other" })] }), _jsxs("select", { value: feedbackRatingFilter, onChange: (e) => setFeedbackRatingFilter(e.target.value), className: "rounded-xl border border-slate-200 px-3 py-2 text-sm", children: [_jsx("option", { value: "all", children: "All ratings" }), _jsx("option", { value: "5", children: "5" }), _jsx("option", { value: "4", children: "4" }), _jsx("option", { value: "3", children: "3" }), _jsx("option", { value: "2", children: "2" }), _jsx("option", { value: "1", children: "1" })] })] }), _jsxs("div", { className: "space-y-2", children: [feedback.map((item) => (_jsxs("div", { className: "border border-slate-100 rounded-xl p-3 text-sm", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [_jsxs("p", { className: "font-semibold text-slate-900", children: [item.fullName, " (", item.collegeId, ")"] }), _jsx("span", { className: "text-xs text-slate-500", children: new Date(item.createdAt).toLocaleString() })] }), _jsxs("p", { className: "mt-1 text-slate-600", children: [item.email, " \u2022 ", item.gender || "N/A", " \u2022 Age ", item.age ?? "-", " \u2022", " ", item.branch || "N/A", " \u2022 Year ", item.year ?? "-"] }), _jsxs("p", { className: "mt-1 text-slate-700", children: [_jsx("span", { className: "font-semibold", children: "Category:" }), " ", item.category, " \u2022", " ", _jsx("span", { className: "font-semibold", children: "Rating:" }), " ", item.rating, "/5"] }), _jsxs("div", { className: "mt-1 flex items-center justify-between gap-2", children: [_jsx("span", { className: [
                                                        "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold border",
                                                        item.status === "new"
                                                            ? "bg-sky-50 text-sky-700 border-sky-200"
                                                            : item.status === "reviewed"
                                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                                : "bg-slate-100 text-slate-700 border-slate-200",
                                                    ].join(" "), children: item.status }), _jsx("div", { className: "flex items-center gap-1", children: ["new", "reviewed", "closed"].map((status) => (_jsx("button", { type: "button", onClick: async () => {
                                                            await api(`/admin/feedback/${item.id}/status`, {
                                                                method: "PATCH",
                                                                body: JSON.stringify({ status }),
                                                            });
                                                            await loadAll();
                                                        }, className: [
                                                            "px-2 py-1 rounded text-xs font-semibold border transition",
                                                            item.status === status
                                                                ? "bg-pink-600 text-white border-pink-600"
                                                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
                                                        ].join(" "), children: status }, status))) })] }), _jsx("p", { className: "mt-1 font-semibold text-slate-900", children: item.subject }), _jsx("p", { className: "mt-1 text-slate-700 whitespace-pre-wrap", children: item.message })] }, item.id))), feedback.length === 0 && _jsx("p", { className: "text-sm text-slate-500", children: "No feedback yet." })] })] }))] }) }));
}
function StatCard({ label, value }) {
    return (_jsxs("div", { className: "rounded-2xl bg-white border border-slate-100 shadow-sm px-4 py-3", children: [_jsx("p", { className: "text-xs text-slate-500", children: label }), _jsx("p", { className: "text-xl font-black text-slate-900", children: value })] }));
}
