const API_URL = "http://localhost:4000/api";

export function authHeader(): Record<string, string> {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
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
export async function uploadAvatar(
  file: File
): Promise<{ avatarUrl: string }> {
  const formData = new FormData();
  formData.append("avatar", file);

  const res = await fetch(`${API_URL}/profiles/me/avatar`, {
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
