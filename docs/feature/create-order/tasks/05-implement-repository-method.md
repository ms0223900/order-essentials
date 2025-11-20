# 任務：實作 SupabaseOrderRepository 的新方法

## 任務描述
在 `SupabaseOrderRepository` 中實作新的 `createOrderWithInventoryDeduction` 方法，呼叫整合的資料庫函數。

## 輸入格式
- **現有檔案**: `src/infrastructure/repositories/SupabaseOrderRepository.ts`
- **新方法參數**: `CreateOrderRequest`
- **資料庫函數**: `create_order_with_inventory_deduction`

## 輸出格式
- **回傳值**: `CreateOrderWithInventoryResponse`
- **錯誤處理**: 統一的錯誤格式和錯誤代碼
- **成功回應**: 包含訂單資訊和庫存扣減結果

## 實作細節
1. **方法簽章**:
   ```typescript
   async createOrderWithInventoryDeduction(
     request: CreateOrderRequest
   ): Promise<CreateOrderWithInventoryResponse>
   ```

2. **資料轉換**:
   - 將 `CreateOrderRequest` 轉換為資料庫函數參數格式
   - 將商品項目轉換為 JSON 格式

3. **Supabase RPC 呼叫**:
   - 呼叫 `create_order_with_inventory_deduction` 函數
   - 處理回應資料的轉換

4. **錯誤處理**:
   - 區分不同錯誤類型（網路錯誤、資料庫錯誤、業務邏輯錯誤）
   - 提供詳細的錯誤訊息

5. **回應轉換**:
   - 將資料庫函數的 JSON 回應轉換為 TypeScript 介面
   - 處理庫存扣減結果的格式轉換

## 驗收條件
- [ ] 新方法成功實作並編譯通過
- [ ] 能夠正確呼叫資料庫函數
- [ ] 成功情況返回正確的訂單資訊和庫存結果
- [ ] 錯誤情況返回適當的錯誤訊息
- [ ] 與現有 `createOrder` 方法保持相容
- [ ] 單元測試通過

## 依賴關係
- **前置依賴**:
  - 01-create-integrated-database-function（需要呼叫的資料庫函數）
  - 03-extend-repository-interface（介面定義）
  - 04-update-order-types（類型定義）
- **後續依賴**: 06-update-error-handling（依賴此方法的錯誤處理）
