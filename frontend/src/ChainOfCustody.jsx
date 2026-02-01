import { useState, useEffect } from 'react'
import api from './api'

export default function ChainOfCustody({ caseId, canEdit, colors }){
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [eventType, setEventType] = useState('TRANSFER')
  const [notes, setNotes] = useState('')

  useEffect(()=>{
    let mounted = true
    api.get(`chain/?case=${caseId}`)
        .then(res => { if(mounted) setEvents(res.data) })
        .catch(() => {})
        .finally(() => mounted && setLoading(false))
    return ()=>{ mounted=false }
  },[caseId])

  const add = async ()=>{
    if(!canEdit) return alert('No permission')
    if(!notes.trim()) return alert('Please enter a description or name.')
    try{
      const payload = { case: caseId, event_type: eventType, notes }
      const res = await api.post('chain/', payload)
      setEvents(prev => [res.data, ...prev])
      setNotes('')
    } catch(err){ console.error(err); alert('Failed to add event') }
  }

  const remove = async (id) => {
      if(!canEdit) return
      if(!window.confirm("Delete this log entry?")) return
      try {
          await api.delete(`chain/${id}/`)
          setEvents(prev => prev.filter(e => e.id !== id))
      } catch(err) {
          console.error(err)
          alert("Failed to delete event")
      }
  }

  if(loading) return <div style={{color: colors.textMuted, fontSize:'0.9rem'}}>Loading log...</div>

  // --- STYLES ---
  const styles = {
    header: { 
        margin: '0 0 20px 0', 
        color: colors.textMain, 
        borderBottom: `1px solid ${colors.cardBorder}`, 
        paddingBottom: '10px', 
        fontSize: '1.1rem', 
        fontWeight: '600' 
    },
    // Form now uses a grid stack for better spacing
    formStack: {
        display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px', 
        background: colors.bg, padding: '20px', borderRadius: '12px', 
        border: `1px solid ${colors.cardBorder}`
    },
    label: {
        display: 'block', marginBottom: '8px', fontSize: '0.85rem', 
        fontWeight: 'bold', color: colors.textMuted, textTransform: 'uppercase'
    },
    select: {
        width: '100%', padding: '12px', borderRadius: '8px', 
        border: `1px solid ${colors.inputBorder}`, 
        background: colors.inputBg, color: colors.textMain, 
        outline: 'none', fontWeight: '500', fontSize: '1rem'
    },
    textarea: {
        width: '100%', padding: '12px', borderRadius: '8px', 
        border: `1px solid ${colors.inputBorder}`, 
        background: colors.inputBg, color: colors.textMain, 
        outline: 'none', fontFamily: 'inherit', resize: 'vertical', 
        minHeight: '100px', fontSize: '1rem', boxSizing: 'border-box'
    },
    btn: {
        padding: '10px 25px', borderRadius: '8px', border: 'none', 
        background: colors.primary, color: 'white', 
        fontWeight: 'bold', cursor: 'pointer', alignSelf: 'flex-end',
        fontSize: '0.95rem'
    },
    // Timeline Styles
    timelineItem: { display: 'flex', gap: '20px', position: 'relative', paddingBottom: '30px' },
    line: { 
        position: 'absolute', left: '9px', top: '24px', bottom: 0, width: '2px', 
        background: colors.cardBorder 
    },
    dot: { 
        width: '20px', height: '20px', borderRadius: '50%', 
        background: colors.primary, flexShrink: 0, marginTop: '4px',
        boxShadow: `0 0 0 4px ${colors.bg}` // "Gap" effect
    },
    content: { flex: 1, background: colors.bg, padding: '15px', borderRadius: '8px', border: `1px solid ${colors.cardBorder}` },
    meta: { fontSize: '0.85rem', color: colors.textMuted, marginBottom: '8px' },
    action: { fontWeight: 'bold', color: colors.textMain, fontSize: '1rem' },
    noteText: { color: colors.textMain, fontSize: '0.95rem', lineHeight: '1.5' },
    deleteBtn: {
        background: 'transparent', border: 'none', color: colors.danger, 
        fontSize: '1.5rem', cursor: 'pointer', lineHeight: '1',
        padding: '0 0 0 10px', opacity: 0.7, transition: 'opacity 0.2s'
    }
  }

  return (
    <div>
      <h4 style={styles.header}>⛓️ Chain of Custody Log</h4>

      {/* INPUT FORM (Vertical Stack) */}
      {canEdit && (
        <div style={styles.formStack}>
          <div>
            <label style={styles.label}>Event Type</label>
            <select value={eventType} onChange={e=>setEventType(e.target.value)} style={styles.select}>
                <option value="TRANSFER">Transfer (Handover)</option>
                <option value="RECEIPT">Receipt (Check-in)</option>
                <option value="STORAGE">Storage (Cooler/Shelf)</option>
                <option value="RELEASE">Release (To Funeral Home/Police)</option>
                <option value="SEAL">Seal / Unseal Evidence</option>
            </select>
          </div>
          
          <div>
            <label style={styles.label}>Details & Personnel</label>
            <textarea 
                placeholder="Describe condition, location, or name of person handling..." 
                value={notes} 
                onChange={e=>setNotes(e.target.value)} 
                style={styles.textarea} 
            />
          </div>

          <button onClick={add} style={styles.btn}>+ Add Log Entry</button>
        </div>
      )}

      {/* TIMELINE LIST */}
      <div style={{ paddingLeft: '5px' }}>
        {events.length === 0 ? <div style={{color: colors.textMuted, fontStyle:'italic', padding:'20px'}}>No events logged.</div> : (
            events.map((ev, index) => (
                <div key={ev.id} style={styles.timelineItem}>
                    {/* Vertical Line */}
                    {index !== events.length - 1 && <div style={styles.line}></div>}
                    
                    {/* Dot */}
                    <div style={styles.dot}></div>
                    
                    {/* Content Box */}
                    <div style={styles.content}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                            <div>
                                <div style={styles.action}>{ev.event_type}</div>
                                <div style={styles.meta}>{new Date(ev.timestamp).toLocaleString()}</div>
                            </div>
                            {canEdit && (
                                <button 
                                    onClick={() => remove(ev.id)} 
                                    style={styles.deleteBtn} 
                                    title="Delete Entry"
                                    onMouseOver={(e) => e.target.style.opacity = 1}
                                    onMouseOut={(e) => e.target.style.opacity = 0.7}
                                >
                                    &times;
                                </button>
                            )}
                        </div>
                        {ev.notes && <div style={styles.noteText}>{ev.notes}</div>}
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  )
}