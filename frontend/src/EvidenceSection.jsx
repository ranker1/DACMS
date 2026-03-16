import { useState } from 'react'
import api from './api'
import { useToasts } from './Toasts'

function EvidenceSection({ caseId, evidenceList, onEvidenceAdded }) {
    const [newItem, setNewItem] = useState('')
    const { addToast } = useToasts()
    const canEdit = role === 'PATHOLOGIST' || role === 'ADMIN'

    const handleAddEvidence = async (e) => {
        e.preventDefault()
        if (!newItem) return

        try {
            await api.post('evidence/', {
                case: caseId, 
                item_name: newItem,
                location: "Reception" 
            })
            setNewItem('')
            onEvidenceAdded() 
        } catch (error) {
            console.error("Error adding evidence:", error)
            addToast("Failed to add evidence", { type: 'error' })
        }
    }

    return (
        <div style={{ marginTop: '10px', padding: '10px', background: '#f9f9f9', borderRadius: '5px', color: 'black' }}>
            <h4 style={{ marginTop: 0, marginBottom: '10px', color: '#333' }}>🧪 Evidence Log</h4>
            
            {/* List existing evidence */}
            <ul style={{ marginBottom: '10px', paddingLeft: '20px', color: 'black' }}>
                {evidenceList.map(item => (
                    <li key={item.id} style={{ marginBottom: '5px' }}>
                        <span style={{ fontWeight: '500' }}>{item.item_name}</span> 
                        <span style={{ fontSize: '0.9em', color: '#666', marginLeft: '8px' }}>
                             ({item.location})
                        </span>
                    </li>
                ))}
                {evidenceList.length === 0 && <li style={{color: '#999'}}>No evidence logged yet.</li>}
            </ul>

            {/* Form to add new evidence */}
            {canEdit ? (
            <form onSubmit={handleAddEvidence} style={{ display: 'flex', gap: '5px' }}>
                <input 
                    type="text" 
                    placeholder="New Item (e.g. Blood Sample)" 
                    value={newItem} 
                    onChange={(e) => setNewItem(e.target.value)}
                    style={{ 
                        flex: 1, 
                        padding: '8px', 
                        borderRadius: '4px', 
                        border: '1px solid #ccc',
                        background: 'white',
                        color: 'black' 
                    }}
                />
                <button 
                    type="submit" 
                    style={{ 
                        padding: '8px 15px', 
                        cursor: 'pointer', 
                        background: '#333', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px' 
                    }}
                >
                    Add
                </button>
            </form>
            ) : (
                <div style={{ color: '#666', fontStyle: 'italic' }}>You do not have permission to add evidence.</div>
            )}
        </div>
    )
}

export default EvidenceSection