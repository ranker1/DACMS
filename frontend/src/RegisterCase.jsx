import { useState } from 'react'
import api from './api'
import { useToasts } from './Toasts'

function RegisterCase({ onCaseAdded, role, theme, organizationId }) {
    const { addToast } = useToasts()
    const [formData, setFormData] = useState({
        case_id: '',
        deceased_name: '',
        case_type: 'NORMAL', // Default to Clinical
        gender: 'U',
        age: '',
        date_of_arrival: '',
        ob_number: '',
        police_station: ''
    })

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        // Validation for Forensic Cases
        if (formData.case_type === 'FORENSIC') {
            if (!formData.ob_number || !formData.police_station) {
                addToast("For Forensic cases, OB Number and Police Station are required.", { type: 'error' })
                return
            }
        }

        try {
            const submitData = { ...formData }
            if (organizationId) {
                submitData.organization = organizationId
            }
            
            await api.post('cases/', submitData)
            addToast('Case Registered Successfully!', { type: 'success' })
            onCaseAdded() // Refresh list
            setFormData({
                case_id: '', deceased_name: '', case_type: 'NORMAL',
                gender: 'U', age: '', date_of_arrival: '', ob_number: '', police_station: ''
            })
        } catch (err) {
            console.error(err)
            addToast('Error registering case: ' + JSON.stringify(err.response?.data), { type: 'error' })
        }
    }

    // --- THEME STYLES ---
    const isDark = theme === 'dark'
    const colors = {
        text: isDark ? '#f1f5f9' : '#0f172a',
        textMuted: isDark ? '#94a3b8' : '#64748b',
        inputBg: isDark ? '#0f172a' : '#ffffff',
        inputBorder: isDark ? '#334155' : '#cbd5e1',
        primary: isDark ? '#60a5fa' : '#2563eb',
        success: '#22c55e'
    }

    const styles = {
        header: { marginTop: 0, marginBottom: '20px', color: colors.text, display: 'flex', alignItems: 'center', gap: '10px' },
        formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' },
        input: {
            width: '100%', padding: '12px', borderRadius: '6px', 
            border: `1px solid ${colors.inputBorder}`, 
            background: colors.inputBg, 
            color: colors.text,
            fontSize: '1rem', boxSizing: 'border-box', outline: 'none'
        },
        select: {
            width: '100%', padding: '12px', borderRadius: '6px', 
            border: `1px solid ${colors.inputBorder}`, 
            background: colors.inputBg, 
            color: colors.text,
            fontSize: '1rem', boxSizing: 'border-box', outline: 'none'
        },
        button: {
            width: '100%', padding: '12px', borderRadius: '6px', border: 'none',
            background: colors.success, color: 'white', fontWeight: 'bold', fontSize: '1rem',
            cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }
    }

    return (
        <div>
            <h3 style={styles.header}>📂 Register New Case</h3>
            <form onSubmit={handleSubmit}>
                <div style={styles.formGrid}>
                    <input 
                        name="case_id" 
                        placeholder="Case ID (e.g., CASE-001)" 
                        value={formData.case_id} 
                        onChange={handleChange} 
                        style={styles.input} 
                        required 
                    />
                    <input 
                        name="deceased_name" 
                        placeholder="Deceased Name" 
                        value={formData.deceased_name} 
                        onChange={handleChange} 
                        style={styles.input} 
                        required 
                    />
                    
                    <select name="case_type" value={formData.case_type} onChange={handleChange} style={styles.select}>
                        <option value="NORMAL">🔬 Clinical / Normal</option>
                        <option value="FORENSIC">🚓 Forensic / Police</option>
                    </select>

                    <div style={{display:'flex', gap:'10px'}}>
                        <select name="gender" value={formData.gender} onChange={handleChange} style={{...styles.select, flex: 2}}>
                            <option value="U">Unknown Gender</option>
                            <option value="M">Male</option>
                            <option value="F">Female</option>
                        </select>
                        <input 
                            name="age" 
                            type="number" 
                            placeholder="Age" 
                            value={formData.age} 
                            onChange={handleChange} 
                            style={{...styles.input, flex: 1}} 
                        />
                    </div>

                    <input 
                        name="date_of_arrival" 
                        type="datetime-local" 
                        placeholder="Date of Arrival" 
                        value={formData.date_of_arrival} 
                        onChange={handleChange} 
                        style={styles.input}
                    />

                    {/* CONDITIONAL RENDERING: Only show if FORENSIC */}
                    {formData.case_type === 'FORENSIC' && (
                        <>
                            <input 
                                name="ob_number" 
                                placeholder="OB Number (Required)" 
                                value={formData.ob_number} 
                                onChange={handleChange} 
                                style={{...styles.input, borderColor: '#f59e0b'}} // Orange border to highlight requirement
                                required
                            />
                            <input 
                                name="police_station" 
                                placeholder="Police Station (Required)" 
                                value={formData.police_station} 
                                onChange={handleChange} 
                                style={{...styles.input, borderColor: '#f59e0b'}} 
                                required
                            />
                        </>
                    )}
                </div>

                <button type="submit" style={styles.button}>+ Register Case</button>
            </form>
        </div>
    )
}

export default RegisterCase