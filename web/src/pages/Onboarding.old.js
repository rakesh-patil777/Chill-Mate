import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { api } from '../api';
export default function Onboarding() {
    const [bio, setBio] = useState('');
    const [hobbies, setHobbies] = useState('');
    const [interests, setInterests] = useState('');
    const [habits, setHabits] = useState('');
    const [ok, setOk] = useState(false);
    useEffect(() => {
        (async () => {
            try {
                const me = await api('/profiles/me');
                setBio(me?.bio ?? '');
                setHobbies(JSON.parse(me?.hobbies ?? '[]').join(', '));
                setInterests(JSON.parse(me?.interests ?? '[]').join(', '));
                setHabits(JSON.parse(me?.habits ?? '[]').join(', '));
            }
            catch { /* ignore */ }
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
    return (_jsxs("div", { className: "max-w-2xl mx-auto p-4 sm:p-6", children: [_jsx("h1", { className: "text-2xl sm:text-3xl font-mono font-bold text-chill-600 mb-6 text-center", children: "Tell us about you" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("label", { className: "block", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Bio" }), _jsx("textarea", { value: bio, onChange: e => setBio(e.target.value), className: "mt-1 w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-chill-500 focus:border-transparent transition-all", rows: 4, placeholder: "Tell us about yourself..." })] }), _jsxs("label", { className: "block", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Hobbies (comma separated)" }), _jsx("input", { value: hobbies, onChange: e => setHobbies(e.target.value), className: "mt-1 w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-chill-500 focus:border-transparent transition-all", placeholder: "e.g., reading, gaming, cooking" })] }), _jsxs("label", { className: "block", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Interests (comma separated)" }), _jsx("input", { value: interests, onChange: e => setInterests(e.target.value), className: "mt-1 w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-chill-500 focus:border-transparent transition-all", placeholder: "e.g., technology, music, sports" })] }), _jsxs("label", { className: "block", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Habits (comma separated)" }), _jsx("input", { value: habits, onChange: e => setHabits(e.target.value), className: "mt-1 w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-chill-500 focus:border-transparent transition-all", placeholder: "e.g., morning coffee, gym, meditation" })] })] }), _jsxs("div", { className: "mt-6 flex flex-col sm:flex-row gap-3", children: [_jsx("button", { onClick: save, className: "bg-chill-500 hover:bg-chill-600 text-white rounded-lg px-6 py-3 font-medium transition-colors", children: "Save Profile" }), ok && _jsx("span", { className: "text-green-700 font-medium flex items-center", children: "\u2713 Saved successfully!" })] })] }));
}
