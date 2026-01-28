import { useState } from 'react'
import axios from 'axios'

function RegisterCase({ onCaseAdded }) {
    const [formData, setFormData] = useState({
        ob_number: '',
        police_station: '',
        deceased_name: '',
        age: '',
        gender: 'U'
    })

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            // Send data to Backend
            const response = await axios.post('http://127.0.0.1:8000/api/cases/', formData)
            alert("Case Created! ID: " + response.data.case_id)
            
            // Clear form
            setFormData({
                ob_number: '',
                police_station: '',
                deceased_name: '',
                age: '',
                gender: 'U'
            })
            
            // Refresh the list on the main page
            if (onCaseAdded) onCaseAdded()
            
        } catch (error) {
            console.error("Error:", error)
            alert("Failed to register case. Check console.")
        }
    }

    return (
        <div style={{ padding: '20px', border: '1px solid #ddd', marginBottom: '20px', borderRadius: '8px' }}>
            <h3>➕ Register New Case</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' }}>
                
                <input name="ob_number" placeholder="OB Number (e.g. OB/12/2026)" value={formData.ob_number} onChange={handleChange} required padding="8px" />
                
                <input name="police_station" placeholder="Police Station" value={formData.police_station} onChange={handleChange} required />
                
                <input name="deceased_name" placeholder="Deceased Name" value={formData.deceased_name} onChange={handleChange} required />
                
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input type="number" name="age" placeholder="Age" value={formData.age} onChange={handleChange} style={{ width: '80px' }} />
                    <select name="gender" value={formData.gender} onChange={handleChange} style={{ flex: 1 }}>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                        <option value="U">Unknown</option>
                    </select>
                </div>

                <button type="submit" style={{ padding: '10px', background: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>
                    Generate Record & QR Code
                </button>
            </form>
        </div>
    )
}

export default RegisterCase