import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";
import { getSocket } from "../socket";
import MobileDrawer from "./MobileDrawer";

type Mode = "dating" | "campus";

type NotificationState = {
  total: number;
  newMessageCount: number;
  likesYouCount: number;
  newMatchCount: number;
};

type LiveNotification = {
  id: number;
  type: string;
  title: string;
  message: string;
};

type ToastItem = {
  id: number;
  title: string;
  message: string;
};

type ProfileTier = "Freshman" | "Explorer" | "Connector" | "Influencer" | "Campus Icon";
type LaunchMode = "open" | "invite-only" | "closed";

type NavItem = {
  to: string;
  label: string;
  end?: boolean;
};

const datingLinks: NavItem[] = [
  { to: "/discover", label: "Discover" },
  { to: "/matches", label: "Matches" },
  { to: "/likes-you", label: "Likes You" },
];

const campusLinks: NavItem[] = [
  { to: "/plans", label: "Plans", end: true },
  { to: "/plans/create", label: "Create Plan" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/premium", label: "Premium" },
];

function isCampusPath(pathname: string) {
  return (
    pathname.startsWith("/plans") ||
    pathname.startsWith("/leaderboard") ||
    pathname.startsWith("/premium")
  );
}

function getModeFromLocation(pathname: string, search: string): Mode {
  if (isCampusPath(pathname)) return "campus";
  if (pathname.startsWith("/chat") || pathname.startsWith("/alerts")) {
    const queryMode = new URLSearchParams(search).get("mode");
    if (queryMode === "campus") return "campus";
  }
  return "dating";
}

export default function Navbar() {
  const { auth, logout } = useAuth();
  const token = auth.token;
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [mode, setMode] = useState<Mode>(getModeFromLocation(pathname, search));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notif, setNotif] = useState<NotificationState>({
    total: 0,
    newMessageCount: 0,
    likesYouCount: 0,
    newMatchCount: 0,
  });
  const [isPremiumActive, setIsPremiumActive] = useState(false);
  const [isBoostActive, setIsBoostActive] = useState(false);
  const [campusTier, setCampusTier] = useState<ProfileTier | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [launchMode, setLaunchMode] = useState<LaunchMode>("open");
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    setMode(getModeFromLocation(pathname, search));
  }, [pathname, search]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    let timer: number | undefined;

    async function pollNotifications() {
      try {
        const data = await api<Partial<NotificationState>>("/notifications/summary");
        if (cancelled) return;
        setNotif({
          total: Number(data.total ?? 0),
          newMessageCount: Number(data.newMessageCount ?? 0),
          likesYouCount: Number(data.likesYouCount ?? 0),
          newMatchCount: Number(data.newMatchCount ?? 0),
        });
      } catch {
        if (!cancelled) {
          setNotif({
            total: 0,
            newMessageCount: 0,
            likesYouCount: 0,
            newMatchCount: 0,
          });
        }
      } finally {
        if (!cancelled) timer = window.setTimeout(pollNotifications, 12000);
      }
    }

    void pollNotifications();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    async function pollConfig() {
      try {
        const data = await api<{ launchMode?: LaunchMode }>("/config");
        if (!cancelled) {
          const next = data.launchMode;
          setLaunchMode(next === "invite-only" || next === "closed" ? next : "open");
        }
      } catch {
        if (!cancelled) setLaunchMode("open");
      } finally {
        if (!cancelled) timer = window.setTimeout(pollConfig, 30000);
      }
    }

    void pollConfig();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    let timer: number | undefined;

    async function pollTier() {
      try {
        const data = await api<{ campusTier?: ProfileTier; isAdmin?: boolean | number }>("/profiles/me");
        if (!cancelled) {
          setCampusTier(data.campusTier ?? null);
          setIsAdmin(data.isAdmin === true || data.isAdmin === 1);
        }
      } catch {
        if (!cancelled) {
          setCampusTier(null);
          setIsAdmin(false);
        }
      } finally {
        if (!cancelled) timer = window.setTimeout(pollTier, 60000);
      }
    }

    void pollTier();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    let timer: number | undefined;

    async function pollPremium() {
      try {
        const data = await api<{
          isPremium?: boolean;
          isBoosted?: boolean;
          boostRemainingSeconds?: number;
        }>("/premium/status");
        if (!cancelled) {
          setIsPremiumActive(Boolean(data.isPremium));
          setIsBoostActive(Boolean(data.isBoosted) || Number(data.boostRemainingSeconds ?? 0) > 0);
        }
      } catch {
        if (!cancelled) {
          setIsPremiumActive(false);
          setIsBoostActive(false);
        }
      } finally {
        if (!cancelled) timer = window.setTimeout(pollPremium, 12000);
      }
    }

    void pollPremium();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const socket = getSocket();
    if (!socket) return;

    const onNewMessage = () => {
      setNotif((prev) => ({
        ...prev,
        newMessageCount: prev.newMessageCount + 1,
        total: prev.total + 1,
      }));
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((prev) => [
        ...prev,
        { id, title: "New message", message: "You received a new chat message." },
      ]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, 4000);
    };

    const onNewNotification = (payload: LiveNotification) => {
      setNotif((prev) => {
        const next = { ...prev, total: prev.total + 1 };
        if (payload?.type === "like") next.likesYouCount += 1;
        if (payload?.type === "match") next.newMatchCount += 1;
        return next;
      });
      const id = Number(payload?.id || Date.now() + Math.floor(Math.random() * 1000));
      setToasts((prev) => [
        ...prev,
        {
          id,
          title: payload?.title || "New alert",
          message: payload?.message || "You have a new notification.",
        },
      ]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, 4000);
    };

    socket.on("notification:new-message", onNewMessage);
    socket.on("notification:new", onNewNotification);
    return () => {
      socket.off("notification:new-message", onNewMessage);
      socket.off("notification:new", onNewNotification);
    };
  }, [token]);

  const visibleLinks = useMemo(
    () => (mode === "dating" ? datingLinks : campusLinks),
    [mode]
  );

  const subNavClass = ({ isActive }: { isActive: boolean }) =>
    [
      "px-4 py-2.5 min-h-[42px] rounded-xl text-sm sm:text-base font-semibold tracking-[0.01em] text-center transition",
      isActive
        ? "bg-pink-600 text-white shadow-sm"
        : "text-slate-700 hover:bg-white/80 hover:text-pink-700",
    ].join(" ");

  const globalClass = ({ isActive }: { isActive: boolean }) =>
    [
      "px-3.5 py-2 min-h-[42px] rounded-xl text-base sm:text-lg font-semibold tracking-[0.01em] transition",
      isActive
        ? "bg-pink-600 text-white shadow-sm"
        : "text-slate-700 hover:bg-white/80 hover:text-pink-700",
    ].join(" ");

  const modeBtnClass = (target: Mode) =>
    [
      "px-4 py-2 rounded-xl text-sm sm:text-base font-semibold tracking-[0.01em] transition min-h-[40px]",
      mode === target
        ? "bg-pink-600 text-white shadow-sm"
        : "text-slate-700 hover:bg-white/80 hover:text-pink-700",
    ].join(" ");

  const themeBgClass =
    mode === "dating"
      ? "bg-gradient-to-r from-fuchsia-100/95 via-pink-100/95 to-violet-100/95"
      : "bg-gradient-to-r from-rose-100/95 via-amber-100/95 to-orange-100/95";

  if (!token) {
    return (
      <div className={`sticky top-0 z-50 border-b border-white/30 ${themeBgClass} backdrop-blur-md`}>
        <div className="w-full flex items-center justify-between px-6 lg:px-10 py-3">
          <Link
            to="/"
            className="flex w-fit mx-auto text-pink-600 text-3xl sm:text-4xl font-black tracking-tight hover:text-pink-700 transition"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 800 }}
          >
            Chill Mate
          </Link>
          <div className="flex items-center gap-2">
            <NavLink to="/login" className={globalClass}>
              Login
            </NavLink>
            <NavLink to="/register" className={globalClass}>
              Register
            </NavLink>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes boostStarRise {
          0% { transform: translateY(36px) scale(0.75); opacity: 0; }
          20% { opacity: 0.95; }
          100% { transform: translateY(-56px) scale(1.28); opacity: 0; }
        }
        .boost-stars-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
          z-index: 0;
        }
        .boost-stars-layer > span {
          position: absolute;
          bottom: -14px;
          color: rgba(146, 64, 14, 0.98);
          font-size: 16px;
          animation: boostStarRise 2.35s linear infinite;
          text-shadow: 0 0 12px rgba(146, 64, 14, 0.55);
        }
        .boost-stars-layer > span:nth-child(1) { left: 5%; animation-delay: 0s; }
        .boost-stars-layer > span:nth-child(2) { left: 12%; animation-delay: .2s; font-size: 13px; }
        .boost-stars-layer > span:nth-child(3) { left: 20%; animation-delay: .4s; }
        .boost-stars-layer > span:nth-child(4) { left: 28%; animation-delay: .6s; font-size: 14px; }
        .boost-stars-layer > span:nth-child(5) { left: 36%; animation-delay: .8s; }
        .boost-stars-layer > span:nth-child(6) { left: 44%; animation-delay: 1s; font-size: 13px; }
        .boost-stars-layer > span:nth-child(7) { left: 52%; animation-delay: 1.2s; }
        .boost-stars-layer > span:nth-child(8) { left: 60%; animation-delay: 1.4s; font-size: 14px; }
        .boost-stars-layer > span:nth-child(9) { left: 68%; animation-delay: 1.6s; }
        .boost-stars-layer > span:nth-child(10) { left: 76%; animation-delay: 1.8s; font-size: 13px; }
        .boost-stars-layer > span:nth-child(11) { left: 84%; animation-delay: 2s; }
        .boost-stars-layer > span:nth-child(12) { left: 92%; animation-delay: 2.2s; font-size: 13px; }
      `}</style>
      <header className={`sticky top-0 z-50 border-b border-white/30 ${themeBgClass} backdrop-blur-md relative`}>
        {launchMode !== "open" && (
          <div className="w-full text-center text-[11px] font-semibold tracking-wide py-1 bg-amber-100/90 text-amber-800 border-b border-amber-200/70">
            Early Access Mode
          </div>
        )}
        {isBoostActive && (
          <div className="boost-stars-layer" aria-hidden="true">
            <span>{"✦"}</span>
            <span>{"✦"}</span>
            <span>{"✦"}</span>
            <span>{"✦"}</span>
            <span>{"✦"}</span>
            <span>{"✦"}</span>
            <span>{"✦"}</span>
            <span>{"✦"}</span>
            <span>{"✦"}</span>
            <span>{"✦"}</span>
            <span>{"✦"}</span>
            <span>{"✦"}</span>
          </div>
        )}

        <div className="w-full px-6 lg:px-10 py-3">
          <Link
            to="/"
            className="flex w-fit mx-auto items-center gap-2 text-pink-600 text-3xl sm:text-4xl font-black tracking-tight hover:text-pink-700 transition"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 800 }}
          >
            Chill Mate
            {isPremiumActive && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 border border-amber-200 text-amber-700 text-[11px] shadow-sm">
                👑
              </span>
            )}
          </Link>

          <div className="mt-3 hidden md:flex md:items-center md:gap-4">
            <div className="shrink-0 w-auto rounded-2xl bg-white/70 border border-white/80 p-1 flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setMode("dating");
                  if (!pathname.startsWith("/discover") && !pathname.startsWith("/matches") && !pathname.startsWith("/likes-you")) {
                    navigate("/discover");
                  }
                }}
                className={modeBtnClass("dating")}
              >
                Dating
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("campus");
                  if (!isCampusPath(pathname)) navigate("/plans");
                }}
                className={modeBtnClass("campus")}
              >
                Campus
              </button>
            </div>

            <div className="ml-auto shrink-0 flex items-center justify-end gap-2">
              <NavLink to={`/chat?mode=${mode}`} className={globalClass}>
                <span className="relative inline-block">
                  Chat
                  {notif.newMessageCount > 0 && (
                    <span className="absolute -top-1 -right-2 w-2.5 h-2.5 rounded-full bg-sky-500" />
                  )}
                </span>
              </NavLink>
              <NavLink to={`/alerts?mode=${mode}`} className={globalClass}>
                <span className="relative inline-block">
                  Alerts
                  {notif.total > 0 && (
                    <span className="absolute -top-2 -right-4 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[11px] leading-[18px] text-center">
                      {notif.total > 99 ? "99+" : notif.total}
                    </span>
                  )}
                </span>
              </NavLink>
              <NavLink to="/profile" className={globalClass}>
                <span className="inline-flex items-center gap-1">
                  Profile
                  {(campusTier === "Influencer" || campusTier === "Campus Icon") && (
                    <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] leading-none font-semibold bg-violet-100 text-violet-700 border border-violet-200">
                      {campusTier === "Campus Icon" ? "Icon" : "Influencer"}
                    </span>
                  )}
                </span>
              </NavLink>
              {isAdmin && (
                <NavLink to="/internal/admin?section=overview" className={globalClass}>
                  Admin
                </NavLink>
              )}
              <button
                type="button"
                onClick={logout}
                className="px-3.5 py-2 min-h-[42px] rounded-xl text-base sm:text-lg font-semibold tracking-[0.01em] text-rose-700 hover:bg-rose-100 transition"
              >
                Logout
              </button>
            </div>
          </div>

          {mode === "dating" ? (
            <nav className="hidden md:flex mt-3 justify-center gap-4">
              {visibleLinks.map((item) => (
                <NavLink key={item.to} to={item.to} className={(state) => `${subNavClass(state)} w-[220px]`}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          ) : (
            <nav
              className="hidden md:grid mt-3 gap-3"
              style={{ gridTemplateColumns: `repeat(${visibleLinks.length}, minmax(0, 1fr))` }}
            >
              {visibleLinks.map((item) => (
                <NavLink key={item.to} to={item.to} end={Boolean(item.end)} className={subNavClass}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          )}

          <div className="md:hidden mt-3">
            <div className="flex items-center justify-between gap-2">
              <div className="rounded-2xl bg-white/70 border border-white/80 p-1 flex items-center gap-1">
                <button type="button" onClick={() => setMode("dating")} className={modeBtnClass("dating")}>
                  Dating
                </button>
                <button type="button" onClick={() => setMode("campus")} className={modeBtnClass("campus")}>
                  Campus
                </button>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="px-3 py-2 min-h-[40px] rounded-xl border border-slate-200 bg-white/80 text-slate-700 text-sm font-semibold"
                aria-label="Open navigation menu"
              >
                Menu
              </button>
            </div>
          </div>
        </div>
      </header>

      <MobileDrawer
        open={mobileOpen}
        mode={mode}
        onClose={() => setMobileOpen(false)}
        onModeChange={(nextMode) => {
          setMode(nextMode);
          if (nextMode === "dating" && isCampusPath(pathname)) navigate("/discover");
          if (nextMode === "campus" && !isCampusPath(pathname)) navigate("/plans");
        }}
        datingLinks={datingLinks}
        campusLinks={campusLinks}
        notif={{ total: notif.total, newMessageCount: notif.newMessageCount }}
        onLogout={logout}
      />

      <div className="fixed right-4 bottom-4 z-[80] space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto w-72 rounded-xl border border-slate-200 bg-white/95 shadow-lg px-3 py-2"
          >
            <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
            <p className="text-xs text-slate-600 mt-0.5">{toast.message}</p>
          </div>
        ))}
      </div>
    </>
  );
}
