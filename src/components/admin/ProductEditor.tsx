import { useEffect, useState } from 'react'
import { buildProductSavePayload, ensureProductForm } from '@/lib/pdpAdmin'
import type { Product } from '@/types'

const TABS = [
  { key: 'basics', label: 'Basics' },
  { key: 'media', label: 'Media' },
  { key: 'variants', label: 'Variants & Pricing' },
  { key: 'highlights', label: 'Highlights' },
  { key: 'story', label: 'Story & Banners' },
  { key: 'ingredients', label: 'Ingredients' },
  { key: 'info', label: 'Info & FAQs' },
  { key: 'related', label: 'Related & Bundles' },
  { key: 'seo', label: 'SEO' },
]

function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr
  const next = [...arr]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

interface LabelItem {
  label: string
  icon?: string
}

interface LabelListProps {
  items?: LabelItem[]
  onChange: (items: LabelItem[]) => void
  placeholder?: string
}

function LabelList({ items, onChange, placeholder }: LabelListProps) {
  const list = items?.length ? items : [{ label: '', icon: '' }]
  return (
    <div className="admin-list-editor">
      {list.map((row, i) => (
        <div key={i} className="admin-list-row">
          <input
            placeholder={placeholder || 'Label'}
            value={row.label || ''}
            onChange={(e) => {
              const copy = [...list]
              copy[i] = { ...copy[i], label: e.target.value }
              onChange(copy.filter((x) => x.label || copy.length === 1))
            }}
          />
          <button type="button" className="btn-sm danger" onClick={() => onChange(list.filter((_, idx) => idx !== i))}>×</button>
        </div>
      ))}
      <button type="button" className="btn-sm" onClick={() => onChange([...list, { label: '', icon: '' }])}>+ Add</button>
    </div>
  )
}

export interface ProductEditorProps {
  product?: Partial<Product> | null
  allProducts?: Product[]
  onClose: () => void
  onSave: (payload: any) => Promise<void> | void
}

export function ProductEditor({ product, allProducts, onClose, onSave }: ProductEditorProps) {
  const [tab, setTab] = useState('basics')
  const [f, setF] = useState<any>(() => ensureProductForm(product))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setF(ensureProductForm(product))
    setTab('basics')
  }, [product])

  const set = (k: string, v: any) => setF((prev: any) => ({ ...prev, [k]: v }))
  const setPdp = (k: string, v: any) => setF((prev: any) => ({ ...prev, pdp: { ...prev.pdp, [k]: v } }))
  const setNested = (parent: string, k: string, v: any) => setF((prev: any) => ({
    ...prev,
    pdp: { ...prev.pdp, [parent]: { ...prev.pdp[parent], [k]: v } },
  }))

  const previewSlug = f.slug || (f.name ? f.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : '')
  const previewUrl = previewSlug ? `/products/${previewSlug}` : null

  const save = async () => {
    setSaving(true)
    try {
      await onSave(buildProductSavePayload(f))
    } finally {
      setSaving(false)
    }
  }

  const media = f.pdp?.media || []
  const setMedia = (next: any[]) => setPdp('media', next.map((m, i) => ({ ...m, order: i })))

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal product-editor-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose}>&times;</button>
        <div className="product-editor-head">
          <h3 className="gold-text">{f.id ? 'Edit product' : 'New product'}</h3>
          {previewUrl && (
            <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="btn-sm">
              Preview page
            </a>
          )}
        </div>
        <div className="product-editor-tabs">
          {TABS.map((t) => (
            <button key={t.key} type="button" className={tab === t.key ? 'active' : ''} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="product-editor-body content-form">
          {tab === 'basics' && (
            <>
              <div className="content-form two">
                <div className="field"><label>Name</label><input value={f.name || ''} onChange={(e) => set('name', e.target.value)} /></div>
                <div className="field"><label>Slug</label><input value={f.slug || ''} onChange={(e) => set('slug', e.target.value)} placeholder="auto-generated if empty" /></div>
              </div>
              <div className="content-form two">
                <div className="field"><label>Tier</label>
                  <select value={f.tier || 'premium'} onChange={(e) => set('tier', e.target.value)}>
                    <option value="premium">Premium</option>
                    <option value="ultra">Ultra Premium</option>
                  </select>
                </div>
                <div className="field"><label>Tag</label><input value={f.tag || ''} onChange={(e) => set('tag', e.target.value)} /></div>
              </div>
              <div className="field"><label>Short description (catalog)</label><textarea value={f.description || ''} onChange={(e) => set('description', e.target.value)} /></div>
              <div className="content-form two">
                <div className="field"><label>Base price (INR)</label><input type="number" value={f.price ?? ''} onChange={(e) => set('price', e.target.value)} /></div>
                <div className="field"><label>Compare-at / MRP</label><input type="number" value={f.compareAtPrice ?? ''} onChange={(e) => set('compareAtPrice', e.target.value)} /></div>
              </div>
              <div className="field"><label>Primary image URL</label><input value={f.imageUrl || ''} onChange={(e) => set('imageUrl', e.target.value)} placeholder="https://..." /></div>
              <div className="field"><label>PDP subtitle</label><input value={f.pdp?.subtitle || ''} onChange={(e) => setPdp('subtitle', e.target.value)} /></div>
              <div className="field"><label>Highlight line (above gallery)</label><input value={f.pdp?.highlightLine || ''} onChange={(e) => setPdp('highlightLine', e.target.value)} /></div>
            </>
          )}

          {tab === 'media' && (
            <>
              <p className="admin-hint">Reorder with ↑ ↓. First item is the main gallery image unless variants supply images.</p>
              {media.map((m: any, i: number) => (
                <div key={i} className="admin-media-row">
                  <select value={m.type || 'image'} onChange={(e) => {
                    const copy = [...media]; copy[i] = { ...copy[i], type: e.target.value }; setMedia(copy)
                  }}>
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                  <input className="flex-1" placeholder="https://..." value={m.url || ''} onChange={(e) => {
                    const copy = [...media]; copy[i] = { ...copy[i], url: e.target.value }; setMedia(copy)
                  }} />
                  <button type="button" className="btn-sm" onClick={() => setMedia(moveItem(media, i, i - 1))}>↑</button>
                  <button type="button" className="btn-sm" onClick={() => setMedia(moveItem(media, i, i + 1))}>↓</button>
                  <button type="button" className="btn-sm danger" onClick={() => setMedia(media.filter((_: any, idx: number) => idx !== i))}>×</button>
                </div>
              ))}
              <button type="button" className="btn-sm" onClick={() => setMedia([...media, { type: 'image', url: '', order: media.length }])}>+ Add media</button>
            </>
          )}

          {tab === 'variants' && (
            <>
              {(f.variants || []).map((v: any, i: number) => (
                <div key={i} className="admin-variant-row">
                  <input placeholder="Label" value={v.label || ''} onChange={(e) => {
                    const arr = [...f.variants]; arr[i] = { ...arr[i], label: e.target.value }; set('variants', arr)
                  }} />
                  <input type="number" placeholder="Price" value={v.price ?? ''} onChange={(e) => {
                    const arr = [...f.variants]; arr[i] = { ...arr[i], price: e.target.value }; set('variants', arr)
                  }} />
                  <input type="number" placeholder="MRP" value={v.mrp ?? ''} onChange={(e) => {
                    const arr = [...f.variants]; arr[i] = { ...arr[i], mrp: e.target.value }; set('variants', arr)
                  }} />
                  <input placeholder="Image URL" value={v.imageUrl || ''} onChange={(e) => {
                    const arr = [...f.variants]; arr[i] = { ...arr[i], imageUrl: e.target.value }; set('variants', arr)
                  }} />
                  <label className="admin-check">
                    <input type="checkbox" checked={v.inStock !== false} onChange={(e) => {
                      const arr = [...f.variants]; arr[i] = { ...arr[i], inStock: e.target.checked }; set('variants', arr)
                    }} />
                    In stock
                  </label>
                  <button type="button" className="btn-sm danger" onClick={() => set('variants', f.variants.filter((_: any, idx: number) => idx !== i))}>×</button>
                </div>
              ))}
              <button type="button" className="btn-sm" onClick={() => set('variants', [...(f.variants || []), { label: '', price: '', mrp: '', inStock: true }])}>+ Add variant</button>
            </>
          )}

          {tab === 'highlights' && (
            <>
              <div className="field"><label>Highlight badge (optional)</label><input value={f.pdp?.badge || ''} onChange={(e) => setPdp('badge', e.target.value)} /></div>
              <label className="admin-check field">
                <input type="checkbox" checked={!!f.pdp?.dermatologicallyTested} onChange={(e) => setPdp('dermatologicallyTested', e.target.checked)} />
                Show &quot;Dermatologically Tested&quot; (only if accurate)
              </label>
              <div className="field"><label>Formulated for</label><LabelList items={f.pdp?.formulatedFor} onChange={(v) => setPdp('formulatedFor', v)} /></div>
              <div className="field"><label>Free from</label><LabelList items={f.pdp?.freeFrom} onChange={(v) => setPdp('freeFrom', v)} /></div>
              <div className="field"><label>Longevity tips</label><LabelList items={f.pdp?.proTips} onChange={(v) => setPdp('proTips', v)} /></div>
              <div className="field"><label>Guarantee title</label><input value={f.pdp?.guarantee?.title || ''} onChange={(e) => setNested('guarantee', 'title', e.target.value)} /></div>
              <div className="field"><label>Guarantee body</label><textarea rows={4} value={f.pdp?.guarantee?.body || ''} onChange={(e) => setNested('guarantee', 'body', e.target.value)} /></div>
              <div className="field"><label>Stats (leave value empty to hide on site)</label>
                {(f.pdp?.stats || []).map((s: any, i: number) => (
                  <div key={i} className="admin-list-row">
                    <input placeholder="Value" value={s.value || ''} onChange={(e) => {
                      const copy = [...(f.pdp?.stats || [])]; copy[i] = { ...copy[i], value: e.target.value }; setPdp('stats', copy)
                    }} />
                    <input placeholder="Suffix" value={s.suffix || ''} onChange={(e) => {
                      const copy = [...(f.pdp?.stats || [])]; copy[i] = { ...copy[i], suffix: e.target.value }; setPdp('stats', copy)
                    }} />
                    <input placeholder="Label" value={s.label || ''} onChange={(e) => {
                      const copy = [...(f.pdp?.stats || [])]; copy[i] = { ...copy[i], label: e.target.value }; setPdp('stats', copy)
                    }} />
                    <button type="button" className="btn-sm danger" onClick={() => setPdp('stats', (f.pdp?.stats || []).filter((_: any, idx: number) => idx !== i))}>×</button>
                  </div>
                ))}
                <button type="button" className="btn-sm" onClick={() => setPdp('stats', [...(f.pdp?.stats || []), { value: '', suffix: '', label: '' }])}>+ Add stat</button>
              </div>
            </>
          )}

          {tab === 'story' && (
            <>
              <h4 className="gold-text">Hero banner</h4>
              <div className="field"><label>Section heading</label><input value={f.pdp?.heroBanner?.sectionHeading || ''} onChange={(e) => setNested('heroBanner', 'sectionHeading', e.target.value)} /></div>
              <div className="field"><label>Headline</label><input value={f.pdp?.heroBanner?.headline || ''} onChange={(e) => setNested('heroBanner', 'headline', e.target.value)} /></div>
              <div className="field"><label>Stat lines (one per line)</label><textarea value={(f.pdp?.heroBanner?.lines || []).join('\n')} onChange={(e) => setNested('heroBanner', 'lines', e.target.value.split('\n').map((s: string) => s.trim()).filter(Boolean))} /></div>
              <div className="content-form two">
                <div className="field"><label>Desktop image URL</label><input value={f.pdp?.heroBanner?.desktopImage || ''} onChange={(e) => setNested('heroBanner', 'desktopImage', e.target.value)} /></div>
                <div className="field"><label>Mobile image URL</label><input value={f.pdp?.heroBanner?.mobileImage || ''} onChange={(e) => setNested('heroBanner', 'mobileImage', e.target.value)} /></div>
              </div>
              <h4 className="gold-text">Story modal</h4>
              <div className="field"><label>Story image</label><input value={f.pdp?.story?.image || ''} onChange={(e) => setNested('story', 'image', e.target.value)} /></div>
              <div className="field"><label>Story title</label><input value={f.pdp?.story?.title || ''} onChange={(e) => setNested('story', 'title', e.target.value)} /></div>
              <div className="field"><label>Story body</label><textarea rows={6} value={f.pdp?.story?.body || ''} onChange={(e) => setNested('story', 'body', e.target.value)} /></div>
              <h4 className="gold-text">Blend marquee</h4>
              <div className="field"><label>Technology title</label><input value={f.pdp?.blendMarquee?.title || ''} onChange={(e) => setNested('blendMarquee', 'title', e.target.value)} /></div>
              <div className="field"><label>Descriptors (one per line)</label><textarea value={(f.pdp?.blendMarquee?.descriptors || []).join('\n')} onChange={(e) => setNested('blendMarquee', 'descriptors', e.target.value.split('\n').map((s: string) => s.trim()).filter(Boolean))} /></div>
              <h4 className="gold-text">Action videos</h4>
              {(f.pdp?.actionVideos || []).map((v: any, i: number) => (
                <div key={i} className="admin-list-row">
                  <input placeholder="Video URL" value={v.url || ''} onChange={(e) => {
                    const copy = [...(f.pdp?.actionVideos || [])]; copy[i] = { ...copy[i], url: e.target.value }; setPdp('actionVideos', copy)
                  }} />
                  <input placeholder="Title" value={v.title || ''} onChange={(e) => {
                    const copy = [...(f.pdp?.actionVideos || [])]; copy[i] = { ...copy[i], title: e.target.value }; setPdp('actionVideos', copy)
                  }} />
                  <button type="button" className="btn-sm danger" onClick={() => setPdp('actionVideos', (f.pdp?.actionVideos || []).filter((_: any, idx: number) => idx !== i))}>×</button>
                </div>
              ))}
              <button type="button" className="btn-sm" onClick={() => setPdp('actionVideos', [...(f.pdp?.actionVideos || []), { url: '', title: '' }])}>+ Add video</button>
              <h4 className="gold-text">Benefit banners</h4>
              {(f.pdp?.benefitBanners || []).map((b: any, i: number) => (
                <div key={i} className="admin-banner-block">
                  <input placeholder="Desktop URL" value={b.desktopImage || ''} onChange={(e) => {
                    const copy = [...(f.pdp?.benefitBanners || [])]; copy[i] = { ...copy[i], desktopImage: e.target.value }; setPdp('benefitBanners', copy)
                  }} />
                  <input placeholder="Mobile URL" value={b.mobileImage || ''} onChange={(e) => {
                    const copy = [...(f.pdp?.benefitBanners || [])]; copy[i] = { ...copy[i], mobileImage: e.target.value }; setPdp('benefitBanners', copy)
                  }} />
                  <input placeholder="Alt text" value={b.alt || ''} onChange={(e) => {
                    const copy = [...(f.pdp?.benefitBanners || [])]; copy[i] = { ...copy[i], alt: e.target.value }; setPdp('benefitBanners', copy)
                  }} />
                  <button type="button" className="btn-sm" onClick={() => setPdp('benefitBanners', moveItem(f.pdp?.benefitBanners || [], i, i - 1))}>↑</button>
                  <button type="button" className="btn-sm" onClick={() => setPdp('benefitBanners', moveItem(f.pdp?.benefitBanners || [], i, i + 1))}>↓</button>
                  <button type="button" className="btn-sm danger" onClick={() => setPdp('benefitBanners', (f.pdp?.benefitBanners || []).filter((_: any, idx: number) => idx !== i))}>×</button>
                </div>
              ))}
              <button type="button" className="btn-sm" onClick={() => setPdp('benefitBanners', [...(f.pdp?.benefitBanners || []), { desktopImage: '', mobileImage: '', alt: '', order: (f.pdp?.benefitBanners || []).length }])}>+ Add banner</button>
            </>
          )}

          {tab === 'ingredients' && (
            <>
              {(f.pdp?.ingredients || []).map((ing: any, i: number) => (
                <div key={i} className="admin-ing-block">
                  <input placeholder="Name" value={ing.name || ''} onChange={(e) => {
                    const copy = [...(f.pdp?.ingredients || [])]; copy[i] = { ...copy[i], name: e.target.value }; setPdp('ingredients', copy)
                  }} />
                  <input placeholder="Role" value={ing.role || ''} onChange={(e) => {
                    const copy = [...(f.pdp?.ingredients || [])]; copy[i] = { ...copy[i], role: e.target.value }; setPdp('ingredients', copy)
                  }} />
                  <textarea placeholder="Description" value={ing.description || ''} onChange={(e) => {
                    const copy = [...(f.pdp?.ingredients || [])]; copy[i] = { ...copy[i], description: e.target.value }; setPdp('ingredients', copy)
                  }} />
                  <input placeholder="Image URL" value={ing.imageUrl || ''} onChange={(e) => {
                    const copy = [...(f.pdp?.ingredients || [])]; copy[i] = { ...copy[i], imageUrl: e.target.value }; setPdp('ingredients', copy)
                  }} />
                  <input placeholder="Research URL" value={ing.researchUrl || ''} onChange={(e) => {
                    const copy = [...(f.pdp?.ingredients || [])]; copy[i] = { ...copy[i], researchUrl: e.target.value }; setPdp('ingredients', copy)
                  }} />
                  <button type="button" className="btn-sm danger" onClick={() => setPdp('ingredients', (f.pdp?.ingredients || []).filter((_: any, idx: number) => idx !== i))}>×</button>
                </div>
              ))}
              <button type="button" className="btn-sm" onClick={() => setPdp('ingredients', [...(f.pdp?.ingredients || []), { name: '', role: '', description: '' }])}>+ Add ingredient</button>
              <div className="field" style={{ marginTop: 16 }}><label>Full INCI text</label><textarea rows={6} value={f.pdp?.inciText || ''} onChange={(e) => setPdp('inciText', e.target.value)} /></div>
            </>
          )}

          {tab === 'info' && (
            <>
              <div className="field"><label>Formulation overview</label><textarea rows={4} value={f.pdp?.infoTabs?.overview || ''} onChange={(e) => setNested('infoTabs', 'overview', e.target.value)} /></div>
              <div className="field"><label>Application protocol</label><textarea rows={4} value={f.pdp?.infoTabs?.applicationProtocol || ''} onChange={(e) => setNested('infoTabs', 'applicationProtocol', e.target.value)} /></div>
              <div className="field"><label>More details</label><textarea rows={4} value={f.pdp?.infoTabs?.moreDetails || ''} onChange={(e) => setNested('infoTabs', 'moreDetails', e.target.value)} /></div>
              <h4 className="gold-text">FAQs</h4>
              {(f.pdp?.faqs || []).map((faq: any, i: number) => (
                <div key={i} className="admin-faq-block">
                  <input placeholder="Question" value={faq.question || ''} onChange={(e) => {
                    const copy = [...(f.pdp?.faqs || [])]; copy[i] = { ...copy[i], question: e.target.value }; setPdp('faqs', copy)
                  }} />
                  <textarea placeholder="Answer" value={faq.answer || ''} onChange={(e) => {
                    const copy = [...(f.pdp?.faqs || [])]; copy[i] = { ...copy[i], answer: e.target.value }; setPdp('faqs', copy)
                  }} />
                  <button type="button" className="btn-sm danger" onClick={() => setPdp('faqs', (f.pdp?.faqs || []).filter((_: any, idx: number) => idx !== i))}>×</button>
                </div>
              ))}
              <button type="button" className="btn-sm" onClick={() => setPdp('faqs', [...(f.pdp?.faqs || []), { question: '', answer: '', order: (f.pdp?.faqs || []).length }])}>+ Add FAQ</button>
            </>
          )}

          {tab === 'related' && (
            <>
              <div className="field"><label>Related product IDs (comma-separated)</label>
                <input
                  value={(f.pdp?.relatedProductIds || []).join(', ')}
                  onChange={(e) => setPdp('relatedProductIds', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))}
                />
              </div>
              <p className="admin-hint">Pick from: {(allProducts || []).filter((p) => p.id !== f.id).map((p) => `${p.name} (${String(p.id).slice(0, 8)}…)`).join(' · ') || 'Save product first'}</p>
              <h4 className="gold-text">Bundle items</h4>
              {(f.pdp?.bundleItems || []).map((b: any, i: number) => (
                <div key={i} className="admin-list-row">
                  <select value={b.productId || ''} onChange={(e) => {
                    const copy = [...(f.pdp?.bundleItems || [])]; copy[i] = { ...copy[i], productId: e.target.value }; setPdp('bundleItems', copy)
                  }}>
                    <option value="">Select product</option>
                    {(allProducts || []).filter((p) => p.id !== f.id).map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <input placeholder="Variant label" value={b.variantLabel || ''} onChange={(e) => {
                    const copy = [...(f.pdp?.bundleItems || [])]; copy[i] = { ...copy[i], variantLabel: e.target.value }; setPdp('bundleItems', copy)
                  }} />
                  <button type="button" className="btn-sm danger" onClick={() => setPdp('bundleItems', (f.pdp?.bundleItems || []).filter((_: any, idx: number) => idx !== i))}>×</button>
                </div>
              ))}
              <button type="button" className="btn-sm" onClick={() => setPdp('bundleItems', [...(f.pdp?.bundleItems || []), { productId: '', variantLabel: '' }])}>+ Add bundle item</button>
            </>
          )}

          {tab === 'seo' && (
            <>
              <div className="field"><label>Meta title</label><input value={f.pdp?.seo?.title || ''} onChange={(e) => setNested('seo', 'title', e.target.value)} /></div>
              <div className="field"><label>Meta description</label><textarea rows={3} value={f.pdp?.seo?.description || ''} onChange={(e) => setNested('seo', 'description', e.target.value)} /></div>
              <div className="field"><label>Open Graph image URL</label><input value={f.pdp?.seo?.ogImage || ''} onChange={(e) => setNested('seo', 'ogImage', e.target.value)} /></div>
            </>
          )}
        </div>
        <div className="save-bar">
          <button type="button" className="btn-pill solid" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save product'}</button>
          <button type="button" className="btn-sm" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
export default ProductEditor
