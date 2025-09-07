import { Product } from '@/domain/types/Product'
import { useToast } from '@/hooks/use-toast'
import { useProducts } from '@/hooks/useProducts'
import { fireEvent, render, screen } from '@/test/utils/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProductList from '../ProductList'

// Mock useProducts Hook
vi.mock('@/hooks/useProducts')
const mockUseProducts = vi.mocked(useProducts)

// Mock useToast Hook
vi.mock('@/hooks/use-toast')
const mockUseToast = vi.mocked(useToast)

// Mock 商品資料
const mockProducts: Product[] = [
    {
        id: '1',
        name: 'iPhone 15 Pro',
        price: 36900,
        description: '最新款 iPhone 專業版，搭載 A17 Pro 晶片',
        image: 'iphone-15-pro.jpg',
        category: 'electronics',
        stock: 15
    },
    {
        id: '2',
        name: 'MacBook Air M2',
        price: 37900,
        description: '輕薄筆電，搭載 M2 晶片，效能強勁',
        image: 'macbook-air-m2.jpg',
        category: 'electronics',
        stock: 8
    },
    {
        id: '3',
        name: 'AirPods Pro 2',
        price: 7490,
        description: '主動降噪無線耳機，音質清晰',
        image: 'airpods-pro-2.jpg',
        category: 'accessories',
        stock: 25
    }
]

describe('ProductList 整合測試', () => {
    const mockRefetch = vi.fn()
    const mockToast = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()

        // 設定預設的 mock 回傳值
        mockUseProducts.mockReturnValue({
            products: mockProducts,
            loading: false,
            error: null,
            refetch: mockRefetch,
            getProductById: vi.fn(),
            updateStock: vi.fn(),
            setPagination: vi.fn(),
            setCategory: vi.fn(),
            setSearchQuery: vi.fn()
        })

        mockUseToast.mockReturnValue({
            toast: mockToast,
            dismiss: vi.fn(),
            toasts: []
        })
    })

    describe('商品列表顯示功能', () => {
        it('應該正確顯示商品列表', () => {
            // Given: Hook 回傳商品資料
            mockUseProducts.mockReturnValue({
                products: mockProducts,
                loading: false,
                error: null,
                refetch: mockRefetch,
                getProductById: vi.fn(),
                updateStock: vi.fn(),
                setPagination: vi.fn(),
                setCategory: vi.fn(),
                setSearchQuery: vi.fn()
            })

            // When: 渲染元件
            render(<ProductList />)

            // Then: 應該顯示所有商品
            expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument()
            expect(screen.getByText('MacBook Air M2')).toBeInTheDocument()
            expect(screen.getByText('AirPods Pro 2')).toBeInTheDocument()

            // 應該顯示商品描述
            expect(screen.getByText('最新款 iPhone 專業版，搭載 A17 Pro 晶片')).toBeInTheDocument()
            expect(screen.getByText('輕薄筆電，搭載 M2 晶片，效能強勁')).toBeInTheDocument()
            expect(screen.getByText('主動降噪無線耳機，音質清晰')).toBeInTheDocument()
        })

        it('應該正確顯示商品價格格式', () => {
            // Given: Hook 回傳商品資料
            mockUseProducts.mockReturnValue({
                products: mockProducts,
                loading: false,
                error: null,
                refetch: mockRefetch,
                getProductById: vi.fn(),
                updateStock: vi.fn(),
                setPagination: vi.fn(),
                setCategory: vi.fn(),
                setSearchQuery: vi.fn()
            })

            // When: 渲染元件
            render(<ProductList />)

            // Then: 應該顯示正確的價格格式
            expect(screen.getByText('$36,900')).toBeInTheDocument()
            expect(screen.getByText('$37,900')).toBeInTheDocument()
            expect(screen.getByText('$7,490')).toBeInTheDocument()
        })

        it('應該正確顯示商品類別標籤', () => {
            // Given: Hook 回傳商品資料
            mockUseProducts.mockReturnValue({
                products: mockProducts,
                loading: false,
                error: null,
                refetch: mockRefetch,
                getProductById: vi.fn(),
                updateStock: vi.fn(),
                setPagination: vi.fn(),
                setCategory: vi.fn(),
                setSearchQuery: vi.fn()
            })

            // When: 渲染元件
            render(<ProductList />)

            // Then: 應該顯示正確的類別標籤
            expect(screen.getAllByText('電子產品')).toHaveLength(2) // iPhone 和 MacBook
            expect(screen.getByText('配件')).toBeInTheDocument() // AirPods
        })

        it('應該正確顯示庫存資訊', () => {
            // Given: Hook 回傳商品資料
            mockUseProducts.mockReturnValue({
                products: mockProducts,
                loading: false,
                error: null,
                refetch: mockRefetch,
                getProductById: vi.fn(),
                updateStock: vi.fn(),
                setPagination: vi.fn(),
                setCategory: vi.fn(),
                setSearchQuery: vi.fn()
            })

            // When: 渲染元件
            render(<ProductList />)

            // Then: 應該顯示庫存資訊
            expect(screen.getByText('庫存: 15')).toBeInTheDocument()
            expect(screen.getByText('庫存: 8')).toBeInTheDocument()
            expect(screen.getByText('庫存: 25')).toBeInTheDocument()
        })

        it('應該顯示空商品列表狀態', () => {
            // Given: Hook 回傳空商品列表
            mockUseProducts.mockReturnValue({
                products: [],
                loading: false,
                error: null,
                refetch: mockRefetch,
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
    })

    describe('Loading 狀態顯示功能', () => {
        it('應該正確顯示 Loading 狀態', () => {
            // Given: Hook 回傳載入中狀態
            mockUseProducts.mockReturnValue({
                products: [],
                loading: true,
                error: null,
                refetch: mockRefetch,
                getProductById: vi.fn(),
                updateStock: vi.fn(),
                setPagination: vi.fn(),
                setCategory: vi.fn(),
                setSearchQuery: vi.fn()
            })

            // When: 渲染元件
            render(<ProductList />)

            // Then: 應該顯示載入中訊息和動畫
            expect(screen.getByText('載入中...')).toBeInTheDocument()

            // 檢查載入動畫元素是否存在
            const loadingSpinner = document.querySelector('.animate-spin')
            expect(loadingSpinner).toBeInTheDocument()
        })

        it('Loading 狀態下不應該顯示商品列表', () => {
            // Given: Hook 回傳載入中狀態
            mockUseProducts.mockReturnValue({
                products: mockProducts,
                loading: true,
                error: null,
                refetch: mockRefetch,
                getProductById: vi.fn(),
                updateStock: vi.fn(),
                setPagination: vi.fn(),
                setCategory: vi.fn(),
                setSearchQuery: vi.fn()
            })

            // When: 渲染元件
            render(<ProductList />)

            // Then: 不應該顯示商品列表
            expect(screen.queryByText('iPhone 15 Pro')).not.toBeInTheDocument()
            expect(screen.queryByText('MacBook Air M2')).not.toBeInTheDocument()
            expect(screen.queryByText('AirPods Pro 2')).not.toBeInTheDocument()
        })
    })

    describe('錯誤訊息顯示功能', () => {
        it('應該正確顯示錯誤訊息', () => {
            // Given: Hook 回傳錯誤狀態
            const errorMessage = '無法連接到伺服器，請檢查網路連線'
            mockUseProducts.mockReturnValue({
                products: [],
                loading: false,
                error: errorMessage,
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
            expect(screen.getByText(errorMessage)).toBeInTheDocument()
        })

        it('應該提供重新載入按鈕', () => {
            // Given: Hook 回傳錯誤狀態
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

            // Then: 應該顯示重新載入按鈕
            const retryButton = screen.getByRole('button', { name: /重新載入/i })
            expect(retryButton).toBeInTheDocument()
        })

        it('應該能夠點擊重新載入按鈕', async () => {
            // Given: Hook 回傳錯誤狀態
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

            // When: 點擊重新載入按鈕
            const retryButton = screen.getByRole('button', { name: /重新載入/i })
            fireEvent.click(retryButton)

            // Then: 應該呼叫 refetch 方法
            expect(mockRefetch).toHaveBeenCalledTimes(1)
        })

        it('錯誤狀態下不應該顯示商品列表', () => {
            // Given: Hook 回傳錯誤狀態
            mockUseProducts.mockReturnValue({
                products: mockProducts,
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

            // Then: 不應該顯示商品列表
            expect(screen.queryByText('iPhone 15 Pro')).not.toBeInTheDocument()
            expect(screen.queryByText('MacBook Air M2')).not.toBeInTheDocument()
            expect(screen.queryByText('AirPods Pro 2')).not.toBeInTheDocument()
        })

        it('錯誤狀態下不應該顯示載入中狀態', () => {
            // Given: Hook 回傳錯誤狀態
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

            // Then: 不應該顯示載入中狀態
            expect(screen.queryByText('載入中...')).not.toBeInTheDocument()
        })
    })

    describe('狀態優先級測試', () => {
        it('Loading 狀態應該優先於錯誤狀態', () => {
            // Given: Hook 同時回傳載入中和錯誤狀態
            mockUseProducts.mockReturnValue({
                products: [],
                loading: true,
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

            // Then: 應該顯示載入中狀態，而不是錯誤狀態
            expect(screen.getByText('載入中...')).toBeInTheDocument()
            expect(screen.queryByText('載入失敗')).not.toBeInTheDocument()
        })

        it('Loading 狀態應該優先於商品列表', () => {
            // Given: Hook 同時回傳載入中和商品資料
            mockUseProducts.mockReturnValue({
                products: mockProducts,
                loading: true,
                error: null,
                refetch: mockRefetch,
                getProductById: vi.fn(),
                updateStock: vi.fn(),
                setPagination: vi.fn(),
                setCategory: vi.fn(),
                setSearchQuery: vi.fn()
            })

            // When: 渲染元件
            render(<ProductList />)

            // Then: 應該顯示載入中狀態，而不是商品列表
            expect(screen.getByText('載入中...')).toBeInTheDocument()
            expect(screen.queryByText('iPhone 15 Pro')).not.toBeInTheDocument()
        })

        it('錯誤狀態應該優先於商品列表', () => {
            // Given: Hook 同時回傳錯誤和商品資料
            mockUseProducts.mockReturnValue({
                products: mockProducts,
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

            // Then: 應該顯示錯誤狀態，而不是商品列表
            expect(screen.getByRole('heading', { name: '載入失敗' })).toBeInTheDocument()
            expect(screen.queryByText('iPhone 15 Pro')).not.toBeInTheDocument()
        })
    })
})
