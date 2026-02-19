import { NavLink } from "react-router-dom";

type Mode = "dating" | "campus";

type Item = {
  to: string;
  label: string;
};

type NotificationState = {
  total: number;
  newMessageCount: number;
};

type Props = {
  open: boolean;
  mode: Mode;
  onClose: () => void;
  onModeChange: (mode: Mode) => void;
  datingLinks: Item[];
  campusLinks: Item[];
  notif: NotificationState;
  onLogout: () => void;
};

export default function MobileDrawer({
  open,
  mode,
  onClose,
  onModeChange,
  datingLinks,
  campusLinks,
  notif,
  onLogout,
}: Props) {
  if (!open) return null;

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    [
      "block w-full rounded-xl px-4 py-3 text-sm font-semibold transition",
      isActive
        ? "bg-pink-600 text-white shadow-sm"
        : "bg-white text-slate-700 hover:bg-pink-50 hover:text-pink-700",
    ].join(" ");

  return (
    <div className="md:hidden fixed inset-0 z-[70]">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
        aria-label="Close navigation drawer"
      />
      <aside className="absolute right-0 top-0 h-full w-[86%] max-w-sm bg-gradient-to-b from-rose-50 to-white shadow-2xl border-l border-white/70 p-4 overflow-y-auto">
        <div className="flex items-center justify-between">
          <p className="text-lg font-black text-slate-900">Navigation</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
          >
            Close
          </button>
        </div>

        <div className="mt-4 rounded-2xl bg-white/80 border border-slate-100 p-2 flex gap-2">
          <button
            type="button"
            onClick={() => onModeChange("dating")}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
              mode === "dating"
                ? "bg-pink-600 text-white"
                : "text-slate-700 hover:bg-pink-50"
            }`}
          >
            Dating
          </button>
          <button
            type="button"
            onClick={() => onModeChange("campus")}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
              mode === "campus"
                ? "bg-pink-600 text-white"
                : "text-slate-700 hover:bg-pink-50"
            }`}
          >
            Campus
          </button>
        </div>

        <section className="mt-5">
          <h3 className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">
            Dating
          </h3>
          <div className="space-y-2">
            {datingLinks.map((item) => (
              <NavLink key={item.to} to={item.to} onClick={onClose} className={linkClass}>
                {item.label}
              </NavLink>
            ))}
          </div>
        </section>

        <section className="mt-5">
          <h3 className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">
            Campus
          </h3>
          <div className="space-y-2">
            {campusLinks.map((item) => (
              <NavLink key={item.to} to={item.to} onClick={onClose} className={linkClass}>
                {item.label}
              </NavLink>
            ))}
          </div>
        </section>

        <section className="mt-5">
          <h3 className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">
            Global
          </h3>
          <div className="space-y-2">
            <NavLink to={`/chat?mode=${mode}`} onClick={onClose} className={linkClass}>
              Chat
              {notif.newMessageCount > 0 && (
                <span className="ml-2 inline-flex min-w-[20px] h-5 px-1 rounded-full bg-sky-500 text-white text-[11px] items-center justify-center">
                  {notif.newMessageCount > 99 ? "99+" : notif.newMessageCount}
                </span>
              )}
            </NavLink>
            <NavLink to={`/alerts?mode=${mode}`} onClick={onClose} className={linkClass}>
              Alerts
              {notif.total > 0 && (
                <span className="ml-2 inline-flex min-w-[20px] h-5 px-1 rounded-full bg-rose-500 text-white text-[11px] items-center justify-center">
                  {notif.total > 99 ? "99+" : notif.total}
                </span>
              )}
            </NavLink>
            <NavLink to="/profile" onClick={onClose} className={linkClass}>
              Profile
            </NavLink>
            <button
              type="button"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="block w-full rounded-xl px-4 py-3 text-left text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700 transition"
            >
              Logout
            </button>
          </div>
        </section>
      </aside>
    </div>
  );
}
