import { useState } from 'react'
import api from './api'
import { useNavigate } from 'react-router-dom'

function Login({ onLoginSuccess }) {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('') // Clear previous errors
        
        try {
            // 1. Send credentials to Backend
            const res = await api.post('login/', {
                username: username,
                password: password
            })

            console.log("Server Response:", res.data) // Debugging

            // 2. Extract the Data (Match exactly what your screenshot showed)
            const { token, role } = res.data

            // 3. CRITICAL: Save to Local Storage
            if (token) {
                localStorage.setItem('token', token) 
                localStorage.setItem('role', role)
                
                // 4. Update App State
                if (onLoginSuccess) {
                    onLoginSuccess(token, role)
                }
                
                // 5. Go to Dashboard
                navigate('/') 
            } else {
                setError("Login failed: No token received from server.")
            }

        } catch (err) {
            console.error("Login Error:", err)
            setError('Invalid credentials or Server Error')
        }
    }

    return (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
            <div style={{ padding: '30px', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', background: 'white' }}>
                <h2 style={{ textAlign: 'center', color: '#333' }}>🔐 DACMS Login</h2>
                
                {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '300px' }}>
                    <input 
                        type="text" 
                        placeholder="Username" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        style={{ padding: '10px', fontSize: '16px' }}
                    />
                    <input 
                        type="password" 
                        placeholder="Password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ padding: '10px', fontSize: '16px' }}
                    />
                    <button type="submit" style={{ padding: '10px', background: '#007bff', color: 'white', border: 'none', cursor: 'pointer', fontSize: '16px', borderRadius: '4px' }}>
                        Login
                    </button>
                </form>
            </div>
        </div>
    )
}

export default Login