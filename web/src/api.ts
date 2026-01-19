const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? 'http://localhost:4000';

export function authHeader() {
	const token = localStorage.getItem('token');
	return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
	const authHeaders = authHeader();
	const res = await fetch(`${API_BASE}${path}`, {
		...opts,
		headers: {
			'Content-Type': 'application/json',
			...(authHeaders.Authorization ? authHeaders : {}),
			...(opts.headers ?? {})
		}
	});
	if (!res.ok) {
		const msg = await res.text();
		throw new Error(msg || res.statusText);
	}
	return res.json();
}


