import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import api from './api'
import Login from './Login'
import Dashboard from './Dashboard'
import CaseDetails from './CaseDetails'
import { initTheme, applyOrganizationBranding, clearOrganizationBranding } from './theme'
import { ToastsProvider } from './Toasts'

function App() {
  // Initialize state from localStorage
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [role, setRole] = useState(localStorage.getItem('role'))
  const [organization, setOrganization] = useState(null)
  const navigate = useNavigate()

  // Login Handler (Passed to Login.jsx)
  // Login.jsx has already saved the token to localStorage, so we just update React state
  const handleLogin = async (userData) => {
    setToken(localStorage.getItem('token'))
    setRole(userData.role)

    // Fetch and apply organization branding
    try {
      const response = await api.get('users/me/')
      const orgData = {
        id: response.data.organization,
        name: response.data.organization_name,
        org_type: response.data.organization_type,
        primary_color: '#2563eb', // Default, will be updated when org data is fetched
        secondary_color: '#1e40af'
      }
      setOrganization(orgData)
      applyOrganizationBranding(orgData)
    } catch (error) {
      console.error('Failed to fetch organization data:', error)
    }

    navigate('/')
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    setToken(null)
    setRole(null)
    setOrganization(null)
    clearOrganizationBranding()
    navigate('/')
  }

    // Initialize theme on load
    useEffect(()=>{
      initTheme()
    }, [])

  // Render Login or protected routes inside the provider so toasts work everywhere
  return (
    <ToastsProvider>
      {!token ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Routes>
            <Route path="/" element={<Dashboard role={role} organization={organization} onLogout={handleLogout} />} />
            <Route path="/cases/:id" element={<CaseDetails role={role} organization={organization} />} />
            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      )}
    </ToastsProvider>
  )
}

export default App