import { InventoryDeductionRequest } from '@/domain/repositories/ProductRepository'
import { SupabaseProductRepository } from '@/infrastructure/repositories/SupabaseProductRepository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        rpc: vi.fn()
    }
}))

// Import after mocking
import { supabase } from '@/integrations/supabase/client'

const mockSupabaseRpc = vi.mocked(supabase.rpc)

describe('SupabaseProductRepository - 庫存管理功能', () => {
    let repository: SupabaseProductRepository

    beforeEach(() => {
        vi.clearAllMocks()
        repository = new SupabaseProductRepository()
    })

    describe('deductInventoryBatch', () => {
        it('應該成功批量扣除多個商品庫存', async () => {
            // Given: 模擬成功的批量扣除回應
            const mockResult = {
                success: true,
                message: '所有商品庫存扣除成功',
                results: [
                    {
                        success: true,
                        product_id: 'product-1',
                        product_name: '商品1',
                        previous_stock: 10,
                        new_stock: 8,
                        quantity_deducted: 2
                    },
                    {
                        success: true,
                        product_id: 'product-2',
                        product_name: '商品2',
                        previous_stock: 5,
                        new_stock: 3,
                        quantity_deducted: 2
                    }
                ]
            }
            mockSupabaseRpc.mockResolvedValueOnce({
                data: mockResult,
                error: null
            })

            const requests: InventoryDeductionRequest[] = [
                { productId: 'product-1', quantity: 2 },
                { productId: 'product-2', quantity: 2 }
            ]

            // When: 調用批量扣除庫存方法
            const result = await repository.deductInventoryBatch(requests)

            // Then: 應該返回成功結果
            expect(result.error).toBeNull()
            expect(result.data).toEqual(mockResult)
            expect(mockSupabaseRpc).toHaveBeenCalledWith('deduct_inventory_batch', {
                items: ([
                    { product_id: 'product-1', quantity: 2 },
                    { product_id: 'product-2', quantity: 2 }
                ])
            })
        })

        it('應該處理批量扣除中的部分失敗', async () => {
            // Given: 模擬部分失敗的批量扣除回應
            const mockErrorResult = {
                success: false,
                error: '庫存不足',
                processed_items: [
                    {
                        success: true,
                        product_id: 'product-1',
                        product_name: '商品1',
                        previous_stock: 10,
                        new_stock: 8,
                        quantity_deducted: 2
                    }
                ]
            }
            mockSupabaseRpc.mockResolvedValueOnce({
                data: mockErrorResult,
                error: null
            })

            const requests: InventoryDeductionRequest[] = [
                { productId: 'product-1', quantity: 2 },
                { productId: 'product-2', quantity: 2 }
            ]

            // When: 調用批量扣除庫存方法
            const result = await repository.deductInventoryBatch(requests)

            // Then: 應該返回錯誤
            expect(result.data).toBeNull()
            expect(result.error?.message).toBe('庫存不足')
        })
    })

    describe('checkInventoryAvailability', () => {
        it('應該成功檢查多個商品的庫存可用性', async () => {
            // Given: 模擬庫存充足的檢查結果
            const mockResult = {
                available: true,
                message: '所有商品庫存充足'
            }
            mockSupabaseRpc.mockResolvedValueOnce({
                data: mockResult,
                error: null
            })

            const requests: InventoryDeductionRequest[] = [
                { productId: 'product-1', quantity: 2 },
                { productId: 'product-2', quantity: 2 }
            ]

            // When: 調用檢查庫存可用性方法
            const result = await repository.checkInventoryAvailability(requests)

            // Then: 應該返回成功結果
            expect(result.error).toBeNull()
            expect(result.data).toEqual(mockResult)
            expect(mockSupabaseRpc).toHaveBeenCalledWith('check_inventory_availability', {
                items: [
                    { product_id: 'product-1', quantity: 2 },
                    { product_id: 'product-2', quantity: 2 }
                ]
            })
        })

        it('應該檢測到庫存不足的商品', async () => {
            // Given: 模擬庫存不足的檢查結果
            const mockResult = {
                available: false,
                message: '部分商品庫存不足',
                unavailableItems: [
                    {
                        productId: 'product-2',
                        currentStock: 1,
                        requestedQuantity: 2,
                        error: '庫存不足',
                        errorCode: 'INSUFFICIENT_STOCK'
                    }
                ]
            }
            mockSupabaseRpc.mockResolvedValueOnce({
                data: mockResult,
                error: null
            })

            const requests: InventoryDeductionRequest[] = [
                { productId: 'product-1', quantity: 2 },
                { productId: 'product-2', quantity: 2 }
            ]

            // When: 調用檢查庫存可用性方法
            const result = await repository.checkInventoryAvailability(requests)

            // Then: 應該返回庫存不足的結果
            expect(result.error).toBeNull()
            expect(result.data?.available).toBe(false)
            expect(result.data?.unavailableItems).toHaveLength(1)
            expect(result.data?.unavailableItems?.[0].productId).toBe('product-2')
        })

        it('應該檢測到不存在的商品', async () => {
            // Given: 模擬商品不存在的檢查結果
            const mockResult = {
                available: false,
                message: '部分商品庫存不足',
                unavailableItems: [
                    {
                        productId: 'non-existent-product',
                        error: '商品不存在',
                        errorCode: 'PRODUCT_NOT_FOUND'
                    }
                ]
            }
            mockSupabaseRpc.mockResolvedValueOnce({
                data: mockResult,
                error: null
            })

            const requests: InventoryDeductionRequest[] = [
                { productId: 'non-existent-product', quantity: 1 }
            ]

            // When: 調用檢查庫存可用性方法
            const result = await repository.checkInventoryAvailability(requests)

            // Then: 應該返回商品不存在的結果
            expect(result.error).toBeNull()
            expect(result.data?.available).toBe(false)
            expect(result.data?.unavailableItems).toHaveLength(1)
            expect(result.data?.unavailableItems?.[0].error).toBe('商品不存在')
        })
    })
})