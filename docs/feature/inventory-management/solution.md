## 庫存管理 - 庫存更新技術解決方案

### 摘要

1. **架構設計**：遵循現有 DDD 分層，Domain Layer 定義介面，Infrastructure Layer 實作資料庫操作，Application Layer（CartContext）協調流程
2. **核心介面**：擴充 `ProductRepository`，包含 `checkInventoryAvailability()` 與 `deductInventoryBatch()`，確保原子性
3. **訂單建立流程**：`createOrder()` → 檢查庫存可用性 → 批量扣除庫存 → 建立訂單（失敗則回滾）
4. **原子性保證**：使用資料庫交易，庫存檢查與扣除在同一交易中完成，訂單建立與庫存扣除採用全部成功或全部失敗策略
5. **批量處理**：支援多商品同時扣除，使用單一 SQL 函數處理，減少資料庫往返
6. **錯誤處理**：定義錯誤代碼（INVENTORY_INSUFFICIENT、DEDUCTION_FAILED 等），提供商品名稱、當前庫存、請求數量等詳細錯誤訊息
7. **並發控制**：使用資料庫鎖機制防止競態條件，在扣除前再次檢查庫存（雙重檢查）
8. **資料一致性**：資料庫層級約束確保庫存 >= 0，使用觸發器或函數驗證庫存更新正確性
9. **擴展性設計**：介面導向設計易於替換實作，支援未來事件驅動架構與分散式鎖機制
10. **實作優先順序**：第一階段實作核心檢查與扣除功能，第二階段完善錯誤處理，第三階段優化效能與並發控制

### 一、架構設計原則

1. 遵循現有 DDD 與 Clean Architecture 分層
   - Domain Layer：定義庫存管理領域邏輯與介面
   - Infrastructure Layer：實作資料庫操作
   - Application Layer：協調庫存檢查與扣除流程
   - Presentation Layer：處理使用者互動與錯誤顯示

2. 確保原子性與一致性
   - 使用資料庫交易確保庫存扣除的原子性
   - 庫存檢查與扣除在同一交易中完成
   - 訂單建立與庫存扣除採用兩階段提交或補償機制

3. 支援未來擴展
   - 介面導向設計，易於替換實作
   - 支援多種資料來源（Supabase、PostgreSQL、MongoDB 等）
   - 可擴展至分散式鎖、事件驅動架構

### 二、領域層設計 (Domain Layer)

1. 擴充 ProductRepository 介面
   - 已定義 `deductInventoryBatch` 和 `checkInventoryAvailability`
   - 新增 `deductInventoryWithOrder`：將庫存扣除與訂單建立整合為原子操作

2. 定義庫存管理領域類型
   - `InventoryDeductionRequest`：庫存扣除請求
   - `InventoryDeductionResult`：單一商品扣除結果
   - `BatchInventoryDeductionResult`：批量扣除結果
   - `InventoryAvailabilityResult`：庫存可用性檢查結果
   - `OrderCreationRequest`：訂單建立請求（整合庫存扣除）

3. 定義庫存業務規則
   - 庫存不能為負數
   - 扣除前必須檢查可用性
   - 批量操作需全部成功或全部失敗

### 三、應用層設計 (Application Layer)

1. 建立庫存管理服務 (InventoryService)
   - 職責：協調庫存檢查、扣除與訂單建立的流程
   - 位置：`src/services/InventoryService.ts` 或 `src/domain/services/InventoryService.ts`
   - 方法：
     - `validateAndDeductInventory(requests)`：驗證並扣除庫存
     - `checkInventoryBeforeOrder(items)`：訂單前庫存檢查
     - `processOrderWithInventory(order, items)`：處理訂單與庫存扣除

2. 擴充 CartContext 的訂單建立流程
   - 在 `createOrder` 中整合庫存管理服務
   - 實作錯誤處理與回滾機制
   - 提供清晰的錯誤訊息給使用者

3. 建立訂單領域模型 (Order Domain Model)
   - 位置：`src/domain/types/Order.ts`
   - 包含：訂單狀態、訂單項目、庫存快照等
   - 支援未來擴展：訂單歷史、庫存變更記錄

### 四、基礎設施層設計 (Infrastructure Layer)

1. Repository 實作策略
   - 使用資料庫交易確保原子性
   - 實作樂觀鎖或悲觀鎖防止並發問題
   - 支援批量操作優化效能

2. 錯誤處理機制
   - 定義庫存相關錯誤代碼
   - 提供結構化錯誤訊息
   - 支援錯誤分類（庫存不足、系統錯誤、網路錯誤等）

3. 資料一致性保證
   - 使用資料庫約束防止負庫存
   - 實作檢查約束（CHECK constraint）確保庫存 >= 0
   - 使用觸發器或函數確保庫存更新的正確性

### 五、具體實作設計

1. 庫存檢查流程
   ```
   步驟 1: 接收購物車商品清單
   步驟 2: 轉換為 InventoryDeductionRequest[]
   步驟 3: 呼叫 checkInventoryAvailability
   步驟 4: 檢查結果，如有不足則回傳詳細錯誤訊息
   步驟 5: 所有商品庫存充足則繼續
   ```

2. 庫存扣除流程
   ```
   步驟 1: 開始資料庫交易
   步驟 2: 再次檢查庫存可用性（防止競態條件）
   步驟 3: 批量扣除庫存
   步驟 4: 驗證扣除結果
   步驟 5: 如有失敗則回滾交易
   步驟 6: 提交交易
   ```

3. 訂單建立與庫存扣除整合流程
   ```
   步驟 1: 驗證購物車不為空
   步驟 2: 驗證客戶資訊完整
   步驟 3: 檢查庫存可用性
   步驟 4: 開始交易
   步驟 5: 扣除庫存
   步驟 6: 建立訂單記錄
   步驟 7: 提交交易（或回滾）
   步驟 8: 更新前端狀態
   ```

### 六、錯誤處理設計

1. 錯誤分類
   - `INVENTORY_INSUFFICIENT`：庫存不足
   - `INVENTORY_CHECK_FAILED`：庫存檢查失敗
   - `INVENTORY_DEDUCTION_FAILED`：庫存扣除失敗
   - `ORDER_CREATION_FAILED`：訂單建立失敗
   - `TRANSACTION_FAILED`：交易失敗

2. 錯誤訊息設計
   - 提供商品名稱、當前庫存、請求數量等資訊
   - 支援多語言錯誤訊息
   - 提供使用者友善的錯誤提示

3. 錯誤恢復機制
   - 自動重試機制（可選）
   - 部分失敗時的補償機制
   - 記錄錯誤日誌供後續分析

### 七、效能優化設計

1. 批量操作優化
   - 使用單一 SQL 語句處理多個商品
   - 減少資料庫往返次數
   - 使用預編譯語句提升效能

2. 快取策略（未來擴展）
   - 庫存資訊快取（需注意一致性）
   - 使用 Redis 或記憶體快取
   - 實作快取失效機制

3. 並發控制
   - 使用資料庫鎖機制
   - 實作樂觀鎖（版本號）或悲觀鎖
   - 處理死鎖情況

### 八、測試策略設計

1. 單元測試
   - 測試庫存檢查邏輯
   - 測試庫存扣除邏輯
   - 測試錯誤處理機制

2. 整合測試
   - 測試 Repository 與資料庫的整合
   - 測試訂單建立與庫存扣除的整合
   - 測試交易回滾機制

3. 並發測試
   - 測試同時多個訂單的庫存扣除
   - 測試競態條件處理
   - 測試負載情況下的效能

### 九、未來擴展性設計

1. 事件驅動架構支援
   - 庫存變更事件發布
   - 訂單建立事件訂閱
   - 支援事件溯源（Event Sourcing）

2. 分散式系統支援
   - 分散式鎖機制
   - 分散式交易支援
   - 微服務架構適配

3. 監控與分析
   - 庫存變更記錄
   - 效能監控指標
   - 業務分析報表

### 十、實作優先順序

1. 第一階段：核心功能
   - 實作庫存檢查介面與方法
   - 實作批量庫存扣除介面與方法
   - 整合到 CartContext 的訂單建立流程

2. 第二階段：錯誤處理
   - 完善錯誤分類與處理
   - 實作使用者友善的錯誤訊息
   - 添加錯誤日誌記錄

3. 第三階段：優化與擴展
   - 效能優化
   - 並發控制強化
   - 監控與分析功能