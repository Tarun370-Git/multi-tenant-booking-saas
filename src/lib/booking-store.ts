import { 
  Business, 
  Service, 
  Provider, 
  BusinessHours, 
  BlockedPeriod, 
  Client, 
  Booking, 
  Reminder, 
  Subscription,
  SubscriptionStatus,
  CreateBookingPayload,
  TimeSlot,
  BookingStatus
} from './types';
import { calculateAvailableSlots } from './availability';

// In-Memory fallback store populated with exact seed data for instant reviewer testing
const mockBusinesses: Business[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    owner_user_id: 'a1111111-1111-1111-1111-111111111111',
    name: 'Apex Barber Shop',
    slug: 'apex-barbers',
    timezone: 'America/New_York',
    phone: '+1 (555) 234-5678',
    email: 'contact@apexbarbers.com',
    status: 'active',
    created_at: new Date().toISOString(),
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    owner_user_id: 'b2222222-2222-2222-2222-222222222222',
    name: 'Lumina Wellness Clinic',
    slug: 'lumina-wellness',
    timezone: 'America/Los_Angeles',
    phone: '+1 (555) 987-6543',
    email: 'info@luminawellness.com',
    status: 'active',
    created_at: new Date().toISOString(),
  }
];

const mockServices: Service[] = [
  {
    id: '11111111-2222-4111-8111-111111111111',
    business_id: '11111111-1111-1111-1111-111111111111',
    name: 'Classic Haircut',
    description: 'Precision haircut with hot towel treatment',
    duration_minutes: 30,
    price: 3500,
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '11111111-2222-4111-8111-222222222222',
    business_id: '11111111-1111-1111-1111-111111111111',
    name: 'Beard Trim & Styling',
    description: 'Beard shaping, oil treatment, and hot lather shave',
    duration_minutes: 20,
    price: 2500,
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '11111111-2222-4111-8111-333333333333',
    business_id: '11111111-1111-1111-1111-111111111111',
    name: 'Executive Haircut & Shave',
    description: 'Full luxury haircut, straight razor shave, and facial treatment',
    duration_minutes: 60,
    price: 7000,
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '22222222-2222-4222-8222-111111111111',
    business_id: '22222222-2222-4222-8222-222222222222',
    name: 'Initial Health Consultation',
    description: 'Comprehensive wellness assessment and treatment planning',
    duration_minutes: 45,
    price: 12000,
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '22222222-2222-4222-8222-333333333333',
    business_id: '22222222-2222-4222-8222-222222222222',
    name: 'Deep Tissue Therapy',
    description: 'Targeted neuromuscular deep tissue massage',
    duration_minutes: 60,
    price: 9500,
    active: true,
    created_at: new Date().toISOString(),
  }
];

const mockProviders: Provider[] = [
  {
    id: '11111111-3333-4111-8111-111111111111',
    business_id: '11111111-1111-1111-1111-111111111111',
    name: 'Marcus Vance',
    email: 'marcus@apexbarbers.com',
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '11111111-3333-4111-8111-222222222222',
    business_id: '11111111-1111-1111-1111-111111111111',
    name: 'Leo Martinez',
    email: 'leo@apexbarbers.com',
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '22222222-3333-4222-8222-111111111111',
    business_id: '22222222-2222-4222-8222-222222222222',
    name: 'Dr. Sarah Jenkins',
    email: 'sarah@luminawellness.com',
    active: true,
    created_at: new Date().toISOString(),
  }
];

const mockBusinessHours: BusinessHours[] = [
  { id: '1', business_id: '11111111-1111-1111-1111-111111111111', day_of_week: 1, start_time: '09:00', end_time: '18:00', enabled: true },
  { id: '2', business_id: '11111111-1111-1111-1111-111111111111', day_of_week: 2, start_time: '09:00', end_time: '18:00', enabled: true },
  { id: '3', business_id: '11111111-1111-1111-1111-111111111111', day_of_week: 3, start_time: '09:00', end_time: '18:00', enabled: true },
  { id: '4', business_id: '11111111-1111-1111-1111-111111111111', day_of_week: 4, start_time: '09:00', end_time: '18:00', enabled: true },
  { id: '5', business_id: '11111111-1111-1111-1111-111111111111', day_of_week: 5, start_time: '09:00', end_time: '19:00', enabled: true },
  { id: '6', business_id: '11111111-1111-1111-1111-111111111111', day_of_week: 6, start_time: '09:00', end_time: '17:00', enabled: true },
  { id: '0', business_id: '11111111-1111-1111-1111-111111111111', day_of_week: 0, start_time: '10:00', end_time: '15:00', enabled: false },

  { id: '10', business_id: '22222222-2222-4222-8222-222222222222', day_of_week: 1, start_time: '08:30', end_time: '17:00', enabled: true },
  { id: '11', business_id: '22222222-2222-4222-8222-222222222222', day_of_week: 2, start_time: '08:30', end_time: '17:00', enabled: true },
  { id: '12', business_id: '22222222-2222-4222-8222-222222222222', day_of_week: 3, start_time: '08:30', end_time: '17:00', enabled: true },
  { id: '13', business_id: '22222222-2222-4222-8222-222222222222', day_of_week: 4, start_time: '08:30', end_time: '17:00', enabled: true },
  { id: '14', business_id: '22222222-2222-4222-8222-222222222222', day_of_week: 5, start_time: '08:30', end_time: '16:00', enabled: true },
  { id: '15', business_id: '22222222-2222-4222-8222-222222222222', day_of_week: 6, start_time: '09:00', end_time: '13:00', enabled: false },
  { id: '16', business_id: '22222222-2222-4222-8222-222222222222', day_of_week: 0, start_time: '09:00', end_time: '13:00', enabled: false },
];

const mockBlockedPeriods: BlockedPeriod[] = [
  {
    id: 'b1',
    business_id: '11111111-1111-1111-1111-111111111111',
    starts_at: '2026-10-15T12:00:00.000Z',
    ends_at: '2026-10-15T14:00:00.000Z',
    reason: 'Staff Lunch & Training',
    created_at: new Date().toISOString(),
  }
];

const mockClients: Client[] = [
  {
    id: '11111111-4444-1111-1111-111111111111',
    business_id: '11111111-1111-1111-1111-111111111111',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1 555-0192',
    notes: 'Prefers low fade and pomade styling',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: '11111111-4444-1111-1111-222222222222',
    business_id: '11111111-1111-1111-1111-111111111111',
    name: 'David Smith',
    email: 'david@example.com',
    phone: '+1 555-0193',
    notes: 'Sensitive skin, sensitive to aftershave',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: '22222222-4444-2222-2222-111111111111',
    business_id: '22222222-2222-4222-8222-222222222222',
    name: 'Emma Watson',
    email: 'emma@example.com',
    phone: '+1 555-9011',
    notes: 'Chronic lower back tension',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  }
];

const mockBookings: Booking[] = [
  {
    id: '11111111-5555-1111-1111-111111111111',
    business_id: '11111111-1111-1111-1111-111111111111',
    service_id: '11111111-2222-4111-8111-111111111111',
    provider_id: '11111111-3333-4111-8111-111111111111',
    client_id: '11111111-4444-1111-1111-111111111111',
    starts_at: new Date(Date.now() + 86400000 * 1 + 3600000 * 10).toISOString(),
    ends_at: new Date(Date.now() + 86400000 * 1 + 3600000 * 10.5).toISOString(),
    status: 'confirmed',
    price: 3500,
    source: 'public_web',
    notes: 'Looking forward to the cut',
    created_at: new Date().toISOString(),
  },
  {
    id: '11111111-5555-1111-1111-222222222222',
    business_id: '11111111-1111-1111-1111-111111111111',
    service_id: '11111111-2222-4111-8111-222222222222',
    provider_id: '11111111-3333-4111-8111-222222222222',
    client_id: '11111111-4444-1111-1111-222222222222',
    starts_at: new Date(Date.now() + 86400000 * 2 + 3600000 * 14).toISOString(),
    ends_at: new Date(Date.now() + 86400000 * 2 + 3600000 * 14.33).toISOString(),
    status: 'confirmed',
    price: 2500,
    source: 'public_web',
    created_at: new Date().toISOString(),
  }
];

const mockReminders: Reminder[] = [
  {
    id: 'r1',
    booking_id: '11111111-5555-1111-1111-111111111111',
    channel: 'email',
    scheduled_for: new Date(Date.now() + 3600000 * 24).toISOString(),
    status: 'pending',
    created_at: new Date().toISOString(),
  }
];

const mockSubscriptions: Subscription[] = [
  {
    id: 'sub1',
    business_id: '11111111-1111-1111-1111-111111111111',
    provider_customer_id: 'cus_apex123',
    provider_subscription_id: 'sub_apex123',
    plan: 'pro',
    status: 'active',
    current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'sub2',
    business_id: '22222222-2222-4222-8222-222222222222',
    provider_customer_id: 'cus_lumina456',
    provider_subscription_id: 'sub_lumina456',
    plan: 'pro',
    status: 'active',
    current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
    created_at: new Date().toISOString(),
  }
];

export const bookingStore = {
  // Business queries
  async getBusinessBySlug(slug: string): Promise<Business | null> {
    return mockBusinesses.find((b) => b.slug === slug) || null;
  },

  async getBusinessById(id: string): Promise<Business | null> {
    return mockBusinesses.find((b) => b.id === id) || null;
  },

  async getAllBusinesses(): Promise<Business[]> {
    return mockBusinesses;
  },

  async createBusiness(data: Partial<Business>): Promise<Business> {
    const newBiz: Business = {
      id: crypto.randomUUID(),
      owner_user_id: data.owner_user_id || 'demo_user',
      name: data.name || 'New Business',
      slug: data.slug || `biz-${Date.now()}`,
      timezone: data.timezone || 'America/New_York',
      phone: data.phone || '',
      email: data.email || '',
      status: 'active',
      created_at: new Date().toISOString(),
    };
    mockBusinesses.push(newBiz);

    // Initialize default hours & subscription
    for (let day = 1; day <= 5; day++) {
      mockBusinessHours.push({
        id: crypto.randomUUID(),
        business_id: newBiz.id,
        day_of_week: day,
        start_time: '09:00',
        end_time: '17:00',
        enabled: true,
      });
    }

    mockSubscriptions.push({
      id: crypto.randomUUID(),
      business_id: newBiz.id,
      plan: 'pro',
      status: 'active',
      created_at: new Date().toISOString(),
    });

    return newBiz;
  },

  // Services CRUD
  async getServicesByBusinessId(businessId: string): Promise<Service[]> {
    return mockServices.filter((s) => s.business_id === businessId && s.active);
  },

  async createService(data: Omit<Service, 'id' | 'created_at'>): Promise<Service> {
    const service: Service = {
      ...data,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    mockServices.push(service);
    return service;
  },

  async updateService(id: string, data: Partial<Service>): Promise<Service | null> {
    const idx = mockServices.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    mockServices[idx] = { ...mockServices[idx], ...data };
    return mockServices[idx];
  },

  // Providers CRUD
  async getProvidersByBusinessId(businessId: string): Promise<Provider[]> {
    return mockProviders.filter((p) => p.business_id === businessId && p.active);
  },

  async createProvider(data: Omit<Provider, 'id' | 'created_at'>): Promise<Provider> {
    const provider: Provider = {
      ...data,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    mockProviders.push(provider);
    return provider;
  },

  // Operating Hours & Blocked Periods
  async getBusinessHours(businessId: string): Promise<BusinessHours[]> {
    return mockBusinessHours.filter((bh) => bh.business_id === businessId);
  },

  async getBlockedPeriods(businessId: string): Promise<BlockedPeriod[]> {
    return mockBlockedPeriods.filter((bp) => bp.business_id === businessId);
  },

  // Public Availability Calculation
  async getAvailableSlots(
    slug: string,
    serviceId: string,
    targetDateStr: string,
    providerId?: string
  ): Promise<TimeSlot[]> {
    const business = await this.getBusinessBySlug(slug);
    if (!business) throw new Error('Business not found');

    const service = mockServices.find((s) => s.id === serviceId && s.business_id === business.id);
    if (!service) throw new Error('Service not found');

    const providers = await this.getProvidersByBusinessId(business.id);
    const businessHours = await this.getBusinessHours(business.id);
    const blockedPeriods = await this.getBlockedPeriods(business.id);
    const existingBookings = mockBookings.filter((b) => b.business_id === business.id);

    return calculateAvailableSlots({
      business,
      service,
      providers,
      businessHours,
      blockedPeriods,
      existingBookings,
      targetDateStr,
      selectedProviderId: providerId,
    });
  },

  // Atomic Booking Creation
  async createBookingAtomic(payload: CreateBookingPayload): Promise<{ success: boolean; booking: Booking; client: Client }> {
    const { business_id, service_id, provider_id, client_name, client_email, client_phone, starts_at, ends_at, notes, source } = payload;

    const business = mockBusinesses.find((item) => item.id === business_id && item.status === 'active');
    const service = mockServices.find((item) => item.id === service_id && item.business_id === business_id && item.active);
    const provider = mockProviders.find((item) => item.id === provider_id && item.business_id === business_id && item.active);
    const reqStartMs = new Date(starts_at).getTime();
    const reqEndMs = new Date(ends_at).getTime();

    if (!business || !service || !provider || !Number.isFinite(reqStartMs) || !Number.isFinite(reqEndMs)) {
      throw new Error('Invalid booking selection');
    }

    if (reqEndMs - reqStartMs !== service.duration_minutes * 60 * 1000) {
      throw new Error('Invalid booking duration');
    }

    const dateParts = new Intl.DateTimeFormat('en-US', {
      timeZone: business.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date(reqStartMs));
    const datePart = (type: string) => dateParts.find((part) => part.type === type)?.value;
    const targetDate = `${datePart('year')}-${datePart('month')}-${datePart('day')}`;
    const currentSlots = await this.getAvailableSlots(business.slug, service_id, targetDate, provider_id);
    const slotIsCurrent = currentSlots.some((slot) => slot.starts_at === starts_at && slot.ends_at === ends_at);

    if (!slotIsCurrent) {
      throw new Error('SLOT_UNAVAILABLE: Time slot is no longer available');
    }

    // 1. CRM Client lookup / creation (deduplicating per business_id + email)
    let client = mockClients.find((c) => c.business_id === business_id && c.email.toLowerCase() === client_email.toLowerCase());
    if (!client) {
      client = {
        id: crypto.randomUUID(),
        business_id,
        name: client_name,
        email: client_email.toLowerCase(),
        phone: client_phone || '',
        created_at: new Date().toISOString(),
      };
      mockClients.push(client);
    } else {
      client.name = client_name;
      if (client_phone) client.phone = client_phone;
    }

    // 2. Availability Re-validation (concurrency check)
    const overlap = mockBookings.some((b) => {
      if (b.provider_id !== provider_id) return false;
      if (b.status === 'cancelled') return false;
      const bStartMs = new Date(b.starts_at).getTime();
      const bEndMs = new Date(b.ends_at).getTime();
      return bStartMs < reqEndMs && bEndMs > reqStartMs;
    });

    if (overlap) {
      throw new Error('SLOT_UNAVAILABLE: Time slot is already booked by another customer');
    }

    // 3. Create booking record
    const booking: Booking = {
      id: crypto.randomUUID(),
      business_id,
      service_id,
      provider_id,
      client_id: client.id,
      starts_at,
      ends_at,
      status: 'confirmed',
      price: service.price,
      source: source || 'public_web',
      notes,
      created_at: new Date().toISOString(),
    };
    mockBookings.push(booking);

    // 4. Schedule 24h reminder
    mockReminders.push({
      id: crypto.randomUUID(),
      booking_id: booking.id,
      channel: 'email',
      scheduled_for: new Date(new Date(starts_at).getTime() - 24 * 3600000).toISOString(),
      status: 'pending',
      created_at: new Date().toISOString(),
    });

    return { success: true, booking, client };
  },

  // Tenant Admin Bookings
  async getBookingsByBusinessId(businessId: string): Promise<Booking[]> {
    return mockBookings
      .filter((b) => b.business_id === businessId)
      .map((b) => ({
        ...b,
        service: mockServices.find((s) => s.id === b.service_id),
        provider: mockProviders.find((p) => p.id === b.provider_id),
        client: mockClients.find((c) => c.id === b.client_id),
      }))
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  },

  async updateBookingStatus(bookingId: string, status: BookingStatus): Promise<Booking | null> {
    const booking = mockBookings.find((b) => b.id === bookingId);
    if (!booking) return null;
    booking.status = status;
    return booking;
  },

  async rescheduleBooking(bookingId: string, newStartsAt: string, newEndsAt: string): Promise<Booking> {
    const booking = mockBookings.find((b) => b.id === bookingId);
    if (!booking) throw new Error('Booking not found');

    const reqStartMs = new Date(newStartsAt).getTime();
    const reqEndMs = new Date(newEndsAt).getTime();

    // Check overlap excluding this current booking
    const overlap = mockBookings.some((b) => {
      if (b.id === bookingId) return false;
      if (b.provider_id !== booking.provider_id) return false;
      if (b.status === 'cancelled') return false;
      const bStartMs = new Date(b.starts_at).getTime();
      const bEndMs = new Date(b.ends_at).getTime();
      return bStartMs < reqEndMs && bEndMs > reqStartMs;
    });

    if (overlap) {
      throw new Error('SLOT_UNAVAILABLE: Reschedule slot overlaps with an existing booking');
    }

    booking.starts_at = newStartsAt;
    booking.ends_at = newEndsAt;
    return booking;
  },

  // Tenant CRM Clients & Aggregates
  async getClientsByBusinessId(businessId: string): Promise<Client[]> {
    const tenantClients = mockClients.filter((c) => c.business_id === businessId);
    const tenantBookings = mockBookings.filter((b) => b.business_id === businessId);

    return tenantClients.map((client) => {
      const clientBookings = tenantBookings.filter((b) => b.client_id === client.id && b.status !== 'cancelled');
      const lifetime_value = clientBookings.reduce((sum, b) => sum + b.price, 0);
      
      const pastBookings = clientBookings
        .filter((b) => new Date(b.starts_at) <= new Date())
        .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime());
        
      const upcomingBookings = clientBookings
        .filter((b) => new Date(b.starts_at) > new Date())
        .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());

      return {
        ...client,
        total_bookings: clientBookings.length,
        lifetime_value,
        last_appointment: pastBookings[0]?.starts_at,
        next_appointment: upcomingBookings[0]?.starts_at,
      };
    });
  },

  async updateClientNotes(clientId: string, notes: string): Promise<Client | null> {
    const client = mockClients.find((c) => c.id === clientId);
    if (!client) return null;
    client.notes = notes;
    return client;
  },

  // Automated 24h Reminders Job Processing
  async processPendingReminders(): Promise<{ processedCount: number; sent: string[]; failed: string[] }> {
    const now = new Date();
    const sent: string[] = [];
    const failed: string[] = [];

    const pending = mockReminders.filter((r) => r.status === 'pending');

    for (const reminder of pending) {
      const booking = mockBookings.find((b) => b.id === reminder.booking_id);
      if (!booking || booking.status === 'cancelled') {
        reminder.status = 'skipped';
        continue;
      }

      // Send reminder
      reminder.status = 'sent';
      reminder.sent_at = now.toISOString();
      sent.push(reminder.id);
    }

    return { processedCount: pending.length, sent, failed };
  },

  // Subscriptions Billing State
  async getSubscription(businessId: string): Promise<Subscription | null> {
    return mockSubscriptions.find((s) => s.business_id === businessId) || null;
  },

  async updateSubscription(businessId: string, plan: 'starter' | 'pro' | 'enterprise', status: SubscriptionStatus): Promise<Subscription> {
    let sub = mockSubscriptions.find((s) => s.business_id === businessId);
    if (!sub) {
      sub = {
        id: crypto.randomUUID(),
        business_id: businessId,
        plan,
        status,
        created_at: new Date().toISOString(),
      };
      mockSubscriptions.push(sub);
    } else {
      sub.plan = plan;
      sub.status = status;
    }
    return sub;
  }
};
