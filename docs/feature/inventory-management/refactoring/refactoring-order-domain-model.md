# 重構：統一類型定義並建立 Order 領域模型

## 重構目標

將分散的類型定義統一到領域層，建立完整的 Order 領域模型，實現：
1. 消除類型定義重複
2. 提高型別安全性
3. 符合領域驅動設計原則
4. 為未來的訂單管理功能奠定基礎

## 重構步驟

### 步驟 1：建立 Order 領域模型檔案

**目標**：建立完整的 Order 領域模型定義

**需要修改的檔案**：
- 新建：`src/domain/types/Order.ts`

**實作內容**：
參考 `implementation.md` 中的設計，建立完整的 Order 類型定義：
- `Order` 介面（包含庫存快照）
- `OrderItem` 介面
- `CustomerInfo` 介面
- `OrderStatus` 類型
- `PaymentMethod` 類型
- `InventorySnapshot` 介面
- `OrderCreationRequest` 介面
- `OrderCreationResult` 介面

**驗證方法**：
- 執行 TypeScript 編譯檢查：`npm run build` 或 `tsc --noEmit`
- 確認檔案可以正常 import

**風險**：低風險，新建檔案不影響現有功能

**回滾方案**：刪除新建的檔案即可

---

### 步驟 2：更新 CartContext 使用 domain 類型

**目標**：移除 CartContext 中的重複類型定義，改用 domain 類型

**需要修改的檔案**：
- 修改：`src/contexts/CartContext.tsx`

**實作內容**：
1. 移除 `Product` 介面定義（改用 `@/domain/types/Product`）
2. 移除 `Order` 介面定義（改用 `@/domain/types/Order`）
3. 更新 import 語句
4. 確認 `CartItem` 介面使用 domain 的 `Product` 類型
5. 更新 `Order` 相關的類型引用

**驗證方法**：
- 執行 TypeScript 編譯檢查
- 執行現有測試：`npm test`
- 確認沒有型別錯誤

**風險**：中風險，可能因為類型差異導致編譯錯誤

**回滾方案**：
- 保留原來的類型定義作為備份（註解掉）
- 如果出現問題，恢復原來的 import 和類型定義

---

### 步驟 3：更新 Orders 頁面使用 domain 類型

**目標**：更新 Orders 頁面使用統一的 Order 類型

**需要修改的檔案**：
- 修改：`src/pages/Orders.tsx`

**實作內容**：
1. 更新 import 語句，從 `@/contexts/CartContext` 改為 `@/domain/types/Order`
2. 確認所有 Order 類型引用正確
3. 檢查 `OrderStatus` 類型是否包含 'cancelled'（domain 定義中有）

**驗證方法**：
- 執行 TypeScript 編譯檢查
- 在瀏覽器中測試 Orders 頁面
- 確認訂單狀態顯示正常

**風險**：低風險，主要是 import 路徑的修改

**回滾方案**：恢復原來的 import 路徑

---

### 步驟 4：檢查並更新其他使用 Order 類型的檔案

**目標**：確保所有使用 Order 類型的地方都使用 domain 類型

**需要修改的檔案**：
- 搜尋所有使用 Order 類型的檔案
- 更新相關的 import 語句

**實作內容**：
1. 使用 grep 搜尋所有 `import.*Order.*from.*CartContext` 的檔案
2. 逐一更新 import 語句
3. 確認沒有遺漏

**驗證方法**：
- 執行 TypeScript 編譯檢查
- 執行所有測試
- 手動測試相關功能

**風險**：低風險，主要是 import 路徑的修改

**回滾方案**：恢復原來的 import 路徑

---

### 步驟 5：更新測試檔案

**目標**：更新測試檔案使用 domain 類型

**需要修改的檔案**：
- 修改：`src/contexts/__tests__/CartContext.test.tsx`（如果存在）
- 修改：其他使用 Order 類型的測試檔案

**實作內容**：
1. 更新測試檔案中的 import 語句
2. 確認測試資料結構符合新的 Order 類型定義
3. 如果 Order 類型有變更（如新增欄位），更新測試資料

**驗證方法**：
- 執行所有測試：`npm test`
- 確認測試通過

**風險**：中風險，如果 Order 類型結構有變更，測試可能需要調整

**回滾方案**：恢復原來的測試檔案

---

### 步驟 6：驗證類型一致性

**目標**：確保所有地方使用的 Order 類型一致

**實作內容**：
1. 執行完整的 TypeScript 編譯檢查
2. 檢查是否有任何地方仍在使用舊的類型定義
3. 確認所有 import 路徑正確

**驗證方法**：
- `npm run build` 或 `tsc --noEmit`
- 搜尋專案中是否還有重複的 Order 定義
- 執行所有測試

**風險**：低風險，主要是驗證工作

**回滾方案**：如果發現問題，根據問題調整

---

## 測試策略

### 編譯檢查
1. 執行 TypeScript 編譯：`npm run build` 或 `tsc --noEmit`
2. 確認沒有型別錯誤
3. 確認沒有未使用的 import

### 單元測試
1. 執行所有現有測試：`npm test`
2. 確認測試通過
3. 檢查測試覆蓋率

### 整合測試
1. 測試購物車功能
2. 測試訂單建立功能
3. 測試訂單列表顯示

### 手動測試
1. 在瀏覽器中測試完整購物流程
2. 測試訂單建立
3. 測試訂單列表頁面
4. 確認訂單狀態顯示正常

## 回滾方案

### 完整回滾步驟
1. 如果重構過程中出現嚴重問題，立即停止重構
2. 使用 Git 回滾：`git reset --hard <previous-commit>`
3. 或者手動恢復：
   - 刪除 `src/domain/types/Order.ts`
   - 恢復 `CartContext.tsx` 中的類型定義
   - 恢復 `Orders.tsx` 的 import 路徑

### 部分回滾
如果只有部分檔案有問題：
1. 保留 Order.ts 檔案
2. 恢復有問題的檔案到原來的版本
3. 逐步排查問題

## 注意事項

1. **類型兼容性**：確認新的 Order 類型與舊的定義兼容，特別是：
   - `OrderStatus` 是否包含所有需要的狀態
   - `Order` 介面的欄位是否完整
   - `CartItem` 與 `OrderItem` 的轉換是否正確

2. **逐步進行**：建議先建立 Order.ts，然後逐步更新各個檔案

3. **保留備份**：在修改重要檔案前，先 commit 當前狀態

4. **測試優先**：每個步驟完成後都要執行測試驗證

## 預期成果

完成重構後，應該達成：
1. ✅ 統一的 Order 類型定義在 `src/domain/types/Order.ts`
2. ✅ 所有檔案使用 domain 層的類型定義
3. ✅ 沒有重複的類型定義
4. ✅ 型別安全性提高
5. ✅ 所有現有功能正常運作
6. ✅ 測試通過

## 類型對照表

### 舊的定義（CartContext.tsx）
```typescript
export interface Order {
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
  paymentMethod: 'cod';
}
```

### 新的定義（domain/types/Order.ts）
```typescript
export interface Order {
  id: string
  items: OrderItem[]  // 注意：從 CartItem[] 改為 OrderItem[]
  total: number
  customerInfo: CustomerInfo
  status: OrderStatus  // 包含 'cancelled'
  createdAt: Date
  updatedAt?: Date
  paymentMethod: PaymentMethod
  inventorySnapshot?: InventorySnapshot  // 新增
}
```

### 轉換注意事項
- `CartItem` 需要轉換為 `OrderItem`（結構略有不同）
- `OrderStatus` 新增了 'cancelled' 狀態
- 新增了 `inventorySnapshot` 欄位（可選）

