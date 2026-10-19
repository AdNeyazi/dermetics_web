import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch, apiUrl } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { AppHeader } from '@/components/AppHeader'
import { ProductEditor } from '@/components/admin/ProductEditor'
import { ReviewModeration } from '@/components/admin/ReviewModeration'
import { newProductTemplate } from '@/lib/pdpAdmin'
import type { Product, Package } from '@/types'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts'

interface NavItem {
  key: string
  label: string
}

const NAV: NavItem[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'products', label: 'Products' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'packages', label: 'Packages' },
  { key: 'categories', label: 'Categories' },
  { key: 'content', label: 'Website Content' },
  { key: 'users', label: 'Users' },
  { key: 'inquiries', label: 'Inquiries' },
  { key: 'diagnostics', label: 'Consultations' },
]

const TIER_LABELS: Record<string, string> = { premium: 'Premium', ultra: 'Ultra Premium', super: 'Super Ultra Premium' }

const CHART_TOOLTIP = {
  background: 'var(--modal-bg)',
  border: '1px solid var(--border-glass)',
  borderRadius: 12,
  color: 'var(--text-primary)',
  boxShadow: '0 8px 24px var(--shadow-soft)',
}

const api = (path: string, opts: RequestInit = {}) => apiFetch(path, opts).then((r) => r.json())

interface OverviewData {
  stats?: {
    visitorsToday: number
    visitorsWeek: number
    totalUsers: number
    inquiries: number
  }
  visitorsSeries?: Array<{ date: string; visitors: number }>
  tierInterest?: Array<{ tier: string; count: number }>
  topProducts?: Array<{ name: string; count: number }>
  funnel?: {
    visits: number
    productViews: number
    addToCart?: number
    checkouts?: number
    inquiries: number
  }
}

/* ---------------- OVERVIEW ---------------- */
function Overview() {
  const [data, setData] = useState<OverviewData | null>(null)
  useEffect(() => { api('/api/admin/analytics/overview').then(setData).catch(() => {}) }, [])
  if (!data || !data.stats) return <p style={{ color: 'var(--text-muted)' }}>Loading analytics...</p>

  const stats = [
    { label: 'Visitors Today', value: data.stats.visitorsToday },
    { label: 'Visitors (7d)', value: data.stats.visitorsWeek },
    { label: 'Registered Users', value: data.stats.totalUsers },
    { label: 'Total Inquiries', value: data.stats.inquiries },
  ]

  const funnel = data.funnel || { visits: 0, productViews: 0, inquiries: 0 }

  return (
    <div>
      <div className="stat-grid">
        {stats.map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value gold-text">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="chart-row">
        <div className="panel">
          <h3>Visitors — Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.visitorsSeries || []}>
              <defs>
                <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d4af37" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#d4af37" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(212,175,55,0.1)" vertical={false} />
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={CHART_TOOLTIP} />
              <Area type="monotone" dataKey="visitors" stroke="#d4af37" strokeWidth={2} fill="url(#gold)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <h3>Category Interest</h3>
          {(!data.tierInterest || data.tierInterest.length === 0) ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No tab interactions recorded yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.tierInterest.map((t) => ({ ...t, label: TIER_LABELS[t.tier] || t.tier }))}>
                <CartesianGrid stroke="rgba(212,175,55,0.1)" vertical={false} />
                <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: 'rgba(212,175,55,0.08)' }} contentStyle={CHART_TOOLTIP} />
                <Bar dataKey="count" fill="#d4af37" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="chart-row">
        <div className="panel">
          <h3>Most-Viewed Products</h3>
          {(!data.topProducts || data.topProducts.length === 0) ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No product views recorded yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart layout="vertical" data={data.topProducts} margin={{ left: 20 }}>
                <CartesianGrid stroke="rgba(212,175,55,0.1)" horizontal={false} />
                <XAxis type="number" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" stroke="var(--text-muted)" fontSize={11} width={150} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'rgba(212,175,55,0.08)' }} contentStyle={CHART_TOOLTIP} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {data.topProducts.map((_, i) => (<Cell key={i} fill="#d4af37" />))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="panel">
          <h3>Conversion Funnel</h3>
          {[
            { label: 'Page Visits', value: funnel.visits },
            { label: 'Product Views', value: funnel.productViews },
            { label: 'Add to Cart', value: funnel.addToCart ?? 0 },
            { label: 'Checkouts', value: funnel.checkouts ?? 0 },
            { label: 'Inquiries', value: funnel.inquiries },
          ].map((f) => {
            const max = Math.max(funnel.visits, 1)
            const pct = Math.max((f.value / max) * 100, 4)
            return (
              <div key={f.label} style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-primary)', marginBottom: 8 }}>
                  <span>{f.label}</span><span className="gold-text" style={{ fontWeight: 600 }}>{f.value}</span>
                </div>
                <div style={{ height: 12, background: 'rgba(201, 162, 39, 0.12)', borderRadius: 100, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(135deg,#f7e7ce,#d4af37,#aa7c11)', borderRadius: 100 }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ---------------- PRODUCTS ---------------- */
function Products() {
  const [items, setItems] = useState<Product[]>([])
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<any | null>(null)
  const [loadingEdit, setLoadingEdit] = useState(false)
  const load = useCallback(() => { api('/api/products').then((d) => setItems(Array.isArray(d) ? d : [])).catch(() => {}) }, [])
  useEffect(() => { load() }, [load])

  const openEdit = async (p: Product) => {
    setLoadingEdit(true)
    try {
      const slug = p.slug || p.id
      const full = await api(`/api/products/${slug}`)
      setEditing(full)
    } catch {
      setEditing(p)
    } finally {
      setLoadingEdit(false)
    }
  }

  const save = async (payload: any) => {
    const isNew = !payload.id
    await api(isNew ? '/api/admin/products' : `/api/admin/products/${payload.id}`, {
      method: isNew ? 'POST' : 'PUT',
      body: JSON.stringify(payload),
    })
    setEditing(null)
    load()
  }

  const del = async (id: string | number) => {
    if (confirm('Delete this product?')) {
      await api(`/api/admin/products/${id}`, { method: 'DELETE' })
      load()
    }
  }

  const filtered = items.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || (p.tag || '').toLowerCase().includes(q.toLowerCase()))

  return (
    <div>
      <div className="dash-toolbar">
        <input className="dash-search" placeholder="Search products..." value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn-sm gold" disabled={loadingEdit} onClick={() => setEditing(newProductTemplate())}>+ Add Product</button>
      </div>
      <div className="panel dash-table-panel">
        <div className="dash-table-scroll is-scrollable">
          <table className="dash-table dash-table-pro">
            <thead>
              <tr>
                <th className="col-img">Image</th>
                <th className="col-name">Product</th>
                <th className="col-tier">Tier</th>
                <th className="col-price">Price</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="dash-table-empty">No products match your search.</td>
                </tr>
              )}
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td className="col-img">
                    {p.imageUrl ? <img className="tbl-img" src={p.imageUrl} alt="" /> : <span className="tbl-img-placeholder">—</span>}
                  </td>
                  <td className="col-name">
                    <span className="dash-cell-title">{p.name}</span>
                    {p.tag ? <span className="dash-cell-sub">{p.tag}</span> : null}
                  </td>
                  <td className="col-tier">
                    <span className="badge badge-tier">{TIER_LABELS[p.tier || ''] || p.tier}</span>
                  </td>
                  <td className="col-price dash-cell-price">₹{Number(p.price).toLocaleString('en-IN')}</td>
                  <td className="col-actions dash-cell-actions">
                    <button type="button" className="btn-sm" disabled={loadingEdit} onClick={() => openEdit(p)}>Edit</button>
                    <button type="button" className="btn-sm danger" onClick={() => del(p.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {editing && (
        <ProductEditor
          product={editing}
          allProducts={items}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </div>
  )
}

/* ---------------- PACKAGES (admin) ---------------- */
function Packages() {
  const [items, setItems] = useState<Package[]>([])
  const [editing, setEditing] = useState<any | null>(null)
  const load = useCallback(() => { api('/api/packages').then((d) => setItems(Array.isArray(d) ? d : [])).catch(() => {}) }, [])
  useEffect(() => { load() }, [load])

  const save = async (pkg: any) => {
    const isNew = !pkg.id
    const payload = { ...pkg, features: (typeof pkg.features === 'string' ? pkg.features.split('\n') : pkg.features).map((s: string) => String(s).trim()).filter(Boolean) }
    await api(isNew ? '/api/admin/packages' : `/api/admin/packages/${pkg.id}`, { method: isNew ? 'POST' : 'PUT', body: JSON.stringify(payload) })
    setEditing(null)
    load()
  }

  const del = async (id: string | number) => {
    if (confirm('Delete this package?')) {
      await api(`/api/admin/packages/${id}`, { method: 'DELETE' })
      load()
    }
  }

  return (
    <div>
      <div className="dash-toolbar">
        <div />
        <button className="btn-sm gold" onClick={() => setEditing({ name: '', price: '', description: '', recommended: false, features: [], order: items.length + 1 })}>+ Add Package</button>
      </div>
      <div className="packages-grid" style={{ marginBottom: 0 }}>
        {items.map((pkg) => (
          <div className={`package-card ${pkg.recommended ? 'recommended' : ''}`} key={pkg.id}>
            {pkg.recommended && <span className="package-badge">Recommended</span>}
            <h3 className="package-name gold-text">{pkg.name}</h3>
            <p className="package-desc">{pkg.description}</p>
            <div className="package-price gold-text"><span className="cur">$</span>{Number(pkg.price).toLocaleString()}</div>
            <div className="package-per">Program Fee</div>
            <ul className="package-features">
              {(pkg.features || []).map((ft, i) => (<li key={i}><span className="tick">&#10003;</span><span>{ft}</span></li>))}
            </ul>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-sm" onClick={() => setEditing(pkg)}>Edit</button>
              <button className="btn-sm danger" onClick={() => del(pkg.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      {editing && <PackageModal pkg={editing} onClose={() => setEditing(null)} onSave={save} />}
    </div>
  )
}

interface PackageModalProps {
  pkg: any
  onClose: () => void
  onSave: (pkg: any) => Promise<void> | void
}

function PackageModal({ pkg, onClose, onSave }: PackageModalProps) {
  const [f, setF] = useState({ ...pkg, features: Array.isArray(pkg.features) ? pkg.features.join('\n') : (pkg.features || '') })
  const set = (k: string, v: any) => setF((prev: any) => ({ ...prev, [k]: v }))

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540, maxHeight: '88vh', overflowY: 'auto' }}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h3 className="gold-text">{pkg.id ? 'Edit Package' : 'New Package'}</h3>
        <div className="content-form" style={{ marginTop: 20 }}>
          <div className="field"><label>Name</label><input value={f.name || ''} onChange={(e) => set('name', e.target.value)} /></div>
          <div className="field"><label>Price ($)</label><input type="number" value={f.price ?? ''} onChange={(e) => set('price', e.target.value)} /></div>
          <div className="field"><label>Description</label><textarea value={f.description || ''} onChange={(e) => set('description', e.target.value)} /></div>
          <div className="field"><label>Features (one per line)</label><textarea style={{ minHeight: 140 }} value={f.features || ''} onChange={(e) => set('features', e.target.value)} /></div>
          <div className="field"><label style={{ display: 'flex', gap: 10, alignItems: 'center', textTransform: 'none', letterSpacing: 0 }}><input type="checkbox" checked={!!f.recommended} onChange={(e) => set('recommended', e.target.checked)} style={{ width: 18, height: 18, accentColor: '#d4af37' }} /> Mark as Recommended</label></div>
          <div className="field"><label>Order</label><input type="number" value={f.order ?? ''} onChange={(e) => set('order', Number(e.target.value))} /></div>
        </div>
        <div className="save-bar">
          <button className="btn-pill solid" onClick={() => onSave(f)}>Save Package</button>
          <button className="btn-sm" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

/* ---------------- DIAGNOSTIC CONSULTATIONS (admin) ---------------- */
const STATUSES = ['New', 'In Review', 'Formulated', 'Delivered']

function SecureThumb({ fileId, alt }: { fileId: string; alt: string }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    let objectUrl = ''
    apiFetch(`/api/admin/secure-file/${fileId}`)
      .then((r) => { if (!r.ok) throw new Error('fail'); return r.blob() })
      .then((blob) => { objectUrl = URL.createObjectURL(blob); setSrc(objectUrl) })
      .catch(() => setSrc(''))
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [fileId])
  if (!src) return <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>…</span>
  return <img src={src} alt={alt} />
}

interface DiagnosticRecord {
  id: string | number
  fullName?: string
  phone?: string
  email?: string
  address?: string
  bloodGroup?: string
  allergies?: string
  currentRoutine?: string
  status?: string
  createdAt?: string
  reportFileIds?: string[]
  facePhotoFileIds?: string[]
}

function Diagnostics() {
  const [items, setItems] = useState<DiagnosticRecord[]>([])
  const [detail, setDetail] = useState<DiagnosticRecord | null>(null)
  const load = useCallback(() => { api('/api/admin/diagnostic-consultations').then((d) => setItems(Array.isArray(d) ? d : [])).catch(() => {}) }, [])
  useEffect(() => { load() }, [load])

  const setStatus = async (id: string | number, status: string) => {
    await api(`/api/admin/diagnostic-consultations/${id}`, { method: 'PUT', body: JSON.stringify({ status }) })
    load()
    setDetail((d) => d && d.id === id ? { ...d, status } : d)
  }

  const openFile = (fileId: string) => {
    window.open(apiUrl(`/api/admin/secure-file/${fileId}`), '_blank', 'noopener')
  }

  return (
    <div className="panel dash-table-panel">
      <div className="dash-table-scroll is-scrollable"><table className="dash-table">
        <thead><tr><th>Name</th><th>Contact</th><th>Files</th><th>Status</th><th>Date</th><th style={{ textAlign: 'right' }}>Action</th></tr></thead>
        <tbody>
          {items.length === 0 && <tr><td colSpan={6} style={{ color: 'var(--text-muted)', padding: 24 }}>No diagnostic submissions yet.</td></tr>}
          {items.map((c) => (
            <tr key={c.id}>
              <td>{c.fullName}</td>
              <td style={{ color: 'var(--text-muted)' }}>{c.phone}<br />{c.email}</td>
              <td>{(c.reportFileIds?.length || 0) + (c.facePhotoFileIds?.length || 0)}</td>
              <td><span className={`status-pill status-${(c.status || 'New').replace(/\s/g, '')}`}>{c.status || 'New'}</span></td>
              <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}</td>
              <td style={{ textAlign: 'right' }}><button className="btn-sm" onClick={() => setDetail(c)}>View</button></td>
            </tr>
          ))}
        </tbody>
      </table></div>
      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 620, maxHeight: '90vh', overflowY: 'auto' }}>
            <button className="modal-close" onClick={() => setDetail(null)}>&times;</button>
            <h3 className="gold-text">{detail.fullName}</h3>
            <p className="modal-sub">Diagnostic Intake · {detail.createdAt ? new Date(detail.createdAt).toLocaleString() : ''}</p>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status</label>
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {STATUSES.map((s) => (<button key={s} className={`btn-sm ${detail.status === s ? 'gold' : ''}`} onClick={() => setStatus(detail.id, s)}>{s}</button>))}
              </div>
            </div>
            {[['Phone', detail.phone], ['Email', detail.email], ['Address', detail.address], ['Blood Group', detail.bloodGroup], ['Allergies', detail.allergies], ['Current Routine', detail.currentRoutine]].map(([k, v]) => (
              <div className="review-row" key={k}><span className="k">{k}</span><span className="v">{v || '—'}</span></div>
            ))}
            <div style={{ marginTop: 18 }}>
              <label className="file-label">Medical Reports</label>
              <div className="thumb-grid">
                {(detail.reportFileIds || []).length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>None</span>}
                {(detail.reportFileIds || []).map((id) => (<button key={id} className="btn-sm" onClick={() => openFile(id)}>View Report</button>))}
              </div>
              <label className="file-label">Face Photos</label>
              <div className="thumb-grid">
                {(detail.facePhotoFileIds || []).length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>None</span>}
                {(detail.facePhotoFileIds || []).map((id) => (
                  <button key={id} className="thumb" onClick={() => openFile(id)} style={{ cursor: 'pointer', border: '1px solid var(--border-glass)', padding: 0 }}>
                    <SecureThumb fileId={id} alt="face" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------------- CATEGORIES ---------------- */
interface CategoryItem {
  id: string | number
  key?: string
  label: string
  introTitle?: string
  introText?: string
}

function Categories() {
  const [items, setItems] = useState<CategoryItem[]>([])
  const [msg, setMsg] = useState('')
  const load = useCallback(() => { api('/api/categories').then(setItems).catch(() => {}) }, [])
  useEffect(() => { load() }, [load])

  const setField = (id: string | number, k: string, v: string) => setItems(items.map((c) => (c.id === id ? { ...c, [k]: v } : c)))
  const save = async (c: CategoryItem) => {
    await api(`/api/admin/categories/${c.id}`, { method: 'PUT', body: JSON.stringify({ label: c.label, introTitle: c.introTitle, introText: c.introText }) })
    setMsg('Saved ' + c.label)
    setTimeout(() => setMsg(''), 2000)
  }

  return (
    <div>
      {items.map((c) => (
        <div className="panel" key={c.id} style={{ marginBottom: 20 }}>
          <div className="content-form">
            <div className="content-form two">
              <div className="field"><label>Tab Label</label><input value={c.label || ''} onChange={(e) => setField(c.id, 'label', e.target.value)} /></div>
              <div className="field"><label>Intro Heading</label><input value={c.introTitle || ''} onChange={(e) => setField(c.id, 'introTitle', e.target.value)} /></div>
            </div>
            <div className="field"><label>Intro Subtext</label><textarea value={c.introText || ''} onChange={(e) => setField(c.id, 'introText', e.target.value)} /></div>
          </div>
          <div className="save-bar">
            <button className="btn-pill solid" onClick={() => save(c)}>Save</button>
            {msg === 'Saved ' + c.label && <span className="save-msg">Saved!</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ---------------- WEBSITE CONTENT ---------------- */
function Content() {
  const [c, setC] = useState<any>(null)
  const [msg, setMsg] = useState('')
  useEffect(() => { api('/api/content').then(setC).catch(() => {}) }, [])
  if (!c) return <p style={{ color: 'var(--text-muted)' }}>Loading content...</p>

  const set = (k: string, v: any) => setC((prev: any) => ({ ...prev, [k]: v }))
  const setProc = (i: number, k: string, v: any) => {
    const p = [...c.process]
    p[i] = { ...p[i], [k]: v }
    setC((prev: any) => ({ ...prev, process: p }))
  }
  const save = async () => {
    await api('/api/admin/content', { method: 'PUT', body: JSON.stringify(c) })
    setMsg('Content saved!')
    setTimeout(() => setMsg(''), 2500)
  }

  return (
    <div>
      <div className="panel" style={{ marginBottom: 20 }}>
        <h3>Hero & Brand</h3>
        <div className="content-form two">
          <div className="field"><label>Hero Title</label><input value={c.heroTitle || ''} onChange={(e) => set('heroTitle', e.target.value)} /></div>
          <div className="field"><label>Hero Subtext</label><input value={c.heroSub || ''} onChange={(e) => set('heroSub', e.target.value)} /></div>
          <div className="field"><label>Phone Number</label><input value={c.phone || ''} onChange={(e) => set('phone', e.target.value)} /></div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <h3>Flagship — My Skin My Formulation</h3>
        <div className="content-form">
          <div className="content-form two">
            <div className="field"><label>Flagship Title</label><input value={c.flagshipTitle || ''} onChange={(e) => set('flagshipTitle', e.target.value)} /></div>
            <div className="field"><label>Flagship Subtext</label><input value={c.flagshipSub || ''} onChange={(e) => set('flagshipSub', e.target.value)} /></div>
          </div>
          <div className="content-form two">
            <div className="field"><label>&quot;What is&quot; Title</label><input value={c.whatTitle || ''} onChange={(e) => set('whatTitle', e.target.value)} /></div>
            <div className="field"><label>&quot;Why&quot; Title</label><input value={c.whyTitle || ''} onChange={(e) => set('whyTitle', e.target.value)} /></div>
          </div>
          <div className="field"><label>&quot;What is&quot; Text</label><textarea value={c.whatText || ''} onChange={(e) => set('whatText', e.target.value)} /></div>
          <div className="field"><label>&quot;Why&quot; Text</label><textarea value={c.whyText || ''} onChange={(e) => set('whyText', e.target.value)} /></div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <h3>How It Works — Process Steps</h3>
        {(c.process || []).map((p: any, i: number) => (
          <div className="content-form two" key={i} style={{ marginBottom: 14 }}>
            <div className="field"><label>Step {p.n} Title</label><input value={p.title || ''} onChange={(e) => setProc(i, 'title', e.target.value)} /></div>
            <div className="field"><label>Step {p.n} Text</label><input value={p.text || ''} onChange={(e) => setProc(i, 'text', e.target.value)} /></div>
          </div>
        ))}
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <h3>Storefront — Marquee &amp; PDP globals</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
          Used on the product detail page and site header. One marquee line per row below.
        </p>
        <div className="content-form">
          <div className="field">
            <label>Announcement marquee (one line per row)</label>
            <textarea
              style={{ minHeight: 88 }}
              value={(c.marqueeLines || []).join('\n')}
              onChange={(e) => set('marqueeLines', e.target.value.split('\n').map((s: string) => s.trim()).filter(Boolean))}
              placeholder="Welcome to DERMATICS"
            />
          </div>
          <div className="content-form two">
            <div className="field">
              <label>WhatsApp number (digits, country code)</label>
              <input value={c.whatsappNumber || ''} onChange={(e) => set('whatsappNumber', e.target.value)} placeholder="919876543210" />
            </div>
            <div className="field">
              <label>Money-back guarantee period (days)</label>
              <input type="number" min={1} max={365} value={c.guaranteeDays ?? 45} onChange={(e) => set('guaranteeDays', Number(e.target.value))} />
            </div>
          </div>
          <div className="field">
            <label style={{ marginBottom: 10 }}>Trust line (product buy box)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['complimentaryGift', 'Complimentary gifts at checkout'],
                ['freeShipping', 'Free shipping'],
                ['cod', 'COD available'],
              ].map(([key, label]) => (
                <label key={key} style={{ display: 'flex', gap: 10, alignItems: 'center', textTransform: 'none', letterSpacing: 0, fontSize: 14 }}>
                  <input
                    type="checkbox"
                    checked={c.trustLine?.[key] !== false}
                    onChange={(e) => set('trustLine', { ...(c.trustLine || {}), [key]: e.target.checked })}
                    style={{ width: 18, height: 18, accentColor: '#d4af37' }}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <div className="content-form two">
            <div className="field">
              <label>Brand trust band — headline</label>
              <input value={c.brandTrust?.headline || ''} onChange={(e) => set('brandTrust', { ...(c.brandTrust || {}), headline: e.target.value })} />
            </div>
            <div className="field">
              <label>Brand trust band — promise line</label>
              <input value={c.brandTrust?.promise || ''} onChange={(e) => set('brandTrust', { ...(c.brandTrust || {}), promise: e.target.value })} />
            </div>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <h3>Feedback Banner & Footer</h3>
        <div className="content-form">
          <div className="field"><label>Feedback Title</label><input value={c.feedbackTitle || ''} onChange={(e) => set('feedbackTitle', e.target.value)} /></div>
          <div className="field"><label>Feedback Text</label><textarea value={c.feedbackText || ''} onChange={(e) => set('feedbackText', e.target.value)} /></div>
          <div className="field"><label>Footer Heading</label><input value={c.footerHeading || ''} onChange={(e) => set('footerHeading', e.target.value)} /></div>
          <div className="field"><label>Footer Text</label><textarea value={c.footerText || ''} onChange={(e) => set('footerText', e.target.value)} /></div>
        </div>
      </div>

      <div className="save-bar">
        <button className="btn-pill solid" onClick={save}>Save All Content</button>
        {msg && <span className="save-msg">{msg}</span>}
      </div>
    </div>
  )
}

/* ---------------- USERS ---------------- */
interface AdminUser {
  id: string | number
  name: string
  email: string
  role: string
  active?: boolean
}

function Users() {
  const [items, setItems] = useState<AdminUser[]>([])
  const load = useCallback(() => { api('/api/admin/users').then((d) => setItems(Array.isArray(d) ? d : [])).catch(() => {}) }, [])
  useEffect(() => { load() }, [load])

  const toggle = async (u: AdminUser) => {
    await api(`/api/admin/users/${u.id}`, { method: 'PUT', body: JSON.stringify({ active: !(u.active !== false) }) })
    load()
  }

  return (
    <div className="panel dash-table-panel">
      <div className="dash-table-scroll is-scrollable"><table className="dash-table">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th style={{ textAlign: 'right' }}>Action</th></tr></thead>
        <tbody>
          {items.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
              <td><span className="badge">{u.role}</span></td>
              <td><span className={`badge ${u.active === false ? 'red' : 'green'}`}>{u.active === false ? 'Inactive' : 'Active'}</span></td>
              <td style={{ textAlign: 'right' }}>
                {u.role !== 'admin' && <button className="btn-sm" onClick={() => toggle(u)}>{u.active === false ? 'Activate' : 'Deactivate'}</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </div>
  )
}

/* ---------------- INQUIRIES ---------------- */
interface InquiryItem {
  id: string | number
  name: string
  phone: string
  email?: string
  tier?: string
  message?: string
  createdAt?: string
}

function Inquiries() {
  const [items, setItems] = useState<InquiryItem[]>([])
  useEffect(() => { api('/api/admin/consultations').then((d) => setItems(Array.isArray(d) ? d : [])).catch(() => {}) }, [])

  return (
    <div className="panel dash-table-panel">
      <div className="dash-table-scroll is-scrollable"><table className="dash-table">
        <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Interest</th><th>Message</th><th>Date</th></tr></thead>
        <tbody>
          {items.length === 0 && <tr><td colSpan={6} style={{ color: 'var(--text-muted)', padding: 24 }}>No inquiries yet.</td></tr>}
          {items.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td className="gold-text">{c.phone}</td>
              <td style={{ color: 'var(--text-muted)' }}>{c.email || '—'}</td>
              <td><span className="badge">{TIER_LABELS[c.tier || ''] || c.tier || '—'}</span></td>
              <td style={{ color: 'var(--text-muted)', maxWidth: 260 }}>{c.message || '—'}</td>
              <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </div>
  )
}

/* ---------------- SHELL ---------------- */
export function Dashboard() {
  const navigate = useNavigate()
  const { user: me, logout: authLogout } = useAuth()
  const [tab, setTab] = useState('overview')
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    if (!navOpen) return undefined
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setNavOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navOpen])

  useEffect(() => {
    document.body.style.overflow = navOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [navOpen])

  const selectTab = (key: string) => {
    setTab(key)
    setNavOpen(false)
  }

  const logout = async () => {
    await authLogout()
    navigate('/login')
  }

  const titles: Record<string, [string, string]> = {
    overview: ['Overview', 'Key metrics and visitor analytics at a glance'],
    products: ['Products', 'Full PDP editor — media, story, ingredients, SEO, and bundles'],
    reviews: ['Reviews', 'Approve or reject customer product reviews before they appear on the storefront'],
    packages: ['Packages', 'Manage the bespoke formulation packages and their inclusions'],
    categories: ['Categories', 'Rename tiers and edit their intro copy'],
    content: ['Website Content', 'Edit the storefront copy without touching code'],
    users: ['Users', 'Registered members of DERMATICS'],
    inquiries: ['Inquiries', 'Product & package inquiries submitted by visitors'],
    diagnostics: ['Consultations', 'Diagnostic intake submissions (sensitive — admin only)'],
  }

  return (
    <div className={`dash${navOpen ? ' dash-nav-open' : ''}`}>
      <div className="ambient-glow" />
      <AppHeader
        brandSuffix="Admin"
        leftSlot={(
          <button
            type="button"
            className="dash-menu-btn"
            onClick={() => setNavOpen((open) => !open)}
            aria-expanded={navOpen}
            aria-controls="dash-sidebar"
            aria-label={navOpen ? 'Close navigation' : 'Open navigation'}
          >
            <span className="dash-menu-icon" aria-hidden="true" />
          </button>
        )}
      />
      <button
        type="button"
        className="dash-nav-backdrop"
        aria-label="Close navigation"
        tabIndex={navOpen ? 0 : -1}
        onClick={() => setNavOpen(false)}
      />
      <div className="dash-body">
      <aside id="dash-sidebar" className="dash-sidebar">
        <div className="dash-sidebar-head">
          <span className="dash-sidebar-title">Navigation</span>
          <button type="button" className="dash-sidebar-close" onClick={() => setNavOpen(false)} aria-label="Close menu">
            ×
          </button>
        </div>
        <div className="dash-brand gold-text">DERMATICS</div>
        <div className="dash-brand-sub">Admin</div>
        <nav className="dash-nav">
          {NAV.map((n) => (
            <button key={n.key} className={tab === n.key ? 'active' : ''} onClick={() => selectTab(n.key)}>{n.label}</button>
          ))}
        </nav>
        <button className="dash-logout" onClick={logout}>Sign Out{me ? ` (${me.name})` : ''}</button>
      </aside>

      <main className="dash-main">
        <h1 className="dash-title gold-text">{titles[tab]?.[0]}</h1>
        <p className="dash-subtitle">{titles[tab]?.[1]}</p>
        {tab === 'overview' && <Overview />}
        {tab === 'products' && <Products />}
        {tab === 'reviews' && <ReviewModeration />}
        {tab === 'packages' && <Packages />}
        {tab === 'categories' && <Categories />}
        {tab === 'content' && <Content />}
        {tab === 'users' && <Users />}
        {tab === 'inquiries' && <Inquiries />}
        {tab === 'diagnostics' && <Diagnostics />}
      </main>
      </div>
    </div>
  )
}

export default Dashboard
