import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import axios from 'axios' // <--- Import Axios
import Login from './Login'
import Dashboard from './Dashboard'
import CaseDetails from './CaseDetails'

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [role, setRole] = useState(localStorage.getItem('role'))
  const navigate = useNavigate()

  // --- CRITICAL FIX: AUTOMATICALLY ATTACH TOKEN ---
  useEffect(() => {
    if (token) {
      // If we have a token, tell Axios to use it for EVERYTHING
      axios.defaults.headers.common['Authorization'] = `Token ${token}`
    } else {
      // If no token, remove the header
      delete axios.defaults.headers.common['Authorization']
    }
  }, [token]) // Run this whenever 'token' changes

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

  if (!token) {
      return <Login onLoginSuccess={handleLogin} />
  }

  return (
    <Routes>
        <Route path="/" element={<Dashboard role={role} onLogout={handleLogout} />} />
        <Route path="/cases/:id" element={<CaseDetails />} />
        <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App