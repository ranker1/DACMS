import { useState } from 'react'
import api from './api'
import { useToasts } from './Toasts'

function ReportForm({ caseId, onReportSaved, existingReport, role }) {
    const { addToast } = useToasts()
    const [formData, setFormData] = useState({
        cause_of_death: existingReport ? existingReport.cause_of_death : '',
        manner_of_death: existingReport ? existingReport.manner_of_death : 'NATURAL',
        details: existingReport ? existingReport.details : ''
    })

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!(role === 'PATHOLOGIST' || role === 'ADMIN')) {
            addToast('You do not have permission to submit reports.', { type: 'error' })
            return
        }
        try {
            const payload = { ...formData, case: caseId }
            
            if (existingReport) {
                // UPDATE existing report (PUT)
                await api.put(`reports/${caseId}/`, payload)
            } else {
                // CREATE new report (POST)
                await api.post('reports/', payload)
            }
            
            addToast("Report Saved Successfully", { type: 'success' })
            onReportSaved()
        } catch (error) {
            console.error(error)
            addToast("Error saving report. Check console for details.", { type: 'error' })
        }
    }
    return (
        <div style={{ padding: '15px', background: '#e9ecef', borderRadius: '8px', marginTop: '10px' }}>
            <h4 style={{marginTop: 0, color: '#333'}}>📝 Pathologist Findings</h4>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                
                <label style={{color: '#333', fontWeight: 'bold'}}>Cause of Death:</label>
                <input 
                    name="cause_of_death" 
                    value={formData.cause_of_death} 
                    onChange={handleChange} 
                    required 
                    style={{padding: '8px'}}
                />

                <label style={{color: '#333', fontWeight: 'bold'}}>Manner of Death:</label>
                <select name="manner_of_death" value={formData.manner_of_death} onChange={handleChange} style={{padding: '8px'}}>
                    <option value="NATURAL">Natural</option>
                    <option value="ACCIDENT">Accidental</option>
                    <option value="HOMICIDE">Homicide</option>
                    <option value="SUICIDE">Suicide</option>
                    <option value="UNDETERMINED">Undetermined</option>
                </select>

                <label style={{color: '#333', fontWeight: 'bold'}}>Detailed Notes:</label>
                <textarea 
                    name="details" 
                    value={formData.details} 
                    onChange={handleChange} 
                    rows="4" 
                    style={{padding: '8px'}}
                ></textarea>

                <button type="submit" style={{ padding: '10px', background: '#28a745', color: 'white', border: 'none', cursor: 'pointer' }}>
                    Save Report
                </button>
            </form>
        </div>
    )
}

export default ReportForm