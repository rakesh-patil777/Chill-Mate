import { useState } from "react";
import SwipeCards, { DiscoverFilters } from "../components/SwipeCards";

export default function Discover() {
  const [filters, setFilters] = useState<DiscoverFilters>({
    minAge: undefined,
    maxAge: undefined,
    gender: "",
    interests: "",
    branch: "",
    year: undefined,
  });
  const [showFilters, setShowFilters] = useState(false);
  
  const activeCount = [
    filters.minAge,
    filters.maxAge,
    filters.interests,
    filters.gender,
    filters.branch,
    filters.year,
  ].filter(
    (v) => v !== undefined && v !== null && String(v).trim() !== "",
  ).length;

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] overflow-x-hidden overflow-y-auto bg-gradient-to-br from-rose-50 via-pink-100 to-indigo-100 px-4 py-6 relative font-sans">
      {/* Decorative background mesh blooms */}
      <div className="absolute top-[-10%] left-[5%] w-[45vw] h-[45vw] rounded-full bg-pink-300/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[5%] w-[50vw] h-[50vw] rounded-full bg-indigo-300/10 blur-3xl pointer-events-none" />
      
      <div className="max-w-md mx-auto w-full flex flex-col items-center flex-1 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-4 shrink-0">
          <p className="text-xs uppercase tracking-[0.25em] text-rose-600 font-extrabold font-display">
            Discover Vibe
          </p>
          <h1 className="mt-1 text-3xl font-black text-slate-900 font-display">
            Swipe To Connect
          </h1>
        </div>

        {/* Filter Toggle Button */}
        <div className="mb-6 shrink-0 relative w-full flex flex-col items-center">
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold bg-white/80 border border-white/90 shadow-sm text-slate-700 hover:border-pink-300 hover:text-rose-600 transition-all duration-300"
          >
            <span>⚙️</span>
            <span>Filters</span>
            {activeCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[11px] font-bold text-white leading-none">
                {activeCount}
              </span>
            )}
          </button>

          {/* Filter Dropdown (Glassmorphism Card) */}
          {showFilters && (
            <div className="absolute top-14 w-full z-50 animate-[fadeIn_200ms_ease-out]">
              <div className="rounded-3xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-xl p-5 max-h-[60vh] overflow-y-auto">
                <h3 className="text-base font-bold text-slate-800 mb-3.5 font-display">Preferences</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Min Age</label>
                    <input
                      type="number"
                      value={filters.minAge ?? ""}
                      onChange={(e) =>
                        setFilters((f) => ({
                          ...f,
                          minAge: Number(e.target.value) || undefined,
                        }))
                      }
                      placeholder="e.g. 18"
                      className="rounded-2xl border border-slate-200/80 bg-white/80 px-3.5 py-2.5 text-sm focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Max Age</label>
                    <input
                      type="number"
                      value={filters.maxAge ?? ""}
                      onChange={(e) =>
                        setFilters((f) => ({
                          ...f,
                          maxAge: Number(e.target.value) || undefined,
                        }))
                      }
                      placeholder="e.g. 25"
                      className="rounded-2xl border border-slate-200/80 bg-white/80 px-3.5 py-2.5 text-sm focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1 col-span-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Interests</label>
                    <input
                      type="text"
                      value={filters.interests ?? ""}
                      onChange={(e) =>
                        setFilters((f) => ({ ...f, interests: e.target.value }))
                      }
                      placeholder="e.g. Music, Coffee, Coding"
                      className="rounded-2xl border border-slate-200/80 bg-white/80 px-3.5 py-2.5 text-sm focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Gender</label>
                    <select
                      value={filters.gender ?? ""}
                      onChange={(e) =>
                        setFilters((f) => ({
                          ...f,
                          gender: e.target.value || undefined,
                        }))
                      }
                      className="rounded-2xl border border-slate-200/80 bg-white/80 px-3.5 py-2.5 text-sm focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition outline-none"
                    >
                      <option value="">Any gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Branch</label>
                    <input
                      type="text"
                      value={filters.branch ?? ""}
                      onChange={(e) =>
                        setFilters((f) => ({ ...f, branch: e.target.value }))
                      }
                      placeholder="e.g. CSE"
                      className="rounded-2xl border border-slate-200/80 bg-white/80 px-3.5 py-2.5 text-sm focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1 col-span-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Year</label>
                    <input
                      type="number"
                      value={filters.year ?? ""}
                      onChange={(e) =>
                        setFilters((f) => ({
                          ...f,
                          year: Number(e.target.value) || undefined,
                        }))
                      }
                      placeholder="e.g. 2"
                      className="rounded-2xl border border-slate-200/80 bg-white/80 px-3.5 py-2.5 text-sm focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition outline-none"
                    />
                  </div>
                </div>
                <div className="mt-5 flex gap-2 justify-end border-t border-slate-200/50 pt-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFilters({
                        minAge: undefined,
                        maxAge: undefined,
                        interests: "",
                        gender: "",
                        branch: "",
                        year: undefined,
                      })
                    }
                    className="rounded-2xl bg-slate-100 text-slate-700 px-4 py-2.5 text-xs font-semibold hover:bg-slate-200 transition"
                  >
                    Reset All
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFilters(false)}
                    className="rounded-2xl bg-gradient-to-r from-pink-600 to-rose-500 text-white px-5 py-2.5 text-xs font-semibold hover:opacity-95 transition-all shadow-md"
                  >
                    Apply Filter
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Swipe Stack Container */}
        <div className="flex-1 flex flex-col items-center justify-center w-full min-h-[440px] relative">
          <SwipeCards filters={filters} />
        </div>
      </div>
    </div>
  );
}
