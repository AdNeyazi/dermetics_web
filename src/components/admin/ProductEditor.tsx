import { useMemo, useState } from 'react'
import { buildProductSavePayload, ensureProductForm } from '@/lib/pdpAdmin'
import { discountPercent, formatMoney } from '@/lib/money'
import type { Product } from '@/types'

export interface ProductEditorProps {
  product?: Partial<Product> | null
  allProducts?: Product[]
  onClose: () => void
  onSave: (payload: Record<string, unknown>) => Promise<void> | void
}

interface MediaItem {
  type?: string
  url?: string
  order?: number
}

interface StatItem {
  value?: string | number
  suffix?: string
  label?: string
}

interface BannerItem {
  desktopImage?: string
  mobileImage?: string
  alt?: string
  order?: number
}

interface IngredientItem {
  name?: string
  role?: string
  description?: string
  imageUrl?: string
  researchUrl?: string
}

interface FaqItem {
  question?: string
  answer?: string
  order?: number
}

interface BundleItem {
  productId?: string | number
  variantLabel?: string
}

interface ActionVideo {
  url?: string
  title?: string
}

interface ChipItem {
  label: string
  icon?: string
}

interface ProductFormData {
  id?: string | number
  name?: string
  slug?: string
  tier?: string
  tag?: string
  description?: string
  price?: number | string
  compareAtPrice?: number | string | null
  imageUrl?: string
  variants?: Array<{
    label?: string
    price?: number | string
    mrp?: number | string | null
    imageUrl?: string
    inStock?: boolean
  }>
  pdp?: {
    subtitle?: string
    highlightLine?: string
    badge?: string
    highlightBadge?: string
    dermatologicallyTested?: boolean
    currency?: string
    taxInclusive?: boolean
    media?: MediaItem[]
    formulatedFor?: ChipItem[]
    freeFrom?: ChipItem[]
    proTips?: ChipItem[]
    guarantee?: { title?: string; body?: string }
    actionVideos?: ActionVideo[]
    stats?: StatItem[]
    blendMarquee?: { title?: string; descriptors?: string[] }
    heroBanner?: {
      sectionHeading?: string
      headline?: string
      lines?: string[]
      desktopImage?: string
      mobileImage?: string
    }
    story?: { image?: string; title?: string; body?: string }
    benefitBanners?: BannerItem[]
    ingredients?: IngredientItem[]
    inciText?: string
    infoTabs?: { overview?: string; applicationProtocol?: string; moreDetails?: string }
    faqs?: FaqItem[]
    relatedProductIds?: string[]
    bundleItems?: BundleItem[]
    seo?: { title?: string; description?: string; ogImage?: string }
    [key: string]: unknown
  }
  [key: string]: unknown
}

export function ProductEditor({
  product,
  allProducts = [],
  onClose,
  onSave,
}: ProductEditorProps) {
  const [prevProduct, setPrevProduct] = useState(product)
  const [f, setF] = useState<ProductFormData>(() => ensureProductForm(product) as ProductFormData)
  const [saving, setSaving] = useState(false)

  // Modals state
  const [activeMediaIdx, setActiveMediaIdx] = useState(0)
  const [imageModal, setImageModal] = useState<{
    open: boolean
    title: string
    url: string
    subUrl?: string
    type?: string
    onSave: (url: string, subUrl?: string, type?: string) => void
  }>({ open: false, title: '', url: '', onSave: () => {} })

  const [variantModal, setVariantModal] = useState<{
    open: boolean
    index?: number
    variant: { label: string; price: string | number; mrp: string | number; imageUrl: string; inStock: boolean }
  }>({
    open: false,
    variant: { label: '', price: '', mrp: '', imageUrl: '', inStock: true },
  })

  const [storyModalOpen, setStoryModalOpen] = useState(false)
  const [inciModalOpen, setInciModalOpen] = useState(false)
  const [seoModalOpen, setSeoModalOpen] = useState(false)
  const [relatedModalOpen, setRelatedModalOpen] = useState(false)

  // Active PDP tabs
  const [activeHighlightTab, setActiveHighlightTab] = useState<'formulated' | 'freeFrom' | 'longevity'>('formulated')
  const [activeInfoTab, setActiveInfoTab] = useState<'overview' | 'applicationProtocol' | 'moreDetails'>('overview')
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0)

  // In-line highlight tag inputs
  const [newTagInput, setNewTagInput] = useState('')
  const [newBenefitLine, setNewBenefitLine] = useState('')

  if (product !== prevProduct) {
    setPrevProduct(product)
    setF(ensureProductForm(product) as ProductFormData)
  }

  const set = (k: keyof ProductFormData, v: unknown) =>
    setF((prev) => ({ ...prev, [k]: v }))

  const setPdp = (k: string, v: unknown) =>
    setF((prev) => ({ ...prev, pdp: { ...prev.pdp, [k]: v } }))

  const setNested = (parent: string, k: string, v: unknown) =>
    setF((prev) => {
      const currentParent =
        ((prev.pdp as Record<string, unknown>)?.[parent] as Record<string, unknown>) || {}
      return {
        ...prev,
        pdp: {
          ...prev.pdp,
          [parent]: { ...currentParent, [k]: v },
        },
      }
    })

  const autoSlug = () => {
    if (!f.name) return
    const generated = f.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    set('slug', generated)
  }

  const save = async () => {
    setSaving(true)
    try {
      await onSave(buildProductSavePayload(f) as Record<string, unknown>)
    } finally {
      setSaving(false)
    }
  }

  const previewSlug =
    f.slug || (f.name ? f.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : '')

  const price = Number(f.price || 0)
  const mrp = Number(f.compareAtPrice || 0)
  const discount = discountPercent(price, mrp)

  const media = useMemo(() => f.pdp?.media || [], [f.pdp?.media])
  const allMediaList: MediaItem[] = useMemo(() => {
    if (media.length) return media
    if (f.imageUrl) return [{ type: 'image', url: f.imageUrl, order: 0 }]
    return []
  }, [media, f.imageUrl])

  const setMedia = (next: MediaItem[]) => {
    const sorted = next.map((m, i) => ({ ...m, order: i }))
    setPdp('media', sorted)
    if (sorted[0]?.url) set('imageUrl', sorted[0].url)
  }

  const currentMedia = allMediaList[activeMediaIdx] || allMediaList[0]
  const currentMediaUrl = currentMedia?.url || f.imageUrl || ''

  // Highlights arrays
  const formulatedFor = f.pdp?.formulatedFor || []
  const freeFrom = f.pdp?.freeFrom || []
  const proTips = f.pdp?.proTips || []

  const handleAddTag = (category: 'formulated' | 'freeFrom' | 'longevity') => {
    const val = newTagInput.trim()
    if (!val) return
    if (category === 'formulated') {
      setPdp('formulatedFor', [...formulatedFor, { label: val }])
    } else if (category === 'freeFrom') {
      setPdp('freeFrom', [...freeFrom, { label: val }])
    } else {
      setPdp('proTips', [...proTips, { label: val }])
    }
    setNewTagInput('')
  }

  const handleRemoveTag = (category: 'formulated' | 'freeFrom' | 'longevity', idx: number) => {
    if (category === 'formulated') {
      setPdp('formulatedFor', formulatedFor.filter((_, i) => i !== idx))
    } else if (category === 'freeFrom') {
      setPdp('freeFrom', freeFrom.filter((_, i) => i !== idx))
    } else {
      setPdp('proTips', proTips.filter((_, i) => i !== idx))
    }
  }

  // Variant handler
  const saveVariant = () => {
    const copy = [...(f.variants || [])]
    const item = {
      label: variantModal.variant.label || 'Standard',
      price: Number(variantModal.variant.price) || price,
      mrp: variantModal.variant.mrp ? Number(variantModal.variant.mrp) : mrp || null,
      imageUrl: variantModal.variant.imageUrl || '',
      inStock: variantModal.variant.inStock !== false,
    }
    if (variantModal.index !== undefined && variantModal.index >= 0) {
      copy[variantModal.index] = item
    } else {
      copy.push(item)
    }
    set('variants', copy)
    setVariantModal({ open: false, variant: { label: '', price: '', mrp: '', imageUrl: '', inStock: true } })
  }

  // Related products
  const relatedIds = f.pdp?.relatedProductIds || []
  const relatedProducts = allProducts.filter((p) => relatedIds.includes(String(p.id)))

  return (
    <div className="pdp-live-studio">
      {/* ========================================================
          STICKY TOP STUDIO COMMAND BAR
          ======================================================== */}
      <div className="pdp-studio-topbar">
        <div className="pdp-studio-topbar-left">
          <button type="button" className="btn-sm" onClick={onClose}>
            &larr; Back to Products
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#27c93f',
                boxShadow: '0 0 8px #27c93f',
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gold-light)' }}>
              Live Show Page Editor
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              (Click & edit any title, image, price, or text directly below)
            </span>
          </div>
        </div>

        <div className="pdp-studio-topbar-right">
          <button
            type="button"
            className="btn-sm"
            onClick={() => setSeoModalOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <span>&bull;</span> SEO & Slug: /products/{previewSlug || '...'}
          </button>

          {previewSlug && (
            <a
              href={`/products/${previewSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-sm"
            >
              View Storefront &nearr;
            </a>
          )}

          <button
            type="button"
            className="btn-pill solid"
            disabled={saving}
            onClick={save}
            style={{ padding: '8px 26px', fontSize: 13 }}
          >
            {saving ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </div>

      {/* ========================================================
          EXACT SHOW PAGE: HERO SECTION (.pdp-hero)
          ======================================================== */}
      <div className="pdp-page">
        <div className="container pdp-hero">
          <div className="pdp-hero-grid">
            {/* ----------------------------------------------------
                COLUMN 1: PRODUCT GALLERY (.pdp-gallery)
                ---------------------------------------------------- */}
            <div className="pdp-gallery">
              {/* Highlight Badge */}
              <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 6 }}>
                <input
                  className="pdp-highlight-badge pdp-inline-edit"
                  style={{
                    position: 'static',
                    width: 130,
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                  }}
                  value={f.pdp?.highlightBadge || f.pdp?.badge || ''}
                  placeholder="+ ADD BADGE"
                  onChange={(e) => {
                    setPdp('highlightBadge', e.target.value)
                    setPdp('badge', e.target.value)
                  }}
                />
              </div>

              {/* Gallery Layout */}
              <div className="pdp-gallery-layout">
                {/* Thumbnails strip */}
                <div className="pdp-thumbs" role="tablist">
                  {allMediaList.map((m, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <button
                        type="button"
                        className={`pdp-thumb ${activeMediaIdx === i ? 'active' : ''}`}
                        onClick={() => setActiveMediaIdx(i)}
                      >
                        {m.type === 'video' ? (
                          <>
                            <video src={m.url} muted playsInline preload="metadata" />
                            <span className="pdp-thumb-play" aria-hidden="true">
                              &blacktriangleright;
                            </span>
                          </>
                        ) : (
                          <img
                            src={m.url || ''}
                            alt=""
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" fill="%23333"><rect width="60" height="60"/><text x="50%" y="50%" fill="%23666" text-anchor="middle" dy=".3em" font-size="10">EMPTY</text></svg>'
                            }}
                          />
                        )}
                      </button>
                      <button
                        type="button"
                        className="pdp-hover-delete-btn"
                        title="Remove image"
                        onClick={(e) => {
                          e.stopPropagation()
                          const next = media.filter((_, idx) => idx !== i)
                          setMedia(next)
                          setActiveMediaIdx(0)
                        }}
                      >
                        &times;
                      </button>
                    </div>
                  ))}

                  {/* Add Media Thumbnail Button */}
                  <button
                    type="button"
                    className="pdp-thumb-add-btn"
                    title="Add image or video to gallery"
                    onClick={() => {
                      setImageModal({
                        open: true,
                        title: 'Add Gallery Image / Video',
                        url: '',
                        type: 'image',
                        onSave: (url, _sub, type) => {
                          if (url) {
                            setMedia([...media, { url, type: type || 'image', order: media.length }])
                            setActiveMediaIdx(media.length)
                          }
                        },
                      })
                    }}
                  >
                    +
                  </button>
                </div>

                {/* Main Viewport */}
                <div className="pdp-gallery-main pdp-img-edit-wrap">
                  {currentMediaUrl ? (
                    currentMedia?.type === 'video' ? (
                      <video
                        src={currentMediaUrl}
                        controls
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <img
                        src={currentMediaUrl}
                        alt={f.name || 'Product'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" fill="%231a1a20"><rect width="400" height="500"/><text x="50%" y="50%" fill="%23d4af37" text-anchor="middle" dy=".3em" font-size="16">Click below to set image URL</text></svg>'
                        }}
                      />
                    )
                  ) : (
                    <div className="pdp-builder-img-ph" style={{ minHeight: 450 }}>
                      <span className="gold-text" style={{ fontSize: 16 }}>
                        No Image Set
                      </span>
                      <span>Click the button below to add your primary product image</span>
                    </div>
                  )}

                  <button
                    type="button"
                    className="pdp-img-edit-btn"
                    onClick={() => {
                      setImageModal({
                        open: true,
                        title: 'Set Main Product Image URL',
                        url: currentMediaUrl,
                        type: currentMedia?.type || 'image',
                        onSave: (url, _sub, type) => {
                          if (allMediaList.length) {
                            const copy = [...allMediaList]
                            copy[activeMediaIdx] = {
                              ...copy[activeMediaIdx],
                              url,
                              type: type || 'image',
                            }
                            setMedia(copy)
                          } else {
                            set('imageUrl', url)
                            setMedia([{ url, type: type || 'image', order: 0 }])
                          }
                        },
                      })
                    }}
                  >
                    &#128247; Change Image URL
                  </button>
                </div>
              </div>
            </div>

            {/* ----------------------------------------------------
                COLUMN 2: PRODUCT BUY BOX (.pdp-buy-box)
                ---------------------------------------------------- */}
            <div className="pdp-buy-box">
              {/* Reviews & Badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span className="pdp-rating-link">
                  <span className="pdp-stars">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span key={i} className="on">
                        &#9733;
                      </span>
                    ))}
                  </span>
                  <span>5.0</span>
                  <span className="pdp-review-count">(18 reviews)</span>
                </span>

                <button
                  type="button"
                  className="badge"
                  style={{ cursor: 'pointer', background: 'transparent' }}
                  onClick={() => set('tier', f.tier === 'ultra' ? 'premium' : 'ultra')}
                  title="Click to toggle tier"
                >
                  Tier: {f.tier === 'ultra' ? 'Ultra Premium' : 'Premium'} &harr;
                </button>

                <label className="admin-check" style={{ fontSize: 12 }}>
                  <input
                    type="checkbox"
                    checked={!!f.pdp?.dermatologicallyTested}
                    onChange={(e) => setPdp('dermatologicallyTested', e.target.checked)}
                  />
                  Dermatologically Tested
                </label>
              </div>

              {/* Product Title (In-Place) */}
              <input
                className="pdp-title gold-text pdp-inline-edit"
                value={f.name || ''}
                placeholder="Product Title (e.g. 24K Gold Cellular Elixir)"
                onChange={(e) => set('name', e.target.value)}
              />

              {/* Subtitle (In-Place) */}
              <input
                className="pdp-subtitle pdp-inline-edit"
                value={f.pdp?.subtitle || ''}
                placeholder="Subtitle (e.g. Intensive Overnight Multi-Peptide Renewal Complex)..."
                onChange={(e) => setPdp('subtitle', e.target.value)}
              />

              {/* Category Tag */}
              <div style={{ margin: '4px 0 12px' }}>
                <input
                  className="pdp-inline-edit"
                  style={{
                    maxWidth: 240,
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '1.2px',
                    color: 'var(--gold-primary)',
                  }}
                  value={f.tag || ''}
                  placeholder="Category Tag (e.g. Restorative Treatment)"
                  onChange={(e) => set('tag', e.target.value)}
                />
              </div>

              {/* Price & MRP Row (In-Place) */}
              <div className="pdp-price-edit-row">
                <div className="pdp-price-input-wrap">
                  <span className="gold-text" style={{ fontSize: 22, fontWeight: 700 }}>
                    &#8377;
                  </span>
                  <input
                    type="number"
                    className="pdp-price-input"
                    value={f.price ?? ''}
                    placeholder="Price"
                    onChange={(e) => set('price', e.target.value)}
                  />
                </div>

                <div className="pdp-price-input-wrap">
                  <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>MRP &#8377;</span>
                  <input
                    type="number"
                    className="pdp-mrp-input"
                    value={f.compareAtPrice ?? ''}
                    placeholder="MRP"
                    onChange={(e) => set('compareAtPrice', e.target.value)}
                  />
                </div>

                {discount > 0 && <span className="pdp-off-pill">{discount}% OFF</span>}
              </div>

              {/* Short Catalog Description */}
              <textarea
                className="pdp-inline-textarea"
                rows={2}
                value={f.description || ''}
                placeholder="Short formulation summary shown on PDP buy box..."
                onChange={(e) => set('description', e.target.value)}
              />

              {/* Variant Selector Pills */}
              <div className="pdp-variants" style={{ marginTop: 14 }}>
                <span className="pdp-label">Select variant</span>
                <div className="variant-pills" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {(f.variants || []).map((v, i) => (
                    <div key={i} className="pdp-variant-pill-edit">
                      <span
                        onClick={() =>
                          setVariantModal({
                            open: true,
                            index: i,
                            variant: {
                              label: v.label || '',
                              price: v.price ?? price,
                              mrp: v.mrp ?? mrp,
                              imageUrl: v.imageUrl || '',
                              inStock: v.inStock !== false,
                            },
                          })
                        }
                      >
                        {v.label || `Option ${i + 1}`} &middot; &#8377;{v.price || price}
                      </span>
                      <button
                        type="button"
                        className="pdp-variant-pill-del"
                        onClick={() =>
                          set(
                            'variants',
                            (f.variants || []).filter((_, idx) => idx !== i),
                          )
                        }
                      >
                        &times;
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="pdp-add-pill-btn"
                    style={{
                      background: 'rgba(212,175,55,0.06)',
                      border: '1px dashed rgba(212,175,55,0.4)',
                      borderRadius: 100,
                      padding: '8px 16px',
                      fontSize: 13,
                    }}
                    onClick={() =>
                      setVariantModal({
                        open: true,
                        index: -1,
                        variant: {
                          label: '',
                          price: price || '',
                          mrp: mrp || '',
                          imageUrl: '',
                          inStock: true,
                        },
                      })
                    }
                  >
                    + Add Variant
                  </button>
                </div>
              </div>

              {/* Highlight Tabs in Buy Box */}
              <div className="pdp-highlight-tabs" style={{ marginTop: 18 }}>
                <div className="pdp-highlight-tab-list" role="tablist">
                  <button
                    type="button"
                    className={activeHighlightTab === 'formulated' ? 'active' : ''}
                    onClick={() => setActiveHighlightTab('formulated')}
                  >
                    Formulated for ({formulatedFor.length})
                  </button>
                  <button
                    type="button"
                    className={activeHighlightTab === 'freeFrom' ? 'active' : ''}
                    onClick={() => setActiveHighlightTab('freeFrom')}
                  >
                    Free from ({freeFrom.length})
                  </button>
                  <button
                    type="button"
                    className={activeHighlightTab === 'longevity' ? 'active' : ''}
                    onClick={() => setActiveHighlightTab('longevity')}
                  >
                    Longevity tip ({proTips.length})
                  </button>
                </div>

                <div className="pdp-highlight-panel is-active">
                  <ul className="pdp-highlight-list">
                    {(activeHighlightTab === 'formulated'
                      ? formulatedFor
                      : activeHighlightTab === 'freeFrom'
                        ? freeFrom
                        : proTips
                    ).map((item, idx) => (
                      <li key={item.label + idx}>
                        <span>{item.label}</span>
                        <button
                          type="button"
                          className="pdp-chip-remove"
                          style={{ marginLeft: 6 }}
                          onClick={() => handleRemoveTag(activeHighlightTab, idx)}
                        >
                          &times;
                        </button>
                      </li>
                    ))}
                  </ul>

                  {/* Inline Tag Add */}
                  <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                    <input
                      className="pdp-inline-edit"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px dashed var(--border-glass)',
                        fontSize: 12,
                        maxWidth: 220,
                      }}
                      placeholder={`Add ${activeHighlightTab} item...`}
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddTag(activeHighlightTab)
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn-sm"
                      onClick={() => handleAddTag(activeHighlightTab)}
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Videos Carousel */}
              <div style={{ marginTop: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span className="pdp-label" style={{ margin: 0 }}>
                    Action Videos ({f.pdp?.actionVideos?.length || 0})
                  </span>
                  <button
                    type="button"
                    className="btn-sm"
                    onClick={() =>
                      setPdp('actionVideos', [...(f.pdp?.actionVideos || []), { title: '', url: '' }])
                    }
                  >
                    + Add Video
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 }}>
                  {(f.pdp?.actionVideos || []).map((v, i) => (
                    <div
                      key={i}
                      style={{
                        minWidth: 160,
                        padding: 10,
                        borderRadius: 10,
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-glass)',
                        position: 'relative',
                      }}
                    >
                      <button
                        type="button"
                        className="pdp-hover-delete-btn"
                        onClick={() =>
                          setPdp(
                            'actionVideos',
                            (f.pdp?.actionVideos || []).filter((_, idx) => idx !== i),
                          )
                        }
                      >
                        &times;
                      </button>
                      <input
                        className="pdp-inline-edit"
                        style={{ fontSize: 12, fontWeight: 600, color: 'var(--gold-light)' }}
                        placeholder="Video Title"
                        value={v.title || ''}
                        onChange={(e) => {
                          const copy = [...(f.pdp?.actionVideos || [])]
                          copy[i] = { ...copy[i], title: e.target.value }
                          setPdp('actionVideos', copy)
                        }}
                      />
                      <input
                        className="pdp-inline-edit"
                        style={{ fontSize: 11, marginTop: 4 }}
                        placeholder="Video URL (.mp4)"
                        value={v.url || ''}
                        onChange={(e) => {
                          const copy = [...(f.pdp?.actionVideos || [])]
                          copy[i] = { ...copy[i], url: e.target.value }
                          setPdp('actionVideos', copy)
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons Display */}
              <div className="pdp-actions" style={{ marginTop: 24 }}>
                <button type="button" className="btn-pill pdp-btn-outline" style={{ flex: 1 }}>
                  Add to Cart
                </button>
                <button type="button" className="btn-pill solid" style={{ flex: 1 }}>
                  Buy Now &middot; &#8377;{price}
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================
              SECTION 2: GUARANTEE STRIP (.pdp-guarantee-strip)
              ======================================================== */}
          <section className="pdp-guarantee-strip" style={{ marginTop: 40 }}>
            <div className="container pdp-guarantee-strip-inner">
              <div className="pdp-guarantee-strip-copy" style={{ flex: 1 }}>
                <input
                  className="gold-text pdp-inline-edit"
                  style={{ fontSize: 20, fontWeight: 700 }}
                  value={f.pdp?.guarantee?.title || ''}
                  placeholder="Money-back guarantee (45 days)"
                  onChange={(e) => setNested('guarantee', 'title', e.target.value)}
                />
                <textarea
                  className="pdp-inline-textarea"
                  rows={2}
                  style={{ fontSize: 13, marginTop: 4 }}
                  value={f.pdp?.guarantee?.body || ''}
                  placeholder="If you do not notice visible transformation, our concierge will issue a full refund."
                  onChange={(e) => setNested('guarantee', 'body', e.target.value)}
                />
              </div>

              <div className="pdp-guarantee-strip-buy">
                <div className="pdp-price-block">
                  <span className="pdp-price gold-text">{formatMoney(price, 'INR')}</span>
                  {mrp > price && <span className="pdp-mrp">{formatMoney(mrp, 'INR')}</span>}
                  {discount > 0 && <span className="pdp-off-pill">{discount}% OFF</span>}
                </div>
                <button type="button" className="btn-pill pdp-btn-outline">
                  Add to Cart
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* ========================================================
            BELOW THE FOLD SECTIONS (Exact match to PdpBelowFold)
            ======================================================== */}

        {/* --------------------------------------------------------
            SECTION 3: CLINICAL STATS (.pdp-stats-band)
            -------------------------------------------------------- */}
        <section className="pdp-stats-band">
          <div className="container pdp-stats-grid">
            {(f.pdp?.stats || []).map((s, i) => (
              <div key={i} className="count-up-stat" style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="pdp-hover-delete-btn"
                  onClick={() =>
                    setPdp(
                      'stats',
                      (f.pdp?.stats || []).filter((_, idx) => idx !== i),
                    )
                  }
                >
                  &times;
                </button>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center' }}>
                  <input
                    className="pdp-inline-edit gold-text"
                    style={{
                      fontSize: 38,
                      fontWeight: 700,
                      width: 90,
                      textAlign: 'right',
                    }}
                    value={s.value || ''}
                    placeholder="98"
                    onChange={(e) => {
                      const copy = [...(f.pdp?.stats || [])]
                      copy[i] = { ...copy[i], value: e.target.value }
                      setPdp('stats', copy)
                    }}
                  />
                  <input
                    className="pdp-inline-edit gold-text"
                    style={{
                      fontSize: 24,
                      fontWeight: 600,
                      width: 40,
                    }}
                    value={s.suffix || ''}
                    placeholder="%"
                    onChange={(e) => {
                      const copy = [...(f.pdp?.stats || [])]
                      copy[i] = { ...copy[i], suffix: e.target.value }
                      setPdp('stats', copy)
                    }}
                  />
                </div>
                <input
                  className="pdp-inline-edit"
                  style={{ fontSize: 13, textAlign: 'center', color: 'var(--text-muted)' }}
                  value={s.label || ''}
                  placeholder="Clinical result description..."
                  onChange={(e) => {
                    const copy = [...(f.pdp?.stats || [])]
                    copy[i] = { ...copy[i], label: e.target.value }
                    setPdp('stats', copy)
                  }}
                />
              </div>
            ))}

            {/* Add Stat Card */}
            <div
              className="pdp-add-dashed-card"
              style={{ minHeight: 90 }}
              onClick={() =>
                setPdp('stats', [...(f.pdp?.stats || []), { value: '', suffix: '%', label: '' }])
              }
            >
              <span>+ Add Stat Counter</span>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------
            SECTION 4: HERO BENEFIT FEATURE (.pdp-hero-benefit)
            -------------------------------------------------------- */}
        <section className="container pdp-section">
          <input
            className="pdp-eyebrow pdp-inline-edit"
            style={{ marginBottom: 12, maxWidth: 300 }}
            value={f.pdp?.heroBanner?.sectionHeading || ''}
            placeholder="SECTION EYEBROW (e.g. CLINICAL RESULTS)"
            onChange={(e) => setNested('heroBanner', 'sectionHeading', e.target.value)}
          />

          <div className="pdp-hero-benefit">
            <div className="pdp-hero-benefit-copy glass-panel">
              <input
                className="gold-text pdp-inline-edit"
                style={{ fontSize: 24, fontWeight: 700, marginBottom: 14 }}
                value={f.pdp?.heroBanner?.headline || ''}
                placeholder="Main Benefit Headline..."
                onChange={(e) => setNested('heroBanner', 'headline', e.target.value)}
              />

              {/* Bullet points list */}
              <ul>
                {(f.pdp?.heroBanner?.lines || []).map((line: string, i: number) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <input
                      className="pdp-inline-edit"
                      value={line}
                      onChange={(e) => {
                        const copy = [...(f.pdp?.heroBanner?.lines || [])]
                        copy[i] = e.target.value
                        setNested('heroBanner', 'lines', copy)
                      }}
                    />
                    <button
                      type="button"
                      className="pdp-chip-remove"
                      onClick={() => {
                        const copy = (f.pdp?.heroBanner?.lines || []).filter((_: string, idx: number) => idx !== i)
                        setNested('heroBanner', 'lines', copy)
                      }}
                    >
                      &times;
                    </button>
                  </li>
                ))}
              </ul>

              {/* Add Bullet Line */}
              <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                <input
                  className="pdp-inline-edit"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px dashed var(--border-glass)',
                    fontSize: 13,
                  }}
                  placeholder="Add bullet highlight..."
                  value={newBenefitLine}
                  onChange={(e) => setNewBenefitLine(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (newBenefitLine.trim()) {
                        setNested('heroBanner', 'lines', [
                          ...(f.pdp?.heroBanner?.lines || []),
                          newBenefitLine.trim(),
                        ])
                        setNewBenefitLine('')
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn-sm"
                  onClick={() => {
                    if (newBenefitLine.trim()) {
                      setNested('heroBanner', 'lines', [
                        ...(f.pdp?.heroBanner?.lines || []),
                        newBenefitLine.trim(),
                      ])
                      setNewBenefitLine('')
                    }
                  }}
                >
                  + Add
                </button>
              </div>
            </div>

            {/* Right Banner Image with in-place change button */}
            <div className="pdp-img-edit-wrap" style={{ minHeight: 280, borderRadius: 18, overflow: 'hidden' }}>
              {f.pdp?.heroBanner?.desktopImage ? (
                <img
                  src={f.pdp?.heroBanner?.desktopImage}
                  alt={f.pdp?.heroBanner?.headline || 'Benefit'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div className="pdp-builder-img-ph" style={{ height: '100%', minHeight: 280 }}>
                  <span className="gold-text">No Benefit Banner Set</span>
                  <span>Click below to set desktop & mobile image URLs</span>
                </div>
              )}

              <button
                type="button"
                className="pdp-img-edit-btn"
                onClick={() => {
                  setImageModal({
                    open: true,
                    title: 'Set Hero Benefit Banner Image',
                    url: f.pdp?.heroBanner?.desktopImage || '',
                    subUrl: f.pdp?.heroBanner?.mobileImage || '',
                    onSave: (desktop, mobile) => {
                      setNested('heroBanner', 'desktopImage', desktop)
                      if (mobile) setNested('heroBanner', 'mobileImage', mobile)
                    },
                  })
                }}
              >
                &#128247; Set Desktop / Mobile Banner
              </button>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------
            SECTION 5: BRAND & FORMULA STORY (.pdp-story-card)
            -------------------------------------------------------- */}
        <section className="container pdp-section">
          <div className="pdp-story-card">
            {/* Story Image */}
            <div className="pdp-img-edit-wrap pdp-story-img" style={{ minHeight: 180 }}>
              {f.pdp?.story?.image ? (
                <img
                  src={f.pdp?.story?.image}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div className="pdp-builder-img-ph" style={{ height: '100%' }}>
                  <span>Story Image</span>
                </div>
              )}
              <button
                type="button"
                className="pdp-img-edit-btn"
                style={{ bottom: 8, right: 8, fontSize: 10, padding: '4px 10px' }}
                onClick={() => {
                  setImageModal({
                    open: true,
                    title: 'Set Story Image URL',
                    url: f.pdp?.story?.image || '',
                    onSave: (img) => setNested('story', 'image', img),
                  })
                }}
              >
                &#128247; Change Image
              </button>
            </div>

            {/* Story Copy */}
            <div style={{ flex: 1 }}>
              <input
                className="gold-text pdp-inline-edit"
                style={{ fontSize: 20, fontWeight: 700 }}
                value={f.pdp?.story?.title || ''}
                placeholder="Story behind the formula..."
                onChange={(e) => setNested('story', 'title', e.target.value)}
              />
              <textarea
                className="pdp-inline-textarea pdp-story-teaser"
                rows={3}
                style={{ marginTop: 8 }}
                value={f.pdp?.story?.body || ''}
                placeholder="Story teaser paragraph (shown on card)..."
                onChange={(e) => setNested('story', 'body', e.target.value)}
              />
              <button
                type="button"
                className="btn-pill"
                style={{ marginTop: 8 }}
                onClick={() => setStoryModalOpen(true)}
              >
                Edit Full Story Modal Text &rarr;
              </button>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------
            SECTION 6: BLEND MARQUEE (.pdp-blend-marquee)
            -------------------------------------------------------- */}
        <div style={{ position: 'relative' }}>
          <div
            style={{
              padding: '6px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              background: 'rgba(16,16,20,0.85)',
              borderBottom: '1px solid var(--border-glass)',
            }}
          >
            <span style={{ fontSize: 11, color: 'var(--gold-primary)', fontWeight: 600 }}>
              MARQUEE SETTINGS:
            </span>
            <input
              className="pdp-inline-edit"
              style={{
                width: 220,
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--gold-light)',
                borderBottom: '1px dashed rgba(212,175,55,0.4)',
              }}
              value={f.pdp?.blendMarquee?.title || ''}
              placeholder="Formula Title (e.g. BIO-LIPID 9)"
              onChange={(e) => setNested('blendMarquee', 'title', e.target.value)}
            />
            <input
              className="pdp-inline-edit"
              style={{
                flex: 1,
                fontSize: 12,
                borderBottom: '1px dashed rgba(212,175,55,0.4)',
              }}
              value={(f.pdp?.blendMarquee?.descriptors || []).join(', ')}
              placeholder="Descriptor tags separated by comma (e.g. Liposomal, 24K Gold, Zero Fillers)"
              onChange={(e) =>
                setNested(
                  'blendMarquee',
                  'descriptors',
                  e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                )
              }
            />
          </div>

          <section className="pdp-blend-marquee">
            <div className="pdp-blend-track">
              <span>
                {[
                  f.pdp?.blendMarquee?.title || 'FORMULA TECHNOLOGY',
                  ...(f.pdp?.blendMarquee?.descriptors || ['Deep Cellular Delivery', 'Clean Luxury']),
                ]
                  .filter(Boolean)
                  .join('   \u00B7   ')}
              </span>
              <span>
                {[
                  f.pdp?.blendMarquee?.title || 'FORMULA TECHNOLOGY',
                  ...(f.pdp?.blendMarquee?.descriptors || ['Deep Cellular Delivery', 'Clean Luxury']),
                ]
                  .filter(Boolean)
                  .join('   \u00B7   ')}
              </span>
            </div>
          </section>
        </div>

        {/* --------------------------------------------------------
            SECTION 7: BENEFIT BANNERS (.pdp-benefit-banners)
            -------------------------------------------------------- */}
        <section className="pdp-benefit-banners">
          {(f.pdp?.benefitBanners || []).map((b, i) => (
            <div key={i} className="pdp-img-edit-wrap" style={{ position: 'relative' }}>
              <button
                type="button"
                className="pdp-hover-delete-btn"
                style={{ top: 14, right: 14, width: 32, height: 32, fontSize: 16 }}
                onClick={() =>
                  setPdp(
                    'benefitBanners',
                    (f.pdp?.benefitBanners || []).filter((_, idx) => idx !== i),
                  )
                }
              >
                &times;
              </button>

              {b.desktopImage ? (
                <img
                  src={b.desktopImage}
                  alt={b.alt || 'Banner'}
                  className="pdp-benefit-banner"
                  style={{ width: '100%', display: 'block' }}
                />
              ) : (
                <div className="pdp-builder-img-ph wide" style={{ minHeight: 220 }}>
                  <span className="gold-text">Banner #{i + 1}</span>
                  <span>Click below to set banner image URLs</span>
                </div>
              )}

              <button
                type="button"
                className="pdp-img-edit-btn"
                onClick={() => {
                  setImageModal({
                    open: true,
                    title: `Edit Benefit Banner #${i + 1}`,
                    url: b.desktopImage || '',
                    subUrl: b.mobileImage || '',
                    onSave: (desktop, mobile) => {
                      const copy = [...(f.pdp?.benefitBanners || [])]
                      copy[i] = { ...copy[i], desktopImage: desktop, mobileImage: mobile }
                      setPdp('benefitBanners', copy)
                    },
                  })
                }}
              >
                &#128247; Change Banner #{i + 1}
              </button>
            </div>
          ))}

          {/* Add Banner Button */}
          <div
            className="container"
            style={{ marginTop: 24, marginBottom: 24 }}
          >
            <div
              className="pdp-add-dashed-card"
              style={{ minHeight: 90 }}
              onClick={() => {
                setImageModal({
                  open: true,
                  title: 'Add New Full-Width Benefit Banner',
                  url: '',
                  subUrl: '',
                  onSave: (desktop, mobile) => {
                    if (desktop) {
                      setPdp('benefitBanners', [
                        ...(f.pdp?.benefitBanners || []),
                        {
                          desktopImage: desktop,
                          mobileImage: mobile || '',
                          alt: '',
                          order: (f.pdp?.benefitBanners || []).length,
                        },
                      ])
                    }
                  },
                })
              }}
            >
              <span>+ Add Full-Width Benefit Banner</span>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------
            SECTION 8: KEY INGREDIENTS (.pdp-ingredients-grid)
            -------------------------------------------------------- */}
        <section className="container pdp-section">
          <h2 className="gold-text pdp-section-title">Key ingredients</h2>

          <div className="pdp-ingredients-grid">
            {(f.pdp?.ingredients || []).map((ing, i) => (
              <article key={i} className="pdp-ingredient-card" style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="pdp-hover-delete-btn"
                  onClick={() =>
                    setPdp(
                      'ingredients',
                      (f.pdp?.ingredients || []).filter((_, idx) => idx !== i),
                    )
                  }
                >
                  &times;
                </button>

                {/* Ingredient Image */}
                <div className="pdp-img-edit-wrap" style={{ height: 120, borderRadius: 10, overflow: 'hidden' }}>
                  {ing.imageUrl ? (
                    <img src={ing.imageUrl} alt={ing.name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div className="pdp-ingredient-ph" style={{ height: '100%' }} />
                  )}
                  <button
                    type="button"
                    className="pdp-img-edit-btn"
                    style={{ bottom: 4, right: 4, fontSize: 9, padding: '3px 8px' }}
                    onClick={() => {
                      setImageModal({
                        open: true,
                        title: `Set Image for ${ing.name || 'Ingredient'}`,
                        url: ing.imageUrl || '',
                        onSave: (url) => {
                          const copy = [...(f.pdp?.ingredients || [])]
                          copy[i] = { ...copy[i], imageUrl: url }
                          setPdp('ingredients', copy)
                        },
                      })
                    }}
                  >
                    &#128247;
                  </button>
                </div>

                {/* Name */}
                <input
                  className="pdp-inline-edit"
                  style={{ fontSize: 16, fontWeight: 700, color: 'var(--gold-light)', marginTop: 8 }}
                  value={ing.name || ''}
                  placeholder="Ingredient Name"
                  onChange={(e) => {
                    const copy = [...(f.pdp?.ingredients || [])]
                    copy[i] = { ...copy[i], name: e.target.value }
                    setPdp('ingredients', copy)
                  }}
                />

                {/* Role */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                  <strong>Role:</strong>
                  <input
                    className="pdp-inline-edit"
                    value={ing.role || ''}
                    placeholder="e.g. Barrier repair"
                    onChange={(e) => {
                      const copy = [...(f.pdp?.ingredients || [])]
                      copy[i] = { ...copy[i], role: e.target.value }
                      setPdp('ingredients', copy)
                    }}
                  />
                </div>

                {/* Description */}
                <textarea
                  className="pdp-inline-textarea"
                  rows={2}
                  style={{ fontSize: 12, marginTop: 4 }}
                  value={ing.description || ''}
                  placeholder="Clinical role & mechanism..."
                  onChange={(e) => {
                    const copy = [...(f.pdp?.ingredients || [])]
                    copy[i] = { ...copy[i], description: e.target.value }
                    setPdp('ingredients', copy)
                  }}
                />

                {/* Research URL */}
                <input
                  className="pdp-inline-edit"
                  style={{ fontSize: 11, color: 'var(--gold-primary)', marginTop: 4 }}
                  value={ing.researchUrl || ''}
                  placeholder="Research URL (https://...)"
                  onChange={(e) => {
                    const copy = [...(f.pdp?.ingredients || [])]
                    copy[i] = { ...copy[i], researchUrl: e.target.value }
                    setPdp('ingredients', copy)
                  }}
                />
              </article>
            ))}

            {/* Add Ingredient Card */}
            <div
              className="pdp-add-dashed-card"
              style={{ minHeight: 220 }}
              onClick={() =>
                setPdp('ingredients', [
                  ...(f.pdp?.ingredients || []),
                  { name: '', role: '', description: '', imageUrl: '', researchUrl: '' },
                ])
              }
            >
              <span className="gold-text" style={{ fontSize: 18 }}>
                + Add Key Ingredient
              </span>
              <span>Name, role, botanical image, description & research</span>
            </div>
          </div>

          {/* INCI Modal Trigger */}
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <button
              type="button"
              className="pdp-view-all-ing"
              onClick={() => setInciModalOpen(true)}
            >
              VIEW &amp; EDIT FULL INCI LIST &rarr;
            </button>
          </div>
        </section>

        {/* --------------------------------------------------------
            SECTION 9: KNOW YOUR PRODUCT (TABS)
            -------------------------------------------------------- */}
        <section className="container pdp-section">
          <h2 className="gold-text pdp-section-title">Know your product</h2>

          <div className="pdp-tabs">
            <div className="pdp-tab-list" role="tablist">
              <button
                type="button"
                className={activeInfoTab === 'overview' ? 'active' : ''}
                onClick={() => setActiveInfoTab('overview')}
              >
                Formulation Overview
              </button>
              <button
                type="button"
                className={activeInfoTab === 'applicationProtocol' ? 'active' : ''}
                onClick={() => setActiveInfoTab('applicationProtocol')}
              >
                Application Protocol
              </button>
              <button
                type="button"
                className={activeInfoTab === 'moreDetails' ? 'active' : ''}
                onClick={() => setActiveInfoTab('moreDetails')}
              >
                More Details
              </button>
            </div>

            <div className="pdp-tab-panel glass-panel">
              <textarea
                className="pdp-inline-textarea"
                rows={7}
                style={{ fontSize: 14, lineHeight: 1.8 }}
                value={f.pdp?.infoTabs?.[activeInfoTab] || ''}
                placeholder={`Write ${activeInfoTab} text here (separate paragraphs with blank lines)...`}
                onChange={(e) => setNested('infoTabs', activeInfoTab, e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------
            SECTION 10: FAQS ACCORDION
            -------------------------------------------------------- */}
        <section className="container pdp-section" id="faq">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="gold-text pdp-section-title">FAQ</h2>
            <button
              type="button"
              className="btn-sm"
              onClick={() =>
                setPdp('faqs', [
                  ...(f.pdp?.faqs || []),
                  { question: '', answer: '', order: (f.pdp?.faqs || []).length },
                ])
              }
            >
              + Add FAQ Question
            </button>
          </div>

          <div className="faq-wrap pdp-faq">
            {(f.pdp?.faqs || []).map((faq, i) => (
              <div key={i} className={`faq-item ${openFaqIdx === i ? 'open' : ''}`}>
                <div
                  className="faq-q"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <input
                    className="pdp-inline-edit"
                    style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}
                    value={faq.question || ''}
                    placeholder="Enter question (e.g. When can I see visible results?)..."
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const copy = [...(f.pdp?.faqs || [])]
                      copy[i] = { ...copy[i], question: e.target.value }
                      setPdp('faqs', copy)
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <button
                      type="button"
                      className="btn-sm"
                      style={{ fontSize: 10, padding: '2px 8px' }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenFaqIdx(openFaqIdx === i ? null : i)
                      }}
                    >
                      {openFaqIdx === i ? 'Collapse' : 'Expand'}
                    </button>
                    <button
                      type="button"
                      className="btn-sm danger"
                      style={{ fontSize: 11, padding: '2px 8px' }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setPdp(
                          'faqs',
                          (f.pdp?.faqs || []).filter((_, idx) => idx !== i),
                        )
                      }}
                    >
                      &times;
                    </button>
                  </div>
                </div>

                <div className="faq-a" style={{ maxHeight: openFaqIdx === i ? '600px' : '0px' }}>
                  <div className="faq-a-inner">
                    <textarea
                      className="pdp-inline-textarea"
                      rows={4}
                      value={faq.answer || ''}
                      placeholder="Write authoritative answer here..."
                      onChange={(e) => {
                        const copy = [...(f.pdp?.faqs || [])]
                        copy[i] = { ...copy[i], answer: e.target.value }
                        setPdp('faqs', copy)
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* --------------------------------------------------------
            SECTION 11: COMPLETE YOUR RITUAL (RELATED PRODUCTS)
            -------------------------------------------------------- */}
        <section className="container pdp-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="gold-text pdp-section-title">Complete your ritual</h2>
            <button
              type="button"
              className="btn-sm"
              onClick={() => setRelatedModalOpen(true)}
            >
              + Select Related Products ({relatedIds.length})
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 16,
              marginTop: 16,
            }}
          >
            {relatedProducts.map((p) => (
              <div key={p.id} className="pdp-related-card">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} />
                ) : (
                  <div className="pdp-related-img-ph" />
                )}
                <span className="pdp-related-name">{p.name}</span>
                <span className="gold-text pdp-related-price">
                  {formatMoney(Number(p.price || 0), 'INR')}
                </span>
              </div>
            ))}
            {relatedProducts.length === 0 && (
              <div
                className="pdp-add-dashed-card"
                style={{ gridColumn: '1 / -1' }}
                onClick={() => setRelatedModalOpen(true)}
              >
                <span>No related products chosen yet. Click to pick from catalog.</span>
              </div>
            )}
          </div>
        </section>

        {/* --------------------------------------------------------
            SECTION 12: BRAND TRUST PROMISE
            -------------------------------------------------------- */}
        <section className="pdp-brand-trust">
          <div className="container">
            <h2 className="gold-text">Formulated With Integrity &middot; Certified Purity</h2>
            <p>
              Every DERMATICS formula is batched in small runs, clinical-grade verified, and shipped
              in bespoke temperature-shielded glass.
            </p>
          </div>
        </section>
      </div>

      {/* ========================================================
          IMAGE EDIT MODAL
          ======================================================== */}
      {imageModal.open && (
        <div className="modal-overlay" onClick={() => setImageModal((m) => ({ ...m, open: false }))}>
          <div className="modal pdp-quick-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close"
              onClick={() => setImageModal((m) => ({ ...m, open: false }))}
            >
              &times;
            </button>
            <h3 className="gold-text">{imageModal.title}</h3>

            <div className="field" style={{ marginTop: 14 }}>
              <label>Image or Stream URL</label>
              <input
                value={imageModal.url}
                placeholder="https://..."
                onChange={(e) => setImageModal((m) => ({ ...m, url: e.target.value }))}
              />
            </div>

            {imageModal.subUrl !== undefined && (
              <div className="field">
                <label>Mobile Image URL (Optional)</label>
                <input
                  value={imageModal.subUrl}
                  placeholder="https://..."
                  onChange={(e) => setImageModal((m) => ({ ...m, subUrl: e.target.value }))}
                />
              </div>
            )}

            {imageModal.url && (
              <div style={{ marginTop: 12, height: 160, borderRadius: 10, overflow: 'hidden' }}>
                <img
                  src={imageModal.url}
                  alt="Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                type="button"
                className="btn-pill solid"
                onClick={() => {
                  imageModal.onSave(imageModal.url, imageModal.subUrl, imageModal.type)
                  setImageModal((m) => ({ ...m, open: false }))
                }}
              >
                Apply Image
              </button>
              <button
                type="button"
                className="btn-sm"
                onClick={() => setImageModal((m) => ({ ...m, open: false }))}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          VARIANT EDIT MODAL
          ======================================================== */}
      {variantModal.open && (
        <div className="modal-overlay" onClick={() => setVariantModal((m) => ({ ...m, open: false }))}>
          <div className="modal pdp-quick-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close"
              onClick={() => setVariantModal((m) => ({ ...m, open: false }))}
            >
              &times;
            </button>
            <h3 className="gold-text">
              {variantModal.index !== undefined && variantModal.index >= 0
                ? 'Edit Variant'
                : 'Add Variant'}
            </h3>

            <div className="field" style={{ marginTop: 14 }}>
              <label>Variant Label (e.g. 30 ml, 50 ml, Shade 01)</label>
              <input
                value={variantModal.variant.label}
                placeholder="50 ml"
                onChange={(e) =>
                  setVariantModal((m) => ({
                    ...m,
                    variant: { ...m.variant, label: e.target.value },
                  }))
                }
              />
            </div>

            <div className="content-form two">
              <div className="field">
                <label>Price (INR)</label>
                <input
                  type="number"
                  value={variantModal.variant.price}
                  placeholder="0"
                  onChange={(e) =>
                    setVariantModal((m) => ({
                      ...m,
                      variant: { ...m.variant, price: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="field">
                <label>MRP (INR)</label>
                <input
                  type="number"
                  value={variantModal.variant.mrp}
                  placeholder="Optional"
                  onChange={(e) =>
                    setVariantModal((m) => ({
                      ...m,
                      variant: { ...m.variant, mrp: e.target.value },
                    }))
                  }
                />
              </div>
            </div>

            <div className="field">
              <label>Variant Image URL (Optional)</label>
              <input
                value={variantModal.variant.imageUrl}
                placeholder="https://..."
                onChange={(e) =>
                  setVariantModal((m) => ({
                    ...m,
                    variant: { ...m.variant, imageUrl: e.target.value },
                  }))
                }
              />
            </div>

            <label className="admin-check field">
              <input
                type="checkbox"
                checked={variantModal.variant.inStock}
                onChange={(e) =>
                  setVariantModal((m) => ({
                    ...m,
                    variant: { ...m.variant, inStock: e.target.checked },
                  }))
                }
              />
              In Stock &amp; Available for Purchase
            </label>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button type="button" className="btn-pill solid" onClick={saveVariant}>
                Save Variant
              </button>
              <button
                type="button"
                className="btn-sm"
                onClick={() => setVariantModal((m) => ({ ...m, open: false }))}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          STORY MODAL
          ======================================================== */}
      {storyModalOpen && (
        <div className="modal-overlay" onClick={() => setStoryModalOpen(false)}>
          <div className="modal pdp-story-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setStoryModalOpen(false)}>
              &times;
            </button>
            <h3 className="gold-text">
              {f.pdp?.story?.title || 'Story Behind the Formula'}
            </h3>
            <textarea
              className="pdp-inline-textarea"
              rows={12}
              style={{
                width: '100%',
                marginTop: 14,
                fontSize: 14,
                lineHeight: 1.8,
                background: 'rgba(0,0,0,0.5)',
                padding: 12,
              }}
              value={f.pdp?.story?.body || ''}
              placeholder="Write the complete story narrative here..."
              onChange={(e) => setNested('story', 'body', e.target.value)}
            />
            <div style={{ marginTop: 16 }}>
              <button
                type="button"
                className="btn-pill solid"
                onClick={() => setStoryModalOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          FULL INCI LIST MODAL
          ======================================================== */}
      {inciModalOpen && (
        <div className="modal-overlay" onClick={() => setInciModalOpen(false)}>
          <div className="modal pdp-inci-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setInciModalOpen(false)}>
              &times;
            </button>
            <h3 className="gold-text">Full INCI Chemical Formulation List</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 14px' }}>
              Displayed to buyers when they click &quot;VIEW ALL INGREDIENTS&quot;.
            </p>
            <textarea
              rows={10}
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.6)',
                padding: 12,
                borderRadius: 10,
                color: 'var(--text-primary)',
                fontFamily: 'monospace',
                fontSize: 12,
                lineHeight: 1.6,
                border: '1px solid var(--border-glass)',
              }}
              value={f.pdp?.inciText || ''}
              placeholder="Aqua (Water), Glycerin, Niacinamide, Sodium Hyaluronate, Peptides..."
              onChange={(e) => setPdp('inciText', e.target.value)}
            />
            <div style={{ marginTop: 16 }}>
              <button
                type="button"
                className="btn-pill solid"
                onClick={() => setInciModalOpen(false)}
              >
                Save INCI List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SEO & METADATA MODAL
          ======================================================== */}
      {seoModalOpen && (
        <div className="modal-overlay" onClick={() => setSeoModalOpen(false)}>
          <div className="modal pdp-quick-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setSeoModalOpen(false)}>
              &times;
            </button>
            <h3 className="gold-text">URL Slug &amp; SEO Metadata</h3>

            <div className="field" style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>URL Slug</label>
                <button type="button" className="btn-sm" onClick={autoSlug}>
                  Auto-generate from Name
                </button>
              </div>
              <input
                value={f.slug || ''}
                placeholder="24k-gold-cellular-elixir"
                onChange={(e) => set('slug', e.target.value)}
              />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                Live URL: /products/{previewSlug || '...'}
              </span>
            </div>

            <div className="field">
              <label>Meta Title</label>
              <input
                value={f.pdp?.seo?.title || ''}
                placeholder="Product Name &middot; DERMATICS"
                onChange={(e) => setNested('seo', 'title', e.target.value)}
              />
            </div>

            <div className="field">
              <label>Meta Description</label>
              <textarea
                rows={3}
                value={f.pdp?.seo?.description || ''}
                placeholder="Search engine meta description..."
                onChange={(e) => setNested('seo', 'description', e.target.value)}
              />
            </div>

            <div className="field">
              <label>OpenGraph / Social Sharing Image URL</label>
              <input
                value={f.pdp?.seo?.ogImage || ''}
                placeholder="https://..."
                onChange={(e) => setNested('seo', 'ogImage', e.target.value)}
              />
            </div>

            <div style={{ marginTop: 20 }}>
              <button
                type="button"
                className="btn-pill solid"
                onClick={() => setSeoModalOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          RELATED PRODUCTS PICKER MODAL
          ======================================================== */}
      {relatedModalOpen && (
        <div className="modal-overlay" onClick={() => setRelatedModalOpen(false)}>
          <div className="modal pdp-quick-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close"
              onClick={() => setRelatedModalOpen(false)}
            >
              &times;
            </button>
            <h3 className="gold-text">Select Related Products</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 14px' }}>
              These appear under &quot;Complete your ritual&quot; on the show page.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
              {allProducts
                .filter((p) => String(p.id) !== String(f.id))
                .map((p) => {
                  const active = relatedIds.includes(String(p.id))
                  return (
                    <label
                      key={p.id}
                      className="admin-check"
                      style={{
                        padding: '8px 12px',
                        background: active ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: 8,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => {
                          const next = active
                            ? relatedIds.filter((x) => x !== String(p.id))
                            : [...relatedIds, String(p.id)]
                          setPdp('relatedProductIds', next)
                        }}
                      />
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{p.name}</span>
                      <span style={{ fontSize: 12, color: 'var(--gold-primary)', marginLeft: 'auto' }}>
                        &#8377;{p.price}
                      </span>
                    </label>
                  )
                })}
            </div>

            <div style={{ marginTop: 20 }}>
              <button
                type="button"
                className="btn-pill solid"
                onClick={() => setRelatedModalOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductEditor
