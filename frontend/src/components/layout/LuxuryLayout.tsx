import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Lenis from 'lenis'
import CustomCursor from '../shared/CustomCursor'
import './LuxuryLayout.css'

interface LayoutProps {
  children: React.ReactNode
}

export default function LuxuryLayout({ children }: LayoutProps) {
  const location = useLocation()

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      smoothTouch: false,
      touchMultiplier: 2,
    })

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    return () => lenis.destroy()
  }, [])

  const isActive = (path: string) => location.pathname === path

  const navItems = [
    { path: '/', label: 'Overview' },
    { path: '/vault', label: 'Incidents' },
    { path: '/threats', label: 'Threats' },
    { path: '/analyst', label: 'Analyst' },
  ]

  return (
    <div className="luxury-layout">
      <CustomCursor />

      <nav className="luxury-navbar">
        <div className="navbar-container">
          <div className="navbar-brand">
            <span className="brand-icon">⚔️</span>
            <span className="brand-text">MemoryShield</span>
          </div>

          <div className="navbar-links">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <button className="luxury-button">Reserve Access</button>
        </div>
      </nav>

      <main className="luxury-main">
        <div className="main-container">{children}</div>
      </main>

      <footer className="luxury-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <h3>MemoryShield AI</h3>
            <p>Security memory for intelligent agents</p>
          </div>
          <div className="footer-links">
            <a href="#docs">Documentation</a>
            <a href="#api">API</a>
            <a href="#contact">Contact</a>
          </div>
          <p className="footer-copyright">
            2026 MemoryShield. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
