# 重構計劃總覽

本目錄包含程式碼重構的分析報告和詳細的重構步驟文件。

## 文件結構

- `refactoring-analysis.md` - 完整的程式碼分析報告，包含所有發現的問題和改進建議
- `refactoring-inventory-service.md` - 實作 InventoryService 並重構 CartContext 的詳細步驟
- `refactoring-order-domain-model.md` - 統一類型定義並建立 Order 領域模型的詳細步驟
- `refactoring-deduct-inventory-with-order.md` - 實作 deductInventoryWithOrder 方法的詳細步驟

## 重構優先級

### 高優先級（建議優先執行）

1. **實作 InventoryService 並重構 CartContext**
   - 文件：`refactoring-inventory-service.md`
   - 目標：分離業務邏輯與 UI 邏輯，提高可測試性
   - 預估時間：4-6 小時

2. **統一類型定義並建立 Order 領域模型**
   - 文件：`refactoring-order-domain-model.md`
   - 目標：消除類型重複，提高型別安全性
   - 預估時間：2-3 小時

3. **實作 deductInventoryWithOrder 方法**
   - 文件：`refactoring-deduct-inventory-with-order.md`
   - 目標：實現真正的原子性操作
   - 預估時間：4-6 小時

### 中優先級（後續執行）

4. 提取 Repository 錯誤處理輔助函數
5. 建立錯誤代碼常數定義
6. 確認並實作 SQL 函數

### 低優先級（未來考慮）

7. 提取分頁查詢邏輯
8. 添加架構文件
9. 效能優化

## 重構執行建議

### 執行順序

建議按照以下順序執行重構：

1. **第一步：統一類型定義**（`refactoring-order-domain-model.md`）
   - 這是基礎工作，為後續重構奠定基礎
   - 風險較低，主要是 import 路徑的修改

2. **第二步：實作 InventoryService**（`refactoring-inventory-service.md`）
   - 依賴第一步的 Order 類型定義
   - 這是核心業務邏輯的重構

3. **第三步：實作 deductInventoryWithOrder**（`refactoring-deduct-inventory-with-order.md`）
   - 依賴前兩步的完成
   - 實現真正的原子性操作

### 執行原則

1. **逐步進行**：每個步驟完成後都要驗證，不要一次性修改所有檔案
2. **測試優先**：確保每個步驟都有對應的測試驗證
3. **保留備份**：在修改重要檔案前，先 commit 當前狀態
4. **分支開發**：建議使用 Git 分支進行重構，確保可以快速回滾

### 風險控制

1. **使用 Git 分支**：為每個重構項目建立獨立分支
2. **小步提交**：每個步驟完成後立即 commit
3. **測試覆蓋**：確保測試覆蓋率不降低
4. **回滾準備**：每個重構文件都包含詳細的回滾方案

## 重構檢查清單

執行重構時，請確認：

- [ ] 已閱讀完整的分析報告
- [ ] 已理解重構目標和步驟
- [ ] 已建立 Git 分支
- [ ] 已執行現有測試並確認通過
- [ ] 已準備回滾方案
- [ ] 每個步驟完成後都執行測試驗證
- [ ] 重構完成後執行完整測試套件
- [ ] 更新相關文檔（如有需要）

## 相關文件

- [需求文件](../feature/basic/requirement-user-stories.md)
- [解決方案](../feature/inventory-management/solution.md)
- [實作設計](../feature/inventory-management/implementation.md)
- [SQL 實作](../feature/inventory-management/sql-implementation.md)

## 問題回報

如果在執行重構過程中遇到問題，請：

1. 檢查對應的重構文件中的「風險」和「回滾方案」章節
2. 確認是否按照步驟執行
3. 檢查測試是否通過
4. 如果問題持續，考慮回滾到上一個穩定狀態

## 後續工作

完成高優先級重構後，可以考慮：

1. 實作中優先級的改進項目
2. 添加更多的單元測試和整合測試
3. 優化程式碼結構
4. 添加架構文檔
5. 效能優化和監控

