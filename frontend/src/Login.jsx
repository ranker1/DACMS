import { useState } from 'react'
import axios from 'axios'

function Login({ onLoginSuccess }) {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    const handleLogin = async (e) => {
        e.preventDefault()
        try {
        const response = await axios.post('http://127.0.0.1:8000/api/login/', {
            username: username,
            password: password
        })
        // Save Token AND Role
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('role', response.data.role) // <--- NEW

        // Pass both to the parent
        onLoginSuccess(response.data.token, response.data.role)
    } catch (err) {
            console.error(err)
            setError('Invalid Credentials')
        }
    }

    return (
        <div style={{ 
            height: '100vh', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            background: '#f0f2f5' 
        }}>
            <form onSubmit={handleLogin} style={{ 
                background: 'white', 
                padding: '40px', 
                borderRadius: '8px', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                display: 'flex', 
                flexDirection: 'column', 
                width: '300px',
                gap: '15px'
            }}>
                <h2 style={{ textAlign: 'center', margin: '0 0 20px 0', color: '#333' }}>🔐 DACMS Login</h2>
                
                {error && <div style={{ color: 'red', fontSize: '0.9em', textAlign: 'center' }}>{error}</div>}

                <input 
                    type="text" 
                    placeholder="Username" 
                    value={username} 
                    onChange={e => setUsername(e.target.value)}
                    style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
                <input 
                    type="password" 
                    placeholder="Password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)}
                    style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
                
                <button type="submit" style={{ 
                    padding: '12px', 
                    background: '#007bff', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px', 
                    cursor: 'pointer',
                    fontWeight: 'bold'
                }}>
                    Login
                </button>
            </form>
        </div>
    )
}

export default Login