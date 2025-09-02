import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface Product {
  id: string
  name: string
  price: number
  description: string
  image: string
  category: string
  stock: number
}

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { addToCart } = useCart()
  const { toast } = useToast()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching products:', error)
        toast({
          title: "載入失敗",
          description: "無法載入商品列表，請稍後再試",
          variant: "destructive"
        })
        return
      }

      setProducts(data || [])
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "載入失敗",
        description: "無法載入商品列表，請稍後再試",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (product: Product) => {
    const cartProduct = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      description: product.description,
      stock: product.stock
    }
    
    addToCart(cartProduct, 1)
    toast({
      title: "已加入購物車",
      description: `${product.name} x1`
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(price)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-primary">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="text-white mt-4">載入中...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-primary">
      <div className="container mx-auto px-4 py-8">
        {/* 頁面標題 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            商品列表
          </h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            發現最新的科技產品，享受優質的購物體驗
          </p>
        </div>

        {/* 商品網格 */}
        {products.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="w-12 h-12 text-white/60" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-2">暫無商品</h3>
            <p className="text-white/60 mb-6">商品即將上架，敬請期待！</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="group hover:shadow-elegant transition-all duration-300 transform hover:-translate-y-1 bg-white/95 backdrop-blur border-white/20">
                <CardHeader className="p-0">
                  <div className="aspect-square overflow-hidden rounded-t-lg">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </CardHeader>
                
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {product.name}
                    </CardTitle>
                    <Badge variant={product.category === 'electronics' ? 'default' : 'secondary'} className="ml-2 shrink-0">
                      {product.category === 'electronics' ? '電子產品' : '配件'}
                    </Badge>
                  </div>
                  
                  <CardDescription className="text-muted-foreground line-clamp-2 mb-3">
                    {product.description}
                  </CardDescription>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-primary">
                      {formatPrice(product.price)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      庫存: {product.stock}
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="p-4 pt-0 flex gap-2">
                  <Link to={`/product/${product.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      查看詳情
                    </Button>
                  </Link>
                  <Button
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock === 0}
                    className="shrink-0"
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}