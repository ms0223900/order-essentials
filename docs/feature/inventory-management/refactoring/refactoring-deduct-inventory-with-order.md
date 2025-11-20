# 重構：實作 deductInventoryWithOrder 方法

## 重構目標

實作 `deductInventoryWithOrder` 方法，實現真正的原子性操作，確保：
1. 訂單建立與庫存扣除在同一資料庫交易中完成
2. 全部成功或全部失敗，避免部分成功的情況
3. 符合 solution.md 的技術方案
4. 提高資料一致性保證

## 重構步驟

### 步驟 1：確認 SQL 函數是否存在

**目標**：確認 `deduct_inventory_with_order` 函數是否已在資料庫中實作

**需要檢查的檔案**：
- `supabase/migrations/` 目錄下的 migration 檔案
- 資料庫中的函數定義

**實作內容**：
1. 檢查 migration 檔案，確認是否有 `deduct_inventory_with_order` 函數
2. 如果不存在，需要建立 migration 檔案
3. 參考 `sql-implementation.md` 中的 SQL 函數定義

**驗證方法**：
- 檢查 migration 檔案列表
- 連接到 Supabase 資料庫，執行 `\df deduct_inventory_with_order` 查詢函數是否存在

**風險**：低風險，只是檢查工作

**回滾方案**：如果函數不存在，需要先建立 migration（見步驟 2）

---

### 步驟 2：建立 SQL 函數 Migration（如果需要）

**目標**：如果 SQL 函數不存在，建立 migration 檔案

**需要修改的檔案**：
- 新建：`supabase/migrations/[timestamp]_deduct_inventory_with_order.sql`

**實作內容**：
參考 `sql-implementation.md` 中的 SQL 函數定義，建立完整的 migration：
1. 建立 `deduct_inventory_with_order` 函數
2. 函數應包含：
   - 庫存檢查邏輯
   - 庫存扣除邏輯
   - 訂單建立邏輯
   - 訂單項目建立邏輯
   - 庫存快照建立邏輯
   - 錯誤處理和交易回滾

**驗證方法**：
1. 執行 migration：`supabase migration up` 或透過 Supabase Dashboard
2. 確認函數建立成功
3. 測試函數是否可以正常呼叫

**風險**：中風險，SQL 函數的錯誤可能導致資料庫問題

**回滾方案**：
- 如果 migration 有問題，可以回滾 migration
- 或者手動刪除函數：`DROP FUNCTION IF EXISTS public.deduct_inventory_with_order(JSON);`

---

### 步驟 3：更新 Supabase 類型定義

**目標**：在 Supabase 類型定義中添加新函數的類型

**需要修改的檔案**：
- 修改：`src/integrations/supabase/types.ts`（可能需要重新生成）

**實作內容**：
1. 執行 Supabase 類型生成命令（如果有的話）
2. 或者手動添加函數類型定義：
```typescript
deduct_inventory_with_order: {
  Args: {
    order_data: Json
  }
  Returns: Json
}
```

**驗證方法**：
- 執行 TypeScript 編譯檢查
- 確認類型定義正確

**風險**：低風險，主要是類型定義

**回滾方案**：恢復原來的類型定義

---

### 步驟 4：擴充 ProductRepository 介面

**目標**：在 ProductRepository 介面中添加 `deductInventoryWithOrder` 方法

**需要修改的檔案**：
- 修改：`src/domain/repositories/ProductRepository.ts`

**實作內容**：
添加方法定義：
```typescript
/**
 * 將庫存扣除與訂單建立整合為原子操作
 * 此方法應在資料庫交易中執行，確保庫存扣除和訂單建立的原子性
 */
deductInventoryWithOrder(request: OrderCreationRequest): Promise<RepositoryResult<OrderCreationResult>>
```

**驗證方法**：
- 執行 TypeScript 編譯檢查
- 確認 `SupabaseProductRepository` 會出現編譯錯誤（預期行為，下一步會實作）

**風險**：低風險，只是新增介面方法

**回滾方案**：移除新增的方法定義即可

---

### 步驟 5：實作 SupabaseProductRepository.deductInventoryWithOrder

**目標**：在 SupabaseProductRepository 中實作 `deductInventoryWithOrder` 方法

**需要修改的檔案**：
- 修改：`src/infrastructure/repositories/SupabaseProductRepository.ts`

**實作內容**：
參考 `sql-implementation.md` 中的實作設計，實作方法：
1. 準備訂單資料結構（轉換為 JSON）
2. 呼叫 `supabase.rpc('deduct_inventory_with_order', { order_data })`
3. 處理回應結果
4. 轉換為 `OrderCreationResult` 格式
5. 處理錯誤情況

**驗證方法**：
- 執行 TypeScript 編譯檢查
- 建立單元測試驗證方法邏輯
- Mock Supabase RPC 呼叫，測試各種情況

**風險**：中風險，實作錯誤可能導致功能異常

**回滾方案**：
- 保留原來的實作作為備份（註解掉）
- 如果出現問題，恢復原來的實作

---

### 步驟 6：建立單元測試

**目標**：為 `deductInventoryWithOrder` 方法建立完整的測試

**需要修改的檔案**：
- 修改：`src/infrastructure/repositories/__tests__/SupabaseProductRepository.inventory.test.ts`
- 或新建：`src/infrastructure/repositories/__tests__/SupabaseProductRepository.order.test.ts`

**實作內容**：
建立測試案例：
1. 成功建立訂單並扣除庫存
2. 庫存不足時的錯誤處理
3. 商品不存在時的錯誤處理
4. 客戶資訊不完整時的錯誤處理
5. 訂單項目為空時的錯誤處理
6. 資料庫錯誤時的錯誤處理

**驗證方法**：
- 執行測試：`npm test`
- 確認所有測試通過
- 確認測試覆蓋率

**風險**：低風險，新增測試不影響現有功能

**回滾方案**：刪除或註解掉新增的測試

---

### 步驟 7：更新 InventoryService 使用新方法（可選）

**目標**：如果 InventoryService 已實作，更新它使用新的 `deductInventoryWithOrder` 方法

**需要修改的檔案**：
- 修改：`src/domain/services/InventoryService.ts`（如果存在）

**實作內容**：
在 `processOrderWithInventory` 方法中，直接使用 `deductInventoryWithOrder` 而不是分別呼叫檢查和扣除方法

**驗證方法**：
- 執行 TypeScript 編譯檢查
- 執行相關測試

**風險**：中風險，可能影響現有功能

**回滾方案**：恢復原來的實作方式

---

### 步驟 8：整合測試

**目標**：測試完整的訂單建立流程

**實作內容**：
1. 建立整合測試，測試完整的訂單建立流程
2. 測試庫存扣除是否正確
3. 測試訂單記錄是否正確建立
4. 測試庫存快照是否正確記錄
5. 測試錯誤情況的處理

**驗證方法**：
- 執行整合測試
- 手動測試完整流程
- 確認資料庫中的記錄正確

**風險**：低風險，主要是測試工作

**回滾方案**：如果測試失敗，根據錯誤訊息調整實作

---

## 測試策略

### 單元測試
1. **SupabaseProductRepository.deductInventoryWithOrder 測試**：
   - Mock Supabase RPC 呼叫
   - 測試成功情況
   - 測試各種錯誤情況
   - 測試資料轉換邏輯

2. **資料轉換測試**：
   - 測試 `OrderCreationRequest` 轉換為 JSON
   - 測試回應 JSON 轉換為 `OrderCreationResult`

### 整合測試
1. **資料庫函數測試**：
   - 直接測試 SQL 函數
   - 測試交易回滾機制
   - 測試並發情況

2. **完整流程測試**：
   - 測試從購物車到訂單建立的完整流程
   - 測試庫存扣除和訂單建立的原子性

### 手動測試
1. 在瀏覽器中測試訂單建立
2. 檢查資料庫中的訂單記錄
3. 檢查庫存是否正確扣除
4. 檢查庫存快照是否正確記錄
5. 測試庫存不足的情況

## 回滾方案

### 完整回滾步驟
1. 如果重構過程中出現嚴重問題，立即停止重構
2. 使用 Git 回滾：`git reset --hard <previous-commit>`
3. 或者手動恢復：
   - 移除 `deductInventoryWithOrder` 方法實作
   - 移除介面中的方法定義
   - 如果建立了 migration，回滾 migration

### 部分回滾
如果只有部分功能有問題：
1. 保留 SQL 函數和介面定義
2. 修復實作中的問題
3. 或者暫時不使用新方法，繼續使用舊的方式

## 注意事項

1. **SQL 函數優先**：確保 SQL 函數正確實作，這是原子性保證的關鍵

2. **錯誤處理**：確保錯誤處理邏輯完整，特別是：
   - 庫存不足的情況
   - 商品不存在的情況
   - 資料庫錯誤的情況

3. **資料轉換**：注意 JSON 資料結構與 TypeScript 類型的對應關係

4. **測試優先**：每個步驟完成後都要執行測試驗證

5. **逐步進行**：建議先實作 SQL 函數並測試，再實作 TypeScript 方法

## 預期成果

完成重構後，應該達成：
1. ✅ `deductInventoryWithOrder` 方法實作完成
2. ✅ SQL 函數正確實作並部署
3. ✅ 訂單建立與庫存扣除在同一交易中完成
4. ✅ 全部成功或全部失敗的原子性保證
5. ✅ 完整的錯誤處理機制
6. ✅ 完整的測試覆蓋
7. ✅ 所有現有功能正常運作

## SQL 函數關鍵點

### 交易保證
- PostgreSQL 函數預設在交易中執行
- 任何錯誤都會自動回滾整個交易
- 使用 `RAISE EXCEPTION` 可以明確觸發回滾

### 並發控制
- 使用 `FOR UPDATE` 鎖定商品行
- 在扣除前再次檢查庫存（雙重檢查）
- 防止競態條件

### 錯誤處理
- 結構化錯誤訊息
- 包含商品名稱、當前庫存、請求數量等詳細資訊
- 支援批量錯誤報告

