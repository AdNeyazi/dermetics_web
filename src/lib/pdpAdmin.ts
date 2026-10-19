/** Default PDP shape for admin editor */

export function emptyPdp(): Record<string, any> {
  return {
    highlightLine: '',
    subtitle: '',
    badge: '',
    dermatologicallyTested: false,
    currency: 'INR',
    taxInclusive: true,
    media: [],
    formulatedFor: [],
    freeFrom: [],
    proTips: [],
    guarantee: { title: '', body: '' },
    actionVideos: [],
    stats: [],
    blendMarquee: { title: '', descriptors: [] },
    heroBanner: {
      sectionHeading: '',
      headline: '',
      lines: [],
      desktopImage: '',
      mobileImage: '',
    },
    story: { image: '', title: '', body: '' },
    benefitBanners: [],
    ingredients: [],
    inciText: '',
    infoTabs: { overview: '', applicationProtocol: '', moreDetails: '' },
    faqs: [],
    relatedProductIds: [],
    bundleItems: [],
    eligibleCoupons: [],
    seo: { title: '', description: '', ogImage: '' },
  }
}

export function ensureProductForm(raw: any): any {
  const p = { ...raw }
  p.variants = Array.isArray(p.variants) ? p.variants : []
  p.pdp = { ...emptyPdp(), ...(p.pdp || {}) }
  p.pdp.blendMarquee = { ...emptyPdp().blendMarquee, ...(p.pdp.blendMarquee || {}) }
  p.pdp.heroBanner = { ...emptyPdp().heroBanner, ...(p.pdp.heroBanner || {}) }
  p.pdp.story = { ...emptyPdp().story, ...(p.pdp.story || {}) }
  p.pdp.guarantee = { ...emptyPdp().guarantee, ...(p.pdp.guarantee || {}) }
  p.pdp.infoTabs = { ...emptyPdp().infoTabs, ...(p.pdp.infoTabs || {}) }
  p.pdp.seo = { ...emptyPdp().seo, ...(p.pdp.seo || {}) }
  if (!Array.isArray(p.pdp.blendMarquee.descriptors)) {
    p.pdp.blendMarquee.descriptors = []
  }
  return p
}

export function newProductTemplate(): any {
  return ensureProductForm({
    tier: 'premium',
    tag: '',
    name: '',
    slug: '',
    description: 'Replace with your product description.',
    price: 0,
    compareAtPrice: null,
    imageUrl: '',
    variants: [],
    pdp: emptyPdp(),
  })
}

export function buildProductSavePayload(f: any): any {
  const p = ensureProductForm(f)
  const payload: any = {
    tier: p.tier,
    tag: p.tag,
    name: p.name,
    slug: p.slug || undefined,
    description: p.description,
    price: Number(p.price) || 0,
    compareAtPrice: p.compareAtPrice === '' || p.compareAtPrice == null ? null : Number(p.compareAtPrice),
    imageUrl: p.imageUrl,
    variants: p.variants.map((v: any) => ({
      label: v.label || '',
      price: Number(v.price) || 0,
      mrp: v.mrp === '' || v.mrp == null ? null : Number(v.mrp),
      imageUrl: v.imageUrl || '',
      inStock: v.inStock !== false,
    })),
    pdp: p.pdp,
  }
  if (p.id) payload.id = p.id
  return payload
}
