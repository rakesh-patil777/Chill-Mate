import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from "react";
import { disconnectSocket } from "./socket";
const AuthCtx = createContext(null);
export function AuthProvider({ children }) {
    // Read real token from localStorage on page load
    const [token, setToken] = useState(() => {
        return localStorage.getItem("token");
    });
    // Whenever token changes, sync with localStorage
    useEffect(() => {
        if (token) {
            localStorage.setItem("token", token);
        }
        else {
            localStorage.removeItem("token");
        }
    }, [token]);
    // Proper logout function
    const logout = () => {
        setToken(null);
        localStorage.removeItem("token");
        disconnectSocket();
        window.location.href = "/landing";
    };
    return (_jsx(AuthCtx.Provider, { value: { auth: { token }, setToken, logout }, children: children }));
}
export function useAuth() {
    const ctx = useContext(AuthCtx);
    if (!ctx)
        throw new Error("AuthProvider missing");
    return ctx;
}
