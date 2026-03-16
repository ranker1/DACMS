import { useState, useEffect, useMemo } from 'react'
import { useToasts } from './Toasts'

// 2. Injury Palette (moved outside component to avoid recreation)
const injuryTypes = {
    LACERATION: { color: '#dc3545', label: 'Laceration (Cut)', code: 'LAC' },   
    CONTUSION:  { color: '#6610f2', label: 'Contusion (Bruise)', code: 'CONT' }, 
    ABRASION:   { color: '#fd7e14', label: 'Abrasion (Scrape)', code: 'ABR' },   
    GSW:        { color: '#000000', label: 'Gunshot Wound', code: 'GSW' },       
    FRACTURE:   { color: '#28a745', label: 'Fracture', code: 'FX' },             
    SURGICAL:   { color: '#0dcaf0', label: 'Surgical/Scar', code: 'SURG' }       
}

function BodyMap({ existingData, gender, age, onSave, canEdit = true }) {
    const { addToast, confirm, prompt } = useToasts()
    // 1. All Possible Diagrams
    const allDiagrams = {
        MALE: '/diagrams/male.png',
        FEMALE: '/diagrams/female.png',
        INFANT: '/diagrams/infant.png',
        HEAD: '/diagrams/head.png',
        CRANIAL: '/diagrams/cranial.png',
        TRAUMA: '/diagrams/trauma.png' 
    }

    const [availableViews, setAvailableViews] = useState([])
    const [currentView, setCurrentView] = useState('HEAD') 
    const [selectedTool, setSelectedTool] = useState('LACERATION') 
    const [markers, setMarkers] = useState([])

    // --- SMART ALLOCATION LOGIC ---
    const computedViews = useMemo(() => {
        // 1. Start with diagrams available to EVERYONE
        let views = ['HEAD', 'CRANIAL', 'TRAUMA']

        // 2. Add Specific Body Type
        if (age !== null && age < 3) {
            // It is an infant (0-2 years)
            views.unshift('INFANT')
        } else {
            // It is an adult/child
            if (gender === 'F') {
                views.unshift('FEMALE')
            } else {
                // Default to Male for 'M' or Unknown
                views.unshift('MALE')
            }
        }

        return views
    }, [gender, age])

    // Sync availableViews state
    useEffect(() => {
        setAvailableViews(computedViews)
    }, [computedViews])

    // Auto-select the main body view if current is invalid
    useEffect(() => {
        if (!computedViews.includes(currentView)) {
            setCurrentView(computedViews[0])
        }
    }, [computedViews, currentView])

    const [imgSrc, setImgSrc] = useState('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE2IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zZW0iPkxvYWRpbmcgZGlhZ3JhbS4uLjwvdGV4dD48L3N2Zz4=')

    // --- Load Existing Data ---
    useEffect(() => {
        setMarkers(Array.isArray(existingData) ? existingData : [])
    }, [existingData])

    // Set img src when currentView changes
    useEffect(() => {
        setImgSrc(allDiagrams[currentView] || '')
    }, [currentView])

    // --- LIVE UPDATE REMOVED ---

    // --- Image bounds for objectFit: contain ---
    const [imageBounds, setImageBounds] = useState({ actualWidth: 400, actualHeight: 600, offsetX: 0, offsetY: 0 })

    const handleImageLoad = (e) => {
        const img = e.target
        const naturalWidth = img.naturalWidth
        const naturalHeight = img.naturalHeight
        const boxWidth = 400
        const boxHeight = 600
        const scale = Math.min(boxWidth / naturalWidth, boxHeight / naturalHeight)
        const actualWidth = naturalWidth * scale
        const actualHeight = naturalHeight * scale
        const offsetX = (boxWidth - actualWidth) / 2
        const offsetY = (boxHeight - actualHeight) / 2
        setImageBounds({ actualWidth, actualHeight, offsetX, offsetY })
    }

    // --- CLICK HANDLER ---
    const handleMapClick = async (e) => {
        if (!canEdit) return
        const rect = e.target.getBoundingClientRect()
        const xInBox = e.clientX - rect.left
        const yInBox = e.clientY - rect.top
        
        // Check if click is inside the actual image
        if (xInBox < imageBounds.offsetX || xInBox > imageBounds.offsetX + imageBounds.actualWidth ||
            yInBox < imageBounds.offsetY || yInBox > imageBounds.offsetY + imageBounds.actualHeight) {
            return
        }
        
        const xPercent = ((xInBox - imageBounds.offsetX) / imageBounds.actualWidth) * 100
        const yPercent = ((yInBox - imageBounds.offsetY) / imageBounds.actualHeight) * 100
        
        const tool = injuryTypes[selectedTool]
        const details = await prompt(`Describe this ${tool.label}:`, { default: '' })
        
        if (details !== null) {
            setMarkers([...markers, { 
                x: xPercent, 
                y: yPercent, 
                view: currentView,
                type: selectedTool, 
                description: details || 'Unspecified',
                color: tool.color
            }])
        }
    }

    // --- CORRECTION TOOLS ---
    const undoLast = () => { if (markers.length > 0) setMarkers(markers.slice(0, -1)) }
    const clearAll = async () => { const ok = await confirm('Clear ALL injuries?'); if(ok) setMarkers([]) }
    const removeSpecific = async (index) => { const ok = await confirm('Remove injury?'); if(ok) setMarkers(markers.filter((_, i) => i !== index)) }

    return (
        <div style={{ textAlign: 'center' }}>
            
            {/* DYNAMIC VIEW SELECTOR */}
            <div style={{ marginBottom: '15px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {availableViews.map(key => (
                    <button key={key} onClick={() => setCurrentView(key)} style={{ padding: '8px 15px', cursor: 'pointer', background: currentView === key ? '#343a40' : '#f8f9fa', color: currentView === key ? 'white' : 'black', border: '1px solid #ccc', borderRadius: '4px', fontWeight: 'bold' }}>
                        {key}
                    </button>
                ))}
            </div>

            {/* INJURY PALETTE */}
            <div style={{ marginBottom: '10px', padding: '10px', background: '#f1f1f1', borderRadius: '8px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {Object.keys(injuryTypes).map(key => (
                    <button key={key} onClick={() => setSelectedTool(key)} style={{ padding: '6px 12px', cursor: 'pointer', background: selectedTool === key ? 'white' : 'transparent', color: 'black', border: selectedTool === key ? `2px solid ${injuryTypes[key].color}` : '1px solid transparent', boxShadow: selectedTool === key ? '0 2px 5px rgba(0,0,0,0.1)' : 'none', borderRadius: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: injuryTypes[key].color }}></span>
                        {injuryTypes[key].label}
                    </button>
                ))}
            </div>

            {/* TOOLBAR */}
            <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
                <button onClick={undoLast} disabled={markers.length === 0} style={{ padding: '5px 15px', cursor: 'pointer', background: '#ffc107', border: '1px solid #d39e00', borderRadius: '4px' }}>↩ Undo Last</button>
                <button onClick={clearAll} disabled={markers.length === 0} style={{ padding: '5px 15px', cursor: 'pointer', background: '#dc3545', color: 'white', border: '1px solid #a71d2a', borderRadius: '4px' }}>🗑️ Clear All</button>
            </div>

            {/* WORKSPACE */}
            <div style={{ position: 'relative', display: 'inline-block', border: '4px solid #333', background: 'white', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }}>
                <img src={imgSrc} alt="Body Map" onClick={handleMapClick} onLoad={handleImageLoad} onError={() => setImgSrc('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE2IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zZW0iPkRpYWdyYW0gbm90IGF2YWlsYWJsZTwvdGV4dD48L3N2Zz4=')} style={{ width: '400px', height: '600px', objectFit: 'contain', display: 'block', cursor: 'crosshair' }} />
                
                {markers.filter(m => m.view === currentView).map((m, i) => {
                    const globalIndex = markers.indexOf(m)
                    const pixelX = imageBounds.offsetX + (m.x / 100) * imageBounds.actualWidth
                    const pixelY = imageBounds.offsetY + (m.y / 100) * imageBounds.actualHeight
                    return (
                        <div key={i} onClick={(e) => { e.stopPropagation(); removeSpecific(globalIndex); }} title={`${injuryTypes[m.type].label}: ${m.description}`} style={{ position: 'absolute', left: `${pixelX}px`, top: `${pixelY}px`, width: '20px', height: '20px', background: m.color, borderRadius: '50%', border: '2px solid white', cursor: 'pointer', transform: 'translate(-50%, -50%)', boxShadow: '0 2px 4px rgba(0,0,0,0.5)', color: 'white', fontSize: '10px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            {globalIndex + 1}
                        </div>
                    )
                })}
            </div>

            {/* INJURY LIST */}
            <div style={{ marginTop: '20px', maxWidth: '700px', margin: '20px auto', textAlign: 'left' }}>
                <h4>🩹 Recorded Injuries:</h4>
                <ul style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #ddd', maxHeight: '200px', overflowY: 'auto' }}>
                    {markers.length === 0 ? <li style={{color:'#ccc'}}>No injuries marked yet.</li> : 
                        markers.map((m, i) => (
                            <li key={i} style={{ marginBottom: '8px', borderBottom: '1px solid #eee', paddingBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ background: m.color, color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8em', fontWeight: 'bold' }}>
                                    {i + 1}
                                </span>
                                <strong>[{m.view}]</strong> 
                                <span style={{ color: m.color, fontWeight: 'bold' }}>
                                    {injuryTypes[m.type] ? injuryTypes[m.type].label : m.type}
                                </span>: 
                                {m.description}
                                <button onClick={() => removeSpecific(i)} style={{ marginLeft: 'auto', color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
                            </li>
                        ))
                    }
                </ul>
                <>
                {canEdit && (
                    <button onClick={() => {
                    const txt = markers.map((m, i) => `${i+1}. [${m.view}] ${injuryTypes[m.type]?.label || m.type}: ${m.description}`).join('\n')
                    const json = markers
                    onSave(txt, json)
                    addToast('Body map injuries saved!', { type: 'success' })
                    }} style={{marginTop:'10px', background:'#007bff', color:'white', border:'none', padding:'8px 16px', borderRadius:'4px', cursor:'pointer'}}>💾 Save Injuries</button>
                )}
                {!canEdit && <div style={{marginTop:'10px', color:'#666', fontStyle:'italic'}}>You do not have permission to modify the body map.</div>}
                </>
            </div>
        </div>
    )
}

export default BodyMap