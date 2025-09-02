import { http, HttpResponse } from 'msw'

// 模擬產品資料
export const products = [
    {
        id: 1,
        name: '無線藍牙耳機',
        price: 1299,
        description: '高品質無線藍牙耳機，支援降噪功能',
        image: '/headphones-hero.jpg',
        category: 'electronics'
    },
    {
        id: 2,
        name: '智慧手錶',
        price: 2999,
        description: '多功能智慧手錶，健康監測與通知',
        image: '/placeholder.svg',
        category: 'electronics'
    }
]

// 模擬購物車資料
export const cartItems = [
    {
        id: 1,
        productId: 1,
        quantity: 2,
        product: products[0]
    }
]

// 模擬訂單資料
export const orders = [
    {
        id: 1,
        items: cartItems,
        total: 2598,
        status: 'pending',
        createdAt: new Date().toISOString()
    }
]

export const handlers = [
    // 產品相關 API
    http.get('/api/products', () => {
        return HttpResponse.json(products)
    }),

    http.get('/api/products/:id', ({ params }) => {
        const product = products.find(p => p.id === Number(params.id))
        if (!product) {
            return new HttpResponse(null, { status: 404 })
        }
        return HttpResponse.json(product)
    }),

    // 購物車相關 API
    http.get('/api/cart', () => {
        return HttpResponse.json(cartItems)
    }),

    http.post('/api/cart', async ({ request }) => {
        const body = await request.json()
        return HttpResponse.json({ success: true, item: body })
    }),

    http.put('/api/cart/:id', async ({ params, request }) => {
        const body = await request.json() as Record<string, any>
        return HttpResponse.json({ success: true, item: { id: params.id, ...body } })
    }),

    http.delete('/api/cart/:id', ({ params }) => {
        return HttpResponse.json({ success: true, id: params.id })
    }),

    // 訂單相關 API
    http.get('/api/orders', () => {
        return HttpResponse.json(orders)
    }),

    http.post('/api/orders', async ({ request }) => {
        const body = await request.json() as Record<string, any>
        const newOrder = {
            id: orders.length + 1,
            ...body,
            createdAt: new Date().toISOString()
        }
        return HttpResponse.json(newOrder)
    })
]
