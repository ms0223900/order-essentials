import type { Order } from '@/domain/types/Order';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useOrders } from '../useOrders';

// Mock container
const mockOrderRepository = {
    getOrders: vi.fn(),
    updateOrderStatus: vi.fn()
};

vi.mock('@/infrastructure/container', () => ({
    container: {
        resolve: vi.fn(() => mockOrderRepository)
    }
}));

describe('useOrders', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('應該成功載入訂單列表', async () => {
        // Given: 模擬成功的訂單資料
        const mockOrders: Order[] = [
            {
                id: 'order-1',
                orderNumber: 'ORD-20250108-000001',
                customerName: '測試客戶',
                customerPhone: '0912345678',
                customerAddress: '測試地址',
                totalAmount: 1000,
                status: 'pending',
                paymentMethod: 'cod',
                createdAt: new Date('2025-01-08T10:00:00Z'),
                updatedAt: new Date('2025-01-08T10:00:00Z'),
                items: [
                    {
                        id: 'item-1',
                        productId: 'product-1',
                        productName: '測試商品',
                        productPrice: 500,
                        productImage: '/test-image.jpg',
                        quantity: 2,
                        subtotal: 1000
                    }
                ]
            }
        ];

        mockOrderRepository.getOrders.mockResolvedValue({
            success: true,
            orders: mockOrders
        });

        // When: 使用 hook
        const { result } = renderHook(() => useOrders());

        // Then: 初始狀態應該是載入中
        expect(result.current.loading).toBe(true);
        expect(result.current.orders).toEqual([]);
        expect(result.current.error).toBe(null);

        // 等待載入完成
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // Then: 應該成功載入訂單
        expect(result.current.orders).toEqual(mockOrders);
        expect(result.current.error).toBe(null);
        expect(mockOrderRepository.getOrders).toHaveBeenCalledTimes(1);
    });

    it('應該處理載入訂單失敗', async () => {
        // Given: 模擬載入失敗
        mockOrderRepository.getOrders.mockResolvedValue({
            success: false,
            error: '載入訂單失敗'
        });

        // When: 使用 hook
        const { result } = renderHook(() => useOrders());

        // 等待載入完成
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // Then: 應該顯示錯誤
        expect(result.current.orders).toEqual([]);
        expect(result.current.error).toBe('載入訂單失敗');
    });

    it('應該處理載入訂單異常', async () => {
        // Given: 模擬異常
        mockOrderRepository.getOrders.mockRejectedValue(new Error('網路錯誤'));

        // When: 使用 hook
        const { result } = renderHook(() => useOrders());

        // 等待載入完成
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // Then: 應該顯示錯誤
        expect(result.current.orders).toEqual([]);
        expect(result.current.error).toBe('網路錯誤');
    });

    it('應該能夠重新載入訂單', async () => {
        // Given: 模擬成功的訂單資料
        const mockOrders: Order[] = [
            {
                id: 'order-1',
                orderNumber: 'ORD-20250108-000001',
                customerName: '測試客戶',
                customerPhone: '0912345678',
                customerAddress: '測試地址',
                totalAmount: 1000,
                status: 'pending',
                paymentMethod: 'cod',
                createdAt: new Date('2025-01-08T10:00:00Z'),
                updatedAt: new Date('2025-01-08T10:00:00Z'),
                items: []
            }
        ];

        mockOrderRepository.getOrders.mockResolvedValue({
            success: true,
            orders: mockOrders
        });

        // When: 使用 hook
        const { result } = renderHook(() => useOrders());

        // 等待初始載入完成
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // When: 重新載入
        await result.current.loadOrders();

        // Then: 應該重新呼叫 getOrders
        expect(mockOrderRepository.getOrders).toHaveBeenCalledTimes(2);
    });

    it('應該能夠更新訂單狀態', async () => {
        // Given: 模擬成功的訂單資料和更新回應
        const mockOrders: Order[] = [
            {
                id: 'order-1',
                orderNumber: 'ORD-20250108-000001',
                customerName: '測試客戶',
                customerPhone: '0912345678',
                customerAddress: '測試地址',
                totalAmount: 1000,
                status: 'pending',
                paymentMethod: 'cod',
                createdAt: new Date('2025-01-08T10:00:00Z'),
                updatedAt: new Date('2025-01-08T10:00:00Z'),
                items: []
            }
        ];

        mockOrderRepository.getOrders.mockResolvedValue({
            success: true,
            orders: mockOrders
        });

        mockOrderRepository.updateOrderStatus.mockResolvedValue({
            success: true,
            orderId: 'order-1',
            orderNumber: 'ORD-20250108-000001',
            status: 'confirmed',
            updatedAt: new Date('2025-01-08T11:00:00Z')
        });

        // When: 使用 hook
        const { result } = renderHook(() => useOrders());

        // 等待初始載入完成
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // When: 更新訂單狀態
        const updateResult = await result.current.updateOrderStatus({
            orderId: 'order-1',
            status: 'confirmed'
        });

        // Then: 應該成功更新
        expect(updateResult.success).toBe(true);
        expect(mockOrderRepository.updateOrderStatus).toHaveBeenCalledWith({
            orderId: 'order-1',
            status: 'confirmed'
        });

        // Then: 本地狀態應該更新
        await waitFor(() => {
            expect(result.current.orders[0].status).toBe('confirmed');
        });
    });

    it('應該處理更新訂單狀態失敗', async () => {
        // Given: 模擬成功的訂單資料和更新失敗
        const mockOrders: Order[] = [
            {
                id: 'order-1',
                orderNumber: 'ORD-20250108-000001',
                customerName: '測試客戶',
                customerPhone: '0912345678',
                customerAddress: '測試地址',
                totalAmount: 1000,
                status: 'pending',
                paymentMethod: 'cod',
                createdAt: new Date('2025-01-08T10:00:00Z'),
                updatedAt: new Date('2025-01-08T10:00:00Z'),
                items: []
            }
        ];

        mockOrderRepository.getOrders.mockResolvedValue({
            success: true,
            orders: mockOrders
        });

        mockOrderRepository.updateOrderStatus.mockResolvedValue({
            success: false,
            error: '訂單不存在'
        });

        // When: 使用 hook
        const { result } = renderHook(() => useOrders());

        // 等待初始載入完成
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // When: 更新訂單狀態
        const updateResult = await result.current.updateOrderStatus({
            orderId: 'order-1',
            status: 'confirmed'
        });

        // Then: 應該返回失敗
        expect(updateResult.success).toBe(false);
        expect(updateResult.error).toBe('訂單不存在');

        // Then: 本地狀態不應該改變
        expect(result.current.orders[0].status).toBe('pending');
    });

    it('應該處理更新訂單狀態異常', async () => {
        // Given: 模擬成功的訂單資料和更新異常
        const mockOrders: Order[] = [
            {
                id: 'order-1',
                orderNumber: 'ORD-20250108-000001',
                customerName: '測試客戶',
                customerPhone: '0912345678',
                customerAddress: '測試地址',
                totalAmount: 1000,
                status: 'pending',
                paymentMethod: 'cod',
                createdAt: new Date('2025-01-08T10:00:00Z'),
                updatedAt: new Date('2025-01-08T10:00:00Z'),
                items: []
            }
        ];

        mockOrderRepository.getOrders.mockResolvedValue({
            success: true,
            orders: mockOrders
        });

        mockOrderRepository.updateOrderStatus.mockRejectedValue(new Error('網路錯誤'));

        // When: 使用 hook
        const { result } = renderHook(() => useOrders());

        // 等待初始載入完成
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // When: 更新訂單狀態
        const updateResult = await result.current.updateOrderStatus({
            orderId: 'order-1',
            status: 'confirmed'
        });

        // Then: 應該返回失敗
        expect(updateResult.success).toBe(false);
        expect(updateResult.error).toBe('網路錯誤');

        // Then: 本地狀態不應該改變
        expect(result.current.orders[0].status).toBe('pending');
    });
});
