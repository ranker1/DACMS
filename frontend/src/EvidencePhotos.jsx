import { useState, useEffect } from 'react'
import api from './api'

// Helper to handle relative vs absolute URLs
function imageUrl(path){
  if(!path) return ''
  return path.startsWith('http') ? path : `http://127.0.0.1:8000${path}`
}

export default function EvidencePhotos({ caseId, canEdit, colors }){
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [file, setFile] = useState(null)
  const [caption, setCaption] = useState('')
  const [isExhibit, setIsExhibit] = useState(false)

  useEffect(()=>{
    let mounted = true
    api.get(`evidence-photos/?case=${caseId}`)
        .then(res => { if(mounted) setPhotos(res.data) })
        .catch(() => {})
        .finally(() => mounted && setLoading(false))
    return ()=>{ mounted=false }
  },[caseId])

  const upload = async (e) => {
    e.preventDefault() // Prevent form submit refresh if wrapped in form
    if(!canEdit) return alert('No permission')
    if(!file) return alert('Select file')
    
    const fd = new FormData()
    fd.append('case', caseId)
    fd.append('image', file)
    fd.append('caption', caption)
    fd.append('is_exhibit', isExhibit)
    
    try{
      const res = await api.post('evidence-photos/', fd, { headers: {'Content-Type':'multipart/form-data'} })
      setPhotos(prev => [res.data, ...prev])
      setFile(null); setCaption(''); setIsExhibit(false)
      // Reset file input manually
      document.getElementById('fileInput').value = "" 
    } catch(err){ 
        console.error(err); 
        alert('Upload failed') 
    }
  }

  if(loading) return <div style={{color: colors.textMuted, fontSize:'0.9rem'}}>Loading photos...</div>

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
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: '15px',
        marginBottom: '20px'
    },
    card: {
        border: `1px solid ${colors.cardBorder}`,
        borderRadius: '8px',
        overflow: 'hidden',
        background: colors.bg,
        position: 'relative'
    },
    img: {
        width: '100%',
        height: '120px',
        objectFit: 'cover',
        display: 'block'
    },
    captionBox: {
        padding: '10px',
        fontSize: '0.85rem',
        color: colors.textMain
    },
    exhibitBadge: {
        position: 'absolute',
        top: '5px',
        right: '5px',
        background: colors.accent,
        color: 'black',
        fontSize: '0.7rem',
        fontWeight: 'bold',
        padding: '2px 6px',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
    },
    uploadBox: {
        background: colors.bg,
        padding: '15px',
        borderRadius: '8px',
        border: `1px dashed ${colors.cardBorder}`,
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        alignItems: 'center'
    },
    input: {
        padding: '8px',
        borderRadius: '4px',
        border: `1px solid ${colors.inputBorder}`,
        background: colors.inputBg,
        color: colors.textMain,
        outline: 'none',
        flex: 1
    },
    btn: {
        padding: '8px 16px',
        borderRadius: '4px',
        border: 'none',
        background: colors.success,
        color: 'white',
        fontWeight: 'bold',
        cursor: 'pointer'
    }
  }

  return (
    <div>
      <h4 style={styles.header}>📸 Evidence & Scene Photos</h4>
      
      {photos.length === 0 ? (
          <div style={{color: colors.textMuted, fontStyle:'italic', marginBottom:'20px'}}>No photos uploaded.</div>
      ) : (
          <div style={styles.grid}>
            {photos.map(p => (
              <div key={p.id} style={styles.card}>
                <a href={imageUrl(p.image)} target="_blank" rel="noreferrer">
                    <img src={imageUrl(p.image)} alt={p.caption} style={styles.img} />
                </a>
                {p.is_exhibit && <span style={styles.exhibitBadge}>EXHIBIT</span>}
                <div style={styles.captionBox}>
                    {p.caption || <span style={{color: colors.textMuted, fontStyle:'italic'}}>No caption</span>}
                </div>
              </div>
            ))}
          </div>
      )}

      {canEdit && (
        <div style={styles.uploadBox}>
            <input 
                id="fileInput"
                type="file" 
                onChange={e=>setFile(e.target.files[0])} 
                style={{color: colors.textMuted, fontSize:'0.9rem'}} 
            />
            <input 
                placeholder="Enter Caption..." 
                value={caption} 
                onChange={e=>setCaption(e.target.value)} 
                style={styles.input} 
            />
            <label style={{display:'flex', alignItems:'center', gap:'5px', color: colors.textMain, fontSize:'0.9rem', cursor:'pointer'}}>
                <input 
                    type="checkbox" 
                    checked={isExhibit} 
                    onChange={e=>setIsExhibit(e.target.checked)} 
                /> 
                Is Exhibit?
            </label>
            <button onClick={upload} style={styles.btn}>Upload</button>
        </div>
      )}
    </div>
  )
}