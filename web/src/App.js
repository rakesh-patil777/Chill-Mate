import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Discover from './pages/Discover';
function Private({ children }) {
    const { auth } = useAuth();
    return auth.token ? children : _jsx(Navigate, { to: "/login", replace: true });
}
function Nav() {
    return (_jsx("nav", { className: "border-b bg-white sticky top-0 z-50", children: _jsxs("div", { className: "max-w-6xl mx-auto px-4 py-3 flex items-center justify-between", children: [_jsx(Link, { to: "/", className: "text-xl sm:text-2xl font-mono font-bold text-chill-600", children: "Chill Mate" }), _jsxs("div", { className: "flex gap-3 sm:gap-4 text-sm", children: [_jsx(Link, { to: "/discover", className: "text-chill-600 hover:text-chill-700 font-medium px-2 py-1 rounded hover:bg-chill-50 transition-colors", children: "Discover" }), _jsx(Link, { to: "/onboarding", className: "text-chill-600 hover:text-chill-700 font-medium px-2 py-1 rounded hover:bg-chill-50 transition-colors", children: "Profile" })] })] }) }));
}
export default function App() {
    return (_jsx(AuthProvider, { children: _jsxs(BrowserRouter, { children: [_jsx(Nav, {}), _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/discover" }) }), _jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsx(Route, { path: "/register", element: _jsx(Register, {}) }), _jsx(Route, { path: "/onboarding", element: _jsx(Private, { children: _jsx(Onboarding, {}) }) }), _jsx(Route, { path: "/discover", element: _jsx(Private, { children: _jsx(Discover, {}) }) })] })] }) }));
}
