import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import BodyMap from './BodyMap'

function CaseDetails() {
    const { id } = useParams()
    const navigate = useNavigate()
    
    // 1. CASE DATA (Header, Demographics, History)
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
        cause_of_death: '', manner_of_death: 'UNDETERMINED', final_summary: '',
        
        // Pathologist Extras
        pathologic_diagnoses: '', 
        organ_retention: 'All organs returned to body.'
    })
    
    // Histology Cassettes
    const [cassettes, setCassettes] = useState([])
    const [newCassette, setNewCassette] = useState({ cassette_id: '', tissue_type: '' })

    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('overview')

    // --- FETCH DATA ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                // A. Fetch Case Basics
                const caseRes = await axios.get(`http://127.0.0.1:8000/api/cases/${id}/`)
                setCaseData(caseRes.data)

                // B. Fetch Detailed Report & Cassettes
                try {
                    const reportRes = await axios.get(`http://127.0.0.1:8000/api/reports/${id}/`)
                    setReportData(reportRes.data)
                    const cassRes = await axios.get(`http://127.0.0.1:8000/api/reports/${id}/cassettes/`)
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
    
    // 1. Handle Case Data Changes (Demographics, History)
    const handleCaseChange = (e) => {
        const { name, value } = e.target
        setCaseData(prev => ({ ...prev, [name]: value }))
    }

    const saveCaseDetails = () => {
        // Sanitize Data
        const sanitize = (data) => {
            const numericFields = ['age']
            const dateFields = ['date_of_birth', 'time_of_death']
            const clean = { ...data }
            numericFields.forEach(field => {
                if (clean[field] === '') clean[field] = null
            })
            dateFields.forEach(field => {
                if (clean[field] === '') clean[field] = null
            })
            // Exclude read-only or auto fields
            delete clean.qr_code_image
            delete clean.date_of_arrival
            delete clean.assigned_pathologist_name
            return clean
        }
        const payload = sanitize(caseData)

        axios.patch(`http://127.0.0.1:8000/api/cases/${id}/`, payload)
            .then(() => alert('Case Details Updated!'))
            .catch(err => {
                console.error('Error saving case:', err)
                alert('Error saving case: ' + JSON.stringify(err.response?.data))
            })
    }

    // 2. Handle Report Data Changes (Medical Findings)
    const handleReportChange = (e) => {
        const { name, value } = e.target
        setReportData(prev => ({ ...prev, [name]: value }))
    }

    const saveReportData = () => {
        // Sanitize Data (Fix 400 Bad Request)
        const sanitize = (data) => {
            const numericFields = [
                'height_cm', 'weight_kg', 'bmi',
                'brain_weight', 'heart_weight', 'lung_right_weight', 'lung_left_weight',
                'liver_weight', 'spleen_weight', 'kidney_right_weight', 'kidney_left_weight'
            ]
            const clean = { ...data }
            numericFields.forEach(field => {
                if (clean[field] === '') clean[field] = null
            })
            return clean
        }
        const payload = sanitize(reportData)

        console.log('Saving report with payload:', payload)

        axios.patch(`http://127.0.0.1:8000/api/reports/${id}/`, payload)
            .then(() => alert('Report Draft Saved!'))
            .catch((err) => {
                console.error('Error saving report:', err)
                if(err.response && err.response.status === 404) {
                    console.log('Report not found, creating new one...')
                    axios.post('http://127.0.0.1:8000/api/reports/', { ...payload, case_id: id })
                        .then(() => alert('Report Created!'))
                        .catch((createErr) => {
                            console.error('Error creating report:', createErr)
                            alert('Error creating report: ' + JSON.stringify(createErr.response?.data))
                        })
                } else { 
                    alert('Error updating report: ' + JSON.stringify(err.response?.data)) 
                }
            })
    }

    // 3. Finalize Case
    const handleFinalizeCase = () => {
        if (!window.confirm("CONFIRMATION REQUIRED:\n\nAre you sure you want to CLOSE this case?\nThis will lock the status as COMPLETE.")) return;
        
        // Sanitize
        const sanitize = (data) => {
            const numericFields = ['height_cm', 'weight_kg', 'bmi', 'brain_weight', 'heart_weight', 'lung_right_weight', 'lung_left_weight', 'liver_weight', 'spleen_weight', 'kidney_right_weight', 'kidney_left_weight']
            const clean = { ...data }
            numericFields.forEach(f => { if (clean[f] === '') clean[f] = null })
            return clean
        }
        const payload = sanitize(reportData)

        // Save Report -> Then Close Case -> Then Redirect
        axios.patch(`http://127.0.0.1:8000/api/reports/${id}/`, payload)
            .catch(err => {
                // If report doesn't exist, create it first
                if(err.response?.status === 404) return axios.post('http://127.0.0.1:8000/api/reports/', { ...payload, case: id })
                throw err
            })
            .then(() => axios.patch(`http://127.0.0.1:8000/api/cases/${id}/`, { status: 'COMPLETE' }))
            .then(res => {
                setCaseData(res.data)
                alert("Case Closed Successfully.")
                // Download PDF
                return axios.get(`http://127.0.0.1:8000/api/cases/${id}/pdf/`, { responseType: 'blob' })
            })
            .then(response => {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `Report_${id}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
            })
            .catch(pdfError => {
                console.error('PDF download failed:', pdfError)
                alert('Case closed, but PDF download failed.')
            })
            .finally(() => {
                navigate('/')
            })
            .catch(err => alert("Error: " + err.message))
    }

    // 4. Cassettes
    const addCassette = () => {
        if(!newCassette.cassette_id) return
        axios.post(`http://127.0.0.1:8000/api/reports/${id}/cassettes/`, newCassette)
            .then(res => { setCassettes([...cassettes, res.data]); setNewCassette({cassette_id:'', tissue_type:''}) })
            .catch(() => alert("Please save the report draft first."))
    }
    const deleteCassette = (cid) => {
        axios.delete(`http://127.0.0.1:8000/api/reports/${id}/cassettes/${cid}/`).then(() => setCassettes(cassettes.filter(c => c.id !== cid)))
    }

    if (loading) return <div>Loading...</div>
    if (!caseData) return <div>Case not found.</div>

    // --- STYLES (High Contrast Fixed) ---
    const tabStyle = (name) => ({
        padding: '12px 24px', cursor: 'pointer', borderRadius: '8px 8px 0 0',
        backgroundColor: activeTab === name ? '#007bff' : '#e9ecef',
        color: activeTab === name ? '#ffffff' : '#000000',
        fontWeight: 'bold', border: '1px solid #dee2e6', marginBottom: '-1px', marginRight: '5px',
        userSelect: 'none'
    })
    
    // FORCE COLOR: #333 to prevent white-on-white text issues
    const inputStyle = { 
        padding: '10px', border: '1px solid #ccc', borderRadius: '4px', width: '100%', boxSizing: 'border-box',
        backgroundColor: '#ffffff', color: '#333333', fontSize: '14px'
    }
    const areaStyle = { 
        padding: '10px', border: '1px solid #ccc', borderRadius: '4px', width: '100%', minHeight: '80px', 
        fontFamily: 'inherit', boxSizing: 'border-box',
        backgroundColor: '#ffffff', color: '#333333', fontSize: '14px'
    }
    const sectionHeader = { borderBottom: '2px solid #007bff', paddingBottom: '5px', marginBottom: '15px', color: '#000000', marginTop: '0' }
    
    const gridBox = { 
        background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #e9ecef', marginBottom: '25px',
        color: '#000000' // Ensure text inside box is black
    }
    const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#555' }

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif', color: '#000' }}>
            
            {/* HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <button onClick={() => navigate('/')} style={{cursor:'pointer', padding:'8px 15px', background:'white', border:'1px solid #ccc', borderRadius:'4px', color:'black'}}>← Back</button>
                    <div>
                        <h1 style={{ margin: 0, color: '#000' }}>{caseData.deceased_name}</h1>
                        <span style={{ background: caseData.status==='COMPLETE'?'#28a745':'#007bff', color:'white', padding:'4px 10px', borderRadius:'4px', fontSize:'0.8em', fontWeight:'bold' }}>{caseData.status}</span>
                    </div>
                </div>
                {caseData.qr_code_image && (
                    <div style={{ textAlign: 'center' }}>
                        <img 
                            src={caseData.qr_code_image.startsWith('http') ? caseData.qr_code_image : `http://127.0.0.1:8000${caseData.qr_code_image}`} 
                            alt="QR" 
                            style={{width: 80, height: 80, border: '1px solid #ddd'}} 
                        />
                        <div style={{fontSize: '10px', color: '#666'}}>SCAN TO VERIFY</div>
                    </div>
                )}
            </div>

            {/* TABS */}
            <div style={{ display: 'flex', borderBottom: '1px solid #ddd', marginBottom: '20px' }}>
                <div onClick={() => setActiveTab('overview')} style={tabStyle('overview')}>Overview</div>
                <div onClick={() => setActiveTab('external')} style={tabStyle('external')}>External Exam</div>
                <div onClick={() => setActiveTab('internal')} style={tabStyle('internal')}>Internal & Histology</div>
                <div onClick={() => setActiveTab('toxicology')} style={tabStyle('toxicology')}>Labs & Conclusion</div>
            </div>

            <div style={{ background: 'white', padding: '30px', border: '1px solid #ddd', borderRadius: '8px', minHeight: '600px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                
                {/* 1. OVERVIEW (UPDATED WITH INPUTS) */}
                {activeTab === 'overview' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={sectionHeader}>Case Overview</h2>
                            <button onClick={saveCaseDetails} style={{ background: '#007bff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>💾 Save Details</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
                            {/* Static Info */}
                            <div style={gridBox}>
                                <h4 style={{marginTop:0}}>👤 Subject Identity</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div><label style={labelStyle}>Name</label><input value={caseData.deceased_name} disabled style={{...inputStyle, background: '#eee', color: '#555'}} /></div>
                                    <div><label style={labelStyle}>Age</label><input value={caseData.age || ''} disabled style={{...inputStyle, background: '#eee', color: '#555'}} /></div>
                                    <div><label style={labelStyle}>Gender</label><input value={caseData.gender} disabled style={{...inputStyle, background: '#eee', color: '#555'}} /></div>
                                    <div><label style={labelStyle}>Race</label><input name="race" value={caseData.race || ''} onChange={handleCaseChange} style={inputStyle} placeholder="e.g. African" /></div>
                                    <div style={{gridColumn: 'span 2'}}><label style={labelStyle}>ID Method</label><input value={caseData.identification_method} disabled style={{...inputStyle, background: '#eee', color: '#555'}} /></div>
                                </div>
                            </div>

                            {/* Death Circumstances (EDITABLE NOW) */}
                            <div style={{ ...gridBox, background: '#fff9e6', border: '1px solid #ffeeba' }}>
                                <h4 style={{marginTop:0, color: '#856404'}}>💀 Death Circumstances</h4>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={labelStyle}>Time of Death</label>
                                    <input type="datetime-local" name="time_of_death" value={caseData.time_of_death ? caseData.time_of_death.slice(0,16) : ''} onChange={handleCaseChange} style={inputStyle} />
                                </div>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={labelStyle}>Place of Death</label>
                                    <input name="place_of_death" value={caseData.place_of_death || ''} onChange={handleCaseChange} style={inputStyle} placeholder="e.g. City Hospital, Roadside..." />
                                </div>
                                <div>
                                    <label style={labelStyle}>Circumstances / Police History</label>
                                    <textarea name="circumstances_of_death" value={caseData.circumstances_of_death || ''} onChange={handleCaseChange} style={areaStyle} placeholder="Police Summary..." />
                                </div>
                            </div>
                        </div>
                        
                        <div style={gridBox}>
                            <h4 style={{marginTop:0}}>🏥 Medical History</h4>
                            <textarea name="medical_history" value={caseData.medical_history || ''} onChange={handleCaseChange} style={areaStyle} placeholder="Known conditions (Diabetes, Hypertension, Surgeries)..." />
                        </div>
                    </div>
                )}

                {/* 2. EXTERNAL */}
                {activeTab === 'external' && (
                    <div>
                        <h2 style={sectionHeader}>External Examination</h2>
                        <div style={gridBox}>
                            <h4 style={{marginTop:0}}>General Features</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                                <div><label style={labelStyle}>Height (cm)</label><input name="height_cm" value={reportData.height_cm} onChange={handleReportChange} style={inputStyle} /></div>
                                <div><label style={labelStyle}>Weight (kg)</label><input name="weight_kg" value={reportData.weight_kg} onChange={handleReportChange} style={inputStyle} /></div>
                                <div><label style={labelStyle}>Body Habitus</label>
                                    <select name="body_habitus" value={reportData.body_habitus} onChange={handleReportChange} style={inputStyle}>
                                        <option value="NORM">Normal</option><option value="THIN">Thin</option><option value="OBESE">Obese</option><option value="EMACIATED">Emaciated</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                                <div><label style={labelStyle}>Rigor Mortis</label><input name="rigor_mortis" placeholder="e.g. Fully established..." value={reportData.rigor_mortis} onChange={handleReportChange} style={inputStyle} /></div>
                                <div><label style={labelStyle}>Livor Mortis</label><input name="livor_mortis" placeholder="e.g. Fixed posterior..." value={reportData.livor_mortis} onChange={handleReportChange} style={inputStyle} /></div>
                            </div>
                            <div style={{ marginTop: '15px' }}>
                                <label style={labelStyle}>Clothing Description</label>
                                <textarea name="clothing_description" placeholder="e.g. Blue jeans, white t-shirt..." value={reportData.clothing_description} onChange={handleReportChange} style={areaStyle} />
                            </div>
                            <button onClick={saveReportData} style={{marginTop:'15px', background:'#6c757d', color:'white', border:'none', padding:'10px 20px', borderRadius:'4px', cursor:'pointer'}}>Update External Details</button>
                        </div>
                        
                        <BodyMap existingData={caseData.body_map_data} gender={caseData.gender} age={caseData.age} onSave={(txt, json) => {
                             axios.patch(`http://127.0.0.1:8000/api/cases/${id}/`, { external_injuries: txt, body_map_data: json }).then(() => setCaseData(prev => ({...prev, external_injuries: txt, body_map_data: json})))
                        }} />
                    </div>
                )}

                {/* 3. INTERNAL */}
                {activeTab === 'internal' && (
                    <div>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems: 'center', marginBottom: '20px'}}>
                            <h2 style={{...sectionHeader, marginBottom:0}}>Internal & Histology</h2>
                            <button onClick={saveReportData} style={{background: '#007bff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight:'bold'}}>💾 Save Draft</button>
                        </div>
                        
                        <div style={gridBox}>
                            <h4 style={{marginTop:0}}>Procedure & Fluids</h4>
                            <div style={{marginBottom:'15px'}}>
                                <label style={labelStyle}>Evisceration Technique</label>
                                <textarea name="evisceration_technique" value={reportData.evisceration_technique} onChange={handleReportChange} style={{...areaStyle, minHeight: '60px'}} />
                            </div>
                            <div>
                                <label style={labelStyle}>Body Cavity Fluids</label>
                                <textarea name="fluid_findings" placeholder="Pleural, Pericardial, Peritoneal fluids..." value={reportData.fluid_findings} onChange={handleReportChange} style={areaStyle} />
                            </div>
                        </div>

                        <div style={gridBox}>
                            <h4 style={{marginTop:0}}>Organ Weights (grams)</h4>
                            <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'15px'}}>
                                <div><label style={labelStyle}>Brain</label><input name="brain_weight" value={reportData.brain_weight} onChange={handleReportChange} style={inputStyle} /></div>
                                <div><label style={labelStyle}>Heart</label><input name="heart_weight" value={reportData.heart_weight} onChange={handleReportChange} style={inputStyle} /></div>
                                <div><label style={labelStyle}>Liver</label><input name="liver_weight" value={reportData.liver_weight} onChange={handleReportChange} style={inputStyle} /></div>
                                <div><label style={labelStyle}>Spleen</label><input name="spleen_weight" value={reportData.spleen_weight} onChange={handleReportChange} style={inputStyle} /></div>
                                <div><label style={labelStyle}>Rt. Lung</label><input name="lung_right_weight" value={reportData.lung_right_weight} onChange={handleReportChange} style={inputStyle} /></div>
                                <div><label style={labelStyle}>Lt. Lung</label><input name="lung_left_weight" value={reportData.lung_left_weight} onChange={handleReportChange} style={inputStyle} /></div>
                                <div><label style={labelStyle}>Rt. Kidney</label><input name="kidney_right_weight" value={reportData.kidney_right_weight} onChange={handleReportChange} style={inputStyle} /></div>
                                <div><label style={labelStyle}>Lt. Kidney</label><input name="kidney_left_weight" value={reportData.kidney_left_weight} onChange={handleReportChange} style={inputStyle} /></div>
                            </div>
                        </div>

                        <div style={{ ...gridBox, borderLeft: '5px solid #6610f2' }}>
                            <h4 style={{marginTop:0, color: '#6610f2'}}>🔬 Histology Cassette Log</h4>
                            <table style={{width: '100%', marginBottom: '15px', borderCollapse:'collapse'}}>
                                <thead>
                                    <tr style={{borderBottom:'2px solid #ddd'}}>
                                        <th style={{textAlign:'left', padding:'8px', color:'#555'}}>ID</th>
                                        <th style={{textAlign:'left', padding:'8px', color:'#555'}}>Tissue Type</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cassettes.map(c => <tr key={c.id} style={{borderBottom:'1px solid #eee'}}>
                                        <td style={{fontWeight:'bold', padding:'10px', color:'#000'}}>{c.cassette_id}</td>
                                        <td style={{padding:'10px', color:'#000'}}>{c.tissue_type}</td>
                                        <td style={{textAlign:'right'}}><button onClick={()=>deleteCassette(c.id)} style={{color:'red', border:'none', cursor:'pointer', fontWeight:'bold', fontSize:'16px'}}>✕</button></td>
                                    </tr>)}
                                </tbody>
                            </table>
                            <div style={{display:'flex', gap:'10px', alignItems:'flex-end'}}>
                                <div><label style={labelStyle}>ID (e.g. A1)</label><input value={newCassette.cassette_id} onChange={e=>setNewCassette({...newCassette, cassette_id:e.target.value})} style={{width:'100px', ...inputStyle}} /></div>
                                <div style={{flex:1}}><label style={labelStyle}>Tissue Site (e.g. Left Ventricle)</label><input value={newCassette.tissue_type} onChange={e=>setNewCassette({...newCassette, tissue_type:e.target.value})} style={inputStyle} /></div>
                                <button onClick={addCassette} style={{background: '#6610f2', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', height:'38px', cursor:'pointer'}}>Add Block</button>
                            </div>
                        </div>

                        <div style={gridBox}>
                             <h4 style={{marginTop:0}}>System Descriptions</h4>
                             <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
                                 <div><label style={labelStyle}>Cardiovascular System</label><textarea name="heart_findings" value={reportData.heart_findings} onChange={handleReportChange} style={areaStyle} /></div>
                                 <div><label style={labelStyle}>Respiratory System</label><textarea name="lung_findings" value={reportData.lung_findings} onChange={handleReportChange} style={areaStyle} /></div>
                                 <div><label style={labelStyle}>Hepatobiliary System</label><textarea name="liver_findings" value={reportData.liver_findings} onChange={handleReportChange} style={areaStyle} /></div>
                                 <div><label style={labelStyle}>Digestive System</label><textarea name="stomach_contents" value={reportData.stomach_contents} onChange={handleReportChange} style={areaStyle} /></div>
                                 <div><label style={labelStyle}>Genitourinary System</label><textarea name="genitalia_findings" value={reportData.genitalia_findings} onChange={handleReportChange} style={areaStyle} /></div>
                                 <div><label style={labelStyle}>Neck & CNS</label><textarea name="neck_findings" value={reportData.neck_findings} onChange={handleReportChange} style={areaStyle} /></div>
                             </div>
                        </div>
                    </div>
                )}

                {/* 4. TOXICOLOGY & CONCLUSION */}
                {activeTab === 'toxicology' && (
                    <div>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '20px'}}>
                            <h2 style={{...sectionHeader, marginBottom:0}}>Conclusion</h2>
                            <button onClick={handleFinalizeCase} style={{background:'#28a745', color:'white', padding:'12px 25px', borderRadius:'5px', border:'none', cursor:'pointer', fontWeight:'bold', fontSize:'15px', boxShadow:'0 2px 5px rgba(0,0,0,0.2)'}}>✅ Save Final Report & Close Case</button>
                        </div>
                        
                        <div style={gridBox}>
                            <h4 style={{marginTop:0}}>Labs & Toxicology</h4>
                            <div style={{marginBottom:'15px'}}>
                                <label style={labelStyle}>Specimens Collected</label>
                                <input name="specimens_collected" placeholder="e.g. Heart Blood, Femoral Blood, Vitreous, Urine, Liver..." value={reportData.specimens_collected} onChange={handleReportChange} style={inputStyle} />
                            </div>
                            <div style={{marginBottom:'15px'}}>
                                <label style={labelStyle}>Toxicology Results</label>
                                <textarea name="toxicology_results" placeholder="Results..." value={reportData.toxicology_results} onChange={handleReportChange} style={areaStyle} />
                            </div>
                            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
                                <div><label style={labelStyle}>Microbiology</label><textarea name="microbiology_results" value={reportData.microbiology_results} onChange={handleReportChange} style={areaStyle} /></div>
                                <div><label style={labelStyle}>Histology Results</label><textarea name="histology_results" value={reportData.histology_results} onChange={handleReportChange} style={areaStyle} /></div>
                            </div>
                        </div>

                        <div style={{ ...gridBox, borderLeft: '5px solid #dc3545' }}>
                            <h4 style={{marginTop:0, color:'#dc3545'}}>📋 Pathologic Diagnoses (FAD)</h4>
                            <label style={labelStyle}>List findings one per line</label>
                            <textarea name="pathologic_diagnoses" value={reportData.pathologic_diagnoses} onChange={handleReportChange} style={{...areaStyle, height:'150px', fontFamily:'monospace', fontSize:'13px'}} />
                        </div>

                        <div style={{...gridBox, borderLeft: '5px solid #007bff'}}>
                             <h4 style={{marginTop:0, color:'#007bff'}}>Final Opinion</h4>
                             <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:'20px', marginBottom:'15px'}}>
                                 <div>
                                     <label style={labelStyle}>Manner of Death</label>
                                     <select name="manner_of_death" value={reportData.manner_of_death} onChange={handleReportChange} style={inputStyle}>
                                        <option value="UNDETERMINED">Undetermined</option><option value="NATURAL">Natural</option><option value="HOMICIDE">Homicide</option><option value="ACCIDENT">Accident</option><option value="SUICIDE">Suicide</option>
                                     </select>
                                 </div>
                                 <div>
                                     <label style={labelStyle}>Immediate Cause of Death</label>
                                     <input name="cause_of_death" value={reportData.cause_of_death} onChange={handleReportChange} style={inputStyle} />
                                 </div>
                             </div>
                             <div style={{marginBottom:'15px'}}>
                                <label style={labelStyle}>Narrative Summary / Opinion</label>
                                <textarea name="final_summary" value={reportData.final_summary} onChange={handleReportChange} style={{...areaStyle, height:'150px'}} />
                             </div>
                             <div>
                                <label style={labelStyle}>Evidence Disposition / Chain of Custody</label>
                                <input name="evidence_disposition" value={reportData.evidence_disposition} onChange={handleReportChange} style={inputStyle} />
                             </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}

export default CaseDetails