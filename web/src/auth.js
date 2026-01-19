import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from 'react';
const AuthCtx = createContext(null);
export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    useEffect(() => {
        if (token)
            localStorage.setItem('token', token);
        else
            localStorage.removeItem('token');
    }, [token]);
    return _jsx(AuthCtx.Provider, { value: { auth: { token }, setToken }, children: children });
}
export function useAuth() {
    const ctx = useContext(AuthCtx);
    if (!ctx)
        throw new Error('AuthProvider missing');
    return ctx;
}
