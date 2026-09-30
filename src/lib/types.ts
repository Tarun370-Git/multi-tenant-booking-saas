// Core TypeScript Interfaces for Multi-Tenant Appointment & Booking SaaS

export type UserRole = 'owner' | 'admin' | 'staff';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
export type BookingSource = 'public_web' | 'admin_manual' | 'ai_assistant';
export type ReminderStatus = 'pending' | 'sent' | 'failed' | 'skipped';
export type ReminderChannel = 'email' | 'sms';
export type SubscriptionPlan = 'starter' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'cancelled' | 'incomplete';

export interface Business {
  id: string;
  owner_user_id: string;
  name: string;
  slug: string;
  timezone: string;
  phone?: string;
  email?: string;
  status: 'active' | 'suspended' | 'inactive';
  created_at: string;
}

export interface BusinessMember {
  id: string;
  business_id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export interface Service {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price: number; // stored in cents (e.g., $35.00 -> 3500)
  active: boolean;
  created_at: string;
}

export interface Provider {
  id: string;
  business_id: string;
  name: string;
  email?: string;
  phone?: string;
  active: boolean;
  created_at: string;
  service_ids?: string[];
}

export interface BusinessHours {
  id: string;
  business_id: string;
  day_of_week: number; // 0 = Sun, 6 = Sat
  start_time: string; // HH:mm:ss
  end_time: string;   // HH:mm:ss
  enabled: boolean;
}

export interface ProviderHours {
  id: string;
  provider_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  enabled: boolean;
}

export interface BlockedPeriod {
  id: string;
  business_id: string;
  provider_id?: string;
  starts_at: string;
  ends_at: string;
  reason?: string;
  created_at: string;
}

export interface Client {
  id: string;
  business_id: string;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  created_at: string;
  // Computed CRM fields
  total_bookings?: number;
  lifetime_value?: number;
  last_appointment?: string;
  next_appointment?: string;
}

export interface Booking {
  id: string;
  business_id: string;
  service_id: string;
  provider_id: string;
  client_id: string;
  starts_at: string;
  ends_at: string;
  status: BookingStatus;
  price: number;
  source: BookingSource;
  notes?: string;
  created_at: string;
  // Joined relation fields for UI rendering
  service?: Service;
  provider?: Provider;
  client?: Client;
}

export interface BookingEvent {
  id: string;
  booking_id: string;
  event_type: string;
  actor_id: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface Reminder {
  id: string;
  booking_id: string;
  channel: ReminderChannel;
  scheduled_for: string;
  sent_at?: string;
  status: ReminderStatus;
  created_at: string;
}

export interface Subscription {
  id: string;
  business_id: string;
  provider_customer_id?: string;
  provider_subscription_id?: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  current_period_end?: string;
  created_at: string;
}

export interface TimeSlot {
  starts_at: string;
  ends_at: string;
  provider_id: string;
  available: boolean;
  reason?: string;
}

export interface AvailabilityQuery {
  business_slug: string;
  service_id: string;
  date: string; // YYYY-MM-DD
  provider_id?: string;
}

export interface CreateBookingPayload {
  business_id: string;
  service_id: string;
  provider_id: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  starts_at: string;
  ends_at: string;
  notes?: string;
  source?: BookingSource;
}
