import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
const rawApiBase = import.meta.env?.VITE_API_URL ?? import.meta.env?.VITE_API_BASE ?? "";
const API_BASE = String(rawApiBase).replace(/\/$/, "");
const COLLEGE_EMAIL_REGEX = /^[a-zA-Z]+\.[a-zA-Z0-9]+@presidencyuniversity\.in$/i;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=])[A-Za-z\d@$!%*?&#^()_\-+=]{8,}$/;
const INVALID_COLLEGE_EMAIL_MSG = "Please use your official Presidency University email in format name.collegeid@presidencyuniversity.in";
function getPasswordStrength(password) {
    if (!password)
        return "weak";
    if (STRONG_PASSWORD_REGEX.test(password))
        return "strong";
    if (password.length >= 8)
        return "medium";
    return "weak";
}
export default function Register() {
    const [collegeId, setCollegeId] = useState("");
    const [fullName, setFullName] = useState("");
    const [age, setAge] = useState("");
    const [gender, setGender] = useState("Male");
    const [password, setPassword] = useState("");
    const [waitlistEmail, setWaitlistEmail] = useState("");
    const [waitlistMsg, setWaitlistMsg] = useState("");
    const [launchMode, setLaunchMode] = useState("open");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
    useEffect(() => {
        fetch(`${API_BASE}/config`)
            .then((res) => res.json())
            .then((data) => {
            const mode = data.launchMode;
            if (mode === "invite-only" || mode === "closed" || mode === "open") {
                setLaunchMode(mode);
            }
        })
            .catch(() => {
            setLaunchMode("open");
        });
    }, []);
    async function handleRegister(e) {
        e.preventDefault();
        setError("");
        if (!COLLEGE_EMAIL_REGEX.test(collegeId.trim())) {
            setError(INVALID_COLLEGE_EMAIL_MSG);
            return;
        }
        setLoading(true);
        try {
            const referrerId = Number(searchParams.get("referrerId"));
            const res = await fetch(`${API_BASE}/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    collegeId,
                    password,
                    fullName,
                    age: Number(age),
                    gender,
                    referrerId: Number.isInteger(referrerId) && referrerId > 0 ? referrerId : undefined,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Registration failed");
                return;
            }
            alert("Registered successfully! Please login.");
            navigate("/login");
        }
        catch {
            setError("Server not reachable");
        }
        finally {
            setLoading(false);
        }
    }
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-rose-200 via-pink-200 to-purple-200", children: [_jsx("style", { children: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes blobFloat {
          0%, 100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(18px, -16px) scale(1.05); }
        }
      ` }), _jsxs("div", { className: "grid min-h-screen md:grid-cols-2", children: [_jsxs("aside", { className: "relative hidden min-h-screen overflow-hidden md:block", style: {
                            backgroundImage: "linear-gradient(180deg, rgba(23,18,44,0.62), rgba(43,15,45,0.68)), url('https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1800&q=80')",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                        }, children: [_jsx("div", { className: "absolute -left-10 top-12 h-56 w-56 rounded-full bg-pink-300/30 blur-3xl animate-[blobFloat_10s_ease-in-out_infinite]" }), _jsx("div", { className: "absolute bottom-16 right-6 h-64 w-64 rounded-full bg-rose-300/30 blur-3xl animate-[blobFloat_13s_ease-in-out_infinite]" }), _jsx("div", { className: "relative z-10 mx-auto flex h-full max-w-xl items-center px-10", children: _jsxs("div", { className: "text-white", children: [_jsx("p", { className: "inline-block rounded-full border border-white/30 bg-white/10 px-4 py-1 text-sm font-medium backdrop-blur", children: "Chill Mate" }), _jsx("h1", { className: "mt-6 text-5xl font-black leading-tight drop-shadow-lg xl:text-6xl", children: "Start Your Campus Story" }), _jsx("p", { className: "mt-4 max-w-lg text-lg text-white/90", children: "Join verified college students, build authentic connections, and find your chill circle." })] }) })] }), _jsx("main", { className: "flex items-center justify-center px-4 py-10 sm:px-8", children: _jsxs("div", { className: "w-full max-w-[420px] animate-[fadeInUp_0.55s_ease] rounded-3xl border border-white/30 bg-white/70 p-6 shadow-2xl shadow-pink-300/30 backdrop-blur-xl sm:p-8", children: [_jsx("h2", { className: "text-3xl font-black text-slate-900", children: "Create account" }), _jsx("p", { className: "mt-1 text-slate-600", children: "Join Chill Mate with your college identity" }), launchMode === "invite-only" && (_jsx("div", { className: "mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800", children: "Campus is in invite-only phase." })), launchMode === "closed" ? (_jsxs("div", { className: "mt-5 space-y-3", children: [_jsx("div", { className: "rounded-xl border border-slate-200 bg-white/80 p-3 text-sm text-slate-700", children: "Chill Mate is launching soon at your campus." }), _jsx("input", { className: "w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-200", placeholder: "your@email.com", value: waitlistEmail, onChange: (e) => setWaitlistEmail(e.target.value), type: "email" }), _jsx("button", { type: "button", onClick: () => {
                                                if (!waitlistEmail.trim()) {
                                                    setWaitlistMsg("Enter an email first.");
                                                    return;
                                                }
                                                setWaitlistMsg("Added to waitlist (placeholder).");
                                            }, className: "w-full rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 px-4 py-2.5 font-semibold text-white shadow-lg shadow-pink-200 transition hover:scale-[1.01]", children: "Join waitlist" }), waitlistMsg && _jsx("p", { className: "text-xs text-slate-600", children: waitlistMsg }), _jsxs("p", { className: "pt-1 text-center text-sm text-slate-700", children: ["Already have an account?", " ", _jsx(Link, { to: "/login", className: "font-bold text-pink-700 hover:text-pink-800 hover:underline", children: "Login" })] })] })) : (_jsxs("form", { onSubmit: handleRegister, className: "mt-5 space-y-3", children: [error && (_jsx("div", { className: "rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700", children: error })), _jsx("input", { className: "w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-200", placeholder: "name.collegeid@presidencyuniversity.in", value: collegeId, onChange: (e) => setCollegeId(e.target.value) }), _jsx("p", { className: "text-xs text-slate-500", children: "Format: name.collegeid@presidencyuniversity.in" }), _jsx("input", { className: "w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-200", placeholder: "Full Name", value: fullName, onChange: (e) => setFullName(e.target.value) }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx("input", { className: "w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-200", placeholder: "Age", type: "number", value: age, onChange: (e) => setAge(e.target.value) }), _jsxs("select", { className: "w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 text-slate-800 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-200", value: gender, onChange: (e) => setGender(e.target.value), children: [_jsx("option", { children: "Male" }), _jsx("option", { children: "Female" }), _jsx("option", { children: "Other" })] })] }), _jsx("input", { className: "w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-200", type: "password", placeholder: "Password", value: password, onChange: (e) => setPassword(e.target.value) }), _jsx("div", { className: "h-1.5 overflow-hidden rounded-full bg-slate-200", children: _jsx("div", { className: `h-full transition-all duration-300 ${passwordStrength === "strong"
                                                    ? "w-full bg-emerald-500"
                                                    : passwordStrength === "medium"
                                                        ? "w-2/3 bg-amber-500"
                                                        : "w-1/3 bg-rose-500"}` }) }), _jsx("p", { className: "text-xs text-slate-600", children: "Use 8+ chars with uppercase, lowercase, number, and special symbol." }), _jsx("button", { type: "submit", disabled: loading, className: "w-full rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 px-4 py-2.5 font-semibold text-white shadow-lg shadow-pink-200 transition duration-200 hover:scale-[1.01] hover:shadow-pink-300 disabled:opacity-60", children: loading ? "Creating account..." : "Register" }), _jsxs("p", { className: "pt-1 text-center text-sm text-slate-700", children: ["Already have an account?", " ", _jsx(Link, { to: "/login", className: "font-bold text-pink-700 hover:text-pink-800 hover:underline", children: "Login" })] })] }))] }) })] })] }));
}
