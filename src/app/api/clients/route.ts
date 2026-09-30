import { NextRequest, NextResponse } from 'next/server';
import { bookingStore } from '@/lib/booking-store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('business_id') || '11111111-1111-1111-1111-111111111111';
    const query = searchParams.get('q')?.toLowerCase();

    let clients = await bookingStore.getClientsByBusinessId(businessId);

    if (query) {
      clients = clients.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          (c.phone && c.phone.includes(query))
      );
    }

    return NextResponse.json(clients);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
