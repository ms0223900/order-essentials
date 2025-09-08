import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Order } from '@/domain/types/Order';
import { useOrders } from '@/hooks/useOrders';
import { CheckCircle, Clock, Package, RefreshCw, ShoppingBag, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OrdersPage = () => {
  const { orders, loading, error, loadOrders, updateOrderStatus } = useOrders();
  const navigate = useNavigate();

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'confirmed':
        return <Package className="w-4 h-4" />;
      case 'shipping':
        return <Truck className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-warning text-warning-foreground';
      case 'confirmed':
        return 'bg-primary text-primary-foreground';
      case 'shipping':
        return 'bg-accent text-accent-foreground';
      case 'delivered':
        return 'bg-success text-success-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return '等待確認';
      case 'confirmed':
        return '已確認';
      case 'shipping':
        return '配送中';
      case 'delivered':
        return '已送達';
      default:
        return '未知狀態';
    }
  };

  const handleStatusUpdate = async (orderId: string, currentStatus: Order['status']) => {
    const statusFlow: Order['status'][] = ['pending', 'confirmed', 'shipping', 'delivered'];
    const currentIndex = statusFlow.indexOf(currentStatus);

    if (currentIndex < statusFlow.length - 1) {
      const nextStatus = statusFlow[currentIndex + 1];
      const result = await updateOrderStatus({ orderId, status: nextStatus });

      if (!result.success) {
        console.error('更新訂單狀態失敗:', result.error);
        // 可以在這裡顯示錯誤訊息給使用者
      }
    }
  };

  const canAdvanceStatus = (status: Order['status']) => {
    return status !== 'delivered';
  };

  // 載入中狀態
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-16">
            <RefreshCw className="w-24 h-24 text-muted-foreground mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-foreground mb-2">載入訂單中...</h2>
            <p className="text-muted-foreground">請稍候，正在取得您的訂單資料</p>
          </div>
        </div>
      </div>
    );
  }

  // 錯誤狀態
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-16">
            <ShoppingBag className="w-24 h-24 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">載入訂單失敗</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="space-x-4">
              <Button onClick={loadOrders} variant="outline">
                重新載入
              </Button>
              <Button onClick={() => navigate('/')} className="bg-gradient-primary">
                開始購物
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 無訂單狀態
  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-16">
            <ShoppingBag className="w-24 h-24 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">尚無訂單記錄</h2>
            <p className="text-muted-foreground mb-6">開始購物來建立你的第一個訂單吧！</p>
            <Button onClick={() => navigate('/')} className="bg-gradient-primary">
              開始購物
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">我的訂單</h1>
          <div className="flex items-center space-x-4">
            <Button onClick={loadOrders} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              重新載入
            </Button>
            <Badge variant="outline" className="text-sm">
              共 {orders.length} 筆訂單
            </Badge>
          </div>
        </div>

        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="bg-muted/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">訂單編號：{order.orderNumber}</CardTitle>
                  <Badge className={getStatusColor(order.status)}>
                    {getStatusIcon(order.status)}
                    <span className="ml-1">{getStatusText(order.status)}</span>
                  </Badge>
                </div>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>建立時間：{order.createdAt.toLocaleString('zh-TW')}</span>
                  <span>付款方式：貨到付款</span>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* 訂單商品 */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground">訂單商品</h4>
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center space-x-4 py-3 border-b last:border-0">
                        <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={item.productImage || '/placeholder.svg'}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium">{item.productName}</h5>
                          <p className="text-sm text-muted-foreground">數量：{item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold">
                            NT$ {item.subtotal.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 收件資訊 */}
                  <div className="bg-muted/20 rounded-lg p-4">
                    <h4 className="font-semibold text-foreground mb-2">收件資訊</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">收件人：</span>{order.customerName}</p>
                      <p><span className="font-medium">聯絡電話：</span>{order.customerPhone}</p>
                      <p><span className="font-medium">收件地址：</span>{order.customerAddress}</p>
                    </div>
                  </div>

                  {/* 訂單總計和操作 */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-lg">
                      <span className="font-semibold">訂單總計：</span>
                      <span className="text-xl font-bold text-primary ml-2">
                        NT$ {order.totalAmount.toLocaleString()}
                      </span>
                    </div>

                    {canAdvanceStatus(order.status) && (
                      <Button
                        onClick={() => handleStatusUpdate(order.id, order.status)}
                        variant="outline"
                        size="sm"
                      >
                        {order.status === 'pending' && '確認訂單'}
                        {order.status === 'confirmed' && '開始配送'}
                        {order.status === 'shipping' && '標示已送達'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;