import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
export default function CreatePlan() {
    const navigate = useNavigate();
    const [hostName, setHostName] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");
    const [startAt, setStartAt] = useState("");
    const [maxGuests, setMaxGuests] = useState("");
    const [message, setMessage] = useState(null);
    useEffect(() => {
        void api("/profiles/me")
            .then((me) => setHostName(me.fullName ?? "You"))
            .catch(() => setHostName("You"));
    }, []);
    async function onSubmit(e) {
        e.preventDefault();
        try {
            await api("/plans", {
                method: "POST",
                body: JSON.stringify({
                    title,
                    description: description || undefined,
                    location: location || undefined,
                    startAt: startAt || undefined,
                    maxGuests: maxGuests === "" ? undefined : Number(maxGuests),
                }),
            });
            setMessage("Plan created.");
            setTitle("");
            setDescription("");
            setLocation("");
            setStartAt("");
            setMaxGuests("");
            window.setTimeout(() => navigate("/plans"), 500);
        }
        catch {
            setMessage("Could not create plan.");
        }
    }
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-r from-rose-100 via-amber-100 to-orange-100 px-4 py-8", children: _jsxs("div", { className: "max-w-xl mx-auto rounded-3xl bg-white border border-slate-100 shadow-sm p-6", children: [_jsx("h1", { className: "text-3xl font-black text-slate-900", children: "Create Plan" }), _jsxs("form", { onSubmit: onSubmit, className: "mt-4 space-y-3", children: [_jsx("input", { value: hostName, readOnly: true, placeholder: "Host", className: "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600" }), _jsx("input", { value: title, onChange: (e) => setTitle(e.target.value), placeholder: "Plan title", className: "w-full rounded-xl border border-slate-200 px-3 py-2", required: true }), _jsx("textarea", { value: description, onChange: (e) => setDescription(e.target.value), placeholder: "Description", className: "w-full rounded-xl border border-slate-200 px-3 py-2", rows: 4 }), _jsx("input", { value: location, onChange: (e) => setLocation(e.target.value), placeholder: "Location", className: "w-full rounded-xl border border-slate-200 px-3 py-2" }), _jsx("input", { type: "datetime-local", value: startAt, onChange: (e) => setStartAt(e.target.value), className: "w-full rounded-xl border border-slate-200 px-3 py-2" }), _jsx("input", { type: "number", min: 1, value: maxGuests, onChange: (e) => setMaxGuests(e.target.value ? Number(e.target.value) : ""), placeholder: "Max attendees", className: "w-full rounded-xl border border-slate-200 px-3 py-2" }), _jsx("button", { type: "submit", className: "px-4 py-2 rounded-xl bg-pink-600 text-white font-semibold hover:bg-pink-700", children: "Create" }), message && _jsx("p", { className: "text-sm text-slate-600", children: message })] })] }) }));
}
