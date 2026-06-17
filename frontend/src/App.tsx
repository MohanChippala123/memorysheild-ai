import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LuxuryLayout from './components/layout/LuxuryLayout'
import LuxuryDashboard from './pages/LuxuryDashboard'
import SecurityVault from './pages/SecurityVault'
import IncidentExplorer from './pages/IncidentExplorer'
import ThreatFamilies from './pages/ThreatFamilies'
import AgentProfile from './pages/AgentProfile'
import SecurityAnalyst from './pages/SecurityAnalyst'
import './App.css'

function App() {
  return (
    <Router>
      <LuxuryLayout>
        <Routes>
          <Route path="/" element={<LuxuryDashboard />} />
          <Route path="/vault" element={<SecurityVault />} />
          <Route path="/incidents/:id" element={<IncidentExplorer />} />
          <Route path="/threats" element={<ThreatFamilies />} />
          <Route path="/agents/:id" element={<AgentProfile />} />
          <Route path="/analyst" element={<SecurityAnalyst />} />
        </Routes>
      </LuxuryLayout>
    </Router>
  )
}

export default App
