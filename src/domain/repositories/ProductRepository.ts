import { CreateProductRequest, Product, UpdateProductRequest, UpdateStockRequest } from '../types/Product'
import { PaginationOptions, RepositoryResult } from '../types/Repository'

/**
 * 商品資料存取介面
 * 定義商品相關的資料操作契約
 * 
 * 遵循依賴反轉原則 (DIP) - 高層模組不依賴低層模組，兩者都依賴抽象
 * 遵循介面隔離原則 (ISP) - 客戶端不應該依賴它不需要的介面
 */
export interface ProductRepository {
  /**
   * 取得所有商品
   * @param options 分頁和排序選項
   * @returns Promise<RepositoryResult<Product[]>>
   */
  getAll(options?: PaginationOptions): Promise<RepositoryResult<Product[]>>

  /**
   * 根據 ID 取得商品
   * @param id 商品 ID
   * @returns Promise<RepositoryResult<Product>>
   */
  getById(id: string): Promise<RepositoryResult<Product>>

  /**
   * 建立新商品
   * @param product 商品資料
   * @returns Promise<RepositoryResult<Product>>
   */
  create(product: CreateProductRequest): Promise<RepositoryResult<Product>>

  /**
   * 更新商品
   * @param product 商品資料
   * @returns Promise<RepositoryResult<Product>>
   */
  update(product: UpdateProductRequest): Promise<RepositoryResult<Product>>

  /**
   * 刪除商品
   * @param id 商品 ID
   * @returns Promise<RepositoryResult<void>>
   */
  delete(id: string): Promise<RepositoryResult<void>>

  /**
   * 更新商品庫存
   * @param request 庫存更新請求
   * @returns Promise<RepositoryResult<Product>>
   */
  updateStock(request: UpdateStockRequest): Promise<RepositoryResult<Product>>

  /**
   * 根據類別取得商品
   * @param category 商品類別
   * @param options 分頁和排序選項
   * @returns Promise<RepositoryResult<Product[]>>
   */
  getByCategory(category: string, options?: PaginationOptions): Promise<RepositoryResult<Product[]>>

  /**
   * 搜尋商品
   * @param query 搜尋關鍵字
   * @param options 分頁和排序選項
   * @returns Promise<RepositoryResult<Product[]>>
   */
  search(query: string, options?: PaginationOptions): Promise<RepositoryResult<Product[]>>
}
