import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
class ErrorBoundary extends React.Component {
    constructor() {
        super(...arguments);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    render() {
        if (this.state.hasError && this.state.error) {
            return (_jsxs("div", { style: { padding: 24, fontFamily: "sans-serif", background: "#fce7f3", minHeight: "100vh" }, children: [_jsx("h1", { style: { color: "#be185d" }, children: "Something went wrong" }), _jsx("pre", { style: { background: "#fff", padding: 16, overflow: "auto" }, children: this.state.error.message })] }));
        }
        return this.props.children;
    }
}
const root = document.getElementById("root");
if (root) {
    ReactDOM.createRoot(root).render(_jsx(React.StrictMode, { children: _jsx(ErrorBoundary, { children: _jsx(App, {}) }) }));
}
