# 任務：建立 OrderService 應用服務

## 任務描述
建立 `OrderService` 應用服務，封裝訂單相關的業務邏輯，協調 Repository 和其他服務。

## 輸入格式
- **新檔案位置**: `src/services/OrderService.ts`
- **依賴注入**: `OrderRepository` 實例
- **方法參數**: 顧客資訊和購物車項目

## 輸出格式
- **服務方法回傳**: 統一的服務回應格式
- **成功回應**: 訂單資訊和處理結果
- **錯誤回應**: 結構化的錯誤資訊

## 服務設計
1. **類別結構**:
   ```typescript
   export class OrderService {
     constructor(private orderRepository: OrderRepository) {}

     async createOrderWithInventoryDeduction(
       customerInfo: CustomerInfo,
       cartItems: CartItem[]
     ): Promise<OrderServiceResponse>
   }
   ```

2. **業務邏輯**:
   - 驗證顧客資訊完整性
   - 轉換購物車項目為訂單項目格式
   - 呼叫 Repository 方法
   - 處理業務規則驗證

3. **資料轉換**:
   - 購物車項目 → 訂單項目
   - 顧客資訊驗證和格式化
   - 回應資料的整理

## 驗收條件
- [ ] OrderService 類別成功建立
- [ ] 依賴注入正確設定
- [ ] 業務邏輯正確實作
- [ ] 資料轉換功能正常
- [ ] 錯誤處理統一
- [ ] 單元測試通過

## 依賴關係
- **前置依賴**:
  - 05-implement-repository-method（需要呼叫的 Repository 方法）
  - 06-update-error-handling（依賴統一的錯誤處理）
- **後續依賴**: 08-integrate-cart-order-flow（需要使用此服務）
