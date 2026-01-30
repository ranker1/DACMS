import { useState } from 'react'
import axios from 'axios'

function RegisterCase({ onCaseAdded }) {
    const [formData, setFormData] = useState({
        case_id: '',
        deceased_name: '',
        case_type: 'NORMAL',
        gender: 'U',
        age: '', // Starts as empty string
        ob_number: '', 
        police_station: ''
    })

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            // --- FIX 2: HANDLE EMPTY AGE ---
            // If age is empty string "", send null. Otherwise send the number.
            const cleanData = {
                ...formData,
                age: formData.age === '' ? null : formData.age
            }

            // Note: We don't need to manually add headers here anymore 
            // because App.jsx handles it globally now!
            await axios.post('http://127.0.0.1:8000/api/cases/', cleanData)
            
            alert("Case Registered Successfully!")
            
            // Reset form
            setFormData({
                case_id: '',
                deceased_name: '',
                case_type: 'NORMAL',
                gender: 'U',
                age: '',
                ob_number: '',
                police_station: ''
            })
            
            if (onCaseAdded) onCaseAdded()
            
        } catch (error) {
            console.error("Registration Error:", error)
            // Show the server's exact complaint
            if (error.response && error.response.data) {
                alert("Error: " + JSON.stringify(error.response.data))
            } else {
                alert("Failed to register case.")
            }
        }
    }

    return (
        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', background: '#f9f9f9', marginBottom: '30px' }}>
            <h3 style={{ marginTop: 0 }}>📂 Register New Case</h3>
            
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                
                {/* Row 1 */}
                <input 
                    name="case_id" 
                    placeholder="Case ID (e.g., CASE-001)" 
                    value={formData.case_id} 
                    onChange={handleChange} 
                    required 
                    style={{ padding: '8px' }}
                />
                <input 
                    name="deceased_name" 
                    placeholder="Deceased Name" 
                    value={formData.deceased_name} 
                    onChange={handleChange} 
                    required 
                    style={{ padding: '8px' }}
                />

                {/* Row 2 */}
                <select name="case_type" value={formData.case_type} onChange={handleChange} style={{ padding: '8px' }}>
                    <option value="NORMAL">🏥 Clinical / Normal</option>
                    <option value="FORENSIC">🚓 Forensic / Crime</option>
                </select>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <select name="gender" value={formData.gender} onChange={handleChange} style={{ padding: '8px', flex: 1 }}>
                        <option value="U">Unknown Gender</option>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                    </select>
                    {/* The Age Input */}
                    <input 
                        name="age" 
                        type="number" 
                        placeholder="Age" 
                        value={formData.age} 
                        onChange={handleChange} 
                        style={{ padding: '8px', width: '80px' }}
                    />
                </div>

                {/* Row 3 */}
                <input 
                    name="ob_number" 
                    placeholder="OB Number" 
                    value={formData.ob_number} 
                    onChange={handleChange} 
                    style={{ padding: '8px' }}
                />
                <input 
                    name="police_station" 
                    placeholder="Police Station" 
                    value={formData.police_station} 
                    onChange={handleChange} 
                    style={{ padding: '8px' }}
                />

                <button type="submit" style={{ gridColumn: '1 / -1', padding: '10px', background: '#28a745', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                    + Register Case
                </button>
            </form>
        </div>
    )
}

export default RegisterCase