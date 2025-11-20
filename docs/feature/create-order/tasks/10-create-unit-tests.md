# 任務：建立單元測試

## 任務描述
為新實作的訂單建立功能建立完整的單元測試套件，確保功能正確性和可靠性。

## 輸入格式
- **測試框架**: Vitest + React Testing Library
- **測試對象**: Repository、Service、React 元件
- **測試資料**: Mock 資料和測試輔助函數

## 輸出格式
- **測試檔案**: 每個模組對應的 `.test.ts` 或 `.test.tsx` 檔案
- **測試覆蓋率**: 涵蓋主要功能和邊緣情況
- **測試報告**: 通過/失敗狀態和詳細資訊

## 測試範圍
1. **Repository 層測試**:
   - `SupabaseOrderRepository.createOrderWithInventoryDeduction`
   - 錯誤處理和回應轉換
   - 網路錯誤模擬

2. **Service 層測試**:
   - `OrderService.createOrderWithInventoryDeduction`
   - 業務邏輯驗證
   - 資料轉換功能

3. **元件層測試**:
   - 結帳表單的訂單建立流程
   - UI 狀態更新
   - 錯誤顯示和處理

4. **整合測試**:
   - Repository + Service 的整合
   - 元件 + Service 的整合

## 測試策略
1. **Mock 策略**:
   - Mock Supabase 客戶端
   - Mock 外部依賴
   - 提供一致的測試資料

2. **測試案例設計**:
   - 正常流程測試
   - 錯誤情況測試
   - 邊緣情況測試
   - 效能測試（如果適用）

3. **測試資料管理**:
   - 使用測試輔助函數產生 Mock 資料
   - 確保測試資料的真實性
   - 支援多種測試場景

## 驗收條件
- [ ] 測試覆蓋率達到 80% 以上
- [ ] 所有主要功能有對應測試
- [ ] 錯誤處理邏輯經過測試
- [ ] 測試資料管理完善
- [ ] CI/CD 流程整合測試
- [ ] 測試執行時間合理

## 依賴關係
- **前置依賴**:
  - 01-10 所有功能實作任務（需要測試的程式碼）
- **後續依賴**: 11-create-integration-tests（更高層次的測試）
