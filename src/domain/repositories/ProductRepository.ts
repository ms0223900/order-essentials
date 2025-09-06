import { CreateProductRequest, Product, UpdateProductRequest, UpdateStockRequest } from '../types/Product'
import { PaginationOptions, RepositoryResult } from '../types/Repository'

export interface ProductRepository {
  getAll(options?: PaginationOptions): Promise<RepositoryResult<Product[]>>
  getById(id: string): Promise<RepositoryResult<Product>>
  create(product: CreateProductRequest): Promise<RepositoryResult<Product>>
  update(product: UpdateProductRequest): Promise<RepositoryResult<Product>>
  delete(id: string): Promise<RepositoryResult<void>>
  updateStock(request: UpdateStockRequest): Promise<RepositoryResult<Product>>
  getByCategory(category: string, options?: PaginationOptions): Promise<RepositoryResult<Product[]>>
  search(query: string, options?: PaginationOptions): Promise<RepositoryResult<Product[]>>
}
