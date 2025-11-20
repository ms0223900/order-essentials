# 任務：建立整合的訂單建立與庫存扣減函數

## 任務描述
在 Supabase 資料庫中建立一個新的整合函數 `create_order_with_inventory_deduction`，將訂單建立和庫存扣減整合在單一資料庫交易中，確保資料一致性和原子性操作。

## 輸入格式
- **函數名稱**: `create_order_with_inventory_deduction`
- **參數**:
  - `p_customer_name TEXT` - 顧客姓名
  - `p_customer_phone TEXT` - 顧客電話
  - `p_customer_address TEXT` - 顧客地址
  - `p_items JSON` - 商品項目清單，格式為 `[{"product_id": "uuid", "quantity": 1}, ...]`

## 輸出格式
JSON 物件，包含以下欄位：
```json
{
  "success": boolean,
  "order_id": "uuid", // 成功時返回
  "order_number": "string", // 成功時返回
  "total_amount": number, // 成功時返回
  "inventory_results": [ // 庫存扣減結果
    {
      "product_id": "uuid",
      "product_name": "string",
      "previous_stock": number,
      "new_stock": number,
      "quantity_deducted": number
    }
  ],
  "error": "string", // 失敗時返回
  "error_code": "string" // 失敗時返回
}
```

## 處理流程
1. 驗證輸入參數格式
2. 檢查所有商品的庫存可用性
3. 計算訂單總金額
4. 產生 UUID 訂單編號
5. 在單一交易中：
   - 建立訂單記錄
   - 建立訂單項目
   - 批量扣除庫存
6. 返回成功結果或回滾整個交易

## 驗收條件
- [ ] 函數能夠成功建立訂單並扣除庫存
- [ ] 當庫存不足時，整個交易會回滾，不會建立訂單
- [ ] 當商品不存在時，返回適當錯誤訊息
- [ ] 所有操作在單一資料庫交易中完成
- [ ] 訂單編號使用 UUID 格式並保證唯一
- [ ] 訂單初始狀態設定為 'confirmed'（已成立）
- [ ] 能夠處理批量商品訂單
- [ ] 錯誤情況下返回詳細的錯誤資訊

## 依賴關係
- **前置依賴**: 無（需要現有的商品和訂單資料表）
- **後續依賴**:
  - 02-test-database-function（測試此函數）
  - 05-implement-repository-method（呼叫此函數）
