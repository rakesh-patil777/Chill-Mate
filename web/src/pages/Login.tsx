import { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
	const [collegeId, setCollegeId] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const { setToken } = useAuth();
	const nav = useNavigate();

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		try {
			const { token } = await api<{ token: string }>('/auth/login', {
				method: 'POST',
				body: JSON.stringify({ collegeId: collegeId.trim(), password })
			});
			setToken(token);
			nav('/discover');
		} catch (e: any) {
			setError('Invalid credentials');
		}
	}

	return (
		<div className="min-h-screen grid place-items-center bg-chill-50 px-4 py-8">
			<form onSubmit={onSubmit} className="bg-white p-6 sm:p-8 rounded-xl shadow w-full max-w-md">
				<h1 className="text-2xl sm:text-3xl font-mono font-bold text-chill-600 mb-6 text-center">Chill Mate</h1>
				<label className="block mb-3">
					<span className="text-sm text-gray-600">College ID</span>
					<input 
						value={collegeId} 
						onChange={e => setCollegeId(e.target.value)} 
						className="mt-1 w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-chill-500 focus:border-transparent transition-all" 
						required 
					/>
				</label>
				<label className="block mb-4">
					<span className="text-sm text-gray-600">Password</span>
					<input 
						type="password" 
						value={password} 
						onChange={e => setPassword(e.target.value)} 
						className="mt-1 w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-chill-500 focus:border-transparent transition-all" 
						required 
					/>
				</label>
				{error && <div className="text-red-600 text-sm mb-3 p-2 bg-red-50 rounded">{error}</div>}
				<button className="w-full bg-chill-500 hover:bg-chill-600 text-white rounded-lg p-3 font-medium transition-colors">
					Log In
				</button>
				<p className="text-sm mt-4 text-center">
					New here? <Link to="/register" className="text-chill-600 hover:text-chill-700 font-medium">Create account</Link>
				</p>
			</form>
		</div>
	);
}


