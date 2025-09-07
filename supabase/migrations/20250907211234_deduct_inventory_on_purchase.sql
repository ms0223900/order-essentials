-- 建立扣除庫存的函數
-- 這個函數會在購買時自動扣除商品庫存，並確保庫存不會變成負數

CREATE OR REPLACE FUNCTION public.deduct_inventory(
    product_id UUID,
    quantity_to_deduct INTEGER
)
RETURNS JSON AS $$
DECLARE
    current_stock INTEGER;
    updated_product RECORD;
    result JSON;
BEGIN
    -- 檢查商品是否存在並取得當前庫存
    SELECT stock INTO current_stock
    FROM public.products
    WHERE id = product_id;
    
    -- 如果商品不存在
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', '商品不存在',
            'error_code', 'PRODUCT_NOT_FOUND'
        );
    END IF;
    
    -- 檢查庫存是否足夠
    IF current_stock < quantity_to_deduct THEN
        RETURN json_build_object(
            'success', false,
            'error', '庫存不足',
            'error_code', 'INSUFFICIENT_STOCK',
            'current_stock', current_stock,
            'requested_quantity', quantity_to_deduct
        );
    END IF;
    
    -- 扣除庫存
    UPDATE public.products
    SET stock = stock - quantity_to_deduct,
        updated_at = now()
    WHERE id = product_id
    RETURNING * INTO updated_product;
    
    -- 返回成功結果
    RETURN json_build_object(
        'success', true,
        'product_id', updated_product.id,
        'product_name', updated_product.name,
        'previous_stock', current_stock,
        'new_stock', updated_product.stock,
        'quantity_deducted', quantity_to_deduct
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- 發生錯誤時回滾並返回錯誤信息
        RETURN json_build_object(
            'success', false,
            'error', '扣除庫存時發生錯誤: ' || SQLERRM,
            'error_code', 'DEDUCTION_ERROR'
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 建立批量扣除庫存的函數
-- 用於一次處理多個商品的庫存扣除
CREATE OR REPLACE FUNCTION public.deduct_inventory_batch(
    items JSON
)
RETURNS JSON AS $$
DECLARE
    item JSON;
    product_id UUID;
    quantity INTEGER;
    deduction_result JSON;
    results JSON[] := '{}';
    all_success BOOLEAN := true;
    error_message TEXT := '';
BEGIN
    -- 遍歷每個商品項目
    FOR item IN SELECT * FROM json_array_elements(items)
    LOOP
        product_id := (item->>'product_id')::UUID;
        quantity := (item->>'quantity')::INTEGER;
        
        -- 調用單個商品扣除函數
        deduction_result := public.deduct_inventory(product_id, quantity);
        
        -- 檢查是否成功
        IF (deduction_result->>'success')::BOOLEAN = false THEN
            all_success := false;
            error_message := deduction_result->>'error';
            EXIT; -- 如果任何一個失敗，就停止處理
        END IF;
        
        -- 將結果添加到結果數組
        results := array_append(results, deduction_result);
    END LOOP;
    
    -- 返回批量處理結果
    IF all_success THEN
        RETURN json_build_object(
            'success', true,
            'message', '所有商品庫存扣除成功',
            'results', to_json(results)
        );
    ELSE
        RETURN json_build_object(
            'success', false,
            'error', error_message,
            'processed_items', to_json(results)
        );
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', '批量扣除庫存時發生錯誤: ' || SQLERRM,
            'error_code', 'BATCH_DEDUCTION_ERROR'
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 建立檢查庫存可用性的函數
-- 用於在購買前檢查所有商品是否有足夠庫存
CREATE OR REPLACE FUNCTION public.check_inventory_availability(
    items JSON
)
RETURNS JSON AS $$
DECLARE
    item JSON;
    product_id UUID;
    quantity INTEGER;
    current_stock INTEGER;
    unavailable_items JSON[] := '{}';
    all_available BOOLEAN := true;
BEGIN
    -- 遍歷每個商品項目
    FOR item IN SELECT * FROM json_array_elements(items)
    LOOP
        product_id := (item->>'product_id')::UUID;
        quantity := (item->>'quantity')::INTEGER;
        
        -- 檢查商品是否存在並取得庫存
        SELECT stock INTO current_stock
        FROM public.products
        WHERE id = product_id;
        
        -- 如果商品不存在
        IF NOT FOUND THEN
            all_available := false;
            unavailable_items := array_append(unavailable_items, json_build_object(
                'product_id', product_id,
                'error', '商品不存在',
                'error_code', 'PRODUCT_NOT_FOUND'
            ));
            CONTINUE;
        END IF;
        
        -- 檢查庫存是否足夠
        IF current_stock < quantity THEN
            all_available := false;
            unavailable_items := array_append(unavailable_items, json_build_object(
                'product_id', product_id,
                'current_stock', current_stock,
                'requested_quantity', quantity,
                'error', '庫存不足',
                'error_code', 'INSUFFICIENT_STOCK'
            ));
        END IF;
    END LOOP;
    
    -- 返回檢查結果
    IF all_available THEN
        RETURN json_build_object(
            'available', true,
            'message', '所有商品庫存充足'
        );
    ELSE
        RETURN json_build_object(
            'available', false,
            'message', '部分商品庫存不足',
            'unavailable_items', to_json(unavailable_items)
        );
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'available', false,
            'error', '檢查庫存時發生錯誤: ' || SQLERRM,
            'error_code', 'CHECK_ERROR'
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 為函數添加註釋
COMMENT ON FUNCTION public.deduct_inventory(UUID, INTEGER) IS '扣除單個商品的庫存，確保庫存不會變成負數';
COMMENT ON FUNCTION public.deduct_inventory_batch(JSON) IS '批量扣除多個商品的庫存，如果任何一個失敗則全部回滾';
COMMENT ON FUNCTION public.check_inventory_availability(JSON) IS '檢查多個商品的庫存可用性，用於購買前驗證';
