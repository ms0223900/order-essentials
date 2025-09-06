import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useCart } from '@/contexts/CartContext'
import { Product, PRODUCT_CATEGORY_LABELS } from '@/domain/types/Product'
import { useToast } from '@/hooks/use-toast'
import { useProducts } from '@/hooks/useProducts'
import { AlertCircle, RefreshCw, ShoppingCart } from 'lucide-react'
import { Link } from 'react-router-dom'

/**
 * 商品列表元件
 * 
 * 重構後的特點：
 * 1. 遵循單一職責原則 - 只負責 UI 渲染
 * 2. 遵循依賴反轉原則 - 透過 Hook 取得資料，不直接依賴 Supabase
 * 3. 更好的錯誤處理和載入狀態管理
 * 4. 更容易測試和維護
 */
export default function ProductList() {
  const { addToCart } = useCart()
  const { toast } = useToast()
  
  // 使用自定義 Hook 管理商品資料
  const { 
    products, 
    loading, 
    error, 
    refetch 
  } = useProducts()

  /**
   * 處理加入購物車
   */
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

  /**
   * 處理重新載入
   */
  const handleRetry = async () => {
    await refetch()
  }

  /**
   * 格式化價格顯示
   */
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(price)
  }

  /**
   * 取得商品類別顯示名稱
   */
  const getCategoryLabel = (category: string) => {
    return PRODUCT_CATEGORY_LABELS[category as keyof typeof PRODUCT_CATEGORY_LABELS] || category
  }

  /**
   * 載入中狀態
   */
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

  /**
   * 錯誤狀態
   */
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-primary">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-12 h-12 text-red-400" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-2">載入失敗</h3>
            <p className="text-white/60 mb-6">{error}</p>
            <Button 
              onClick={handleRetry}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              重新載入
            </Button>
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
                      {getCategoryLabel(product.category)}
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