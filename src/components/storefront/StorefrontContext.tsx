import { createContext, useContext, type ReactNode } from 'react'
import type { Category, StorefrontContent, User } from '@/types'

export interface StorefrontContextType {
  content: StorefrontContent
  categories: Category[]
  user: User | null
  cartOpen: boolean
  setCartOpen: (open: boolean) => void
}

const StorefrontContext = createContext<StorefrontContextType | null>(null)

export function StorefrontProvider({
  value,
  children,
}: {
  value: StorefrontContextType
  children: ReactNode
}) {
  return <StorefrontContext.Provider value={value}>{children}</StorefrontContext.Provider>
}

export function useStorefront(): StorefrontContextType | null {
  return useContext(StorefrontContext)
}
