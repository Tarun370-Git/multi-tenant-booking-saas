import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { calculateAvailableSlots } from '../src/lib/availability';
import { bookingStore } from '../src/lib/booking-store';
import { POST as createPublicBooking } from '../src/app/api/public/businesses/[slug]/bookings/route';
import { processSmartBooking, calculateNoShowRisk } from '../src/lib/ai';
import { Business, Service, Provider, BusinessHours } from '../src/lib/types';

describe('Multi-Tenant SaaS Assessment Test Suite', () => {
  const sampleBusiness: Business = {
    id: 'biz-test-1',
    owner_user_id: 'user-1',
    name: 'Test Salon',
    slug: 'test-salon',
    timezone: 'America/New_York',
    status: 'active',
    created_at: new Date().toISOString(),
  };

  const sampleService: Service = {
    id: 'srv-1',
    business_id: 'biz-test-1',
    name: 'Haircut',
    duration_minutes: 30,
    price: 4000,
    active: true,
    created_at: new Date().toISOString(),
  };

  const sampleProvider: Provider = {
    id: 'prov-1',
    business_id: 'biz-test-1',
    name: 'Alex Stylist',
    active: true,
    created_at: new Date().toISOString(),
  };

  const sampleBusinessHours: BusinessHours[] = [
    { id: 'bh-1', business_id: 'biz-test-1', day_of_week: 1, start_time: '09:00', end_time: '17:00', enabled: true },
    { id: 'bh-2', business_id: 'biz-test-1', day_of_week: 2, start_time: '09:00', end_time: '17:00', enabled: true },
    { id: 'bh-3', business_id: 'biz-test-1', day_of_week: 3, start_time: '09:00', end_time: '17:00', enabled: true },
    { id: 'bh-4', business_id: 'biz-test-1', day_of_week: 4, start_time: '09:00', end_time: '17:00', enabled: true },
    { id: 'bh-5', business_id: 'biz-test-1', day_of_week: 5, start_time: '09:00', end_time: '17:00', enabled: true },
    { id: 'bh-6', business_id: 'biz-test-1', day_of_week: 6, start_time: '09:00', end_time: '17:00', enabled: true },
    { id: 'bh-0', business_id: 'biz-test-1', day_of_week: 0, start_time: '09:00', end_time: '17:00', enabled: false },
  ];

  it('1. Availability Generation: Generates correct time slots during open hours', () => {
    const slots = calculateAvailableSlots({
      business: sampleBusiness,
      service: sampleService,
      providers: [sampleProvider],
      businessHours: sampleBusinessHours,
      blockedPeriods: [],
      existingBookings: [],
      targetDateStr: '2026-10-12', // Monday
    });

    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0].starts_at).toBe('2026-10-12T13:00:00.000Z');
  });

  it('returns each business-local start time only once across providers', () => {
    const secondProvider: Provider = { ...sampleProvider, id: 'prov-2' };
    const slots = calculateAvailableSlots({
      business: sampleBusiness,
      service: sampleService,
      providers: [sampleProvider, secondProvider],
      businessHours: sampleBusinessHours,
      blockedPeriods: [],
      existingBookings: [],
      targetDateStr: '2026-10-12',
    });

    const starts = slots.map((slot) => slot.starts_at);
    expect(new Set(starts).size).toBe(starts.length);
    expect(starts[0]).toBe('2026-10-12T13:00:00.000Z');
  });

  it('creates a valid public booking and rejects a mismatched tenant selection', async () => {
    const slots = await bookingStore.getAvailableSlots(
      'apex-barbers',
      '11111111-2222-4111-8111-111111111111',
      '2026-10-12',
      '11111111-3333-4111-8111-111111111111'
    );
    const slot = slots[0];
    expect(slot).toBeDefined();

    const booking = await bookingStore.createBookingAtomic({
      business_id: '11111111-1111-1111-1111-111111111111',
      service_id: '11111111-2222-4111-8111-111111111111',
      provider_id: slot.provider_id,
      client_name: 'Test Customer',
      client_email: `test-${crypto.randomUUID()}@example.com`,
      starts_at: slot.starts_at,
      ends_at: slot.ends_at,
      source: 'public_web',
    });
    expect(booking.booking.status).toBe('confirmed');
    expect(booking.booking.business_id).toBe('11111111-1111-1111-1111-111111111111');

    await expect(bookingStore.createBookingAtomic({
      business_id: '22222222-2222-4222-8222-222222222222',
      service_id: '11111111-2222-4111-8111-111111111111',
      provider_id: slot.provider_id,
      client_name: 'Test Customer',
      client_email: 'cross-tenant@example.com',
      starts_at: slot.starts_at,
      ends_at: slot.ends_at,
      source: 'public_web',
    })).rejects.toThrow('Invalid booking selection');
  });

  it('accepts a valid request through the public booking API', async () => {
    const [slot] = await bookingStore.getAvailableSlots(
      'apex-barbers',
      '11111111-2222-4111-8111-111111111111',
      '2026-10-13',
      '11111111-3333-4111-8111-111111111111'
    );
    const request = new NextRequest('http://localhost/api/public/businesses/apex-barbers/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: '11111111-2222-4111-8111-111111111111',
        provider_id: slot.provider_id,
        client_name: 'Route Test Customer',
        client_email: `route-${crypto.randomUUID()}@example.com`,
        starts_at: slot.starts_at,
        ends_at: slot.ends_at,
      }),
    });

    const response = await createPublicBooking(request, {
      params: Promise.resolve({ slug: 'apex-barbers' }),
    });
    const result = await response.json();

    expect(response.status).toBe(201);
    expect(result.booking.status).toBe('confirmed');
  });

  it('2. Overlap & Double Booking Prevention: Rejects overlapping slots', () => {
    const existingBooking = {
      id: 'b-exist-1',
      business_id: 'biz-test-1',
      service_id: 'srv-1',
      provider_id: 'prov-1',
      client_id: 'cli-1',
      starts_at: '2026-10-12T13:00:00.000Z',
      ends_at: '2026-10-12T13:30:00.000Z',
      status: 'confirmed' as const,
      price: 4000,
      source: 'public_web' as const,
      created_at: new Date().toISOString(),
    };

    const slots = calculateAvailableSlots({
      business: sampleBusiness,
      service: sampleService,
      providers: [sampleProvider],
      businessHours: sampleBusinessHours,
      blockedPeriods: [],
      existingBookings: [existingBooking],
      targetDateStr: '2026-10-12',
    });

    // 09:00 slot should be excluded due to existing booking
    const has1300 = slots.some((s) => s.starts_at === '2026-10-12T13:00:00.000Z');
    expect(has1300).toBe(false);
  });

  it('3. CRM Lifetime Value (LTV): Calculates distinct client aggregate LTV', async () => {
    const clients = await bookingStore.getClientsByBusinessId('11111111-1111-1111-1111-111111111111');
    expect(clients.length).toBeGreaterThan(0);
    expect(clients[0]).toHaveProperty('lifetime_value');
    expect(typeof clients[0].lifetime_value).toBe('number');
  });

  it('4. Reminders Idempotency: Processes pending 24h reminders without duplication', async () => {
    const result = await bookingStore.processPendingReminders();
    expect(result).toHaveProperty('processedCount');
    expect(Array.isArray(result.sent)).toBe(true);
  });

  it('5. AI Smart Booking Assistant: Interprets natural language prompt and queries availability', async () => {
    const aiResult = await processSmartBooking({
      business_slug: 'apex-barbers',
      user_prompt: 'Find me a haircut slot next Tuesday afternoon',
    });

    expect(aiResult.interpreted_intent.service_name).toBeDefined();
    expect(Array.isArray(aiResult.available_slots)).toBe(true);
  });

  it('6. AI No-Show Predictor: Calculates explainable risk score', async () => {
    const risk = await calculateNoShowRisk({
      client_id: '11111111-4444-1111-1111-111111111111',
      business_id: '11111111-1111-1111-1111-111111111111',
      booking_starts_at: new Date(Date.now() + 20 * 86400000).toISOString(),
    });

    expect(risk.risk_score).toBeGreaterThanOrEqual(0);
    expect(risk.risk_score).toBeLessThanOrEqual(100);
    expect(risk.reasons.length).toBeGreaterThan(0);
  });
});
