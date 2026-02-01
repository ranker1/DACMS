import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import api from './api'
import Login from './Login'
import Dashboard from './Dashboard'
import CaseDetails from './CaseDetails'
import { initTheme } from './theme'

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [role, setRole] = useState(localStorage.getItem('role'))
  const navigate = useNavigate()

  // `api` instance attaches token automatically from localStorage

  const handleLogin = (newToken, newRole) => {
    setToken(newToken)
    setRole(newRole)
    // Save is handled in Login.jsx, but we update state here to trigger the useEffect above
    navigate('/') 
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    setToken(null)
    setRole(null)
    navigate('/')
  }

  useEffect(()=>{
    initTheme()
  }, [])

  if (!token) {
      return <Login onLoginSuccess={handleLogin} />
  }

  return (
    <Routes>
        <Route path="/" element={<Dashboard role={role} onLogout={handleLogout} />} />
        <Route path="/cases/:id" element={<CaseDetails role={role} />} />
        <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App