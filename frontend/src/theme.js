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

// Organization branding functions
export function applyOrganizationBranding(organization) {
  if (!organization) return

  const root = document.documentElement

  // Set organization-specific CSS custom properties
  root.style.setProperty('--org-primary', organization.primary_color || '#2563eb')
  root.style.setProperty('--org-secondary', organization.secondary_color || '#1e40af')

  // Store organization info
  localStorage.setItem('organization', JSON.stringify(organization))
}

export function getStoredOrganization() {
  const org = localStorage.getItem('organization')
  return org ? JSON.parse(org) : null
}

export function clearOrganizationBranding() {
  localStorage.removeItem('organization')
  const root = document.documentElement
  root.style.removeProperty('--org-primary')
  root.style.removeProperty('--org-secondary')
}
