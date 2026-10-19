-- ==============================================================================
-- DUSKK Critical Fix Migration
-- Migration: 20261020020000_fix_confirm_order_payment_enum.sql
-- Description:
--   Fix enum mismatch in `confirm_order_payment` stored procedure.
--   Resolves error: "invalid input value for enum order_status: 'created'"
--   where payments.status ('created'::payment_status) was mistakenly assigned
--   to a variable of type order_status.
--   Ensures atomic payment capture, inventory settlement, coupon redemption,
--   and order status transition to CONFIRMED.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.confirm_order_payment(
    p_razorpay_order_id TEXT,
    p_razorpay_payment_id TEXT,
    p_razorpay_signature TEXT,
    p_method TEXT DEFAULT 'razorpay'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_payment_id UUID;
    v_order_id UUID;
    v_payment_status payment_status;
    v_order_status order_status;
    v_order RECORD;
    v_coupon RECORD;
    v_coupon_id UUID := NULL;
    v_item RECORD;
BEGIN
    -- 1. Locate and lock the initial payment record created during checkout initiation
    SELECT id, order_id, status
    INTO v_payment_id, v_order_id, v_payment_status
    FROM public.payments
    WHERE razorpay_order_id = p_razorpay_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment record for Razorpay order % not found', p_razorpay_order_id;
    END IF;

    -- 2. Locate and lock the corresponding order
    SELECT * INTO v_order
    FROM public.orders
    WHERE id = v_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order record for payment % not found', v_payment_id;
    END IF;

    v_order_status := v_order.status;

    -- 3. Idempotency Check:
    -- If the order is already CONFIRMED, PAID, PROCESSING, SHIPPED, OUT_FOR_DELIVERY, or DELIVERED,
    -- exit immediately without re-processing or duplicate inventory deductions
    IF v_order_status IN ('CONFIRMED', 'PAID', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'REFUND_PENDING', 'REFUNDED') THEN
        -- Ensure payment record has latest razorpay_payment_id and signature if previously missing
        UPDATE public.payments
        SET razorpay_payment_id = COALESCE(p_razorpay_payment_id, razorpay_payment_id),
            razorpay_signature = COALESCE(p_razorpay_signature, razorpay_signature),
            status = CASE WHEN status = 'created' THEN 'captured'::payment_status ELSE status END,
            method = COALESCE(p_method, method, 'razorpay'),
            updated_at = NOW()
        WHERE id = v_payment_id;

        RETURN v_order.id;
    END IF;

    -- 4. Evaluate Coupon Validity & Usage Records (if order used a coupon)
    v_coupon_id := v_order.coupon_id;
    IF v_coupon_id IS NOT NULL OR (v_order.coupon_code IS NOT NULL AND TRIM(v_order.coupon_code) <> '') THEN
        IF v_coupon_id IS NOT NULL THEN
            SELECT * INTO v_coupon
            FROM public.coupons
            WHERE id = v_coupon_id
            FOR UPDATE;
        ELSE
            SELECT * INTO v_coupon
            FROM public.coupons
            WHERE UPPER(code) = UPPER(TRIM(v_order.coupon_code))
            FOR UPDATE;
        END IF;

        IF FOUND THEN
            v_coupon_id := v_coupon.id;

            INSERT INTO public.coupon_usages (
                coupon_id,
                customer_id,
                order_id,
                discount_applied
            ) VALUES (
                v_coupon.id,
                v_order.customer_id,
                v_order.id,
                COALESCE(v_order.discount_amount, 0)
            )
            ON CONFLICT DO NOTHING;

            UPDATE public.coupons
            SET times_used = times_used + 1,
                updated_at = NOW()
            WHERE id = v_coupon.id;
        END IF;
    END IF;

    -- 5. Update payment record to 'captured'
    UPDATE public.payments
    SET status = 'captured',
        razorpay_payment_id = COALESCE(p_razorpay_payment_id, razorpay_payment_id),
        razorpay_signature = COALESCE(p_razorpay_signature, razorpay_signature),
        method = COALESCE(p_method, method, 'razorpay'),
        updated_at = NOW()
    WHERE id = v_payment_id;

    -- 6. Permanently deduct stock and clear reservation for ordered variants
    -- Group by variant_id to combine any multiple entries and sort by variant_id to avoid deadlocks
    FOR v_item IN
        SELECT variant_id, SUM(quantity) AS quantity
        FROM public.order_items
        WHERE order_id = v_order_id AND variant_id IS NOT NULL
        GROUP BY variant_id
        ORDER BY variant_id ASC
    LOOP
        UPDATE public.product_variants
        SET stock_quantity = GREATEST(0, stock_quantity - v_item.quantity),
            reserved_quantity = GREATEST(0, reserved_quantity - v_item.quantity),
            updated_at = NOW()
        WHERE id = v_item.variant_id;

        INSERT INTO public.inventory_logs (
            variant_id,
            change_type,
            quantity_change,
            stock_after,
            reserved_after,
            reference_id,
            notes
        )
        SELECT
            id,
            'order_fulfilled',
            -v_item.quantity,
            stock_quantity,
            reserved_quantity,
            v_order_id::TEXT,
            'Payment captured, stock deducted'
        FROM public.product_variants
        WHERE id = v_item.variant_id;
    END LOOP;

    -- 7. Transition order status to CONFIRMED
    UPDATE public.orders
    SET status = 'CONFIRMED',
        coupon_id = COALESCE(v_order.coupon_id, v_coupon_id),
        updated_at = NOW()
    WHERE id = v_order.id;

    -- 8. Log status history
    INSERT INTO public.order_status_history (
        order_id,
        from_status,
        to_status,
        changed_by,
        comment
    ) VALUES (
        v_order.id,
        v_order_status,
        'CONFIRMED',
        'system:payment_settlement',
        'Payment verified and settled successfully'
    );

    RETURN v_order.id;
END;
$$;
