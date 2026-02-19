import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

type PremiumStatus = {
  isPremium?: boolean;
  premiumUntil?: string | null;
};

export default function Premium() {
  const [status, setStatus] = useState<PremiumStatus>({});
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function loadStatus() {
    const data = await api<PremiumStatus>("/premium/status");
    setStatus(data);
  }

  useEffect(() => {
    loadStatus()
      .catch(() => setMessage("Could not load premium status."))
      .finally(() => setLoading(false));
  }, []);

  async function activateTestPremium() {
    try {
      setActivating(true);
      setMessage(null);
      await api("/premium/test-activate", { method: "POST" });
      await loadStatus();
      setMessage("Test premium activated for 7 days.");
    } catch {
      setMessage("Failed to activate test premium.");
    } finally {
      setActivating(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-100 via-amber-100 to-orange-100 px-4 py-8">
      <div className="max-w-2xl mx-auto rounded-2xl border border-white/70 bg-white/90 shadow-sm p-6">
        <h1 className="text-3xl font-black text-slate-900">Premium</h1>
        <p className="mt-2 text-slate-600">
          Unlock unlimited swipes, full Likes You details, and profile boost.
        </p>

        <ul className="mt-4 space-y-2 text-sm text-slate-700">
          <li>Unlimited daily swipes</li>
          <li>See who liked you without blur</li>
          <li>Boost profile visibility for 24 hours</li>
        </ul>

        <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">
          {loading
            ? "Checking status..."
            : status.isPremium
            ? `Premium active until ${status.premiumUntil ? new Date(status.premiumUntil).toLocaleString() : "N/A"}`
            : "No active premium plan"}
        </div>

        {message && (
          <p className="mt-3 text-sm rounded-lg border border-fuchsia-100 bg-fuchsia-50 text-fuchsia-700 p-2">
            {message}
          </p>
        )}

        <div className="mt-5 flex items-center gap-2">
          <button
            type="button"
            disabled={activating}
            onClick={activateTestPremium}
            className="px-4 py-2 rounded-xl bg-fuchsia-600 text-white font-semibold hover:bg-fuchsia-700 disabled:opacity-60"
          >
            {activating ? "Activating..." : "Activate Test Premium"}
          </button>
          <Link
            to="/profile"
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:border-fuchsia-200"
          >
            Back to Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
