import { ProductRepository } from '@/domain/repositories/ProductRepository'
import { CreateProductRequest, Product, UpdateProductRequest, UpdateStockRequest } from '@/domain/types/Product'
import { PaginationOptions, RepositoryResult } from '@/domain/types/Repository'
import { supabase } from '@/integrations/supabase/client'

/**
 * Supabase 商品資料存取實作
 * 
 * 遵循單一職責原則 (SRP) - 只負責與 Supabase 的資料互動
 * 遵循開閉原則 (OCP) - 對擴展開放，對修改封閉
 * 遵循里氏替換原則 (LSP) - 可以替換任何 ProductRepository 實作
 */
export class SupabaseProductRepository implements ProductRepository {
  private readonly tableName = 'products'

  /**
   * 取得所有商品
   */
  async getAll(options?: PaginationOptions): Promise<RepositoryResult<Product[]>> {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false })

      // 應用分頁
      if (options?.page && options?.limit) {
        const from = (options.page - 1) * options.limit
        const to = from + options.limit - 1
        query = query.range(from, to)
      }

      // 應用排序
      if (options?.sortBy) {
        query = query.order(options.sortBy, { 
          ascending: options.sortOrder === 'asc' 
        })
      }

      const { data, error } = await query

      if (error) {
        return {
          data: null,
          error: {
            message: `取得商品列表失敗: ${error.message}`,
            code: error.code,
            details: error
          }
        }
      }

      return {
        data: data || [],
        error: null
      }
    } catch (error) {
      return {
        data: null,
        error: {
          message: '取得商品列表時發生未預期的錯誤',
          code: 'UNEXPECTED_ERROR',
          details: error
        }
      }
    }
  }

  /**
   * 根據 ID 取得商品
   */
  async getById(id: string): Promise<RepositoryResult<Product>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        return {
          data: null,
          error: {
            message: `取得商品失敗: ${error.message}`,
            code: error.code,
            details: error
          }
        }
      }

      if (!data) {
        return {
          data: null,
          error: {
            message: '商品不存在',
            code: 'NOT_FOUND'
          }
        }
      }

      return {
        data,
        error: null
      }
    } catch (error) {
      return {
        data: null,
        error: {
          message: '取得商品時發生未預期的錯誤',
          code: 'UNEXPECTED_ERROR',
          details: error
        }
      }
    }
  }

  /**
   * 建立新商品
   */
  async create(product: CreateProductRequest): Promise<RepositoryResult<Product>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .insert([product])
        .select()
        .single()

      if (error) {
        return {
          data: null,
          error: {
            message: `建立商品失敗: ${error.message}`,
            code: error.code,
            details: error
          }
        }
      }

      return {
        data,
        error: null
      }
    } catch (error) {
      return {
        data: null,
        error: {
          message: '建立商品時發生未預期的錯誤',
          code: 'UNEXPECTED_ERROR',
          details: error
        }
      }
    }
  }

  /**
   * 更新商品
   */
  async update(product: UpdateProductRequest): Promise<RepositoryResult<Product>> {
    try {
      const { id, ...updateData } = product
      
      const { data, error } = await supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return {
          data: null,
          error: {
            message: `更新商品失敗: ${error.message}`,
            code: error.code,
            details: error
          }
        }
      }

      return {
        data,
        error: null
      }
    } catch (error) {
      return {
        data: null,
        error: {
          message: '更新商品時發生未預期的錯誤',
          code: 'UNEXPECTED_ERROR',
          details: error
        }
      }
    }
  }

  /**
   * 刪除商品
   */
  async delete(id: string): Promise<RepositoryResult<void>> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)

      if (error) {
        return {
          data: null,
          error: {
            message: `刪除商品失敗: ${error.message}`,
            code: error.code,
            details: error
          }
        }
      }

      return {
        data: undefined,
        error: null
      }
    } catch (error) {
      return {
        data: null,
        error: {
          message: '刪除商品時發生未預期的錯誤',
          code: 'UNEXPECTED_ERROR',
          details: error
        }
      }
    }
  }

  /**
   * 更新商品庫存
   */
  async updateStock(request: UpdateStockRequest): Promise<RepositoryResult<Product>> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update({ stock: request.quantity })
        .eq('id', request.id)
        .select()
        .single()

      if (error) {
        return {
          data: null,
          error: {
            message: `更新庫存失敗: ${error.message}`,
            code: error.code,
            details: error
          }
        }
      }

      return {
        data,
        error: null
      }
    } catch (error) {
      return {
        data: null,
        error: {
          message: '更新庫存時發生未預期的錯誤',
          code: 'UNEXPECTED_ERROR',
          details: error
        }
      }
    }
  }

  /**
   * 根據類別取得商品
   */
  async getByCategory(category: string, options?: PaginationOptions): Promise<RepositoryResult<Product[]>> {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: false })

      // 應用分頁
      if (options?.page && options?.limit) {
        const from = (options.page - 1) * options.limit
        const to = from + options.limit - 1
        query = query.range(from, to)
      }

      const { data, error } = await query

      if (error) {
        return {
          data: null,
          error: {
            message: `取得類別商品失敗: ${error.message}`,
            code: error.code,
            details: error
          }
        }
      }

      return {
        data: data || [],
        error: null
      }
    } catch (error) {
      return {
        data: null,
        error: {
          message: '取得類別商品時發生未預期的錯誤',
          code: 'UNEXPECTED_ERROR',
          details: error
        }
      }
    }
  }

  /**
   * 搜尋商品
   */
  async search(query: string, options?: PaginationOptions): Promise<RepositoryResult<Product[]>> {
    try {
      let supabaseQuery = supabase
        .from(this.tableName)
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .order('created_at', { ascending: false })

      // 應用分頁
      if (options?.page && options?.limit) {
        const from = (options.page - 1) * options.limit
        const to = from + options.limit - 1
        supabaseQuery = supabaseQuery.range(from, to)
      }

      const { data, error } = await supabaseQuery

      if (error) {
        return {
          data: null,
          error: {
            message: `搜尋商品失敗: ${error.message}`,
            code: error.code,
            details: error
          }
        }
      }

      return {
        data: data || [],
        error: null
      }
    } catch (error) {
      return {
        data: null,
        error: {
          message: '搜尋商品時發生未預期的錯誤',
          code: 'UNEXPECTED_ERROR',
          details: error
        }
      }
    }
  }
}
