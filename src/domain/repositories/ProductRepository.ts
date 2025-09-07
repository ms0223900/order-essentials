import { CreateProductRequest, Product, UpdateProductRequest, UpdateStockRequest } from '../types/Product'
import { PaginationOptions, RepositoryResult } from '../types/Repository'

export interface InventoryDeductionRequest {
  productId: string
  quantity: number
}

export interface InventoryDeductionResult {
  success: boolean
  productId?: string
  productName?: string
  previousStock?: number
  newStock?: number
  quantityDeducted?: number
  error?: string
  errorCode?: string
}

export interface BatchInventoryDeductionResult {
  success: boolean
  message?: string
  results?: InventoryDeductionResult[]
  error?: string
  errorCode?: string
}

export interface InventoryAvailabilityResult {
  available: boolean
  message?: string
  unavailableItems?: Array<{
    productId: string
    currentStock?: number
    requestedQuantity?: number
    error: string
    errorCode: string
  }>
  error?: string
  errorCode?: string
}

export interface ProductRepository {
  getAll(options?: PaginationOptions): Promise<RepositoryResult<Product[]>>
  getById(id: string): Promise<RepositoryResult<Product>>
  create(product: CreateProductRequest): Promise<RepositoryResult<Product>>
  update(product: UpdateProductRequest): Promise<RepositoryResult<Product>>
  delete(id: string): Promise<RepositoryResult<void>>
  updateStock(request: UpdateStockRequest): Promise<RepositoryResult<Product>>
  getByCategory(category: string, options?: PaginationOptions): Promise<RepositoryResult<Product[]>>
  search(query: string, options?: PaginationOptions): Promise<RepositoryResult<Product[]>>

  // 庫存管理相關方法
  deductInventory(request: InventoryDeductionRequest): Promise<RepositoryResult<InventoryDeductionResult>>
  deductInventoryBatch(requests: InventoryDeductionRequest[]): Promise<RepositoryResult<BatchInventoryDeductionResult>>
  checkInventoryAvailability(requests: InventoryDeductionRequest[]): Promise<RepositoryResult<InventoryAvailabilityResult>>
}
