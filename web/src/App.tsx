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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/landing" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { pathname } = useLocation();
  const hideNavbar = pathname === "/landing";

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route
          path="/"
          element={<Navigate to="/landing" replace />}
        />
        <Route path="/landing" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/discover"
          element={
            <ProtectedRoute>
              <Discover />
            </ProtectedRoute>
          }
        />
        <Route
          path="/discover/user/:id"
          element={
            <ProtectedRoute>
              <DiscoverUserDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/matches"
          element={
            <ProtectedRoute>
              <Matches />
            </ProtectedRoute>
          }
        />
        <Route
          path="/likes-you"
          element={
            <ProtectedRoute>
              <LikesYou />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/alerts"
          element={
            <ProtectedRoute>
              <Alerts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/plans"
          element={
            <ProtectedRoute>
              <Plans />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <Leaderboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/plans/create"
          element={
            <ProtectedRoute>
              <CreatePlan />
            </ProtectedRoute>
          }
        />
        <Route
          path="/plans/:id/chat"
          element={
            <ProtectedRoute>
              <PlanChat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/plans/:id"
          element={
            <ProtectedRoute>
              <PlanDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/premium"
          element={
            <ProtectedRoute>
              <Premium />
            </ProtectedRoute>
          }
        />
        <Route
          path="/feedback"
          element={
            <ProtectedRoute>
              <Feedback />
            </ProtectedRoute>
          }
        />
        <Route
          path="/internal/admin"
          element={
            <ProtectedRoute>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
