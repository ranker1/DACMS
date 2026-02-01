import { useState, useEffect } from 'react'
import api from './api'
import { Link } from 'react-router-dom'
import RegisterCase from './RegisterCase'
import RegisterUser from './RegisterUser'

function Dashboard({ role, onLogout }) {
    const [cases, setCases] = useState([])
    
    // --- THEME STATE ---
    const getInitialTheme = () => localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    const [theme, setTheme] = useState(getInitialTheme())

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light'
        setTheme(newTheme)
        localStorage.setItem('theme', newTheme)
    }

    const fetchCases = () => {
        api.get('cases/')
            .then(response => setCases(response.data))
            .catch(error => console.error('Error:', error))
    }

    useEffect(() => {
        fetchCases()
    }, [])

    const downloadPDF = async (caseId, deceasedName) => {
        try {
            const response = await api.get(`cases/${caseId}/download_pdf/`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Report_${deceasedName}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error("Download failed:", error);
            alert("Failed to download PDF.");
        }
    };

    // --- STYLES ---
    const isDark = theme === 'dark'
    const colors = {
        bg: isDark ? '#0f172a' : '#f8fafc',
        cardBg: isDark ? '#1e293b' : '#ffffff',
        cardBorder: isDark ? '#334155' : '#e2e8f0',
        textMain: isDark ? '#f1f5f9' : '#0f172a',
        textMuted: isDark ? '#94a3b8' : '#64748b',
        primary: isDark ? '#60a5fa' : '#2563eb',
        accent: isDark ? '#fbbf24' : '#f59e0b',
        danger: isDark ? '#f87171' : '#ef4444',
        success: isDark ? '#4ade80' : '#10b981'
    }

    const styles = {
        container: { 
            maxWidth: '1200px', margin: '0 auto', fontFamily: "'Inter', sans-serif", 
            color: colors.textMain, backgroundColor: colors.bg, minHeight: '100vh', padding: '30px'
        },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: `1px solid ${colors.cardBorder}`, paddingBottom: '20px' },
        title: { margin: 0, fontSize: '2rem', fontWeight: '700', color: colors.textMain },
        subtitle: { margin: 0, color: colors.textMuted, fontSize: '0.9rem', marginTop: '5px' },
        
        btn: (variant='primary') => ({
            padding: '10px 18px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem',
            background: variant === 'primary' ? colors.primary : (variant === 'danger' ? colors.danger : 'transparent'),
            color: variant === 'ghost' ? colors.textMain : 'white', 
            border: variant === 'ghost' ? `1px solid ${colors.cardBorder}` : 'none',
            transition: 'opacity 0.2s', display: 'inline-flex', alignItems: 'center', gap: '8px'
        }),

        grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '25px' },
        
        card: { 
            background: colors.cardBg, padding: '25px', borderRadius: '12px', 
            border: `1px solid ${colors.cardBorder}`, 
            boxShadow: isDark ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s ease', cursor: 'default'
        },
        cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' },
        caseTitle: { margin: '0 0 5px 0', fontSize: '1.2rem', color: colors.primary, textDecoration: 'none', fontWeight: '600' },
        caseMeta: { fontSize: '0.9rem', color: colors.textMuted, lineHeight: '1.6' },
        
        badge: (status) => ({
            background: status === 'COMPLETE' ? (isDark?'rgba(34,197,94,0.15)':'#dcfce7') : (isDark?'rgba(251,191,36,0.15)':'#fef3c7'),
            color: status === 'COMPLETE' ? colors.success : colors.accent,
            padding: '4px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase',
            border: `1px solid ${status === 'COMPLETE' ? colors.success : colors.accent}`, display: 'inline-block', marginTop:'5px'
        }),

        sectionHeader: { fontSize: '1.5rem', fontWeight: '600', marginBottom: '20px', color: colors.textMain, borderBottom: `2px solid ${colors.primary}`, paddingBottom: '10px', display: 'inline-block' }
    }

    return (
        <div style={styles.container}>
            {/* HEADER */}
            <div style={styles.header}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{fontSize:'2.5rem'}}>🏥</div>
                    <div>
                        <h1 style={styles.title}>DACMS Dashboard</h1>
                        <p style={styles.subtitle}>Digital Autopsy Case Management System • Logged in as <strong style={{color: colors.primary}}>{role}</strong></p>
                    </div>
                </div>
                <div style={{display:'flex', gap:'12px'}}>
                    <button style={styles.btn('ghost')} onClick={toggleTheme}>{isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}</button>
                    <button style={styles.btn('danger')} onClick={onLogout}>Logout ➜</button>
                </div>
            </div>

            {/* ACTION ZONE */}
            <div style={{marginBottom: '40px'}}>
                {role === 'ADMIN' && (
                    <div style={{marginBottom: '30px', padding: '20px', border: `1px dashed ${colors.cardBorder}`, borderRadius: '12px'}}>
                        <h3 style={{marginTop:0, color: colors.textMain}}>Admin Tools</h3>
                        <RegisterUser />
                    </div>
                )}
                
                {/* PASS THEME PROP HERE */}
                {(role === 'PATHOLOGIST' || role === 'ADMIN') && (
                    <div style={{background: colors.cardBg, padding: '25px', borderRadius: '12px', border: `1px solid ${colors.cardBorder}`, boxShadow: styles.card.boxShadow}}>
                        <RegisterCase onCaseAdded={fetchCases} role={role} theme={theme} />
                    </div>
                )}
            </div>

            {/* CASE LIST */}
            <div>
                <h2 style={styles.sectionHeader}>Recent Cases</h2>
                
                {cases.length === 0 ? (
                    <div style={{textAlign:'center', padding:'50px', color: colors.textMuted, border: `2px dashed ${colors.cardBorder}`, borderRadius:'12px'}}>
                        No cases found in the system.
                    </div>
                ) : (
                    <div style={styles.grid}>
                        {cases.map(c => (
                            <div key={c.id} style={styles.card}>
                                <div style={styles.cardHeader}>
                                    <div>
                                        <Link to={`/cases/${c.id}`} style={styles.caseTitle}>
                                            {c.deceased_name} ↗
                                        </Link>
                                        <div style={styles.caseMeta}>
                                            ID: <strong style={{color: colors.textMain}}>{c.case_id}</strong><br/>
                                            Type: {c.case_type}<br/>
                                            <span style={styles.badge(c.status)}>{c.status}</span>
                                        </div>
                                    </div>
                                    {c.qr_code_image && (
                                        <div style={{background:'white', padding:'5px', borderRadius:'6px', border:'1px solid #ddd'}}>
                                            <img 
                                                src={c.qr_code_image.startsWith('http') ? c.qr_code_image : `http://127.0.0.1:8000${c.qr_code_image}`} 
                                                alt="QR" style={{width: '60px', height: '60px', display:'block'}} 
                                            />
                                        </div>
                                    )}
                                </div>

                                {(role === 'PATHOLOGIST' || role === 'ADMIN') && (
                                    <div style={{borderTop: `1px solid ${colors.cardBorder}`, paddingTop: '15px', marginTop: '10px'}}>
                                        <button 
                                            onClick={() => downloadPDF(c.id, c.deceased_name)}
                                            style={{...styles.btn('ghost'), fontSize:'0.8rem', padding:'6px 12px'}}
                                        >
                                            📄 Quick PDF Download
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Dashboard