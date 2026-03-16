import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const ToastsContext = createContext(null)

export function ToastsProvider({ children }){
  const [toasts, setToasts] = useState([])
  const [confirmState, setConfirmState] = useState(null)

  // derive theme from document attribute or localStorage for adaptive styling
  const getTheme = () => {
    try {
      const dt = document.documentElement.dataset.theme
      if (dt) return dt
    } catch (e) {}
    const stored = localStorage.getItem('theme')
    if (stored) return stored
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  const theme = getTheme()

  const addToast = useCallback((message, opts = {}) => {
    const id = Math.random().toString(36).slice(2,9)
    const toast = { id, message, type: opts.type || 'info', timeout: opts.timeout || 4000 }
    setToasts(t => [toast, ...t])
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(t => t.filter(x => x.id !== id))
  }, [])

  const confirm = useCallback((message, opts = {}) => {
    return new Promise((resolve) => {
      setConfirmState({ message, opts, resolve })
    })
  }, [])

  const prompt = useCallback((message, opts = {}) => {
    return new Promise((resolve) => {
      setConfirmState({ message, opts, resolve, prompt: true })
    })
  }, [])

  useEffect(()=>{
    const timers = toasts.map(t => {
      if(!t.timeout) return null
      const timer = setTimeout(()=> removeToast(t.id), t.timeout)
      return timer
    }).filter(Boolean)
    return () => timers.forEach(clearTimeout)
  }, [toasts, removeToast])

  return (
    <ToastsContext.Provider value={{ toasts, addToast, removeToast, confirm, prompt }}>
      {children}
      <div style={{ position: 'fixed', right: 20, top: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {toasts.map(t => {
          const isDark = theme === 'dark'
          const bg = t.type === 'error' ? (isDark ? '#4c1f1f' : '#fee2e2') : (t.type === 'success' ? (isDark ? '#234b16' : '#ecfccb') : (isDark ? '#0f172a' : '#e6f2ff'))
          const border = t.type === 'error' ? (isDark ? '1px solid #7f1d1d' : '1px solid #fecaca') : '1px solid rgba(0,0,0,0.06)'
          const text = isDark ? '#f8fafc' : '#0f172a'
          return (
            <div key={t.id} style={{ minWidth: 240, padding: '10px 14px', borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.12)', background: bg, color: text, border }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{t.type === 'error' ? 'Error' : (t.type === 'success' ? 'Success' : 'Notice')}</div>
              <div style={{ fontSize: '0.95rem' }}>{t.message}</div>
            </div>
          )
        })}
      </div>
      {/* Confirm / Prompt Modal */}
      {confirmState && (
        <div style={{ position: 'fixed', left:0, top:0, right:0, bottom:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:10000 }}>
          <div style={{ background: theme === 'dark' ? '#0b1220' : 'white', color: theme === 'dark' ? '#f8fafc' : '#0f172a', padding:20, borderRadius:8, width: 460, maxWidth: '95%', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
            <div style={{ fontWeight:700, marginBottom:8 }}>{confirmState.opts.title || (confirmState.prompt ? 'Input required' : 'Please confirm')}</div>
            <div style={{ marginBottom:16 }}>{confirmState.message}</div>
            {confirmState.prompt && (
              <input id="__toast_prompt_input" autoFocus style={{ width: '100%', padding: '8px', marginBottom: 12, borderRadius:6, border: '1px solid #e5e7eb', background: theme === 'dark' ? '#020617' : 'white', color: theme === 'dark' ? '#f8fafc' : '#0f172a' }} defaultValue={confirmState.opts.default || ''} />
            )}
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
              <button onClick={() => { confirmState.resolve(confirmState.prompt ? null : false); setConfirmState(null) }} style={{ padding:'8px 12px', borderRadius:6, border:'1px solid #ddd', background: theme === 'dark' ? '#0b1220' : '#fff', color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>{confirmState.prompt ? 'Cancel' : 'Cancel'}</button>
              <button onClick={() => {
                  if(confirmState.prompt){
                    const val = document.getElementById('__toast_prompt_input')?.value ?? null
                    confirmState.resolve(val)
                  } else {
                    confirmState.resolve(true)
                  }
                  setConfirmState(null)
                }} style={{ padding:'8px 12px', borderRadius:6, border:'none', background: theme === 'dark' ? '#111827' : '#111827', color:'white' }}>{confirmState.prompt ? (confirmState.opts.okText || 'OK') : 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}
    </ToastsContext.Provider>
  )
}

export function useToasts(){
  const ctx = useContext(ToastsContext)
  if(!ctx) throw new Error('useToasts must be used within ToastsProvider')
  return ctx
}

export default ToastsContext
