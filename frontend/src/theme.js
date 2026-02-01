export function getStoredTheme(){
  return localStorage.getItem('theme')
}

export function setTheme(theme){
  if(theme === 'dark'){
    document.documentElement.setAttribute('data-theme','dark')
    localStorage.setItem('theme','dark')
  } else {
    document.documentElement.removeAttribute('data-theme')
    localStorage.setItem('theme','light')
  }
}

export function initTheme(){
  const stored = getStoredTheme()
  if(stored) return setTheme(stored)
  // Fallback to system preference
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  setTheme(prefersDark ? 'dark' : 'light')
}

export function toggleTheme(){
  const cur = localStorage.getItem('theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  const next = cur === 'dark' ? 'light' : 'dark'
  setTheme(next)
  return next
}
