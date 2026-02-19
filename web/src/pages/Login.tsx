import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";

type LoginResponse = {
  token?: string;
};

type ForgotResponse = {
  message?: string;
};

type FormErrors = {
  identifier?: string;
  password?: string;
};

const COLLEGE_EMAIL_REGEX = /^[a-zA-Z]+\.[a-zA-Z0-9]+@presidencyuniversity\.in$/i;

const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=])[A-Za-z\d@$!%*?&#^()_\-+=]{8,}$/;

function getFriendlyError(err: unknown, fallback: string) {
  const raw = err instanceof Error ? err.message : "";
  if (!raw) return fallback;

  const lower = raw.toLowerCase();
  if (
    lower.includes("invalid") ||
    lower.includes("unauthorized") ||
    lower.includes("wrong")
  ) {
    return "Invalid credentials. Please check and try again.";
  }
  if (lower.includes("network") || lower.includes("failed to fetch")) {
    return "Network issue. Please try again.";
  }
  if (lower.includes("not found")) {
    return "Service is currently unavailable.";
  }

  return fallback;
}

const INVALID_COLLEGE_EMAIL_MSG =
  "Please use your official Presidency University email in format name.collegeid@presidencyuniversity.in";

function ForgotPasswordModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    setLoading(true);
    try {
      const result = await api<ForgotResponse>("/auth/forgot", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      setSuccess(result?.message || "Reset instructions sent to your email.");
    } catch (err) {
      setError(getFriendlyError(err, "Could not send reset email right now."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/70 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl font-bold text-slate-900">Forgot password?</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-500 hover:bg-slate-100"
            aria-label="Close forgot password modal"
          >
            Close
          </button>
        </div>

        <p className="mt-2 text-sm text-slate-600">
          Enter your college email and we will send reset instructions.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@yourcollege.edu"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
          />

          {error && <p className="text-sm text-rose-600">{error}</p>}
          {success && <p className="text-sm text-emerald-600">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 px-4 py-2.5 font-semibold text-white shadow-lg shadow-pink-100 transition disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<FormErrors>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  const identifierRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);

  const navigate = useNavigate();
  const { setToken } = useAuth();

  const isPasswordStrong = useMemo(
    () => (password ? STRONG_PASSWORD_REGEX.test(password) : true),
    [password]
  );

  function validate() {
    const next: FormErrors = {};

    if (!identifier.trim()) next.identifier = "College email is required.";
    else if (!COLLEGE_EMAIL_REGEX.test(identifier.trim())) {
      next.identifier = INVALID_COLLEGE_EMAIL_MSG;
    }
    if (!password.trim()) next.password = "Password is required.";

    setFormError(next);
    return Object.keys(next).length === 0;
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!validate()) return;

    setLoading(true);
    try {
      const data = await api<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ collegeId: identifier.trim(), password }),
      });

      if (!data?.token) {
        setError("Login failed. Please try again.");
        return;
      }

      localStorage.setItem("token", data.token);
      setToken(data.token);
      navigate("/discover");
    } catch (err) {
      setError(getFriendlyError(err, "Login failed. Please try again."));
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
              "linear-gradient(180deg, rgba(23,18,44,0.62), rgba(43,15,45,0.68)), url('https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1800&q=80')",
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
                Where Campus Meets Connection
              </h1>
              <p className="mt-4 max-w-lg text-lg text-white/90">
                Build meaningful campus bonds through curated matching, verified
                student profiles, and real chill plans.
              </p>
            </div>
          </div>
        </aside>

        <main className="flex items-center justify-center px-4 py-10 sm:px-8">
          <div className="w-full max-w-[420px] animate-[fadeInUp_0.55s_ease] rounded-3xl border border-white/30 bg-white/70 p-6 shadow-2xl shadow-pink-300/30 backdrop-blur-xl sm:p-8">
            <h2 className="text-3xl font-black text-slate-900">Welcome back</h2>
            <p className="mt-1 text-slate-600">Log in to continue to Chill Mate</p>

            {error && (
              <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </p>
            )}

            <form onSubmit={handleLogin} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  College Email ID
                </label>
                <input
                  ref={identifierRef}
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (formError.identifier) {
                      setFormError((prev) => ({ ...prev, identifier: undefined }));
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      passwordRef.current?.focus();
                    }
                  }}
                  placeholder="you@yourcollege.edu"
                  className="w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                  aria-invalid={Boolean(formError.identifier)}
                  autoComplete="username"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Format: name.collegeid@presidencyuniversity.in
                </p>
                {formError.identifier && (
                  <p className="mt-1 text-xs text-rose-600">{formError.identifier}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    ref={passwordRef}
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (formError.password) {
                        setFormError((prev) => ({ ...prev, password: undefined }));
                      }
                    }}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 pr-12 text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
                    aria-invalid={Boolean(formError.password)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>

                <p
                  className={`mt-1 text-xs ${
                    isPasswordStrong ? "text-slate-500" : "text-amber-700"
                  }`}
                >
                  Use at least 8 chars with upper, lower, number, and special symbol.
                </p>

                {formError.password && (
                  <p className="mt-1 text-xs text-rose-600">{formError.password}</p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-sm font-semibold text-pink-700 transition hover:text-pink-800"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 px-4 py-2.5 font-semibold text-white shadow-lg shadow-pink-200 transition duration-200 hover:scale-[1.01] hover:shadow-pink-300 disabled:opacity-60"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Logging in...
                  </span>
                ) : (
                  "Log in"
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-700">
              Don&apos;t have an account?{" "}
              <Link
                to="/register"
                className="font-bold text-pink-700 transition hover:underline hover:text-pink-800"
              >
                Register
              </Link>
            </p>
          </div>
        </main>
      </div>

      <ForgotPasswordModal open={forgotOpen} onClose={() => setForgotOpen(false)} />
    </div>
  );
}
