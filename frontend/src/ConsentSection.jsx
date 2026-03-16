import { useState, useEffect } from 'react'
import { useToasts } from './Toasts'
import api from './api'

export default function ConsentSection({ caseId, canEdit, colors }){
  const [consent, setConsent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [file, setFile] = useState(null)

  useEffect(()=>{
    let mounted = true
    api.get(`consents/?case=${caseId}`).then(res=>{
      if(!mounted) return
      setConsent(res.data[0] || null)
    }).catch(()=>{
      // ignore - mock mode or 404
    }).finally(()=>mounted && setLoading(false))
    return ()=>{ mounted=false }
  },[caseId])

  const { addToast } = useToasts()
  const handleSubmit = async (e) =>{
    e.preventDefault()
    if(!canEdit) return addToast('No permission', { type: 'error' })
    
    const form = new FormData()
    form.append('case', caseId)
    form.append('consent_given', e.target.consent_given.checked)
    form.append('signer_name', e.target.signer_name.value)
    form.append('relationship', e.target.relationship.value)
    form.append('signed_at', e.target.signed_at.value || '')
    form.append('notes', e.target.notes.value)
    if(file) form.append('form_file', file)

    try{
      if(consent && consent.id){
        const res = await api.patch(`consents/${consent.id}/`, form, { headers: {'Content-Type': 'multipart/form-data'} })
        setConsent(res.data)
        addToast('Consent updated', { type: 'success' })
      } else {
        const res = await api.post('consents/', form, { headers: {'Content-Type': 'multipart/form-data'} })
        setConsent(res.data)
        addToast('Consent created', { type: 'success' })
      }
    } catch(err){
      console.error(err)
      addToast('Failed to save consent', { type: 'error' })
    }
  }

  if(loading) return <div style={{color: colors.textMuted, fontSize:'0.9rem'}}>Loading consent data...</div>

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
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' },
    label: { display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '0.9rem', color: colors.textMuted },
    input: {
        width: '100%', padding: '10px', borderRadius: '6px', 
        border: `1px solid ${colors.inputBorder}`, 
        background: colors.inputBg, color: colors.textMain, 
        outline: 'none', boxSizing: 'border-box'
    },
    textarea: {
        width: '100%', padding: '10px', borderRadius: '6px', 
        border: `1px solid ${colors.inputBorder}`, 
        background: colors.inputBg, color: colors.textMain, 
        outline: 'none', boxSizing: 'border-box', minHeight: '80px', fontFamily: 'inherit'
    },
    checkboxWrapper: {
        display: 'flex', alignItems: 'center', gap: '10px', 
        background: colors.bg, padding: '10px', borderRadius: '6px', border: `1px solid ${colors.cardBorder}`,
        marginBottom: '20px', cursor: 'pointer'
    },
    btn: {
        padding: '10px 25px', borderRadius: '6px', border: 'none', 
        background: colors.primary, color: 'white', 
        fontWeight: 'bold', cursor: 'pointer'
    },
    fileLink: {
        display: 'inline-block', marginTop: '10px', 
        color: colors.primary, textDecoration: 'none', fontWeight: '500',
        background: colors.bg, padding: '8px 12px', borderRadius: '6px', border: `1px solid ${colors.cardBorder}`
    }
  }

  return (
    <div>
      <h4 style={styles.header}>📝 Clinical Autopsy Consent</h4>
      
      <form onSubmit={handleSubmit}>
        
        {/* Checkbox Banner */}
        <label style={styles.checkboxWrapper}>
            <input 
                type="checkbox" 
                name="consent_given" 
                defaultChecked={consent?.consent_given} 
                disabled={!canEdit} 
                style={{width:'18px', height:'18px'}}
            /> 
            <span style={{color: colors.textMain, fontWeight: '600'}}>Consent Given by Next of Kin</span>
        </label>

        <div style={styles.formGrid}>
            <div>
                <label style={styles.label}>Signer Name</label>
                <input name="signer_name" defaultValue={consent?.signer_name || ''} disabled={!canEdit} style={styles.input} placeholder="Full Name" />
            </div>
            <div>
                <label style={styles.label}>Relationship</label>
                <input name="relationship" defaultValue={consent?.relationship || ''} disabled={!canEdit} style={styles.input} placeholder="e.g. Spouse, Parent" />
            </div>
            <div>
                <label style={styles.label}>Date Signed</label>
                <input type="datetime-local" name="signed_at" defaultValue={consent?.signed_at ? consent.signed_at.slice(0,16) : ''} disabled={!canEdit} style={styles.input} />
            </div>
            <div>
                <label style={styles.label}>Upload Scanned Form</label>
                <input type="file" onChange={e=>setFile(e.target.files[0])} disabled={!canEdit} style={{...styles.input, padding: '7px'}} />
            </div>
        </div>

        <div style={{marginBottom: '20px'}}>
            <label style={styles.label}>Additional Notes / Restrictions</label>
            <textarea name="notes" defaultValue={consent?.notes || ''} disabled={!canEdit} style={styles.textarea} placeholder="e.g. Restrictions on organ retention..." />
        </div>

        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            {canEdit ? (
                <button type="submit" style={styles.btn}>💾 Save Consent Record</button>
            ) : (
                <div style={{color: colors.textMuted, fontStyle:'italic'}}>View-only access.</div>
            )}

            {consent?.form_file && (
                <a 
                    href={consent.form_file.startsWith('http') ? consent.form_file : `http://127.0.0.1:8000${consent.form_file}`} 
                    target="_blank" rel="noreferrer"
                    style={styles.fileLink}
                >
                    📄 View Uploaded Form
                </a>
            )}
        </div>

      </form>
    </div>
  )
}