import { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '@/lib/api'
import { CatalogProductCard } from '@/components/storefront/CatalogProductCard'
import { HOME_TIER_PREVIEW_LIMIT } from '@/lib/catalog'
import type { Product, Package } from '@/types'

interface Tab {
  key: string
  label: string
}

const DEFAULT_TABS: Tab[] = [
  { key: 'premium', label: 'Premium' },
  { key: 'ultra', label: 'Ultra Premium' },
  { key: 'super', label: 'Super Ultra Premium Luxury' },
]

interface StorefrontPageContent {
  heroTitle?: string
  heroSub?: string
  flagshipTitle?: string
  flagshipSub?: string
  whatTitle?: string
  whatText?: string
  whyTitle?: string
  whyText?: string
  process?: Array<{ n: number; title: string; text: string }>
  feedbackTitle?: string
  feedbackText?: string
  footerHeading?: string
  footerText?: string
  phone?: string
  key?: string
}

const DEFAULT_CONTENT: StorefrontPageContent = {
  heroTitle: 'DERMATICS',
  heroSub: 'The Art & Science of Bespoke Skincare',
  flagshipTitle: 'MY SKIN MY FORMULATION',
  flagshipSub: 'Customise Skin Care Solution For Skin Lovers',
  whatTitle: 'What is My Skin My Formulation?',
  whatText: '',
  whyTitle: 'Why My Skin My Formulation?',
  whyText: '',
  process: [],
  feedbackTitle: 'Infinite Perfection Guarantee',
  feedbackText: '',
  footerHeading: 'Ready For Your Bespoke Formulation?',
  footerText: 'Speak with our concierge and begin a skincare ritual designed entirely around you.',
  phone: '+91 98765 43210',
}

/* ---------- analytics ---------- */
function getSid(): string | null {
  if (typeof window === 'undefined') return null
  let sid = localStorage.getItem('dermatics_sid')
  if (!sid) {
    sid = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random()
    localStorage.setItem('dermatics_sid', sid)
  }
  return sid
}

function track(event_type: string, metadata: Record<string, unknown> = {}) {
  try {
    apiFetch('/api/analytics/event', {
      method: 'POST',
      body: JSON.stringify({
        event_type,
        page: '/',
        metadata,
        session_id: getSid(),
        referrer: typeof document !== 'undefined' ? document.referrer : '',
        device: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      }),
    })
  } catch { /* ignore */ }
}

const PackageCard = ({ pkg, onChoose }: { pkg: Package; onChoose: (p: Package) => void }) => (
  <div className={`package-card ${pkg.recommended ? 'recommended' : ''}`}>
    {pkg.recommended && <span className="package-badge">Recommended</span>}
    <h3 className="package-name gold-text">{pkg.name}</h3>
    <p className="package-desc">{pkg.description}</p>
    <div className="package-price gold-text"><span className="cur">$</span>{pkg.price.toLocaleString()}</div>
    <div className="package-per">Program Fee</div>
    <ul className="package-features">
      {(pkg.features || []).map((f, i) => (
        <li key={i}><span className="tick">&#10003;</span><span>{f}</span></li>
      ))}
    </ul>
    <button className="btn-pill solid" style={{ width: '100%', justifyContent: 'center' }} onClick={() => onChoose(pkg)}>Choose Package</button>
  </div>
)

interface FaqItemData {
  id: string | number
  question: string
  answer: string
}

const FaqItem = ({ faq, open, onToggle }: { faq: FaqItemData; open: boolean; onToggle: () => void }) => (
  <div className={`faq-item ${open ? 'open' : ''}`}>
    <button className="faq-q" onClick={onToggle}>
      <span>{faq.question}</span>
      <span className="faq-icon">{open ? '\u2212' : '+'}</span>
    </button>
    <div className="faq-a" style={{ maxHeight: open ? '400px' : '0px' }}>
      <div className="faq-a-inner">{faq.answer}</div>
    </div>
  </div>
)

interface ConsultationModalProps {
  open: boolean
  onClose: () => void
  product: { name: string; tier?: string } | null
  variant: string | null
}

const ConsultationModal = ({ open, onClose, product, variant }: ConsultationModalProps) => {
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  useEffect(() => {
    if (open) {
      setStatus('idle')
      const label = product ? `${product.name}${variant ? ` (${variant})` : ''}` : null
      setForm({ name: '', phone: '', email: '', message: label ? `I'm interested in ${label}.` : '' })
    }
  }, [open, product, variant])

  if (!open) return null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await apiFetch('/api/consultation', {
        method: 'POST',
        body: JSON.stringify({ ...form, tier: product ? `${product.tier}${variant ? ` · ${variant}` : ''}` : 'bespoke' }),
      })
      if (!res.ok) throw new Error('failed')
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  const label = product ? `${product.name}${variant ? ` — ${variant}` : ''}` : null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        {status === 'success' ? (
          <div className="modal-success">
            <div className="check gold-text">&#10003;</div>
            <h3 className="gold-text">Thank You</h3>
            <p className="modal-sub">Our concierge will reach out shortly to schedule your bespoke consultation.</p>
            <button className="btn-pill solid" onClick={onClose}>Close</button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <h3 className="gold-text">Book Consultation</h3>
            <p className="modal-sub">{label ? `Enquiry for ${label}` : 'Begin your bespoke formulation journey.'}</p>
            <label>Full Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" required />
            <label>Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 ..." required />
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@email.com" />
            <label>Message</label>
            <textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell us about your skin goals" />
            <div style={{ marginTop: 24 }}>
              <button className="btn-pill solid" type="submit" style={{ width: '100%', justifyContent: 'center' }} disabled={status === 'loading'}>
                {status === 'loading' ? 'Sending...' : 'Request Consultation'}
              </button>
            </div>
            {status === 'error' && <p style={{ color: '#e57373', fontSize: 13, marginTop: 12, textAlign: 'center' }}>Something went wrong. Please try again.</p>}
          </form>
        )}
      </div>
    </div>
  )
}

/* ---------- chunked upload (bypasses proxy body limits) ---------- */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const r = new FileReader()
    r.onloadend = () => resolve(String(r.result).split(',')[1])
    r.readAsDataURL(blob)
  })
}

async function uploadFileChunked(file: File, onProgress: (pct: number) => void) {
  const uploadId = ((crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2))).replace(/[^a-zA-Z0-9-]/g, '')
  const CHUNK = 500 * 1024
  const total = Math.max(1, Math.ceil(file.size / CHUNK))
  for (let i = 0; i < total; i++) {
    const blob = file.slice(i * CHUNK, (i + 1) * CHUNK)
    const data = await blobToBase64(blob)
    await apiFetch('/api/upload/chunk', { method: 'POST', body: JSON.stringify({ uploadId, index: i, total, data }) })
    onProgress(Math.round(((i + 1) / total) * 100))
  }
  const res = await apiFetch('/api/upload/complete', { method: 'POST', body: JSON.stringify({ uploadId, fileName: file.name, contentType: file.type || 'application/octet-stream' }) })
  const d = await res.json()
  return { fileId: d.fileId, name: file.name, type: file.type }
}

const STEPS = ['Personal Info', 'Medical Info', 'Photo Upload', 'Review & Submit']

const CONSULTATION_FEE = 1999

interface ConsultationDoctor {
  key: string
  label: string
}

const CONSULTATION_DOCTORS: ConsultationDoctor[] = [
  { key: 'homeopathy', label: 'Homeopathy' },
  { key: 'naturo', label: 'Naturo' },
  { key: 'dermatologics', label: 'Dermatologics' },
]

interface ConsultationBookingConfig {
  fee: number
  doctors: ConsultationDoctor[]
  doctorSummary: string
}

const CONSULTATION_BOOKING: ConsultationBookingConfig = {
  fee: CONSULTATION_FEE,
  doctors: CONSULTATION_DOCTORS,
  doctorSummary: CONSULTATION_DOCTORS.map((d) => d.label).join(' · '),
}

const formatInr = (amount: number) => `₹${Number(amount).toLocaleString('en-IN')}`

interface FileItem {
  tempId: string
  name: string
  type: string
  preview: string | null
  progress: number
  fileId: string | null
}

const FileThumb = ({ item, onRemove }: { item: FileItem; onRemove: () => void }) => (
  <div className="thumb">
    {item.preview ? <img src={item.preview} alt={item.name} /> : <div className="pdf">PDF</div>}
    {item.progress < 100 && <div className="bar" style={{ width: `${item.progress}%` }} />}
    <div className="cap">{item.name}</div>
    <button type="button" className="rm" onClick={onRemove}>&times;</button>
  </div>
)

function DiagnosticBooking() {
  const [formOpen, setFormOpen] = useState(false)

  if (!formOpen) {
    return (
      <div className="diag-wrap" id="diagnostic">
        <h3 className="gold-text">Book Appointment</h3>
        <p className="diag-intro">Choose a consultation with one of our three specialists. After you select, complete the confidential diagnostic intake below.</p>
        <div className="consult-book-wrap">
          <button
            type="button"
            className="consult-book-btn"
            onClick={() => {
              track('cta_click', { location: 'diagnostic_book' })
              setFormOpen(true)
            }}
          >
            <span className="consult-book-cta gold-text">Book Appointment</span>
            <p className="consult-book-lead">We have three doctors — you will consult with each of them:</p>
            <ul className="consult-doctor-list">
              {CONSULTATION_DOCTORS.map((d) => (
                <li key={d.key}>{d.label}</li>
              ))}
            </ul>
            <p className="consult-book-note">One consultation fee covers your sessions with Homeopathy, Naturo, and Dermatologics.</p>
            <span className="consult-book-fee">
              Consultation Fee · <strong className="gold-text">{formatInr(CONSULTATION_FEE)}</strong>
            </span>
          </button>
        </div>
      </div>
    )
  }

  return <DiagnosticForm consultation={CONSULTATION_BOOKING} onBack={() => setFormOpen(false)} />
}

interface DiagnosticFormProps {
  consultation: ConsultationBookingConfig
  onBack: () => void
}

function DiagnosticForm({ consultation, onBack }: DiagnosticFormProps) {
  const [step, setStep] = useState(1)
  const [p, setP] = useState({ fullName: '', email: '', phone: '', address: '' })
  const [m, setM] = useState({ bloodGroup: '', allergies: '', currentRoutine: '' })
  const [reports, setReports] = useState<FileItem[]>([])
  const [photos, setPhotos] = useState<FileItem[]>([])
  const [consent, setConsent] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const setField = <T, K extends keyof T>(setter: React.Dispatch<React.SetStateAction<T>>, obj: T, k: K, v: T[K]) => setter({ ...obj, [k]: v })

  const handleFiles = async (fileList: FileList | null, setter: React.Dispatch<React.SetStateAction<FileItem[]>>) => {
    if (!fileList) return
    const files = Array.from(fileList)
    for (const file of files) {
      const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : null
      const tempId = Math.random().toString(36).slice(2)
      const entry: FileItem = { tempId, name: file.name, type: file.type, preview, progress: 0, fileId: null }
      setter((prev) => [...prev, entry])
      try {
        const uploaded = await uploadFileChunked(file, (prog) => {
          setter((prev) => prev.map((it) => (it.tempId === tempId ? { ...it, progress: prog } : it)))
        })
        setter((prev) => prev.map((it) => (it.tempId === tempId ? { ...it, progress: 100, fileId: uploaded.fileId } : it)))
      } catch {
        setter((prev) => prev.filter((it) => it.tempId !== tempId))
      }
    }
  }

  const submit = async () => {
    setStatus('loading')
    try {
      const res = await apiFetch('/api/diagnostic-consultation', {
        method: 'POST',
        body: JSON.stringify({
          ...p, ...m, consent,
          consultationDoctors: consultation.doctors.map((d) => d.label),
          consultationFee: consultation.fee,
          reportFileIds: reports.filter((r) => r.fileId).map((r) => r.fileId),
          facePhotoFileIds: photos.filter((r) => r.fileId).map((r) => r.fileId),
        }),
      })
      if (!res.ok) throw new Error('failed')
      setStatus('success')
    } catch { setStatus('error') }
  }

  if (status === 'success') {
    return (
      <div className="diag-wrap" id="diagnostic">
        <div className="modal-success">
          <div className="check gold-text">&#10003;</div>
          <h3 className="gold-text">Submission Received</h3>
          <p className="diag-intro">Thank you. Our dermatology team will review your diagnostic intake and reach out to schedule your consultation. Your information is stored privately and shared only with your scientific board.</p>
        </div>
      </div>
    )
  }

  const canNext = step === 1 ? (!!p.fullName && !!p.phone) : step === 4 ? consent : true

  return (
    <div className="diag-wrap" id="diagnostic">
      <div className="diag-head">
        <button type="button" className="diag-back" onClick={onBack}>&larr; Back</button>
        <div className="diag-fee-badge">
          <span className="diag-fee-label">Consultation Fee</span>
          <span className="diag-fee-amount gold-text">{formatInr(consultation.fee)}</span>
        </div>
      </div>
      <h3 className="gold-text">Diagnostic Intake</h3>
      <p className="diag-intro">Consultation with {consultation.doctorSummary} — complete your confidential skin diagnostic so our team can design your bespoke formulation.</p>

      <div className="wizard-steps">
        {STEPS.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className={`wizard-step ${step === i + 1 ? 'active' : ''} ${step > i + 1 ? 'done' : ''}`}>
              <span className="num">{step > i + 1 ? '\u2713' : i + 1}</span>
              <span>{s}</span>
            </div>
            {i < STEPS.length - 1 && <span className="wizard-sep" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="diag-grid">
          <div className="field"><label>Full Name *</label><input value={p.fullName} onChange={(e) => setField(setP, p, 'fullName', e.target.value)} placeholder="Your full name" /></div>
          <div className="field"><label>Phone *</label><input value={p.phone} onChange={(e) => setField(setP, p, 'phone', e.target.value)} placeholder="+91 ..." /></div>
          <div className="field"><label>Email</label><input type="email" value={p.email} onChange={(e) => setField(setP, p, 'email', e.target.value)} placeholder="you@email.com" /></div>
          <div className="field full"><label>Delivery Address</label><textarea value={p.address} onChange={(e) => setField(setP, p, 'address', e.target.value)} placeholder="Where should we deliver your formulation?" /></div>
        </div>
      )}

      {step === 2 && (
        <div className="diag-grid">
          <div className="field"><label>Blood Group</label>
            <select value={m.bloodGroup} onChange={(e) => setField(setM, m, 'bloodGroup', e.target.value)}>
              <option value="">Select</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="field"><label>Known Allergies / Skin Conditions</label><input value={m.allergies} onChange={(e) => setField(setM, m, 'allergies', e.target.value)} placeholder="e.g. eczema, fragrance allergy" /></div>
          <div className="field full"><label>Current Skincare Routine / Products Used</label><textarea value={m.currentRoutine} onChange={(e) => setField(setM, m, 'currentRoutine', e.target.value)} placeholder="Tell us what you currently use" /></div>
          <div className="full">
            <span className="file-label">Existing Medical Reports (PDF or image, multiple)</span>
            <label className="file-drop">
              <input type="file" accept="application/pdf,image/*" multiple style={{ display: 'none' }} onChange={(e) => handleFiles(e.target.files, setReports)} />
              <div className="gold-text" style={{ fontFamily: 'var(--font-serif)', fontSize: 20 }}>Click to upload reports</div>
              <div className="hint">PDF, JPG, PNG · up to 25MB each · stored privately</div>
            </label>
            <div className="thumb-grid">{reports.map((it) => <FileThumb key={it.tempId} item={it} onRemove={() => setReports((prev) => prev.filter((x) => x.tempId !== it.tempId))} />)}</div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <p className="diag-intro" style={{ marginBottom: 20 }}>Upload clear, well-lit photos of your face. Please include a <b style={{ color: 'var(--gold-primary)' }}>front-facing</b>, <b style={{ color: 'var(--gold-primary)' }}>left profile</b>, and <b style={{ color: 'var(--gold-primary)' }}>right profile</b> shot for an accurate diagnostic.</p>
          <label className="file-drop">
            <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(e) => handleFiles(e.target.files, setPhotos)} />
            <div className="gold-text" style={{ fontFamily: 'var(--font-serif)', fontSize: 20 }}>Click to upload face photos</div>
            <div className="hint">Front · Left Profile · Right Profile · stored privately</div>
          </label>
          <div className="thumb-grid">{photos.map((it) => <FileThumb key={it.tempId} item={it} onRemove={() => setPhotos((prev) => prev.filter((x) => x.tempId !== it.tempId))} />)}</div>
        </div>
      )}

      {step === 4 && (
        <div>
          <div className="review-row"><span className="k">Doctors</span><span className="v">{consultation.doctorSummary}</span></div>
          <div className="review-row"><span className="k">Consultation Fee</span><span className="v">{formatInr(consultation.fee)}</span></div>
          <div className="review-row"><span className="k">Full Name</span><span className="v">{p.fullName || '—'}</span></div>
          <div className="review-row"><span className="k">Phone</span><span className="v">{p.phone || '—'}</span></div>
          <div className="review-row"><span className="k">Email</span><span className="v">{p.email || '—'}</span></div>
          <div className="review-row"><span className="k">Address</span><span className="v">{p.address || '—'}</span></div>
          <div className="review-row"><span className="k">Blood Group</span><span className="v">{m.bloodGroup || '—'}</span></div>
          <div className="review-row"><span className="k">Allergies</span><span className="v">{m.allergies || '—'}</span></div>
          <div className="review-row"><span className="k">Medical Reports</span><span className="v">{reports.length} file(s)</span></div>
          <div className="review-row"><span className="k">Face Photos</span><span className="v">{photos.length} file(s)</span></div>
          <div className="consent-row" style={{ marginTop: 22 }}>
            <input id="consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <label htmlFor="consent">I consent to share my medical information and photographs with DERMATICS for the sole purpose of creating my bespoke formulation. This sensitive data is stored privately, accessible only to the authorised dermatology team, and never shared publicly or sold. I can request its deletion at any time.</label>
          </div>
          {status === 'error' && <p style={{ color: '#e57373', fontSize: 13, marginTop: 14, textAlign: 'center' }}>Something went wrong. Please try again.</p>}
        </div>
      )}

      <div className="wizard-nav">
        <button className="btn-pill" style={{ visibility: step > 1 ? 'visible' : 'hidden' }} onClick={() => setStep(step - 1)}>Back</button>
        {step < 4 ? (
          <button className="btn-pill solid" disabled={!canNext} onClick={() => canNext && setStep(step + 1)}>Continue</button>
        ) : (
          <button className="btn-pill solid" disabled={!consent || status === 'loading'} onClick={submit}>{status === 'loading' ? 'Submitting...' : 'Submit Diagnostic'}</button>
        )}
      </div>
    </div>
  )
}

interface TeamMember {
  id: string | number
  name: string
  role: string
  bio: string
  imageUrl?: string
}

export function HomePage() {
  const [active, setActive] = useState('premium')
  const [tabs, setTabs] = useState<Tab[]>(DEFAULT_TABS)
  const [intros, setIntros] = useState<Record<string, { title?: string; text?: string }>>({})
  const [content, setContent] = useState<StorefrontPageContent>(DEFAULT_CONTENT)
  const [products, setProducts] = useState<Product[]>([])
  const [team, setTeam] = useState<TeamMember[]>([])
  const [faqs, setFaqs] = useState<FaqItemData[]>([])
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalProduct, setModalProduct] = useState<{ name: string; tier?: string } | null>(null)
  const [modalVariant, setModalVariant] = useState<string | null>(null)
  const [packages, setPackages] = useState<Package[]>([])
  const viewed = useRef(false)
  const [searchQ, setSearchQ] = useState('')

  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (['premium', 'ultra', 'super'].includes(hash)) setActive(hash)
    const q = new URLSearchParams(window.location.search).get('q')
    if (q) setSearchQ(q.toLowerCase())
  }, [])

  useEffect(() => {
    if (!viewed.current) { viewed.current = true; track('page_view', {}) }
    apiFetch('/api/products').then((r) => r.json()).then((d) => setProducts(Array.isArray(d) ? d : [])).catch(() => {})
    apiFetch('/api/team').then((r) => r.json()).then((d) => setTeam(Array.isArray(d) ? d : [])).catch(() => {})
    apiFetch('/api/faqs').then((r) => r.json()).then((d) => setFaqs(Array.isArray(d) ? d : [])).catch(() => {})
    apiFetch('/api/packages').then((r) => r.json()).then((d) => setPackages(Array.isArray(d) ? d : [])).catch(() => {})
    apiFetch('/api/content').then((r) => r.json()).then((d) => { if (d && d.key) setContent(d) }).catch(() => {})
    apiFetch('/api/categories').then((r) => r.json()).then((d) => {
      if (Array.isArray(d) && d.length) {
        setTabs(d.map((c: any) => ({ key: c.key, label: c.label })))
        const m: Record<string, { title?: string; text?: string }> = {}
        d.forEach((c: any) => { m[c.key] = { title: c.introTitle, text: c.introText } })
        setIntros(m)
      }
    }).catch(() => {})
  }, [])

  const openInquiry = useCallback((p: { name: string; tier?: string } | null, variant?: string | null) => {
    if (p) track('inquiry', { name: p.name, tier: p.tier, variant: variant || null })
    else track('cta_click', { location: 'bespoke' })
    setModalProduct(p || null)
    setModalVariant(variant || null)
    setModalOpen(true)
  }, [])

  const choosePackage = useCallback((pkg: Package) => {
    track('inquiry', { name: pkg.name, tier: 'package' })
    setModalProduct({ name: pkg.name, tier: 'package' })
    setModalVariant(null)
    setModalOpen(true)
  }, [])

  const switchTab = (key: string) => {
    setActive(key)
    setOpenFaq(null)
    track('tab_switch', { tier: key })
  }

  const tierProducts = products.filter((p) => {
    if (p.tier !== active) return false
    if (!searchQ) return true
    const hay = `${p.name} ${p.tag} ${p.description}`.toLowerCase()
    return hay.includes(searchQ)
  })
  const tierPreview = tierProducts.slice(0, HOME_TIER_PREVIEW_LIMIT)
  const tierHasMore = tierProducts.length > HOME_TIER_PREVIEW_LIMIT
  const intro = intros[active] || {}

  return (
    <div className="page">
      <div className="container">
        <div className="switcher-wrap" id="shop">
          <div className="switcher">
            {tabs.map((t) => (
              <button key={t.key} className={active === t.key ? 'active' : ''} onClick={() => switchTab(t.key)}>{t.label}</button>
            ))}
          </div>
        </div>

        {active !== 'super' ? (
          <section className="view" key={active}>
            <div className="section-intro">
              <h2 className="gold-text">{intro.title}</h2>
              <p>{intro.text}</p>
            </div>
            <div className="product-grid">
              {tierPreview.map((p) => (
                <CatalogProductCard key={p.id} p={p} onInquire={openInquiry} className="home-product-card" />
              ))}
            </div>
            {tierHasMore && (
              <div className="shop-preview-cta">
                <p>
                  Showing {tierPreview.length} of {tierProducts.length} in {intro.title || active}
                </p>
                <Link to={`/products#${active}`} className="btn-pill solid">
                  View all products
                </Link>
              </div>
            )}
            {!tierHasMore && tierProducts.length > 0 && (
              <div className="shop-preview-cta shop-preview-cta--subtle">
                <Link to={`/products#${active}`} className="btn-pill">Browse full catalog</Link>
              </div>
            )}
          </section>
        ) : (
          <section className="view" key="super">
            <div className="flagship-hero" id="our-story">
              <h1 className="gold-text">{(content.flagshipTitle || '').split(' ').length > 2 ? <>{content.flagshipTitle?.split(' ').slice(0, 2).join(' ')}<br />{content.flagshipTitle?.split(' ').slice(2).join(' ')}</> : content.flagshipTitle}</h1>
              <p className="sub">{content.flagshipSub}</p>
            </div>

            <div className="article-blocks">
              <div className="article-block">
                <h3 className="gold-text">{content.whatTitle}</h3>
                <p>{content.whatText}</p>
              </div>
              <div className="article-block">
                <h3 className="gold-text">{content.whyTitle}</h3>
                <p>{content.whyText}</p>
              </div>
            </div>

            {packages.length > 0 && (
              <>
                <h2 className="block-heading gold-text">Choose Your Formulation Package</h2>
                <div className="packages-grid">
                  {packages.map((pkg) => (<PackageCard key={pkg.id} pkg={pkg} onChoose={choosePackage} />))}
                </div>
              </>
            )}

            <h2 className="block-heading gold-text">How It Works</h2>
            <div className="process-grid">
              {(content.process || []).map((s) => (
                <div className="process-step" key={s.n}>
                  <span className="process-num">{s.n}</span>
                  <h4>{s.title}</h4>
                  <p>{s.text}</p>
                </div>
              ))}
            </div>

            <DiagnosticBooking />

            <div className="feedback-banner">
              <h3 className="gold-text">{content.feedbackTitle}</h3>
              <p>{content.feedbackText}</p>
            </div>

            <h2 className="block-heading gold-text" id="the-lab">The Master Minds</h2>
            <div className="team-grid">
              {team.map((m) => (
                <div className="team-member" key={m.id}>
                  <div className="team-photo"><img src={m.imageUrl} alt={m.name} /></div>
                  <h4>{m.name}</h4>
                  <div className="team-role">{m.role}</div>
                  <p className="team-bio">{m.bio}</p>
                </div>
              ))}
            </div>

            <h2 className="block-heading gold-text" id="faq">Frequently Asked Questions</h2>
            <div className="faq-wrap">
              {faqs.map((f, i) => (
                <FaqItem key={f.id} faq={f} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />
              ))}
            </div>

            <div style={{ textAlign: 'center', paddingBottom: 60 }}>
              <button className="btn-pill solid" onClick={() => openInquiry(null)}>Book Your Bespoke Consultation</button>
            </div>
          </section>
        )}
      </div>

      <ConsultationModal open={modalOpen} onClose={() => setModalOpen(false)} product={modalProduct} variant={modalVariant} />
    </div>
  )
}

export default HomePage
