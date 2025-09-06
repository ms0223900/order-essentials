/**
 * 商品領域模型
 * 定義商品的核心屬性和行為
 */

export interface Product {
  id: string
  name: string
  price: number
  description: string
  image: string
  category: string
  stock: number
  createdAt?: string
  updatedAt?: string
}

export interface CreateProductRequest {
  name: string
  price: number
  description: string
  image: string
  category: string
  stock: number
}

export interface UpdateProductRequest {
  id: string
  name?: string
  price?: number
  description?: string
  image?: string
  category?: string
  stock?: number
}

export interface UpdateStockRequest {
  id: string
  quantity: number
}

/**
 * 商品類別枚舉
 */
export enum ProductCategory {
  ELECTRONICS = 'electronics',
  ACCESSORIES = 'accessories'
}

/**
 * 商品類別顯示名稱對應
 */
export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  [ProductCategory.ELECTRONICS]: '電子產品',
  [ProductCategory.ACCESSORIES]: '配件'
}
