import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@/test/utils/test-utils'
import ProductPage from '@/pages/Product'

// 模擬 useToast hook
const mockToast = vi.fn()
vi.mock('@/hooks/use-toast', () => ({
    useToast: vi.fn(() => ({
        toast: mockToast
    }))
}))

describe('Product Page Interaction', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        render(<ProductPage />)
    })

    it('應該能夠增加商品數量', () => {
        const plusButton = screen.getAllByRole('button', { name: '' })[1]
        const quantityDisplay = screen.getByText('1')

        expect(quantityDisplay).toHaveTextContent('1')

        fireEvent.click(plusButton)
        expect(quantityDisplay).toHaveTextContent('2')

        fireEvent.click(plusButton)
        expect(quantityDisplay).toHaveTextContent('3')
    })

    it('應該能夠減少商品數量但不低於1', () => {
        const minusButton = screen.getAllByRole('button', { name: '' })[0]
        const plusButton = screen.getAllByRole('button', { name: '' })[1]
        const quantityDisplay = screen.getByText('1')

        // 先增加數量到2
        fireEvent.click(plusButton)
        expect(quantityDisplay).toHaveTextContent('2')

        // 再減少數量到1
        fireEvent.click(minusButton)
        expect(quantityDisplay).toHaveTextContent('1')

        // 嘗試再減少，數量應該還是1
        fireEvent.click(minusButton)
        expect(quantityDisplay).toHaveTextContent('1')
    })

    it('應該能夠計算正確的小計金額', () => {
        const plusButton = screen.getAllByRole('button', { name: '' })[1]

        // 初始小計應為單價
        expect(screen.getAllByText('NT$ 2,999')).toHaveLength(2)

        // 增加數量到2，小計應為單價的2倍
        fireEvent.click(plusButton)
        expect(screen.getByText('NT$ 5,998')).toBeInTheDocument()

        // 增加數量到3，小計應為單價的3倍
        fireEvent.click(plusButton)
        expect(screen.getByText('NT$ 8,997')).toBeInTheDocument()
    })

    it('應該能夠將商品加入購物車並顯示提示', () => {
        const addToCartButton = screen.getByRole('button', { name: /加入購物車/i })

        fireEvent.click(addToCartButton)

        // 驗證 toast 函數被呼叫
        expect(mockToast).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "已加入購物車",
                description: "Premium 無線藍牙耳機 x1"
            })
        )
    })

    it('應該能夠調整數量後加入購物車', () => {
        const plusButton = screen.getAllByRole('button', { name: '' })[1]
        const addToCartButton = screen.getByRole('button', { name: /加入購物車/i })

        // 增加數量到3
        fireEvent.click(plusButton)
        fireEvent.click(plusButton)

        // 加入購物車
        fireEvent.click(addToCartButton)

        // 驗證 toast 函數被呼叫，且數量為3
        expect(mockToast).toHaveBeenCalledTimes(1)
        expect(mockToast).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "已加入購物車",
                description: "Premium 無線藍牙耳機 x3"
            })
        )
    })
})
