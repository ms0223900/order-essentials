import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { CartProvider, Product } from '@/contexts/CartContext'

// 自定義測試渲染器，包含必要的 providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return (
        <BrowserRouter>
            <CartProvider>
                {children}
            </CartProvider>
        </BrowserRouter>
    )
}

const customRender = (
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// 重新匯出所有測試函數
export * from '@testing-library/react'
export { customRender as render }

// 測試用的常用資料
export const mockProduct: Product = {
    id: '1',
    name: '測試產品',
    price: 1000,
    description: '這是一個測試產品',
    image: '/test-image.jpg',
    stock: 10
}

export const mockCartItem = {
    id: 1,
    productId: 1,
    quantity: 2,
    product: mockProduct
}

// 模擬 localStorage
export const mockLocalStorage = () => {
    const store: Record<string, string> = {}

    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value
        },
        removeItem: (key: string) => {
            delete store[key]
        },
        clear: () => {
            Object.keys(store).forEach(key => delete store[key])
        }
    }
}

// 設定測試環境的 localStorage
export const setupLocalStorage = () => {
    Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage(),
        writable: true
    })
}
