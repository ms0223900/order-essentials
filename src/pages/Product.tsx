import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import { Minus, Plus, ShoppingCart, Star, Check, Truck } from 'lucide-react';
import heroImage from '@/assets/headphones-hero.jpg';
import type { Product } from '@/contexts/CartContext';

const ProductPage = () => {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { toast } = useToast();

  // 模擬商品資料
  const product: Product = {
    id: 'headphones-pro',
    name: 'Premium 無線藍牙耳機',
    price: 2999,
    image: heroImage,
    description: '高品質無線藍牙耳機，採用先進的主動降噪技術，提供清晰純淨的音質體驗。續航力長達30小時，快充15分鐘可使用3小時。',
    stock: 50
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
    toast({
      title: "已加入購物車",
      description: `${product.name} x${quantity}`,
      duration: 3000,
    });
  };

  const features = [
    '主動降噪技術',
    '30小時續航',
    '快充15分鐘使用3小時',
    '藍牙5.0連接',
    '舒適記憶泡棉',
    '一年保固服務'
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* 產品圖片 */}
          <div className="space-y-4">
            <div className="aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-muted to-muted/50 shadow-elegant">
              <img 
                src={product.image} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="flex space-x-2">
              <Badge className="bg-success text-success-foreground">
                <Check className="w-3 h-3 mr-1" />
                現貨供應
              </Badge>
              <Badge variant="outline">
                <Truck className="w-3 h-3 mr-1" />
                免費配送
              </Badge>
            </div>
          </div>

          {/* 產品資訊 */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
                {product.name}
              </h1>
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                  ))}
                </div>
                <span className="text-muted-foreground">(128 評價)</span>
              </div>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {product.description}
              </p>
            </div>

            <div className="space-y-4">
              <div className="text-3xl font-bold text-primary">
                NT$ {product.price.toLocaleString()}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-success" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <Card className="border-2 border-primary/10 bg-primary/5">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">數量：</span>
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      className="w-10 h-10 p-0"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="text-xl font-semibold min-w-[3rem] text-center">
                      {quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= product.stock}
                      className="w-10 h-10 p-0"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-lg">
                  <span className="font-semibold">小計：</span>
                  <span className="text-2xl font-bold text-primary">
                    NT$ {(product.price * quantity).toLocaleString()}
                  </span>
                </div>

                <Button 
                  onClick={handleAddToCart}
                  className="w-full bg-gradient-primary hover:shadow-elegant transition-all duration-300 text-lg py-6"
                  size="lg"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  加入購物車
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  支援貨到付款 • 免費配送 • 7天無條件退貨
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;