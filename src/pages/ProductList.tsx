import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCart } from '@/contexts/CartContext'
import { useToast } from '@/hooks/use-toast'
import { ShoppingCart, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

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
  const [error, setError] = useState<string | null>(null)
  const { addToCart } = useCart()
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入商品時發生錯誤')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1)
    toast({
      title: "已加入購物車",
      description: `${product.name} x1`,
    })
  }

  const handleViewProduct = (productId: string) => {
    navigate(`/product/${productId}`)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-48 bg-muted rounded-md"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-4">載入失敗</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchProducts}>重新載入</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-center mb-2">商品列表</h1>
        <p className="text-muted-foreground text-center">探索我們精選的優質商品</p>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">暫無商品</h2>
          <p className="text-muted-foreground">目前沒有可顯示的商品</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="group hover:shadow-lg transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm">
              <CardHeader className="p-0">
                <div 
                  className="relative overflow-hidden rounded-t-lg cursor-pointer"
                  onClick={() => handleViewProduct(product.id)}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg'
                    }}
                  />
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                      {product.category}
                    </Badge>
                  </div>
                  {product.stock <= 5 && product.stock > 0 && (
                    <div className="absolute top-2 left-2">
                      <Badge variant="warning" className="bg-warning/80 backdrop-blur-sm">
                        僅剩 {product.stock} 件
                      </Badge>
                    </div>
                  )}
                  {product.stock === 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Badge variant="destructive">已售完</Badge>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="p-4">
                <h3 
                  className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors cursor-pointer"
                  onClick={() => handleViewProduct(product.id)}
                >
                  {product.name}
                </h3>
                <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                  {product.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">
                    NT$ {product.price.toLocaleString()}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    庫存: {product.stock}
                  </span>
                </div>
              </CardContent>
              
              <CardFooter className="p-4 pt-0 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewProduct(product.id)}
                  className="flex-1"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  查看詳情
                </Button>
                <Button
                  onClick={() => handleAddToCart(product)}
                  disabled={product.stock === 0}
                  size="sm"
                  className="flex-1"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  加入購物車
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}