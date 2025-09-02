import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useCart } from '@/contexts/CartContext'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, ShoppingCart, Minus, Plus } from 'lucide-react'

interface Product {
  id: string
  name: string
  price: number
  description: string
  image: string
  category: string
  stock: number
}

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const { addToCart } = useCart()
  const { toast } = useToast()

  useEffect(() => {
    if (id) {
      fetchProduct(id)
    }
  }, [id])

  const fetchProduct = async (productId: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .maybeSingle()

      if (error) throw error
      if (!data) {
        setError('找不到該商品')
        return
      }
      setProduct(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入商品時發生錯誤')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (!product) return
    
    addToCart(product, quantity)
    toast({
      title: "已加入購物車",
      description: `${product.name} x${quantity}`,
    })
  }

  const incrementQuantity = () => {
    if (product && quantity < product.stock) {
      setQuantity(quantity + 1)
    }
  }

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-24 mb-6"></div>
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="h-96 bg-muted rounded-lg"></div>
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-3/4"></div>
              <div className="h-6 bg-muted rounded w-1/2"></div>
              <div className="h-20 bg-muted rounded"></div>
              <div className="h-10 bg-muted rounded w-1/3"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/products')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回商品列表
        </Button>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-4">載入失敗</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => navigate('/products')}>返回商品列表</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/products')}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        返回商品列表
      </Button>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* 商品圖片 */}
        <div className="space-y-4">
          <div className="aspect-square overflow-hidden rounded-lg">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg'
              }}
            />
          </div>
        </div>

        {/* 商品資訊 */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">{product.category}</Badge>
              {product.stock <= 5 && product.stock > 0 && (
                <Badge variant="warning">僅剩 {product.stock} 件</Badge>
              )}
              {product.stock === 0 && (
                <Badge variant="destructive">已售完</Badge>
              )}
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold mb-4">{product.name}</h1>
            <p className="text-3xl font-bold text-primary mb-4">
              NT$ {product.price.toLocaleString()}
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* 數量選擇 */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">數量</span>
                  <span className="text-sm text-muted-foreground">
                    庫存: {product.stock}
                  </span>
                </div>
                
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  
                  <span className="text-2xl font-semibold w-12 text-center">
                    {quantity}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={incrementQuantity}
                    disabled={quantity >= product.stock}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between text-lg">
                  <span className="font-medium">小計</span>
                  <span className="font-bold text-primary">
                    NT$ {(product.price * quantity).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 加入購物車按鈕 */}
          <Button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="w-full h-12 text-lg"
            size="lg"
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            {product.stock === 0 ? '已售完' : '加入購物車'}
          </Button>
        </div>
      </div>
    </div>
  )
}