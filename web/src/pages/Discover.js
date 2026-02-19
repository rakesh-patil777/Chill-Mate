import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import SwipeCards from "../components/SwipeCards";
export default function Discover() {
    const [filters, setFilters] = useState({
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
    return (_jsx("div", { className: "min-h-screen bg-[radial-gradient(1200px_380px_at_50%_-120px,rgba(190,24,93,0.24),transparent),linear-gradient(120deg,#f5d0fe_0%,#fbcfe8_45%,#ddd6fe_100%)] px-4 py-6", children: _jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsxs("div", { className: "text-center mb-6", children: [_jsx("p", { className: "text-xs uppercase tracking-[0.35em] text-rose-600 font-semibold", children: "Discover" }), _jsx("h1", { className: "mt-2 text-3xl sm:text-4xl font-black text-slate-900", children: "Swipe To Connect" })] }), _jsxs("div", { className: "mb-5", children: [_jsxs("button", { type: "button", onClick: () => setShowFilters((v) => !v), className: "mx-auto block rounded-full px-5 py-2.5 text-sm font-semibold bg-white/85 border border-white/80 shadow-sm text-slate-700 hover:border-pink-300 transition", children: ["Filters ", activeCount > 0 ? `(${activeCount})` : ""] }), showFilters && (_jsxs("div", { className: "mt-3 rounded-2xl border border-white/80 bg-white/85 shadow-md p-3 sm:p-4", children: [_jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-2", children: [_jsx("input", { type: "number", value: filters.minAge ?? "", onChange: (e) => setFilters((f) => ({ ...f, minAge: Number(e.target.value) || undefined })), placeholder: "Min age", className: "rounded-xl border border-slate-200 px-3 py-2 text-sm" }), _jsx("input", { type: "number", value: filters.maxAge ?? "", onChange: (e) => setFilters((f) => ({ ...f, maxAge: Number(e.target.value) || undefined })), placeholder: "Max age", className: "rounded-xl border border-slate-200 px-3 py-2 text-sm" }), _jsx("input", { type: "text", value: filters.interests ?? "", onChange: (e) => setFilters((f) => ({ ...f, interests: e.target.value })), placeholder: "Interests", className: "rounded-xl border border-slate-200 px-3 py-2 text-sm" }), _jsxs("select", { value: filters.gender ?? "", onChange: (e) => setFilters((f) => ({ ...f, gender: e.target.value || undefined })), className: "rounded-xl border border-slate-200 px-3 py-2 text-sm", children: [_jsx("option", { value: "", children: "Any gender" }), _jsx("option", { value: "male", children: "Male" }), _jsx("option", { value: "female", children: "Female" }), _jsx("option", { value: "non-binary", children: "Non-binary" })] }), _jsx("input", { type: "text", value: filters.branch ?? "", onChange: (e) => setFilters((f) => ({ ...f, branch: e.target.value })), placeholder: "Branch", className: "rounded-xl border border-slate-200 px-3 py-2 text-sm" }), _jsx("input", { type: "number", value: filters.year ?? "", onChange: (e) => setFilters((f) => ({ ...f, year: Number(e.target.value) || undefined })), placeholder: "Year", className: "rounded-xl border border-slate-200 px-3 py-2 text-sm" })] }), _jsxs("div", { className: "mt-3 flex flex-wrap gap-2 justify-end", children: [_jsx("button", { type: "button", onClick: () => setFilters({
                                                minAge: undefined,
                                                maxAge: undefined,
                                                interests: "",
                                                gender: "",
                                                branch: "",
                                                year: undefined,
                                            }), className: "rounded-xl bg-slate-100 text-slate-700 px-3 py-2 text-sm font-semibold hover:bg-slate-200", children: "Reset" }), _jsx("button", { type: "button", onClick: () => setShowFilters(false), className: "rounded-xl bg-pink-600 text-white px-3 py-2 text-sm font-semibold hover:bg-pink-700", children: "Apply" })] })] }))] }), _jsx(SwipeCards, { filters: filters })] }) }));
}
