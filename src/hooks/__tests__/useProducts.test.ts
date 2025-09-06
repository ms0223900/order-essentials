import { ProductRepository } from '@/domain/repositories/ProductRepository'
import { Product } from '@/domain/types/Product'
import { RepositoryResult } from '@/domain/types/Repository'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useProducts } from '../useProducts'

// Mock ProductRepository
const mockProductRepository: ProductRepository = {
  getAll: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  updateStock: vi.fn(),
  getByCategory: vi.fn(),
  search: vi.fn()
}

// Mock 商品資料
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'iPhone 15',
    price: 29900,
    description: '最新款 iPhone',
    image: 'iphone.jpg',
    category: 'electronics',
    stock: 10
  },
  {
    id: '2',
    name: 'AirPods Pro',
    price: 7490,
    description: '無線耳機',
    image: 'airpods.jpg',
    category: 'accessories',
    stock: 20
  }
]

describe('useProducts Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('應該能夠載入商品列表', async () => {
    // Given: Mock repository 回傳商品資料
    const mockResult: RepositoryResult<Product[]> = {
      data: mockProducts,
      error: null
    }
    vi.mocked(mockProductRepository.getAll).mockResolvedValue(mockResult)

    // When: 使用 Hook
    const { result } = renderHook(() => useProducts(mockProductRepository))

    // Then: 應該顯示載入狀態，然後載入商品
    expect(result.current.loading).toBe(true)
    expect(result.current.products).toEqual([])
    expect(result.current.error).toBeNull()

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.products).toEqual(mockProducts)
    expect(result.current.error).toBeNull()
    expect(mockProductRepository.getAll).toHaveBeenCalledWith({})
  })

  it('應該能夠處理載入錯誤', async () => {
    // Given: Mock repository 回傳錯誤
    const mockError: RepositoryResult<Product[]> = {
      data: null,
      error: {
        message: '載入失敗',
        code: 'LOAD_ERROR'
      }
    }
    vi.mocked(mockProductRepository.getAll).mockResolvedValue(mockError)

    // When: 使用 Hook
    const { result } = renderHook(() => useProducts(mockProductRepository))

    // Then: 應該顯示錯誤狀態
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.products).toEqual([])
    expect(result.current.error).toBe('載入失敗')
  })

  it('應該能夠重新載入資料', async () => {
    // Given: 初始載入成功
    const mockResult: RepositoryResult<Product[]> = {
      data: mockProducts,
      error: null
    }
    vi.mocked(mockProductRepository.getAll).mockResolvedValue(mockResult)

    const { result } = renderHook(() => useProducts(mockProductRepository))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // When: 呼叫 refetch
    await result.current.refetch()

    // Then: 應該重新呼叫 repository
    expect(mockProductRepository.getAll).toHaveBeenCalledTimes(2)
  })

  it('應該能夠根據 ID 取得商品', async () => {
    // Given: Mock repository 回傳單一商品
    const mockProduct = mockProducts[0]
    const mockResult: RepositoryResult<Product> = {
      data: mockProduct,
      error: null
    }
    vi.mocked(mockProductRepository.getById).mockResolvedValue(mockResult)

    const { result } = renderHook(() => useProducts(mockProductRepository))

    // When: 呼叫 getProductById
    const product = await result.current.getProductById('1')

    // Then: 應該回傳商品資料
    expect(product).toEqual(mockProduct)
    expect(mockProductRepository.getById).toHaveBeenCalledWith('1')
  })

  it('應該能夠更新商品庫存', async () => {
    // Given: Mock repository 回傳更新成功
    const updatedProduct = { ...mockProducts[0], stock: 5 }
    const mockResult: RepositoryResult<Product> = {
      data: updatedProduct,
      error: null
    }
    vi.mocked(mockProductRepository.updateStock).mockResolvedValue(mockResult)

    // 初始載入
    const getAllResult: RepositoryResult<Product[]> = {
      data: mockProducts,
      error: null
    }
    vi.mocked(mockProductRepository.getAll).mockResolvedValue(getAllResult)

    const { result } = renderHook(() => useProducts(mockProductRepository))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // When: 更新庫存
    const success = await result.current.updateStock('1', 5)

    // Then: 應該更新成功並更新本地狀態
    expect(success).toBe(true)
    expect(mockProductRepository.updateStock).toHaveBeenCalledWith({ id: '1', quantity: 5 })
    
    // 檢查本地狀態是否更新
    expect(result.current.products[0].stock).toBe(5)
  })

  it('應該能夠處理更新庫存失敗', async () => {
    // Given: Mock repository 回傳更新失敗
    const mockError: RepositoryResult<Product> = {
      data: null,
      error: {
        message: '更新失敗',
        code: 'UPDATE_ERROR'
      }
    }
    vi.mocked(mockProductRepository.updateStock).mockResolvedValue(mockError)

    // 初始載入
    const getAllResult: RepositoryResult<Product[]> = {
      data: mockProducts,
      error: null
    }
    vi.mocked(mockProductRepository.getAll).mockResolvedValue(getAllResult)

    const { result } = renderHook(() => useProducts(mockProductRepository))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // When: 更新庫存
    const success = await result.current.updateStock('1', 5)

    // Then: 應該更新失敗
    expect(success).toBe(false)
    expect(result.current.error).toBe('更新失敗')
  })

  it('應該能夠設定類別篩選', async () => {
    // Given: Mock repository 回傳類別商品
    const electronicsProducts = mockProducts.filter(p => p.category === 'electronics')
    const mockResult: RepositoryResult<Product[]> = {
      data: electronicsProducts,
      error: null
    }
    vi.mocked(mockProductRepository.getByCategory).mockResolvedValue(mockResult)

    const { result } = renderHook(() => useProducts(mockProductRepository))

    // When: 設定類別
    result.current.setCategory('electronics')

    // Then: 應該呼叫 getByCategory
    await waitFor(() => {
      expect(mockProductRepository.getByCategory).toHaveBeenCalledWith('electronics', {})
    })
  })

  it('應該能夠搜尋商品', async () => {
    // Given: Mock repository 回傳搜尋結果
    const searchResults = mockProducts.filter(p => p.name.includes('iPhone'))
    const mockResult: RepositoryResult<Product[]> = {
      data: searchResults,
      error: null
    }
    vi.mocked(mockProductRepository.search).mockResolvedValue(mockResult)

    const { result } = renderHook(() => useProducts(mockProductRepository))

    // When: 設定搜尋關鍵字
    result.current.setSearchQuery('iPhone')

    // Then: 應該呼叫 search
    await waitFor(() => {
      expect(mockProductRepository.search).toHaveBeenCalledWith('iPhone', {})
    })
  })
})
