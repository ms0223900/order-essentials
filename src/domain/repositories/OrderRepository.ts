/**
 * 訂單儲存庫介面
 * 定義訂單相關的資料存取操作
 */

import type { 
  Order, 
  CreateOrderRequest, 
  CreateOrderResponse,
  GetOrdersResponse,
  UpdateOrderStatusRequest,
  UpdateOrderStatusResponse
} from '../types/Order';

export interface OrderRepository {
  /**
   * 建立新訂單
   * @param request 建立訂單請求
   * @returns 建立訂單回應
   */
  createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse>;

  /**
   * 取得所有訂單
   * @returns 訂單列表回應
   */
  getOrders(): Promise<GetOrdersResponse>;

  /**
   * 更新訂單狀態
   * @param request 更新訂單狀態請求
   * @returns 更新訂單狀態回應
   */
  updateOrderStatus(request: UpdateOrderStatusRequest): Promise<UpdateOrderStatusResponse>;
}
