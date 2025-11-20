# 任務：更新 Order 領域類型定義

## 任務描述
在 `src/domain/types/Order.ts` 中新增支援整合訂單建立與庫存扣減的類型定義。

## 輸入格式
- **現有檔案**: `src/domain/types/Order.ts`
- **需要新增的類型**:
  - `InventoryDeductionResult`
  - `CreateOrderWithInventoryResponse`

## 輸出格式
- **更新的 Order.ts 檔案**，包含新的介面定義
- **TypeScript 編譯通過**，無類型錯誤

## 詳細設計
1. **InventoryDeductionResult 介面**:
   ```typescript
   export interface InventoryDeductionResult {
     productId: string;
     productName: string;
     previousStock: number;
     newStock: number;
     quantityDeducted: number;
   }
   ```

2. **CreateOrderWithInventoryResponse 介面**:
   ```typescript
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

3. **更新現有介面**（如果需要）:
   - 確認 `CreateOrderRequest` 包含所有必要欄位
   - 確保類型定義的一致性

## 驗收條件
- [ ] 新增的介面定義正確
- [ ] TypeScript 編譯通過
- [ ] 類型定義符合資料庫函數的輸出格式
- [ ] 與現有類型定義保持一致
- [ ] 介面文件正確更新

## 依賴關係
- **前置依賴**: 02-test-database-function（確認資料庫函數的輸出格式）
- **後續依賴**:
  - 03-extend-repository-interface（需要這些類型定義）
  - 05-implement-repository-method（使用這些類型）
