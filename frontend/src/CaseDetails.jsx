import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import BodyMap from './BodyMap'

function CaseDetails() {
    const { id } = useParams()
    const navigate = useNavigate()
    
    // 1. CASE DATA (Header, Body Map, Status)
    const [caseData, setCaseData] = useState(null)
    
    // 2. REPORT DATA (Internal Exam, Tox, Conclusion)
    const [reportData, setReportData] = useState({
        // External Specifics
        height_cm: '', weight_kg: '', body_habitus: 'NORM',
        rigor_mortis: '', livor_mortis: '', decomposition_changes: '',
        clothing_description: '', medical_interventions: '', scars_tattoos: '',

        // Internal - Weights
        brain_weight: '', heart_weight: '', 
        lung_right_weight: '', lung_left_weight: '',
        liver_weight: '', spleen_weight: '', 
        kidney_right_weight: '', kidney_left_weight: '',
        
        // Internal - Systems
        evisceration_technique: 'Standard Y-incision and Rokitansky technique.',
        fluid_findings: '', neck_findings: '', 
        heart_findings: '', lung_findings: '', 
        liver_findings: '', stomach_contents: '', 
        genitalia_findings: '', endocrine_findings: '', 
        musculoskeletal_findings: '',

        // Tox & Conclusion
        specimens_collected: '', toxicology_results: '', lab_name: '',
        histology_results: '', microbiology_results: '', postmortem_imaging: '',
        evidence_disposition: '',
        cause_of_death: '', manner_of_death: 'UNDETERMINED', final_summary: ''
    })

    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('overview')

    // --- FETCH DATA ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                // A. Fetch Case Basics
                const caseRes = await axios.get(`http://127.0.0.1:8000/api/cases/${id}/`)
                setCaseData(caseRes.data)

                // B. Fetch Detailed Report (if it exists)
                try {
                    const reportRes = await axios.get(`http://127.0.0.1:8000/api/reports/${id}/`)
                    setReportData(reportRes.data)
                } catch (err) {
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
    const handleReportChange = (e) => {
        const { name, value } = e.target
        setReportData(prev => ({ ...prev, [name]: value }))
    }

    const saveReportData = () => {
        // Try PATCH (Update), if 404 then POST (Create)
        axios.patch(`http://127.0.0.1:8000/api/reports/${id}/`, reportData)
            .then(() => alert('Report Details Saved Successfully!'))
            .catch((err) => {
                if(err.response && err.response.status === 404) {
                    axios.post('http://127.0.0.1:8000/api/reports/', { ...reportData, case: id })
                        .then(() => alert('Report Created & Saved!'))
                        .catch(e => alert('Creation Failed: ' + e.message))
                } else {
                    alert('Save Failed: ' + err.message)
                }
            })
    }

    if (loading) return <div>Loading Case File...</div>
    if (!caseData) return <div>Case not found.</div>

    // --- STYLES ---
    const tabStyle = (name) => {
        const isActive = activeTab === name
        return {
            padding: '12px 24px', cursor: 'pointer', borderRadius: '8px 8px 0 0',
            backgroundColor: isActive ? '#007bff' : '#e9ecef',
            color: isActive ? '#ffffff' : '#000000',
            fontWeight: 'bold', border: '1px solid #dee2e6',
            borderBottom: isActive ? '1px solid transparent' : '1px solid #dee2e6',
            marginBottom: '-1px', marginRight: '5px', userSelect: 'none'
        }
    }
    const inputStyle = { padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%', boxSizing: 'border-box' }
    const areaStyle = { padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%', minHeight: '80px', fontFamily: 'inherit', boxSizing: 'border-box' }
    const sectionHeader = { borderBottom: '2px solid #007bff', paddingBottom: '5px', marginBottom: '15px', color: '#333', marginTop: '0' }
    const gridBox = { background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #e9ecef', marginBottom: '20px' }

    return (
        <div style={{ padding: '20px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            
            {/* TOP HEADER */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button onClick={() => navigate('/')} style={{ cursor: 'pointer', padding: '8px 15px', border: '1px solid #ccc', background: 'white', color: 'black', borderRadius: '4px' }}>
                        ← Back
                    </button>
                    <div>
                        <h1 style={{ margin: 0 }}>{caseData.deceased_name}</h1>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '5px' }}>
                            <span style={{ 
                                background: caseData.case_type === 'FORENSIC' ? '#dc3545' : '#28a745', 
                                color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8em' 
                            }}>
                                {caseData.case_type}
                            </span>
                            <span style={{ color: '#666' }}>Case ID: {caseData.case_id}</span>
                        </div>
                    </div>
                </div>

                {/* QR CODE DISPLAY */}
                {caseData.qr_code_image && (
                    <div style={{ textAlign: 'center' }}>
                        <img 
                            src={caseData.qr_code_image.startsWith('http') 
                                ? caseData.qr_code_image 
                                : `http://127.0.0.1:8000${caseData.qr_code_image}`
                            } 
                            alt="QR Code" 
                            style={{ width: '80px', height: '80px', border: '1px solid #ddd' }}
                        />
                        <div style={{ fontSize: '10px', color: '#666' }}>SCAN TO VERIFY</div>
                    </div>
                )}
            </div>

            {/* TABS NAVIGATION */}
            <div style={{ display: 'flex', borderBottom: '1px solid #ddd', marginBottom: '20px' }}>
                <div onClick={() => setActiveTab('overview')} style={tabStyle('overview')}>Overview</div>
                <div onClick={() => setActiveTab('external')} style={tabStyle('external')}>External Exam</div>
                <div onClick={() => setActiveTab('internal')} style={tabStyle('internal')}>Internal (Organs)</div>
                <div onClick={() => setActiveTab('toxicology')} style={tabStyle('toxicology')}>Toxicology & Conclusion</div>
            </div>

            {/* CONTENT BOX */}
            <div style={{ background: 'white', color: 'black', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', minHeight: '400px' }}>
                
                {/* 1. OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <h3>📄 Case Identity</h3>
                            <p><strong>Case ID:</strong> {caseData.case_id}</p>
                            <p><strong>Status:</strong> {caseData.status}</p>
                            <p><strong>Arrival Date:</strong> {new Date(caseData.date_of_arrival).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <h3>👤 Subject Details</h3>
                            <p><strong>Age:</strong> {caseData.age || 'Unknown'}</p>
                            <p><strong>Gender:</strong> {caseData.gender}</p>
                            <p><strong>Race:</strong> {caseData.race || 'N/A'}</p>
                            <p><strong>Method of ID:</strong> {caseData.identification_method}</p>
                        </div>
                        {caseData.case_type === 'FORENSIC' && (
                            <div style={{ gridColumn: '1 / -1', background: '#fff3cd', color: '#856404', padding: '15px', borderRadius: '4px' }}>
                                <h3 style={{ margin: '0 0 10px 0' }}>🚓 Police Information</h3>
                                <p><strong>OB Number:</strong> {caseData.ob_number}</p>
                                <p><strong>Station:</strong> {caseData.police_station}</p>
                                <p><strong>Circumstances:</strong> {caseData.circumstances_of_death || 'None provided'}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* 2. EXTERNAL EXAM (BODY MAP + GENERAL) */}
                {activeTab === 'external' && (
                    <div>
                        <h2 style={sectionHeader}>External Examination</h2>
                        
                        {/* General External Form */}
                        <div style={gridBox}>
                            <h4>General Features</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                <input name="height_cm" placeholder="Height (cm)" value={reportData.height_cm} onChange={handleReportChange} style={inputStyle} />
                                <input name="weight_kg" placeholder="Weight (kg)" value={reportData.weight_kg} onChange={handleReportChange} style={inputStyle} />
                                <select name="body_habitus" value={reportData.body_habitus} onChange={handleReportChange} style={inputStyle}>
                                    <option value="NORM">Normal</option>
                                    <option value="THIN">Thin</option>
                                    <option value="OBESE">Obese</option>
                                    <option value="EMACIATED">Emaciated</option>
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <input name="rigor_mortis" placeholder="Rigor Mortis" value={reportData.rigor_mortis} onChange={handleReportChange} style={inputStyle} />
                                <input name="livor_mortis" placeholder="Livor Mortis" value={reportData.livor_mortis} onChange={handleReportChange} style={inputStyle} />
                            </div>
                            <div style={{ marginTop: '10px' }}>
                                <textarea name="clothing_description" placeholder="Clothing Description..." value={reportData.clothing_description} onChange={handleReportChange} style={{...areaStyle, minHeight: '60px'}} />
                            </div>
                            <button onClick={saveReportData} style={{ marginTop: '10px', padding: '8px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Update General Details</button>
                        </div>

                        {/* Interactive Map */}
                        <BodyMap 
                            existingData={caseData.body_map_data}
                            gender={caseData.gender}
                            age={caseData.age}
                            onSave={(textReport, jsonMarkers) => {
                                axios.patch(`http://127.0.0.1:8000/api/cases/${id}/`, { 
                                    external_injuries: textReport,
                                    body_map_data: jsonMarkers
                                })
                                .then(() => {
                                    setCaseData(prev => ({...prev, external_injuries: textReport, body_map_data: jsonMarkers}))
                                    const autoDownload = localStorage.getItem('autoDownloadPDF') === 'true';
                                    if (autoDownload || window.confirm("Map Saved! Download PDF?")) {
                                        const link = document.createElement('a');
                                        link.href = `http://127.0.0.1:8000/api/cases/${id}/pdf/`;
                                        link.setAttribute('download', 'report.pdf');
                                        document.body.appendChild(link);
                                        link.click();
                                        link.remove();
                                    }
                                })
                                .catch(err => alert('Failed to save: ' + err.message))
                            }} 
                        />
                    </div>
                )}

                {/* 3. INTERNAL EXAM (DETAILED FORM) */}
                {activeTab === 'internal' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={sectionHeader}>Internal Examination</h2>
                            <button onClick={saveReportData} style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>💾 Save Internal Data</button>
                        </div>

                        {/* Procedure */}
                        <div style={gridBox}>
                            <h4>Procedure & Fluids</h4>
                            <textarea name="evisceration_technique" placeholder="Evisceration Technique..." value={reportData.evisceration_technique} onChange={handleReportChange} style={{...areaStyle, marginBottom: '10px'}} />
                            <textarea name="fluid_findings" placeholder="Body Cavity Fluids (Ascites, Effusions)..." value={reportData.fluid_findings} onChange={handleReportChange} style={areaStyle} />
                        </div>

                        {/* Organ Weights */}
                        <div style={gridBox}>
                            <h4>Organ Weights (grams)</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
                                <input name="brain_weight" placeholder="Brain" value={reportData.brain_weight} onChange={handleReportChange} style={inputStyle} />
                                <input name="heart_weight" placeholder="Heart" value={reportData.heart_weight} onChange={handleReportChange} style={inputStyle} />
                                <input name="liver_weight" placeholder="Liver" value={reportData.liver_weight} onChange={handleReportChange} style={inputStyle} />
                                <input name="spleen_weight" placeholder="Spleen" value={reportData.spleen_weight} onChange={handleReportChange} style={inputStyle} />
                                <input name="lung_right_weight" placeholder="Rt. Lung" value={reportData.lung_right_weight} onChange={handleReportChange} style={inputStyle} />
                                <input name="lung_left_weight" placeholder="Lt. Lung" value={reportData.lung_left_weight} onChange={handleReportChange} style={inputStyle} />
                                <input name="kidney_right_weight" placeholder="Rt. Kidney" value={reportData.kidney_right_weight} onChange={handleReportChange} style={inputStyle} />
                                <input name="kidney_left_weight" placeholder="Lt. Kidney" value={reportData.kidney_left_weight} onChange={handleReportChange} style={inputStyle} />
                            </div>
                        </div>

                        {/* Systems */}
                        <div style={gridBox}>
                            <h4>System Descriptions</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <textarea name="heart_findings" placeholder="Cardiovascular System..." value={reportData.heart_findings} onChange={handleReportChange} style={areaStyle} />
                                <textarea name="lung_findings" placeholder="Respiratory System..." value={reportData.lung_findings} onChange={handleReportChange} style={areaStyle} />
                                <textarea name="liver_findings" placeholder="Hepatobiliary System..." value={reportData.liver_findings} onChange={handleReportChange} style={areaStyle} />
                                <textarea name="stomach_contents" placeholder="Digestive / Stomach Contents..." value={reportData.stomach_contents} onChange={handleReportChange} style={areaStyle} />
                                <textarea name="genitalia_findings" placeholder="Genitourinary..." value={reportData.genitalia_findings} onChange={handleReportChange} style={areaStyle} />
                                <textarea name="neck_findings" placeholder="Neck & CNS..." value={reportData.neck_findings} onChange={handleReportChange} style={areaStyle} />
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. TOXICOLOGY & CONCLUSION */}
                {activeTab === 'toxicology' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={sectionHeader}>Toxicology & Final Conclusion</h2>
                            <button onClick={saveReportData} style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>💾 Save Final Report</button>
                        </div>

                        {/* Tox */}
                        <div style={gridBox}>
                            <h4>Toxicology & Labs</h4>
                            <div style={{ marginBottom: '10px' }}>
                                <label><strong>Specimens Collected:</strong></label>
                                <input name="specimens_collected" placeholder="e.g. Blood, Vitreous, Urine..." value={reportData.specimens_collected} onChange={handleReportChange} style={inputStyle} />
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                                <label><strong>Toxicology Results:</strong></label>
                                <textarea name="toxicology_results" placeholder="Results..." value={reportData.toxicology_results} onChange={handleReportChange} style={{...areaStyle, height: '100px'}} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <textarea name="microbiology_results" placeholder="Microbiology..." value={reportData.microbiology_results} onChange={handleReportChange} style={areaStyle} />
                                <textarea name="histology_results" placeholder="Histology..." value={reportData.histology_results} onChange={handleReportChange} style={areaStyle} />
                            </div>
                        </div>

                        {/* Conclusion */}
                        <div style={{...gridBox, borderLeft: '5px solid #007bff'}}>
                            <h4>Opinion & Conclusion</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', marginBottom: '10px' }}>
                                <div>
                                    <label><strong>Manner of Death:</strong></label>
                                    <select name="manner_of_death" value={reportData.manner_of_death} onChange={handleReportChange} style={inputStyle}>
                                        <option value="UNDETERMINED">Undetermined</option>
                                        <option value="NATURAL">Natural</option>
                                        <option value="ACCIDENT">Accident</option>
                                        <option value="SUICIDE">Suicide</option>
                                        <option value="HOMICIDE">Homicide</option>
                                    </select>
                                </div>
                                <div>
                                    <label><strong>Cause of Death:</strong></label>
                                    <input name="cause_of_death" placeholder="Immediate Cause..." value={reportData.cause_of_death} onChange={handleReportChange} style={inputStyle} />
                                </div>
                            </div>
                            <div>
                                <label><strong>Final Pathologist Summary:</strong></label>
                                <textarea name="final_summary" placeholder="Summary of findings and opinion..." value={reportData.final_summary} onChange={handleReportChange} style={{...areaStyle, height: '150px'}} />
                            </div>
                            <div style={{ marginTop: '10px' }}>
                                <label><strong>Evidence Disposition:</strong></label>
                                <input name="evidence_disposition" placeholder="Chain of custody notes..." value={reportData.evidence_disposition} onChange={handleReportChange} style={inputStyle} />
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}

export default CaseDetails