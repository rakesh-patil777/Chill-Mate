import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
export default function Feedback() {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        category: "ui",
        rating: 4,
        subject: "",
        message: "",
    });
    function update(key, value) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }
    async function onSubmit(e) {
        e.preventDefault();
        setError("");
        setDone(false);
        if (!form.fullName.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
            setError("Please fill all required fields.");
            return;
        }
        setSubmitting(true);
        try {
            await api("/feedback", {
                method: "POST",
                body: JSON.stringify(form),
            });
            setDone(true);
            setForm((prev) => ({ ...prev, subject: "", message: "" }));
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Could not submit feedback. Try again.");
        }
        finally {
            setSubmitting(false);
        }
    }
    return (_jsx("div", { className: "min-h-screen bg-[radial-gradient(1200px_380px_at_50%_-120px,rgba(190,24,93,0.24),transparent),linear-gradient(120deg,#f5d0fe_0%,#fbcfe8_45%,#ddd6fe_100%)] px-4 py-8", children: _jsxs("div", { className: "max-w-2xl mx-auto rounded-3xl bg-white/90 border border-white/80 shadow-lg p-6 sm:p-8", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsx("h1", { className: "text-3xl font-black text-slate-900", children: "Feedback" }), _jsx("button", { type: "button", onClick: () => navigate(-1), className: "text-sm font-semibold text-slate-600 hover:text-slate-900", children: "Back" })] }), _jsx("p", { className: "mt-2 text-sm text-slate-600", children: "Share what you like, what is broken, and what you want next." }), done && (_jsx("p", { className: "mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700", children: "Thanks, feedback submitted successfully." })), error && (_jsx("p", { className: "mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700", children: error })), _jsxs("form", { onSubmit: onSubmit, className: "mt-5 space-y-3", children: [_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [_jsx("input", { type: "text", value: form.fullName, onChange: (e) => update("fullName", e.target.value), placeholder: "Full name *", className: "rounded-xl border border-slate-200 px-3 py-2 text-sm" }), _jsx("input", { type: "email", value: form.email, onChange: (e) => update("email", e.target.value), placeholder: "Email *", className: "rounded-xl border border-slate-200 px-3 py-2 text-sm" }), _jsxs("select", { value: form.category, onChange: (e) => update("category", e.target.value), className: "rounded-xl border border-slate-200 px-3 py-2 text-sm", children: [_jsx("option", { value: "bug", children: "Bug Report" }), _jsx("option", { value: "feature", children: "Feature Request" }), _jsx("option", { value: "ui", children: "UI/UX" }), _jsx("option", { value: "performance", children: "Performance" }), _jsx("option", { value: "other", children: "Other" })] }), _jsxs("select", { value: form.rating, onChange: (e) => update("rating", Number(e.target.value)), className: "rounded-xl border border-slate-200 px-3 py-2 text-sm", children: [_jsx("option", { value: 5, children: "Rating: 5" }), _jsx("option", { value: 4, children: "Rating: 4" }), _jsx("option", { value: 3, children: "Rating: 3" }), _jsx("option", { value: 2, children: "Rating: 2" }), _jsx("option", { value: 1, children: "Rating: 1" })] })] }), _jsx("input", { type: "text", value: form.subject, onChange: (e) => update("subject", e.target.value), placeholder: "Subject *", className: "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" }), _jsx("textarea", { rows: 6, value: form.message, onChange: (e) => update("message", e.target.value), placeholder: "Your feedback *", className: "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" }), _jsx("button", { type: "submit", disabled: submitting, className: "w-full rounded-xl bg-pink-600 text-white py-2.5 font-semibold hover:bg-pink-700 disabled:opacity-60", children: submitting ? "Submitting..." : "Submit Feedback" })] })] }) }));
}
