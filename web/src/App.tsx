import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Discover from './pages/Discover';

function Private({ children }: { children: JSX.Element }) {
	const { auth } = useAuth();
	return auth.token ? children : <Navigate to="/login" replace />;
}

function Nav() {
	return (
		<nav className="border-b bg-white sticky top-0 z-50">
			<div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
				<Link to="/" className="text-xl sm:text-2xl font-mono font-bold text-chill-600">Chill Mate</Link>
				<div className="flex gap-3 sm:gap-4 text-sm">
					<Link to="/discover" className="text-chill-600 hover:text-chill-700 font-medium px-2 py-1 rounded hover:bg-chill-50 transition-colors">
						Discover
					</Link>
					<Link to="/onboarding" className="text-chill-600 hover:text-chill-700 font-medium px-2 py-1 rounded hover:bg-chill-50 transition-colors">
						Profile
					</Link>
				</div>
			</div>
		</nav>
	);
}

export default function App() {
	return (
		<AuthProvider>
			<BrowserRouter>
				<Nav />
				<Routes>
					<Route path="/" element={<Navigate to="/discover" />} />
					<Route path="/login" element={<Login />} />
					<Route path="/register" element={<Register />} />
					<Route path="/onboarding" element={<Private><Onboarding /></Private>} />
					<Route path="/discover" element={<Private><Discover /></Private>} />
				</Routes>
			</BrowserRouter>
		</AuthProvider>
	);
}


