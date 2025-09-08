import { ProductRepository } from '@/domain/repositories/ProductRepository'
import { SupabaseProductRepository } from '@/infrastructure/repositories/SupabaseProductRepository'
import { OrderRepository } from '@/domain/repositories/OrderRepository'
import { SupabaseOrderRepository } from '@/infrastructure/repositories/SupabaseOrderRepository'

/**
 * 依賴注入容器
 * 
 * 遵循依賴反轉原則 (DIP) - 提供統一的依賴管理
 * 遵循單一職責原則 (SRP) - 只負責依賴的註冊和解析
 */
class DIContainer {
  private services = new Map<string, any>()

  /**
   * 註冊服務
   */
  register<T>(key: string, factory: () => T): void {
    this.services.set(key, factory)
  }

  /**
   * 解析服務
   */
  resolve<T>(key: string): T {
    const factory = this.services.get(key)
    if (!factory) {
      throw new Error(`Service ${key} not found`)
    }
    return factory()
  }

  /**
   * 檢查服務是否已註冊
   */
  has(key: string): boolean {
    return this.services.has(key)
  }
}

// 建立全域容器實例
export const container = new DIContainer()

// 註冊服務
container.register<ProductRepository>('ProductRepository', () => {
  return new SupabaseProductRepository()
})

container.register<OrderRepository>('OrderRepository', () => {
  return new SupabaseOrderRepository()
})

// 導出容器和類型
export { DIContainer }
export type { ProductRepository, OrderRepository }

