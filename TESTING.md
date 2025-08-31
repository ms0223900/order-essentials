# 測試環境設定說明

這個專案已經配置了完整的測試環境，包括單元測試、整合測試和 E2E 測試。

## 🧪 測試架構

### 單元測試 & 整合測試
- **Vitest** - 測試執行器，與 Vite 完美整合
- **React Testing Library** - React 組件測試
- **jsdom** - DOM 環境模擬
- **MSW** - API 模擬

### E2E 測試
- **Playwright** - 跨瀏覽器 E2E 測試

## 🚀 快速開始

### 安裝依賴
```bash
npm install
```

### 安裝 Playwright 瀏覽器
```bash
npm run test:e2e:install
```

## 📝 執行測試

### 單元測試
```bash
# 執行所有測試（監聽模式）
npm run test

# 執行所有測試（一次性）
npm run test:run

# 執行測試並生成覆蓋率報告
npm run test:coverage

# 開啟測試 UI
npm run test:ui
```

### E2E 測試
```bash
# 執行所有 E2E 測試
npm run test:e2e

# 開啟 E2E 測試 UI
npm run test:e2e:ui
```

## 📁 測試檔案結構

```
src/
├── test/
│   ├── setup.ts              # 測試環境設定
│   ├── mocks/                # API 模擬
│   │   ├── handlers.ts       # API 處理器
│   │   └── server.ts         # MSW 伺服器
│   ├── utils/                # 測試工具
│   │   └── test-utils.tsx    # 測試渲染器
│   └── types/                # 測試類型定義
├── e2e/                      # E2E 測試
│   ├── navigation.spec.ts    # 導航測試
│   └── cart.spec.ts          # 購物車測試
└── components/__tests__/     # 組件測試
    └── Navbar.test.tsx       # Navbar 測試
```

## 🛠️ 測試工具函數

### 自定義測試渲染器
```tsx
import { render } from '@/test/utils/test-utils'

// 自動包含 Router 和 Context Providers
render(<YourComponent />)
```

### 模擬資料
```tsx
import { mockProduct, mockCartItem } from '@/test/utils/test-utils'
```

### localStorage 模擬
```tsx
import { setupLocalStorage } from '@/test/utils/test-utils'

beforeEach(() => {
  setupLocalStorage()
})
```

## 🔧 配置檔案

### Vitest 配置 (`vitest.config.ts`)
- 設定 jsdom 環境
- 配置路徑別名
- 設定覆蓋率報告

### Playwright 配置 (`playwright.config.ts`)
- 支援多瀏覽器測試
- 自動啟動開發伺服器
- 移動設備測試支援

## 📊 覆蓋率報告

執行 `npm run test:coverage` 後，覆蓋率報告會生成在 `coverage/` 目錄中。

## 🎯 最佳實踐

1. **測試命名**: 使用描述性的測試名稱，清楚說明測試目的
2. **測試隔離**: 每個測試應該獨立執行，不依賴其他測試
3. **模擬外部依賴**: 使用 MSW 模擬 API 呼叫
4. **測試資料**: 使用 `src/test/utils/test-utils.tsx` 中的模擬資料
5. **無障礙測試**: 使用 `getByRole` 等語義化查詢方法

## 🐛 常見問題

### 測試環境問題
- 確保已安裝所有依賴
- 檢查 Node.js 版本（建議 18+）

### MSW 問題
- 確保 `src/test/setup.ts` 正確配置
- 檢查 API 路徑是否與處理器匹配

### Playwright 問題
- 執行 `npm run test:e2e:install` 安裝瀏覽器
- 確保開發伺服器在 8080 端口運行

## 📚 相關資源

- [Vitest 官方文檔](https://vitest.dev/)
- [React Testing Library 文檔](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright 文檔](https://playwright.dev/)
- [MSW 文檔](https://mswjs.io/)
