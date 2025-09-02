import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import ProductPage from '@/pages/Product'

describe('Product Page', () => {
    beforeEach(() => {
        render(<ProductPage />)
    })

    it('應該顯示商品圖片', () => {
        const productImage = screen.getByRole('img', { name: 'Premium 無線藍牙耳機' })
        expect(productImage).toBeInTheDocument()
        expect(productImage).toHaveAttribute('src', '/headphones-hero.jpg')
        expect(productImage).toHaveAttribute('alt', 'Premium 無線藍牙耳機')
        expect(productImage).toHaveClass('w-full h-full object-cover')
    })

    it('應該顯示商品名稱', () => {
        const productName = screen.getByRole('heading', { name: 'Premium 無線藍牙耳機' })
        expect(productName).toBeInTheDocument()
        expect(productName).toHaveTextContent('Premium 無線藍牙耳機')
        expect(productName).toHaveClass('text-3xl lg:text-4xl font-bold')
    })

    it('應該顯示商品價格', () => {
        const productPrice = screen.getAllByText('NT$ 2,999');
        expect(productPrice).toHaveLength(2);
        expect(productPrice[0]).toHaveClass('text-3xl font-bold text-primary')
    })

    it('應該顯示商品簡介', () => {
        const productDescription = screen.getByText(/高品質無線藍牙耳機，採用先進的主動降噪技術/)
        expect(productDescription).toBeInTheDocument()
        expect(productDescription).toHaveClass('text-muted-foreground text-lg leading-relaxed')
        expect(productDescription).toHaveTextContent(
            '高品質無線藍牙耳機，採用先進的主動降噪技術，提供清晰純淨的音質體驗。續航力長達30小時，快充15分鐘可使用3小時。'
        )
    })

    it('應該同時顯示商品的圖片、名稱、價格和簡介', () => {
        // 圖片
        const productImage = screen.getByRole('img', { name: 'Premium 無線藍牙耳機' })
        expect(productImage).toBeInTheDocument()

        // 名稱
        const productName = screen.getByRole('heading', { name: 'Premium 無線藍牙耳機' })
        expect(productName).toBeInTheDocument()

        // 價格
        const productPrice = screen.getAllByText('NT$ 2,999')
        expect(productPrice).toHaveLength(2)

        // 簡介
        const productDescription = screen.getByText(/高品質無線藍牙耳機，採用先進的主動降噪技術/)
        expect(productDescription).toBeInTheDocument()
    })

    it('應該顯示商品特色列表', () => {
        const features = [
            '主動降噪技術',
            '30小時續航',
            '快充15分鐘使用3小時',
            '藍牙5.0連接',
            '舒適記憶泡棉',
            '一年保固服務'
        ]

        features.forEach(feature => {
            expect(screen.getByText(feature)).toBeInTheDocument()
        })
    })

    it('應該有數量調整功能', () => {
        const minusButton = screen.getAllByRole('button', { name: '' })[0]
        const plusButton = screen.getAllByRole('button', { name: '' })[1]
        const quantityDisplay = screen.getByText('1')

        expect(minusButton).toBeInTheDocument()
        expect(plusButton).toBeInTheDocument()
        expect(quantityDisplay).toBeInTheDocument()
    })

    it('應該有加入購物車按鈕', () => {
        const addToCartButton = screen.getByRole('button', { name: /加入購物車/i })
        expect(addToCartButton).toBeInTheDocument()
        expect(addToCartButton).toHaveTextContent('加入購物車')
    })
})
