-- Multi-Tenant Appointment & Booking SaaS - Seed Data Script
-- Includes 2 distinct tenants for reviewer validation and testing

-- Clear existing sample data if re-running
TRUNCATE businesses CASCADE;

-- Business 1: Apex Barber Shop
WITH b1 AS (
  INSERT INTO businesses (id, owner_user_id, name, slug, timezone, phone, email, status)
  VALUES (
    '11111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    'Apex Barber Shop',
    'apex-barbers',
    'America/New_York',
    '+1 (555) 234-5678',
    'contact@apexbarbers.com',
    'active'
  ) RETURNING id
),
bm1 AS (
  INSERT INTO business_members (business_id, user_id, role)
  VALUES ('11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'owner')
),
s1 AS (
  INSERT INTO services (id, business_id, name, description, duration_minutes, price, active)
  VALUES 
    ('11111111-2222-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Classic Haircut', 'Precision haircut with hot towel treatment', 30, 3500, true),
    ('11111111-2222-1111-1111-222222222222', '11111111-1111-1111-1111-111111111111', 'Beard Trim & Styling', 'Beard shaping, oil treatment, and hot lather shave', 20, 2500, true),
    ('11111111-2222-1111-1111-333333333333', '11111111-1111-1111-1111-111111111111', 'Executive Haircut & Shave', 'Full luxury haircut, straight razor shave, and facial treatment', 60, 7000, true)
),
p1 AS (
  INSERT INTO providers (id, business_id, name, email, active)
  VALUES 
    ('11111111-3333-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Marcus Vance', 'marcus@apexbarbers.com', true),
    ('11111111-3333-1111-1111-222222222222', '11111111-1111-1111-1111-111111111111', 'Leo Martinez', 'leo@apexbarbers.com', true)
),
ps1 AS (
  INSERT INTO provider_services (provider_id, service_id)
  VALUES
    ('11111111-3333-1111-1111-111111111111', '11111111-2222-1111-1111-111111111111'),
    ('11111111-3333-1111-1111-111111111111', '11111111-2222-1111-1111-222222222222'),
    ('11111111-3333-1111-1111-111111111111', '11111111-2222-1111-1111-333333333333'),
    ('11111111-3333-1111-1111-222222222222', '11111111-2222-1111-1111-111111111111'),
    ('11111111-3333-1111-1111-222222222222', '11111111-2222-1111-1111-222222222222')
),
bh1 AS (
  INSERT INTO business_hours (business_id, day_of_week, start_time, end_time, enabled)
  VALUES 
    ('11111111-1111-1111-1111-111111111111', 1, '09:00:00', '18:00:00', true), -- Mon
    ('11111111-1111-1111-1111-111111111111', 2, '09:00:00', '18:00:00', true), -- Tue
    ('11111111-1111-1111-1111-111111111111', 3, '09:00:00', '18:00:00', true), -- Wed
    ('11111111-1111-1111-1111-111111111111', 4, '09:00:00', '18:00:00', true), -- Thu
    ('11111111-1111-1111-1111-111111111111', 5, '09:00:00', '19:00:00', true), -- Fri
    ('11111111-1111-1111-1111-111111111111', 6, '09:00:00', '17:00:00', true), -- Sat
    ('11111111-1111-1111-1111-111111111111', 0, '10:00:00', '15:00:00', false) -- Sun closed
),
sub1 AS (
  INSERT INTO subscriptions (business_id, provider_customer_id, provider_subscription_id, plan, status)
  VALUES ('11111111-1111-1111-1111-111111111111', 'cus_apex123', 'sub_apex123', 'pro', 'active')
)
SELECT 1;

-- Clients & Bookings for Apex Barber Shop
INSERT INTO clients (id, business_id, name, email, phone, notes)
VALUES 
  ('11111111-4444-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'John Doe', 'john@example.com', '+1 555-0192', 'Prefers low fade'),
  ('11111111-4444-1111-1111-222222222222', '11111111-1111-1111-1111-111111111111', 'David Smith', 'david@example.com', '+1 555-0193', 'Sensitive skin');

INSERT INTO bookings (id, business_id, service_id, provider_id, client_id, starts_at, ends_at, status, price, source)
VALUES 
  (
    '11111111-5555-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    '11111111-2222-1111-1111-111111111111',
    '11111111-3333-1111-1111-111111111111',
    '11111111-4444-1111-1111-111111111111',
    now() + INTERVAL '1 day' + INTERVAL '10 hours',
    now() + INTERVAL '1 day' + INTERVAL '10 hours 30 minutes',
    'confirmed',
    3500,
    'public_web'
  ),
  (
    '11111111-5555-1111-1111-222222222222',
    '11111111-1111-1111-1111-111111111111',
    '11111111-2222-1111-1111-222222222222',
    '11111111-3333-1111-1111-222222222222',
    '11111111-4444-1111-1111-222222222222',
    now() + INTERVAL '2 days' + INTERVAL '14 hours',
    now() + INTERVAL '2 days' + INTERVAL '14 hours 20 minutes',
    'confirmed',
    2500,
    'public_web'
  );


-- Business 2: Lumina Wellness Clinic
WITH b2 AS (
  INSERT INTO businesses (id, owner_user_id, name, slug, timezone, phone, email, status)
  VALUES (
    '22222222-2222-2222-2222-222222222222',
    'b2222222-2222-2222-2222-222222222222',
    'Lumina Wellness Clinic',
    'lumina-wellness',
    'America/Los_Angeles',
    '+1 (555) 987-6543',
    'info@luminawellness.com',
    'active'
  ) RETURNING id
),
bm2 AS (
  INSERT INTO business_members (business_id, user_id, role)
  VALUES ('22222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'owner')
),
s2 AS (
  INSERT INTO services (id, business_id, name, description, duration_minutes, price, active)
  VALUES 
    ('22222222-2222-2222-2222-111111111111', '22222222-2222-2222-2222-222222222222', 'Initial Health Consultation', 'Comprehensive wellness assessment and treatment planning', 45, 12000, true),
    ('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Deep Tissue Therapy', 'Targeted neuromuscular deep tissue massage', 60, 9500, true),
    ('22222222-2222-2222-2222-333333333333', '22222222-2222-2222-2222-222222222222', 'Acupuncture Session', 'Traditional holistic acupuncture therapy', 60, 11000, true)
),
p2 AS (
  INSERT INTO providers (id, business_id, name, email, active)
  VALUES 
    ('22222222-3333-2222-2222-111111111111', '22222222-2222-2222-2222-222222222222', 'Dr. Sarah Jenkins', 'sarah@luminawellness.com', true),
    ('22222222-3333-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Dr. Alex Rivera', 'alex@luminawellness.com', true)
),
ps2 AS (
  INSERT INTO provider_services (provider_id, service_id)
  VALUES
    ('22222222-3333-2222-2222-111111111111', '22222222-2222-2222-2222-111111111111'),
    ('22222222-3333-2222-2222-111111111111', '22222222-2222-2222-2222-222222222222'),
    ('22222222-3333-2222-2222-222222222222', '22222222-2222-2222-2222-333333333333')
),
bh2 AS (
  INSERT INTO business_hours (business_id, day_of_week, start_time, end_time, enabled)
  VALUES 
    ('22222222-2222-2222-2222-222222222222', 1, '08:30:00', '17:00:00', true),
    ('22222222-2222-2222-2222-222222222222', 2, '08:30:00', '17:00:00', true),
    ('22222222-2222-2222-2222-222222222222', 3, '08:30:00', '17:00:00', true),
    ('22222222-2222-2222-2222-222222222222', 4, '08:30:00', '17:00:00', true),
    ('22222222-2222-2222-2222-222222222222', 5, '08:30:00', '16:00:00', true),
    ('22222222-2222-2222-2222-222222222222', 6, '09:00:00', '13:00:00', false),
    ('22222222-2222-2222-2222-222222222222', 0, '09:00:00', '13:00:00', false)
),
sub2 AS (
  INSERT INTO subscriptions (business_id, provider_customer_id, provider_subscription_id, plan, status)
  VALUES ('22222222-2222-2222-2222-222222222222', 'cus_lumina456', 'sub_lumina456', 'pro', 'active')
)
SELECT 2;

-- Clients & Bookings for Lumina Wellness
INSERT INTO clients (id, business_id, name, email, phone, notes)
VALUES 
  ('22222222-4444-2222-2222-111111111111', '22222222-2222-2222-2222-222222222222', 'Emma Watson', 'emma@example.com', '+1 555-9011', 'Lower back tension'),
  ('22222222-4444-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Michael Brown', 'michael@example.com', '+1 555-9012', 'First time acupuncture');

INSERT INTO bookings (id, business_id, service_id, provider_id, client_id, starts_at, ends_at, status, price, source)
VALUES 
  (
    '22222222-5555-2222-2222-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-111111111111',
    '22222222-3333-2222-2222-111111111111',
    '22222222-4444-2222-2222-111111111111',
    now() + INTERVAL '1 day' + INTERVAL '11 hours',
    now() + INTERVAL '1 day' + INTERVAL '11 hours 45 minutes',
    'confirmed',
    12000,
    'public_web'
  );
