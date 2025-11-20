# 重構：實作 InventoryService 並重構 CartContext

## 重構目標

將庫存管理業務邏輯從 `CartContext` 中分離出來，建立 `InventoryService` 領域服務，實現：
1. 業務邏輯與 UI 邏輯的分離
2. 統一的庫存管理流程
3. 提高程式碼的可測試性和可維護性
4. 符合 DDD 架構設計原則

## 重構步驟

### 步驟 1：建立錯誤代碼常數定義

**目標**：建立統一的錯誤代碼管理機制

**需要修改的檔案**：
- 新建：`src/domain/errors/InventoryErrorCodes.ts`

**實作內容**：
```typescript
// src/domain/errors/InventoryErrorCodes.ts
export enum InventoryErrorCode {
  INVENTORY_INSUFFICIENT = 'INVENTORY_INSUFFICIENT',
  INVENTORY_CHECK_FAILED = 'INVENTORY_CHECK_FAILED',
  INVENTORY_DEDUCTION_FAILED = 'INVENTORY_DEDUCTION_FAILED',
  ORDER_CREATION_FAILED = 'ORDER_CREATION_FAILED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  INVALID_REQUEST = 'INVALID_REQUEST',
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND'
}

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

**驗證方法**：
- 執行 TypeScript 編譯檢查：`npm run build` 或 `tsc --noEmit`
- 確認檔案可以正常 import

**風險**：低風險，新增檔案不影響現有功能

**回滾方案**：刪除新建的檔案即可

---

### 步驟 2：建立 Order 領域模型

**目標**：將 Order 類型定義移到領域層，統一類型定義

**需要修改的檔案**：
- 新建：`src/domain/types/Order.ts`
- 修改：`src/contexts/CartContext.tsx`（移除 Order 定義，改用 domain 類型）
- 修改：`src/pages/Orders.tsx`（改用 domain 類型）

**實作內容**：
參考 `implementation.md` 中的 Order 領域模型定義，建立完整的 Order 類型：
- `Order` 介面
- `OrderItem` 介面
- `CustomerInfo` 介面
- `OrderStatus` 類型
- `PaymentMethod` 類型
- `InventorySnapshot` 介面
- `OrderCreationRequest` 介面
- `OrderCreationResult` 介面

**驗證方法**：
- 執行 TypeScript 編譯檢查
- 執行現有測試：`npm test`
- 手動測試訂單相關功能

**風險**：中風險，可能影響現有使用 Order 類型的程式碼

**回滾方案**：
- 保留 `CartContext.tsx` 中的 Order 定義作為備份
- 如果出現問題，恢復原來的 import

---

### 步驟 3：擴充 ProductRepository 介面

**目標**：在 ProductRepository 介面中添加 `deductInventoryWithOrder` 方法

**需要修改的檔案**：
- 修改：`src/domain/repositories/ProductRepository.ts`

**實作內容**：
在 `ProductRepository` 介面中添加：
```typescript
deductInventoryWithOrder(request: OrderCreationRequest): Promise<RepositoryResult<OrderCreationResult>>
```

**驗證方法**：
- 執行 TypeScript 編譯檢查
- 確認 `SupabaseProductRepository` 會出現編譯錯誤（預期行為，下一步會實作）

**風險**：低風險，只是新增介面方法，不影響現有功能

**回滾方案**：移除新增的方法定義即可

---

### 步驟 4：建立 InventoryService 領域服務

**目標**：建立 InventoryService 來協調庫存管理流程

**需要修改的檔案**：
- 新建：`src/domain/services/InventoryService.ts`

**實作內容**：
參考 `implementation.md` 中的 InventoryService 設計，實作：
- `validateAndDeductInventory` 方法
- `checkInventoryBeforeOrder` 方法
- `processOrderWithInventory` 方法

**驗證方法**：
- 執行 TypeScript 編譯檢查
- 建立單元測試驗證服務邏輯
- 確認可以正常 import 和使用

**風險**：低風險，新建服務不影響現有功能

**回滾方案**：刪除新建的檔案即可

---

### 步驟 5：更新依賴注入容器

**目標**：在 container 中註冊 InventoryService

**需要修改的檔案**：
- 修改：`src/infrastructure/container.ts`

**實作內容**：
```typescript
import { InventoryService } from '@/domain/services/InventoryService'

container.register<InventoryService>('InventoryService', () => {
  const productRepository = container.resolve<ProductRepository>('ProductRepository')
  return new InventoryService(productRepository)
})
```

**驗證方法**：
- 執行 TypeScript 編譯檢查
- 確認 container 可以正確解析 InventoryService

**風險**：低風險，只是新增服務註冊

**回滾方案**：移除新增的註冊程式碼即可

---

### 步驟 6：重構 CartContext 使用 InventoryService

**目標**：將 CartContext 中的庫存管理邏輯替換為使用 InventoryService

**需要修改的檔案**：
- 修改：`src/contexts/CartContext.tsx`

**實作內容**：
1. 移除直接使用 `ProductRepository` 的程式碼
2. 使用 `useMemo` 建立 `InventoryService` 實例
3. 在 `createOrder` 方法中使用 `inventoryService.processOrderWithInventory`
4. 更新錯誤處理邏輯，使用結構化錯誤訊息

**驗證方法**：
- 執行 TypeScript 編譯檢查
- 執行現有測試：`npm test`
- 手動測試購物車和訂單建立功能
- 測試庫存不足的情況

**風險**：高風險，這是核心業務邏輯的修改

**回滾方案**：
- 使用 Git 分支進行重構，確保可以快速回滾
- 保留原來的 `createOrder` 實作作為備份（註解掉）
- 如果出現問題，恢復原來的實作

---

### 步驟 7：更新相關測試

**目標**：更新測試以反映新的架構

**需要修改的檔案**：
- 修改：`src/contexts/__tests__/CartContext.test.tsx`（如果存在）
- 新建：`src/domain/services/__tests__/InventoryService.test.ts`

**實作內容**：
1. 為 InventoryService 建立單元測試
2. 更新 CartContext 的測試，mock InventoryService
3. 確保所有測試通過

**驗證方法**：
- 執行所有測試：`npm test`
- 確認測試覆蓋率不降低

**風險**：中風險，測試修改可能遺漏某些場景

**回滾方案**：恢復原來的測試檔案

---

## 測試策略

### 單元測試
1. **InventoryService 測試**：
   - 測試 `validateAndDeductInventory` 成功和失敗情況
   - 測試 `checkInventoryBeforeOrder` 各種庫存狀態
   - 測試 `processOrderWithInventory` 完整流程

2. **CartContext 測試**：
   - Mock InventoryService
   - 測試 `createOrder` 方法
   - 測試錯誤處理

### 整合測試
1. 測試完整的訂單建立流程
2. 測試庫存不足時的錯誤處理
3. 測試多商品同時購買的情況

### 手動測試
1. 在瀏覽器中測試購物車功能
2. 測試訂單建立流程
3. 測試庫存不足時的錯誤訊息顯示

## 回滾方案

### 完整回滾步驟
1. 如果重構過程中出現嚴重問題，立即停止重構
2. 使用 Git 回滾到重構前的 commit：`git reset --hard <previous-commit>`
3. 或者手動恢復修改的檔案：
   - 恢復 `CartContext.tsx` 到原來的版本
   - 刪除新建的檔案（InventoryService.ts, Order.ts, InventoryErrorCodes.ts）
   - 恢復 `ProductRepository.ts` 介面

### 部分回滾
如果只有部分功能有問題：
1. 保留 InventoryService 和 Order 類型定義
2. 恢復 CartContext 使用原來的實作方式
3. 逐步排查問題

## 注意事項

1. **逐步進行**：每個步驟完成後都要驗證，不要一次性修改所有檔案
2. **保留備份**：在修改重要檔案前，先 commit 當前狀態
3. **測試優先**：確保每個步驟都有對應的測試驗證
4. **文檔更新**：如果 API 有變更，記得更新相關文檔

## 預期成果

完成重構後，應該達成：
1. ✅ 業務邏輯與 UI 邏輯分離
2. ✅ 統一的庫存管理流程
3. ✅ 提高程式碼可測試性
4. ✅ 符合 DDD 架構設計原則
5. ✅ 所有現有功能正常運作
6. ✅ 測試覆蓋率不降低

