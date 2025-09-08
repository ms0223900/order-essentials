/**
 * 訂單管理 Hook
 * 提供訂單的 CRUD 操作
 */

import { useState, useEffect } from 'react';
import { container } from '@/infrastructure/container';
import { OrderRepository } from '@/domain/repositories/OrderRepository';
import type { Order, UpdateOrderStatusRequest } from '@/domain/types/Order';

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderRepository = container.resolve<OrderRepository>('OrderRepository');

  /**
   * 載入所有訂單
   */
  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await orderRepository.getOrders();
      
      if (result.success && result.orders) {
        setOrders(result.orders);
      } else {
        setError(result.error || '載入訂單失敗');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入訂單時發生未知錯誤');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 更新訂單狀態
   */
  const updateOrderStatus = async (request: UpdateOrderStatusRequest) => {
    try {
      const result = await orderRepository.updateOrderStatus(request);
      
      if (result.success) {
        // 更新本地狀態
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === request.orderId 
              ? { ...order, status: request.status, updatedAt: result.updatedAt || order.updatedAt }
              : order
          )
        );
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : '更新訂單狀態時發生未知錯誤' 
      };
    }
  };

  // 初始化載入訂單
  useEffect(() => {
    loadOrders();
  }, []);

  return {
    orders,
    loading,
    error,
    loadOrders,
    updateOrderStatus
  };
}
