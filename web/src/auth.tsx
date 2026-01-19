import { createContext, useContext, useEffect, useState } from 'react';

type AuthState = { token: string | null };
const AuthCtx = createContext<{ auth: AuthState; setToken: (t: string | null) => void } | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
	useEffect(() => {
		if (token) localStorage.setItem('token', token);
		else localStorage.removeItem('token');
	}, [token]);
	return <AuthCtx.Provider value={{ auth: { token }, setToken }}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
	const ctx = useContext(AuthCtx);
	if (!ctx) throw new Error('AuthProvider missing');
	return ctx;
}


