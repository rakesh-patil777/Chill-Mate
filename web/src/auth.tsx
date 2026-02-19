import { createContext, useContext, useEffect, useState } from "react";
import { disconnectSocket } from "./socket";

type AuthState = {
  token: string | null;
};

type AuthContextType = {
  auth: AuthState;
  setToken: (t: string | null) => void;
  logout: () => void;
};

const AuthCtx = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Read real token from localStorage on page load
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("token");
  });

  // Whenever token changes, sync with localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
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

  return (
    <AuthCtx.Provider value={{ auth: { token }, setToken, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("AuthProvider missing");
  return ctx;
}
