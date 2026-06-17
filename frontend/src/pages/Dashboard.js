import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import './Dashboard.css';
export default function Dashboard() {
    const mockData = {
        securityScore: 78,
        totalIncidents: 1247,
        blockedIncidents: 891,
        warnedIncidents: 356,
        detectionRate: 94.2,
        falsePositiveRate: 2.1,
        learningRate: 87.3,
    };
    const mockThreats = [
        { name: 'Prompt Injection', count: 47, percentage: 38 },
        { name: 'Tool Abuse', count: 34, percentage: 27 },
        { name: 'Data Exfiltration', count: 28, percentage: 22 },
        { name: 'Jailbreak', count: 18, percentage: 14 },
    ];
    const mockIncidents = [
        { id: 1, time: 'Now', type: 'Prompt Injection', severity: 'CRITICAL', action: 'BLOCKED' },
        { id: 2, time: '2m ago', type: 'Tool Abuse', severity: 'HIGH', action: 'WARNED' },
        { id: 3, time: '5m ago', type: 'Policy Violation', severity: 'CRITICAL', action: 'BLOCKED' },
        { id: 4, time: '12m ago', type: 'Data Exfiltration', severity: 'HIGH', action: 'BLOCKED' },
    ];
    return (_jsxs("div", { className: "dashboard", children: [_jsx("section", { className: "security-score-section", children: _jsxs("div", { className: "security-score-card", children: [_jsx("h2", { children: "Security Score" }), _jsxs("div", { className: "score-display", children: [_jsxs("div", { className: "score-circle", children: [_jsx("span", { className: "score-value", children: mockData.securityScore }), _jsx("span", { className: "score-label", children: "/100" })] }), _jsx("div", { className: "score-trend", children: "\u2191 +5 this week" })] })] }) }), _jsxs("section", { className: "metrics-grid", children: [_jsxs("div", { className: "metric-card", children: [_jsx("div", { className: "metric-value", children: mockData.totalIncidents }), _jsx("div", { className: "metric-label", children: "Total Incidents" })] }), _jsxs("div", { className: "metric-card", children: [_jsx("div", { className: "metric-value", children: mockData.blockedIncidents }), _jsx("div", { className: "metric-label", children: "Blocked" })] }), _jsxs("div", { className: "metric-card", children: [_jsx("div", { className: "metric-value", children: mockData.warnedIncidents }), _jsx("div", { className: "metric-label", children: "Warned" })] }), _jsxs("div", { className: "metric-card", children: [_jsxs("div", { className: "metric-value", children: [mockData.detectionRate.toFixed(1), "%"] }), _jsx("div", { className: "metric-label", children: "Detection Rate" })] }), _jsxs("div", { className: "metric-card", children: [_jsxs("div", { className: "metric-value", children: [mockData.falsePositiveRate.toFixed(1), "%"] }), _jsx("div", { className: "metric-label", children: "False Positive" })] }), _jsxs("div", { className: "metric-card", children: [_jsxs("div", { className: "metric-value", children: [mockData.learningRate.toFixed(1), "%"] }), _jsx("div", { className: "metric-label", children: "Learning Rate" })] })] }), _jsxs("section", { className: "threat-section", children: [_jsx("h3", { children: "Threat Distribution" }), _jsx("div", { className: "threat-chart", children: mockThreats.map((threat) => (_jsxs("div", { className: "threat-row", children: [_jsx("div", { className: "threat-bar", children: _jsx("div", { className: "bar-fill", style: { width: `${threat.percentage * 2}px` } }) }), _jsxs("div", { className: "threat-label", children: [_jsx("span", { className: "threat-name", children: threat.name }), _jsx("span", { className: "threat-count", children: threat.count })] })] }, threat.name))) })] }), _jsxs("section", { className: "learning-section", children: [_jsx("h3", { children: "Learning Progress (Last 90 Days)" }), _jsxs("div", { className: "learning-chart", children: [_jsx("div", { className: "chart-sparkline", children: "\uD83D\uDCC8 Detection Rate improving: 71% \u2192 94.2%" }), _jsxs("div", { className: "learning-stats", children: [_jsx("span", { children: "Month 1: Detected 40%" }), _jsx("span", { children: "Month 2: Detected 72%" }), _jsx("span", { children: "Month 3: Detected 94%" })] })] })] }), _jsxs("section", { className: "incidents-section", children: [_jsx("h3", { children: "Recent Incidents" }), _jsxs("table", { className: "incidents-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Time" }), _jsx("th", { children: "Threat Type" }), _jsx("th", { children: "Severity" }), _jsx("th", { children: "Action" })] }) }), _jsx("tbody", { children: mockIncidents.map((incident) => (_jsxs("tr", { className: `incident-row severity-${incident.severity.toLowerCase()}`, children: [_jsx("td", { children: incident.time }), _jsx("td", { children: incident.type }), _jsx("td", { children: _jsx("span", { className: `severity-badge ${incident.severity.toLowerCase()}`, children: incident.severity }) }), _jsx("td", { children: _jsx("span", { className: `action-badge ${incident.action.toLowerCase()}`, children: incident.action }) })] }, incident.id))) })] })] })] }));
}
