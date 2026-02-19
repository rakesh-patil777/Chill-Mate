import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

type FeedbackForm = {
  fullName: string;
  email: string;
  category: "bug" | "feature" | "ui" | "performance" | "other";
  rating: number;
  subject: string;
  message: string;
};

export default function Feedback() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<FeedbackForm>({
    fullName: "",
    email: "",
    category: "ui",
    rating: 4,
    subject: "",
    message: "",
  });

  function update<K extends keyof FeedbackForm>(key: K, value: FeedbackForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setDone(false);

    if (!form.fullName.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      setError("Please fill all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      await api<{ ok: boolean }>("/feedback", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setDone(true);
      setForm((prev) => ({ ...prev, subject: "", message: "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit feedback. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_380px_at_50%_-120px,rgba(190,24,93,0.24),transparent),linear-gradient(120deg,#f5d0fe_0%,#fbcfe8_45%,#ddd6fe_100%)] px-4 py-8">
      <div className="max-w-2xl mx-auto rounded-3xl bg-white/90 border border-white/80 shadow-lg p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-black text-slate-900">Feedback</h1>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            Back
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Share what you like, what is broken, and what you want next.
        </p>

        {done && (
          <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Thanks, feedback submitted successfully.
          </p>
        )}
        {error && (
          <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}

        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              placeholder="Full name *"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="Email *"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
            <select
              value={form.category}
              onChange={(e) => update("category", e.target.value as FeedbackForm["category"])}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="bug">Bug Report</option>
              <option value="feature">Feature Request</option>
              <option value="ui">UI/UX</option>
              <option value="performance">Performance</option>
              <option value="other">Other</option>
            </select>
            <select
              value={form.rating}
              onChange={(e) => update("rating", Number(e.target.value))}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value={5}>Rating: 5</option>
              <option value={4}>Rating: 4</option>
              <option value={3}>Rating: 3</option>
              <option value={2}>Rating: 2</option>
              <option value={1}>Rating: 1</option>
            </select>
          </div>

          <input
            type="text"
            value={form.subject}
            onChange={(e) => update("subject", e.target.value)}
            placeholder="Subject *"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <textarea
            rows={6}
            value={form.message}
            onChange={(e) => update("message", e.target.value)}
            placeholder="Your feedback *"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-pink-600 text-white py-2.5 font-semibold hover:bg-pink-700 disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit Feedback"}
          </button>
        </form>
      </div>
    </div>
  );
}
