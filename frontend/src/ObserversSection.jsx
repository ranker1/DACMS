import { useState, useEffect } from 'react'
import api from './api'
import { useToasts } from './Toasts'

export default function ObserversSection({ caseId, canEdit, colors }) {
    const { addToast } = useToasts()
    const [list, setList] = useState([])
    const [loading, setLoading] = useState(true)
    const [name, setName] = useState('')
    const [role, setRole] = useState('OTHER')

    useEffect(() => {
        let mounted = true
        api.get(`observers/?case=${caseId}`)
            .then(res => { if (mounted) setList(res.data) })
            .catch(() => {})
            .finally(() => mounted && setLoading(false))
        return () => { mounted = false }
    }, [caseId])

    const add = async () => {
        if (!canEdit) return addToast('No permission', { type: 'error' })
        try {
            const payload = { case: caseId, name, role }
            const res = await api.post('observers/', payload)
            setList(prev => [...prev, res.data])
            setName('')
            setRole('OTHER')
        } catch (err) { console.error(err); addToast('Failed to add observer', { type: 'error' }) }
    }

    const remove = async (id) => {
        if (!canEdit) return addToast('No permission', { type: 'error' })
        try { 
            await api.delete(`observers/${id}/`)
            setList(prev => prev.filter(x => x.id !== id)) 
        } catch { 
            // Optimistic update fallback
            setList(prev => prev.filter(x => x.id !== id)) 
        }
    }

    if (loading) return <div style={{color: colors.textMuted, fontSize:'0.9rem'}}>Loading observers...</div>

    // --- STYLES ---
    const styles = {
        header: { 
            margin: '0 0 15px 0', 
            color: colors.textMain, 
            borderBottom: `1px solid ${colors.cardBorder}`, 
            paddingBottom: '10px', 
            fontSize: '1.1rem', 
            fontWeight: '600' 
        },
        item: {
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 15px', 
            border: `1px solid ${colors.cardBorder}`, 
            borderRadius: '8px', 
            marginBottom: '8px',
            background: colors.bg, // Uses the page background contrast
            color: colors.textMain
        },
        input: {
            padding: '10px', borderRadius: '6px', 
            border: `1px solid ${colors.inputBorder}`, 
            background: colors.inputBg, 
            color: colors.textMain, 
            outline: 'none',
            fontSize: '0.9rem'
        },
        btn: {
            padding: '10px 20px', borderRadius: '6px', border: 'none', 
            background: colors.primary, color: 'white', 
            fontWeight: 'bold', cursor: 'pointer'
        },
        btnRemove: {
            color: colors.danger, border: 'none', background: 'none', 
            cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem'
        }
    }

    return (
        <div>
            <h4 style={styles.header}>👀 Attendance / Observers</h4>
            
            <div style={{marginBottom:'20px'}}>
                {list.length === 0 ? (
                    <div style={{color: colors.textMuted, fontStyle:'italic', padding:'10px'}}>No observers recorded.</div>
                ) : (
                    <div>
                        {list.map(o => (
                            <div key={o.id} style={styles.item}>
                                <div>
                                    <strong>{o.user ? o.user.username : o.name}</strong> 
                                    <span style={{color: colors.textMuted, marginLeft:'8px', fontSize:'0.85rem'}}>
                                        ({o.role.replace('_', ' ')})
                                    </span>
                                </div>
                                <div>
                                    {canEdit ? (
                                        <button onClick={() => remove(o.id)} style={styles.btnRemove} title="Remove">×</button>
                                    ) : (
                                        <span style={{color: colors.textMuted}}>—</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {canEdit && (
                <div style={{display:'flex', gap:'10px'}}>
                    <input 
                        placeholder="Name" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        style={{...styles.input, flex: 2}} 
                    />
                    <select 
                        value={role} 
                        onChange={e => setRole(e.target.value)} 
                        style={{...styles.input, flex: 1}}
                    >
                        <option value="OTHER">Other</option>
                        <option value="POLICE">Police</option>
                        <option value="TREATING_DOCTOR">Treating Doctor</option>
                        <option value="STUDENT">Student</option>
                        <option value="PHOTOGRAPHER">Photographer</option>
                    </select>
                    <button onClick={add} style={styles.btn}>Add</button>
                </div>
            )}
        </div>
    )
}