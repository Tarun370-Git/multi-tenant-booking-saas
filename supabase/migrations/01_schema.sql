-- Multi-Tenant Appointment & Booking SaaS - Core Database Schema
-- Version: 1.0

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum Types
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('owner', 'admin', 'staff');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
    CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_source') THEN
    CREATE TYPE booking_source AS ENUM ('public_web', 'admin_manual', 'ai_assistant');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reminder_status') THEN
    CREATE TYPE reminder_status AS ENUM ('pending', 'sent', 'failed', 'skipped');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'reminder_channel') THEN
    CREATE TYPE reminder_channel AS ENUM ('email', 'sms');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
    CREATE TYPE subscription_status AS ENUM ('active', 'trialing', 'past_due', 'cancelled', 'incomplete');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan') THEN
    CREATE TYPE subscription_plan AS ENUM ('starter', 'pro', 'enterprise');
  END IF;
END $$;

-- 1. Businesses Table (Tenants)
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  phone TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Business Members (RBAC & Tenant Mapping)
CREATE TABLE IF NOT EXISTS business_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role user_role NOT NULL DEFAULT 'owner',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, user_id)
);

-- 3. Bookable Services
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
  price INT NOT NULL CHECK (price >= 0), -- stored in cents / minor units ($35.00 -> 3500)
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Staff / Providers
CREATE TABLE IF NOT EXISTS providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Provider Capability Mapping
CREATE TABLE IF NOT EXISTS provider_services (
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (provider_id, service_id)
);

-- 6. Business Hours (Default Operating Schedule)
CREATE TABLE IF NOT EXISTS business_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(business_id, day_of_week)
);

-- 7. Provider Specific Hours
CREATE TABLE IF NOT EXISTS provider_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(provider_id, day_of_week)
);

-- 8. Blocked Periods (Holidays / Breaks)
CREATE TABLE IF NOT EXISTS blocked_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE, -- NULL means business-wide
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Clients (CRM Records)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  notes TEXT, -- private internal business notes
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, email)
);

-- 10. Bookings (Appointments)
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE RESTRICT,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status booking_status NOT NULL DEFAULT 'confirmed',
  price INT NOT NULL,
  source booking_source NOT NULL DEFAULT 'public_web',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Booking Event History / Audit Trail
CREATE TABLE IF NOT EXISTS booking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- e.g. 'created', 'status_changed', 'rescheduled'
  actor_id TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Automated Reminders Queue
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  channel reminder_channel NOT NULL DEFAULT 'email',
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status reminder_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(booking_id, channel)
);

-- 13. Subscriptions (Billing State)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE UNIQUE,
  provider_customer_id TEXT,
  provider_subscription_id TEXT,
  plan subscription_plan NOT NULL DEFAULT 'pro',
  status subscription_status NOT NULL DEFAULT 'active',
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 14. Notification Logs (Audit Trail for Reminders & Confirmations)
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  channel reminder_channel NOT NULL,
  template TEXT NOT NULL,
  status TEXT NOT NULL,
  provider_message_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance & query optimization
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);
CREATE INDEX IF NOT EXISTS idx_business_members_user ON business_members(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_business_dates ON bookings(business_id, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_dates ON bookings(provider_id, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_clients_business_search ON clients(business_id, email, name, phone);
CREATE INDEX IF NOT EXISTS idx_reminders_status_scheduled ON reminders(status, scheduled_for);
