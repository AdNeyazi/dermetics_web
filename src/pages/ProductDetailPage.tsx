import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ProductDetailClient } from '@/components/pdp/ProductDetailClient'
import { fetchProductBySlug } from '@/lib/products'
import type { Product } from '@/types'

function faqJsonLd(product: Product) {
  const faqs = (product.pdp?.faqs || []).filter((f: any) => f.question && f.answer)
  if (!faqs.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f: any) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  }
}

function productJsonLd(product: Product) {
  const pdp = product.pdp || {}
  const price = product.variants?.[0]?.price ?? product.price
  const summary = product.reviewSummary
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: (pdp.media || []).map((m: any) => m.url).filter(Boolean).slice(0, 5),
    sku: product.slug,
    offers: {
      '@type': 'Offer',
      priceCurrency: pdp.currency || 'INR',
      price: String(price),
      availability: 'https://schema.org/InStock',
      url: `/products/${product.slug}`,
    },
    ...(summary?.count
      ? {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: String(summary.average),
          reviewCount: String(summary.count),
        },
      }
      : {}),
  }
}

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setError(false)
    fetchProductBySlug(slug)
      .then((data) => {
        if (!data) setError(true)
        else {
          setProduct(data)
          const seo = data.pdp?.seo || {}
          document.title = seo.title || `${data.name} · DERMATICS`
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading product details…</p>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <h2 className="gold-text">Product Not Found</h2>
        <p style={{ color: 'var(--text-muted)', margin: '16px 0 24px' }}>
          The product you are looking for does not exist or has been moved.
        </p>
        <Link to="/products" className="btn-pill solid">Browse All Products</Link>
      </div>
    )
  }

  const jsonLd = productJsonLd(product)
  const faqLd = faqJsonLd(product)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {faqLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      ) : null}
      <ProductDetailClient product={product} />
    </>
  )
}

export default ProductDetailPage
