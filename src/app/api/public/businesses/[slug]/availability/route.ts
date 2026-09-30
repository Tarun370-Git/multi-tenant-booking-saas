import { NextRequest, NextResponse } from 'next/server';
import { bookingStore } from '@/lib/booking-store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('service_id');
    const date = searchParams.get('date'); // YYYY-MM-DD
    const providerId = searchParams.get('provider_id') || undefined;

    if (!serviceId || !date) {
      return NextResponse.json(
        { error: 'Missing required parameters: service_id and date' },
        { status: 400 }
      );
    }

    const slots = await bookingStore.getAvailableSlots(slug, serviceId, date, providerId);
    return NextResponse.json({ date, slots });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }
}
