# 任務：更新錯誤處理邏輯

## 任務描述
統一和改進訂單建立過程中的錯誤處理邏輯，提供更好的錯誤分類和用戶友善的錯誤訊息。

## 輸入格式
- **現有檔案**: `src/infrastructure/repositories/SupabaseOrderRepository.ts`
- **錯誤來源**: 資料庫函數返回的錯誤資訊
- **錯誤類型**: 網路錯誤、驗證錯誤、業務邏輯錯誤

## 輸出格式
- **統一的錯誤回應格式**:
  ```typescript
  {
    success: false,
    error: "用戶友善的錯誤訊息",
    errorCode: "MACHINE_READABLE_CODE",
    details?: "詳細的技術資訊（僅開發環境）"
  }
  ```

## 錯誤分類
1. **庫存相關錯誤**:
   - `INSUFFICIENT_STOCK`: 庫存不足
   - `PRODUCT_NOT_FOUND`: 商品不存在

2. **驗證錯誤**:
   - `INVALID_INPUT`: 輸入參數無效
   - `CUSTOMER_INFO_INVALID`: 顧客資訊不完整

3. **系統錯誤**:
   - `DATABASE_ERROR`: 資料庫操作失敗
   - `NETWORK_ERROR`: 網路連線問題
   - `UNKNOWN_ERROR`: 未知錯誤

## 實作細節
1. **錯誤訊息映射**:
   - 將資料庫錯誤代碼轉換為用戶友善的訊息
   - 支援多語言錯誤訊息（預留介面）

2. **錯誤詳情處理**:
   - 開發環境顯示詳細錯誤資訊
   - 生產環境隱藏敏感資訊

3. **錯誤記錄**:
   - 記錄詳細錯誤資訊到控制台或日誌系統
   - 包含足夠的除錯資訊

## 驗收條件
- [ ] 錯誤分類清晰且完整
- [ ] 用戶友善的錯誤訊息
- [ ] 適當的錯誤代碼映射
- [ ] 錯誤記錄功能正常
- [ ] 不同環境的錯誤處理適當

## 依賴關係
- **前置依賴**: 05-implement-repository-method（需要在此方法中實作錯誤處理）
- **後續依賴**: 07-create-order-service（依賴統一的錯誤處理）
