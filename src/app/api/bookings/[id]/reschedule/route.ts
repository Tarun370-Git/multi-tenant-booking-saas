import { NextRequest, NextResponse } from 'next/server';
import { bookingStore } from '@/lib/booking-store';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { starts_at, ends_at } = body;

    if (!starts_at || !ends_at) {
      return NextResponse.json({ error: 'Missing starts_at or ends_at timestamps' }, { status: 400 });
    }

    const rescheduled = await bookingStore.rescheduleBooking(id, starts_at, ends_at);
    return NextResponse.json({ message: 'Booking rescheduled successfully', booking: rescheduled });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Reschedule failed';
    const isConflict = errorMsg.includes('SLOT_UNAVAILABLE');
    return NextResponse.json({ error: errorMsg }, { status: isConflict ? 409 : 500 });
  }
}
