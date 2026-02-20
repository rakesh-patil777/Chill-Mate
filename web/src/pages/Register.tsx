import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

const rawApiBase =
  (import.meta as any).env?.VITE_API_URL ??
  (import.meta as any).env?.VITE_API_BASE ??
  "";
const API_BASE = String(rawApiBase).replace(/\/$/, "");

type ConfigResponse = {
  launchMode?: "open" | "invite-only" | "closed";
};

type PasswordStrength = "weak" | "medium" | "strong";

const COLLEGE_EMAIL_REGEX = /^[a-zA-Z]+\.[a-zA-Z0-9]+@presidencyuniversity\.in$/i;

const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=])[A-Za-z\d@$!%*?&#^()_\-+=]{8,}$/;

const INVALID_COLLEGE_EMAIL_MSG =
  "Please use your official Presidency University email in format name.collegeid@presidencyuniversity.in";

function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return "weak";
  if (STRONG_PASSWORD_REGEX.test(password)) return "strong";
  if (password.length >= 8) return "medium";
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
  const [launchMode, setLaunchMode] = useState<"open" | "invite-only" | "closed">("open");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  useEffect(() => {
    fetch(`${API_BASE}/config`)
      .then((res) => res.json())
      .then((data: ConfigResponse) => {
        const mode = data.launchMode;
        if (mode === "invite-only" || mode === "closed" || mode === "open") {
          setLaunchMode(mode);
        }
      })
      .catch(() => {
        setLaunchMode("open");
      });
  }, []);

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
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
    } catch {
      setError("Server not reachable");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-200 via-pink-200 to-purple-200">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes blobFloat {
          0%, 100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(18px, -16px) scale(1.05); }
        }
      `}</style>

      <div className="grid min-h-screen md:grid-cols-2">
        <aside
          className="relative hidden min-h-screen overflow-hidden md:block"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(23,18,44,0.62), rgba(43,15,45,0.68)), url('https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1800&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute -left-10 top-12 h-56 w-56 rounded-full bg-pink-300/30 blur-3xl animate-[blobFloat_10s_ease-in-out_infinite]" />
          <div className="absolute bottom-16 right-6 h-64 w-64 rounded-full bg-rose-300/30 blur-3xl animate-[blobFloat_13s_ease-in-out_infinite]" />

          <div className="relative z-10 mx-auto flex h-full max-w-xl items-center px-10">
            <div className="text-white">
              <p className="inline-block rounded-full border border-white/30 bg-white/10 px-4 py-1 text-sm font-medium backdrop-blur">
                Chill Mate
              </p>
              <h1 className="mt-6 text-5xl font-black leading-tight drop-shadow-lg xl:text-6xl">
                Start Your Campus Story
              </h1>
              <p className="mt-4 max-w-lg text-lg text-white/90">
                Join verified college students, build authentic connections, and find your chill circle.
              </p>
            </div>
          </div>
        </aside>

        <main className="flex items-center justify-center px-4 py-10 sm:px-8">
          <div className="w-full max-w-[420px] animate-[fadeInUp_0.55s_ease] rounded-3xl border border-white/30 bg-white/70 p-6 shadow-2xl shadow-pink-300/30 backdrop-blur-xl sm:p-8">
            <h2 className="text-3xl font-black text-slate-900">Create account</h2>
            <p className="mt-1 text-slate-600">Join Chill Mate with your college identity</p>

            {launchMode === "invite-only" && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Campus is in invite-only phase.
              </div>
            )}

            {launchMode === "closed" ? (
              <div className="mt-5 space-y-3">
                <div className="rounded-xl border border-slate-200 bg-white/80 p-3 text-sm text-slate-700">
                  Chill Mate is launching soon at your campus.
                </div>

                <input
                  className="w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                  placeholder="your@email.com"
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  type="email"
                />

                <button
                  type="button"
                  onClick={() => {
                    if (!waitlistEmail.trim()) {
                      setWaitlistMsg("Enter an email first.");
                      return;
                    }
                    setWaitlistMsg("Added to waitlist (placeholder).");
                  }}
                  className="w-full rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 px-4 py-2.5 font-semibold text-white shadow-lg shadow-pink-200 transition hover:scale-[1.01]"
                >
                  Join waitlist
                </button>

                {waitlistMsg && <p className="text-xs text-slate-600">{waitlistMsg}</p>}

                <p className="pt-1 text-center text-sm text-slate-700">
                  Already have an account?{" "}
                  <Link to="/login" className="font-bold text-pink-700 hover:text-pink-800 hover:underline">
                    Login
                  </Link>
                </p>
              </div>
            ) : (
              <form onSubmit={handleRegister} className="mt-5 space-y-3">
                {error && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {error}
                  </div>
                )}

                <input
                  className="w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                  placeholder="name.collegeid@presidencyuniversity.in"
                  value={collegeId}
                  onChange={(e) => setCollegeId(e.target.value)}
                />
                <p className="text-xs text-slate-500">
                  Format: name.collegeid@presidencyuniversity.in
                </p>

                <input
                  className="w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />

                <div className="grid grid-cols-2 gap-3">
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                    placeholder="Age"
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />

                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 text-slate-800 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>

                <input
                  className="w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full transition-all duration-300 ${
                      passwordStrength === "strong"
                        ? "w-full bg-emerald-500"
                        : passwordStrength === "medium"
                        ? "w-2/3 bg-amber-500"
                        : "w-1/3 bg-rose-500"
                    }`}
                  />
                </div>

                <p className="text-xs text-slate-600">
                  Use 8+ chars with uppercase, lowercase, number, and special symbol.
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 px-4 py-2.5 font-semibold text-white shadow-lg shadow-pink-200 transition duration-200 hover:scale-[1.01] hover:shadow-pink-300 disabled:opacity-60"
                >
                  {loading ? "Creating account..." : "Register"}
                </button>

                <p className="pt-1 text-center text-sm text-slate-700">
                  Already have an account?{" "}
                  <Link to="/login" className="font-bold text-pink-700 hover:text-pink-800 hover:underline">
                    Login
                  </Link>
                </p>
              </form>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
