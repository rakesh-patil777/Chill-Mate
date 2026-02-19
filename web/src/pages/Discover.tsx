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
  ].filter((v) => v !== undefined && v !== null && String(v).trim() !== "").length;

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_380px_at_50%_-120px,rgba(190,24,93,0.24),transparent),linear-gradient(120deg,#f5d0fe_0%,#fbcfe8_45%,#ddd6fe_100%)] px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <p className="text-xs uppercase tracking-[0.35em] text-rose-600 font-semibold">
            Discover
          </p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-black text-slate-900">
            Swipe To Connect
          </h1>
        </div>
        <div className="mb-5">
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="mx-auto block rounded-full px-5 py-2.5 text-sm font-semibold bg-white/85 border border-white/80 shadow-sm text-slate-700 hover:border-pink-300 transition"
          >
            Filters {activeCount > 0 ? `(${activeCount})` : ""}
          </button>

          {showFilters && (
            <div className="mt-3 rounded-2xl border border-white/80 bg-white/85 shadow-md p-3 sm:p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <input
                  type="number"
                  value={filters.minAge ?? ""}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, minAge: Number(e.target.value) || undefined }))
                  }
                  placeholder="Min age"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  value={filters.maxAge ?? ""}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, maxAge: Number(e.target.value) || undefined }))
                  }
                  placeholder="Max age"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={filters.interests ?? ""}
                  onChange={(e) => setFilters((f) => ({ ...f, interests: e.target.value }))}
                  placeholder="Interests"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <select
                  value={filters.gender ?? ""}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, gender: e.target.value || undefined }))
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="">Any gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                </select>
                <input
                  type="text"
                  value={filters.branch ?? ""}
                  onChange={(e) => setFilters((f) => ({ ...f, branch: e.target.value }))}
                  placeholder="Branch"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  value={filters.year ?? ""}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, year: Number(e.target.value) || undefined }))
                  }
                  placeholder="Year"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2 justify-end">
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
                  className="rounded-xl bg-slate-100 text-slate-700 px-3 py-2 text-sm font-semibold hover:bg-slate-200"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setShowFilters(false)}
                  className="rounded-xl bg-pink-600 text-white px-3 py-2 text-sm font-semibold hover:bg-pink-700"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
        <SwipeCards filters={filters} />
      </div>
    </div>
  );
}
