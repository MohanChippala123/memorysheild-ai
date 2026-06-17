import './Dashboard.css'

export default function Dashboard() {
  const mockData = {
    securityScore: 78,
    totalIncidents: 1247,
    blockedIncidents: 891,
    warnedIncidents: 356,
    detectionRate: 94.2,
    falsePositiveRate: 2.1,
    learningRate: 87.3,
  }

  const mockThreats = [
    { name: 'Prompt Injection', count: 47, percentage: 38 },
    { name: 'Tool Abuse', count: 34, percentage: 27 },
    { name: 'Data Exfiltration', count: 28, percentage: 22 },
    { name: 'Jailbreak', count: 18, percentage: 14 },
  ]

  const mockIncidents = [
    { id: 1, time: 'Now', type: 'Prompt Injection', severity: 'CRITICAL', action: 'BLOCKED' },
    { id: 2, time: '2m ago', type: 'Tool Abuse', severity: 'HIGH', action: 'WARNED' },
    { id: 3, time: '5m ago', type: 'Policy Violation', severity: 'CRITICAL', action: 'BLOCKED' },
    { id: 4, time: '12m ago', type: 'Data Exfiltration', severity: 'HIGH', action: 'BLOCKED' },
  ]

  return (
    <div className="dashboard">
      {/* Security Score */}
      <section className="security-score-section">
        <div className="security-score-card">
          <h2>Security Score</h2>
          <div className="score-display">
            <div className="score-circle">
              <span className="score-value">{mockData.securityScore}</span>
              <span className="score-label">/100</span>
            </div>
            <div className="score-trend">↑ +5 this week</div>
          </div>
        </div>
      </section>

      {/* Metrics Grid */}
      <section className="metrics-grid">
        <div className="metric-card">
          <div className="metric-value">{mockData.totalIncidents}</div>
          <div className="metric-label">Total Incidents</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{mockData.blockedIncidents}</div>
          <div className="metric-label">Blocked</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{mockData.warnedIncidents}</div>
          <div className="metric-label">Warned</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{mockData.detectionRate.toFixed(1)}%</div>
          <div className="metric-label">Detection Rate</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{mockData.falsePositiveRate.toFixed(1)}%</div>
          <div className="metric-label">False Positive</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{mockData.learningRate.toFixed(1)}%</div>
          <div className="metric-label">Learning Rate</div>
        </div>
      </section>

      {/* Threat Distribution */}
      <section className="threat-section">
        <h3>Threat Distribution</h3>
        <div className="threat-chart">
          {mockThreats.map((threat) => (
            <div key={threat.name} className="threat-row">
              <div className="threat-bar">
                <div className="bar-fill" style={{ width: `${threat.percentage * 2}px` }}></div>
              </div>
              <div className="threat-label">
                <span className="threat-name">{threat.name}</span>
                <span className="threat-count">{threat.count}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Learning Progress */}
      <section className="learning-section">
        <h3>Learning Progress (Last 90 Days)</h3>
        <div className="learning-chart">
          <div className="chart-sparkline">
            📈 Detection Rate improving: 71% → 94.2%
          </div>
          <div className="learning-stats">
            <span>Month 1: Detected 40%</span>
            <span>Month 2: Detected 72%</span>
            <span>Month 3: Detected 94%</span>
          </div>
        </div>
      </section>

      {/* Recent Incidents */}
      <section className="incidents-section">
        <h3>Recent Incidents</h3>
        <table className="incidents-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Threat Type</th>
              <th>Severity</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {mockIncidents.map((incident) => (
              <tr key={incident.id} className={`incident-row severity-${incident.severity.toLowerCase()}`}>
                <td>{incident.time}</td>
                <td>{incident.type}</td>
                <td>
                  <span className={`severity-badge ${incident.severity.toLowerCase()}`}>
                    {incident.severity}
                  </span>
                </td>
                <td>
                  <span className={`action-badge ${incident.action.toLowerCase()}`}>
                    {incident.action}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
