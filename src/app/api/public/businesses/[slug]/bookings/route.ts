import { NextRequest, NextResponse } from 'next/server';
import { bookingStore } from '@/lib/booking-store';
import { z } from 'zod';

const bookingSchema = z.object({
  service_id: z.string().uuid(),
  provider_id: z.string().uuid(),
  client_name: z.string().min(2),
  client_email: z.string().email(),
  client_phone: z.string().optional(),
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
  notes: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const business = await bookingStore.getBusinessBySlug(slug);

    if (!business || business.status !== 'active') {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const body = await request.json();
    const parseResult = bookingSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { service_id, provider_id, client_name, client_email, client_phone, starts_at, ends_at, notes } = parseResult.data;

    // Atomic creation with server-side double booking prevention
    const result = await bookingStore.createBookingAtomic({
      business_id: business.id,
      service_id,
      provider_id,
      client_name,
      client_email,
      client_phone,
      starts_at,
      ends_at,
      notes,
      source: 'public_web',
    });

    return NextResponse.json(
      {
        message: 'Booking created successfully',
        booking: result.booking,
        client: {
          name: result.client.name,
          email: result.client.email,
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to create booking';
    const isConflict = errorMsg.includes('SLOT_UNAVAILABLE') || errorMsg.includes('SLOT_BLOCKED');
    
    return NextResponse.json(
      { error: errorMsg },
      { status: isConflict ? 409 : 500 }
    );
  }
}
