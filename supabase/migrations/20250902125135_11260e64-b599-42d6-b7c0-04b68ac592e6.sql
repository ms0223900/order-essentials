-- 建立商品資料表
CREATE TABLE public.products (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    image TEXT,
    category TEXT,
    stock INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 啟用 Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 建立公開讀取政策 (商品可以被所有人查看)
CREATE POLICY "Products are viewable by everyone" 
ON public.products 
FOR SELECT 
USING (true);

-- 建立更新時間戳的函數
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 建立自動更新時間戳的觸發器
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 插入示範商品資料
INSERT INTO public.products (name, price, description, image, category, stock) VALUES
('Premium 無線藍牙耳機', 2999.00, '高品質無線藍牙耳機，採用先進的主動降噪技術，提供清晰純淨的音質體驗。續航力長達30小時，快充15分鐘可使用3小時。', '/headphones-hero.jpg', 'electronics', 50),
('智慧運動手錶', 5999.00, '全功能智慧運動手錶，支援心率監測、GPS定位、防水設計。內建多種運動模式，幫助您追蹤健康數據。', '/placeholder.svg', 'electronics', 30),
('無線充電器', 899.00, '快速無線充電器，支援Qi標準，最大功率15W。具備過熱保護和異物檢測功能，安全可靠。', '/placeholder.svg', 'accessories', 100),
('藍牙喇叭', 1599.00, '便攜式藍牙喇叭，360度環繞音效，IPX7防水等級。電池續航12小時，支援多裝置連接。', '/placeholder.svg', 'electronics', 40),
('手機保護殼', 299.00, '高品質手機保護殼，軍規防摔測試認證。透明設計不遮擋手機外觀，精準開孔設計。', '/placeholder.svg', 'accessories', 200);