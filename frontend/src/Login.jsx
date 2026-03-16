import { useState, useEffect } from 'react'
import api from './api'
import { useNavigate } from 'react-router-dom'
import { useToasts } from './Toasts'

// --- MINISTRY LOGO COMPONENT ---
const MinistryLogo = ({ size = 55, alt = 'Ministry of Health Logo' }) => {
    const [failed, setFailed] = useState(false)

    if (!failed) {
        return (
            <img
                src="/moh-logo.png"
                alt={alt}
                width={size}
                height={size}
                style={{ borderRadius: '10%', objectFit: 'contain', border: '1px solid rgba(0,0,0,0.1)' }}
                onError={() => setFailed(true)}
            />
        )
    }

    return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Kenyan Flag Colors - Red, Black, Green, White */}
            <rect width="100" height="100" rx="8" fill="#FFFFFF" stroke="#0f172a" strokeWidth="2"/>
            {/* Cross */}
            <rect x="15" y="40" width="70" height="20" fill="#000000"/>
            <rect x="40" y="15" width="20" height="70" fill="#000000"/>
            {/* Shield outline */}
            <path d="M50 10 L70 25 L70 60 L50 75 L30 60 L30 25 Z" fill="none" stroke="#0f172a" strokeWidth="3"/>
            {/* Medical cross */}
            <rect x="45" y="35" width="10" height="30" fill="#DC2626"/>
            <rect x="35" y="45" width="30" height="10" fill="#DC2626"/>
            {/* Ministry text hint */}
            <text x="50" y="85" textAnchor="middle" fontSize="6" fill="#0f172a" fontWeight="bold">MOH</text>
        </svg>
    )
}

// --- CUSTOM LOGO COMPONENT ---
const DacmsLogo = ({ size = 60, color = "#2563eb" }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 10C14.4772 10 10 14.4772 10 20V80C10 85.5228 14.4772 90 20 90H80C85.5228 90 90 85.5228 90 80V35L65 10H20Z" fill={color} fillOpacity="0.1" stroke={color} strokeWidth="4"/>
        <path d="M65 10V35H90" stroke={color} strokeWidth="4"/>
        <path d="M35 40C35 40 40 35 50 35C60 35 65 40 65 40" stroke={color} strokeWidth="4" strokeLinecap="round"/>
        <path d="M30 55C30 55 38 48 50 48C62 48 70 55 70 55" stroke={color} strokeWidth="4" strokeLinecap="round"/>
        <path d="M35 70C35 70 42 63 50 63C58 63 65 70 65 70" stroke={color} strokeWidth="4" strokeLinecap="round"/>
        <circle cx="65" cy="75" r="12" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="3"/>
        <path d="M74 84L82 92" stroke={color} strokeWidth="4" strokeLinecap="round"/>
    </svg>
)

function Login({ onLogin }) {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false) // Toggle password visibility
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    // Clear old tokens on mount to prevent conflicts
    const { addToast } = useToasts()
    useEffect(() => {
        localStorage.removeItem('token')
        localStorage.removeItem('role')
        delete api.defaults.headers.common['Authorization']
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        
        try {
            // 1. Call custom login endpoint that returns token + role
            const res = await api.post('login/', { username, password })
            const token = res.data.token
            const role = res.data.role || 'PATHOLOGIST'

            // 2. Save Token + Role
            localStorage.setItem('token', token)
            localStorage.setItem('role', role)
            localStorage.setItem('user_id', res.data.user_id)
            localStorage.setItem('username', res.data.username)
            api.defaults.headers.common['Authorization'] = `Token ${token}` // Set for immediate use

            onLogin({ role, user: res.data.user })
            navigate('/')
            
        } catch (err) {
            console.error("Login Failed:", err)
            addToast('Login failed', { type: 'error' })
            // Show specific error from backend if available
            if (err.response && err.response.data && err.response.data.non_field_errors) {
                setError("Invalid Username or Password.")
            } else {
                setError("Server error. Please try again.")
            }
        } finally {
            setLoading(false)
        }
    }

    // --- STYLES ---
    const styles = {
        container: {
            display: 'flex', height: '100vh', width: '100vw', fontFamily: "'Inter', sans-serif", overflow: 'hidden'
        },
        brandSide: {
            flex: '1', background: `linear-gradient(135deg, var(--surface) 0%, #1e293b 100%)`,
            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
            color: 'var(--text)', padding: '40px', position: 'relative',
            backgroundImage: 'radial-gradient(var(--muted) 1px, transparent 1px)', backgroundSize: '30px 30px'
        },
        brandContent: { zIndex: 2, textAlign: 'center', maxWidth: '400px' },
        systemTitle: {
            fontSize: '2.5rem', fontWeight: '800', marginBottom: '10px', letterSpacing: '-1px',
            background: 'linear-gradient(to right, var(--primary), #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        },
        systemSubtitle: { fontSize: '1.1rem', color: 'var(--muted)', lineHeight: '1.6' },
        formSide: {
            flex: '1', background: 'var(--bg)', display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center', padding: '40px'
        },
        formCard: {
            width: '100%', maxWidth: '400px', background: 'var(--surface)', padding: '40px', borderRadius: '16px',
            boxShadow: 'var(--card-shadow)', border: `1px solid rgba(0, 0, 0, 0.06)`
        },
        header: { marginBottom: '30px', textAlign: 'center' },
        welcomeText: { fontSize: '1.5rem', fontWeight: '700', color: 'var(--text)', marginBottom: '8px' },
        subText: { fontSize: '0.9rem', color: 'var(--muted)' },
        inputGroup: { marginBottom: '20px', position: 'relative' },
        label: { display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text)' },
        input: {
            width: '100%', padding: '12px 16px', fontSize: '1rem', borderRadius: '8px',
            border: `1px solid rgba(0, 0, 0, 0.06)`, background: 'var(--surface)', outline: 'none',
            transition: 'all 0.2s', boxSizing: 'border-box', color: 'var(--text)'
        },
        button: {
            width: '100%', padding: '14px', fontSize: '1rem', fontWeight: '600', color: 'white',
            backgroundColor: 'var(--primary)', border: 'none', borderRadius: '8px', cursor: 'pointer',
            transition: 'background 0.2s', marginTop: '10px'
        },
        errorBox: {
            background: '#fef2f2', color: 'var(--danger)', padding: '10px', borderRadius: '6px',
            fontSize: '0.9rem', marginBottom: '20px', border: `1px solid #fecaca`, textAlign: 'center'
        },
        footer: { marginTop: '30px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--muted)' },
        eyeIcon: {
            position: 'absolute', right: '15px', top: '38px', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--muted)',
            background: 'none', border: 'none'
        }
    }

    return (
        <div style={styles.container}>
            {/* BRAND SIDE */}
            <div style={styles.brandSide}>
                <div style={styles.brandContent}>
                    <div style={{marginBottom: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px'}}>
                        <MinistryLogo size={80} />
                        <DacmsLogo size={120} color="#60a5fa" />
                    </div>
                    <h1 style={styles.systemTitle}>DACMS</h1>
                    <p style={styles.systemSubtitle}>
                        Digital Autopsy Case Management System<br/>
                        Ministry of Health - Republic of Kenya<br/>
                        Secure. Accurate. Forensic Standard.
                    </p>
                </div>
            </div>

            {/* FORM SIDE */}
            <div style={styles.formSide}>
                <div style={styles.formCard}>
                    <div style={styles.header}>
                        <div style={{display:'flex', justifyContent:'center', marginBottom:'15px'}}>
                            <MinistryLogo size={50} />
                        </div>
                        <h2 style={styles.welcomeText}>Welcome Back</h2>
                        <p style={styles.subText}>Please sign in to access case files.</p>
                    </div>

                    {error && <div style={styles.errorBox}>{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Username</label>
                            <input 
                                name="username"
                                type="text" 
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                style={styles.input}
                                placeholder="Enter your ID"
                                autoComplete="username"
                                required
                            />
                        </div>
                        
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Password</label>
                            <input 
                                name="password"
                                type={showPassword ? "text" : "password"} 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={styles.input}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                required
                            />
                            {/* Toggle Password Visibility */}
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={styles.eyeIcon}
                                title={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? "🙈" : "👁️"}
                            </button>
                        </div>

                        <button 
                            type="submit" 
                            style={styles.button} 
                            disabled={loading}
                        >
                            {loading ? 'Authenticating...' : 'Sign In ➜'}
                        </button>
                    </form>

                    <div style={styles.footer}>
                        Authorized Personnel Only • v1.0.0
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login