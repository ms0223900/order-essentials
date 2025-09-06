import { Product } from '@/domain/types/Product'
import { PaginationOptions } from '@/domain/types/Repository'
import { SupabaseProductRepository } from '@/infrastructure/repositories/SupabaseProductRepository'
import { useCallback, useEffect, useState } from 'react'

/**
 * 商品資料管理 Hook
 * 
 * 遵循單一職責原則 (SRP) - 只負責商品資料的狀態管理
 * 遵循依賴反轉原則 (DIP) - 依賴抽象而非具體實作
 * 提供統一的資料存取介面給元件使用
 */
export interface UseProductsResult {
  // 資料狀態
  products: Product[]
  loading: boolean
  error: string | null
  
  // 操作方法
  refetch: () => Promise<void>
  getProductById: (id: string) => Promise<Product | null>
  updateStock: (id: string, quantity: number) => Promise<boolean>
  
  // 分頁和篩選
  setPagination: (options: PaginationOptions) => void
  setCategory: (category: string | null) => void
  setSearchQuery: (query: string) => void
}

/**
 * 使用商品資料的 Hook
 * @param repository 商品資料存取實作 (可選，預設使用 Supabase)
 * @returns UseProductsResult
 */
export function useProducts(): UseProductsResult {
  // 使用依賴注入，預設使用 Supabase 實作
  const productRepository = new SupabaseProductRepository()
  
  // 狀態管理
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationOptions>({})
  const [category, setCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')

  /**
   * 載入商品資料
   */
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let result
      
      if (searchQuery.trim()) {
        // 如果有搜尋關鍵字，執行搜尋
        result = await productRepository.search(searchQuery, pagination)
      } else if (category) {
        // 如果有指定類別，篩選類別
        result = await productRepository.getByCategory(category, pagination)
      } else {
        // 否則取得所有商品
        result = await productRepository.getAll(pagination)
      }

      if (result.error) {
        setError(result.error.message)
        setProducts([])
      } else {
        setProducts(result.data || [])
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '載入商品時發生未知錯誤'
      setError(errorMessage)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [productRepository, pagination, category, searchQuery])

  /**
   * 重新載入資料
   */
  const refetch = useCallback(async () => {
    await loadProducts()
  }, [loadProducts])

  /**
   * 根據 ID 取得單一商品
   */
  const getProductById = useCallback(async (id: string): Promise<Product | null> => {
    try {
      const result = await productRepository.getById(id)
      if (result.error) {
        setError(result.error.message)
        return null
      }
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '取得商品時發生未知錯誤'
      setError(errorMessage)
      return null
    }
  }, [productRepository])

  /**
   * 更新商品庫存
   */
  const updateStock = useCallback(async (id: string, quantity: number): Promise<boolean> => {
    try {
      const result = await productRepository.updateStock({ id, quantity })
      if (result.error) {
        setError(result.error.message)
        return false
      }
      
      // 更新本地狀態
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.id === id ? { ...product, stock: quantity } : product
        )
      )
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新庫存時發生未知錯誤'
      setError(errorMessage)
      return false
    }
  }, [productRepository])

  /**
   * 設定分頁選項
   */
  const handleSetPagination = useCallback((options: PaginationOptions) => {
    setPagination(options)
  }, [])

  /**
   * 設定類別篩選
   */
  const handleSetCategory = useCallback((newCategory: string | null) => {
    setCategory(newCategory)
    // 清除搜尋關鍵字
    setSearchQuery('')
  }, [])

  /**
   * 設定搜尋關鍵字
   */
  const handleSetSearchQuery = useCallback((query: string) => {
    setSearchQuery(query)
    // 清除類別篩選
    setCategory(null)
  }, [])

  // 當依賴項改變時重新載入資料
  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  return {
    // 資料狀態
    products,
    loading,
    error,
    
    // 操作方法
    refetch,
    getProductById,
    updateStock,
    
    // 分頁和篩選
    setPagination: handleSetPagination,
    setCategory: handleSetCategory,
    setSearchQuery: handleSetSearchQuery
  }
}
