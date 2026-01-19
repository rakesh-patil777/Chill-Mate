import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Onboarding() {
	const [bio, setBio] = useState('');
	const [hobbies, setHobbies] = useState<string>('');
	const [interests, setInterests] = useState<string>('');
	const [habits, setHabits] = useState<string>('');
	const [ok, setOk] = useState(false);

	useEffect(() => {
		(async () => {
			try {
				const me = await api<any>('/profiles/me');
				setBio(me?.bio ?? '');
				setHobbies(JSON.parse(me?.hobbies ?? '[]').join(', '));
				setInterests(JSON.parse(me?.interests ?? '[]').join(', '));
				setHabits(JSON.parse(me?.habits ?? '[]').join(', '));
			} catch { /* ignore */ }
		})();
	}, []);

	async function save() {
		await api('/profiles/me', {
			method: 'PUT',
			body: JSON.stringify({
				bio,
				hobbies: hobbies.split(',').map(s => s.trim()).filter(Boolean),
				interests: interests.split(',').map(s => s.trim()).filter(Boolean),
				habits: habits.split(',').map(s => s.trim()).filter(Boolean)
			})
		});
		setOk(true);
	}

	return (
		<div className="max-w-2xl mx-auto p-4 sm:p-6">
			<h1 className="text-2xl sm:text-3xl font-mono font-bold text-chill-600 mb-6 text-center">Tell us about you</h1>
			<div className="space-y-4">
				<label className="block">
					<span className="text-sm text-gray-600">Bio</span>
					<textarea 
						value={bio} 
						onChange={e => setBio(e.target.value)} 
						className="mt-1 w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-chill-500 focus:border-transparent transition-all" 
						rows={4} 
						placeholder="Tell us about yourself..."
					/>
				</label>
				<label className="block">
					<span className="text-sm text-gray-600">Hobbies (comma separated)</span>
					<input 
						value={hobbies} 
						onChange={e => setHobbies(e.target.value)} 
						className="mt-1 w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-chill-500 focus:border-transparent transition-all"
						placeholder="e.g., reading, gaming, cooking"
					/>
				</label>
				<label className="block">
					<span className="text-sm text-gray-600">Interests (comma separated)</span>
					<input 
						value={interests} 
						onChange={e => setInterests(e.target.value)} 
						className="mt-1 w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-chill-500 focus:border-transparent transition-all"
						placeholder="e.g., technology, music, sports"
					/>
				</label>
				<label className="block">
					<span className="text-sm text-gray-600">Habits (comma separated)</span>
					<input 
						value={habits} 
						onChange={e => setHabits(e.target.value)} 
						className="mt-1 w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-chill-500 focus:border-transparent transition-all"
						placeholder="e.g., morning coffee, gym, meditation"
					/>
				</label>
			</div>
			<div className="mt-6 flex flex-col sm:flex-row gap-3">
				<button 
					onClick={save} 
					className="bg-chill-500 hover:bg-chill-600 text-white rounded-lg px-6 py-3 font-medium transition-colors"
				>
					Save Profile
				</button>
				{ok && <span className="text-green-700 font-medium flex items-center">✓ Saved successfully!</span>}
			</div>
		</div>
	);
}


