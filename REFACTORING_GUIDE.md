# ProductList 重構指南

## 重構概述

本次重構將原本的 `ProductList` 元件從緊耦合的設計重構為遵循 DDD、Clean Architecture 和 SOLID 原則的架構。

## 重構前後對比

### 重構前的問題
1. **違反單一職責原則** - 元件同時負責資料獲取和 UI 渲染
2. **緊耦合** - 直接依賴 `supabaseClient`，難以測試和替換
3. **缺乏錯誤處理** - 沒有處理載入狀態和錯誤狀態
4. **同步呼叫** - `supabaseClient.get()` 應該是非同步操作
5. **難以測試** - 直接依賴外部服務，無法進行單元測試

### 重構後的改進
1. **分離關注點** - 資料存取、業務邏輯、UI 渲染分離
2. **依賴反轉** - 透過介面和依賴注入實現鬆耦合
3. **完整錯誤處理** - 載入、錯誤、重試機制
4. **易於測試** - 可 mock 依賴，進行單元測試
5. **可擴展性** - 容易添加新功能或替換實作

## 檔案結構說明

```
src/
├── domain/                          # 領域層
│   ├── types/                       # 領域類型定義
│   │   ├── Product.ts              # 商品領域模型
│   │   └── Repository.ts           # Repository 通用類型
│   └── repositories/               # Repository 介面
│       └── ProductRepository.ts    # 商品資料存取介面
├── infrastructure/                  # 基礎設施層
│   ├── repositories/               # Repository 實作
│   │   └── SupabaseProductRepository.ts  # Supabase 實作
│   └── container.ts                # 依賴注入容器
├── hooks/                          # 應用層
│   ├── useProducts.ts             # 商品資料管理 Hook
│   └── __tests__/                 # Hook 測試
│       └── useProducts.test.ts
└── pages/                          # 展示層
    ├── ProductList.tsx            # 重構後的商品列表元件
    └── __tests__/                # 元件測試
        └── ProductListRefactored.test.tsx
```

## 各層職責說明

### 1. 領域層 (Domain Layer)
- **Product.ts**: 定義商品的核心屬性和行為
- **Repository.ts**: 定義 Repository 模式的通用類型
- **ProductRepository.ts**: 定義商品資料存取的契約

### 2. 基礎設施層 (Infrastructure Layer)
- **SupabaseProductRepository.ts**: 實作與 Supabase 的資料互動
- **container.ts**: 管理依賴注入

### 3. 應用層 (Application Layer)
- **useProducts.ts**: 管理商品資料的狀態和業務邏輯

### 4. 展示層 (Presentation Layer)
- **ProductList.tsx**: 純 UI 元件，只負責渲染

## 使用方式

### 基本使用
```typescript
import { useProducts } from '@/hooks/useProducts'

function ProductList() {
  const { products, loading, error, refetch } = useProducts()
  
  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} onRetry={refetch} />
  
  return <ProductGrid products={products} />
}
```

### 使用自定義 Repository
```typescript
import { useProducts } from '@/hooks/useProducts'
import { MockProductRepository } from '@/test/mocks/MockProductRepository'

function TestComponent() {
  const mockRepository = new MockProductRepository()
  const { products, loading, error } = useProducts(mockRepository)
  
  // 測試邏輯...
}
```

### 使用依賴注入
```typescript
import { container } from '@/infrastructure/container'
import { ProductRepository } from '@/domain/repositories/ProductRepository'

function App() {
  const productRepository = container.resolve<ProductRepository>('ProductRepository')
  const { products } = useProducts(productRepository)
  
  // 應用邏輯...
}
```

## SOLID 原則應用

### 1. 單一職責原則 (SRP)
- `ProductList`: 只負責 UI 渲染
- `useProducts`: 只負責商品資料狀態管理
- `SupabaseProductRepository`: 只負責與 Supabase 的資料互動

### 2. 開閉原則 (OCP)
- 可以輕鬆添加新的 Repository 實作（如 GraphQL、REST API）
- 可以擴展 `useProducts` Hook 的功能而不修改現有程式碼

### 3. 里氏替換原則 (LSP)
- 任何 `ProductRepository` 的實作都可以替換其他實作
- Mock Repository 可以完全替換真實 Repository

### 4. 介面隔離原則 (ISP)
- `ProductRepository` 介面只包含商品相關的方法
- 客戶端只依賴它需要的介面

### 5. 依賴反轉原則 (DIP)
- 高層模組（Hook、元件）不依賴低層模組（Supabase）
- 兩者都依賴抽象（Repository 介面）

## 測試策略

### 1. 單元測試
- **Hook 測試**: 測試 `useProducts` 的各種狀態和行為
- **Repository 測試**: 測試 `SupabaseProductRepository` 的資料存取邏輯
- **元件測試**: 測試 `ProductList` 的 UI 行為

### 2. 整合測試
- 測試 Hook 與 Repository 的整合
- 測試元件與 Hook 的整合

### 3. Mock 策略
- 使用 Mock Repository 進行單元測試
- 使用 Mock Hook 進行元件測試

## 擴展指南

### 添加新功能
1. 在 `ProductRepository` 介面中添加新方法
2. 在 `SupabaseProductRepository` 中實作新方法
3. 在 `useProducts` Hook 中暴露新功能
4. 在元件中使用新功能

### 替換資料來源
1. 實作新的 Repository（如 `GraphQLProductRepository`）
2. 在依賴注入容器中註冊新實作
3. 無需修改其他層的程式碼

### 添加快取
1. 建立 `CachedProductRepository` 包裝器
2. 在容器中註冊包裝器
3. 透明地為所有 Repository 添加快取功能

## 最佳實踐

### 1. 錯誤處理
- 使用統一的錯誤類型
- 提供有意義的錯誤訊息
- 實現重試機制

### 2. 狀態管理
- 使用 React Hook 管理本地狀態
- 避免不必要的重新渲染
- 使用 `useCallback` 和 `useMemo` 優化效能

### 3. 類型安全
- 使用 TypeScript 確保類型安全
- 定義清晰的介面和類型
- 避免使用 `any` 類型

### 4. 測試覆蓋
- 確保所有公共方法都有測試
- 測試錯誤情況和邊界條件
- 使用有意義的測試描述

## 遷移指南

### 從舊版本遷移
1. 安裝新的依賴（如果有的話）
2. 更新 import 語句
3. 替換直接使用 Supabase 的程式碼
4. 更新測試檔案
5. 驗證功能正常運作

### 向後相容性
- 保持原有的 API 介面
- 提供遷移工具或指南
- 逐步遷移，避免破壞性變更

## 效能考量

### 1. 懶載入
- 使用 `React.lazy` 懶載入元件
- 使用 `useMemo` 快取計算結果

### 2. 分頁
- 實作分頁載入
- 使用虛擬滾動處理大量資料

### 3. 快取
- 實作適當的快取策略
- 使用 React Query 或 SWR 管理伺服器狀態

## 監控和日誌

### 1. 錯誤監控
- 整合 Sentry 或其他錯誤監控服務
- 記錄 Repository 層的錯誤

### 2. 效能監控
- 監控 API 呼叫的響應時間
- 追蹤元件渲染效能

### 3. 使用者行為
- 追蹤使用者互動
- 分析載入時間和錯誤率

## 結論

這次重構成功地將緊耦合的程式碼轉換為遵循 SOLID 原則的架構，提高了程式碼的可測試性、可維護性和可擴展性。新的架構為未來的功能擴展和維護提供了堅實的基礎。
