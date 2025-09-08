/**
 * 訂單領域模型
 * 定義訂單的核心屬性和行為
 */

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productPrice: number;
  productImage?: string;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipping' | 'delivered';
  paymentMethod: 'cod';
  createdAt: Date;
  updatedAt: Date;
  items: OrderItem[];
}

export interface CreateOrderRequest {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: {
    productId: string;
    quantity: number;
  }[];
}

export interface CreateOrderResponse {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  totalAmount?: number;
  error?: string;
  errorCode?: string;
}

export interface GetOrdersResponse {
  success: boolean;
  orders?: Order[];
  error?: string;
  errorCode?: string;
}

export interface UpdateOrderStatusRequest {
  orderId: string;
  status: Order['status'];
}

export interface UpdateOrderStatusResponse {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  status?: Order['status'];
  updatedAt?: Date;
  error?: string;
  errorCode?: string;
}
