-- 建立訂單資料表
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipping', 'delivered')),
    payment_method TEXT NOT NULL DEFAULT 'cod' CHECK (payment_method IN ('cod')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 建立訂單項目資料表
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    product_name TEXT NOT NULL,
    product_price DECIMAL(10,2) NOT NULL,
    product_image TEXT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 啟用 Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 建立訂單的公開讀取政策 (所有人都可以查看訂單)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'orders' 
        AND policyname = 'Orders are viewable by everyone'
    ) THEN
        CREATE POLICY "Orders are viewable by everyone" 
        ON public.orders 
        FOR SELECT 
        USING (true);
    END IF;
END $$;

-- 建立訂單的插入政策 (所有人都可以建立訂單)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'orders' 
        AND policyname = 'Orders are insertable by everyone'
    ) THEN
        CREATE POLICY "Orders are insertable by everyone" 
        ON public.orders 
        FOR INSERT 
        WITH CHECK (true);
    END IF;
END $$;

-- 建立訂單的更新政策 (所有人都可以更新訂單狀態)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'orders' 
        AND policyname = 'Orders are updatable by everyone'
    ) THEN
        CREATE POLICY "Orders are updatable by everyone" 
        ON public.orders 
        FOR UPDATE 
        USING (true);
    END IF;
END $$;

-- 建立訂單項目的公開讀取政策
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'order_items' 
        AND policyname = 'Order items are viewable by everyone'
    ) THEN
        CREATE POLICY "Order items are viewable by everyone" 
        ON public.order_items 
        FOR SELECT 
        USING (true);
    END IF;
END $$;

-- 建立訂單項目的插入政策
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'order_items' 
        AND policyname = 'Order items are insertable by everyone'
    ) THEN
        CREATE POLICY "Order items are insertable by everyone" 
        ON public.order_items 
        FOR INSERT 
        WITH CHECK (true);
    END IF;
END $$;

-- 建立自動更新時間戳的觸發器
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_orders_updated_at'
    ) THEN
        CREATE TRIGGER update_orders_updated_at
        BEFORE UPDATE ON public.orders
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- 建立建立訂單的函數
CREATE OR REPLACE FUNCTION public.create_order_with_items(
    p_customer_name TEXT,
    p_customer_phone TEXT,
    p_customer_address TEXT,
    p_items JSON
)
RETURNS JSON AS $$
DECLARE
    order_id UUID;
    order_number TEXT;
    item JSON;
    product_id UUID;
    quantity INTEGER;
    product_record RECORD;
    total_amount DECIMAL(10,2) := 0;
    subtotal DECIMAL(10,2);
    result JSON;
BEGIN
    -- 建立訂單序列 (如果不存在)
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'order_sequence') THEN
        CREATE SEQUENCE order_sequence START 1;
    END IF;
    
    -- 生成訂單編號
    order_number := 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('order_sequence')::text, 6, '0');
    
    -- 建立訂單
    INSERT INTO public.orders (
        order_number,
        customer_name,
        customer_phone,
        customer_address,
        total_amount
    ) VALUES (
        order_number,
        p_customer_name,
        p_customer_phone,
        p_customer_address,
        0  -- 先設為 0，稍後更新
    ) RETURNING id INTO order_id;
    
    -- 建立訂單項目並計算總金額
    FOR item IN SELECT * FROM json_array_elements(p_items)
    LOOP
        product_id := (item->>'product_id')::UUID;
        quantity := (item->>'quantity')::INTEGER;
        
        -- 取得商品資訊
        SELECT name, price, image INTO product_record.name, product_record.price, product_record.image
        FROM public.products
        WHERE id = product_id;
        
        IF NOT FOUND THEN
            RETURN json_build_object(
                'success', false,
                'error', '商品不存在: ' || product_id,
                'error_code', 'PRODUCT_NOT_FOUND'
            );
        END IF;
        
        subtotal := product_record.price * quantity;
        total_amount := total_amount + subtotal;
        
        -- 插入訂單項目
        INSERT INTO public.order_items (
            order_id,
            product_id,
            product_name,
            product_price,
            product_image,
            quantity,
            subtotal
        ) VALUES (
            order_id,
            product_id,
            product_record.name,
            product_record.price,
            product_record.image,
            quantity,
            subtotal
        );
    END LOOP;
    
    -- 更新訂單總金額
    UPDATE public.orders
    SET total_amount = total_amount
    WHERE id = order_id;
    
    -- 返回成功結果
    RETURN json_build_object(
        'success', true,
        'order_id', order_id,
        'order_number', order_number,
        'total_amount', total_amount
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', '建立訂單時發生錯誤: ' || SQLERRM,
            'error_code', 'ORDER_CREATION_ERROR'
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 建立取得訂單列表的函數
CREATE OR REPLACE FUNCTION public.get_orders_with_items()
RETURNS JSON AS $$
DECLARE
    order_record RECORD;
    order_item_record RECORD;
    orders_json JSON[] := '{}';
    items_json JSON[] := '{}';
    order_json JSON;
BEGIN
    -- 遍歷所有訂單
    FOR order_record IN 
        SELECT * FROM public.orders 
        ORDER BY created_at DESC
    LOOP
        -- 重置項目陣列
        items_json := '{}';
        
        -- 取得該訂單的所有項目
        FOR order_item_record IN 
            SELECT * FROM public.order_items 
            WHERE order_id = order_record.id
        LOOP
            items_json := array_append(items_json, json_build_object(
                'id', order_item_record.id,
                'product_id', order_item_record.product_id,
                'product_name', order_item_record.product_name,
                'product_price', order_item_record.product_price,
                'product_image', order_item_record.product_image,
                'quantity', order_item_record.quantity,
                'subtotal', order_item_record.subtotal
            ));
        END LOOP;
        
        -- 建立訂單 JSON
        order_json := json_build_object(
            'id', order_record.id,
            'order_number', order_record.order_number,
            'customer_name', order_record.customer_name,
            'customer_phone', order_record.customer_phone,
            'customer_address', order_record.customer_address,
            'total_amount', order_record.total_amount,
            'status', order_record.status,
            'payment_method', order_record.payment_method,
            'created_at', order_record.created_at,
            'updated_at', order_record.updated_at,
            'items', to_json(items_json)
        );
        
        orders_json := array_append(orders_json, order_json);
    END LOOP;
    
    RETURN json_build_object(
        'success', true,
        'orders', to_json(orders_json)
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', '取得訂單時發生錯誤: ' || SQLERRM,
            'error_code', 'GET_ORDERS_ERROR'
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 建立更新訂單狀態的函數
CREATE OR REPLACE FUNCTION public.update_order_status(
    p_order_id UUID,
    p_status TEXT
)
RETURNS JSON AS $$
DECLARE
    updated_order RECORD;
BEGIN
    -- 驗證狀態值
    IF p_status NOT IN ('pending', 'confirmed', 'shipping', 'delivered') THEN
        RETURN json_build_object(
            'success', false,
            'error', '無效的訂單狀態',
            'error_code', 'INVALID_STATUS'
        );
    END IF;
    
    -- 更新訂單狀態
    UPDATE public.orders
    SET status = p_status,
        updated_at = now()
    WHERE id = p_order_id
    RETURNING * INTO updated_order;
    
    -- 檢查是否有更新
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', '訂單不存在',
            'error_code', 'ORDER_NOT_FOUND'
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'order_id', updated_order.id,
        'order_number', updated_order.order_number,
        'status', updated_order.status,
        'updated_at', updated_order.updated_at
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', '更新訂單狀態時發生錯誤: ' || SQLERRM,
            'error_code', 'UPDATE_STATUS_ERROR'
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
