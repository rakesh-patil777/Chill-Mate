import { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import { useNavigate } from 'react-router-dom';

export default function Register() {
	const nav = useNavigate();
	const { setToken } = useAuth();
	const [form, setForm] = useState({ collegeId: '', password: '', fullName: '', age: 18, email: '', gender: '' });
	const [error, setError] = useState<string | null>(null);

	function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
		setForm(prev => ({ ...prev, [k]: v }));
	}

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		try {
			const { token } = await api<{ token: string }>('/auth/register', {
				method: 'POST',
				body: JSON.stringify({
					...form,
					email: form.email || undefined,
					gender: form.gender || undefined
				})
			});
			setToken(token);
			nav('/onboarding');
		} catch (e: any) {
			console.error('Registration error:', e);
			if (e.message?.includes('32 character')) {
				setError('College ID is too long. Please use a shorter format (e.g., just your student ID number)');
			} else if (e.message?.includes('Invalid college ID')) {
				setError('Please enter a valid college ID format');
			} else {
				setError(e.message || 'Registration failed');
			}
		}
	}

	return (
		<div className="min-h-screen grid place-items-center bg-chill-50 px-4 py-8">
			<form onSubmit={onSubmit} className="bg-white p-6 sm:p-8 rounded-xl shadow w-full max-w-lg">
				<h1 className="text-2xl sm:text-3xl font-mono font-bold text-chill-600 mb-6 text-center">Join Chill Mate</h1>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<label className="block">
						<span className="text-sm text-gray-600">Full Name</span>
						<input 
							value={form.fullName} 
							onChange={e => set('fullName', e.target.value)} 
							className="mt-1 w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-chill-500 focus:border-transparent transition-all" 
							required 
						/>
					</label>
					<label className="block">
						<span className="text-sm text-gray-600">Age</span>
						<input 
							type="number" 
							min={18} 
							value={form.age} 
							onChange={e => set('age', Number(e.target.value))} 
							className="mt-1 w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-chill-500 focus:border-transparent transition-all" 
							required 
						/>
					</label>
					<label className="block col-span-1 sm:col-span-2">
						<span className="text-sm text-gray-600">College ID</span>
						<input 
							value={form.collegeId} 
							onChange={e => set('collegeId', e.target.value)} 
							className="mt-1 w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-chill-500 focus:border-transparent transition-all" 
							placeholder="e.g., 20231CSE0670 or RAKESH123"
							required 
						/>
						<p className="text-xs text-gray-500 mt-1">Use your student ID or a shorter format (max 32 characters)</p>
					</label>
					<label className="block col-span-1 sm:col-span-2">
						<span className="text-sm text-gray-600">Email (optional)</span>
						<input 
							type="email" 
							value={form.email} 
							onChange={e => set('email', e.target.value)} 
							className="mt-1 w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-chill-500 focus:border-transparent transition-all" 
						/>
					</label>
					<label className="block col-span-1 sm:col-span-2">
						<span className="text-sm text-gray-600">Password</span>
						<input 
							type="password" 
							value={form.password} 
							onChange={e => set('password', e.target.value)} 
							className="mt-1 w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-chill-500 focus:border-transparent transition-all" 
							required 
						/>
					</label>
				</div>
				{error && <div className="text-red-600 text-sm my-3 p-2 bg-red-50 rounded">{error}</div>}
				<button className="w-full bg-chill-500 hover:bg-chill-600 text-white rounded-lg p-3 font-medium transition-colors">
					Create Account
				</button>
			</form>
		</div>
	);
}


