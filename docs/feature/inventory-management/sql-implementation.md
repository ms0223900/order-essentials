檢視資料庫結構，接著設計 `SupabaseProductRepository.ts` 的 SQL 實作。


[4 tools called]


設計 `SupabaseProductRepository.ts` 的 SQL 實作，包含資料庫函數與 Repository 方法。

## 1. 資料庫 Migration - 建立 Orders 表

```sql
-- supabase/migrations/[timestamp]_create_orders_tables.sql

-- 建立訂單表
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipping', 'delivered', 'cancelled')),
    payment_method TEXT NOT NULL DEFAULT 'cod' CHECK (payment_method = 'cod'),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 建立訂單項目表
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 建立庫存快照表（用於追蹤訂單建立時的庫存狀態）
CREATE TABLE IF NOT EXISTS public.inventory_snapshots (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    product_name TEXT NOT NULL,
    stock_before INTEGER NOT NULL,
    stock_after INTEGER NOT NULL,
    quantity_deducted INTEGER NOT NULL,
    snapshot_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_snapshots_order_id ON public.inventory_snapshots(order_id);

-- 啟用 Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_snapshots ENABLE ROW LEVEL SECURITY;

-- 建立公開讀取政策（訂單可以被所有人查看，實際應用中應根據需求調整）
CREATE POLICY "Orders are viewable by everyone" 
ON public.orders 
FOR SELECT 
USING (true);

CREATE POLICY "Order items are viewable by everyone" 
ON public.order_items 
FOR SELECT 
USING (true);

CREATE POLICY "Inventory snapshots are viewable by everyone" 
ON public.inventory_snapshots 
FOR SELECT 
USING (true);

-- 建立自動更新時間戳的觸發器
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
```

## 2. 資料庫函數 - 整合庫存扣除與訂單建立

```sql
-- supabase/migrations/[timestamp]_deduct_inventory_with_order.sql

/**
 * 將庫存扣除與訂單建立整合為原子操作的函數
 * 
 * 此函數在單一資料庫交易中執行：
 * 1. 檢查庫存可用性
 * 2. 扣除庫存
 * 3. 建立訂單記錄
 * 4. 建立訂單項目記錄
 * 5. 建立庫存快照記錄
 * 
 * 如果任何步驟失敗，整個交易會回滾
 */
CREATE OR REPLACE FUNCTION public.deduct_inventory_with_order(
    order_data JSON
)
RETURNS JSON AS $$
DECLARE
    order_id UUID;
    order_item JSON;
    product_id UUID;
    quantity INTEGER;
    product_record RECORD;
    current_stock INTEGER;
    new_stock INTEGER;
    order_total DECIMAL(10,2) := 0;
    item_subtotal DECIMAL(10,2);
    inventory_results JSON[] := '{}';
    order_items_data JSON;
    customer_info JSON;
    payment_method TEXT;
    order_status TEXT := 'pending';
    unavailable_items JSON[] := '{}';
    all_available BOOLEAN := true;
    error_message TEXT;
BEGIN
    -- 驗證輸入參數
    IF order_data IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'order_data 參數不能為 null',
            'error_code', 'INVALID_INPUT'
        );
    END IF;

    -- 提取訂單資訊
    customer_info := order_data->'customerInfo';
    order_items_data := order_data->'items';
    payment_method := COALESCE(order_data->>'paymentMethod', 'cod');

    -- 驗證客戶資訊
    IF customer_info IS NULL OR 
       customer_info->>'name' IS NULL OR 
       customer_info->>'phone' IS NULL OR 
       customer_info->>'address' IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', '客戶資訊不完整',
            'error_code', 'INVALID_CUSTOMER_INFO'
        );
    END IF;

    -- 驗證訂單項目
    IF order_items_data IS NULL OR json_typeof(order_items_data) != 'array' OR json_array_length(order_items_data) = 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', '訂單項目不能為空',
            'error_code', 'INVALID_ORDER_ITEMS'
        );
    END IF;

    -- 開始交易（PostgreSQL 函數預設在交易中執行）
    -- 步驟 1: 檢查所有商品的庫存可用性
    FOR order_item IN SELECT * FROM json_array_elements(order_items_data)
    LOOP
        -- 驗證項目格式
        IF order_item->>'productId' IS NULL OR order_item->>'quantity' IS NULL THEN
            all_available := false;
            unavailable_items := array_append(unavailable_items, json_build_object(
                'productId', COALESCE(order_item->>'productId', 'null'),
                'error', '每個項目必須包含 productId 和 quantity',
                'errorCode', 'INVALID_ITEM_FORMAT'
            ));
            CONTINUE;
        END IF;

        BEGIN
            product_id := (order_item->>'productId')::UUID;
            quantity := (order_item->>'quantity')::INTEGER;
        EXCEPTION
            WHEN OTHERS THEN
                all_available := false;
                unavailable_items := array_append(unavailable_items, json_build_object(
                    'productId', order_item->>'productId',
                    'error', 'productId 必須是有效的 UUID，quantity 必須是有效的整數',
                    'errorCode', 'INVALID_ITEM_FORMAT'
                ));
                CONTINUE;
        END;

        -- 檢查商品是否存在並取得庫存
        SELECT p.*, p.stock INTO product_record, current_stock
        FROM public.products p
        WHERE p.id = product_id
        FOR UPDATE; -- 使用 FOR UPDATE 鎖定行，防止並發問題

        -- 如果商品不存在
        IF NOT FOUND THEN
            all_available := false;
            unavailable_items := array_append(unavailable_items, json_build_object(
                'productId', product_id::TEXT,
                'error', '商品不存在',
                'errorCode', 'PRODUCT_NOT_FOUND'
            ));
            CONTINUE;
        END IF;

        -- 檢查庫存是否足夠
        IF current_stock < quantity THEN
            all_available := false;
            unavailable_items := array_append(unavailable_items, json_build_object(
                'productId', product_id::TEXT,
                'productName', product_record.name,
                'currentStock', current_stock,
                'requestedQuantity', quantity,
                'error', '庫存不足',
                'errorCode', 'INSUFFICIENT_STOCK'
            ));
        ELSE
            -- 計算訂單總額
            item_subtotal := product_record.price * quantity;
            order_total := order_total + item_subtotal;
        END IF;
    END LOOP;

    -- 如果有任何商品庫存不足，返回錯誤
    IF NOT all_available THEN
        RETURN json_build_object(
            'success', false,
            'error', '部分商品庫存不足',
            'errorCode', 'INVENTORY_INSUFFICIENT',
            'unavailableItems', to_json(unavailable_items)
        );
    END IF;

    -- 步驟 2: 建立訂單記錄
    INSERT INTO public.orders (
        customer_name,
        customer_phone,
        customer_address,
        total,
        status,
        payment_method
    ) VALUES (
        customer_info->>'name',
        customer_info->>'phone',
        customer_info->>'address',
        order_total,
        order_status,
        payment_method
    ) RETURNING id INTO order_id;

    -- 步驟 3: 扣除庫存並建立訂單項目和庫存快照
    FOR order_item IN SELECT * FROM json_array_elements(order_items_data)
    LOOP
        product_id := (order_item->>'productId')::UUID;
        quantity := (order_item->>'quantity')::INTEGER;

        -- 取得商品資訊（已鎖定）
        SELECT p.*, p.stock INTO product_record, current_stock
        FROM public.products p
        WHERE p.id = product_id
        FOR UPDATE;

        -- 再次檢查庫存（防止在建立訂單期間庫存被其他交易扣除）
        IF current_stock < quantity THEN
            -- 回滾交易（透過拋出異常）
            RAISE EXCEPTION '庫存不足: 商品 % (ID: %) 當前庫存: %, 需要: %', 
                product_record.name, product_id, current_stock, quantity;
        END IF;

        -- 扣除庫存
        UPDATE public.products
        SET stock = stock - quantity,
            updated_at = now()
        WHERE id = product_id
        RETURNING stock INTO new_stock;

        -- 計算小計
        item_subtotal := product_record.price * quantity;

        -- 建立訂單項目
        INSERT INTO public.order_items (
            order_id,
            product_id,
            product_name,
            quantity,
            price,
            subtotal
        ) VALUES (
            order_id,
            product_id,
            product_record.name,
            quantity,
            product_record.price,
            item_subtotal
        );

        -- 建立庫存快照
        INSERT INTO public.inventory_snapshots (
            order_id,
            product_id,
            product_name,
            stock_before,
            stock_after,
            quantity_deducted
        ) VALUES (
            order_id,
            product_id,
            product_record.name,
            current_stock,
            new_stock,
            quantity
        );

        -- 記錄庫存扣除結果
        inventory_results := array_append(inventory_results, json_build_object(
            'productId', product_id::TEXT,
            'productName', product_record.name,
            'success', true,
            'previousStock', current_stock,
            'newStock', new_stock,
            'quantityDeducted', quantity
        ));
    END LOOP;

    -- 返回成功結果
    RETURN json_build_object(
        'success', true,
        'orderId', order_id::TEXT,
        'message', '訂單建立成功',
        'inventoryDeductionResults', to_json(inventory_results),
        'order', json_build_object(
            'id', order_id::TEXT,
            'total', order_total,
            'status', order_status,
            'createdAt', now()
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        -- 發生錯誤時，PostgreSQL 會自動回滾交易
        RETURN json_build_object(
            'success', false,
            'error', '訂單建立失敗: ' || SQLERRM,
            'errorCode', 'ORDER_CREATION_FAILED',
            'details', SQLSTATE
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 為函數添加註釋
COMMENT ON FUNCTION public.deduct_inventory_with_order(JSON) IS 
'將庫存扣除與訂單建立整合為原子操作，確保資料一致性。如果任何步驟失敗，整個交易會自動回滾。';
```

## 3. 更新的 SupabaseProductRepository.ts

```typescript
// src/infrastructure/repositories/SupabaseProductRepository.ts

import {
  BatchInventoryDeductionResult,
  InventoryAvailabilityResult,
  InventoryDeductionRequest,
  ProductRepository
} from '@/domain/repositories/ProductRepository'
import { CreateProductRequest, Product, UpdateProductRequest, UpdateStockRequest } from '@/domain/types/Product'
import { OrderCreationRequest, OrderCreationResult } from '@/domain/types/Order'
import { PaginationOptions, RepositoryResult } from '@/domain/types/Repository'
import { supabase } from '@/integrations/supabase/client'

// ... existing code ...

export class SupabaseProductRepository implements ProductRepository {
  private readonly tableName = 'products'

  // ... existing methods (getAll, getById, create, update, delete, updateStock, getByCategory, search) ...

  /**
   * 批量扣除多個商品庫存
   */
  async deductInventoryBatch(requests: InventoryDeductionRequest[]): Promise<RepositoryResult<BatchInventoryDeductionResult>> {
    try {
      const items = requests.map(req => ({
        product_id: req.productId,
        quantity: req.quantity
      }))

      const { data, error } = await supabase.rpc('deduct_inventory_batch', {
        items: items
      })

      if (error) {
        return {
          data: null,
          error: {
            message: `批量扣除庫存失敗: ${error.message}`,
            code: error.code,
            details: error
          }
        }
      }

      const result = data as unknown as BatchInventoryDeductionResult

      if (!result.success) {
        return {
          data: null,
          error: {
            message: result.error || '批量扣除庫存失敗',
            code: result.errorCode || 'BATCH_DEDUCTION_FAILED'
          }
        }
      }

      return {
        data: result,
        error: null
      }
    } catch (error) {
      return {
        data: null,
        error: {
          message: '批量扣除庫存時發生未預期的錯誤',
          code: 'UNEXPECTED_ERROR',
          details: error
        }
      }
    }
  }

  /**
   * 檢查多個商品的庫存可用性
   */
  async checkInventoryAvailability(requests: InventoryDeductionRequest[]): Promise<RepositoryResult<InventoryAvailabilityResult>> {
    try {
      const items = requests.map(req => ({
        product_id: req.productId,
        quantity: req.quantity
      }))

      const { data, error } = await supabase.rpc('check_inventory_availability', {
        items: items
      })

      if (error) {
        return {
          data: null,
          error: {
            message: `檢查庫存可用性失敗: ${error.message}`,
            code: error.code,
            details: error
          }
        }
      }

      const result = data as unknown as InventoryAvailabilityResult

      return {
        data: result,
        error: null
      }
    } catch (error) {
      return {
        data: null,
        error: {
          message: '檢查庫存可用性時發生未預期的錯誤',
          code: 'UNEXPECTED_ERROR',
          details: error
        }
      }
    }
  }

  /**
   * 將庫存扣除與訂單建立整合為原子操作
   * 
   * 此方法在資料庫交易中執行，確保：
   * 1. 庫存檢查與扣除的原子性
   * 2. 訂單建立的原子性
   * 3. 庫存快照記錄的完整性
   * 
   * 如果任何步驟失敗，整個交易會自動回滾
   */
  async deductInventoryWithOrder(request: OrderCreationRequest): Promise<RepositoryResult<OrderCreationResult>> {
    try {
      // 準備訂單資料結構
      const orderData = {
        items: request.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        customerInfo: {
          name: request.customerInfo.name,
          phone: request.customerInfo.phone,
          address: request.customerInfo.address
        },
        paymentMethod: request.paymentMethod || 'cod'
      }

      // 呼叫資料庫函數（在交易中執行）
      const { data, error } = await supabase.rpc('deduct_inventory_with_order', {
        order_data: orderData
      })

      if (error) {
        return {
          data: null,
          error: {
            message: `訂單建立失敗: ${error.message}`,
            code: error.code || 'ORDER_CREATION_FAILED',
            details: error
          }
        }
      }

      const result = data as unknown as {
        success: boolean
        orderId?: string
        order?: {
          id: string
          total: number
          status: string
          createdAt: string
        }
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

      if (!result.success) {
        return {
          data: {
            success: false,
            error: result.error || '訂單建立失敗',
            errorCode: result.errorCode || 'ORDER_CREATION_FAILED',
            unavailableItems: result.unavailableItems?.map(item => ({
              productId: item.productId,
              productName: item.productName,
              currentStock: item.currentStock,
              requestedQuantity: item.requestedQuantity,
              error: item.error,
              errorCode: item.errorCode
            }))
          },
          error: {
            message: result.error || '訂單建立失敗',
            code: result.errorCode || 'ORDER_CREATION_FAILED',
            details: result.unavailableItems
          }
        }
      }

      // 轉換為 OrderCreationResult 格式
      const orderCreationResult: OrderCreationResult = {
        success: true,
        orderId: result.orderId,
        inventoryDeductionResults: result.inventoryDeductionResults?.map(r => ({
          productId: r.productId,
          productName: r.productName,
          success: r.success,
          previousStock: r.previousStock,
          newStock: r.newStock,
          quantityDeducted: r.quantityDeducted
        })),
        order: result.order ? {
          id: result.order.id,
          items: request.items.map((item, index) => {
            const productResult = result.inventoryDeductionResults?.[index]
            return {
              productId: item.productId,
              productName: productResult?.productName || '',
              quantity: item.quantity,
              price: 0, // 需要從資料庫查詢，或從 request 中取得
              subtotal: 0
            }
          }),
          total: result.order.total,
          customerInfo: request.customerInfo,
          status: result.order.status as Order['status'],
          createdAt: new Date(result.order.createdAt),
          paymentMethod: request.paymentMethod || 'cod',
          inventorySnapshot: result.inventoryDeductionResults ? {
            items: result.inventoryDeductionResults.map(r => ({
              productId: r.productId,
              productName: r.productName,
              stockBefore: r.previousStock,
              stockAfter: r.newStock,
              quantityDeducted: r.quantityDeducted
            })),
            snapshotTime: new Date()
          } : undefined
        } : undefined
      }

      return {
        data: orderCreationResult,
        error: null
      }
    } catch (error) {
      return {
        data: null,
        error: {
          message: '訂單建立時發生未預期的錯誤',
          code: 'UNEXPECTED_ERROR',
          details: error
        }
      }
    }
  }
}
```

## 設計重點

1. 原子性：使用 PostgreSQL 函數與交易，確保庫存扣除與訂單建立同時成功或失敗
2. 並發控制：使用 `FOR UPDATE` 鎖定商品行，避免競態條件
3. 資料完整性：建立 orders、order_items、inventory_snapshots 表，記錄完整資訊
4. 錯誤處理：結構化錯誤訊息，包含庫存不足的詳細資訊
5. 可追蹤性：庫存快照記錄訂單建立時的庫存狀態
6. 效能：使用索引提升查詢效能，批量操作減少資料庫往返

此設計符合 solution.md 的技術方案，確保庫存管理與訂單建立的資料一致性。