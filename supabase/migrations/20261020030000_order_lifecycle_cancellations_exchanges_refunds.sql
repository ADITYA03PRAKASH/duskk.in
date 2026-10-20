-- ==============================================================================
-- DUSKK Complete Order Management, Cancellation, Exchange, and Refund Migration
-- Migration: 20261020030000_order_lifecycle_cancellations_exchanges_refunds.sql
-- Description:
--   1. Creates tables for order cancellations, product exchanges, refunds, and email audit logs.
--   2. Updates `cancel_order_and_release_inventory` to handle confirmed orders (restoring stock).
--   3. Implements atomic `admin_update_order_status` stored procedure with full status synchronization.
--   4. Enhances `get_guest_order` to securely return order id, tracking snapshots, items, timeline, and request records.
--   5. Creates atomic RPCs for customer cancellation & exchange requests and admin processing.
--   6. Implements atomic `admin_record_refund` procedure with payment and order state reconciliation.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Create Tables
-- ------------------------------------------------------------------------------

-- 1A. Order Cancellations
CREATE TABLE IF NOT EXISTS public.order_cancellations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    details TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'REQUESTED' 
        CHECK (status IN ('REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED')),
    admin_notes TEXT,
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_cancellations_order_id ON public.order_cancellations(order_id);
CREATE INDEX IF NOT EXISTS idx_order_cancellations_status ON public.order_cancellations(status);

-- 1B. Product Exchanges / Returns
CREATE TABLE IF NOT EXISTS public.order_exchanges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    order_item_id UUID REFERENCES public.order_items(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    reason TEXT NOT NULL CHECK (reason IN ('WRONG_ITEM', 'DAMAGED_IN_TRANSIT', 'DEFECTIVE_PRODUCT', 'INCORRECT_SIZE_OR_VARIANT', 'OTHER')),
    details TEXT,
    evidence_urls TEXT[] DEFAULT '{}'::TEXT[],
    replacement_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    replacement_variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'REQUESTED' 
        CHECK (status IN ('REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PICKUP_SCHEDULED', 'INSPECTION_PENDING', 'REPLACEMENT_DISPATCHED', 'COMPLETED', 'CANCELLED')),
    pickup_courier TEXT,
    pickup_tracking_number TEXT,
    pickup_scheduled_date TIMESTAMPTZ,
    replacement_courier TEXT,
    replacement_tracking_number TEXT,
    admin_notes TEXT,
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_exchanges_order_id ON public.order_exchanges(order_id);
CREATE INDEX IF NOT EXISTS idx_order_exchanges_status ON public.order_exchanges(status);

-- 1C. Order Refunds
CREATE TABLE IF NOT EXISTS public.order_refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    cancellation_id UUID REFERENCES public.order_cancellations(id) ON DELETE SET NULL,
    exchange_id UUID REFERENCES public.order_exchanges(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    reason TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'REQUESTED' 
        CHECK (status IN ('REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'PROCESSING', 'COMPLETED', 'FAILED', 'REJECTED')),
    razorpay_refund_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    error_code VARCHAR(100),
    error_description TEXT,
    admin_notes TEXT,
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    processed_at TIMESTAMPTZ,
    idempotency_key VARCHAR(150) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_refunds_order_id ON public.order_refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_order_refunds_payment_id ON public.order_refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_order_refunds_status ON public.order_refunds(status);
CREATE INDEX IF NOT EXISTS idx_order_refunds_rzp_refund_id ON public.order_refunds(razorpay_refund_id);

-- 1D. Order Email Audit Logs (Idempotent tracking)
CREATE TABLE IF NOT EXISTS public.order_email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    email_type VARCHAR(100) NOT NULL,
    subject TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'SENT', 'FAILED')),
    message_id VARCHAR(255),
    provider_response TEXT,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,
    idempotency_key VARCHAR(200) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_email_logs_order_id ON public.order_email_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_order_email_logs_idemp ON public.order_email_logs(idempotency_key);

-- Enable RLS
ALTER TABLE public.order_cancellations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_email_logs ENABLE ROW LEVEL SECURITY;

-- Permissive policies for internal service operations / admin
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public can select order cancellations" ON public.order_cancellations;
    CREATE POLICY "Public can select order cancellations" ON public.order_cancellations FOR SELECT TO public USING (true);

    DROP POLICY IF EXISTS "Public can select order exchanges" ON public.order_exchanges;
    CREATE POLICY "Public can select order exchanges" ON public.order_exchanges FOR SELECT TO public USING (true);

    DROP POLICY IF EXISTS "Public can select order refunds" ON public.order_refunds;
    CREATE POLICY "Public can select order refunds" ON public.order_refunds FOR SELECT TO public USING (true);

    DROP POLICY IF EXISTS "Public can select order email logs" ON public.order_email_logs;
    CREATE POLICY "Public can select order email logs" ON public.order_email_logs FOR SELECT TO public USING (true);
END $$;


-- ------------------------------------------------------------------------------
-- 2. Update `cancel_order_and_release_inventory` Procedure
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_order_and_release_inventory(
    p_order_id UUID,
    p_reason TEXT DEFAULT 'Order cancelled'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order_status order_status;
    v_item RECORD;
BEGIN
    SELECT status INTO v_order_status 
    FROM public.orders 
    WHERE id = p_order_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order % not found', p_order_id;
    END IF;

    -- Idempotency check: if already cancelled, exit safely
    IF v_order_status = 'CANCELLED' THEN
        RETURN;
    END IF;

    -- Case 1: Order was unpaid/pending checkout: release reserved inventory
    IF v_order_status = 'PENDING_PAYMENT' THEN
        FOR v_item IN
            SELECT variant_id, SUM(quantity) AS quantity
            FROM public.order_items
            WHERE order_id = p_order_id AND variant_id IS NOT NULL
            GROUP BY variant_id
            ORDER BY variant_id ASC
        LOOP
            UPDATE public.product_variants
            SET reserved_quantity = GREATEST(0, reserved_quantity - v_item.quantity),
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
                'order_cancellation_release',
                -v_item.quantity,
                stock_quantity,
                reserved_quantity,
                p_order_id::TEXT,
                'Unpaid order cancelled, reservation released'
            FROM public.product_variants 
            WHERE id = v_item.variant_id;
        END LOOP;

    -- Case 2: Order was confirmed, paid, or in processing: stock was already deducted, so RESTORE stock
    ELSIF v_order_status IN ('CONFIRMED', 'PAID', 'PROCESSING') THEN
        FOR v_item IN
            SELECT variant_id, SUM(quantity) AS quantity
            FROM public.order_items
            WHERE order_id = p_order_id AND variant_id IS NOT NULL
            GROUP BY variant_id
            ORDER BY variant_id ASC
        LOOP
            UPDATE public.product_variants
            SET stock_quantity = stock_quantity + v_item.quantity,
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
                'order_cancellation_release',
                v_item.quantity,
                stock_quantity,
                reserved_quantity,
                p_order_id::TEXT,
                'Confirmed order cancelled before dispatch, physical stock restored'
            FROM public.product_variants 
            WHERE id = v_item.variant_id;
        END LOOP;
    END IF;

    -- Update order status
    UPDATE public.orders 
    SET status = 'CANCELLED',
        updated_at = NOW() 
    WHERE id = p_order_id;

    -- Log status history
    INSERT INTO public.order_status_history (
        order_id,
        from_status,
        to_status,
        changed_by,
        comment
    ) VALUES (
        p_order_id,
        v_order_status,
        'CANCELLED',
        'system:cancellation',
        p_reason
    );
END;
$$;


-- ------------------------------------------------------------------------------
-- 3. Stored Procedure: `admin_update_order_status`
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_update_order_status(
    p_order_id UUID,
    p_status order_status,
    p_changed_by TEXT,
    p_comment TEXT DEFAULT NULL,
    p_courier_name TEXT DEFAULT NULL,
    p_tracking_number TEXT DEFAULT NULL,
    p_tracking_url TEXT DEFAULT NULL,
    p_estimated_delivery TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_order RECORD;
    v_old_status order_status;
    v_full_comment TEXT;
    v_tracking_parts TEXT[];
BEGIN
    SELECT * INTO v_current_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order % not found', p_order_id;
    END IF;

    v_old_status := v_current_order.status;

    -- Build structured comment with tracking metadata if provided
    v_full_comment := COALESCE(p_comment, 'Status updated from ' || v_old_status || ' to ' || p_status);
    v_tracking_parts := ARRAY[]::TEXT[];

    IF p_courier_name IS NOT NULL AND TRIM(p_courier_name) <> '' THEN
        v_tracking_parts := array_append(v_tracking_parts, 'Courier: ' || TRIM(p_courier_name));
    END IF;
    IF p_tracking_number IS NOT NULL AND TRIM(p_tracking_number) <> '' THEN
        v_tracking_parts := array_append(v_tracking_parts, 'AWB: ' || TRIM(p_tracking_number));
    END IF;
    IF p_tracking_url IS NOT NULL AND TRIM(p_tracking_url) <> '' THEN
        v_tracking_parts := array_append(v_tracking_parts, 'URL: ' || TRIM(p_tracking_url));
    END IF;
    IF p_estimated_delivery IS NOT NULL AND TRIM(p_estimated_delivery) <> '' THEN
        v_tracking_parts := array_append(v_tracking_parts, 'Est. Delivery: ' || TRIM(p_estimated_delivery));
    END IF;

    IF array_length(v_tracking_parts, 1) > 0 THEN
        v_full_comment := v_full_comment || ' | [TRACKING] ' || array_to_string(v_tracking_parts, ' | ');
    END IF;

    -- If status is already identical and no tracking update, return current state
    IF v_old_status = p_status AND array_length(v_tracking_parts, 1) IS NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'order_id', p_order_id,
            'status', p_status,
            'message', 'Order status is already up to date'
        );
    END IF;

    -- Handle transition to CANCELLED atomically
    IF p_status = 'CANCELLED' THEN
        PERFORM public.cancel_order_and_release_inventory(p_order_id, v_full_comment);
    ELSE
        -- Update order status
        UPDATE public.orders
        SET status = p_status,
            updated_at = NOW()
        WHERE id = p_order_id;

        -- Record status transition history
        INSERT INTO public.order_status_history (
            order_id,
            from_status,
            to_status,
            changed_by,
            comment
        ) VALUES (
            p_order_id,
            v_old_status,
            p_status,
            COALESCE(p_changed_by, 'admin'),
            v_full_comment
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'old_status', v_old_status,
        'new_status', p_status,
        'comment', v_full_comment
    );
END;
$$;


-- ------------------------------------------------------------------------------
-- 4. Stored Procedure: `get_guest_order` (Enhanced)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_guest_order(
    p_order_number TEXT,
    p_email TEXT
)
RETURNS TABLE (
    id UUID,
    order_number VARCHAR,
    status order_status,
    subtotal_amount NUMERIC,
    discount_amount NUMERIC,
    shipping_amount NUMERIC,
    tax_amount NUMERIC,
    grand_total NUMERIC,
    customer_snapshot JSONB,
    shipping_address_snapshot JSONB,
    admin_notes TEXT,
    customer_notes TEXT,
    created_at TIMESTAMPTZ,
    items JSONB,
    timeline JSONB,
    cancellations JSONB,
    exchanges JSONB,
    refunds JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id,
        o.order_number,
        o.status,
        o.subtotal_amount,
        o.discount_amount,
        o.shipping_amount,
        o.tax_amount,
        o.grand_total,
        o.customer_snapshot,
        o.shipping_address_snapshot,
        o.admin_notes,
        o.customer_notes,
        o.created_at,
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', oi.id,
                        'product_id', oi.product_id,
                        'variant_id', oi.variant_id,
                        'product_title', oi.product_title,
                        'variant_title', oi.variant_title,
                        'sku', oi.sku,
                        'image_url', oi.image_url,
                        'unit_price', oi.unit_price,
                        'unit_sale_price', oi.unit_sale_price,
                        'quantity', oi.quantity,
                        'total_price', oi.total_price
                    ) ORDER BY oi.created_at ASC
                )
                FROM public.order_items oi
                WHERE oi.order_id = o.id
            ),
            '[]'::JSONB
        ) AS items,
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'from_status', osh.from_status,
                        'status', osh.to_status,
                        'changed_by', osh.changed_by,
                        'note', osh.comment,
                        'timestamp', osh.created_at
                    ) ORDER BY osh.created_at ASC
                )
                FROM public.order_status_history osh
                WHERE osh.order_id = o.id
            ),
            '[]'::JSONB
        ) AS timeline,
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', oc.id,
                        'reason', oc.reason,
                        'details', oc.details,
                        'status', oc.status,
                        'admin_notes', oc.admin_notes,
                        'reviewed_at', oc.reviewed_at,
                        'created_at', oc.created_at
                    ) ORDER BY oc.created_at DESC
                )
                FROM public.order_cancellations oc
                WHERE oc.order_id = o.id
            ),
            '[]'::JSONB
        ) AS cancellations,
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', oe.id,
                        'order_item_id', oe.order_item_id,
                        'reason', oe.reason,
                        'details', oe.details,
                        'evidence_urls', oe.evidence_urls,
                        'replacement_variant_id', oe.replacement_variant_id,
                        'status', oe.status,
                        'pickup_courier', oe.pickup_courier,
                        'pickup_tracking_number', oe.pickup_tracking_number,
                        'replacement_courier', oe.replacement_courier,
                        'replacement_tracking_number', oe.replacement_tracking_number,
                        'admin_notes', oe.admin_notes,
                        'reviewed_at', oe.reviewed_at,
                        'created_at', oe.created_at
                    ) ORDER BY oe.created_at DESC
                )
                FROM public.order_exchanges oe
                WHERE oe.order_id = o.id
            ),
            '[]'::JSONB
        ) AS exchanges,
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', r.id,
                        'amount', r.amount,
                        'currency', r.currency,
                        'reason', r.reason,
                        'status', r.status,
                        'razorpay_refund_id', r.razorpay_refund_id,
                        'error_description', r.error_description,
                        'processed_at', r.processed_at,
                        'created_at', r.created_at
                    ) ORDER BY r.created_at DESC
                )
                FROM public.order_refunds r
                WHERE r.order_id = o.id
            ),
            '[]'::JSONB
        ) AS refunds
    FROM public.orders o
    LEFT JOIN public.customers c ON c.id = o.customer_id
    WHERE UPPER(TRIM(o.order_number)) = UPPER(TRIM(p_order_number))
      AND (
          LOWER(TRIM(COALESCE(c.email, ''))) = LOWER(TRIM(p_email))
          OR LOWER(TRIM(COALESCE(o.customer_snapshot->>'email', ''))) = LOWER(TRIM(p_email))
      )
    LIMIT 1;
END;
$$;


-- ------------------------------------------------------------------------------
-- 5. Stored Procedure: `customer_request_order_cancellation`
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.customer_request_order_cancellation(
    p_order_number TEXT,
    p_email TEXT,
    p_reason TEXT,
    p_details TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order RECORD;
    v_cancellation_id UUID;
    v_existing_request RECORD;
BEGIN
    -- Verify access
    SELECT o.id, o.order_number, o.status, o.customer_id, o.grand_total, o.customer_snapshot
    INTO v_order
    FROM public.orders o
    LEFT JOIN public.customers c ON c.id = o.customer_id
    WHERE UPPER(TRIM(o.order_number)) = UPPER(TRIM(p_order_number))
      AND (
          LOWER(TRIM(COALESCE(c.email, ''))) = LOWER(TRIM(p_email))
          OR LOWER(TRIM(COALESCE(o.customer_snapshot->>'email', ''))) = LOWER(TRIM(p_email))
      )
    FOR UPDATE OF o;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found or email verification failed';
    END IF;

    -- Eligibility check
    IF v_order.status IN ('SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED') THEN
        RAISE EXCEPTION 'Order has already been dispatched. Direct cancellation is no longer possible. Please request an exchange/return upon delivery.';
    END IF;

    IF v_order.status = 'CANCELLED' THEN
        RAISE EXCEPTION 'This order has already been cancelled.';
    END IF;

    IF v_order.status IN ('REFUNDED', 'REFUND_PENDING') THEN
        RAISE EXCEPTION 'This order is already being refunded.';
    END IF;

    -- Duplicate check
    SELECT id, status INTO v_existing_request
    FROM public.order_cancellations
    WHERE order_id = v_order.id
      AND status IN ('REQUESTED', 'UNDER_REVIEW', 'APPROVED');

    IF FOUND THEN
        RAISE EXCEPTION 'A cancellation request is already % for this order.', v_existing_request.status;
    END IF;

    -- Insert cancellation request
    INSERT INTO public.order_cancellations (
        order_id,
        customer_id,
        reason,
        details,
        status
    ) VALUES (
        v_order.id,
        v_order.customer_id,
        p_reason,
        p_details,
        'REQUESTED'
    ) RETURNING id INTO v_cancellation_id;

    -- Record audit log in order history
    INSERT INTO public.order_status_history (
        order_id,
        from_status,
        to_status,
        changed_by,
        comment
    ) VALUES (
        v_order.id,
        v_order.status,
        v_order.status,
        'customer:' || LOWER(TRIM(p_email)),
        'Cancellation requested by customer: ' || p_reason || CASE WHEN p_details IS NOT NULL AND p_details <> '' THEN ' (' || p_details || ')' ELSE '' END
    );

    RETURN jsonb_build_object(
        'success', true,
        'cancellation_id', v_cancellation_id,
        'order_id', v_order.id,
        'order_number', v_order.order_number,
        'status', 'REQUESTED'
    );
END;
$$;


-- ------------------------------------------------------------------------------
-- 6. Stored Procedure: `admin_process_cancellation`
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_process_cancellation(
    p_cancellation_id UUID,
    p_decision TEXT, -- 'APPROVE' or 'REJECT'
    p_admin_email TEXT,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cancellation RECORD;
    v_order RECORD;
    v_payment RECORD;
    v_refund_id UUID := NULL;
    v_new_cancellation_status VARCHAR(50);
BEGIN
    SELECT * INTO v_cancellation
    FROM public.order_cancellations
    WHERE id = p_cancellation_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cancellation request % not found', p_cancellation_id;
    END IF;

    SELECT * INTO v_order
    FROM public.orders
    WHERE id = v_cancellation.order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Associated order % not found', v_cancellation.order_id;
    END IF;

    IF p_decision = 'APPROVE' THEN
        v_new_cancellation_status := 'APPROVED';

        -- 1. Update cancellation record
        UPDATE public.order_cancellations
        SET status = 'APPROVED',
            admin_notes = p_notes,
            reviewed_by = p_admin_email,
            reviewed_at = NOW(),
            updated_at = NOW()
        WHERE id = p_cancellation_id;

        -- 2. Release / restore inventory and mark order CANCELLED
        PERFORM public.cancel_order_and_release_inventory(
            v_order.id,
            'Cancellation request approved by ' || p_admin_email || COALESCE(': ' || p_notes, '')
        );

        -- 3. Check if payment was captured; if captured, create refund record
        SELECT * INTO v_payment
        FROM public.payments
        WHERE order_id = v_order.id
          AND status = 'captured'
        ORDER BY created_at DESC
        LIMIT 1;

        IF FOUND AND v_payment.amount > 0 THEN
            INSERT INTO public.order_refunds (
                order_id,
                payment_id,
                cancellation_id,
                amount,
                currency,
                reason,
                status,
                razorpay_payment_id,
                admin_notes,
                approved_by,
                approved_at
            ) VALUES (
                v_order.id,
                v_payment.id,
                p_cancellation_id,
                v_payment.amount,
                COALESCE(v_payment.currency, 'INR'),
                'Order cancellation refund: ' || v_cancellation.reason,
                'APPROVED',
                v_payment.razorpay_payment_id,
                p_notes,
                p_admin_email,
                NOW()
            ) RETURNING id INTO v_refund_id;
        END IF;

    ELSIF p_decision = 'REJECT' THEN
        v_new_cancellation_status := 'REJECTED';

        UPDATE public.order_cancellations
        SET status = 'REJECTED',
            admin_notes = p_notes,
            reviewed_by = p_admin_email,
            reviewed_at = NOW(),
            updated_at = NOW()
        WHERE id = p_cancellation_id;

        INSERT INTO public.order_status_history (
            order_id,
            from_status,
            to_status,
            changed_by,
            comment
        ) VALUES (
            v_order.id,
            v_order.status,
            v_order.status,
            'admin:' || p_admin_email,
            'Cancellation request rejected: ' || COALESCE(p_notes, 'Eligibility requirements not met')
        );
    ELSE
        RAISE EXCEPTION 'Invalid decision: %. Expected APPROVE or REJECT.', p_decision;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'cancellation_id', p_cancellation_id,
        'status', v_new_cancellation_status,
        'order_id', v_order.id,
        'refund_id', v_refund_id
    );
END;
$$;


-- ------------------------------------------------------------------------------
-- 7. Stored Procedure: `customer_request_order_exchange`
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.customer_request_order_exchange(
    p_order_number TEXT,
    p_email TEXT,
    p_order_item_id UUID,
    p_reason TEXT,
    p_details TEXT DEFAULT NULL,
    p_evidence_urls TEXT[] DEFAULT '{}'::TEXT[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_exchange_id UUID;
    v_existing_exchange RECORD;
BEGIN
    -- Verify order access
    SELECT o.id, o.order_number, o.status, o.customer_id, o.created_at, o.customer_snapshot
    INTO v_order
    FROM public.orders o
    LEFT JOIN public.customers c ON c.id = o.customer_id
    WHERE UPPER(TRIM(o.order_number)) = UPPER(TRIM(p_order_number))
      AND (
          LOWER(TRIM(COALESCE(c.email, ''))) = LOWER(TRIM(p_email))
          OR LOWER(TRIM(COALESCE(o.customer_snapshot->>'email', ''))) = LOWER(TRIM(p_email))
      )
    FOR UPDATE OF o;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found or email verification failed';
    END IF;

    -- Order must be DELIVERED to request an exchange
    IF v_order.status <> 'DELIVERED' THEN
        RAISE EXCEPTION 'Exchange requests are only eligible for delivered orders (Current order status: %).', v_order.status;
    END IF;

    -- Verify item belongs to order
    SELECT * INTO v_item
    FROM public.order_items
    WHERE id = p_order_item_id AND order_id = v_order.id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Item does not belong to order %', p_order_number;
    END IF;

    -- Check for existing active exchange for this item
    SELECT id, status INTO v_existing_exchange
    FROM public.order_exchanges
    WHERE order_id = v_order.id
      AND order_item_id = p_order_item_id
      AND status NOT IN ('REJECTED', 'CANCELLED');

    IF FOUND THEN
        RAISE EXCEPTION 'An active exchange request is already % for this item.', v_existing_exchange.status;
    END IF;

    -- Insert exchange record
    INSERT INTO public.order_exchanges (
        order_id,
        order_item_id,
        customer_id,
        reason,
        details,
        evidence_urls,
        status
    ) VALUES (
        v_order.id,
        p_order_item_id,
        v_order.customer_id,
        p_reason,
        p_details,
        p_evidence_urls,
        'REQUESTED'
    ) RETURNING id INTO v_exchange_id;

    -- Log to status history
    INSERT INTO public.order_status_history (
        order_id,
        from_status,
        to_status,
        changed_by,
        comment
    ) VALUES (
        v_order.id,
        v_order.status,
        v_order.status,
        'customer:' || LOWER(TRIM(p_email)),
        'Exchange requested for ' || v_item.product_title || ' (Reason: ' || p_reason || ')'
    );

    RETURN jsonb_build_object(
        'success', true,
        'exchange_id', v_exchange_id,
        'order_id', v_order.id,
        'status', 'REQUESTED'
    );
END;
$$;


-- ------------------------------------------------------------------------------
-- 8. Stored Procedure: `admin_process_exchange`
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_process_exchange(
    p_exchange_id UUID,
    p_decision TEXT, -- 'APPROVE', 'REJECT', 'PICKUP_SCHEDULED', 'INSPECTION_PENDING', 'REPLACEMENT_DISPATCHED', 'COMPLETED'
    p_admin_email TEXT,
    p_notes TEXT DEFAULT NULL,
    p_replacement_variant_id UUID DEFAULT NULL,
    p_pickup_courier TEXT DEFAULT NULL,
    p_pickup_awb TEXT DEFAULT NULL,
    p_replacement_courier TEXT DEFAULT NULL,
    p_replacement_awb TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_exchange RECORD;
    v_order RECORD;
    v_variant RECORD;
BEGIN
    SELECT * INTO v_exchange
    FROM public.order_exchanges
    WHERE id = p_exchange_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Exchange request % not found', p_exchange_id;
    END IF;

    SELECT * INTO v_order
    FROM public.orders
    WHERE id = v_exchange.order_id
    FOR UPDATE;

    -- Verify replacement variant stock if approving/dispatching
    IF p_replacement_variant_id IS NOT NULL THEN
        SELECT * INTO v_variant
        FROM public.product_variants
        WHERE id = p_replacement_variant_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Replacement product variant % not found', p_replacement_variant_id;
        END IF;

        IF (v_variant.stock_quantity - v_variant.reserved_quantity) < 1 AND p_decision IN ('APPROVE', 'REPLACEMENT_DISPATCHED') THEN
            RAISE EXCEPTION 'Insufficient stock for replacement variant (Available: %)', (v_variant.stock_quantity - v_variant.reserved_quantity);
        END IF;
    END IF;

    -- Update exchange record
    UPDATE public.order_exchanges
    SET status = p_decision,
        admin_notes = COALESCE(p_notes, admin_notes),
        replacement_variant_id = COALESCE(p_replacement_variant_id, replacement_variant_id),
        pickup_courier = COALESCE(p_pickup_courier, pickup_courier),
        pickup_tracking_number = COALESCE(p_pickup_awb, pickup_tracking_number),
        replacement_courier = COALESCE(p_replacement_courier, replacement_courier),
        replacement_tracking_number = COALESCE(p_replacement_awb, replacement_tracking_number),
        reviewed_by = p_admin_email,
        reviewed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_exchange_id;

    -- If replacement dispatched, deduct replacement variant inventory
    IF p_decision = 'REPLACEMENT_DISPATCHED' AND p_replacement_variant_id IS NOT NULL THEN
        UPDATE public.product_variants
        SET stock_quantity = GREATEST(0, stock_quantity - 1),
            updated_at = NOW()
        WHERE id = p_replacement_variant_id;

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
            -1,
            stock_quantity,
            reserved_quantity,
            v_order.id::TEXT,
            'Replacement dispatch for exchange ' || p_exchange_id::TEXT
        FROM public.product_variants
        WHERE id = p_replacement_variant_id;
    END IF;

    -- Record status history
    INSERT INTO public.order_status_history (
        order_id,
        from_status,
        to_status,
        changed_by,
        comment
    ) VALUES (
        v_order.id,
        v_order.status,
        v_order.status,
        'admin:' || p_admin_email,
        'Exchange updated to ' || p_decision || COALESCE(': ' || p_notes, '')
    );

    RETURN jsonb_build_object(
        'success', true,
        'exchange_id', p_exchange_id,
        'status', p_decision
    );
END;
$$;


-- ------------------------------------------------------------------------------
-- 9. Stored Procedure: `admin_record_refund`
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_record_refund(
    p_order_id UUID,
    p_amount NUMERIC,
    p_reason TEXT,
    p_razorpay_refund_id TEXT,
    p_razorpay_payment_id TEXT,
    p_status TEXT, -- 'PROCESSING', 'COMPLETED', 'FAILED', 'REJECTED'
    p_admin_email TEXT,
    p_cancellation_id UUID DEFAULT NULL,
    p_exchange_id UUID DEFAULT NULL,
    p_error_code TEXT DEFAULT NULL,
    p_error_description TEXT DEFAULT NULL,
    p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order RECORD;
    v_payment RECORD;
    v_refund_id UUID;
    v_total_refunded NUMERIC := 0;
BEGIN
    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order % not found', p_order_id;
    END IF;

    SELECT * INTO v_payment
    FROM public.payments
    WHERE order_id = p_order_id
    ORDER BY created_at DESC
    LIMIT 1;

    -- Upsert / record refund entry
    INSERT INTO public.order_refunds (
        order_id,
        payment_id,
        cancellation_id,
        exchange_id,
        amount,
        currency,
        reason,
        status,
        razorpay_refund_id,
        razorpay_payment_id,
        error_code,
        error_description,
        approved_by,
        approved_at,
        processed_at,
        idempotency_key
    ) VALUES (
        p_order_id,
        v_payment.id,
        p_cancellation_id,
        p_exchange_id,
        p_amount,
        COALESCE(v_payment.currency, 'INR'),
        p_reason,
        p_status,
        p_razorpay_refund_id,
        p_razorpay_payment_id,
        p_error_code,
        p_error_description,
        p_admin_email,
        NOW(),
        CASE WHEN p_status IN ('PROCESSING', 'COMPLETED') THEN NOW() ELSE NULL END,
        p_idempotency_key
    )
    ON CONFLICT (idempotency_key) DO UPDATE
    SET status = EXCLUDED.status,
        razorpay_refund_id = COALESCE(EXCLUDED.razorpay_refund_id, order_refunds.razorpay_refund_id),
        error_code = EXCLUDED.error_code,
        error_description = EXCLUDED.error_description,
        processed_at = CASE WHEN EXCLUDED.status IN ('PROCESSING', 'COMPLETED') THEN NOW() ELSE order_refunds.processed_at END,
        updated_at = NOW()
    RETURNING id INTO v_refund_id;

    -- If refund processed or completed, update payment record
    IF p_status IN ('PROCESSING', 'COMPLETED') AND v_payment.id IS NOT NULL THEN
        SELECT COALESCE(SUM(amount), 0) INTO v_total_refunded
        FROM public.order_refunds
        WHERE order_id = p_order_id AND status IN ('PROCESSING', 'COMPLETED');

        UPDATE public.payments
        SET refund_id = COALESCE(p_razorpay_refund_id, refund_id),
            refund_amount = v_total_refunded,
            refund_notes = p_reason,
            status = CASE 
                WHEN v_total_refunded >= v_order.grand_total THEN 'refunded'::payment_status
                ELSE 'refund_pending'::payment_status
            END,
            updated_at = NOW()
        WHERE id = v_payment.id;

        -- If full amount refunded, transition order status to REFUNDED
        IF v_total_refunded >= v_order.grand_total THEN
            UPDATE public.orders
            SET status = 'REFUNDED',
                updated_at = NOW()
            WHERE id = p_order_id;

            INSERT INTO public.order_status_history (
                order_id,
                from_status,
                to_status,
                changed_by,
                comment
            ) VALUES (
                p_order_id,
                v_order.status,
                'REFUNDED',
                'system:refund_settlement',
                'Full refund processed via Razorpay (' || COALESCE(p_razorpay_refund_id, '') || ')'
            );
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'refund_id', v_refund_id,
        'order_id', p_order_id,
        'status', p_status
    );
END;
$$;
