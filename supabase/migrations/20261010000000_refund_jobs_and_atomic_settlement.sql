-- ==============================================================================
-- DUSKK Phase 1 Database Migration
-- Migration: 20261010000000_refund_jobs_and_atomic_settlement.sql
-- Description:
--   Update `confirm_order_payment` stored procedure to atomically enforce
--   coupon limits, record payment capture, release inventory, and set
--   REFUND_PENDING when a coupon conflict occurs.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Update `confirm_order_payment` Stored Procedure
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.confirm_order_payment(
    p_razorpay_order_id TEXT,
    p_razorpay_payment_id TEXT,
    p_razorpay_signature TEXT,
    p_method TEXT DEFAULT 'razorpay'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_payment RECORD;
    v_order RECORD;
    v_coupon RECORD;
    v_customer_redemptions INTEGER;
    v_coupon_rejected BOOLEAN := FALSE;
    v_rejection_reason TEXT := NULL;
BEGIN
    -- 1. Locate the initial payment record created during checkout initiation
    SELECT * INTO v_payment
    FROM public.payments
    WHERE razorpay_order_id = p_razorpay_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment record for Razorpay order % not found', p_razorpay_order_id;
    END IF;

    -- 2. Locate and lock the corresponding order
    SELECT * INTO v_order
    FROM public.orders
    WHERE id = v_payment.order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order record for payment % not found', v_payment.id;
    END IF;

    -- 3. Idempotency Check:
    -- If the order is already CONFIRMED, PAID, or REFUND_PENDING, exit immediately without re-processing
    IF v_order.status IN ('CONFIRMED', 'PAID', 'REFUND_PENDING', 'REFUNDED') THEN
        RETURN v_order.id;
    END IF;

    -- 4. Evaluate Coupon Validity & Usage Limits (if order used a coupon)
    IF v_order.coupon_id IS NOT NULL OR v_order.coupon_code IS NOT NULL THEN
        -- Resolve coupon row with exclusive lock
        IF v_order.coupon_id IS NOT NULL THEN
            SELECT * INTO v_coupon
            FROM public.coupons
            WHERE id = v_order.coupon_id
            FOR UPDATE;
        ELSE
            SELECT * INTO v_coupon
            FROM public.coupons
            WHERE code = UPPER(TRIM(v_order.coupon_code))
            FOR UPDATE;
        END IF;

        IF FOUND THEN
            -- Check 4A: Global total usage limit
            IF v_coupon.usage_limit_total IS NOT NULL AND v_coupon.times_used >= v_coupon.usage_limit_total THEN
                v_coupon_rejected := TRUE;
                v_rejection_reason := 'COUPON_GLOBAL_LIMIT_EXCEEDED';
            -- Check 4B: Per-customer usage limit
            ELSIF v_coupon.usage_limit_per_customer IS NOT NULL THEN
                SELECT COUNT(*) INTO v_customer_redemptions
                FROM public.coupon_usages
                WHERE coupon_id = v_coupon.id
                  AND customer_id = v_order.customer_id;

                IF v_customer_redemptions >= v_coupon.usage_limit_per_customer THEN
                    v_coupon_rejected := TRUE;
                    v_rejection_reason := 'COUPON_CUSTOMER_LIMIT_EXCEEDED';
                END IF;
            END IF;
        ELSE
            -- Coupon code on order no longer exists in database
            v_coupon_rejected := TRUE;
            v_rejection_reason := 'COUPON_NOT_FOUND';
        END IF;
    END IF;

    -- =========================================================================
    -- BRANCH A: Normal Successful Settlement (Coupon valid or no coupon)
    -- =========================================================================
    IF NOT v_coupon_rejected THEN
        -- Record coupon redemption and increment counter atomically if applicable
        IF v_coupon.id IS NOT NULL THEN
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
            );

            UPDATE public.coupons
            SET times_used = times_used + 1,
                updated_at = NOW()
            WHERE id = v_coupon.id;
        END IF;

        -- Update payment record to captured status
        UPDATE public.payments
        SET status = 'captured',
            razorpay_payment_id = p_razorpay_payment_id,
            razorpay_signature = p_razorpay_signature,
            method = COALESCE(p_method, method, 'razorpay'),
            updated_at = NOW()
        WHERE id = v_payment.id;

        -- Transition order status to CONFIRMED
        UPDATE public.orders
        SET status = 'CONFIRMED',
            coupon_id = COALESCE(v_order.coupon_id, v_coupon.id),
            updated_at = NOW()
        WHERE id = v_order.id;

        -- Log order status transition
        INSERT INTO public.order_status_history (
            order_id,
            from_status,
            to_status,
            changed_by,
            comment
        ) VALUES (
            v_order.id,
            v_order.status,
            'CONFIRMED',
            'system:payment_settlement',
            'Payment verified and settled successfully'
        );

        RETURN v_order.id;

    -- =========================================================================
    -- BRANCH B: Coupon Limit Conflict (Atomic Refund Staging)
    -- =========================================================================
    ELSE
        -- 1. Preserve capture evidence on payment record and mark refund_pending
        UPDATE public.payments
        SET status = 'refund_pending',
            razorpay_payment_id = p_razorpay_payment_id,
            razorpay_signature = p_razorpay_signature,
            method = COALESCE(p_method, method, 'razorpay'),
            refund_notes = 'Settlement rejected: ' || v_rejection_reason,
            updated_at = NOW()
        WHERE id = v_payment.id;

        -- 2. Transition order status to REFUND_PENDING
        UPDATE public.orders
        SET status = 'REFUND_PENDING',
            updated_at = NOW()
        WHERE id = v_order.id;

        -- 3. Release reserved inventory atomically using official cancellation RPC
        PERFORM public.cancel_order_and_release_inventory(
            v_order.id,
            'Coupon settlement limit conflict: ' || v_rejection_reason
        );

        -- Re-assert REFUND_PENDING in case cancel_order_and_release_inventory set CANCELLED
        UPDATE public.orders
        SET status = 'REFUND_PENDING',
            updated_at = NOW()
        WHERE id = v_order.id;

        -- 4. Log status transition
        INSERT INTO public.order_status_history (
            order_id,
            from_status,
            to_status,
            changed_by,
            comment
        ) VALUES (
            v_order.id,
            v_order.status,
            'REFUND_PENDING',
            'system:coupon_rejection',
            'Payment captured but coupon limit exceeded (' || v_rejection_reason || '). Refund pending manual/gateway review.'
        );

        RETURN v_order.id;
    END IF;
END;
$$;
