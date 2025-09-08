/**
 * Supabase 訂單儲存庫實作
 * 使用 Supabase 作為訂單資料的後端儲存
 */

import type { OrderRepository } from '@/domain/repositories/OrderRepository';
import type {
  CreateOrderRequest,
  CreateOrderResponse,
  GetOrdersResponse,
  Order,
  UpdateOrderStatusRequest,
  UpdateOrderStatusResponse
} from '@/domain/types/Order';
import { supabase } from '@/integrations/supabase/client';

export class SupabaseOrderRepository implements OrderRepository {
  /**
   * 建立新訂單
   */
  async createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    try {
      // 準備訂單項目資料
      const itemsData = request.items.map(item => ({
        product_id: item.productId,
        quantity: item.quantity
      }));

      // 呼叫 Supabase 函數建立訂單
      const { data, error } = await supabase.rpc('create_order_with_items', {
        p_customer_name: request.customerName,
        p_customer_phone: request.customerPhone,
        p_customer_address: request.customerAddress,
        p_items: itemsData
      });

      if (error) {
        console.error('建立訂單錯誤:', error);
        return {
          success: false,
          error: error.message,
          errorCode: 'SUPABASE_ERROR'
        };
      }

      if (!data || !data.success) {
        return {
          success: false,
          error: data?.error || '建立訂單失敗',
          errorCode: data?.error_code || 'UNKNOWN_ERROR'
        };
      }

      return {
        success: true,
        orderId: data.order_id,
        orderNumber: data.order_number,
        totalAmount: data.total_amount
      };
    } catch (error) {
      console.error('建立訂單異常:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '建立訂單時發生未知錯誤',
        errorCode: 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * 取得所有訂單
   */
  async getOrders(): Promise<GetOrdersResponse> {
    try {
      // 呼叫 Supabase 函數取得訂單列表
      const { data, error } = await supabase.rpc('get_orders_with_items');

      if (error) {
        console.error('取得訂單錯誤:', error);
        return {
          success: false,
          error: error.message,
          errorCode: 'SUPABASE_ERROR'
        };
      }

      if (!data || !data.success) {
        return {
          success: false,
          error: data?.error || '取得訂單失敗',
          errorCode: data?.error_code || 'UNKNOWN_ERROR'
        };
      }

      // 轉換資料格式
      const orders: Order[] = data.orders.map((orderData: any) => ({
        id: orderData.id,
        orderNumber: orderData.order_number,
        customerName: orderData.customer_name,
        customerPhone: orderData.customer_phone,
        customerAddress: orderData.customer_address,
        totalAmount: parseFloat(orderData.total_amount),
        status: orderData.status,
        paymentMethod: orderData.payment_method,
        createdAt: new Date(orderData.created_at),
        updatedAt: new Date(orderData.updated_at),
        items: orderData.items.map((item: any) => ({
          id: item.id,
          productId: item.product_id,
          productName: item.product_name,
          productPrice: parseFloat(item.product_price),
          productImage: item.product_image,
          quantity: item.quantity,
          subtotal: parseFloat(item.subtotal)
        }))
      }));

      return {
        success: true,
        orders
      };
    } catch (error) {
      console.error('取得訂單異常:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '取得訂單時發生未知錯誤',
        errorCode: 'UNKNOWN_ERROR'
      };
    }
  }

  /**
   * 更新訂單狀態
   */
  async updateOrderStatus(request: UpdateOrderStatusRequest): Promise<UpdateOrderStatusResponse> {
    try {
      // 呼叫 Supabase 函數更新訂單狀態
      const { data, error } = await supabase.rpc('update_order_status', {
        p_order_id: request.orderId,
        p_status: request.status
      });

      if (error) {
        console.error('更新訂單狀態錯誤:', error);
        return {
          success: false,
          error: error.message,
          errorCode: 'SUPABASE_ERROR'
        };
      }

      if (!data || !data.success) {
        return {
          success: false,
          error: data?.error || '更新訂單狀態失敗',
          errorCode: data?.error_code || 'UNKNOWN_ERROR'
        };
      }

      return {
        success: true,
        orderId: data.order_id,
        orderNumber: data.order_number,
        status: data.status,
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('更新訂單狀態異常:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新訂單狀態時發生未知錯誤',
        errorCode: 'UNKNOWN_ERROR'
      };
    }
  }
}
