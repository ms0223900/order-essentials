# 程式碼重構分析報告

## 一、程式碼氣味分析

### 1. 重複的錯誤處理模式
**問題描述**：
- `SupabaseProductRepository.ts` 中每個方法都有相同的 try-catch 錯誤處理結構
- 錯誤訊息的格式化和返回模式重複出現（約 10+ 次）
- 違反 DRY（Don't Repeat Yourself）原則

**影響範圍**：
- `src/infrastructure/repositories/SupabaseProductRepository.ts`（所有方法）
- 未來新增方法時需要重複相同的錯誤處理邏輯

**改進優先級**：**高**

**預期效益**：
- 減少程式碼重複，提高可維護性
- 統一錯誤處理邏輯，確保一致性
- 降低未來修改錯誤處理邏輯的成本

---

### 2. 缺少領域服務層（InventoryService）
**問題描述**：
- `implementation.md` 中設計了 `InventoryService` 來協調庫存管理流程
- 目前 `CartContext.tsx` 直接使用 `ProductRepository`，缺少業務邏輯層
- 庫存檢查和扣除的邏輯分散在 Context 中，違反單一職責原則

**影響範圍**：
- `src/contexts/CartContext.tsx`（createOrder 方法）
- 缺少 `src/domain/services/InventoryService.ts`
- 業務邏輯與 UI 層耦合

**改進優先級**：**高**

**預期效益**：
- 分離業務邏輯與 UI 邏輯，提高可測試性
- 統一庫存管理流程，確保一致性
- 符合 DDD 架構設計原則

---

### 3. 類型定義重複與不一致
**問題描述**：
- `CartContext.tsx` 中定義了 `Product` 和 `Order` 類型
- `domain/types/Product.ts` 中已有 `Product` 定義
- `Order` 類型應該在 `domain/types/Order.ts` 中定義，但目前不存在
- 類型定義不一致可能導致型別錯誤

**影響範圍**：
- `src/contexts/CartContext.tsx`
- `src/pages/Orders.tsx`（使用 Order 類型）
- 缺少 `src/domain/types/Order.ts`

**改進優先級**：**高**

**預期效益**：
- 統一類型定義，避免重複
- 提高型別安全性
- 符合領域驅動設計原則

---

### 4. 缺少錯誤代碼常數定義
**問題描述**：
- `implementation.md` 中設計了 `InventoryErrorCode` 和 `InventoryErrorMessages`
- 目前程式碼中使用字串常數（如 'UNEXPECTED_ERROR'），容易出錯
- 錯誤訊息分散在各處，難以統一管理

**影響範圍**：
- `src/infrastructure/repositories/SupabaseProductRepository.ts`
- `src/contexts/CartContext.tsx`
- 缺少 `src/domain/errors/InventoryErrorCodes.ts`

**改進優先級**：**中**

**預期效益**：
- 統一錯誤代碼管理，避免拼寫錯誤
- 提供結構化錯誤訊息
- 支援多語言錯誤訊息（未來擴展）

---

### 5. ProductRepository 介面不完整
**問題描述**：
- `implementation.md` 中設計了 `deductInventoryWithOrder` 方法
- 目前 `ProductRepository` 介面中缺少此方法
- `SupabaseProductRepository` 也缺少對應實作

**影響範圍**：
- `src/domain/repositories/ProductRepository.ts`
- `src/infrastructure/repositories/SupabaseProductRepository.ts`
- 無法實現原子性的訂單建立與庫存扣除

**改進優先級**：**高**

**預期效益**：
- 實現真正的原子性操作（訂單建立與庫存扣除）
- 符合 solution.md 的技術方案
- 提高資料一致性保證

---

### 6. 缺少 SQL 函數實作
**問題描述**：
- `sql-implementation.md` 中設計了 `deduct_inventory_with_order` 函數
- 需要確認此函數是否已在資料庫中實作
- 如果未實作，需要建立 migration

**影響範圍**：
- `supabase/migrations/` 目錄
- `src/infrastructure/repositories/SupabaseProductRepository.ts`（deductInventoryWithOrder 方法）

**改進優先級**：**高**

**預期效益**：
- 實現資料庫層級的原子性操作
- 確保資料一致性
- 符合 solution.md 的技術方案

---

## 二、可抽象化的模組

### 1. Repository 錯誤處理輔助函數
**問題描述**：
- 所有 Repository 方法都有相同的錯誤處理模式
- 可以提取成共用的錯誤處理函數

**建議方案**：
建立 `src/infrastructure/repositories/utils/error-handler.ts`，提供統一的錯誤處理函數

**改進優先級**：**中**

---

### 2. 分頁查詢邏輯
**問題描述**：
- `getAll`、`getByCategory`、`search` 方法中都有相同的分頁邏輯
- 可以提取成共用的查詢建構器

**建議方案**：
建立 `src/infrastructure/repositories/utils/query-builder.ts`，提供分頁查詢輔助函數

**改進優先級**：**低**

---

## 三、可文件化的知識

### 1. 庫存扣除的原子性保證機制
**問題描述**：
- 需要說明為什麼使用資料庫函數而非應用層邏輯
- 需要說明 `FOR UPDATE` 鎖機制的作用

**建議方案**：
在 `SupabaseProductRepository.ts` 和相關 SQL 函數中添加詳細註釋

**改進優先級**：**中**

---

### 2. 錯誤處理策略
**問題描述**：
- 需要說明不同錯誤類型的處理策略
- 需要說明回滾機制的實作方式

**建議方案**：
建立 `docs/architecture/error-handling.md` 文件

**改進優先級**：**低**

---

## 四、可維護性問題

### 1. CartContext 職責過重
**問題描述**：
- `CartContext.tsx` 同時負責狀態管理和業務邏輯
- `createOrder` 方法包含複雜的庫存管理邏輯
- 違反單一職責原則

**影響範圍**：
- `src/contexts/CartContext.tsx`

**改進優先級**：**高**

**預期效益**：
- 分離關注點，提高可測試性
- 業務邏輯可重用
- 符合 Clean Architecture 原則

---

### 2. 依賴注入容器缺少服務註冊
**問題描述**：
- `container.ts` 中只註冊了 `ProductRepository`
- 缺少 `InventoryService` 的註冊（如果實作的話）

**影響範圍**：
- `src/infrastructure/container.ts`

**改進優先級**：**中**

---

## 五、效能優化機會

### 1. Repository 方法中的重複查詢
**問題描述**：
- 目前沒有明顯的效能問題
- 未來可以考慮快取機制（但需注意一致性）

**改進優先級**：**低**

---

## 六、優先級總結

### 高優先級項目（前 3 項）
1. **實作 InventoryService 並重構 CartContext** - 分離業務邏輯與 UI 邏輯
2. **統一類型定義並建立 Order 領域模型** - 提高型別安全性和架構一致性
3. **實作 deductInventoryWithOrder 方法** - 實現真正的原子性操作

### 中優先級項目
4. 提取 Repository 錯誤處理輔助函數
5. 建立錯誤代碼常數定義
6. 確認並實作 SQL 函數

### 低優先級項目
7. 提取分頁查詢邏輯
8. 添加架構文件
9. 效能優化（未來考慮）

