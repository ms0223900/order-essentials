import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import { Navbar } from '../Navbar'

describe('Navbar', () => {
    beforeEach(() => {
        // 設定測試環境
    })

    it('應該渲染導航欄標題', () => {
        render(<Navbar />)
        expect(screen.getByText(/lovable/i)).toBeInTheDocument()
    })

    it('應該包含購物車連結', () => {
        render(<Navbar />)
        const cartLink = screen.getByRole('link', { name: /購物車/i })
        expect(cartLink).toBeInTheDocument()
    })

    it('應該包含訂單連結', () => {
        render(<Navbar />)
        const ordersLink = screen.getByRole('link', { name: /訂單/i })
        expect(ordersLink).toBeInTheDocument()
    })

    it('應該顯示購物車商品數量', () => {
        render(<Navbar />)
        // 這裡可以測試購物車數量的顯示邏輯
        expect(screen.getByTestId('cart-count')).toBeInTheDocument()
    })
})
