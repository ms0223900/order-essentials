import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Package, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';

const Navbar = () => {
  const location = useLocation();
  const { getTotalItems } = useCart();
  const totalItems = getTotalItems();

  return (
    <nav className="bg-card shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">TechStore</span>
          </Link>

          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button 
                variant={location.pathname === '/' ? 'default' : 'ghost'} 
                size="sm"
                className="flex items-center space-x-2"
              >
                <Home className="w-4 h-4" />
                <span>商品</span>
              </Button>
            </Link>

            <Link to="/cart">
              <Button 
                variant={location.pathname === '/cart' ? 'default' : 'ghost'} 
                size="sm"
                className="flex items-center space-x-2 relative"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>購物車</span>
                {totalItems > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs min-w-[1.25rem] h-5">
                    {totalItems}
                  </Badge>
                )}
              </Button>
            </Link>

            <Link to="/orders">
              <Button 
                variant={location.pathname === '/orders' ? 'default' : 'ghost'} 
                size="sm"
                className="flex items-center space-x-2"
              >
                <Package className="w-4 h-4" />
                <span>訂單</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;