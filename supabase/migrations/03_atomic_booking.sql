-- Multi-Tenant Appointment & Booking SaaS - Atomic Booking RPC
-- Prevents double bookings and race conditions via SELECT FOR UPDATE locks

CREATE OR REPLACE FUNCTION create_booking_atomic(
  p_business_id UUID,
  p_service_id UUID,
  p_provider_id UUID,
  p_client_name TEXT,
  p_client_email TEXT,
  p_client_phone TEXT,
  p_starts_at TIMESTAMPTZ,
  p_ends_at TIMESTAMPTZ,
  p_notes TEXT DEFAULT NULL,
  p_source booking_source DEFAULT 'public_web'
) RETURNS JSONB AS $$
DECLARE
  v_client_id UUID;
  v_booking_id UUID;
  v_service_price INT;
  v_overlap_count INT;
  v_blocked_count INT;
BEGIN
  -- 1. Get or create Client record (deduplicating by business_id + email)
  INSERT INTO clients (business_id, name, email, phone)
  VALUES (p_business_id, p_client_name, LOWER(TRIM(p_client_email)), p_client_phone)
  ON CONFLICT (business_id, email) DO UPDATE
  SET name = EXCLUDED.name,
      phone = COALESCE(EXCLUDED.phone, clients.phone)
  RETURNING id INTO v_client_id;

  -- 2. Fetch service price and validate active status
  SELECT price INTO v_service_price
  FROM services
  WHERE id = p_service_id AND business_id = p_business_id AND active = true;

  IF v_service_price IS NULL THEN
    RAISE EXCEPTION 'Invalid or inactive service';
  END IF;

  -- 3. Acquire lock on provider's existing active bookings for concurrency safety
  PERFORM 1 FROM bookings
  WHERE provider_id = p_provider_id
    AND status IN ('confirmed', 'pending')
  FOR UPDATE;

  -- Check existing active booking overlaps: (existing_start < requested_end AND existing_end > requested_start)
  SELECT COUNT(*) INTO v_overlap_count
  FROM bookings
  WHERE provider_id = p_provider_id
    AND status IN ('confirmed', 'pending')
    AND starts_at < p_ends_at
    AND ends_at > p_starts_at;

  IF v_overlap_count > 0 THEN
    RAISE EXCEPTION 'SLOT_UNAVAILABLE: Time slot is already booked by another customer';
  END IF;

  -- 4. Check for blocked periods overlap
  SELECT COUNT(*) INTO v_blocked_count
  FROM blocked_periods
  WHERE business_id = p_business_id
    AND (provider_id IS NULL OR provider_id = p_provider_id)
    AND starts_at < p_ends_at
    AND ends_at > p_starts_at;

  IF v_blocked_count > 0 THEN
    RAISE EXCEPTION 'SLOT_BLOCKED: Provider is unavailable during this time period';
  END IF;

  -- 5. Insert the new booking
  INSERT INTO bookings (
    business_id, service_id, provider_id, client_id,
    starts_at, ends_at, status, price, source, notes
  ) VALUES (
    p_business_id, p_service_id, p_provider_id, v_client_id,
    p_starts_at, p_ends_at, 'confirmed', v_service_price, p_source, p_notes
  ) RETURNING id INTO v_booking_id;

  -- 6. Record audit event
  INSERT INTO booking_events (booking_id, event_type, actor_id, metadata)
  VALUES (
    v_booking_id,
    'created',
    COALESCE(p_client_email, 'public_client'),
    jsonb_build_object('source', p_source, 'starts_at', p_starts_at, 'ends_at', p_ends_at)
  );

  -- 7. Schedule 24h reminder job
  INSERT INTO reminders (booking_id, channel, scheduled_for, status)
  VALUES (
    v_booking_id,
    'email',
    p_starts_at - INTERVAL '24 hours',
    'pending'
  ) ON CONFLICT (booking_id, channel) DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'client_id', v_client_id,
    'starts_at', p_starts_at,
    'ends_at', p_ends_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
