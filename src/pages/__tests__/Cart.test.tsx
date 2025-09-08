import { useCart } from '@/contexts/CartContext'
import Cart from '@/pages/Cart'
import { fireEvent, render, screen, waitFor } from '@/test/utils/test-utils'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock 產品倉庫
const mockProductRepository = {
    checkInventoryAvailability: vi.fn(),
    deductInventoryBatch: vi.fn(),
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    updateStock: vi.fn(),
    getByCategory: vi.fn(),
    search: vi.fn(),
}

// Mock 訂單倉庫
const mockOrderRepository = {
    createOrder: vi.fn(),
    getOrders: vi.fn(),
    updateOrderStatus: vi.fn(),
}

// Mock toast
const mockToast = vi.fn()
vi.mock('@/hooks/use-toast', () => ({
    useToast: vi.fn(() => ({
        toast: mockToast
    }))
}))

// Mock 依賴注入容器
vi.mock('@/infrastructure/container', () => ({
    container: {
        resolve: vi.fn((key: string) => {
            if (key === 'ProductRepository') return mockProductRepository;
            if (key === 'OrderRepository') return mockOrderRepository;
            return mockProductRepository; // fallback
        })
    }
}))

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return {
        ...actual,
        useNavigate: () => mockNavigate
    }
})

// 測試組件 - 包含購物車商品
const CartWithItems = () => {
    const { addToCart } = useCart()

    // 在組件掛載時添加商品到購物車
    React.useEffect(() => {
        addToCart({
            id: 'test-product',
            name: '測試商品',
            price: 100,
            image: '/test.jpg',
            description: '測試描述',
            stock: 10
        }, 2)
    }, [])

    return <Cart />
}

describe('Cart 頁面 - 庫存扣除整合測試', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('應該在成功購買後扣除庫存並顯示成功訊息', async () => {
        // Given: 模擬庫存檢查和扣除成功
        mockProductRepository.checkInventoryAvailability.mockResolvedValueOnce({
            data: { available: true, message: '所有商品庫存充足' },
            error: null
        })

        mockProductRepository.deductInventoryBatch.mockResolvedValueOnce({
            data: {
                success: true,
                message: '所有商品庫存扣除成功',
                results: [{
                    success: true,
                    productId: 'test-product',
                    productName: '測試商品',
                    previousStock: 10,
                    newStock: 8,
                    quantityDeducted: 2
                }]
            },
            error: null
        })

        // Mock 訂單建立成功
        mockOrderRepository.createOrder.mockResolvedValueOnce({
            success: true,
            orderId: 'test-order-id',
            orderNumber: 'ORD-20250108-000001',
            totalAmount: 200
        })

        render(<CartWithItems />)

        // When: 填寫客戶資訊並提交訂單
        fireEvent.change(screen.getByLabelText(/姓名/i), { target: { value: '測試用戶' } })
        fireEvent.change(screen.getByLabelText(/電話/i), { target: { value: '0912345678' } })
        fireEvent.change(screen.getByLabelText(/地址/i), { target: { value: '測試地址' } })

        fireEvent.click(screen.getByText(/確認訂單/i))

        // Then: 應該調用庫存扣除並顯示成功訊息
        await waitFor(() => {
            expect(mockProductRepository.checkInventoryAvailability).toHaveBeenCalled()
            expect(mockProductRepository.deductInventoryBatch).toHaveBeenCalled()
        })

        // 檢查是否顯示成功訊息
        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith({
                title: '訂單建立成功！',
                description: expect.stringContaining('訂單編號：')
            })
        })

        // 檢查是否導航到訂單頁面
        expect(mockNavigate).toHaveBeenCalledWith('/orders')
    })

    it('應該在庫存不足時顯示錯誤訊息', async () => {
        // Given: 模擬庫存不足
        mockProductRepository.checkInventoryAvailability.mockResolvedValueOnce({
            data: {
                available: false,
                message: '部分商品庫存不足',
                unavailableItems: [{
                    productId: 'test-product',
                    currentStock: 1,
                    requestedQuantity: 2,
                    error: '庫存不足',
                    errorCode: 'INSUFFICIENT_STOCK'
                }]
            },
            error: null
        })

        render(<CartWithItems />)

        // When: 填寫客戶資訊並提交訂單
        fireEvent.change(screen.getByLabelText(/姓名/i), { target: { value: '測試用戶' } })
        fireEvent.change(screen.getByLabelText(/電話/i), { target: { value: '0912345678' } })
        fireEvent.change(screen.getByLabelText(/地址/i), { target: { value: '測試地址' } })

        fireEvent.click(screen.getByText(/確認訂單/i))

        // Then: 應該顯示庫存不足的錯誤訊息
        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith({
                title: '訂單建立失敗',
                description: '庫存不足: 商品 test-product: 庫存不足',
                variant: 'destructive'
            })
        })

        // 不應該導航到訂單頁面
        expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('應該在庫存扣除失敗時顯示錯誤訊息', async () => {
        // Given: 模擬庫存檢查成功但扣除失敗
        mockProductRepository.checkInventoryAvailability.mockResolvedValueOnce({
            data: { available: true, message: '所有商品庫存充足' },
            error: null
        })

        // Mock 訂單建立成功
        mockOrderRepository.createOrder.mockResolvedValueOnce({
            success: true,
            orderId: 'test-order-id',
            orderNumber: 'ORD-20250108-000001',
            totalAmount: 200
        })

        mockProductRepository.deductInventoryBatch.mockResolvedValueOnce({
            data: {
                success: false,
                error: '扣除庫存時發生錯誤',
                errorCode: 'DEDUCTION_ERROR'
            },
            error: null
        })

        render(<CartWithItems />)

        // When: 填寫客戶資訊並提交訂單
        fireEvent.change(screen.getByLabelText(/姓名/i), { target: { value: '測試用戶' } })
        fireEvent.change(screen.getByLabelText(/電話/i), { target: { value: '0912345678' } })
        fireEvent.change(screen.getByLabelText(/地址/i), { target: { value: '測試地址' } })

        fireEvent.click(screen.getByText(/確認訂單/i))

        // Then: 應該顯示庫存扣除失敗的錯誤訊息
        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith({
                title: '訂單建立失敗',
                description: '庫存扣除失敗: 扣除庫存時發生錯誤',
                variant: 'destructive'
            })
        })

        // 不應該導航到訂單頁面
        expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('應該在庫存檢查失敗時顯示錯誤訊息', async () => {
        // Given: 模擬庫存檢查失敗
        mockProductRepository.checkInventoryAvailability.mockResolvedValueOnce({
            data: null,
            error: { message: '檢查庫存時發生錯誤', code: 'CHECK_ERROR' }
        })

        render(<CartWithItems />)

        // When: 填寫客戶資訊並提交訂單
        fireEvent.change(screen.getByLabelText(/姓名/i), { target: { value: '測試用戶' } })
        fireEvent.change(screen.getByLabelText(/電話/i), { target: { value: '0912345678' } })
        fireEvent.change(screen.getByLabelText(/地址/i), { target: { value: '測試地址' } })

        fireEvent.click(screen.getByText(/確認訂單/i))

        // Then: 應該顯示庫存檢查失敗的錯誤訊息
        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith({
                title: '訂單建立失敗',
                description: '庫存不足: 檢查庫存時發生錯誤',
                variant: 'destructive'
            })
        })

        // 不應該導航到訂單頁面
        expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('應該在提交過程中顯示載入狀態', async () => {
        // Given: 模擬異步操作延遲
        mockProductRepository.checkInventoryAvailability.mockImplementationOnce(
            () => new Promise(resolve => setTimeout(() => resolve({
                data: { available: true, message: '所有商品庫存充足' },
                error: null
            }), 100))
        )

        mockProductRepository.deductInventoryBatch.mockResolvedValueOnce({
            data: {
                success: true,
                message: '所有商品庫存扣除成功',
                results: [{
                    success: true,
                    productId: 'test-product',
                    productName: '測試商品',
                    previousStock: 10,
                    newStock: 8,
                    quantityDeducted: 2
                }]
            },
            error: null
        })

        // Mock 訂單建立成功
        mockOrderRepository.createOrder.mockResolvedValueOnce({
            success: true,
            orderId: 'test-order-id',
            orderNumber: 'ORD-20250108-000001',
            totalAmount: 200
        })

        render(<CartWithItems />)

        // When: 填寫客戶資訊並提交訂單
        fireEvent.change(screen.getByLabelText(/姓名/i), { target: { value: '測試用戶' } })
        fireEvent.change(screen.getByLabelText(/電話/i), { target: { value: '0912345678' } })
        fireEvent.change(screen.getByLabelText(/地址/i), { target: { value: '測試地址' } })

        fireEvent.click(screen.getByText(/確認訂單/i))

        // Then: 應該顯示載入狀態
        expect(screen.getByText(/處理中/i)).toBeInTheDocument()

        // 按鈕應該被禁用
        const submitButton = screen.getByText(/處理中/i)
        expect(submitButton).toBeDisabled()

        // 等待操作完成
        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith({
                title: '訂單建立成功！',
                description: expect.stringContaining('訂單編號：')
            })
        })
    })

})