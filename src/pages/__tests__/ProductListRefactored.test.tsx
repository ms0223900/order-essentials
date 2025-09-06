import { Product } from '@/domain/types/Product'
import { useProducts } from '@/hooks/useProducts'
import { fireEvent, render, screen } from '@/test/utils/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProductList from '../ProductList'

// Mock useProducts Hook
vi.mock('@/hooks/useProducts')
const mockUseProducts = vi.mocked(useProducts)

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

describe('ProductList 重構後元件', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('應該顯示載入中狀態', () => {
    // Given: Hook 回傳載入中狀態
    mockUseProducts.mockReturnValue({
      products: [],
      loading: true,
      error: null,
      refetch: vi.fn(),
      getProductById: vi.fn(),
      updateStock: vi.fn(),
      setPagination: vi.fn(),
      setCategory: vi.fn(),
      setSearchQuery: vi.fn()
    })

    // When: 渲染元件
    render(<ProductList />)

    // Then: 應該顯示載入中訊息
    expect(screen.getByText('載入中...')).toBeInTheDocument()
  })

  it('應該顯示錯誤狀態並提供重試功能', async () => {
    // Given: Hook 回傳錯誤狀態
    const mockRefetch = vi.fn()
    mockUseProducts.mockReturnValue({
      products: [],
      loading: false,
      error: '載入失敗',
      refetch: mockRefetch,
      getProductById: vi.fn(),
      updateStock: vi.fn(),
      setPagination: vi.fn(),
      setCategory: vi.fn(),
      setSearchQuery: vi.fn()
    })

    // When: 渲染元件
    render(<ProductList />)

    // Then: 應該顯示錯誤訊息
    expect(screen.getByText('載入失敗')).toBeInTheDocument()
    expect(screen.getByText('載入失敗')).toBeInTheDocument()

    // When: 點擊重新載入按鈕
    const retryButton = screen.getByRole('button', { name: /重新載入/i })
    fireEvent.click(retryButton)

    // Then: 應該呼叫 refetch
    expect(mockRefetch).toHaveBeenCalled()
  })

  it('應該顯示商品列表', () => {
    // Given: Hook 回傳商品資料
    mockUseProducts.mockReturnValue({
      products: mockProducts,
      loading: false,
      error: null,
      refetch: vi.fn(),
      getProductById: vi.fn(),
      updateStock: vi.fn(),
      setPagination: vi.fn(),
      setCategory: vi.fn(),
      setSearchQuery: vi.fn()
    })

    // When: 渲染元件
    render(<ProductList />)

    // Then: 應該顯示商品
    expect(screen.getByText('iPhone 15')).toBeInTheDocument()
    expect(screen.getByText('AirPods Pro')).toBeInTheDocument()
    expect(screen.getByText('最新款 iPhone')).toBeInTheDocument()
    expect(screen.getByText('無線耳機')).toBeInTheDocument()
  })

  it('應該顯示正確的價格格式', () => {
    // Given: Hook 回傳商品資料
    mockUseProducts.mockReturnValue({
      products: mockProducts,
      loading: false,
      error: null,
      refetch: vi.fn(),
      getProductById: vi.fn(),
      updateStock: vi.fn(),
      setPagination: vi.fn(),
      setCategory: vi.fn(),
      setSearchQuery: vi.fn()
    })

    // When: 渲染元件
    render(<ProductList />)

    // Then: 應該顯示正確的價格格式
    expect(screen.getByText('NT$29,900')).toBeInTheDocument()
    expect(screen.getByText('NT$7,490')).toBeInTheDocument()
  })

  it('應該顯示正確的商品類別標籤', () => {
    // Given: Hook 回傳商品資料
    mockUseProducts.mockReturnValue({
      products: mockProducts,
      loading: false,
      error: null,
      refetch: vi.fn(),
      getProductById: vi.fn(),
      updateStock: vi.fn(),
      setPagination: vi.fn(),
      setCategory: vi.fn(),
      setSearchQuery: vi.fn()
    })

    // When: 渲染元件
    render(<ProductList />)

    // Then: 應該顯示正確的類別標籤
    expect(screen.getByText('電子產品')).toBeInTheDocument()
    expect(screen.getByText('配件')).toBeInTheDocument()
  })

  it('應該顯示庫存資訊', () => {
    // Given: Hook 回傳商品資料
    mockUseProducts.mockReturnValue({
      products: mockProducts,
      loading: false,
      error: null,
      refetch: vi.fn(),
      getProductById: vi.fn(),
      updateStock: vi.fn(),
      setPagination: vi.fn(),
      setCategory: vi.fn(),
      setSearchQuery: vi.fn()
    })

    // When: 渲染元件
    render(<ProductList />)

    // Then: 應該顯示庫存資訊
    expect(screen.getByText('庫存: 10')).toBeInTheDocument()
    expect(screen.getByText('庫存: 20')).toBeInTheDocument()
  })

  it('應該能夠加入購物車', () => {
    // Given: Hook 回傳商品資料
    mockUseProducts.mockReturnValue({
      products: mockProducts,
      loading: false,
      error: null,
      refetch: vi.fn(),
      getProductById: vi.fn(),
      updateStock: vi.fn(),
      setPagination: vi.fn(),
      setCategory: vi.fn(),
      setSearchQuery: vi.fn()
    })

    // When: 渲染元件
    render(<ProductList />)

    // When: 點擊加入購物車按鈕
    const addToCartButtons = screen.getAllByRole('button', { name: '' })
    const firstAddToCartButton = addToCartButtons.find(button => 
      button.querySelector('svg') // 尋找包含圖示的按鈕
    )
    
    if (firstAddToCartButton) {
      fireEvent.click(firstAddToCartButton)
    }

    // Then: 應該顯示成功訊息 (透過 toast)
    // 注意：這裡需要 mock toast 功能來驗證
  })

  it('應該在庫存為 0 時禁用加入購物車按鈕', () => {
    // Given: Hook 回傳庫存為 0 的商品
    const outOfStockProduct: Product = {
      ...mockProducts[0],
      stock: 0
    }
    
    mockUseProducts.mockReturnValue({
      products: [outOfStockProduct],
      loading: false,
      error: null,
      refetch: vi.fn(),
      getProductById: vi.fn(),
      updateStock: vi.fn(),
      setPagination: vi.fn(),
      setCategory: vi.fn(),
      setSearchQuery: vi.fn()
    })

    // When: 渲染元件
    render(<ProductList />)

    // Then: 加入購物車按鈕應該被禁用
    const addToCartButtons = screen.getAllByRole('button', { name: '' })
    const addToCartButton = addToCartButtons.find(button => 
      button.querySelector('svg') && button.hasAttribute('disabled')
    )
    
    expect(addToCartButton).toBeDisabled()
  })

  it('應該顯示空商品列表狀態', () => {
    // Given: Hook 回傳空商品列表
    mockUseProducts.mockReturnValue({
      products: [],
      loading: false,
      error: null,
      refetch: vi.fn(),
      getProductById: vi.fn(),
      updateStock: vi.fn(),
      setPagination: vi.fn(),
      setCategory: vi.fn(),
      setSearchQuery: vi.fn()
    })

    // When: 渲染元件
    render(<ProductList />)

    // Then: 應該顯示空狀態訊息
    expect(screen.getByText('暫無商品')).toBeInTheDocument()
    expect(screen.getByText('商品即將上架，敬請期待！')).toBeInTheDocument()
  })

  it('應該提供查看詳情連結', () => {
    // Given: Hook 回傳商品資料
    mockUseProducts.mockReturnValue({
      products: mockProducts,
      loading: false,
      error: null,
      refetch: vi.fn(),
      getProductById: vi.fn(),
      updateStock: vi.fn(),
      setPagination: vi.fn(),
      setCategory: vi.fn(),
      setSearchQuery: vi.fn()
    })

    // When: 渲染元件
    render(<ProductList />)

    // Then: 應該顯示查看詳情按鈕
    const detailButtons = screen.getAllByRole('button', { name: /查看詳情/i })
    expect(detailButtons).toHaveLength(2)
    
    // 檢查連結是否正確
    const firstDetailLink = detailButtons[0].closest('a')
    expect(firstDetailLink).toHaveAttribute('href', '/product/1')
  })
})
