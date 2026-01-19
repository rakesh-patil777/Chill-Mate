import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { api } from '../api';
export default function Discover() {
    const [chill, setChill] = useState([]);
    const [study, setStudy] = useState([]);
    useEffect(() => {
        (async () => {
            const c = await api('/chill/browse');
            const s = await api('/study/browse');
            setChill(c);
            setStudy(s);
        })();
    }, []);
    return (_jsxs("div", { className: "max-w-6xl mx-auto p-4 sm:p-6", children: [_jsx("h1", { className: "text-2xl sm:text-3xl font-mono font-bold text-chill-600 mb-6 text-center", children: "Discover" }), _jsxs("div", { className: "space-y-8", children: [_jsxs("section", { children: [_jsxs("h2", { className: "text-xl sm:text-2xl font-semibold text-chill-700 mb-4 flex items-center", children: [_jsx("span", { className: "mr-2", children: "\uD83C\uDF89" }), " Chill Plans"] }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", children: chill.map(p => (_jsxs("div", { className: "bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow", children: [_jsx("h3", { className: "font-semibold text-lg text-gray-900 mb-2", children: p.title }), _jsx("p", { className: "text-sm text-gray-600 mb-3 line-clamp-2", children: p.description }), _jsxs("div", { className: "text-xs text-gray-500 flex items-center", children: [_jsx("span", { className: "mr-1", children: "\uD83D\uDCCD" }), p.location, " \u2022 Host: ", p.hostName] })] }, p.id))) })] }), _jsxs("section", { children: [_jsxs("h2", { className: "text-xl sm:text-2xl font-semibold text-chill-700 mb-4 flex items-center", children: [_jsx("span", { className: "mr-2", children: "\uD83D\uDCDA" }), " Study Events"] }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", children: study.map(p => (_jsxs("div", { className: "bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow", children: [_jsx("h3", { className: "font-semibold text-lg text-gray-900 mb-2", children: p.title }), _jsx("p", { className: "text-sm text-gray-600 mb-3 line-clamp-2", children: p.description ?? p.topic }), _jsxs("div", { className: "text-xs text-gray-500 flex items-center", children: [_jsx("span", { className: "mr-1", children: "\uD83D\uDCCD" }), p.location, " \u2022 Host: ", p.hostName] })] }, p.id))) })] })] })] }));
}
