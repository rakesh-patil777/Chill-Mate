import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export default function CreatePlan() {
  const navigate = useNavigate();
  const [hostName, setHostName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startAt, setStartAt] = useState("");
  const [maxGuests, setMaxGuests] = useState<number | "">("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void api<{ fullName?: string }>("/profiles/me")
      .then((me) => setHostName(me.fullName ?? "You"))
      .catch(() => setHostName("You"));
  }, []);

  async function onSubmit(e: FormEvent) {
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
    } catch {
      setMessage("Could not create plan.");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-rose-100 via-amber-100 to-orange-100 px-4 py-8">
      <div className="max-w-xl mx-auto rounded-3xl bg-white border border-slate-100 shadow-sm p-6">
        <h1 className="text-3xl font-black text-slate-900">Create Plan</h1>
        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <input
            value={hostName}
            readOnly
            placeholder="Host"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600"
          />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Plan title"
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
            required
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
            rows={4}
          />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location"
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
          />
          <input
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
          />
          <input
            type="number"
            min={1}
            value={maxGuests}
            onChange={(e) => setMaxGuests(e.target.value ? Number(e.target.value) : "")}
            placeholder="Max attendees"
            className="w-full rounded-xl border border-slate-200 px-3 py-2"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-pink-600 text-white font-semibold hover:bg-pink-700"
          >
            Create
          </button>
          {message && <p className="text-sm text-slate-600">{message}</p>}
        </form>
      </div>
    </div>
  );
}
