import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from './api'
import BodyMap from './BodyMap'
import ConsentSection from './ConsentSection'
import ObserversSection from './ObserversSection'
import EvidencePhotos from './EvidencePhotos'
import ChainOfCustody from './ChainOfCustody'

function CaseDetails({ role }) {
    const { id } = useParams()
    const navigate = useNavigate()

    // --- 1. THEME ENGINE ---
    // Check localStorage or System Preference
    const getInitialTheme = () => {
        const saved = localStorage.getItem('theme')
        if (saved) return saved
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    const [theme, setTheme] = useState(getInitialTheme())

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light'
        setTheme(newTheme)
        localStorage.setItem('theme', newTheme)
    }

    // --- 2. PALETTES ---
    const lightColors = {
        bg: '#f8fafc',        // Page BG
        cardBg: '#ffffff',    // Card BG
        cardBorder: '#e2e8f0',
        textMain: '#0f172a',
        textMuted: '#64748b',
        inputBg: '#ffffff',
        inputBorder: '#cbd5e1',
        primary: '#2563eb',
        accent: '#f59e0b',
        danger: '#ef4444',
        success: '#10b981',
        mapContainer: '#f1f5f9'
    }

    const darkColors = {
        bg: '#0f172a',        // Navy/Slate BG
        cardBg: '#1e293b',    // Darker Slate Card
        cardBorder: '#334155',
        textMain: '#f1f5f9',  // White Text
        textMuted: '#94a3b8',
        inputBg: '#020617',   // Almost Black Input
        inputBorder: '#475569',
        primary: '#60a5fa',   // Lighter Blue for Dark Mode
        accent: '#fbbf24',
        danger: '#f87171',
        success: '#4ade80',
        mapContainer: '#e2e8f0' // Keep map container Light so black lines show!
    }

    const colors = theme === 'dark' ? darkColors : lightColors

    // --- 3. LOGIC & STATE ---
    if (!role) role = localStorage.getItem('role')
    const canEdit = role === 'PATHOLOGIST' || role === 'ADMIN'
    
    const [caseData, setCaseData] = useState(null)
    const [reportData, setReportData] = useState({
        height_cm: '', weight_kg: '', body_habitus: 'NORM',
        rigor_mortis: '', livor_mortis: '', decomposition_changes: '',
        clothing_description: '', medical_interventions: '', scars_tattoos: '',
        brain_weight: '', heart_weight: '', 
        lung_right_weight: '', lung_left_weight: '',
        liver_weight: '', spleen_weight: '', 
        kidney_right_weight: '', kidney_left_weight: '',
        evisceration_technique: 'Standard Y-incision and Rokitansky technique.',
        fluid_findings: '', neck_findings: '', 
        heart_findings: '', lung_findings: '', 
        liver_findings: '', stomach_contents: '', 
        genitalia_findings: '', endocrine_findings: '', 
        musculoskeletal_findings: '',
        specimens_collected: '', toxicology_results: '', lab_name: '',
        histology_results: '', microbiology_results: '', postmortem_imaging: '',
        evidence_disposition: '',
        cause_of_death: '', manner_of_death: 'UNDETERMINED', final_summary: '',
        pathologic_diagnoses: '', 
        organ_retention: 'All organs returned to body.'
    })
    
    const [cassettes, setCassettes] = useState([])
    const [newCassette, setNewCassette] = useState({ cassette_id: '', tissue_type: '' })
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('overview')
    const [pathologists, setPathologists] = useState([])
    const [assignment, setAssignment] = useState({ assignee_id: null, assignee_username: null })

    // --- FETCH DATA ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                const caseRes = await api.get(`cases/${id}/`)
                setCaseData(caseRes.data)

                try {
                    const [pathRes, assignRes] = await Promise.all([
                        api.get('pathologists/'),
                        api.get(`cases/${id}/assignment/`)
                    ])
                    setPathologists(pathRes.data)
                    setAssignment(assignRes.data)
                } catch (e) { }

                try {
                    const reportRes = await api.get(`reports/${id}/`)
                    setReportData(reportRes.data)
                    const cassRes = await api.get(`reports/${id}/cassettes/`)
                    setCassettes(cassRes.data)
                } catch {
                    console.log("No existing report found. Defaults will be used.")
                }
                setLoading(false)
            } catch (err) {
                console.error(err)
                setLoading(false)
            }
        }
        fetchData()
    }, [id])

    // --- HANDLERS ---
    const handleCaseChange = (e) => {
        const { name, value } = e.target
        setCaseData(prev => ({ ...prev, [name]: value }))
    }

    const saveCaseDetails = () => {
        if (!canEdit) return alert('Permission denied.')
        const sanitize = (data) => {
            const numericFields = ['age']; const dateFields = ['date_of_birth', 'time_of_death']
            const clean = { ...data }
            numericFields.forEach(f => { if (clean[f] === '') clean[f] = null })
            dateFields.forEach(f => { if (clean[f] === '') clean[f] = null })
            delete clean.qr_code_image; delete clean.date_of_arrival; delete clean.assigned_pathologist_name
            return clean
        }
        api.patch(`cases/${id}/`, sanitize(caseData))
            .then(() => alert('Details Updated'))
            .catch(err => alert('Error: ' + JSON.stringify(err.response?.data)))
    }

    const handleReportChange = (e) => {
        const { name, value } = e.target
        setReportData(prev => ({ ...prev, [name]: value }))
    }

    const saveReportData = () => {
        if (!canEdit) return alert('Permission denied.')
        const sanitize = (data) => {
            const numericFields = ['height_cm', 'weight_kg', 'bmi', 'brain_weight', 'heart_weight', 'lung_right_weight', 'lung_left_weight', 'liver_weight', 'spleen_weight', 'kidney_right_weight', 'kidney_left_weight']
            const clean = { ...data }
            numericFields.forEach(f => { if (clean[f] === '') clean[f] = null })
            return clean
        }
        const payload = sanitize(reportData)
        api.patch(`reports/${id}/`, payload)
            .then(() => alert('Draft Saved'))
            .catch((err) => {
                if(err.response?.status === 404) {
                    api.post('reports/', { ...payload, case_id: id }).then(() => alert('Report Created'))
                } else { alert('Error: ' + JSON.stringify(err.response?.data)) }
            })
    }

    const handleFinalizeCase = () => {
        if (!canEdit) return alert('Permission denied.')
        if (!window.confirm("Finalize Case and Lock Status?")) return;
        const sanitize = (data) => {
            const numericFields = ['height_cm', 'weight_kg', 'bmi', 'brain_weight', 'heart_weight', 'lung_right_weight', 'lung_left_weight', 'liver_weight', 'spleen_weight', 'kidney_right_weight', 'kidney_left_weight']
            const clean = { ...data }
            numericFields.forEach(f => { if (clean[f] === '') clean[f] = null })
            return clean
        }
        const payload = sanitize(reportData)
        api.patch(`reports/${id}/`, payload)
            .catch(err => { if (err.response?.status === 404) return api.post('reports/', { ...payload, case: id }); throw err })
            .then(() => api.patch(`cases/${id}/`, { status: 'COMPLETE' }))
            .then(res => {
                setCaseData(res.data)
                return api.get(`cases/${id}/pdf/`, { responseType: 'blob' })
            })
            .then(response => {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a'); link.href = url; link.setAttribute('download', `Report_${id}.pdf`);
                document.body.appendChild(link); link.click(); link.remove();
            })
            .catch(err => alert("Error: " + err.message))
            .finally(() => navigate('/'))
    }

    const addCassette = () => {
        if (!canEdit) return
        if(!newCassette.cassette_id) return
        api.post(`reports/${id}/cassettes/`, newCassette)
            .then(res => { setCassettes([...cassettes, res.data]); setNewCassette({cassette_id:'', tissue_type:''}) })
            .catch(() => alert("Save draft first."))
    }
    const deleteCassette = (cid) => {
        if (!canEdit) return
        api.delete(`reports/${id}/cassettes/${cid}/`).then(() => setCassettes(cassettes.filter(c => c.id !== cid)))
    }

    if (loading) return <div style={{padding:'50px', textAlign:'center', color: colors.textMuted}}>Loading Case File...</div>
    if (!caseData) return <div style={{padding:'50px', textAlign:'center', color: colors.danger}}>Case not found.</div>

    // --- STYLES GENERATOR ---
    const styles = {
        container: { 
            maxWidth: '1200px', margin: '0 auto', fontFamily: "'Inter', sans-serif", 
            color: colors.textMain, backgroundColor: colors.bg, minHeight: '100vh', padding: '30px',
            transition: 'background-color 0.3s, color 0.3s'
        },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: `1px solid ${colors.cardBorder}`, paddingBottom: '20px' },
        title: { margin: 0, fontSize: '2rem', fontWeight: '700', color: colors.textMain },
        badge: (status) => ({
            background: status === 'COMPLETE' ? (theme==='dark'?'rgba(34,197,94,0.2)':'#dcfce7') : (theme==='dark'?'rgba(59,130,246,0.2)':'#dbeafe'),
            color: status === 'COMPLETE' ? (theme==='dark'?'#4ade80':'#166534') : (theme==='dark'?'#60a5fa':'#1e40af'),
            padding: '6px 12px', borderRadius: '99px', fontSize: '0.85rem', fontWeight: '600', marginLeft: '15px', 
            border: `1px solid ${status === 'COMPLETE' ? colors.success : colors.primary}`
        }),
        tabsContainer: { display: 'flex', gap: '5px', borderBottom: `2px solid ${colors.cardBorder}`, marginBottom: '30px' },
        tab: (isActive) => ({
            padding: '12px 24px', cursor: 'pointer', borderRadius: '8px 8px 0 0',
            backgroundColor: isActive ? colors.cardBg : 'transparent',
            color: isActive ? colors.primary : colors.textMuted,
            fontWeight: isActive ? '600' : '500',
            border: `1px solid ${isActive ? colors.cardBorder : 'transparent'}`, 
            borderBottom: isActive ? `2px solid ${colors.cardBg}` : 'none',
            marginBottom: '-2px', transition: 'all 0.2s ease'
        }),
        card: { 
            background: colors.cardBg, padding: '25px', borderRadius: '12px', 
            border: `1px solid ${colors.cardBorder}`, marginBottom: '25px',
            boxShadow: theme==='dark' ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0,0,0,0.1)'
        },
        sectionHeader: { borderBottom: `2px solid ${colors.primary}`, paddingBottom: '10px', marginBottom: '25px', color: colors.textMain, fontSize: '1.5rem', fontWeight:'600' },
        subHeader: { marginTop: 0, marginBottom: '20px', color: colors.textMuted, fontSize: '1.1rem', fontWeight: '600', borderBottom: `1px solid ${colors.cardBorder}`, paddingBottom: '10px' },
        label: { display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem', color: colors.textMuted },
        input: { 
            padding: '12px', border: `1px solid ${colors.inputBorder}`, borderRadius: '6px', width: '100%', boxSizing: 'border-box',
            fontSize: '1rem', color: colors.textMain, backgroundColor: colors.inputBg, outline: 'none'
        },
        textarea: { 
            padding: '12px', border: `1px solid ${colors.inputBorder}`, borderRadius: '6px', width: '100%', boxSizing: 'border-box',
            fontSize: '1rem', color: colors.textMain, backgroundColor: colors.inputBg, minHeight: '100px', resize: 'vertical', fontFamily: 'inherit', outline: 'none'
        },
        btn: (variant='primary') => ({
            padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem',
            background: variant === 'primary' ? colors.primary : (variant === 'success' ? colors.success : colors.cardBorder),
            color: variant === 'secondary' ? colors.textMain : 'white', 
            transition: 'opacity 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        })
    }

    return (
        <div style={styles.container}>
            
            {/* HEADER */}
            <div style={styles.header}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <button onClick={() => navigate('/')} style={{...styles.btn('secondary'), border: `1px solid ${colors.cardBorder}`}}>← Back</button>
                    <div>
                        <div style={{display:'flex', alignItems:'center'}}>
                            <h1 style={styles.title}>{caseData.deceased_name}</h1>
                            <span style={styles.badge(caseData.status)}>{caseData.status}</span>
                        </div>
                        <div style={{color: colors.textMuted, fontSize:'0.9rem', marginTop:'5px'}}>Case ID: <strong style={{color: colors.primary}}>{caseData.case_id}</strong></div>
                    </div>
                </div>
                
                <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                    {/* THEME TOGGLE BUTTON */}
                    <button onClick={toggleTheme} style={{background:'none', border:`1px solid ${colors.cardBorder}`, borderRadius:'50%', width:'40px', height:'40px', cursor:'pointer', fontSize:'1.2rem', display:'flex', alignItems:'center', justifyContent:'center'}}>
                        {theme === 'light' ? '🌙' : '☀️'}
                    </button>

                    {caseData.qr_code_image && (
                        <div style={{ textAlign: 'center', background: 'white', padding: '5px', borderRadius: '8px', border: `1px solid ${colors.cardBorder}` }}>
                            <img src={caseData.qr_code_image.startsWith('http') ? caseData.qr_code_image : `http://127.0.0.1:8000${caseData.qr_code_image}`} alt="QR" style={{width: 60, height: 60}} />
                        </div>
                    )}
                </div>
            </div>

            {/* TABS */}
            <div style={styles.tabsContainer}>
                {['overview', 'external', 'internal', 'toxicology', 'extras'].map(tab => (
                    <div key={tab} onClick={() => setActiveTab(tab)} style={styles.tab(activeTab === tab)}>
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </div>
                ))}
            </div>

            <div style={{ minHeight: '600px' }}>
                
                {/* 1. OVERVIEW */}
                {activeTab === 'overview' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={styles.sectionHeader}>Case Overview</h2>
                            {canEdit && <button onClick={saveCaseDetails} style={styles.btn()}>💾 Save Details</button>}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                            <div style={styles.card}>
                                <h4 style={styles.subHeader}>👤 Subject Identity</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div><label style={styles.label}>Name</label><input style={{...styles.input, opacity: 0.7}} value={caseData.deceased_name} disabled /></div>
                                    <div><label style={styles.label}>Age</label><input style={{...styles.input, opacity: 0.7}} value={caseData.age || ''} disabled /></div>
                                    <div><label style={styles.label}>Gender</label><input style={{...styles.input, opacity: 0.7}} value={caseData.gender} disabled /></div>
                                    <div><label style={styles.label}>Race</label><input name="race" style={styles.input} value={caseData.race || ''} onChange={handleCaseChange} placeholder="e.g. African" disabled={!canEdit} /></div>
                                    <div style={{gridColumn: 'span 2'}}><label style={styles.label}>ID Method</label><input style={{...styles.input, opacity: 0.7}} value={caseData.identification_method} disabled /></div>
                                </div>
                            </div>

                            <div style={{ ...styles.card, borderLeft: `5px solid ${colors.accent}` }}>
                                <h4 style={{...styles.subHeader, color: colors.accent, borderColor: colors.cardBorder}}>💀 Death Circumstances</h4>
                                <div style={{ marginBottom: '15px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                                    <span style={{fontSize:'0.9rem', color: colors.textMuted}}>Assigned To: <strong style={{color: colors.textMain}}>{assignment.assignee_username || 'Unassigned'}</strong></span>
                                    {canEdit && (
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <select value={assignment.assignee_id || ''} onChange={e => setAssignment(prev => ({...prev, assignee_id: e.target.value}))} style={{...styles.input, padding:'6px', width:'auto'}}>
                                                <option value=''>-- Select --</option>
                                                {pathologists.map(p => <option key={p.id} value={p.id}>{p.username}</option>)}
                                            </select>
                                            <button onClick={async () => { /* Logic */ }} style={{...styles.btn('primary'), padding:'6px 12px', fontSize:'0.8rem'}}>Assign</button>
                                        </div>
                                    )}
                                </div>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={styles.label}>Time of Death</label>
                                    <input type="datetime-local" name="time_of_death" value={caseData.time_of_death ? caseData.time_of_death.slice(0,16) : ''} onChange={handleCaseChange} style={styles.input} disabled={!canEdit} />
                                </div>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={styles.label}>Place of Death</label>
                                    <input name="place_of_death" style={styles.input} value={caseData.place_of_death || ''} onChange={handleCaseChange} placeholder="e.g. City Hospital, Roadside..." disabled={!canEdit} />
                                </div>
                                <div>
                                    <label style={styles.label}>Circumstances / Police History</label>
                                    <textarea name="circumstances_of_death" style={styles.textarea} value={caseData.circumstances_of_death || ''} onChange={handleCaseChange} placeholder="Police Summary..." disabled={!canEdit} />
                                </div>
                            </div>
                        </div>

                        <div style={styles.card}>
                            <h4 style={styles.subHeader}>🏥 Medical History</h4>
                            <textarea name="medical_history" style={styles.textarea} value={caseData.medical_history || ''} onChange={handleCaseChange} placeholder="Known conditions..." disabled={!canEdit} />
                        </div>
                    </div>
                )}

                {/* 2. EXTERNAL */}
                {activeTab === 'external' && (
                    <div>
                        <h2 style={styles.sectionHeader}>External Examination</h2>
                        <div style={styles.card}>
                            <h4 style={styles.subHeader}>General Features</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                                <div><label style={styles.label}>Height (cm)</label><input name="height_cm" value={reportData.height_cm} onChange={handleReportChange} style={styles.input} disabled={!canEdit} /></div>
                                <div><label style={styles.label}>Weight (kg)</label><input name="weight_kg" value={reportData.weight_kg} onChange={handleReportChange} style={styles.input} disabled={!canEdit} /></div>
                                <div><label style={styles.label}>Body Habitus</label>
                                    <select name="body_habitus" value={reportData.body_habitus} onChange={handleReportChange} style={styles.input} disabled={!canEdit}>
                                        <option value="NORM">Normal</option><option value="THIN">Thin</option><option value="OBESE">Obese</option><option value="EMACIATED">Emaciated</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                                <div><label style={styles.label}>Rigor Mortis</label><input name="rigor_mortis" placeholder="e.g. Fully established..." value={reportData.rigor_mortis} onChange={handleReportChange} style={styles.input} disabled={!canEdit} /></div>
                                <div><label style={styles.label}>Livor Mortis</label><input name="livor_mortis" placeholder="e.g. Fixed posterior..." value={reportData.livor_mortis} onChange={handleReportChange} style={styles.input} disabled={!canEdit} /></div>
                            </div>
                            <div style={{ marginTop: '20px' }}>
                                <label style={styles.label}>Clothing Description</label>
                                <textarea name="clothing_description" placeholder="e.g. Blue jeans..." value={reportData.clothing_description} onChange={handleReportChange} style={styles.textarea} disabled={!canEdit} />
                            </div>
                            {canEdit && <div style={{marginTop:'20px', textAlign:'right'}}><button onClick={saveReportData} style={styles.btn('secondary')}>Update General Info</button></div>}
                        </div>
                        
                        <div style={{...styles.card, background: colors.mapContainer}}> 
                            <h4 style={{...styles.subHeader, color: '#333', borderBottom: '1px solid #cbd5e1'}}>Interactive Body Map</h4>
                            <BodyMap existingData={caseData.body_map_data} gender={caseData.gender} age={caseData.age} canEdit={canEdit} onSave={(txt, json) => {
                                api.patch(`cases/${id}/`, { external_injuries: txt, body_map_data: json }).then(() => setCaseData(prev => ({...prev, external_injuries: txt, body_map_data: json})))
                            }} />
                        </div>
                    </div>
                )}

                {/* 3. INTERNAL */}
                {activeTab === 'internal' && (
                    <div>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems: 'center', marginBottom: '20px'}}>
                            <h2 style={styles.sectionHeader}>Internal & Histology</h2>
                            {canEdit && <button onClick={saveReportData} style={styles.btn()}>💾 Save Draft</button>}
                        </div>
                        
                        <div style={styles.card}>
                            <h4 style={styles.subHeader}>Procedure & Fluids</h4>
                            <div style={{marginBottom:'20px'}}>
                                <label style={styles.label}>Evisceration Technique</label>
                                <textarea name="evisceration_technique" value={reportData.evisceration_technique} onChange={handleReportChange} style={{...styles.textarea, minHeight: '60px'}} disabled={!canEdit} />
                            </div>
                            <div>
                                <label style={styles.label}>Body Cavity Fluids</label>
                                <textarea name="fluid_findings" placeholder="Fluids..." value={reportData.fluid_findings} onChange={handleReportChange} style={styles.textarea} disabled={!canEdit} />
                            </div>
                        </div>

                        <div style={styles.card}>
                            <h4 style={styles.subHeader}>Organ Weights (grams)</h4>
                            <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'20px'}}>
                                <div><label style={styles.label}>Brain</label><input name="brain_weight" value={reportData.brain_weight} onChange={handleReportChange} style={styles.input} disabled={!canEdit} /></div>
                                <div><label style={styles.label}>Heart</label><input name="heart_weight" value={reportData.heart_weight} onChange={handleReportChange} style={styles.input} disabled={!canEdit} /></div>
                                <div><label style={styles.label}>Liver</label><input name="liver_weight" value={reportData.liver_weight} onChange={handleReportChange} style={styles.input} disabled={!canEdit} /></div>
                                <div><label style={styles.label}>Spleen</label><input name="spleen_weight" value={reportData.spleen_weight} onChange={handleReportChange} style={styles.input} disabled={!canEdit} /></div>
                                <div><label style={styles.label}>Rt. Lung</label><input name="lung_right_weight" value={reportData.lung_right_weight} onChange={handleReportChange} style={styles.input} disabled={!canEdit} /></div>
                                <div><label style={styles.label}>Lt. Lung</label><input name="lung_left_weight" value={reportData.lung_left_weight} onChange={handleReportChange} style={styles.input} disabled={!canEdit} /></div>
                                <div><label style={styles.label}>Rt. Kidney</label><input name="kidney_right_weight" value={reportData.kidney_right_weight} onChange={handleReportChange} style={styles.input} disabled={!canEdit} /></div>
                                <div><label style={styles.label}>Lt. Kidney</label><input name="kidney_left_weight" value={reportData.kidney_left_weight} onChange={handleReportChange} style={styles.input} disabled={!canEdit} /></div>
                            </div>
                        </div>

                        <div style={{ ...styles.card, borderLeft: `5px solid ${colors.primary}` }}>
                            <h4 style={{...styles.subHeader, color: colors.primary, borderColor: colors.cardBorder}}>🔬 Histology Cassette Log</h4>
                            <table style={{width: '100%', marginBottom: '20px', borderCollapse:'collapse', color: colors.textMain}}>
                                <thead>
                                    <tr style={{borderBottom:`1px solid ${colors.cardBorder}`}}>
                                        <th style={{textAlign:'left', padding:'12px', color: colors.textMuted}}>ID</th>
                                        <th style={{textAlign:'left', padding:'12px', color: colors.textMuted}}>Tissue Type</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cassettes.map(c => <tr key={c.id} style={{borderBottom:`1px solid ${colors.cardBorder}`}}>
                                        <td style={{fontWeight:'bold', padding:'12px', color: colors.textMain}}>{c.cassette_id}</td>
                                        <td style={{padding:'12px', color: colors.textMuted}}>{c.tissue_type}</td>
                                        <td style={{textAlign:'right', padding:'12px'}}>{canEdit && <button onClick={()=>deleteCassette(c.id)} style={{color: colors.danger, border:'none', cursor:'pointer', fontWeight:'bold', fontSize:'1.2rem', background:'none'}}>×</button>}</td>
                                    </tr>)}
                                </tbody>
                            </table>
                            {canEdit && (
                                <div style={{display:'flex', gap:'10px', alignItems:'flex-end', background: colors.inputBg, padding:'15px', borderRadius:'8px', border: `1px solid ${colors.cardBorder}`}}>
                                    <div><label style={styles.label}>ID (e.g. A1)</label><input value={newCassette.cassette_id} onChange={e=>setNewCassette({...newCassette, cassette_id:e.target.value})} style={{...styles.input, width:'100px'}} /></div>
                                    <div style={{flex:1}}><label style={styles.label}>Tissue Site</label><input value={newCassette.tissue_type} onChange={e=>setNewCassette({...newCassette, tissue_type:e.target.value})} style={styles.input} /></div>
                                    <button onClick={addCassette} style={styles.btn('primary')}>Add Block</button>
                                </div>
                            )}
                        </div>

                        <div style={styles.card}>
                             <h4 style={{...styles.subHeader, marginBottom:'20px'}}>System Descriptions</h4>
                             <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'30px'}}>
                                 <div><label style={styles.label}>Cardiovascular System</label><textarea name="heart_findings" value={reportData.heart_findings} onChange={handleReportChange} style={styles.textarea} disabled={!canEdit} /></div>
                                 <div><label style={styles.label}>Respiratory System</label><textarea name="lung_findings" value={reportData.lung_findings} onChange={handleReportChange} style={styles.textarea} disabled={!canEdit} /></div>
                                 <div><label style={styles.label}>Hepatobiliary System</label><textarea name="liver_findings" value={reportData.liver_findings} onChange={handleReportChange} style={styles.textarea} disabled={!canEdit} /></div>
                                 <div><label style={styles.label}>Digestive System</label><textarea name="stomach_contents" value={reportData.stomach_contents} onChange={handleReportChange} style={styles.textarea} disabled={!canEdit} /></div>
                                 <div><label style={styles.label}>Genitourinary System</label><textarea name="genitalia_findings" value={reportData.genitalia_findings} onChange={handleReportChange} style={styles.textarea} disabled={!canEdit} /></div>
                                 <div><label style={styles.label}>Neck & CNS</label><textarea name="neck_findings" value={reportData.neck_findings} onChange={handleReportChange} style={styles.textarea} disabled={!canEdit} /></div>
                             </div>
                        </div>
                    </div>
                )}

                {/* 4. TOXICOLOGY & CONCLUSION */}
                {activeTab === 'toxicology' && (
                    <div>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '20px'}}>
                            <h2 style={styles.sectionHeader}>Conclusion</h2>
                            {canEdit && <button onClick={handleFinalizeCase} style={styles.btn('success')}>✅ Finalize Case & Generate PDF</button>}
                        </div>
                        
                        <div style={styles.card}>
                            <h4 style={{...styles.subHeader, marginBottom:'20px'}}>Labs & Toxicology</h4>
                            <div style={{marginBottom:'20px'}}>
                                <label style={styles.label}>Specimens Collected</label>
                                <input name="specimens_collected" placeholder="e.g. Heart Blood..." value={reportData.specimens_collected} onChange={handleReportChange} style={styles.input} disabled={!canEdit} />
                            </div>
                            <div style={{marginBottom:'20px'}}>
                                <label style={styles.label}>Toxicology Results</label>
                                <textarea name="toxicology_results" placeholder="Results..." value={reportData.toxicology_results} onChange={handleReportChange} style={styles.textarea} disabled={!canEdit} />
                            </div>
                            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'30px'}}>
                                <div><label style={styles.label}>Microbiology</label><textarea name="microbiology_results" value={reportData.microbiology_results} onChange={handleReportChange} style={styles.textarea} disabled={!canEdit} /></div>
                                <div><label style={styles.label}>Histology Results</label><textarea name="histology_results" value={reportData.histology_results} onChange={handleReportChange} style={styles.textarea} disabled={!canEdit} /></div>
                            </div>
                        </div>

                        <div style={{ ...styles.card, borderLeft: `5px solid ${colors.danger}` }}>
                            <h4 style={{...styles.subHeader, color: colors.danger, borderColor: colors.cardBorder}}>📋 Pathologic Diagnoses (FAD)</h4>
                            <label style={styles.label}>List findings one per line</label>
                            <textarea name="pathologic_diagnoses" value={reportData.pathologic_diagnoses} onChange={handleReportChange} style={{...styles.textarea, height:'200px', fontFamily:'monospace', fontSize:'0.95rem'}} disabled={!canEdit} />
                        </div>

                        <div style={{...styles.card, borderLeft: `5px solid ${colors.primary}`}}>
                             <h4 style={{...styles.subHeader, color: colors.primary, borderColor: colors.cardBorder}}>Final Opinion</h4>
                             <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:'30px', marginBottom:'25px'}}>
                                 <div>
                                     <label style={styles.label}>Manner of Death</label>
                                     <select name="manner_of_death" value={reportData.manner_of_death} onChange={handleReportChange} style={styles.input} disabled={!canEdit}>
                                        <option value="UNDETERMINED">Undetermined</option><option value="NATURAL">Natural</option><option value="HOMICIDE">Homicide</option><option value="ACCIDENT">Accident</option><option value="SUICIDE">Suicide</option>
                                     </select>
                                 </div>
                                 <div>
                                     <label style={styles.label}>Immediate Cause of Death</label>
                                     <input name="cause_of_death" value={reportData.cause_of_death} onChange={handleReportChange} style={styles.input} disabled={!canEdit} />
                                 </div>
                             </div>
                             <div style={{marginBottom:'25px'}}>
                                <label style={styles.label}>Narrative Summary / Opinion</label>
                                <textarea name="final_summary" value={reportData.final_summary} onChange={handleReportChange} style={{...styles.textarea, height:'200px'}} disabled={!canEdit} />
                             </div>
                             <div>
                                <label style={styles.label}>Evidence Disposition / Chain of Custody</label>
                                <input name="evidence_disposition" value={reportData.evidence_disposition} onChange={handleReportChange} style={styles.input} disabled={!canEdit} />
                             </div>
                        </div>
                    </div>
                )}

                {/* EXTRAS */}
                {activeTab === 'extras' && (
                    <div>
                        <h2 style={styles.sectionHeader}>Extras</h2>
                        <div style={{display:'grid', gap:'25px'}}>
                            <div style={styles.card}>
                                <h4 style={styles.subHeader}>Consent & Authorization</h4>
                                {caseData.case_type === 'NORMAL' ? (
                                    <ConsentSection caseId={id} canEdit={canEdit} colors={colors} />
                                ) : (
                                    <div style={{color: colors.textMuted, fontStyle:'italic', padding:'10px', background: colors.bg, borderRadius:'6px'}}>
                                        ℹ️ Consent is not required for Forensic (Police) cases.
                                    </div>
                                )}
                            </div>
                            
                            <div style={styles.card}>
                                <ObserversSection caseId={id} canEdit={canEdit} colors={colors} />
                            </div>
                            
                            <div style={styles.card}>
                                <EvidencePhotos caseId={id} canEdit={canEdit} colors={colors} />
                            </div>
                            
                            <div style={styles.card}>
                                <ChainOfCustody caseId={id} canEdit={canEdit} colors={colors} />
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}

export default CaseDetails