import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { api, uploadAvatar } from "../api";
import { Link } from "react-router-dom";
function hasAdminAccess(value) {
    return value === true || value === 1 || value === "1" || value === "true";
}
export default function Profile() {
    const CROP_FRAME = 360;
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadingGallery, setUploadingGallery] = useState(false);
    const [message, setMessage] = useState(null);
    const fileInputRef = useRef(null);
    const [copyStatus, setCopyStatus] = useState("");
    const [boostCountdown, setBoostCountdown] = useState("");
    const [boostRemainingSeconds, setBoostRemainingSeconds] = useState(0);
    const [cropMode, setCropMode] = useState(null);
    const [isCropEditing, setIsCropEditing] = useState(false);
    const [cropZoom, setCropZoom] = useState(1);
    const [cropX, setCropX] = useState(0);
    const [cropY, setCropY] = useState(0);
    const [cropImageEl, setCropImageEl] = useState(null);
    const [cropMeta, setCropMeta] = useState({ width: 0, height: 0 });
    const [savingCrop, setSavingCrop] = useState(false);
    const cropSurfaceRef = useRef(null);
    const dragRef = useRef({
        active: false,
        startX: 0,
        startY: 0,
        baseX: 0,
        baseY: 0,
    });
    const [form, setForm] = useState({
        fullName: "",
        age: 18,
        bio: "",
        hobbies: "",
        interests: "",
        avatarUrl: "",
    });
    const tierConfig = {
        Freshman: { min: 0, max: 50 },
        Explorer: { min: 50, max: 120 },
        Connector: { min: 120, max: 250 },
        Influencer: { min: 250, max: 500 },
        "Campus Icon": { min: 500, max: null },
    };
    useEffect(() => {
        Promise.all([
            api("/profiles/me"),
            api("/admin/stats").then(() => true).catch(() => false),
            api("/premium/status").catch(() => ({})),
        ])
            .then(([data, adminRouteAllowed, premiumStatus]) => {
            const isAdmin = hasAdminAccess(data.isAdmin) || adminRouteAllowed === true;
            setForm({
                id: data.id,
                isAdmin: isAdmin ? 1 : 0,
                fullName: data.fullName ?? "",
                age: data.age ?? 18,
                bio: data.bio ?? "",
                hobbies: data.hobbies ?? "",
                interests: data.interests ?? "",
                gender: data.gender ?? "",
                branch: data.branch ?? "",
                year: data.year ?? null,
                avatarUrl: data.avatarUrl ?? "",
                photos: Array.isArray(data.photos) ? data.photos : [],
                completionScore: data.completionScore ?? 0,
                isPremium: data.isPremium ?? false,
                premiumUntil: data.premiumUntil ?? null,
                profileBoostUntil: data.profileBoostUntil ?? null,
                plansJoined: data.plansJoined ?? 0,
                plansAttended: data.plansAttended ?? 0,
                noShows: data.noShows ?? 0,
                reliabilityScore: data.reliabilityScore ?? 0,
                avgHostRating: data.avgHostRating ?? null,
                inviteCount: data.inviteCount ?? 0,
                plansHosted: data.plansHosted ?? 0,
                reputationBoost: data.reputationBoost ?? 0,
                swipeStreak: data.swipeStreak ?? 0,
                campusStreak: data.campusStreak ?? 0,
                campusScore: data.campusScore ?? 0,
                campusTier: data.campusTier ?? "Freshman",
            });
            setBoostRemainingSeconds(Math.max(0, Number(premiumStatus.boostRemainingSeconds ?? 0)));
            if (premiumStatus.profileBoostUntil) {
                setForm((prev) => ({
                    ...prev,
                    profileBoostUntil: premiumStatus.profileBoostUntil ?? prev.profileBoostUntil,
                }));
            }
        })
            .catch(() => setMessage({ type: "err", text: "Failed to load profile" }))
            .finally(() => setLoading(false));
    }, []);
    useEffect(() => {
        const timer = window.setInterval(() => {
            setBoostRemainingSeconds((prev) => Math.max(0, prev - 1));
        }, 1000);
        return () => window.clearInterval(timer);
    }, []);
    useEffect(() => {
        if (boostRemainingSeconds <= 0) {
            setBoostCountdown("");
            return;
        }
        const totalMins = Math.floor(boostRemainingSeconds / 60);
        const hours = Math.floor(totalMins / 60);
        const minutes = totalMins % 60;
        setBoostCountdown(`${hours}h ${minutes}m left`);
    }, [boostRemainingSeconds]);
    const handleAvatarUrlChange = (e) => {
        setForm((prev) => ({ ...prev, avatarUrl: e.target.value }));
    };
    const updateField = (field) => (e) => {
        const val = e.target.type === "number"
            ? Number(e.target.value) || undefined
            : e.target.value;
        setForm((prev) => ({ ...prev, [field]: val }));
    };
    async function handleFileChange(e) {
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith("image/")) {
            setMessage({ type: "err", text: "Please choose an image file (JPG, PNG, etc.)" });
            return;
        }
        const src = URL.createObjectURL(file);
        openCropModal({
            kind: "avatar",
            sourceUrl: src,
            fileName: file.name || "avatar.jpg",
            mimeType: file.type || "image/jpeg",
        });
        if (fileInputRef.current)
            fileInputRef.current.value = "";
    }
    function openCropModal(mode) {
        setCropMode(mode);
        setIsCropEditing(mode.kind !== "gallery-existing");
        setCropZoom(1);
        setCropX(0);
        setCropY(0);
        setCropImageEl(null);
        setCropMeta({ width: 0, height: 0 });
    }
    function closeCropModal() {
        if (cropMode?.sourceUrl.startsWith("blob:"))
            URL.revokeObjectURL(cropMode.sourceUrl);
        setCropMode(null);
        setIsCropEditing(false);
        setCropImageEl(null);
        setCropMeta({ width: 0, height: 0 });
        setSavingCrop(false);
    }
    function clampOffset(offset, scaled, frame) {
        const max = Math.max(0, (scaled - frame) / 2);
        return Math.max(-max, Math.min(max, offset));
    }
    function getCropBounds(zoom = cropZoom) {
        const coverScale = cropMeta.width > 0 && cropMeta.height > 0
            ? Math.max(CROP_FRAME / cropMeta.width, CROP_FRAME / cropMeta.height)
            : 1;
        const displayW = cropMeta.width * coverScale * zoom;
        const displayH = cropMeta.height * coverScale * zoom;
        return {
            maxX: Math.max(0, (displayW - CROP_FRAME) / 2),
            maxY: Math.max(0, (displayH - CROP_FRAME) / 2),
        };
    }
    function clampCropPosition(x, y, zoom = cropZoom) {
        const { maxX, maxY } = getCropBounds(zoom);
        return {
            x: Math.max(-maxX, Math.min(maxX, x)),
            y: Math.max(-maxY, Math.min(maxY, y)),
        };
    }
    function beginDrag(clientX, clientY) {
        if (!isCropEditing)
            return;
        dragRef.current = {
            active: true,
            startX: clientX,
            startY: clientY,
            baseX: cropX,
            baseY: cropY,
        };
    }
    useEffect(() => {
        function onMove(e) {
            if (!dragRef.current.active)
                return;
            const dx = e.clientX - dragRef.current.startX;
            const dy = e.clientY - dragRef.current.startY;
            const next = clampCropPosition(dragRef.current.baseX + dx, dragRef.current.baseY + dy);
            setCropX(next.x);
            setCropY(next.y);
        }
        function onTouchMove(e) {
            if (!dragRef.current.active || e.touches.length === 0)
                return;
            const t = e.touches[0];
            const dx = t.clientX - dragRef.current.startX;
            const dy = t.clientY - dragRef.current.startY;
            const next = clampCropPosition(dragRef.current.baseX + dx, dragRef.current.baseY + dy);
            setCropX(next.x);
            setCropY(next.y);
            e.preventDefault();
        }
        function stopDrag() {
            if (!dragRef.current.active)
                return;
            dragRef.current.active = false;
        }
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", stopDrag);
        window.addEventListener("touchmove", onTouchMove, { passive: false });
        window.addEventListener("touchend", stopDrag);
        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", stopDrag);
            window.removeEventListener("touchmove", onTouchMove);
            window.removeEventListener("touchend", stopDrag);
        };
    }, [cropX, cropY, cropZoom, cropMeta.width, cropMeta.height, isCropEditing]);
    useEffect(() => {
        const next = clampCropPosition(cropX, cropY, cropZoom);
        if (next.x !== cropX)
            setCropX(next.x);
        if (next.y !== cropY)
            setCropY(next.y);
    }, [cropZoom, cropMeta.width, cropMeta.height]);
    function loadCropImage(url) {
        const img = new Image();
        img.onload = () => {
            setCropImageEl(img);
            setCropMeta({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.src = url;
    }
    async function openViewerFromUrl(url, kind, index) {
        try {
            const res = await fetch(url);
            if (!res.ok)
                throw new Error("Could not load image");
            const blob = await res.blob();
            const sourceUrl = URL.createObjectURL(blob);
            openCropModal({
                kind,
                sourceUrl,
                index,
                fileName: `photo-${Date.now()}.jpg`,
                mimeType: blob.type || "image/jpeg",
            });
        }
        catch {
            setMessage({ type: "err", text: "Could not open image preview" });
        }
    }
    async function createCroppedBlob() {
        if (!cropImageEl || !cropMeta.width || !cropMeta.height)
            return null;
        const frame = CROP_FRAME;
        const out = 900;
        const coverScale = Math.max(frame / cropMeta.width, frame / cropMeta.height);
        const displayW = cropMeta.width * coverScale * cropZoom;
        const displayH = cropMeta.height * coverScale * cropZoom;
        const boundedX = clampOffset(cropX, displayW, frame);
        const boundedY = clampOffset(cropY, displayH, frame);
        const x = (frame - displayW) / 2 + boundedX;
        const y = (frame - displayH) / 2 + boundedY;
        const canvas = document.createElement("canvas");
        canvas.width = out;
        canvas.height = out;
        const ctx = canvas.getContext("2d");
        if (!ctx)
            return null;
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, out, out);
        const factor = out / frame;
        ctx.drawImage(cropImageEl, x * factor, y * factor, displayW * factor, displayH * factor);
        const type = cropMode?.mimeType || "image/jpeg";
        return await new Promise((resolve) => canvas.toBlob(resolve, type, 0.92));
    }
    async function uploadGalleryBlob(blob) {
        const file = new File([blob], `gallery-${Date.now()}.jpg`, { type: blob.type || "image/jpeg" });
        const formData = new FormData();
        formData.append("photo", file);
        return api("/profiles/me/photos", {
            method: "POST",
            body: formData,
        });
    }
    async function saveCroppedImage() {
        if (!cropMode)
            return;
        setSavingCrop(true);
        setMessage(null);
        try {
            const blob = await createCroppedBlob();
            if (!blob)
                throw new Error("Invalid crop");
            const croppedFile = new File([blob], cropMode.fileName || `photo-${Date.now()}.jpg`, {
                type: blob.type || cropMode.mimeType || "image/jpeg",
            });
            if (cropMode.kind === "avatar") {
                setUploading(true);
                const { avatarUrl } = await uploadAvatar(croppedFile);
                setForm((f) => ({ ...f, avatarUrl }));
                setMessage({ type: "ok", text: "Photo uploaded. Click Save profile to keep it." });
            }
            else if (cropMode.kind === "gallery-new") {
                setUploadingGallery(true);
                const data = await uploadGalleryBlob(blob);
                setForm((prev) => ({ ...prev, photos: data.photos ?? prev.photos ?? [] }));
                setMessage({ type: "ok", text: "Gallery photo added." });
            }
            else if (typeof cropMode.index === "number") {
                setUploadingGallery(true);
                await api(`/profiles/me/photos/${cropMode.index}`, { method: "DELETE" });
                const data = await uploadGalleryBlob(blob);
                setForm((prev) => ({ ...prev, photos: data.photos ?? prev.photos ?? [] }));
                setMessage({ type: "ok", text: "Photo cropped and updated." });
            }
            closeCropModal();
        }
        catch {
            setMessage({ type: "err", text: "Could not save cropped image" });
        }
        finally {
            setUploading(false);
            setUploadingGallery(false);
            setSavingCrop(false);
        }
    }
    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            await api("/profiles/me", {
                method: "PUT",
                body: JSON.stringify({
                    fullName: form.fullName,
                    age: form.age,
                    bio: form.bio || undefined,
                    hobbies: form.hobbies || undefined,
                    interests: form.interests || undefined,
                    gender: form.gender || undefined,
                    branch: form.branch || undefined,
                    year: form.year || undefined,
                    avatarUrl: form.avatarUrl || undefined,
                }),
            });
            setMessage({ type: "ok", text: "Profile saved!" });
            const refreshed = await api("/profiles/me");
            setForm((prev) => ({
                ...prev,
                completionScore: refreshed.completionScore ?? prev.completionScore,
            }));
        }
        catch {
            setMessage({ type: "err", text: "Failed to save" });
        }
        finally {
            setSaving(false);
        }
    }
    async function activateBoost() {
        try {
            const response = await api("/premium/boost", { method: "POST" });
            setForm((prev) => ({
                ...prev,
                profileBoostUntil: response.profileBoostUntil ?? prev.profileBoostUntil,
            }));
            setBoostRemainingSeconds(Math.max(0, Number(response.boostRemainingSeconds ?? 24 * 60 * 60)));
            setMessage({ type: "ok", text: "Boost activated for 24 hours." });
        }
        catch (err) {
            const text = err instanceof Error ? err.message : "Could not boost profile";
            setMessage({ type: "err", text });
        }
    }
    const inviteLink = form.id ? `${window.location.origin}/register?referrerId=${form.id}` : "";
    const currentTier = form.campusTier ?? "Freshman";
    const tierRange = tierConfig[currentTier];
    const nextTarget = tierRange.max;
    const score = Number(form.campusScore ?? 0);
    const progressPercent = nextTarget == null
        ? 100
        : Math.max(0, Math.min(100, ((score - tierRange.min) / (nextTarget - tierRange.min || 1)) * 100));
    const cropFrame = CROP_FRAME;
    const cropScale = cropMeta.width > 0 && cropMeta.height > 0
        ? Math.max(cropFrame / cropMeta.width, cropFrame / cropMeta.height)
        : 1;
    const previewW = cropMeta.width * cropScale * cropZoom;
    const previewH = cropMeta.height * cropScale * cropZoom;
    const boundedPreviewX = clampOffset(cropX, previewW, cropFrame);
    const boundedPreviewY = clampOffset(cropY, previewH, cropFrame);
    const maxMoveX = Math.max(0, Math.round((previewW - cropFrame) / 2));
    const maxMoveY = Math.max(0, Math.round((previewH - cropFrame) / 2));
    async function copyInviteLink() {
        if (!inviteLink)
            return;
        try {
            await navigator.clipboard.writeText(inviteLink);
            setCopyStatus("Copied");
            window.setTimeout(() => setCopyStatus(""), 1600);
        }
        catch {
            setCopyStatus("Copy failed");
            window.setTimeout(() => setCopyStatus(""), 1600);
        }
    }
    if (loading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-200 to-purple-200", children: _jsx("p", { className: "text-white text-xl", children: "Loading profile..." }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-pink-200 to-purple-200 py-6 px-3 sm:px-6", children: [_jsxs("div", { className: "max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 items-start", children: [_jsxs("aside", { className: "rounded-3xl bg-rose-50/90 border border-white/70 shadow-md p-4 self-start", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100", children: _jsx("img", { src: form.avatarUrl || "/default-avatar.png", alt: form.fullName, className: "w-full h-full object-cover cursor-zoom-in", onClick: () => {
                                                if (!form.avatarUrl)
                                                    return;
                                                openViewerFromUrl(form.avatarUrl, "avatar");
                                            } }) }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-2xl font-black text-slate-900 truncate", children: form.fullName }), _jsxs("p", { className: "text-base text-slate-600", children: ["Age ", form.age || "--"] })] })] }), Number(form.id ?? 0) > 0 && Number(form.id ?? 0) <= 100 && (_jsx("p", { className: "mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold bg-amber-100 border border-amber-200 text-amber-700", children: "Early Adopter" })), _jsx("button", { type: "button", onClick: () => fileInputRef.current?.click(), disabled: uploading, className: "mt-3 w-full rounded-xl bg-pink-600 text-white px-3 py-2 text-sm font-semibold hover:bg-pink-700 disabled:opacity-60", children: uploading ? "Uploading..." : "Upload photo" }), _jsxs("div", { className: "mt-2 grid grid-cols-3 gap-2", children: [(form.photos ?? []).slice(0, 6).map((photo, idx) => (_jsxs("div", { className: "relative rounded-xl overflow-hidden border border-slate-200 bg-white", children: [_jsx("img", { src: photo, alt: `Gallery ${idx + 1}`, className: "w-full h-20 object-cover cursor-zoom-in", onClick: () => openViewerFromUrl(photo, "gallery-existing", idx) }), _jsx("button", { type: "button", onClick: async () => {
                                                    try {
                                                        const data = await api(`/profiles/me/photos/${idx}`, { method: "DELETE" });
                                                        setForm((prev) => ({ ...prev, photos: data.photos ?? [] }));
                                                    }
                                                    catch {
                                                        setMessage({ type: "err", text: "Could not remove photo" });
                                                    }
                                                }, className: "absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-[11px]", children: "\u00D7" })] }, `${photo}-${idx}`))), (form.photos?.length ?? 0) < 6 && (_jsx("button", { type: "button", disabled: uploadingGallery, onClick: async () => {
                                            const input = document.createElement("input");
                                            input.type = "file";
                                            input.accept = "image/*";
                                            input.onchange = async () => {
                                                const file = input.files?.[0];
                                                if (!file)
                                                    return;
                                                const src = URL.createObjectURL(file);
                                                openCropModal({
                                                    kind: "gallery-new",
                                                    sourceUrl: src,
                                                    fileName: file.name || "gallery.jpg",
                                                    mimeType: file.type || "image/jpeg",
                                                });
                                            };
                                            input.click();
                                        }, className: "h-20 rounded-xl border border-dashed border-slate-300 bg-white text-slate-500 text-xs font-semibold hover:bg-slate-50", children: uploadingGallery ? "Adding..." : "+ Add" }))] }), _jsxs("div", { className: "mt-4 space-y-2", children: [_jsx("button", { type: "button", disabled: !form.isPremium, onClick: activateBoost, className: `w-full rounded-xl px-3 py-2 text-sm font-semibold ${form.isPremium
                                            ? "bg-fuchsia-600 text-white hover:bg-fuchsia-700"
                                            : "bg-slate-200 text-slate-500 cursor-not-allowed"}`, children: "Boost Profile" }), _jsx("div", { className: `rounded-xl px-3 py-2 text-sm font-semibold border text-center ${form.isPremium ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-slate-100 text-slate-600 border-slate-200"}`, children: form.isPremium ? "Premium Active" : "Free Plan" })] }), boostCountdown && (_jsxs("p", { className: "mt-3 text-xs rounded-lg border border-fuchsia-100 bg-fuchsia-50 px-2 py-1.5 text-fuchsia-700", children: ["Boost active: ", boostCountdown] })), hasAdminAccess(form.isAdmin) && (_jsx(Link, { to: "/internal/admin?section=overview", className: "mt-3 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 text-white py-2.5 text-sm font-semibold hover:bg-slate-800", children: "Admin Dashboard" }))] }), _jsxs("section", { className: "rounded-3xl bg-rose-50/90 border border-white/70 shadow-md p-4 sm:p-6 self-start transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5", children: [_jsx("h1", { className: "text-3xl font-black text-slate-900", children: "Date Profile" }), message && (_jsx("p", { className: `mt-3 rounded-lg p-2 text-sm ${message.type === "ok" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`, children: message.text })), _jsxs("div", { className: "mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-3", children: [_jsx("p", { className: "text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold", children: "My Basics" }), _jsx("div", { className: "mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2", children: [
                                            { k: "Gender", v: form.gender || "Not added" },
                                            { k: "Branch", v: form.branch || "Not added" },
                                            { k: "Year", v: form.year || "Not added" },
                                            { k: "Interests", v: form.interests || "Not added" },
                                        ].map((item) => (_jsxs("div", { className: "rounded-xl border border-slate-200 bg-white px-3 py-2", children: [_jsx("p", { className: "text-xs text-slate-500", children: item.k }), _jsx("p", { className: "text-sm font-semibold text-slate-800 truncate", children: String(item.v) })] }, item.k))) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "mt-5 space-y-3", children: [_jsx("input", { ref: fileInputRef, type: "file", accept: "image/*", onChange: handleFileChange, className: "hidden" }), _jsx("div", { className: "flex flex-wrap items-center gap-2", children: _jsx("input", { type: "url", value: form.avatarUrl || "", onChange: handleAvatarUrlChange, className: "flex-1 min-w-[220px] rounded-xl border border-slate-200 px-3 py-2 text-sm", placeholder: "Or paste image URL" }) }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2", children: [_jsx("input", { className: "rounded-xl border border-slate-200 px-3 py-2 text-sm", placeholder: "Full name", value: form.fullName, onChange: updateField("fullName") }), _jsx("input", { className: "rounded-xl border border-slate-200 px-3 py-2 text-sm", placeholder: "Age", type: "number", min: 18, value: form.age, onChange: updateField("age") }), _jsx("input", { className: "rounded-xl border border-slate-200 px-3 py-2 text-sm", placeholder: "Gender", value: form.gender ?? "", onChange: updateField("gender") }), _jsx("input", { className: "rounded-xl border border-slate-200 px-3 py-2 text-sm", placeholder: "Branch", value: form.branch ?? "", onChange: updateField("branch") }), _jsx("input", { className: "rounded-xl border border-slate-200 px-3 py-2 text-sm", placeholder: "Year", type: "number", value: form.year ?? "", onChange: updateField("year") }), _jsx("input", { className: "rounded-xl border border-slate-200 px-3 py-2 text-sm", placeholder: "Interests", value: form.interests ?? "", onChange: updateField("interests") })] }), _jsx("textarea", { className: "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm", rows: 3, placeholder: "Bio", value: form.bio ?? "", onChange: updateField("bio") }), _jsx("input", { className: "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm", placeholder: "Hobbies", value: form.hobbies ?? "", onChange: updateField("hobbies") }), _jsx("button", { type: "submit", disabled: saving, className: "w-full rounded-xl bg-pink-600 text-white py-2.5 font-semibold hover:bg-pink-700 disabled:opacity-60", children: saving ? "Saving..." : "Save profile" })] }), _jsxs("div", { className: "mt-4 grid grid-cols-1 md:grid-cols-2 gap-3", children: [_jsxs("div", { className: "rounded-xl border border-violet-100 bg-violet-50 p-3", children: [_jsx("p", { className: "text-xs uppercase tracking-[0.2em] text-violet-700", children: "Campus Level" }), _jsxs("div", { className: "mt-2 flex items-center justify-between", children: [_jsx("span", { className: "rounded-full bg-white border border-violet-200 px-2.5 py-1 text-xs font-semibold text-violet-700", children: currentTier }), _jsxs("span", { className: "text-sm font-bold text-slate-800", children: [score, " pts"] })] }), _jsx("div", { className: "mt-2 h-2 rounded-full bg-violet-100 overflow-hidden", children: _jsx("div", { className: "h-full bg-gradient-to-r from-violet-500 to-fuchsia-500", style: { width: `${progressPercent}%` } }) }), _jsx("p", { className: "mt-1 text-xs text-slate-600", children: nextTarget == null ? "Top tier unlocked." : `Next tier target: ${nextTarget} pts` })] }), _jsxs("div", { className: "rounded-xl border border-amber-100 bg-amber-50 p-3", children: [_jsx("p", { className: "text-xs uppercase tracking-[0.2em] text-amber-700", children: "Reputation" }), _jsxs("div", { className: "mt-2 grid grid-cols-2 gap-2 text-sm", children: [_jsxs("div", { className: "rounded-lg bg-white border border-amber-100 p-2", children: [_jsx("p", { className: "text-slate-500", children: "Rating" }), _jsx("p", { className: "font-bold", children: typeof form.avgHostRating === "number" ? `${form.avgHostRating.toFixed(1)} / 5` : "N/A" })] }), _jsxs("div", { className: "rounded-lg bg-white border border-amber-100 p-2", children: [_jsx("p", { className: "text-slate-500", children: "Reliability" }), _jsxs("p", { className: "font-bold", children: [form.reliabilityScore ?? 0, "%"] })] }), _jsxs("div", { className: "rounded-lg bg-white border border-amber-100 p-2 col-span-2", children: [_jsx("p", { className: "text-slate-500", children: "Joined / Attended / Hosted" }), _jsxs("p", { className: "font-bold", children: [form.plansJoined ?? 0, " / ", form.plansAttended ?? 0, " / ", form.plansHosted ?? 0] })] })] })] })] }), _jsxs("div", { className: "mt-3 rounded-xl border border-pink-100 bg-pink-50 p-3", children: [_jsx("p", { className: "text-xs uppercase tracking-[0.2em] text-pink-700", children: "Invite Friends" }), _jsxs("p", { className: "mt-1 text-xs text-slate-600", children: ["Invite count: ", form.inviteCount ?? 0] }), _jsxs("div", { className: "mt-2 flex items-center gap-2", children: [_jsx("input", { type: "text", readOnly: true, value: inviteLink, className: "flex-1 rounded-lg border border-pink-100 bg-white px-2 py-1.5 text-xs text-slate-700" }), _jsx("button", { type: "button", onClick: copyInviteLink, className: "rounded-lg bg-pink-600 text-white text-xs font-semibold px-3 py-1.5 hover:bg-pink-700", children: "Copy" })] }), copyStatus && _jsx("p", { className: "mt-1 text-xs text-pink-700", children: copyStatus })] }), _jsx(Link, { to: "/feedback", className: "mt-3 inline-flex w-full items-center justify-center rounded-xl bg-white border border-pink-200 text-pink-700 py-2.5 text-sm font-semibold hover:bg-pink-50", children: "Feedback" })] })] }), cropMode && (_jsx("div", { className: "fixed inset-0 z-[60] bg-slate-950/75 backdrop-blur-sm px-3 py-6 flex items-center justify-center", children: _jsxs("div", { className: "w-full max-w-3xl rounded-2xl border border-white/20 bg-white p-4 sm:p-5 shadow-2xl", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsx("h2", { className: "text-lg font-bold text-slate-900", children: isCropEditing ? "Crop photo" : "Photo preview" }), _jsx("button", { type: "button", onClick: closeCropModal, className: "rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50", children: "Close" })] }), _jsxs("div", { className: "mt-4 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4", children: [_jsx("div", { className: "mx-auto", children: isCropEditing ? (_jsxs("div", { ref: cropSurfaceRef, className: "w-[320px] h-[320px] sm:w-[360px] sm:h-[360px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 relative cursor-grab active:cursor-grabbing select-none touch-none", onMouseDown: (e) => beginDrag(e.clientX, e.clientY), onTouchStart: (e) => {
                                            if (e.touches.length === 0)
                                                return;
                                            beginDrag(e.touches[0].clientX, e.touches[0].clientY);
                                        }, onWheel: (e) => {
                                            e.preventDefault();
                                            const direction = e.deltaY > 0 ? -0.07 : 0.07;
                                            const nextZoom = Math.max(1, Math.min(3, cropZoom + direction));
                                            setCropZoom(nextZoom);
                                        }, children: [_jsx("img", { src: cropMode.sourceUrl, alt: "Crop preview", onLoad: (e) => {
                                                    const target = e.currentTarget;
                                                    loadCropImage(target.src);
                                                }, className: "absolute", style: {
                                                    width: `${Math.max(0, previewW)}px`,
                                                    height: `${Math.max(0, previewH)}px`,
                                                    left: `${(cropFrame - Math.max(0, previewW)) / 2 + boundedPreviewX}px`,
                                                    top: `${(cropFrame - Math.max(0, previewH)) / 2 + boundedPreviewY}px`,
                                                } }), _jsxs("div", { className: "absolute inset-0 pointer-events-none", children: [_jsx("div", { className: "absolute inset-0 border border-white/60 rounded-2xl" }), _jsx("div", { className: "absolute left-1/3 top-0 bottom-0 w-px bg-white/45" }), _jsx("div", { className: "absolute left-2/3 top-0 bottom-0 w-px bg-white/45" }), _jsx("div", { className: "absolute top-1/3 left-0 right-0 h-px bg-white/45" }), _jsx("div", { className: "absolute top-2/3 left-0 right-0 h-px bg-white/45" })] })] })) : (_jsx("img", { src: cropMode.sourceUrl, alt: "Full preview", className: "w-[320px] h-[320px] sm:w-[360px] sm:h-[360px] rounded-2xl border border-slate-200 bg-slate-100 object-contain" })) }), _jsxs("div", { className: "space-y-4", children: [isCropEditing ? (_jsxs(_Fragment, { children: [_jsx("p", { className: "text-sm text-slate-600", children: "Drag image to position. Use mouse wheel or slider to zoom." }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-semibold text-slate-700", children: "Zoom" }), _jsx("input", { type: "range", min: 1, max: 3, step: 0.05, value: cropZoom, onChange: (e) => setCropZoom(Number(e.target.value)), className: "mt-1 w-full" })] }), _jsxs("p", { className: "text-xs text-slate-500", children: ["Move range: X ", Math.round(-maxMoveX), " to ", Math.round(maxMoveX), ", Y ", Math.round(-maxMoveY), " to ", Math.round(maxMoveY)] })] })) : (_jsx("p", { className: "text-sm text-slate-600", children: "Click crop to fit this image properly inside your profile frame." })), _jsxs("div", { className: "flex flex-wrap items-center gap-2 pt-1", children: [!isCropEditing && (_jsx("button", { type: "button", onClick: () => setIsCropEditing(true), className: "rounded-lg bg-slate-800 text-white px-3.5 py-2 text-sm font-semibold hover:bg-slate-900", children: "Crop image" })), isCropEditing && (_jsx("button", { type: "button", onClick: saveCroppedImage, disabled: savingCrop, className: "rounded-lg bg-pink-600 text-white px-3.5 py-2 text-sm font-semibold hover:bg-pink-700 disabled:opacity-60", children: savingCrop ? "Saving..." : "Save crop" })), isCropEditing && (_jsx("button", { type: "button", onClick: () => {
                                                        setCropZoom(1);
                                                        setCropX(0);
                                                        setCropY(0);
                                                    }, className: "rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50", children: "Reset" })), _jsx("button", { type: "button", onClick: closeCropModal, className: "rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50", children: "Cancel" })] })] })] })] }) }))] }));
}
