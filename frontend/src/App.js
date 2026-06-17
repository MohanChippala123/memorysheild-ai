import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import SecurityVault from './pages/SecurityVault';
import IncidentExplorer from './pages/IncidentExplorer';
import ThreatFamilies from './pages/ThreatFamilies';
import AgentProfile from './pages/AgentProfile';
import SecurityAnalyst from './pages/SecurityAnalyst';
import './App.css';
function App() {
    return (_jsx(Router, { children: _jsx(Layout, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Dashboard, {}) }), _jsx(Route, { path: "/vault", element: _jsx(SecurityVault, {}) }), _jsx(Route, { path: "/incidents/:id", element: _jsx(IncidentExplorer, {}) }), _jsx(Route, { path: "/threats", element: _jsx(ThreatFamilies, {}) }), _jsx(Route, { path: "/agents/:id", element: _jsx(AgentProfile, {}) }), _jsx(Route, { path: "/analyst", element: _jsx(SecurityAnalyst, {}) })] }) }) }));
}
export default App;
