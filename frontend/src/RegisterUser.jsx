import { useState, useEffect } from 'react'
import api from './api'
import { useToasts } from './Toasts'

const EMPTY_FORM = { username: '', password: '', role: 'POLICE' }

function RegisterUser({ theme }) {
    const { addToast } = useToasts()
    const isDark = theme === 'dark'

    const [form, setForm] = useState(EMPTY_FORM)
    const [showPassword, setShowPassword] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [staff, setStaff] = useState([])
    const [loadingStaff, setLoadingStaff] = useState(true)
    const [deletingId, setDeletingId] = useState(null)

    const colors = {
        bg: isDark ? '#1e293b' : '#ffffff',
        border: isDark ? '#334155' : '#e2e8f0',
        textMain: isDark ? '#f1f5f9' : '#0f172a',
        textMuted: isDark ? '#94a3b8' : '#64748b',
        inputBg: isDark ? '#0f172a' : '#f8fafc',
        inputBorder: isDark ? '#334155' : '#cbd5e1',
        labelColor: isDark ? '#94a3b8' : '#475569',
        primary: isDark ? '#60a5fa' : '#2563eb',
        danger: isDark ? '#f87171' : '#dc2626',
        dangerBg: isDark ? 'rgba(248,113,113,0.08)' : '#fef2f2',
        dangerBorder: isDark ? 'rgba(248,113,113,0.3)' : '#fecaca',
        success: isDark ? '#4ade80' : '#16a34a',
        successBg: isDark ? 'rgba(74,222,128,0.08)' : '#f0fdf4',
        rowBg: isDark ? '#0f172a' : '#f8fafc',
        sectionBorder: isDark ? '#1e293b' : '#f1f5f9',
    }

    const s = {
        wrapper: {
            background: colors.bg, border: `1px solid ${colors.border}`,
            borderRadius: '10px', overflow: 'hidden',
        },
        sectionHeader: {
            padding: '14px 20px', borderBottom: `1px solid ${colors.border}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        },
        sectionTitle: { margin: 0, fontSize: '0.95rem', fontWeight: '700', color: colors.textMain },
        sectionSub: { fontSize: '0.78rem', color: colors.textMuted, marginTop: '2px' },
        formArea: { padding: '20px' },
        twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' },
        row: { marginBottom: '12px' },
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
        select: {
            width: '100%', padding: '8px 11px', borderRadius: '6px',
            border: `1px solid ${colors.inputBorder}`, background: colors.inputBg,
            color: colors.textMain, fontSize: '0.88rem', fontFamily: 'inherit',
            boxSizing: 'border-box', outline: 'none', cursor: 'pointer',
        },
        submitBtn: {
            padding: '9px 20px', borderRadius: '6px',
            cursor: submitting ? 'not-allowed' : 'pointer',
            fontWeight: '600', fontSize: '0.88rem', fontFamily: 'inherit',
            background: submitting ? (isDark ? '#1e3a8a' : '#93c5fd') : colors.primary,
            color: '#ffffff', border: 'none',
            display: 'inline-flex', alignItems: 'center', gap: '6px',
        },
        required: { color: colors.danger, marginLeft: '2px' },

        // Staff list
        divider: { height: '1px', background: colors.border, margin: '0' },
        listArea: { padding: '0' },
        listHeader: {
            padding: '12px 20px', fontSize: '0.78rem', fontWeight: '700',
            textTransform: 'uppercase', letterSpacing: '0.08em', color: colors.textMuted,
            background: isDark ? 'rgba(0,0,0,0.15)' : '#f8fafc',
            borderBottom: `1px solid ${colors.border}`,
        },
        staffRow: {
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '11px 20px', borderBottom: `1px solid ${colors.sectionBorder}`,
        },
        staffName: { fontWeight: '600', fontSize: '0.88rem', color: colors.textMain },
        staffMeta: { fontSize: '0.76rem', color: colors.textMuted, marginTop: '1px' },
        roleBadge: (role) => ({
            display: 'inline-block', padding: '2px 8px', borderRadius: '99px',
            fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em',
            background: role === 'PATHOLOGIST'
                ? (isDark ? 'rgba(96,165,250,0.12)' : '#eff6ff')
                : (isDark ? 'rgba(251,191,36,0.12)' : '#fffbeb'),
            color: role === 'PATHOLOGIST'
                ? colors.primary
                : (isDark ? '#fbbf24' : '#d97706'),
            border: `1px solid ${role === 'PATHOLOGIST' ? colors.primary : (isDark ? '#fbbf24' : '#fcd34d')}`,
            marginLeft: '8px',
        }),
        deleteBtn: {
            padding: '5px 10px', borderRadius: '5px', cursor: 'pointer',
            fontSize: '0.75rem', fontWeight: '600', fontFamily: 'inherit',
            background: 'transparent', border: `1px solid ${colors.dangerBorder}`,
            color: colors.danger, transition: 'all 0.15s', whiteSpace: 'nowrap',
        },
        emptyList: {
            padding: '24px', textAlign: 'center',
            color: colors.textMuted, fontSize: '0.85rem',
        },
        loadingList: {
            padding: '20px', textAlign: 'center',
            color: colors.textMuted, fontSize: '0.85rem',
        },
    }

    const currentUserId = parseInt(localStorage.getItem('user_id'))

    const fetchStaff = async () => {
        setLoadingStaff(true)
        try {
            const res = await api.get('users/')
            // Filter client-side: only POLICE and PATHOLOGIST, exclude the logged-in user
            const filtered = res.data.filter(u =>
                ['POLICE', 'PATHOLOGIST'].includes(u.role) && u.id !== currentUserId
            )
            setStaff(filtered)
        } catch (err) {
            console.error(err)
        } finally {
            setLoadingStaff(false)
        }
    }

    useEffect(() => { fetchStaff() }, [])

    const set = (field, val) => setForm(f => ({ ...f, [field]: val }))

    const handleSubmit = async () => {
        if (!form.username.trim()) { addToast('Username is required.', { type: 'error' }); return }
        if (!form.password.trim()) { addToast('Password is required.', { type: 'error' }); return }
        if (form.password.length < 8) { addToast('Password must be at least 8 characters.', { type: 'error' }); return }
        setSubmitting(true)
        try {
            await api.post('register/', form)
            addToast(`User ${form.username} created successfully!`, { type: 'success' })
            setForm(EMPTY_FORM)
            fetchStaff()
        } catch (err) {
            console.error(err)
            const msg = err.response?.data?.username?.[0] || 'Failed to create user. Username may already exist.'
            addToast(msg, { type: 'error' })
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (user) => {
        if (!window.confirm(`Delete "${user.username}"? This cannot be undone and will remove all their session data.`)) return
        setDeletingId(user.id)
        try {
            await api.delete(`users/${user.id}/`)
            addToast(`User "${user.username}" deleted.`, { type: 'success' })
            setStaff(prev => prev.filter(u => u.id !== user.id))
        } catch (err) {
            console.error(err)
            addToast('Failed to delete user.', { type: 'error' })
        } finally {
            setDeletingId(null)
        }
    }

    const roleLabel = (role) => role === 'PATHOLOGIST' ? 'Pathologist' : 'Police Officer'

    return (
        <div style={s.wrapper}>
            {/* HEADER */}
            <div style={s.sectionHeader}>
                <div>
                    <h3 style={s.sectionTitle}>👮 Staff Onboarding</h3>
                    <div style={s.sectionSub}>Create Pathologist or Police Officer accounts for this hospital</div>
                </div>
            </div>

            {/* FORM */}
            <div style={s.formArea}>
                <div style={s.twoCol}>
                    <div>
                        <label style={s.label}>Username <span style={s.required}>*</span></label>
                        <input
                            style={s.input} placeholder="e.g. dr_ochieng"
                            value={form.username} onChange={e => set('username', e.target.value)}
                            autoComplete="off"
                        />
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

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                        <label style={s.label}>Role <span style={s.required}>*</span></label>
                        <select style={s.select} value={form.role} onChange={e => set('role', e.target.value)}>
                            <option value="POLICE">Police Officer</option>
                            <option value="PATHOLOGIST">Pathologist</option>
                        </select>
                    </div>
                    <button style={s.submitBtn} onClick={handleSubmit} disabled={submitting}>
                        {submitting ? '⏳ Creating...' : '＋ Create User'}
                    </button>
                </div>
            </div>

            {/* STAFF LIST */}
            <div style={s.divider} />
            <div style={s.listArea}>
                <div style={s.listHeader}>
                    Current Staff — {staff.length} account{staff.length !== 1 ? 's' : ''}
                </div>

                {loadingStaff ? (
                    <div style={s.loadingList}>Loading staff...</div>
                ) : staff.length === 0 ? (
                    <div style={s.emptyList}>No staff accounts yet. Create one above.</div>
                ) : (
                    staff.map(user => (
                        <div key={user.id} style={s.staffRow}>
                            <div>
                                <div style={s.staffName}>
                                    {user.first_name || user.last_name
                                        ? `${user.first_name} ${user.last_name}`.trim()
                                        : user.username}
                                    <span style={s.roleBadge(user.role)}>{roleLabel(user.role)}</span>
                                </div>
                                <div style={s.staffMeta}>
                                    @{user.username}
                                    {user.email && ` · ${user.email}`}
                                </div>
                            </div>
                            <button
                                style={s.deleteBtn}
                                onClick={() => handleDelete(user)}
                                disabled={deletingId === user.id}
                                onMouseEnter={e => { e.currentTarget.style.background = colors.dangerBg }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                            >
                                {deletingId === user.id ? '...' : '🗑 Delete'}
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default RegisterUser