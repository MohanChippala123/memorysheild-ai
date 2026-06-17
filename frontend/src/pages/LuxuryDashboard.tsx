import { useEffect } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'
import './LuxuryDashboard.css'

gsap.registerPlugin(ScrollTrigger)

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: 'power3.out' },
  },
}

export default function LuxuryDashboard() {
  useEffect(() => {
    const sections = document.querySelectorAll('.dashboard-section')
    sections.forEach((section) => {
      gsap.fromTo(
        section,
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            end: 'center 50%',
            scrub: false,
          },
        }
      )
    })

    return () => ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
  }, [])

  return (
    <div className="luxury-dashboard">
      {/* Hero Section */}
      <section className="hero-section">
        <motion.div
          className="hero-content"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="hero-text">
            <h1 className="hero-title">
              Crafting Exceptional
              <br />
              <span className="gold-accent">Security Intelligence</span>
            </h1>
            <p className="hero-subtitle">
              AI agents that remember. Systems that learn. Threats that fade.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="hero-card glass-card">
            <div className="card-badge">Security Status</div>
            <div className="security-score">
              <div className="score-display">78</div>
              <div className="score-label">Security Score</div>
            </div>
            <p className="score-change">↑ 5 points this week</p>
          </motion.div>
        </motion.div>
      </section>

      {/* Metrics Section */}
      <section className="dashboard-section metrics-section">
        <h2 className="section-title">Intelligence Dashboard</h2>
        <motion.div
          className="metrics-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {[
            { label: 'Total Incidents', value: '1,247', icon: '📊' },
            { label: 'Blocked Threats', value: '891', icon: '🛡️' },
            { label: 'Detection Rate', value: '94.2%', icon: '🎯' },
            { label: 'Learning Progress', value: '87.3%', icon: '📈' },
          ].map((metric, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              className="metric-card glass-card"
            >
              <div className="metric-icon">{metric.icon}</div>
              <div className="metric-value">{metric.value}</div>
              <div className="metric-label">{metric.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Threat Distribution */}
      <section className="dashboard-section threat-section">
        <h2 className="section-title">Threat Intelligence</h2>
        <div className="glass-card">
          <div className="threats-list">
            {[
              { name: 'Prompt Injection', count: 47, percentage: 38 },
              { name: 'Tool Abuse', count: 34, percentage: 27 },
              { name: 'Data Exfiltration', count: 28, percentage: 22 },
              { name: 'Jailbreak Attempts', count: 18, percentage: 14 },
            ].map((threat, idx) => (
              <div key={idx} className="threat-item">
                <div className="threat-info">
                  <span className="threat-name">{threat.name}</span>
                  <span className="threat-count">{threat.count}</span>
                </div>
                <div className="threat-bar">
                  <motion.div
                    className="threat-fill"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${threat.percentage * 2}px` }}
                    transition={{ duration: 1, ease: 'power3.out' }}
                    viewport={{ once: true }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="dashboard-section activity-section">
        <h2 className="section-title">Recent Activity</h2>
        <div className="glass-card">
          <table className="activity-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Threat Type</th>
                <th>Severity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { time: 'Now', type: 'Prompt Injection', severity: 'Critical', status: 'Blocked' },
                { time: '2m ago', type: 'Tool Abuse', severity: 'High', status: 'Warned' },
                { time: '5m ago', type: 'Policy Violation', severity: 'Critical', status: 'Blocked' },
                { time: '12m ago', type: 'Data Exfiltration', severity: 'High', status: 'Blocked' },
              ].map((row, idx) => (
                <motion.tr
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                  viewport={{ once: true }}
                  className="activity-row"
                >
                  <td>{row.time}</td>
                  <td>{row.type}</td>
                  <td>
                    <span className={`severity-badge severity-${row.severity.toLowerCase()}`}>
                      {row.severity}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${row.status.toLowerCase()}`}>
                      {row.status}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Call to Action */}
      <section className="dashboard-section cta-section">
        <motion.div
          className="cta-card glass-card"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2>Ready to Deploy?</h2>
          <p>Connect your AI agents to MemoryShield and watch threats fade away.</p>
          <button className="luxury-button">Get Started</button>
        </motion.div>
      </section>
    </div>
  )
}
