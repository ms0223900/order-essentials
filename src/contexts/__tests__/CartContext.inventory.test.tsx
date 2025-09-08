import { CartProvider, useCart } from '@/contexts/CartContext'
import { fireEvent, render, screen } from '@/test/utils/test-utils'
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

// 測試組件
const TestComponent = () => {
    const { state, addToCart, createOrder } = useCart()

    const handleAddToCart = () => {
        addToCart({
            id: 'test-product',
            name: '測試商品',
            price: 100,
            image: '/test.jpg',
            description: '測試描述',
            stock: 10
        }, 2)
    }

    const handleCreateOrder = async () => {
        try {
            await createOrder({
                name: '測試用戶',
                phone: '0912345678',
                address: '測試地址'
            })
        } catch (error) {
            // 捕獲錯誤但不重新拋出，避免測試中的未處理錯誤
            console.log('訂單創建失敗:', error)
        }
    }

    return (
        <div>
            <div data-testid="cart-items-count">{state.items.length}</div>
            <div data-testid="cart-total">{state.items.reduce((total, item) => total + (item.product.price * item.quantity), 0)}</div>
            <button onClick={handleAddToCart} data-testid="add-to-cart">加入購物車</button>
            <button onClick={handleCreateOrder} data-testid="create-order">創建訂單</button>
        </div>
    )
}

describe('CartContext - 庫存扣除功能', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // 設置預設的訂單建立成功回應
        mockOrderRepository.createOrder.mockResolvedValue({
            success: true,
            orderId: 'test-order-id',
            orderNumber: 'ORD-20250108-000001',
            totalAmount: 200
        })
    })

    it('應該在創建訂單時檢查庫存可用性', async () => {
        // Given: 模擬庫存檢查成功
        mockProductRepository.checkInventoryAvailability.mockResolvedValueOnce({
            data: { available: true, message: '所有商品庫存充足' },
            error: null
        })

        // 模擬庫存扣除成功
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

        render(
            <CartProvider>
                <TestComponent />
            </CartProvider>
        )

        // When: 加入商品到購物車並創建訂單
        fireEvent.click(screen.getByTestId('add-to-cart'))
        fireEvent.click(screen.getByTestId('create-order'))

        // Then: 應該調用庫存檢查和扣除方法
        await vi.waitFor(() => {
            expect(mockProductRepository.checkInventoryAvailability).toHaveBeenCalledWith([
                { productId: 'test-product', quantity: 2 }
            ])
            expect(mockProductRepository.deductInventoryBatch).toHaveBeenCalledWith([
                { productId: 'test-product', quantity: 2 }
            ])
        })
    })

    it('應該在庫存扣除成功後清空購物車', async () => {
        // Given: 模擬庫存檢查和扣除都成功
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

        render(
            <CartProvider>
                <TestComponent />
            </CartProvider>
        )

        // When: 加入商品到購物車並創建訂單
        fireEvent.click(screen.getByTestId('add-to-cart'))
        expect(screen.getByTestId('cart-items-count')).toHaveTextContent('1')

        fireEvent.click(screen.getByTestId('create-order'))

        // Then: 購物車應該被清空
        await vi.waitFor(() => {
            expect(screen.getByTestId('cart-items-count')).toHaveTextContent('0')
        })
    })

    it('應該處理多個商品的庫存扣除', async () => {
        // Given: 模擬多個商品的庫存檢查和扣除成功
        mockProductRepository.checkInventoryAvailability.mockResolvedValueOnce({
            data: { available: true, message: '所有商品庫存充足' },
            error: null
        })

        mockProductRepository.deductInventoryBatch.mockResolvedValueOnce({
            data: {
                success: true,
                message: '所有商品庫存扣除成功',
                results: [
                    {
                        success: true,
                        productId: 'product-1',
                        productName: '商品1',
                        previousStock: 10,
                        newStock: 8,
                        quantityDeducted: 2
                    },
                    {
                        success: true,
                        productId: 'product-2',
                        productName: '商品2',
                        previousStock: 5,
                        newStock: 3,
                        quantityDeducted: 2
                    }
                ]
            },
            error: null
        })

        const MultiProductTestComponent = () => {
            const { addToCart, createOrder } = useCart()

            const handleAddMultipleProducts = () => {
                addToCart({
                    id: 'product-1',
                    name: '商品1',
                    price: 100,
                    image: '/test1.jpg',
                    description: '測試描述1',
                    stock: 10
                }, 2)
                addToCart({
                    id: 'product-2',
                    name: '商品2',
                    price: 200,
                    image: '/test2.jpg',
                    description: '測試描述2',
                    stock: 5
                }, 2)
            }

            const handleCreateOrder = async () => {
                try {
                    await createOrder({
                        name: '測試用戶',
                        phone: '0912345678',
                        address: '測試地址'
                    })
                } catch (error) {
                    console.log('訂單創建失敗:', error)
                }
            }

            return (
                <div>
                    <button onClick={handleAddMultipleProducts} data-testid="add-multiple">加入多個商品</button>
                    <button onClick={handleCreateOrder} data-testid="create-order">創建訂單</button>
                </div>
            )
        }

        render(
            <CartProvider>
                <MultiProductTestComponent />
            </CartProvider>
        )

        // When: 加入多個商品並創建訂單
        fireEvent.click(screen.getByTestId('add-multiple'))
        fireEvent.click(screen.getByTestId('create-order'))

        // Then: 應該調用批量庫存扣除方法
        await vi.waitFor(() => {
            expect(mockProductRepository.deductInventoryBatch).toHaveBeenCalledWith([
                { productId: 'product-1', quantity: 2 },
                { productId: 'product-2', quantity: 2 }
            ])
        })
    })

    it('應該正確調用庫存檢查方法', async () => {
        // Given: 模擬庫存檢查成功
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

        render(
            <CartProvider>
                <TestComponent />
            </CartProvider>
        )

        // When: 加入商品到購物車並創建訂單
        fireEvent.click(screen.getByTestId('add-to-cart'))
        fireEvent.click(screen.getByTestId('create-order'))

        // Then: 應該先調用庫存檢查方法
        await vi.waitFor(() => {
            expect(mockProductRepository.checkInventoryAvailability).toHaveBeenCalledWith([
                { productId: 'test-product', quantity: 2 }
            ])
        })
    })

    it('應該正確調用庫存扣除方法', async () => {
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

        render(
            <CartProvider>
                <TestComponent />
            </CartProvider>
        )

        // When: 加入商品到購物車並創建訂單
        fireEvent.click(screen.getByTestId('add-to-cart'))
        fireEvent.click(screen.getByTestId('create-order'))

        // Then: 應該調用庫存扣除方法
        await vi.waitFor(() => {
            expect(mockProductRepository.deductInventoryBatch).toHaveBeenCalledWith([
                { productId: 'test-product', quantity: 2 }
            ])
        })
    })
})