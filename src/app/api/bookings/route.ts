import { NextRequest, NextResponse } from 'next/server';
import { bookingStore } from '@/lib/booking-store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('business_id') || '11111111-1111-1111-1111-111111111111'; // Default Apex Barber Shop for demo

    const bookings = await bookingStore.getBookingsByBusinessId(businessId);
    return NextResponse.json(bookings);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
