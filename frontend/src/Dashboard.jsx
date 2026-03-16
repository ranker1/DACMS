import { useState, useEffect } from 'react'
import api from './api'
import { Link } from 'react-router-dom'
import RegisterCase from './RegisterCase'
import RegisterUser from './RegisterUser'
import { setTheme as applyTheme } from './theme'
import { useToasts } from './Toasts'
import QRCodeModal from './QRCodeModal'
import ManageUsersModal from './ManageUsersModal'

// --- REUSABLE LOGO COMPONENT ---
const MinistryLogo = ({ size = 55, alt = 'MoH Logo' }) => {
    const [failed, setFailed] = useState(false)
    if (!failed) {
        return (
            <img
                src="/moh-logo.png" alt={alt} width={size} height={size}
                style={{ borderRadius: '10%', objectFit: 'contain', border: '1px solid rgba(0,0,0,0.1)' }}
                onError={() => setFailed(true)}
            />
        )
    }
    return (
        <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" rx="8" fill="#FFFFFF" stroke="#0f172a" strokeWidth="2"/>
            <rect x="15" y="40" width="70" height="20" fill="#000000"/>
            <rect x="40" y="15" width="20" height="70" fill="#000000"/>
            <path d="M50 10 L70 25 L70 60 L50 75 L30 60 L30 25 Z" fill="none" stroke="#0f172a" strokeWidth="3"/>
            <rect x="45" y="35" width="10" height="30" fill="#DC2626"/>
            <rect x="35" y="45" width="30" height="10" fill="#DC2626"/>
            <text x="50" y="85" textAnchor="middle" fontSize="6" fill="#0f172a" fontWeight="bold">MOH</text>
        </svg>
    )
}

// --- ADD HOSPITAL MODAL ---
const AddHospitalModal = ({ onClose, onSuccess, isDark }) => {
    const { addToast } = useToasts()
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
        primary_color: '#2563eb',
        secondary_color: '#1e40af',
        org_type: 'HOSPITAL',
        department: 'Department of Forensic Pathology',
    })

    const colors = {
        bg: isDark ? '#0f172a' : '#ffffff',
        cardBorder: isDark ? '#1e3a5f' : '#d1d5db',
        textMain: isDark ? '#e8f0ff' : '#111827',
        textMuted: isDark ? '#6b8fb8' : '#6b7280',
        inputBg: isDark ? '#0d1a2e' : '#f9fafb',
        inputBorder: isDark ? '#1e3a5f' : '#d1d5db',
        labelColor: isDark ? '#93b4d4' : '#374151',
        primary: '#007bff',
        primaryLight: isDark ? '#60a5fa' : '#007bff',
        danger: isDark ? '#f87171' : '#dc2626',
        overlay: 'rgba(0,0,0,0.7)',
    }

    const styles = {
        overlay: {
            position: 'fixed', inset: 0, background: colors.overlay,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '20px',
        },
        modal: {
            background: colors.bg, borderRadius: '12px', width: '100%', maxWidth: '540px',
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
            overflow: 'hidden',
        },
        modalHeader: {
            background: isDark ? '#0d1a2e' : '#005fcc',
            padding: '20px 24px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderBottom: `3px solid ${colors.primaryLight}`,
        },
        modalTitle: { margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#ffffff' },
        modalSub: { margin: '3px 0 0 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)' },
        closeBtn: {
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            color: '#ffffff', borderRadius: '6px', padding: '6px 10px',
            cursor: 'pointer', fontSize: '1rem', lineHeight: 1,
        },
        body: { padding: '24px' },
        row: { marginBottom: '16px' },
        label: {
            display: 'block', fontSize: '0.82rem', fontWeight: '600',
            color: colors.labelColor, marginBottom: '6px', letterSpacing: '0.02em',
        },
        input: {
            width: '100%', padding: '9px 12px', borderRadius: '6px',
            border: `1px solid ${colors.inputBorder}`, background: colors.inputBg,
            color: colors.textMain, fontSize: '0.9rem', fontFamily: 'inherit',
            boxSizing: 'border-box', outline: 'none',
        },
        twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' },
        colorRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' },
        colorLabel: {
            display: 'block', fontSize: '0.82rem', fontWeight: '600',
            color: colors.labelColor, marginBottom: '6px',
        },
        colorWrap: {
            display: 'flex', alignItems: 'center', gap: '10px',
            background: colors.inputBg, border: `1px solid ${colors.inputBorder}`,
            borderRadius: '6px', padding: '6px 10px',
        },
        colorInput: { width: '32px', height: '32px', border: 'none', borderRadius: '4px', cursor: 'pointer', background: 'none', padding: 0 },
        colorHex: { fontSize: '0.85rem', color: colors.textMuted, fontFamily: 'monospace' },
        footer: {
            padding: '16px 24px', borderTop: `1px solid ${colors.cardBorder}`,
            display: 'flex', justifyContent: 'flex-end', gap: '10px',
            background: isDark ? 'rgba(0,0,0,0.2)' : '#f9fafb',
        },
        cancelBtn: {
            padding: '9px 18px', borderRadius: '6px', cursor: 'pointer',
            fontWeight: '600', fontSize: '0.88rem', fontFamily: 'inherit',
            background: 'transparent', color: colors.textMuted,
            border: `1px solid ${colors.cardBorder}`,
        },
        submitBtn: {
            padding: '9px 22px', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: '600', fontSize: '0.88rem', fontFamily: 'inherit',
            background: loading ? '#0056b3' : colors.primary,
            color: '#ffffff', border: 'none', opacity: loading ? 0.7 : 1,
        },
        required: { color: colors.danger, marginLeft: '2px' },
    }

    const set = (field, val) => setForm(f => ({ ...f, [field]: val }))

    const handleSubmit = async () => {
        if (!form.name.trim()) { addToast('Hospital name is required', { type: 'error' }); return }
        setLoading(true)
        try {
            await api.post('organizations/', form)
            addToast(`${form.name} added successfully!`, { type: 'success' })
            onSuccess()
            onClose()
        } catch (err) {
            console.error(err)
            addToast('Failed to add hospital. Check your input and try again.', { type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={styles.modal}>
                {/* HEADER */}
                <div style={styles.modalHeader}>
                    <div>
                        <h2 style={styles.modalTitle}>🏥 Register New Hospital</h2>
                        <p style={styles.modalSub}>Ministry of Health — Kenya · DACMS</p>
                    </div>
                    <button style={styles.closeBtn} onClick={onClose}>✕</button>
                </div>

                {/* BODY */}
                <div style={styles.body}>
                    {/* Name */}
                    <div style={styles.row}>
                        <label style={styles.label}>Hospital Name <span style={styles.required}>*</span></label>
                        <input
                            style={styles.input}
                            placeholder="e.g. Kenyatta National Hospital"
                            value={form.name}
                            onChange={e => set('name', e.target.value)}
                        />
                    </div>

                    {/* Department */}
                    <div style={styles.row}>
                        <label style={styles.label}>Department</label>
                        <input
                            style={styles.input}
                            placeholder="e.g. Department of Forensic Pathology"
                            value={form.department}
                            onChange={e => set('department', e.target.value)}
                        />
                    </div>

                    {/* Address */}
                    <div style={styles.row}>
                        <label style={styles.label}>Address</label>
                        <input
                            style={styles.input}
                            placeholder="e.g. Hospital Rd, Nairobi, Nairobi County"
                            value={form.address}
                            onChange={e => set('address', e.target.value)}
                        />
                    </div>

                    {/* Phone & Email */}
                    <div style={styles.twoCol}>
                        <div>
                            <label style={styles.label}>Phone</label>
                            <input
                                style={styles.input}
                                placeholder="+254 700 000 000"
                                value={form.phone}
                                onChange={e => set('phone', e.target.value)}
                            />
                        </div>
                        <div>
                            <label style={styles.label}>Email</label>
                            <input
                                style={styles.input}
                                type="email"
                                placeholder="info@hospital.go.ke"
                                value={form.email}
                                onChange={e => set('email', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Colors */}
                    <div style={styles.colorRow}>
                        <div>
                            <label style={styles.colorLabel}>Primary Color</label>
                            <div style={styles.colorWrap}>
                                <input
                                    type="color" style={styles.colorInput}
                                    value={form.primary_color}
                                    onChange={e => set('primary_color', e.target.value)}
                                />
                                <span style={styles.colorHex}>{form.primary_color}</span>
                            </div>
                        </div>
                        <div>
                            <label style={styles.colorLabel}>Secondary Color</label>
                            <div style={styles.colorWrap}>
                                <input
                                    type="color" style={styles.colorInput}
                                    value={form.secondary_color}
                                    onChange={e => set('secondary_color', e.target.value)}
                                />
                                <span style={styles.colorHex}>{form.secondary_color}</span>
                            </div>
                        </div>
                    </div>

                    {/* Org Type */}
                    <div style={styles.row}>
                        <label style={styles.label}>Institution Type</label>
                        <select
                            style={styles.input}
                            value={form.org_type}
                            onChange={e => set('org_type', e.target.value)}
                        >
                            <option value="HOSPITAL">Government Hospital</option>
                            <option value="PRIVATE">Private Institution</option>
                        </select>
                    </div>
                </div>

                {/* FOOTER */}
                <div style={styles.footer}>
                    <button style={styles.cancelBtn} onClick={onClose}>Cancel</button>
                    <button style={styles.submitBtn} onClick={handleSubmit} disabled={loading}>
                        {loading ? '⏳ Registering...' : '✓ Register Hospital'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// --- MINISTRY DASHBOARD ---
const MinistryDashboard = ({ organizations, onSelectHospital, theme, toggleTheme, onLogout, role, organization, onRefresh }) => {
    const isDark = theme === 'dark'
    const { addToast } = useToasts()
    const [showAddModal, setShowAddModal] = useState(false)
    const [deactivating, setDeactivating] = useState(null)
    const [showInactive, setShowInactive] = useState(false)
    const [manageUsersFor, setManageUsersFor] = useState(null)

    const colors = {
        bg: isDark ? '#0f172a' : '#f0f4ff',
        cardBg: isDark ? '#0d1a2e' : '#ffffff',
        cardBorder: isDark ? '#1e3a5f' : '#c8d8f0',
        textMain: isDark ? '#e8f0ff' : '#0a1020',
        textMuted: isDark ? '#6b8fb8' : '#3d5a80',
        primary: '#007bff',
        primaryLight: isDark ? '#60a5fa' : '#007bff',
        accent: '#dc3545',
        headerBg: isDark ? '#0d1a2e' : '#007bff',
        success: isDark ? '#4ade80' : '#16a34a',
        warning: isDark ? '#fbbf24' : '#d97706',
    }

    const handleDeactivate = async (org) => {
        if (!window.confirm(`Deactivate "${org.name}"? Their staff will lose access until reactivated.`)) return
        setDeactivating(org.id)
        try {
            await api.patch(`organizations/${org.id}/`, { is_active: false })
            addToast(`${org.name} has been deactivated.`, { type: 'success' })
            onRefresh()
        } catch (err) {
            console.error(err)
            addToast('Failed to deactivate hospital.', { type: 'error' })
        } finally {
            setDeactivating(null)
        }
    }

    const handleReactivate = async (org) => {
        setDeactivating(org.id)
        try {
            await api.patch(`organizations/${org.id}/`, { is_active: true })
            addToast(`${org.name} has been reactivated.`, { type: 'success' })
            onRefresh()
        } catch (err) {
            console.error(err)
            addToast('Failed to reactivate hospital.', { type: 'error' })
        } finally {
            setDeactivating(null)
        }
    }

    const activeOrgs = organizations.filter(o => o.is_active)
    const inactiveOrgs = organizations.filter(o => !o.is_active)
    const totalCases = activeOrgs.reduce((sum, o) => sum + (o.case_count || 0), 0)

    const styles = {
        page: { minHeight: '100vh', backgroundColor: colors.bg, fontFamily: "'Georgia', 'Times New Roman', serif", color: colors.textMain },
        header: {
            background: colors.headerBg, borderBottom: `4px solid ${colors.primary}`,
            padding: '0 40px', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', minHeight: '80px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        },
        headerLeft: { display: 'flex', alignItems: 'center', gap: '18px' },
        headerTitle: { margin: 0, fontSize: '1.4rem', fontWeight: '700', color: '#ffffff', letterSpacing: '0.02em', lineHeight: 1.2 },
        headerSub: { margin: 0, fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '3px' },
        headerRight: { display: 'flex', gap: '10px', alignItems: 'center' },
        btn: (variant = 'primary') => ({
            padding: '8px 16px', borderRadius: '4px', cursor: 'pointer',
            fontWeight: '600', fontSize: '0.85rem', fontFamily: 'inherit',
            background: variant === 'primary' ? colors.primary
                : variant === 'danger' ? colors.accent
                : variant === 'success' ? colors.success
                : 'transparent',
            color: variant === 'ghost' ? 'rgba(255,255,255,0.8)' : '#ffffff',
            border: variant === 'ghost' ? '1px solid rgba(255,255,255,0.3)' : 'none',
            transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: '6px',
        }),
        addBtn: {
            padding: '9px 20px', borderRadius: '6px', cursor: 'pointer',
            fontWeight: '700', fontSize: '0.9rem', fontFamily: 'inherit',
            background: colors.primary, color: '#ffffff', border: '2px solid rgba(255,255,255,0.2)',
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            boxShadow: '0 2px 8px rgba(0,123,255,0.4)',
        },
        body: { maxWidth: '1300px', margin: '0 auto', padding: '40px 30px' },
        heroBar: {
            background: isDark
                ? 'linear-gradient(135deg, #0d1a2e 0%, #1a2e4a 100%)'
                : 'linear-gradient(135deg, #0062cc 0%, #007bff 100%)',
            borderRadius: '12px', padding: '30px 35px', marginBottom: '40px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            boxShadow: '0 8px 32px rgba(0,123,255,0.3)',
            border: `1px solid ${isDark ? '#1e3a5f' : '#0062cc'}`,
        },
        heroTitle: { margin: 0, fontSize: '1.8rem', fontWeight: '700', color: '#ffffff' },
        heroSub: { margin: '6px 0 0 0', color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem' },
        statPill: {
            background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px', padding: '12px 20px', textAlign: 'center', minWidth: '100px',
        },
        statNum: { fontSize: '2rem', fontWeight: '700', color: '#ffffff', display: 'block', lineHeight: 1 },
        statLabel: { fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px', display: 'block' },
        sectionRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' },
        sectionTitle: { fontSize: '1rem', fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.12em', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 },
        divider: { flex: 1, height: '1px', background: colors.cardBorder },
        grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' },
        hospitalCard: (isActive) => ({
            background: isActive ? colors.cardBg : (isDark ? '#0d1520' : '#f5f5f5'),
            border: `1px solid ${isActive ? colors.cardBorder : (isDark ? '#1a2a3a' : '#d1d5db')}`,
            borderRadius: '10px', padding: '24px', cursor: isActive ? 'default' : 'default',
            transition: 'all 0.2s ease', position: 'relative', overflow: 'hidden',
            boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.4)' : '0 1px 4px rgba(0,0,0,0.08)',
            opacity: isActive ? 1 : 0.6,
        }),
        cardAccent: (isActive) => ({
            position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
            background: isActive
                ? `linear-gradient(90deg, ${colors.primary}, ${colors.primaryLight})`
                : '#9ca3af',
        }),
        hospitalName: (isActive) => ({
            margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: '700',
            color: isActive ? colors.textMain : colors.textMuted,
        }),
        hospitalAddress: { margin: 0, fontSize: '0.82rem', color: colors.textMuted, display: 'flex', alignItems: 'flex-start', gap: '5px' },
        cardStats: { display: 'flex', gap: '12px', marginTop: '16px', paddingTop: '14px', borderTop: `1px solid ${colors.cardBorder}` },
        cardStat: { flex: 1, textAlign: 'center', padding: '8px', borderRadius: '6px', background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' },
        cardStatNum: (color) => ({ fontSize: '1.3rem', fontWeight: '700', color: color || colors.primaryLight, display: 'block', lineHeight: 1 }),
        cardStatLabel: { fontSize: '0.68rem', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '3px', display: 'block' },
        cardActions: { display: 'flex', gap: '8px', marginTop: '14px' },
        viewBtn: {
            flex: 1, padding: '8px', borderRadius: '6px',
            border: `1px solid ${colors.primary}`, background: 'transparent',
            color: colors.primaryLight, fontWeight: '600', fontSize: '0.82rem',
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
        },
        deactivateBtn: (isActive) => ({
            padding: '8px 12px', borderRadius: '6px', fontWeight: '600', fontSize: '0.78rem',
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
            border: isActive ? `1px solid ${colors.warning}` : `1px solid ${colors.success}`,
            background: 'transparent',
            color: isActive ? colors.warning : colors.success,
            whiteSpace: 'nowrap',
        }),
        inactiveBadge: {
            display: 'inline-block', background: isDark ? 'rgba(156,163,175,0.15)' : '#f3f4f6',
            border: '1px solid #9ca3af', color: '#9ca3af',
            borderRadius: '99px', padding: '2px 8px', fontSize: '0.7rem', fontWeight: '700',
            textTransform: 'uppercase', letterSpacing: '0.06em', marginLeft: '8px',
        },
        toggleInactive: {
            padding: '6px 14px', borderRadius: '6px', cursor: 'pointer',
            fontSize: '0.8rem', fontWeight: '600', fontFamily: 'inherit',
            background: 'transparent',
            border: `1px solid ${colors.cardBorder}`,
            color: colors.textMuted,
        },
        roleTag: {
            background: 'rgba(0,123,255,0.15)', border: `1px solid ${colors.primaryLight}`,
            color: colors.primaryLight, borderRadius: '4px', padding: '3px 10px',
            fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase',
        },
    }

    return (
        <div style={styles.page}>
            {/* HEADER */}
            <div style={styles.header}>
                <div style={styles.headerLeft}>
                    <MinistryLogo size={50} />
                    <div>
                        <h1 style={styles.headerTitle}>Ministry of Health — Kenya</h1>
                        <p style={styles.headerSub}>Digital Autopsy Case Management System · National Administration</p>
                    </div>
                </div>
                <div style={styles.headerRight}>
                    <span style={styles.roleTag}>Ministry Admin</span>
                    <button style={styles.btn('ghost')} onClick={toggleTheme}>{isDark ? '☀️' : '🌙'}</button>
                    <button style={styles.btn('danger')} onClick={onLogout}>Logout ➜</button>
                </div>
            </div>

            <div style={styles.body}>
                {/* HERO */}
                <div style={styles.heroBar}>
                    <div>
                        <h2 style={styles.heroTitle}>National Forensic Pathology Overview</h2>
                        <p style={styles.heroSub}>Manage hospitals and view autopsy cases across all registered facilities.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={styles.statPill}>
                            <span style={styles.statNum}>{activeOrgs.length}</span>
                            <span style={styles.statLabel}>Active Hospitals</span>
                        </div>
                        <div style={styles.statPill}>
                            <span style={styles.statNum}>{totalCases}</span>
                            <span style={styles.statLabel}>Total Cases</span>
                        </div>
                        <button style={styles.addBtn} onClick={() => setShowAddModal(true)}>
                            ＋ Add Hospital
                        </button>
                    </div>
                </div>

                {/* ACTIVE HOSPITALS */}
                <div style={styles.sectionRow}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                        <span style={styles.sectionTitle}>Active Hospitals</span>
                        <div style={styles.divider} />
                    </div>
                    {inactiveOrgs.length > 0 && (
                        <button style={styles.toggleInactive} onClick={() => setShowInactive(v => !v)}>
                            {showInactive ? 'Hide' : 'Show'} Inactive ({inactiveOrgs.length})
                        </button>
                    )}
                </div>

                {activeOrgs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: colors.textMuted }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🏥</div>
                        <p>No active hospitals registered. Click <strong>+ Add Hospital</strong> to get started.</p>
                    </div>
                ) : (
                    <div style={styles.grid}>
                        {activeOrgs.map(org => (
                            <HospitalCard
                                key={org.id} org={org} isActive={true}
                                styles={styles} colors={colors}
                                onView={() => onSelectHospital(org)}
                                onDeactivate={() => handleDeactivate(org)}
                                isDeactivating={deactivating === org.id}
                                isDark={isDark}
                                onManageUsers={() => setManageUsersFor(org)}
                            />
                        ))}
                    </div>
                )}

                {/* INACTIVE HOSPITALS */}
                {showInactive && inactiveOrgs.length > 0 && (
                    <>
                        <div style={{ ...styles.sectionRow, marginTop: '40px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                                <span style={{ ...styles.sectionTitle, color: '#9ca3af' }}>Inactive Hospitals</span>
                                <div style={styles.divider} />
                            </div>
                        </div>
                        <div style={styles.grid}>
                            {inactiveOrgs.map(org => (
                                <HospitalCard
                                    key={org.id} org={org} isActive={false}
                                    styles={styles} colors={colors}
                                    onView={null}
                                    onReactivate={() => handleReactivate(org)}
                                    isDeactivating={deactivating === org.id}
                                    isDark={isDark}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* ADD HOSPITAL MODAL */}
            {showAddModal && (
                <AddHospitalModal
                    isDark={isDark}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={onRefresh}
                />
            )}

            {/* MANAGE USERS MODAL */}
            {manageUsersFor && (
                <ManageUsersModal
                    hospital={manageUsersFor}
                    isDark={isDark}
                    onClose={() => setManageUsersFor(null)}
                />
            )}
        </div>
    )
}

// --- HOSPITAL CARD (extracted for clarity) ---
const HospitalCard = ({ org, isActive, styles, colors, onView, onDeactivate, onReactivate, isDeactivating, isDark, onManageUsers }) => (
    <div style={styles.hospitalCard(isActive)}>
        <div style={styles.cardAccent(isActive)} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h3 style={styles.hospitalName(isActive)}>
                🏥 {org.name}
                {!isActive && <span style={styles.inactiveBadge}>Inactive</span>}
            </h3>
        </div>
        <p style={styles.hospitalAddress}>
            📍 {org.address || 'Address not specified'}
        </p>
        {(org.phone || org.email) && (
            <p style={{ ...styles.hospitalAddress, marginTop: '4px' }}>
                {org.phone && <span>📞 {org.phone}</span>}
                {org.phone && org.email && <span style={{ margin: '0 6px', color: colors.textMuted }}>·</span>}
                {org.email && <span>✉ {org.email}</span>}
            </p>
        )}

        <div style={styles.cardStats}>
            <div style={styles.cardStat}>
                <span style={styles.cardStatNum(isActive ? colors.primaryLight : '#9ca3af')}>
                    {org.case_count ?? '—'}
                </span>
                <span style={styles.cardStatLabel}>Total Cases</span>
            </div>
        </div>

        <div style={styles.cardActions}>
            {isActive && onView && (
                <button
                    style={styles.viewBtn}
                    onClick={onView}
                    onMouseEnter={e => { e.currentTarget.style.background = colors.primary; e.currentTarget.style.color = '#ffffff' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = colors.primaryLight }}
                >
                    View Cases →
                </button>
            )}
            {isActive && onManageUsers && (
                <button
                    style={{
                        padding: '8px 12px', borderRadius: '6px', fontWeight: '600', fontSize: '0.78rem',
                        cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                        border: `1px solid ${colors.primaryLight}`,
                        background: 'transparent', color: colors.primaryLight, whiteSpace: 'nowrap',
                    }}
                    onClick={onManageUsers}
                >
                    👤 Users
                </button>
            )}
            {isActive && onDeactivate && (
                <button
                    style={styles.deactivateBtn(true)}
                    onClick={onDeactivate}
                    disabled={isDeactivating}
                >
                    {isDeactivating ? '...' : '⊘ Deactivate'}
                </button>
            )}
            {!isActive && onReactivate && (
                <button
                    style={{ ...styles.deactivateBtn(false), flex: 1, justifyContent: 'center', display: 'flex' }}
                    onClick={onReactivate}
                    disabled={isDeactivating}
                >
                    {isDeactivating ? '...' : '↺ Reactivate'}
                </button>
            )}
        </div>
    </div>
)

// --- HOSPITAL CASE VIEW (read-only for ministry admin) ---
const HospitalCaseView = ({ hospital, cases, role, theme, toggleTheme, onLogout, onBack }) => {
    const isDark = theme === 'dark'
    const colors = {
        bg: isDark ? '#0f172a' : '#f8fafc',
        cardBg: isDark ? '#1e293b' : '#ffffff',
        cardBorder: isDark ? '#334155' : '#e2e8f0',
        textMain: isDark ? '#f1f5f9' : '#0f172a',
        textMuted: isDark ? '#94a3b8' : '#64748b',
        primary: isDark ? '#60a5fa' : '#007bff',
        accent: isDark ? '#fbbf24' : '#f59e0b',
        danger: isDark ? '#f87171' : '#ef4444',
        success: isDark ? '#4ade80' : '#10b981',
        ministryBlue: isDark ? '#60a5fa' : '#007bff',
    }
    const styles = {
        container: { maxWidth: '1200px', margin: '0 auto', fontFamily: "'Inter', sans-serif", color: colors.textMain, backgroundColor: colors.bg, minHeight: '100vh', padding: '30px' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: `1px solid ${colors.cardBorder}`, paddingBottom: '20px' },
        title: { margin: 0, fontSize: '1.8rem', fontWeight: '700', color: colors.textMain },
        subtitle: { margin: 0, color: colors.textMuted, fontSize: '0.9rem', marginTop: '5px' },
        btn: (variant = 'primary') => ({
            padding: '10px 18px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem',
            background: variant === 'primary' ? colors.primary : variant === 'danger' ? colors.danger : 'transparent',
            color: variant === 'ghost' ? colors.textMain : 'white',
            border: variant === 'ghost' ? `1px solid ${colors.cardBorder}` : 'none',
            transition: 'opacity 0.2s', display: 'inline-flex', alignItems: 'center', gap: '8px'
        }),
        grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '25px' },
        card: { background: colors.cardBg, padding: '25px', borderRadius: '12px', border: `1px solid ${colors.cardBorder}`, boxShadow: isDark ? '0 4px 6px -1px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)' },
        cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' },
        caseTitle: { margin: '0 0 5px 0', fontSize: '1.2rem', color: colors.primary, textDecoration: 'none', fontWeight: '600' },
        caseMeta: { fontSize: '0.9rem', color: colors.textMuted, lineHeight: '1.6' },
        badge: (status) => ({
            background: status === 'COMPLETE' ? (isDark ? 'rgba(34,197,94,0.15)' : '#dcfce7') : (isDark ? 'rgba(251,191,36,0.15)' : '#fef3c7'),
            color: status === 'COMPLETE' ? colors.success : colors.accent,
            padding: '4px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase',
            border: `1px solid ${status === 'COMPLETE' ? colors.success : colors.accent}`, display: 'inline-block', marginTop: '5px'
        }),
        sectionHeader: { fontSize: '1.3rem', fontWeight: '600', marginBottom: '16px', color: colors.textMain, borderBottom: `2px solid ${colors.primary}`, paddingBottom: '8px', display: 'inline-block' },
        breadcrumb: { display: 'inline-flex', alignItems: 'center', gap: '6px', background: isDark ? 'rgba(0,123,255,0.15)' : 'rgba(0,123,255,0.08)', border: `1px solid ${colors.ministryBlue}`, borderRadius: '4px', padding: '3px 10px', fontSize: '0.75rem', color: colors.ministryBlue, fontWeight: '600', marginBottom: '6px' },
        readOnlyBanner: { background: isDark ? 'rgba(251,191,36,0.1)' : '#fefce8', border: `1px solid ${colors.accent}`, borderRadius: '8px', padding: '10px 16px', marginBottom: '30px', color: isDark ? colors.accent : '#92400e', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' },
    }

    const now = new Date()
    const threeDays = 1000 * 60 * 60 * 24 * 3
    const groupNew = [], groupReopened = [], groupPending = [], groupInProgress = [], groupComplete = []
    cases.forEach(c => {
        try {
            const arrived = c.date_of_arrival ? new Date(c.date_of_arrival) : null
            const age = arrived ? (now - arrived) : Infinity
            if (c.status === 'COMPLETE') groupComplete.push(c)
            else if (c.reopened) groupReopened.push(c)
            else if (c.status === 'PENDING' && arrived && age <= threeDays) groupNew.push(c)
            else if (c.status === 'PENDING') groupPending.push(c)
            else if (c.status === 'IN_PROGRESS' || c.status === 'TOX_PENDING') groupInProgress.push(c)
            else groupPending.push(c)
        } catch (e) { groupPending.push(c) }
    })

    const renderSection = (label, arr) => arr.length > 0 && (
        <div style={{ marginBottom: '40px' }}>
            <h2 style={styles.sectionHeader}>{label} <span style={{ fontSize: '0.9rem', color: colors.textMuted }}>({arr.length})</span></h2>
            <div style={styles.grid}>
                {arr.map(c => (
                    <div key={c.id} style={styles.card}>
                        <div style={styles.cardHeader}>
                            <div>
                                <Link to={`/cases/${c.id}`} style={styles.caseTitle}>{c.deceased_name} ↗</Link>
                                <div style={styles.caseMeta}>
                                    ID: <strong style={{ color: colors.textMain }}>{c.case_id}</strong><br />
                                    Type: {c.case_type}<br />
                                    <span style={styles.badge(c.status)}>{c.status}</span>
                                </div>
                            </div>
                            {c.qr_code_image && <QRCodeModal qrCodeUrl={c.qr_code_image} caseId={c.case_id} colors={colors} />}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <button style={styles.btn('ghost')} onClick={onBack}>← Back to Hospitals</button>
                    <MinistryLogo size={50} />
                    <div>
                        <div style={styles.breadcrumb}>🏛️ Ministry of Health — Kenya</div>
                        <h1 style={styles.title}>{hospital?.name || 'Hospital Cases'}</h1>
                        <p style={styles.subtitle}>📍 {hospital?.address || 'Address not specified'} &nbsp;·&nbsp; {cases.length} case{cases.length !== 1 ? 's' : ''} on record</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button style={styles.btn('ghost')} onClick={toggleTheme}>{isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}</button>
                    <button style={styles.btn('danger')} onClick={onLogout}>Logout ➜</button>
                </div>
            </div>
            <div style={styles.readOnlyBanner}>
                👁️ <strong>Read-only view.</strong> Ministry admins can view cases but cannot register or modify them.
            </div>
            {cases.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: colors.textMuted }}>
                    <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📂</div>
                    <p>No cases found for this hospital.</p>
                </div>
            ) : (
                <>
                    {renderSection('🆕 New Cases', groupNew)}
                    {renderSection('🔄 Reopened', groupReopened)}
                    {renderSection('🔬 In Progress', groupInProgress)}
                    {renderSection('⏳ Pending', groupPending)}
                    {renderSection('✅ Complete', groupComplete)}
                </>
            )}
        </div>
    )
}

// --- HOSPITAL STAFF DASHBOARD ---
function HospitalDashboard({ role, organization, onLogout, theme, toggleTheme, cases, fetchCases, downloadPDF }) {
    const isDark = theme === 'dark'
    const colors = {
        bg: isDark ? '#0f172a' : '#f8fafc',
        cardBg: isDark ? '#1e293b' : '#ffffff',
        cardBorder: isDark ? '#334155' : '#e2e8f0',
        textMain: isDark ? '#f1f5f9' : '#0f172a',
        textMuted: isDark ? '#94a3b8' : '#64748b',
        primary: isDark ? '#60a5fa' : '#2563eb',
        accent: isDark ? '#fbbf24' : '#f59e0b',
        danger: isDark ? '#f87171' : '#ef4444',
        success: isDark ? '#4ade80' : '#10b981'
    }
    const styles = {
        container: { maxWidth: '1200px', margin: '0 auto', fontFamily: "'Inter', sans-serif", color: colors.textMain, backgroundColor: colors.bg, minHeight: '100vh', padding: '30px' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: `1px solid ${colors.cardBorder}`, paddingBottom: '20px' },
        title: { margin: 0, fontSize: '2rem', fontWeight: '700', color: colors.textMain },
        subtitle: { margin: 0, color: colors.textMuted, fontSize: '0.9rem', marginTop: '5px' },
        btn: (variant = 'primary') => ({
            padding: '10px 18px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem',
            background: variant === 'primary' ? colors.primary : variant === 'danger' ? colors.danger : 'transparent',
            color: variant === 'ghost' ? colors.textMain : 'white',
            border: variant === 'ghost' ? `1px solid ${colors.cardBorder}` : 'none',
            transition: 'opacity 0.2s', display: 'inline-flex', alignItems: 'center', gap: '8px'
        }),
        grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '25px' },
        card: { background: colors.cardBg, padding: '25px', borderRadius: '12px', border: `1px solid ${colors.cardBorder}`, boxShadow: isDark ? '0 4px 6px -1px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)', transition: 'transform 0.2s ease', cursor: 'default' },
        cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' },
        caseTitle: { margin: '0 0 5px 0', fontSize: '1.2rem', color: colors.primary, textDecoration: 'none', fontWeight: '600' },
        caseMeta: { fontSize: '0.9rem', color: colors.textMuted, lineHeight: '1.6' },
        badge: (status) => ({
            background: status === 'COMPLETE' ? (isDark ? 'rgba(34,197,94,0.15)' : '#dcfce7') : (isDark ? 'rgba(251,191,36,0.15)' : '#fef3c7'),
            color: status === 'COMPLETE' ? colors.success : colors.accent,
            padding: '4px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase',
            border: `1px solid ${status === 'COMPLETE' ? colors.success : colors.accent}`, display: 'inline-block', marginTop: '5px'
        }),
        sectionHeader: { fontSize: '1.5rem', fontWeight: '600', marginBottom: '20px', color: colors.textMain, borderBottom: `2px solid ${colors.primary}`, paddingBottom: '10px', display: 'inline-block' }
    }

    const now = new Date()
    const threeDays = 1000 * 60 * 60 * 24 * 3
    const groupNew = [], groupReopened = [], groupPending = [], groupInProgress = [], groupComplete = []
    cases.forEach(c => {
        try {
            const arrived = c.date_of_arrival ? new Date(c.date_of_arrival) : null
            const age = arrived ? (now - arrived) : Infinity
            if (c.status === 'COMPLETE') groupComplete.push(c)
            else if (c.reopened) groupReopened.push(c)
            else if (c.status === 'PENDING' && arrived && age <= threeDays) groupNew.push(c)
            else if (c.status === 'PENDING') groupPending.push(c)
            else if (c.status === 'IN_PROGRESS' || c.status === 'TOX_PENDING') groupInProgress.push(c)
            else groupPending.push(c)
        } catch (e) { groupPending.push(c) }
    })

    const renderCards = (arr) => (
        <div style={styles.grid}>
            {arr.map(c => (
                <div key={c.id} style={styles.card}>
                    <div style={styles.cardHeader}>
                        <div>
                            <Link to={`/cases/${c.id}`} style={styles.caseTitle}>{c.deceased_name} ↗</Link>
                            <div style={styles.caseMeta}>
                                ID: <strong style={{ color: colors.textMain }}>{c.case_id}</strong><br />
                                Type: {c.case_type}<br />
                                <span style={styles.badge(c.status)}>{c.status}</span>
                            </div>
                        </div>
                        {c.qr_code_image && <QRCodeModal qrCodeUrl={c.qr_code_image} caseId={c.case_id} colors={colors} />}
                    </div>
                    {(role === 'PATHOLOGIST' || role === 'ADMIN') && (
                        <div style={{ borderTop: `1px solid ${colors.cardBorder}`, paddingTop: '15px', marginTop: '10px' }}>
                            <button onClick={() => downloadPDF(c.id, c.deceased_name)} style={{ ...styles.btn('ghost'), fontSize: '0.8rem', padding: '6px 12px' }}>📄 Quick PDF Download</button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    )

    const renderSection = (label, arr) => arr.length > 0 && (
        <div style={{ marginBottom: '40px' }}>
            <h2 style={styles.sectionHeader}>{label} <span style={{ fontSize: '0.9rem', color: colors.textMuted }}>({arr.length})</span></h2>
            {renderCards(arr)}
        </div>
    )

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <MinistryLogo size={55} />
                    <div>
                        <h1 style={styles.title}>{organization?.name || 'Digital Autopsy Case Management System'}</h1>
                        <p style={styles.subtitle}>Hospital Forensic Pathology Unit &nbsp;·&nbsp; Logged in as <strong style={{ color: colors.primary }}>{role}</strong>{organization && ` · ${organization.name}`}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button style={styles.btn('ghost')} onClick={toggleTheme}>{isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}</button>
                    <button style={styles.btn('danger')} onClick={onLogout}>Logout ➜</button>
                </div>
            </div>
            <div style={{ marginBottom: '40px' }}>
                {role === 'HOSPITAL_ADMIN' && (
                    <div style={{ marginBottom: '30px', padding: '20px', border: `1px dashed ${colors.cardBorder}`, borderRadius: '12px' }}>
                        <h3 style={{ marginTop: 0, color: colors.textMain }}>Hospital Administration</h3>
                        <RegisterUser />
                    </div>
                )}
                {(role === 'PATHOLOGIST' || role === 'HOSPITAL_ADMIN') && (
                    <div style={{ background: colors.cardBg, padding: '25px', borderRadius: '12px', border: `1px solid ${colors.cardBorder}` }}>
                        <RegisterCase onCaseAdded={fetchCases} role={role} theme={theme} />
                    </div>
                )}
            </div>
            {cases.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: colors.textMuted }}>
                    <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📂</div>
                    <p>No cases found.</p>
                </div>
            ) : (
                <>
                    {renderSection('🆕 New Cases', groupNew)}
                    {renderSection('🔄 Reopened', groupReopened)}
                    {renderSection('🔬 In Progress', groupInProgress)}
                    {renderSection('⏳ Pending', groupPending)}
                    {renderSection('✅ Complete', groupComplete)}
                </>
            )}
        </div>
    )
}

// --- MAIN DASHBOARD CONTROLLER ---
function Dashboard({ role, organization, onLogout }) {
    const [cases, setCases] = useState([])
    const [organizations, setOrganizations] = useState([])
    const [selectedHospital, setSelectedHospital] = useState(null)
    const { addToast } = useToasts()

    const getInitialTheme = () => localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    const [theme, setTheme] = useState(getInitialTheme())

    useEffect(() => { applyTheme(theme) }, [])

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light'
        setTheme(newTheme)
        applyTheme(newTheme)
    }

    const fetchCases = (hospitalId = null) => {
        let url = 'cases/'
        if (hospitalId && role === 'MINISTRY_ADMIN') url += `?organization=${hospitalId}`
        api.get(url)
            .then(res => setCases(res.data))
            .catch(err => { console.error(err); addToast('Failed to load cases', { type: 'error' }) })
    }

    const fetchOrganizations = () => {
        api.get('organizations/')
            .then(res => setOrganizations(res.data))
            .catch(err => { console.error(err); addToast('Failed to load organizations', { type: 'error' }) })
    }

    useEffect(() => {
        if (role === 'MINISTRY_ADMIN') {
            fetchOrganizations()
        } else {
            fetchCases()
        }
    }, [role])

    const handleSelectHospital = (hospital) => {
        setSelectedHospital(hospital)
        fetchCases(hospital.id)
    }

    const handleBackToMinistry = () => {
        setSelectedHospital(null)
        setCases([])
    }

    const downloadPDF = async (caseId, deceasedName) => {
        try {
            const response = await api.get(`cases/${caseId}/pdf/`, { responseType: 'blob' })
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `Report_${deceasedName}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.parentNode.removeChild(link)
        } catch (error) {
            console.error('Download failed:', error)
            addToast && addToast('Failed to download PDF.', { type: 'error' })
        }
    }

    if (role === 'MINISTRY_ADMIN') {
        if (selectedHospital) {
            return (
                <HospitalCaseView
                    hospital={selectedHospital}
                    cases={cases}
                    role={role}
                    theme={theme}
                    toggleTheme={toggleTheme}
                    onLogout={onLogout}
                    onBack={handleBackToMinistry}
                />
            )
        }
        return (
            <MinistryDashboard
                organizations={organizations}
                onSelectHospital={handleSelectHospital}
                theme={theme}
                toggleTheme={toggleTheme}
                onLogout={onLogout}
                role={role}
                organization={organization}
                onRefresh={fetchOrganizations}
            />
        )
    }

    return (
        <HospitalDashboard
            role={role}
            organization={organization}
            onLogout={onLogout}
            theme={theme}
            toggleTheme={toggleTheme}
            cases={cases}
            fetchCases={fetchCases}
            downloadPDF={downloadPDF}
        />
    )
}

export default Dashboard