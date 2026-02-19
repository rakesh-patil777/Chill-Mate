import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
export default function Premium() {
    const [status, setStatus] = useState({});
    const [loading, setLoading] = useState(true);
    const [activating, setActivating] = useState(false);
    const [message, setMessage] = useState(null);
    async function loadStatus() {
        const data = await api("/premium/status");
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
        }
        catch {
            setMessage("Failed to activate test premium.");
        }
        finally {
            setActivating(false);
        }
    }
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-rose-100 via-amber-100 to-orange-100 px-4 py-8", children: _jsxs("div", { className: "max-w-2xl mx-auto rounded-2xl border border-white/70 bg-white/90 shadow-sm p-6", children: [_jsx("h1", { className: "text-3xl font-black text-slate-900", children: "Premium" }), _jsx("p", { className: "mt-2 text-slate-600", children: "Unlock unlimited swipes, full Likes You details, and profile boost." }), _jsxs("ul", { className: "mt-4 space-y-2 text-sm text-slate-700", children: [_jsx("li", { children: "Unlimited daily swipes" }), _jsx("li", { children: "See who liked you without blur" }), _jsx("li", { children: "Boost profile visibility for 24 hours" })] }), _jsx("div", { className: "mt-5 rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800", children: loading
                        ? "Checking status..."
                        : status.isPremium
                            ? `Premium active until ${status.premiumUntil ? new Date(status.premiumUntil).toLocaleString() : "N/A"}`
                            : "No active premium plan" }), message && (_jsx("p", { className: "mt-3 text-sm rounded-lg border border-fuchsia-100 bg-fuchsia-50 text-fuchsia-700 p-2", children: message })), _jsxs("div", { className: "mt-5 flex items-center gap-2", children: [_jsx("button", { type: "button", disabled: activating, onClick: activateTestPremium, className: "px-4 py-2 rounded-xl bg-fuchsia-600 text-white font-semibold hover:bg-fuchsia-700 disabled:opacity-60", children: activating ? "Activating..." : "Activate Test Premium" }), _jsx(Link, { to: "/profile", className: "px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:border-fuchsia-200", children: "Back to Profile" })] })] }) }));
}
