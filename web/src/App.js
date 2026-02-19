import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "./auth";
import Navbar from "./components/Navbar";
import AdminPanel from "./pages/AdminPanel";
import Alerts from "./pages/Alerts";
import Chat from "./pages/Chat";
import CreatePlan from "./pages/CreatePlan";
import Discover from "./pages/Discover";
import DiscoverUserDetail from "./pages/DiscoverUserDetail";
import Feedback from "./pages/Feedback";
import LikesYou from "./pages/LikesYou";
import Leaderboard from "./pages/Leaderboard";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Matches from "./pages/Matches";
import PlanChat from "./pages/PlanChat";
import PlanDetail from "./pages/PlanDetail";
import Plans from "./pages/Plans";
import Premium from "./pages/Premium";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
function ProtectedRoute({ children }) {
    const token = localStorage.getItem("token");
    if (!token)
        return _jsx(Navigate, { to: "/landing", replace: true });
    return _jsx(_Fragment, { children: children });
}
function AppRoutes() {
    const { pathname } = useLocation();
    const hideNavbar = pathname === "/landing";
    return (_jsxs(_Fragment, { children: [!hideNavbar && _jsx(Navbar, {}), _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/landing", replace: true }) }), _jsx(Route, { path: "/landing", element: _jsx(Landing, {}) }), _jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsx(Route, { path: "/register", element: _jsx(Register, {}) }), _jsx(Route, { path: "/discover", element: _jsx(ProtectedRoute, { children: _jsx(Discover, {}) }) }), _jsx(Route, { path: "/discover/user/:id", element: _jsx(ProtectedRoute, { children: _jsx(DiscoverUserDetail, {}) }) }), _jsx(Route, { path: "/matches", element: _jsx(ProtectedRoute, { children: _jsx(Matches, {}) }) }), _jsx(Route, { path: "/likes-you", element: _jsx(ProtectedRoute, { children: _jsx(LikesYou, {}) }) }), _jsx(Route, { path: "/chat", element: _jsx(ProtectedRoute, { children: _jsx(Chat, {}) }) }), _jsx(Route, { path: "/alerts", element: _jsx(ProtectedRoute, { children: _jsx(Alerts, {}) }) }), _jsx(Route, { path: "/plans", element: _jsx(ProtectedRoute, { children: _jsx(Plans, {}) }) }), _jsx(Route, { path: "/leaderboard", element: _jsx(ProtectedRoute, { children: _jsx(Leaderboard, {}) }) }), _jsx(Route, { path: "/plans/create", element: _jsx(ProtectedRoute, { children: _jsx(CreatePlan, {}) }) }), _jsx(Route, { path: "/plans/:id/chat", element: _jsx(ProtectedRoute, { children: _jsx(PlanChat, {}) }) }), _jsx(Route, { path: "/plans/:id", element: _jsx(ProtectedRoute, { children: _jsx(PlanDetail, {}) }) }), _jsx(Route, { path: "/profile", element: _jsx(ProtectedRoute, { children: _jsx(Profile, {}) }) }), _jsx(Route, { path: "/premium", element: _jsx(ProtectedRoute, { children: _jsx(Premium, {}) }) }), _jsx(Route, { path: "/feedback", element: _jsx(ProtectedRoute, { children: _jsx(Feedback, {}) }) }), _jsx(Route, { path: "/internal/admin", element: _jsx(ProtectedRoute, { children: _jsx(AdminPanel, {}) }) })] })] }));
}
export default function App() {
    return (_jsx(AuthProvider, { children: _jsx(BrowserRouter, { children: _jsx(AppRoutes, {}) }) }));
}
