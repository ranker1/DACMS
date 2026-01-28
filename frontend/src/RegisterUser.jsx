import { useState } from 'react'
import axios from 'axios'

function RegisterUser() {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: 'POLICE' // Default
    })

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const token = localStorage.getItem('token')
            await axios.post('http://127.0.0.1:8000/api/register/', formData, {
                headers: { 'Authorization': `Token ${token}` }
            })
            alert(`User ${formData.username} created!`)
            setFormData({ username: '', password: '', role: 'POLICE' }) // Reset
        } catch (error) {
            console.error(error)
            alert("Failed to create user. (Check if username exists)")
        }
    }

    return (
        <div style={{ padding: '20px', border: '2px solid #333', marginBottom: '20px', borderRadius: '8px', background: '#fff3cd' }}>
            <h3 style={{marginTop: 0, color: '#856404'}}>👮‍♂️ Staff Onboarding (Admin Only)</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input 
                    name="username" 
                    placeholder="New Username" 
                    value={formData.username} 
                    onChange={handleChange} 
                    required 
                    style={{padding: '8px'}}
                />
                <input 
                    name="password" 
                    type="password" 
                    placeholder="Password" 
                    value={formData.password} 
                    onChange={handleChange} 
                    required 
                    style={{padding: '8px'}}
                />
                <select name="role" value={formData.role} onChange={handleChange} style={{padding: '8px'}}>
                    <option value="POLICE">Police Officer</option>
                    <option value="PATHOLOGIST">Pathologist</option>
                    <option value="ADMIN">System Admin</option>
                </select>

                <button type="submit" style={{ padding: '8px 15px', background: '#333', color: 'white', border: 'none', cursor: 'pointer' }}>
                    Create User
                </button>
            </form>
        </div>
    )
}

export default RegisterUser