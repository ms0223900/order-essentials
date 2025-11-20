# 任務：擴展 OrderRepository 介面

## 任務描述
在 `OrderRepository` 介面中新增整合訂單建立與庫存扣減的方法，保持向後相容性。

## 輸入格式
- **現有介面**: `src/domain/repositories/OrderRepository.ts`
- **新方法名稱**: `createOrderWithInventoryDeduction`
- **參數**: 與現有 `createOrder` 方法相同，但返回更詳細的結果

## 輸出格式
- **更新的介面定義**:
```typescript
interface OrderRepository {
  // 現有方法保持不變
  createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse>;

  // 新增方法
  createOrderWithInventoryDeduction(
    request: CreateOrderRequest
  ): Promise<CreateOrderWithInventoryResponse>;
}
```

## 詳細設計
1. **新回應介面**:
   ```typescript
   export interface InventoryDeductionResult {
     productId: string;
     productName: string;
     previousStock: number;
     newStock: number;
     quantityDeducted: number;
   }

   export interface CreateOrderWithInventoryResponse {
     success: boolean;
     orderId?: string;
     orderNumber?: string;
     totalAmount?: number;
     inventoryResults?: InventoryDeductionResult[];
     error?: string;
     errorCode?: string;
   }
   ```

2. **介面擴展**:
   - 保持現有 `createOrder` 方法不變
   - 新增 `createOrderWithInventoryDeduction` 方法
   - 新方法的參數與 `createOrder` 相同

## 驗收條件
- [ ] OrderRepository 介面成功擴展
- [ ] 新增必要的新回應類型定義
- [ ] 保持現有方法的向後相容性
- [ ] TypeScript 編譯通過
- [ ] 介面文件正確更新

## 依賴關係
- **前置依賴**:
  - 02-test-database-function（確認資料庫函數可用）
  - 04-update-order-types（需要更新的類型定義）
- **後續依賴**: 05-implement-repository-method（實作此介面）
