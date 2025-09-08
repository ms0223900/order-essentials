import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SupabaseOrderRepository } from '../SupabaseOrderRepository';
import type { CreateOrderRequest, UpdateOrderStatusRequest } from '@/domain/types/Order';

// Mock Supabase client
const mockSupabaseRpc = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: mockSupabaseRpc
  }
}));

describe('SupabaseOrderRepository', () => {
  let repository: SupabaseOrderRepository;

  beforeEach(() => {
    repository = new SupabaseOrderRepository();
    vi.clearAllMocks();
  });

  describe('createOrder', () => {
    it('應該成功建立訂單', async () => {
      // Given: 模擬成功的 Supabase 回應
      const mockResponse = {
        data: {
          success: true,
          order_id: 'test-order-id',
          order_number: 'ORD-20250108-000001',
          total_amount: 1000
        },
        error: null
      };
      mockSupabaseRpc.mockResolvedValue(mockResponse);

      const request: CreateOrderRequest = {
        customerName: '測試客戶',
        customerPhone: '0912345678',
        customerAddress: '測試地址',
        items: [
          { productId: 'product-1', quantity: 2 },
          { productId: 'product-2', quantity: 1 }
        ]
      };

      // When: 建立訂單
      const result = await repository.createOrder(request);

      // Then: 應該成功建立訂單
      expect(result.success).toBe(true);
      expect(result.orderId).toBe('test-order-id');
      expect(result.orderNumber).toBe('ORD-20250108-000001');
      expect(result.totalAmount).toBe(1000);
      expect(mockSupabaseRpc).toHaveBeenCalledWith('create_order_with_items', {
        p_customer_name: '測試客戶',
        p_customer_phone: '0912345678',
        p_customer_address: '測試地址',
        p_items: [
          { product_id: 'product-1', quantity: 2 },
          { product_id: 'product-2', quantity: 1 }
        ]
      });
    });

    it('應該處理 Supabase 錯誤', async () => {
      // Given: 模擬 Supabase 錯誤
      const mockError = {
        data: null,
        error: { message: 'Supabase 錯誤' }
      };
      mockSupabaseRpc.mockResolvedValue(mockError);

      const request: CreateOrderRequest = {
        customerName: '測試客戶',
        customerPhone: '0912345678',
        customerAddress: '測試地址',
        items: [{ productId: 'product-1', quantity: 1 }]
      };

      // When: 建立訂單
      const result = await repository.createOrder(request);

      // Then: 應該返回錯誤
      expect(result.success).toBe(false);
      expect(result.error).toBe('Supabase 錯誤');
      expect(result.errorCode).toBe('SUPABASE_ERROR');
    });

    it('應該處理函數執行失敗', async () => {
      // Given: 模擬函數執行失敗
      const mockResponse = {
        data: {
          success: false,
          error: '庫存不足',
          error_code: 'INSUFFICIENT_STOCK'
        },
        error: null
      };
      mockSupabaseRpc.mockResolvedValue(mockResponse);

      const request: CreateOrderRequest = {
        customerName: '測試客戶',
        customerPhone: '0912345678',
        customerAddress: '測試地址',
        items: [{ productId: 'product-1', quantity: 1 }]
      };

      // When: 建立訂單
      const result = await repository.createOrder(request);

      // Then: 應該返回錯誤
      expect(result.success).toBe(false);
      expect(result.error).toBe('庫存不足');
      expect(result.errorCode).toBe('INSUFFICIENT_STOCK');
    });

    it('應該處理異常情況', async () => {
      // Given: 模擬異常
      mockSupabaseRpc.mockRejectedValue(new Error('網路錯誤'));

      const request: CreateOrderRequest = {
        customerName: '測試客戶',
        customerPhone: '0912345678',
        customerAddress: '測試地址',
        items: [{ productId: 'product-1', quantity: 1 }]
      };

      // When: 建立訂單
      const result = await repository.createOrder(request);

      // Then: 應該返回錯誤
      expect(result.success).toBe(false);
      expect(result.error).toBe('網路錯誤');
      expect(result.errorCode).toBe('UNKNOWN_ERROR');
    });
  });

  describe('getOrders', () => {
    it('應該成功取得訂單列表', async () => {
      // Given: 模擬成功的 Supabase 回應
      const mockResponse = {
        data: {
          success: true,
          orders: [
            {
              id: 'order-1',
              order_number: 'ORD-20250108-000001',
              customer_name: '測試客戶',
              customer_phone: '0912345678',
              customer_address: '測試地址',
              total_amount: '1000.00',
              status: 'pending',
              payment_method: 'cod',
              created_at: '2025-01-08T10:00:00Z',
              updated_at: '2025-01-08T10:00:00Z',
              items: [
                {
                  id: 'item-1',
                  product_id: 'product-1',
                  product_name: '測試商品',
                  product_price: '500.00',
                  product_image: '/test-image.jpg',
                  quantity: 2,
                  subtotal: '1000.00'
                }
              ]
            }
          ]
        },
        error: null
      };
      mockSupabaseRpc.mockResolvedValue(mockResponse);

      // When: 取得訂單列表
      const result = await repository.getOrders();

      // Then: 應該成功取得訂單
      expect(result.success).toBe(true);
      expect(result.orders).toHaveLength(1);
      expect(result.orders![0].id).toBe('order-1');
      expect(result.orders![0].orderNumber).toBe('ORD-20250108-000001');
      expect(result.orders![0].customerName).toBe('測試客戶');
      expect(result.orders![0].totalAmount).toBe(1000);
      expect(result.orders![0].items).toHaveLength(1);
      expect(result.orders![0].items[0].productName).toBe('測試商品');
      expect(mockSupabaseRpc).toHaveBeenCalledWith('get_orders_with_items');
    });

    it('應該處理取得訂單失敗', async () => {
      // Given: 模擬失敗的 Supabase 回應
      const mockResponse = {
        data: {
          success: false,
          error: '資料庫錯誤',
          error_code: 'DATABASE_ERROR'
        },
        error: null
      };
      mockSupabaseRpc.mockResolvedValue(mockResponse);

      // When: 取得訂單列表
      const result = await repository.getOrders();

      // Then: 應該返回錯誤
      expect(result.success).toBe(false);
      expect(result.error).toBe('資料庫錯誤');
      expect(result.errorCode).toBe('DATABASE_ERROR');
    });
  });

  describe('updateOrderStatus', () => {
    it('應該成功更新訂單狀態', async () => {
      // Given: 模擬成功的 Supabase 回應
      const mockResponse = {
        data: {
          success: true,
          order_id: 'order-1',
          order_number: 'ORD-20250108-000001',
          status: 'confirmed',
          updated_at: '2025-01-08T11:00:00Z'
        },
        error: null
      };
      mockSupabaseRpc.mockResolvedValue(mockResponse);

      const request: UpdateOrderStatusRequest = {
        orderId: 'order-1',
        status: 'confirmed'
      };

      // When: 更新訂單狀態
      const result = await repository.updateOrderStatus(request);

      // Then: 應該成功更新
      expect(result.success).toBe(true);
      expect(result.orderId).toBe('order-1');
      expect(result.orderNumber).toBe('ORD-20250108-000001');
      expect(result.status).toBe('confirmed');
      expect(mockSupabaseRpc).toHaveBeenCalledWith('update_order_status', {
        p_order_id: 'order-1',
        p_status: 'confirmed'
      });
    });

    it('應該處理更新訂單狀態失敗', async () => {
      // Given: 模擬失敗的 Supabase 回應
      const mockResponse = {
        data: {
          success: false,
          error: '訂單不存在',
          error_code: 'ORDER_NOT_FOUND'
        },
        error: null
      };
      mockSupabaseRpc.mockResolvedValue(mockResponse);

      const request: UpdateOrderStatusRequest = {
        orderId: 'non-existent-order',
        status: 'confirmed'
      };

      // When: 更新訂單狀態
      const result = await repository.updateOrderStatus(request);

      // Then: 應該返回錯誤
      expect(result.success).toBe(false);
      expect(result.error).toBe('訂單不存在');
      expect(result.errorCode).toBe('ORDER_NOT_FOUND');
    });
  });
});
