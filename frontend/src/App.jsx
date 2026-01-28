import { useState, useEffect } from 'react'
import axios from 'axios'
import RegisterCase from './RegisterCase'
import EvidenceSection from './EvidenceSection'
import Login from './Login'
import ReportForm from './ReportForm'
import RegisterUser from './RegisterUser' // <--- Import the new Admin Component

function App() {
  // 1. Get Token AND Role from storage
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [role, setRole] = useState(localStorage.getItem('role'))
  
  const [cases, setCases] = useState([])

  // Configure axios if token exists
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Token ${token}`
  }

  const fetchCases = () => {
    axios.get('http://127.0.0.1:8000/api/cases/')
      .then(response => setCases(response.data))
      .catch(error => console.error("Error:", error))
  }

  useEffect(() => {
    if (token) {
        fetchCases()
    }
  }, [token])

  const handleLogout = () => {
      // Clear EVERYTHING
      localStorage.removeItem('token')
      localStorage.removeItem('role')
      setToken(null)
      setRole(null)
      setCases([])
      delete axios.defaults.headers.common['Authorization']
  }

  // --- Secure PDF Download Function ---
  const downloadPDF = async (caseId, deceasedName) => {
    try {
      const currentToken = localStorage.getItem('token');
      const response = await axios.get(`http://127.0.0.1:8000/api/cases/${caseId}/download_pdf/`, {
        responseType: 'blob', 
        headers: { 'Authorization': `Token ${currentToken}` }
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Report_${deceasedName}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download PDF. You might not have permission.");
    }
  };

  // 1. LOGIN SCREEN
  if (!token) {
      return <Login onLoginSuccess={(t, r) => { setToken(t); setRole(r); }} />
  }

  // 2. DASHBOARD
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{margin: 0}}>🏥 DACMS Dashboard</h1>
            <span style={{fontSize: '0.8em', color: '#888'}}>Logged in as: <strong>{role}</strong></span>
          </div>
          <button onClick={handleLogout} style={{ padding: '8px 15px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Logout
          </button>
      </div>

      {/* --- ADMIN ZONE: CREATE USERS --- */}
      {/* Only show this if the user is an ADMIN */}
      {role === 'ADMIN' && (
          <RegisterUser />
      )}
      
      {/* REGISTER CASE FORM (Visible to Everyone) */}
      <RegisterCase onCaseAdded={fetchCases} />

      <hr style={{ margin: '30px 0' }}/>

      {/* CASE LIST */}
      <h2>Recent Cases</h2>
      {cases.length === 0 ? (
        <p>No cases found.</p>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
            {cases.map(c => (
              <div key={c.id} style={{ border: '1px solid #eee', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', background: 'white' }}>
                  
                  {/* Top Section: Info & QR */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ margin: '0 0 5px 0', color: '#333' }}>{c.deceased_name}</h3>
                        <div style={{ color: '#666', fontSize: '0.9em' }}>
                            ID: <strong>{c.case_id}</strong> <br/>
                            OB: {c.ob_number} <br/>
                            Status: <span style={{fontWeight: 'bold', color: c.status === 'PENDING' ? 'orange' : 'green'}}>{c.status}</span>
                        </div>
                      </div>
                      
                      {c.qr_code_image && (
                          <img 
                            src={c.qr_code_image.startsWith('http') ? c.qr_code_image : `http://127.0.0.1:8000${c.qr_code_image}`} 
                            alt="Case QR" 
                            style={{ width: '100px', height: '100px', border: '1px solid #ddd', padding: '5px', background: 'white' }} 
                          />
                      )}
                  </div>

                  {/* Evidence Section (Visible to Everyone) */}
                  <hr style={{ margin: '15px 0', border: '0', borderTop: '1px solid #eee' }}/>
                  <EvidenceSection 
                      caseId={c.id} 
                      evidenceList={c.evidence || []} 
                      onEvidenceAdded={fetchCases} 
                  />

                  {/* --- RESTRICTED ZONE: REPORT TOOLS --- */}
                  {/* Only show this if user is PATHOLOGIST or ADMIN */}
                  {(role === 'PATHOLOGIST' || role === 'ADMIN') && (
                    <>
                        <hr style={{ margin: '15px 0', border: '0', borderTop: '1px solid #eee' }}/>
                        
                        {/* PDF Button */}
                        <div style={{ marginBottom: '15px' }}>
                                <button 
                                    onClick={() => downloadPDF(c.id, c.deceased_name)}
                                    style={{ background: '#6610f2', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                                >
                                    🖨️ Download PDF Report
                                </button>
                        </div>

                        {/* Report Form */}
                        <ReportForm 
                            caseId={c.id} 
                            existingReport={c.report} 
                            onReportSaved={fetchCases} 
                        />
                    </>
                  )}
                  {/* --- END RESTRICTED ZONE --- */}

              </div>
            ))}
        </div>
      )}
    </div>
  )
}

export default App