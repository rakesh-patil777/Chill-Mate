const API_BASE = import.meta.env?.VITE_API_BASE ?? "http://localhost:4000";
export function authHeader() {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
}
export async function api(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            ...(options.body instanceof FormData
                ? {}
                : { "Content-Type": "application/json" }),
            ...authHeader(),
            ...(options.headers ?? {}),
        },
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
    }
    return res.json();
}
/**
 * Upload profile avatar
 */
export async function uploadAvatar(file) {
    const formData = new FormData();
    formData.append("avatar", file);
    const res = await fetch(`${API_BASE}/profiles/me/avatar`, {
        method: "POST",
        headers: {
            ...authHeader(),
        },
        body: formData,
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Upload failed");
    }
    return res.json();
}
