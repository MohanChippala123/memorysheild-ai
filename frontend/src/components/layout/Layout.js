import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Layout.css';
export default function Layout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const location = useLocation();
    const isActive = (path) => location.pathname === path;
    const menuItems = [
        { path: '/', label: 'Overview', icon: '📊' },
        { path: '/vault', label: 'Security Vault', icon: '🔐' },
        { path: '/threats', label: 'Threat Families', icon: '⚠️' },
        { path: '/analyst', label: 'AI Analyst', icon: '🤖' },
    ];
    return (_jsxs("div", { className: "layout", children: [_jsxs("aside", { className: `sidebar ${sidebarOpen ? 'open' : 'closed'}`, children: [_jsxs("div", { className: "sidebar-header", children: [_jsxs("div", { className: "logo", children: [_jsx("span", { className: "logo-icon", children: "\uD83D\uDEE1\uFE0F" }), _jsx("span", { className: "logo-text", children: "MemoryShield" })] }), _jsx("button", { className: "toggle-btn", onClick: () => setSidebarOpen(!sidebarOpen), title: "Toggle sidebar", children: "\u2630" })] }), _jsx("nav", { className: "sidebar-nav", children: menuItems.map((item) => (_jsxs(Link, { to: item.path, className: `nav-item ${isActive(item.path) ? 'active' : ''}`, children: [_jsx("span", { className: "nav-icon", children: item.icon }), sidebarOpen && _jsx("span", { className: "nav-label", children: item.label })] }, item.path))) }), _jsx("div", { className: "sidebar-footer", children: _jsxs("div", { className: "user-info", children: [_jsx("div", { className: "user-avatar", children: "\uD83D\uDC64" }), sidebarOpen && (_jsxs("div", { className: "user-details", children: [_jsx("div", { className: "user-name", children: "Security Team" }), _jsx("div", { className: "user-org", children: "Demo Org" })] }))] }) })] }), _jsxs("div", { className: "main-content", children: [_jsxs("header", { className: "top-bar", children: [_jsxs("div", { className: "top-bar-left", children: [_jsx("h1", { children: "MemoryShield AI" }), _jsx("p", { className: "tagline", children: "AI agents that learn from security incidents" })] }), _jsxs("div", { className: "top-bar-right", children: [_jsx("button", { className: "notification-btn", title: "Notifications", children: "\uD83D\uDD14" }), _jsx("button", { className: "settings-btn", title: "Settings", children: "\u2699\uFE0F" })] })] }), _jsx("main", { className: "content", children: children })] })] }));
}
