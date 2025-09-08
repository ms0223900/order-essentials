import { OrderRepository } from '@/domain/repositories/OrderRepository';
import { InventoryDeductionRequest, ProductRepository } from '@/domain/repositories/ProductRepository';
import { Order } from '@/domain/types/Order';
import { container } from '@/infrastructure/container';
import { createContext, ReactNode, useContext, useReducer } from 'react';

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  stock: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

// 使用新的 Order 類型
export type { Order } from '@/domain/types/Order';

// 為了向後相容，保留舊的介面定義
export interface LegacyOrder {
  id: string;
  items: CartItem[];
  total: number;
  customerInfo: {
    name: string;
    phone: string;
    address: string;
  };
  status: 'pending' | 'confirmed' | 'shipping' | 'delivered';
  createdAt: Date;
  paymentMethod: 'cod'; // 貨到付款
}

interface CartState {
  items: CartItem[];
  orders: LegacyOrder[];
}

type CartAction =
  | { type: 'ADD_TO_CART'; payload: { product: Product; quantity: number } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'REMOVE_FROM_CART'; payload: { productId: string } }
  | { type: 'CLEAR_CART' }
  | { type: 'CREATE_ORDER'; payload: LegacyOrder }
  | { type: 'UPDATE_ORDER_STATUS'; payload: { orderId: string; status: LegacyOrder['status'] } };

const initialState: CartState = {
  items: [],
  orders: []
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const existingItemIndex = state.items.findIndex(
        item => item.product.id === action.payload.product.id
      );

      if (existingItemIndex >= 0) {
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex].quantity += action.payload.quantity;
        return { ...state, items: updatedItems };
      } else {
        return {
          ...state,
          items: [...state.items, { product: action.payload.product, quantity: action.payload.quantity }]
        };
      }
    }

    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          item.product.id === action.payload.productId
            ? { ...item, quantity: action.payload.quantity }
            : item
        ).filter(item => item.quantity > 0)
      };

    case 'REMOVE_FROM_CART':
      return {
        ...state,
        items: state.items.filter(item => item.product.id !== action.payload.productId)
      };

    case 'CLEAR_CART':
      return { ...state, items: [] };

    case 'CREATE_ORDER':
      return {
        ...state,
        orders: [action.payload, ...state.orders],
        items: []
      };

    case 'UPDATE_ORDER_STATUS':
      return {
        ...state,
        orders: state.orders.map(order =>
          order.id === action.payload.orderId
            ? { ...order, status: action.payload.status }
            : order
        )
      };

    default:
      return state;
  }
}

interface CartContextType {
  state: CartState;
  addToCart: (product: Product, quantity: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  createOrder: (customerInfo: LegacyOrder['customerInfo']) => Promise<string>;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const addToCart = (product: Product, quantity: number) => {
    dispatch({ type: 'ADD_TO_CART', payload: { product, quantity } });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
  };

  const removeFromCart = (productId: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: { productId } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const createOrder = async (customerInfo: LegacyOrder['customerInfo']): Promise<string> => {
    const total = getTotalPrice();

    // 準備庫存扣除請求
    const inventoryRequests: InventoryDeductionRequest[] = state.items.map(item => ({
      productId: item.product.id,
      quantity: item.quantity
    }));

    // 獲取產品倉庫和訂單倉庫實例
    const productRepository = container.resolve<ProductRepository>('ProductRepository');
    const orderRepository = container.resolve<OrderRepository>('OrderRepository');

    try {
      // 先檢查庫存可用性
      const availabilityResult = await productRepository.checkInventoryAvailability(inventoryRequests);

      if (availabilityResult.error || !availabilityResult.data?.available) {
        const errorMessage = availabilityResult.data?.unavailableItems?.map(item =>
          `商品 ${item.productId}: ${item.error}`
        ).join(', ') || availabilityResult.error?.message || '庫存檢查失敗';

        throw new Error(`庫存不足: ${errorMessage}`);
      }

      // 扣除庫存
      const deductionResult = await productRepository.deductInventoryBatch(inventoryRequests);

      if (deductionResult.error || !deductionResult.data?.success) {
        const errorMessage = deductionResult.error?.message || deductionResult.data?.error || '庫存扣除失敗';
        throw new Error(`庫存扣除失敗: ${errorMessage}`);
      }

      // 庫存扣除成功，創建真實訂單
      const createOrderRequest = {
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        customerAddress: customerInfo.address,
        items: state.items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity
        }))
      };

      const orderResult = await orderRepository.createOrder(createOrderRequest);

      if (!orderResult.success) {
        throw new Error(orderResult.error || '建立訂單失敗');
      }

      // 建立本地訂單記錄（用於向後相容）
      const localOrder: LegacyOrder = {
        id: orderResult.orderId || `ORD-${Date.now()}`,
        items: [...state.items],
        total,
        customerInfo,
        status: 'pending',
        createdAt: new Date(),
        paymentMethod: 'cod'
      };

      dispatch({ type: 'CREATE_ORDER', payload: localOrder });

      // 清空購物車
      dispatch({ type: 'CLEAR_CART' });

      return orderResult.orderId || localOrder.id;
    } catch (error) {
      // 如果庫存扣除失敗，拋出錯誤
      throw error;
    }
  };

  const updateOrderStatus = (orderId: string, status: LegacyOrder['status']) => {
    dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { orderId, status } });
  };

  const getTotalPrice = () => {
    return state.items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  };

  const value: CartContextType = {
    state,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    createOrder,
    updateOrderStatus,
    getTotalPrice,
    getTotalItems
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
