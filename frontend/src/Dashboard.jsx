import { useState, useEffect } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom' // <--- New Import for navigation
import RegisterCase from './RegisterCase'
import EvidenceSection from './EvidenceSection'
import ReportForm from './ReportForm'
import RegisterUser from './RegisterUser'

function Dashboard({ role, onLogout }) {
  const [cases, setCases] = useState([])

  const fetchCases = () => {
    axios.get('http://127.0.0.1:8000/api/cases/')
      .then(response => setCases(response.data))
      .catch(error => console.error("Error:", error))
  }

  useEffect(() => {
    fetchCases()
  }, [])

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
      alert("Failed to download PDF.");
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{margin: 0}}>🏥 DACMS Dashboard</h1>
            <span style={{fontSize: '0.8em', color: '#888'}}>Logged in as: <strong>{role}</strong></span>
          </div>
          <button onClick={onLogout} style={{ padding: '8px 15px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Logout
          </button>
      </div>

      {/* ADMIN ZONE */}
      {role === 'ADMIN' && <RegisterUser />}
      
      {/* REGISTER FORM */}
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
                  
                  {/* --- CLICKABLE TITLE (NAVIGATES TO DETAILS PAGE) --- */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        {/* LINK TO NEW PAGE */}
                        <Link to={`/cases/${c.id}`} style={{ textDecoration: 'none', color: '#007bff' }}>
                            <h3 style={{ margin: '0 0 5px 0' }}>{c.deceased_name} ↗</h3>
                        </Link>
                        
                        <div style={{ color: '#666', fontSize: '0.9em' }}>
                            ID: <strong>{c.case_id}</strong> <br/>
                            Type: <strong>{c.case_type}</strong> <br/> {/* NEW FIELD */}
                            Status: <span style={{fontWeight: 'bold', color: c.status === 'PENDING' ? 'orange' : 'green'}}>{c.status}</span>
                        </div>
                      </div>
                      
                      {c.qr_code_image && (
                          <img 
                            src={c.qr_code_image.startsWith('http') ? c.qr_code_image : `http://127.0.0.1:8000${c.qr_code_image}`} 
                            alt="Case QR" 
                            style={{ width: '80px', height: '80px', border: '1px solid #ddd' }} 
                          />
                      )}
                  </div>

                  {/* OLD TOOLS (Kept for quick access, but mostly moved to details page later) */}
                  <hr style={{ margin: '15px 0', border: '0', borderTop: '1px solid #eee' }}/>
                  
                  {(role === 'PATHOLOGIST' || role === 'ADMIN') && (
                        <button 
                            onClick={() => downloadPDF(c.id, c.deceased_name)}
                            style={{ background: '#6610f2', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9em' }}
                        >
                            🖨️ Quick PDF
                        </button>
                  )}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

export default Dashboard