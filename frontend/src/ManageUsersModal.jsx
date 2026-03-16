import { useState, useEffect } from 'react'
import api from './api'
import { useToasts } from './Toasts'

const EMPTY_FORM = {
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    employee_id: '',
    role: 'HOSPITAL_ADMIN',
}

export default function ManageUsersModal({ hospital, isDark, onClose }) {
    const { addToast } = useToasts()
    const [admins, setAdmins] = useState([])
    const [loadingAdmins, setLoadingAdmins] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState(EMPTY_FORM)
    const [submitting, setSubmitting] = useState(false)
    const [togglingId, setTogglingId] = useState(null)
    const [deletingId, setDeletingId] = useState(null)
    const [showPassword, setShowPassword] = useState(false)

    const colors = {
        bg: isDark ? '#0f172a' : '#ffffff',
        cardBg: isDark ? '#0d1a2e' : '#f9fafb',
        cardBorder: isDark ? '#1e3a5f' : '#e5e7eb',
        textMain: isDark ? '#e8f0ff' : '#111827',
        textMuted: isDark ? '#6b8fb8' : '#6b7280',
        inputBg: isDark ? '#0d1a2e' : '#ffffff',
        inputBorder: isDark ? '#1e3a5f' : '#d1d5db',
        labelColor: isDark ? '#93b4d4' : '#374151',
        primary: '#007bff',
        primaryLight: isDark ? '#60a5fa' : '#007bff',
        danger: isDark ? '#f87171' : '#dc2626',
        dangerBg: isDark ? 'rgba(248,113,113,0.1)' : '#fef2f2',
        dangerBorder: isDark ? 'rgba(248,113,113,0.3)' : '#fecaca',
        success: isDark ? '#4ade80' : '#16a34a',
        successBg: isDark ? 'rgba(74,222,128,0.1)' : '#f0fdf4',
        warning: isDark ? '#fbbf24' : '#d97706',
        overlay: 'rgba(0,0,0,0.75)',
        rowBg: isDark ? '#111a11' : '#ffffff',
        rowBorder: isDark ? '#1e3a1e' : '#f3f4f6',
    }

    const s = {
        overlay: {
            position: 'fixed', inset: 0, background: colors.overlay,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '20px',
        },
        modal: {
            background: colors.bg, borderRadius: '12px', width: '100%', maxWidth: '620px',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column',
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)', overflow: 'hidden',
        },
        modalHeader: {
            background: isDark ? '#0d1a2e' : '#007bff',
            padding: '18px 24px', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', borderBottom: `3px solid ${colors.primaryLight}`, flexShrink: 0,
        },
        modalTitle: { margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#ffffff' },
        modalSub: { margin: '3px 0 0 0', fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)' },
        closeBtn: {
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            color: '#ffffff', borderRadius: '6px', padding: '6px 10px',
            cursor: 'pointer', fontSize: '1rem', lineHeight: 1,
        },
        scrollBody: { overflowY: 'auto', flex: 1, padding: '24px' },
        sectionLabel: {
            fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase',
            letterSpacing: '0.1em', color: colors.textMuted, marginBottom: '12px',
            display: 'flex', alignItems: 'center', gap: '8px',
        },
        divider: { flex: 1, height: '1px', background: colors.cardBorder },

        // Admin rows
        adminRow: (isActive) => ({
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 14px', borderRadius: '8px', marginBottom: '8px',
            background: isActive ? colors.rowBg : (isDark ? 'rgba(0,0,0,0.2)' : '#f9fafb'),
            border: `1px solid ${colors.rowBorder}`,
            opacity: isActive ? 1 : 0.6,
            gap: '10px',
        }),
        adminName: (isActive) => ({
            fontWeight: '600', fontSize: '0.9rem',
            color: isActive ? colors.textMain : colors.textMuted,
        }),
        adminMeta: { fontSize: '0.78rem', color: colors.textMuted, marginTop: '2px' },
        statusBadge: (isActive) => ({
            display: 'inline-block', padding: '2px 8px', borderRadius: '99px',
            fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em',
            background: isActive ? colors.successBg : colors.dangerBg,
            color: isActive ? colors.success : colors.danger,
            border: `1px solid ${isActive ? colors.success : colors.danger}`,
            marginLeft: '8px',
        }),
        rowActions: { display: 'flex', gap: '6px', flexShrink: 0 },
        toggleBtn: (isActive) => ({
            padding: '6px 10px', borderRadius: '6px', cursor: 'pointer',
            fontSize: '0.75rem', fontWeight: '600', fontFamily: 'inherit',
            background: 'transparent', transition: 'all 0.2s',
            border: `1px solid ${isActive ? colors.warning : colors.success}`,
            color: isActive ? colors.warning : colors.success,
            whiteSpace: 'nowrap',
        }),
        deleteBtn: {
            padding: '6px 10px', borderRadius: '6px', cursor: 'pointer',
            fontSize: '0.75rem', fontWeight: '600', fontFamily: 'inherit',
            background: 'transparent', transition: 'all 0.2s',
            border: `1px solid ${colors.dangerBorder}`,
            color: colors.danger, whiteSpace: 'nowrap',
        },
        emptyState: { textAlign: 'center', padding: '24px', color: colors.textMuted, fontSize: '0.88rem' },

        // Add form
        addToggleBtn: {
            width: '100%', padding: '10px', borderRadius: '8px', cursor: 'pointer',
            fontWeight: '600', fontSize: '0.88rem', fontFamily: 'inherit',
            background: 'transparent', color: colors.primaryLight,
            border: `1px dashed ${colors.primaryLight}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            marginBottom: showForm ? '20px' : '0',
        },
        formBox: {
            background: colors.cardBg, border: `1px solid ${colors.cardBorder}`,
            borderRadius: '10px', padding: '20px', marginBottom: '4px',
        },
        formTitle: { margin: '0 0 16px 0', fontSize: '0.95rem', fontWeight: '700', color: colors.textMain },
        row: { marginBottom: '14px' },
        twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' },
        label: { display: 'block', fontSize: '0.8rem', fontWeight: '600', color: colors.labelColor, marginBottom: '5px' },
        input: {
            width: '100%', padding: '8px 11px', borderRadius: '6px',
            border: `1px solid ${colors.inputBorder}`, background: colors.inputBg,
            color: colors.textMain, fontSize: '0.88rem', fontFamily: 'inherit',
            boxSizing: 'border-box', outline: 'none',
        },
        passwordWrap: { position: 'relative' },
        eyeBtn: {
            position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: colors.textMuted, fontSize: '0.85rem', padding: '2px',
        },
        required: { color: colors.danger, marginLeft: '2px' },
        formActions: { display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'flex-end' },
        cancelFormBtn: {
            padding: '8px 16px', borderRadius: '6px', cursor: 'pointer',
            fontWeight: '600', fontSize: '0.85rem', fontFamily: 'inherit',
            background: 'transparent', color: colors.textMuted,
            border: `1px solid ${colors.cardBorder}`,
        },
        submitBtn: {
            padding: '8px 20px', borderRadius: '6px', cursor: submitting ? 'not-allowed' : 'pointer',
            fontWeight: '600', fontSize: '0.85rem', fontFamily: 'inherit',
            background: submitting ? '#0056b3' : colors.primary,
            color: '#ffffff', border: 'none', opacity: submitting ? 0.7 : 1,
        },
    }

    const fetchAdmins = async () => {
        setLoadingAdmins(true)
        try {
            const res = await api.get(`users/?organization=${hospital.id}&role=HOSPITAL_ADMIN`)
            setAdmins(res.data)
        } catch (err) {
            console.error(err)
            addToast('Failed to load admin accounts.', { type: 'error' })
        } finally {
            setLoadingAdmins(false)
        }
    }

    useEffect(() => { fetchAdmins() }, [hospital.id])

    const set = (field, val) => setForm(f => ({ ...f, [field]: val }))

    const handleSubmit = async () => {
        if (!form.username.trim()) { addToast('Username is required.', { type: 'error' }); return }
        if (!form.password.trim()) { addToast('Password is required.', { type: 'error' }); return }
        if (form.password.length < 8) { addToast('Password must be at least 8 characters.', { type: 'error' }); return }
        setSubmitting(true)
        try {
            await api.post('users/', { ...form, organization: hospital.id })
            addToast(`Admin account "${form.username}" created successfully.`, { type: 'success' })
            setForm(EMPTY_FORM)
            setShowForm(false)
            fetchAdmins()
        } catch (err) {
            console.error(err)
            const msg = err.response?.data?.username?.[0] || err.response?.data?.detail || 'Failed to create account.'
            addToast(msg, { type: 'error' })
        } finally {
            setSubmitting(false)
        }
    }

    const handleToggleActive = async (user) => {
        if (user.is_active && !window.confirm(`Deactivate "${user.username}"? They will lose access immediately.`)) return
        setTogglingId(user.id)
        try {
            await api.patch(`users/${user.id}/`, { is_active: !user.is_active })
            addToast(`Account "${user.username}" ${user.is_active ? 'deactivated' : 'reactivated'}.`, { type: 'success' })
            fetchAdmins()
        } catch (err) {
            console.error(err)
            addToast('Failed to update account status.', { type: 'error' })
        } finally {
            setTogglingId(null)
        }
    }

    const handleDelete = async (user) => {
        if (!window.confirm(`Permanently delete "${user.username}"? This cannot be undone.`)) return
        setDeletingId(user.id)
        try {
            await api.delete(`users/${user.id}/`)
            addToast(`Account "${user.username}" deleted.`, { type: 'success' })
            setAdmins(prev => prev.filter(u => u.id !== user.id))
        } catch (err) {
            console.error(err)
            addToast('Failed to delete account.', { type: 'error' })
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={s.modal}>
                {/* HEADER */}
                <div style={s.modalHeader}>
                    <div>
                        <h2 style={s.modalTitle}>👤 Manage Hospital Admins</h2>
                        <p style={s.modalSub}>🏥 {hospital.name}</p>
                    </div>
                    <button style={s.closeBtn} onClick={onClose}>✕</button>
                </div>

                <div style={s.scrollBody}>
                    {/* EXISTING ADMINS */}
                    <div style={s.sectionLabel}>
                        <span>Admin Accounts — {admins.length}</span>
                        <div style={s.divider} />
                    </div>

                    {loadingAdmins ? (
                        <div style={s.emptyState}>Loading accounts...</div>
                    ) : admins.length === 0 ? (
                        <div style={s.emptyState}>
                            No admin accounts yet for this hospital. Create one below.
                        </div>
                    ) : (
                        admins.map(user => (
                            <div key={user.id} style={s.adminRow(user.is_active)}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={s.adminName(user.is_active)}>
                                        {user.first_name || user.last_name
                                            ? `${user.first_name} ${user.last_name}`.trim()
                                            : user.username}
                                        <span style={s.statusBadge(user.is_active)}>
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div style={s.adminMeta}>
                                        @{user.username}
                                        {user.email && ` · ${user.email}`}
                                        {user.employee_id && ` · ID: ${user.employee_id}`}
                                    </div>
                                </div>
                                <div style={s.rowActions}>
                                    <button
                                        style={s.toggleBtn(user.is_active)}
                                        onClick={() => handleToggleActive(user)}
                                        disabled={togglingId === user.id || deletingId === user.id}
                                    >
                                        {togglingId === user.id
                                            ? '...'
                                            : user.is_active ? '⊘ Deactivate' : '↺ Reactivate'}
                                    </button>
                                    <button
                                        style={s.deleteBtn}
                                        onClick={() => handleDelete(user)}
                                        disabled={deletingId === user.id || togglingId === user.id}
                                        onMouseEnter={e => e.currentTarget.style.background = colors.dangerBg}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        {deletingId === user.id ? '...' : '🗑 Delete'}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}

                    {/* ADD FORM TOGGLE */}
                    <div style={{ marginTop: '20px' }}>
                        <button style={s.addToggleBtn} onClick={() => setShowForm(v => !v)}>
                            {showForm ? '✕ Cancel' : '＋ Create New Hospital Admin'}
                        </button>
                    </div>

                    {/* ADD FORM */}
                    {showForm && (
                        <div style={s.formBox}>
                            <h3 style={s.formTitle}>New Hospital Admin — {hospital.name}</h3>

                            <div style={s.twoCol}>
                                <div>
                                    <label style={s.label}>Username <span style={s.required}>*</span></label>
                                    <input style={s.input} placeholder="e.g. admin_knh" value={form.username} onChange={e => set('username', e.target.value)} autoComplete="off" />
                                </div>
                                <div>
                                    <label style={s.label}>Password <span style={s.required}>*</span></label>
                                    <div style={s.passwordWrap}>
                                        <input
                                            style={{ ...s.input, paddingRight: '36px' }}
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Min. 8 characters"
                                            value={form.password}
                                            onChange={e => set('password', e.target.value)}
                                            autoComplete="new-password"
                                        />
                                        <button style={s.eyeBtn} onClick={() => setShowPassword(v => !v)} type="button">
                                            {showPassword ? '🙈' : '👁️'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div style={s.twoCol}>
                                <div>
                                    <label style={s.label}>First Name</label>
                                    <input style={s.input} placeholder="First name" value={form.first_name} onChange={e => set('first_name', e.target.value)} />
                                </div>
                                <div>
                                    <label style={s.label}>Last Name</label>
                                    <input style={s.input} placeholder="Last name" value={form.last_name} onChange={e => set('last_name', e.target.value)} />
                                </div>
                            </div>

                            <div style={s.row}>
                                <label style={s.label}>Email</label>
                                <input style={s.input} type="email" placeholder="admin@hospital.go.ke" value={form.email} onChange={e => set('email', e.target.value)} />
                            </div>

                            <div style={s.twoCol}>
                                <div>
                                    <label style={s.label}>Phone</label>
                                    <input style={s.input} placeholder="+254 700 000 000" value={form.phone} onChange={e => set('phone', e.target.value)} />
                                </div>
                                <div>
                                    <label style={s.label}>Employee ID</label>
                                    <input style={s.input} placeholder="e.g. KNH-0042" value={form.employee_id} onChange={e => set('employee_id', e.target.value)} />
                                </div>
                            </div>

                            <div style={s.formActions}>
                                <button style={s.cancelFormBtn} onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}>Cancel</button>
                                <button style={s.submitBtn} onClick={handleSubmit} disabled={submitting}>
                                    {submitting ? '⏳ Creating...' : '✓ Create Admin Account'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}