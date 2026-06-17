import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Layout.css'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  const menuItems = [
    { path: '/', label: 'Overview', icon: '📊' },
    { path: '/vault', label: 'Security Vault', icon: '🔐' },
    { path: '/threats', label: 'Threat Families', icon: '⚠️' },
    { path: '/analyst', label: 'AI Analyst', icon: '🤖' },
  ]

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">🛡️</span>
            <span className="logo-text">MemoryShield</span>
          </div>
          <button
            className="toggle-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title="Toggle sidebar"
          >
            ☰
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">👤</div>
            {sidebarOpen && (
              <div className="user-details">
                <div className="user-name">Security Team</div>
                <div className="user-org">Demo Org</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <header className="top-bar">
          <div className="top-bar-left">
            <h1>MemoryShield AI</h1>
            <p className="tagline">AI agents that learn from security incidents</p>
          </div>
          <div className="top-bar-right">
            <button className="notification-btn" title="Notifications">
              🔔
            </button>
            <button className="settings-btn" title="Settings">
              ⚙️
            </button>
          </div>
        </header>

        <main className="content">
          {children}
        </main>
      </div>
    </div>
  )
}
