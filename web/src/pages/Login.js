import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import { Link, useNavigate } from 'react-router-dom';
export default function Login() {
    const [collegeId, setCollegeId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const { setToken } = useAuth();
    const nav = useNavigate();
    async function onSubmit(e) {
        e.preventDefault();
        setError(null);
        try {
            const { token } = await api('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ collegeId, password })
            });
            setToken(token);
            nav('/discover');
        }
        catch (e) {
            setError('Invalid credentials');
        }
    }
    return (_jsx("div", { className: "min-h-screen grid place-items-center bg-chill-50 px-4 py-8", children: _jsxs("form", { onSubmit: onSubmit, className: "bg-white p-6 sm:p-8 rounded-xl shadow w-full max-w-md", children: [_jsx("h1", { className: "text-2xl sm:text-3xl font-mono font-bold text-chill-600 mb-6 text-center", children: "Chill Mate" }), _jsxs("label", { className: "block mb-3", children: [_jsx("span", { className: "text-sm text-gray-600", children: "College ID" }), _jsx("input", { value: collegeId, onChange: e => setCollegeId(e.target.value), className: "mt-1 w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-chill-500 focus:border-transparent transition-all", required: true })] }), _jsxs("label", { className: "block mb-4", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Password" }), _jsx("input", { type: "password", value: password, onChange: e => setPassword(e.target.value), className: "mt-1 w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-chill-500 focus:border-transparent transition-all", required: true })] }), error && _jsx("div", { className: "text-red-600 text-sm mb-3 p-2 bg-red-50 rounded", children: error }), _jsx("button", { className: "w-full bg-chill-500 hover:bg-chill-600 text-white rounded-lg p-3 font-medium transition-colors", children: "Log In" }), _jsxs("p", { className: "text-sm mt-4 text-center", children: ["New here? ", _jsx(Link, { to: "/register", className: "text-chill-600 hover:text-chill-700 font-medium", children: "Create account" })] })] }) }));
}
