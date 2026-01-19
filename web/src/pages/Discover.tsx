import { useEffect, useState } from 'react';
import { api } from '../api';

type Item = { id: number; title: string; description?: string; location?: string; hostName?: string; startAt?: string; topic?: string; };

export default function Discover() {
	const [chill, setChill] = useState<Item[]>([]);
	const [study, setStudy] = useState<Item[]>([]);

	useEffect(() => {
		(async () => {
			const c = await api<Item[]>('/chill/browse');
			const s = await api<Item[]>('/study/browse');
			setChill(c);
			setStudy(s);
		})();
	}, []);

	return (
		<div className="max-w-6xl mx-auto p-4 sm:p-6">
			<h1 className="text-2xl sm:text-3xl font-mono font-bold text-chill-600 mb-6 text-center">Discover</h1>

			<div className="space-y-8">
				<section>
					<h2 className="text-xl sm:text-2xl font-semibold text-chill-700 mb-4 flex items-center">
						<span className="mr-2">🎉</span> Chill Plans
					</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{chill.map(p => (
							<div key={p.id} className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
								<h3 className="font-semibold text-lg text-gray-900 mb-2">{p.title}</h3>
								<p className="text-sm text-gray-600 mb-3 line-clamp-2">{p.description}</p>
								<div className="text-xs text-gray-500 flex items-center">
									<span className="mr-1">📍</span>
									{p.location} • Host: {p.hostName}
								</div>
							</div>
						))}
					</div>
				</section>

				<section>
					<h2 className="text-xl sm:text-2xl font-semibold text-chill-700 mb-4 flex items-center">
						<span className="mr-2">📚</span> Study Events
					</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{study.map(p => (
							<div key={p.id} className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
								<h3 className="font-semibold text-lg text-gray-900 mb-2">{p.title}</h3>
								<p className="text-sm text-gray-600 mb-3 line-clamp-2">{p.description ?? p.topic}</p>
								<div className="text-xs text-gray-500 flex items-center">
									<span className="mr-1">📍</span>
									{p.location} • Host: {p.hostName}
								</div>
							</div>
						))}
					</div>
				</section>
			</div>
		</div>
	);
}


