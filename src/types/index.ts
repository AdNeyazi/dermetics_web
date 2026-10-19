export interface User {
  id: number
  email: string
  name: string
  role: 'admin' | 'user' | string
  active?: boolean
  createdAt?: string
}

export interface AuthContextType {
  user: User | null
  loading: boolean
  isAdmin: boolean
  isAuthenticated: boolean
  checkAuth: () => Promise<User | null>
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>
  logout: () => Promise<void>
}

export interface ProductVariant {
  label: string
  price: number
  mrp?: number
  imageUrl?: string
  inStock?: boolean
}

export interface ProductReview {
  id: number
  title?: string
  body: string
  rating: number
  userName?: string
  createdAt: string
  verifiedPurchase?: boolean
  status?: 'pending' | 'approved' | 'rejected'
}

export interface ReviewSummary {
  average: number
  count: number
  distribution?: Record<string | number, number>
}

export interface Product {
  id: number | string
  name: string
  slug: string
  description?: string
  price: number
  compareAtPrice?: number
  categoryKey?: string
  tier?: string
  tag?: string
  imageUrl?: string
  variants?: ProductVariant[]
  reviewSummary?: ReviewSummary
  reviews?: ProductReview[]
  pdp?: any
  relatedProducts?: Product[]
  bundleProducts?: any[]
  active?: boolean
  sortOrder?: number
}

export interface Category {
  key: string
  label: string
  introTitle?: string
  introText?: string
  sortOrder?: number
}

export interface Package {
  id: number
  name: string
  description?: string
  price: number
  recommended?: boolean
  features?: string[]
}

export interface StorefrontContent {
  phone?: string
  footerHeading?: string
  footerText?: string
  marqueeLines?: string[]
  whatsappNumber?: string
  heroTitle?: string
  heroSub?: string
  flagshipTitle?: string
  flagshipSub?: string
  whatTitle?: string
  whatText?: string
  whyTitle?: string
  whyText?: string
  process?: any[]
  feedbackTitle?: string
  feedbackText?: string
  trustLine?: {
    complimentaryGift?: boolean
    freeShipping?: boolean
    cod?: boolean
  }
  [key: string]: any
}

export interface CartLine {
  id: string
  productId: number | string
  slug?: string
  name: string
  variantLabel?: string
  price: number
  imageUrl?: string
  quantity: number
}

export interface AppliedCoupon {
  code: string
  discount: number
  label?: string
  type?: string
}

export interface OrderItem {
  id: number
  productId: number
  productName: string
  variantLabel?: string
  price: number
  quantity: number
}

export interface Order {
  id: string
  total: number
  currency?: string
  status: string
  createdAt: string
  items?: OrderItem[]
  shipping?: any
  paymentMethod?: string
}
