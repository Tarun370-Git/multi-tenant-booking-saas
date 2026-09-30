-- Multi-Tenant Security & Row-Level Security (RLS) Policies
-- Version: 1.0

-- Enable Row Level Security (RLS) on all tenant-owned tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to return business IDs accessible by current user auth.uid()
CREATE OR REPLACE FUNCTION get_user_business_ids(user_uuid UUID)
RETURNS SETOF UUID AS $$
  SELECT business_id FROM business_members WHERE user_id = user_uuid;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

---------------------------------------------------------
-- PUBLIC CLIENT POLICIES (Unauthenticated Booking Flow)
---------------------------------------------------------

-- Public can view active businesses by slug
DROP POLICY IF EXISTS "Public businesses viewable" ON businesses;
CREATE POLICY "Public businesses viewable" ON businesses
  FOR SELECT USING (status = 'active');

-- Public can view active services
DROP POLICY IF EXISTS "Public services viewable" ON services;
CREATE POLICY "Public services viewable" ON services
  FOR SELECT USING (active = true);

-- Public can view active providers
DROP POLICY IF EXISTS "Public providers viewable" ON providers;
CREATE POLICY "Public providers viewable" ON providers
  FOR SELECT USING (active = true);

-- Public can view provider services mapping
DROP POLICY IF EXISTS "Public provider services viewable" ON provider_services;
CREATE POLICY "Public provider services viewable" ON provider_services
  FOR SELECT USING (true);

-- Public can view business operating hours
DROP POLICY IF EXISTS "Public business hours viewable" ON business_hours;
CREATE POLICY "Public business hours viewable" ON business_hours
  FOR SELECT USING (enabled = true);

-- Public can view provider hours
DROP POLICY IF EXISTS "Public provider hours viewable" ON provider_hours;
CREATE POLICY "Public provider hours viewable" ON provider_hours
  FOR SELECT USING (enabled = true);

-- Public can view blocked periods for slot calculation
DROP POLICY IF EXISTS "Public blocked periods viewable" ON blocked_periods;
CREATE POLICY "Public blocked periods viewable" ON blocked_periods
  FOR SELECT USING (true);

---------------------------------------------------------
-- TENANT ADMIN POLICIES (Authenticated Business Owner/Admin)
---------------------------------------------------------

-- Businesses Table
DROP POLICY IF EXISTS "Tenant owners manage business" ON businesses;
CREATE POLICY "Tenant owners manage business" ON businesses
  FOR ALL USING (id IN (SELECT get_user_business_ids(auth.uid())));

-- Business Members Table
DROP POLICY IF EXISTS "Tenant manage business members" ON business_members;
CREATE POLICY "Tenant manage business members" ON business_members
  FOR ALL USING (business_id IN (SELECT get_user_business_ids(auth.uid())));

-- Services Table
DROP POLICY IF EXISTS "Tenant manage services" ON services;
CREATE POLICY "Tenant manage services" ON services
  FOR ALL USING (business_id IN (SELECT get_user_business_ids(auth.uid())));

-- Providers Table
DROP POLICY IF EXISTS "Tenant manage providers" ON providers;
CREATE POLICY "Tenant manage providers" ON providers
  FOR ALL USING (business_id IN (SELECT get_user_business_ids(auth.uid())));

-- Provider Services Table
DROP POLICY IF EXISTS "Tenant manage provider services" ON provider_services;
CREATE POLICY "Tenant manage provider services" ON provider_services
  FOR ALL USING (
    provider_id IN (
      SELECT id FROM providers WHERE business_id IN (SELECT get_user_business_ids(auth.uid()))
    )
  );

-- Business Hours Table
DROP POLICY IF EXISTS "Tenant manage business hours" ON business_hours;
CREATE POLICY "Tenant manage business hours" ON business_hours
  FOR ALL USING (business_id IN (SELECT get_user_business_ids(auth.uid())));

-- Provider Hours Table
DROP POLICY IF EXISTS "Tenant manage provider hours" ON provider_hours;
CREATE POLICY "Tenant manage provider hours" ON provider_hours
  FOR ALL USING (
    provider_id IN (
      SELECT id FROM providers WHERE business_id IN (SELECT get_user_business_ids(auth.uid()))
    )
  );

-- Blocked Periods Table
DROP POLICY IF EXISTS "Tenant manage blocked periods" ON blocked_periods;
CREATE POLICY "Tenant manage blocked periods" ON blocked_periods
  FOR ALL USING (business_id IN (SELECT get_user_business_ids(auth.uid())));

-- Clients (CRM) - Private to tenant only
DROP POLICY IF EXISTS "Tenant manage clients" ON clients;
CREATE POLICY "Tenant manage clients" ON clients
  FOR ALL USING (business_id IN (SELECT get_user_business_ids(auth.uid())));

-- Bookings - Private to tenant only
DROP POLICY IF EXISTS "Tenant manage bookings" ON bookings;
CREATE POLICY "Tenant manage bookings" ON bookings
  FOR ALL USING (business_id IN (SELECT get_user_business_ids(auth.uid())));

-- Booking Events
DROP POLICY IF EXISTS "Tenant manage booking events" ON booking_events;
CREATE POLICY "Tenant manage booking events" ON booking_events
  FOR ALL USING (
    booking_id IN (
      SELECT id FROM bookings WHERE business_id IN (SELECT get_user_business_ids(auth.uid()))
    )
  );

-- Reminders
DROP POLICY IF EXISTS "Tenant manage reminders" ON reminders;
CREATE POLICY "Tenant manage reminders" ON reminders
  FOR ALL USING (
    booking_id IN (
      SELECT id FROM bookings WHERE business_id IN (SELECT get_user_business_ids(auth.uid()))
    )
  );

-- Subscriptions
DROP POLICY IF EXISTS "Tenant view subscriptions" ON subscriptions;
CREATE POLICY "Tenant view subscriptions" ON subscriptions
  FOR ALL USING (business_id IN (SELECT get_user_business_ids(auth.uid())));

-- Notification Logs
DROP POLICY IF EXISTS "Tenant view notification logs" ON notification_logs;
CREATE POLICY "Tenant view notification logs" ON notification_logs
  FOR ALL USING (business_id IN (SELECT get_user_business_ids(auth.uid())));
