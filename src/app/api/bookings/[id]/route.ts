import { NextRequest, NextResponse } from 'next/server';
import { bookingStore } from '@/lib/booking-store';
import { BookingStatus } from '@/lib/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !['pending', 'confirmed', 'cancelled', 'completed', 'no_show'].includes(status)) {
      return NextResponse.json({ error: 'Invalid booking status' }, { status: 400 });
    }

    const updated = await bookingStore.updateBookingStatus(id, status as BookingStatus);
    if (!updated) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
