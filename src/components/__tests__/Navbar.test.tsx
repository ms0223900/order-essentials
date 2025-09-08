import Navbar from '@/components/Navbar'
import { render, screen } from '@/test/utils/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'

describe('Navbar', () => {
    beforeEach(() => {
        // 設定測試環境
    })

    it('應該渲染導航欄標題', () => {
        render(<Navbar />)
        expect(screen.getByText(/TechStore/i)).toBeInTheDocument()
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
})
