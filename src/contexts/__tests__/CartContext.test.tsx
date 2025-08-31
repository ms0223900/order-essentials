import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CartProvider, useCart } from '../CartContext'
import { mockProduct, setupLocalStorage } from '@/test/utils/test-utils'

// 測試用的組件
const TestComponent = () => {
    const { state, addToCart, removeFromCart, updateQuantity, clearCart } = useCart()

    return (
        <div>
            <div data-testid="cart-count">{state.items.length}</div>
            <button onClick={() => addToCart(mockProduct, 1)}>Add to Cart</button>
            <button onClick={() => removeFromCart('1')}>Remove from Cart</button>
            <button onClick={() => updateQuantity('1', 3)}>Update Quantity</button>
            <button onClick={clearCart}>Clear Cart</button>
            {state.items.map(item => (
                <div key={item.product.id} data-testid={`cart-item-${item.product.id}`}>
                    {item.product.name} - Qty: {item.quantity}
                </div>
            ))}
        </div>
    )
}

describe('CartContext', () => {
    beforeEach(() => {
        setupLocalStorage()
        vi.clearAllMocks()
    })

    it('應該提供購物車狀態', () => {
        render(
            <CartProvider>
                <TestComponent />
            </CartProvider>
        )

        expect(screen.getByTestId('cart-count')).toHaveTextContent('0')
    })

    it('應該能添加商品到購物車', () => {
        render(
            <CartProvider>
                <TestComponent />
            </CartProvider>
        )

        const addButton = screen.getByText('Add to Cart')
        fireEvent.click(addButton)

        expect(screen.getByTestId('cart-count')).toHaveTextContent('1')
        expect(screen.getByTestId('cart-item-1')).toBeInTheDocument()
    })

    it('應該能從購物車移除商品', () => {
        render(
            <CartProvider>
                <TestComponent />
            </CartProvider>
        )

        // 先添加商品
        const addButton = screen.getByText('Add to Cart')
        fireEvent.click(addButton)

        // 再移除商品
        const removeButton = screen.getByText('Remove from Cart')
        fireEvent.click(removeButton)

        expect(screen.getByTestId('cart-count')).toHaveTextContent('0')
        expect(screen.queryByTestId('cart-item-1')).not.toBeInTheDocument()
    })

    it('應該能更新商品數量', () => {
        render(
            <CartProvider>
                <TestComponent />
            </CartProvider>
        )

        // 先添加商品
        const addButton = screen.getByText('Add to Cart')
        fireEvent.click(addButton)

        // 更新數量
        const updateButton = screen.getByText('Update Quantity')
        fireEvent.click(updateButton)

        expect(screen.getByTestId('cart-item-1')).toHaveTextContent('Qty: 3')
    })

    it('應該能清空購物車', () => {
        render(
            <CartProvider>
                <TestComponent />
            </CartProvider>
        )

        // 先添加商品
        const addButton = screen.getByText('Add to Cart')
        fireEvent.click(addButton)

        // 清空購物車
        const clearButton = screen.getByText('Clear Cart')
        fireEvent.click(clearButton)

        expect(screen.getByTestId('cart-count')).toHaveTextContent('0')
    })
})
