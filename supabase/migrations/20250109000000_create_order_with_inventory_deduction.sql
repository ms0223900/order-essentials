-- 建立整合訂單建立與庫存扣減的函數
-- 將訂單建立和庫存扣減整合在單一資料庫交易中，確保資料一致性

CREATE OR REPLACE FUNCTION public.create_order_with_inventory_deduction(
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
    calculated_total DECIMAL(10,2) := 0;
    subtotal DECIMAL(10,2);
    product_name TEXT;
    product_price DECIMAL(10,2);
    product_image TEXT;
    inventory_results JSON[] := '{}';
    deduction_result JSON;
    current_stock INTEGER;
    check_result JSON;
BEGIN
    -- 驗證輸入參數
    IF p_customer_name IS NULL OR trim(p_customer_name) = '' THEN
        RETURN json_build_object(
            'success', false,
            'error', '顧客姓名不能為空',
            'error_code', 'INVALID_CUSTOMER_NAME'
        );
    END IF;

    IF p_customer_phone IS NULL OR trim(p_customer_phone) = '' THEN
        RETURN json_build_object(
            'success', false,
            'error', '顧客電話不能為空',
            'error_code', 'INVALID_CUSTOMER_PHONE'
        );
    END IF;

    IF p_customer_address IS NULL OR trim(p_customer_address) = '' THEN
        RETURN json_build_object(
            'success', false,
            'error', '顧客地址不能為空',
            'error_code', 'INVALID_CUSTOMER_ADDRESS'
        );
    END IF;

    IF p_items IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', '商品項目不能為 null',
            'error_code', 'INVALID_ITEMS'
        );
    END IF;

    IF json_typeof(p_items) != 'array' THEN
        RETURN json_build_object(
            'success', false,
            'error', '商品項目必須是一個 JSON 陣列',
            'error_code', 'INVALID_ITEMS_FORMAT'
        );
    END IF;

    IF json_array_length(p_items) = 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', '商品項目不能為空',
            'error_code', 'EMPTY_ITEMS'
        );
    END IF;

    -- 檢查所有商品的庫存可用性
    check_result := public.check_inventory_availability(p_items);
    IF (check_result->>'available')::BOOLEAN = false THEN
        RETURN json_build_object(
            'success', false,
            'error', '庫存不足，無法建立訂單',
            'error_code', 'INSUFFICIENT_STOCK',
            'details', check_result
        );
    END IF;

    -- 生成 UUID 訂單編號
    order_number := gen_random_uuid()::TEXT;

    -- 在單一交易中處理訂單建立和庫存扣減
    BEGIN
        -- 建立訂單
        INSERT INTO public.orders (
            order_number,
            customer_name,
            customer_phone,
            customer_address,
            total_amount,
            status,
            payment_method
        ) VALUES (
            order_number,
            trim(p_customer_name),
            trim(p_customer_phone),
            trim(p_customer_address),
            0,  -- 先設為 0，稍後更新
            'confirmed',  -- 訂單初始狀態為已成立
            'cod'  -- 預設付款方式
        ) RETURNING id INTO order_id;

        -- 處理每個訂單項目並計算總金額
        FOR item IN SELECT * FROM json_array_elements(p_items)
        LOOP
            -- 驗證項目格式
            IF item->>'product_id' IS NULL OR item->>'quantity' IS NULL THEN
                RAISE EXCEPTION '每個商品項目必須包含 product_id 和 quantity';
            END IF;

            BEGIN
                product_id := (item->>'product_id')::UUID;
                quantity := (item->>'quantity')::INTEGER;
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE EXCEPTION 'product_id 必須是有效的 UUID，quantity 必須是有效的整數';
            END;

            -- 驗證數量
            IF quantity <= 0 THEN
                RAISE EXCEPTION '商品數量必須大於 0';
            END IF;

            -- 取得商品資訊
            SELECT name, price, image, stock INTO product_name, product_price, product_image, current_stock
            FROM public.products
            WHERE id = product_id;

            IF NOT FOUND THEN
                RAISE EXCEPTION '商品不存在: %', product_id;
            END IF;

            -- 再次檢查庫存（以防在檢查後被其他交易修改）
            IF current_stock < quantity THEN
                RAISE EXCEPTION '商品 % 庫存不足，目前庫存: %，請求數量: %', product_name, current_stock, quantity;
            END IF;

            -- 計算小計
            subtotal := product_price * quantity;
            calculated_total := calculated_total + subtotal;

            -- 建立訂單項目
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
                product_name,
                product_price,
                product_image,
                quantity,
                subtotal
            );

            -- 扣除庫存並記錄結果
            deduction_result := json_build_object(
                'product_id', product_id,
                'product_name', product_name,
                'previous_stock', current_stock,
                'new_stock', current_stock - quantity,
                'quantity_deducted', quantity
            );
            inventory_results := array_append(inventory_results, deduction_result);

            -- 更新商品庫存
            UPDATE public.products
            SET stock = stock - quantity,
                updated_at = now()
            WHERE id = product_id;
        END LOOP;

        -- 更新訂單總金額
        UPDATE public.orders
        SET total_amount = calculated_total
        WHERE id = order_id;

        -- 返回成功結果
        RETURN json_build_object(
            'success', true,
            'order_id', order_id,
            'order_number', order_number,
            'total_amount', calculated_total,
            'inventory_results', to_json(inventory_results)
        );

    EXCEPTION
        WHEN OTHERS THEN
            -- 發生任何錯誤時，交易會自動回滾
            RETURN json_build_object(
                'success', false,
                'error', '建立訂單時發生錯誤: ' || SQLERRM,
                'error_code', 'ORDER_CREATION_ERROR'
            );
    END;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 為函數添加註釋
COMMENT ON FUNCTION public.create_order_with_inventory_deduction(TEXT, TEXT, TEXT, JSON) IS '整合訂單建立與庫存扣減的函數，在單一交易中完成所有操作，確保資料一致性';
