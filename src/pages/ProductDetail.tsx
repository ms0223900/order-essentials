import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Plus, Minus, ShoppingCart, Star } from 'lucide-react'
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

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
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
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .maybeSingle()

      if (error) {
        console.error('Error fetching product:', error)
        toast({
          title: "載入失敗",
          description: "無法載入商品資訊，請稍後再試",
          variant: "destructive"
        })
        return
      }

      if (!data) {
        toast({
          title: "商品不存在",
          description: "找不到指定的商品",
          variant: "destructive"
        })
        return
      }

      setProduct(data)
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "載入失敗",
        description: "無法載入商品資訊，請稍後再試",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (!product) return
    
    const cartProduct = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      description: product.description,
      stock: product.stock
    }
    
    addToCart(cartProduct, quantity)
    toast({
      title: "已加入購物車",
      description: `${product.name} x${quantity}`
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(price)
  }

  const increaseQuantity = () => {
    if (product && quantity < product.stock) {
      setQuantity(prev => prev + 1)
    }
  }

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1)
    }
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

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-primary">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-4">商品不存在</h1>
            <Link to="/products">
              <Button variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                返回商品列表
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-primary">
      <div className="container mx-auto px-4 py-8">
        {/* 返回按鈕 */}
        <Link to="/products" className="inline-flex items-center text-white hover:text-white/80 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回商品列表
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* 商品圖片 */}
          <div className="aspect-square overflow-hidden rounded-2xl bg-white/10 backdrop-blur border border-white/20">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* 商品資訊 */}
          <div className="space-y-6">
            <div>
              <Badge 
                variant={product.category === 'electronics' ? 'default' : 'secondary'}
                className="mb-4 bg-white/20 text-white border-white/30"
              >
                {product.category === 'electronics' ? '電子產品' : '配件'}
              </Badge>
              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                {product.name}
              </h1>
              <div className="text-3xl font-bold text-white mb-6">
                {formatPrice(product.price)}
              </div>
            </div>

            <Card className="bg-white/10 backdrop-blur border-white/20 text-white">
              <CardContent className="p-6">
                <p className="text-white/90 text-lg leading-relaxed">
                  {product.description}
                </p>
              </CardContent>
            </Card>

            {/* 庫存資訊 */}
            <div className="text-white/80">
              <span className="text-sm">庫存: </span>
              <span className={`font-semibold ${product.stock > 10 ? 'text-green-400' : product.stock > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                {product.stock > 0 ? `${product.stock} 件` : '缺貨'}
              </span>
            </div>

            {/* 數量選擇 */}
            <div className="flex items-center space-x-4">
              <span className="text-white font-medium">數量:</span>
              <div className="flex items-center bg-white/10 backdrop-blur rounded-lg border border-white/20">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={decreaseQuantity}
                  disabled={quantity <= 1}
                  className="text-white hover:bg-white/20 border-0"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="px-4 py-2 text-white font-medium min-w-[3rem] text-center">
                  {quantity}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={increaseQuantity}
                  disabled={quantity >= product.stock}
                  className="text-white hover:bg-white/20 border-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* 小計 */}
            <div className="text-white">
              <span className="text-lg">小計: </span>
              <span className="text-2xl font-bold">
                {formatPrice(product.price * quantity)}
              </span>
            </div>

            {/* 購買按鈕 */}
            <Button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              size="lg"
              className="w-full bg-white text-primary hover:bg-white/90 text-lg font-semibold py-6"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              加入購物車
            </Button>

            {/* 評分 */}
            <div className="flex items-center space-x-1 text-white/80">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="ml-2 text-sm">(4.8/5.0)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}