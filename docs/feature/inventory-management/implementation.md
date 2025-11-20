檢視現有程式碼結構，接著依 solution.md 的技術方案重新設計實作。


[5 tools called]


依 solution.md 的技術方案，重新設計實作。提供更新後的程式碼片段：


[1 tool called]


依 solution.md 的技術方案，提供重新設計的程式碼片段：

## 1. 錯誤代碼常數定義

```typescript
// src/domain/errors/InventoryErrorCodes.ts

/**
 * 庫存管理錯誤代碼
 */
export enum InventoryErrorCode {
  INVENTORY_INSUFFICIENT = 'INVENTORY_INSUFFICIENT',
  INVENTORY_CHECK_FAILED = 'INVENTORY_CHECK_FAILED',
  INVENTORY_DEDUCTION_FAILED = 'INVENTORY_DEDUCTION_FAILED',
  ORDER_CREATION_FAILED = 'ORDER_CREATION_FAILED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  INVALID_REQUEST = 'INVALID_REQUEST',
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND'
}

/**
 * 錯誤訊息對應
 */
export const InventoryErrorMessages: Record<InventoryErrorCode, string> = {
  [InventoryErrorCode.INVENTORY_INSUFFICIENT]: '庫存不足',
  [InventoryErrorCode.INVENTORY_CHECK_FAILED]: '庫存檢查失敗',
  [InventoryErrorCode.INVENTORY_DEDUCTION_FAILED]: '庫存扣除失敗',
  [InventoryErrorCode.ORDER_CREATION_FAILED]: '訂單建立失敗',
  [InventoryErrorCode.TRANSACTION_FAILED]: '交易失敗',
  [InventoryErrorCode.INVALID_REQUEST]: '無效的請求',
  [InventoryErrorCode.PRODUCT_NOT_FOUND]: '商品不存在'
}
```

## 2. 訂單領域模型

```typescript
// src/domain/types/Order.ts

/**
 * 訂單領域模型
 */
export interface Order {
  id: string
  items: OrderItem[]
  total: number
  customerInfo: CustomerInfo
  status: OrderStatus
  createdAt: Date
  updatedAt?: Date
  paymentMethod: PaymentMethod
  inventorySnapshot?: InventorySnapshot // 庫存快照，用於追蹤訂單建立時的庫存狀態
}

export interface OrderItem {
  productId: string
  productName: string
  quantity: number
  price: number
  subtotal: number
}

export interface CustomerInfo {
  name: string
  phone: string
  address: string
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled'

export type PaymentMethod = 'cod' // 貨到付款，未來可擴展

/**
 * 庫存快照 - 記錄訂單建立時的庫存狀態
 */
export interface InventorySnapshot {
  items: Array<{
    productId: string
    productName: string
    stockBefore: number
    stockAfter: number
    quantityDeducted: number
  }>
  snapshotTime: Date
}

/**
 * 訂單建立請求（整合庫存扣除）
 */
export interface OrderCreationRequest {
  items: Array<{
    productId: string
    quantity: number
  }>
  customerInfo: CustomerInfo
  paymentMethod: PaymentMethod
}

/**
 * 訂單建立結果
 */
export interface OrderCreationResult {
  success: boolean
  orderId?: string
  order?: Order
  inventoryDeductionResults?: Array<{
    productId: string
    productName: string
    success: boolean
    previousStock: number
    newStock: number
    quantityDeducted: number
  }>
  error?: string
  errorCode?: string
  unavailableItems?: Array<{
    productId: string
    productName?: string
    currentStock?: number
    requestedQuantity?: number
    error: string
    errorCode: string
  }>
}
```

## 3. 擴充的 ProductRepository 介面

```typescript
// src/domain/repositories/ProductRepository.ts

import { CreateProductRequest, Product, UpdateProductRequest, UpdateStockRequest } from '@/domain/types/Product'
import { PaginationOptions, RepositoryResult } from '@/domain/types/Repository'
import { OrderCreationRequest, OrderCreationResult } from '@/domain/types/Order'

export interface InventoryDeductionRequest {
  productId: string
  quantity: number
}

export interface InventoryDeductionResult {
  success: boolean
  productId?: string
  productName?: string
  previousStock?: number
  newStock?: number
  quantityDeducted?: number
  error?: string
  errorCode?: string
}

export interface BatchInventoryDeductionResult {
  success: boolean
  message?: string
  results?: InventoryDeductionResult[]
  error?: string
  errorCode?: string
}

export interface InventoryAvailabilityResult {
  available: boolean
  message?: string
  unavailableItems?: Array<{
    productId: string
    productName?: string
    currentStock?: number
    requestedQuantity?: number
    error: string
    errorCode: string
  }>
  error?: string
  errorCode?: string
}

export interface ProductRepository {
  getAll(options?: PaginationOptions): Promise<RepositoryResult<Product[]>>
  getById(id: string): Promise<RepositoryResult<Product>>
  create(product: CreateProductRequest): Promise<RepositoryResult<Product>>
  update(product: UpdateProductRequest): Promise<RepositoryResult<Product>>
  delete(id: string): Promise<RepositoryResult<void>>
  updateStock(request: UpdateStockRequest): Promise<RepositoryResult<Product>>
  getByCategory(category: string, options?: PaginationOptions): Promise<RepositoryResult<Product[]>>
  search(query: string, options?: PaginationOptions): Promise<RepositoryResult<Product[]>>

  // 庫存管理相關方法
  deductInventoryBatch(requests: InventoryDeductionRequest[]): Promise<RepositoryResult<BatchInventoryDeductionResult>>
  checkInventoryAvailability(requests: InventoryDeductionRequest[]): Promise<RepositoryResult<InventoryAvailabilityResult>>
  
  /**
   * 將庫存扣除與訂單建立整合為原子操作
   * 此方法應在資料庫交易中執行，確保庫存扣除和訂單建立的原子性
   */
  deductInventoryWithOrder(request: OrderCreationRequest): Promise<RepositoryResult<OrderCreationResult>>
}
```

## 4. InventoryService 服務

```typescript
// src/domain/services/InventoryService.ts

import { ProductRepository, InventoryDeductionRequest, InventoryAvailabilityResult, BatchInventoryDeductionResult } from '@/domain/repositories/ProductRepository'
import { OrderCreationRequest, OrderCreationResult } from '@/domain/types/Order'
import { InventoryErrorCode, InventoryErrorMessages } from '@/domain/errors/InventoryErrorCodes'
import { RepositoryResult } from '@/domain/types/Repository'

/**
 * 庫存管理服務
 * 
 * 職責：
 * - 協調庫存檢查、扣除與訂單建立的流程
 * - 提供統一的庫存管理業務邏輯
 * - 處理錯誤與回滾機制
 */
export class InventoryService {
  constructor(private productRepository: ProductRepository) {}

  /**
   * 驗證並扣除庫存
   * 
   * 流程：
   * 1. 檢查庫存可用性
   * 2. 如果可用，執行批量扣除
   * 3. 返回詳細結果
   */
  async validateAndDeductInventory(
    requests: InventoryDeductionRequest[]
  ): Promise<RepositoryResult<BatchInventoryDeductionResult>> {
    // 步驟 1: 檢查庫存可用性
    const availabilityResult = await this.productRepository.checkInventoryAvailability(requests)

    if (availabilityResult.error) {
      return {
        data: null,
        error: {
          message: availabilityResult.error.message || InventoryErrorMessages[InventoryErrorCode.INVENTORY_CHECK_FAILED],
          code: availabilityResult.error.code || InventoryErrorCode.INVENTORY_CHECK_FAILED,
          details: availabilityResult.error.details
        }
      }
    }

    if (!availabilityResult.data?.available) {
      return {
        data: {
          success: false,
          error: InventoryErrorMessages[InventoryErrorCode.INVENTORY_INSUFFICIENT],
          errorCode: InventoryErrorCode.INVENTORY_INSUFFICIENT,
          results: availabilityResult.data.unavailableItems?.map(item => ({
            success: false,
            productId: item.productId,
            productName: item.productName,
            error: item.error,
            errorCode: item.errorCode
          }))
        },
        error: {
          message: InventoryErrorMessages[InventoryErrorCode.INVENTORY_INSUFFICIENT],
          code: InventoryErrorCode.INVENTORY_INSUFFICIENT,
          details: availabilityResult.data.unavailableItems
        }
      }
    }

    // 步驟 2: 庫存充足，執行扣除
    return await this.productRepository.deductInventoryBatch(requests)
  }

  /**
   * 訂單前庫存檢查
   * 
   * 在建立訂單前檢查所有商品的庫存是否充足
   */
  async checkInventoryBeforeOrder(
    items: Array<{ productId: string; quantity: number }>
  ): Promise<RepositoryResult<InventoryAvailabilityResult>> {
    const requests: InventoryDeductionRequest[] = items.map(item => ({
      productId: item.productId,
      quantity: item.quantity
    }))

    return await this.productRepository.checkInventoryAvailability(requests)
  }

  /**
   * 處理訂單與庫存扣除
   * 
   * 整合流程：
   * 1. 驗證購物車不為空
   * 2. 驗證客戶資訊完整
   * 3. 檢查庫存可用性
   * 4. 在交易中扣除庫存並建立訂單
   * 
   * 注意：此方法應由 Repository 層在資料庫交易中執行
   */
  async processOrderWithInventory(
    orderRequest: OrderCreationRequest
  ): Promise<RepositoryResult<OrderCreationResult>> {
    // 步驟 1: 驗證購物車不為空
    if (!orderRequest.items || orderRequest.items.length === 0) {
      return {
        data: null,
        error: {
          message: '購物車為空，無法建立訂單',
          code: InventoryErrorCode.INVALID_REQUEST
        }
      }
    }

    // 步驟 2: 驗證客戶資訊完整
    if (!orderRequest.customerInfo.name || 
        !orderRequest.customerInfo.phone || 
        !orderRequest.customerInfo.address) {
      return {
        data: null,
        error: {
          message: '客戶資訊不完整',
          code: InventoryErrorCode.INVALID_REQUEST
        }
      }
    }

    // 步驟 3: 檢查庫存可用性（在交易外先檢查，提供更好的錯誤訊息）
    const availabilityCheck = await this.checkInventoryBeforeOrder(orderRequest.items)
    
    if (availabilityCheck.error || !availabilityCheck.data?.available) {
      return {
        data: {
          success: false,
          error: availabilityCheck.error?.message || InventoryErrorMessages[InventoryErrorCode.INVENTORY_INSUFFICIENT],
          errorCode: InventoryErrorCode.INVENTORY_INSUFFICIENT,
          unavailableItems: availabilityCheck.data?.unavailableItems
        },
        error: availabilityCheck.error || {
          message: InventoryErrorMessages[InventoryErrorCode.INVENTORY_INSUFFICIENT],
          code: InventoryErrorCode.INVENTORY_INSUFFICIENT
        }
      }
    }

    // 步驟 4: 在交易中執行庫存扣除與訂單建立
    // 注意：實際的原子操作應在 Repository 層的 deductInventoryWithOrder 中實作
    return await this.productRepository.deductInventoryWithOrder(orderRequest)
  }
}
```

## 5. 更新的 CartContext

```typescript
// src/contexts/CartContext.tsx

import { InventoryService } from '@/domain/services/InventoryService'
import { ProductRepository } from '@/domain/repositories/ProductRepository'
import { Order, OrderCreationRequest, OrderCreationResult } from '@/domain/types/Order'
import { container } from '@/infrastructure/container'
import { createContext, ReactNode, useContext, useReducer, useMemo } from 'react'
import { InventoryErrorCode } from '@/domain/errors/InventoryErrorCodes'

// ... existing Product and CartItem interfaces ...

interface CartState {
  items: CartItem[]
  orders: Order[]
}

type CartAction =
  | { type: 'ADD_TO_CART'; payload: { product: Product; quantity: number } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'REMOVE_FROM_CART'; payload: { productId: string } }
  | { type: 'CLEAR_CART' }
  | { type: 'CREATE_ORDER'; payload: Order }
  | { type: 'UPDATE_ORDER_STATUS'; payload: { orderId: string; status: Order['status'] } }

// ... existing reducer and initialState ...

interface CartContextType {
  state: CartState
  addToCart: (product: Product, quantity: number) => void
  updateQuantity: (productId: string, quantity: number) => void
  removeFromCart: (productId: string) => void
  clearCart: () => void
  createOrder: (customerInfo: Order['customerInfo']) => Promise<string>
  updateOrderStatus: (orderId: string, status: Order['status']) => void
  getTotalPrice: () => number
  getTotalItems: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)

  // 使用 useMemo 確保服務實例的穩定性
  const inventoryService = useMemo(() => {
    const productRepository = container.resolve<ProductRepository>('ProductRepository')
    return new InventoryService(productRepository)
  }, [])

  // ... existing methods (addToCart, updateQuantity, etc.) ...

  const createOrder = async (customerInfo: Order['customerInfo']): Promise<string> => {
    // 步驟 1: 驗證購物車不為空
    if (state.items.length === 0) {
      throw new Error('購物車為空，無法建立訂單')
    }

    // 步驟 2: 準備訂單建立請求
    const orderRequest: OrderCreationRequest = {
      items: state.items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      })),
      customerInfo,
      paymentMethod: 'cod'
    }

    try {
      // 步驟 3: 使用 InventoryService 處理訂單與庫存扣除
      const result = await inventoryService.processOrderWithInventory(orderRequest)

      if (result.error || !result.data?.success) {
        // 處理庫存不足的情況
        if (result.data?.unavailableItems && result.data.unavailableItems.length > 0) {
          const errorMessages = result.data.unavailableItems.map(item => {
            const productName = item.productName || item.productId
            const stockInfo = item.currentStock !== undefined 
              ? `（當前庫存: ${item.currentStock}，需要: ${item.requestedQuantity}）`
              : ''
            return `${productName}${stockInfo}: ${item.error}`
          }).join('\n')
          
          throw new Error(`庫存不足：\n${errorMessages}`)
        }

        throw new Error(
          result.error?.message || 
          result.data?.error || 
          '訂單建立失敗'
        )
      }

      // 步驟 4: 訂單建立成功，建立本地訂單記錄
      const orderId = result.data.orderId || `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const total = getTotalPrice()

      const order: Order = result.data.order || {
        id: orderId,
        items: state.items.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
          subtotal: item.product.price * item.quantity
        })),
        total,
        customerInfo,
        status: 'pending',
        createdAt: new Date(),
        paymentMethod: 'cod',
        inventorySnapshot: result.data.inventoryDeductionResults ? {
          items: result.data.inventoryDeductionResults.map(r => ({
            productId: r.productId,
            productName: r.productName,
            stockBefore: r.previousStock,
            stockAfter: r.newStock,
            quantityDeducted: r.quantityDeducted
          })),
          snapshotTime: new Date()
        } : undefined
      }

      dispatch({ type: 'CREATE_ORDER', payload: order })
      return orderId
    } catch (error) {
      // 錯誤處理：確保使用者收到清晰的錯誤訊息
      if (error instanceof Error) {
        throw error
      }
      throw new Error('訂單建立時發生未預期的錯誤')
    }
  }

  // ... rest of the methods ...

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
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
```

## 6. 更新依賴注入容器

```typescript
// src/infrastructure/container.ts

import { ProductRepository } from '@/domain/repositories/ProductRepository'
import { SupabaseProductRepository } from '@/infrastructure/repositories/SupabaseProductRepository'
import { InventoryService } from '@/domain/services/InventoryService'

// ... existing DIContainer class ...

// 註冊服務
container.register<ProductRepository>('ProductRepository', () => {
  return new SupabaseProductRepository()
})

// 註冊 InventoryService（如果需要單例模式）
container.register<InventoryService>('InventoryService', () => {
  const productRepository = container.resolve<ProductRepository>('ProductRepository')
  return new InventoryService(productRepository)
})

// 導出容器和類型
export { DIContainer }
export type { ProductRepository }
```

## 設計重點

1. 分層架構：Domain、Application、Infrastructure 分離
2. 原子性：`deductInventoryWithOrder` 在交易中執行
3. 錯誤處理：結構化錯誤代碼與訊息
4. 可擴展性：介面導向，易於替換實作
5. 業務規則：庫存檢查與扣除流程明確
6. 領域模型：Order 包含庫存快照，支援追蹤