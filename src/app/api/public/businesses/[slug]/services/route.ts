import { NextRequest, NextResponse } from 'next/server';
import { bookingStore } from '@/lib/booking-store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const business = await bookingStore.getBusinessBySlug(slug);

    if (!business || business.status !== 'active') {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const services = await bookingStore.getServicesByBusinessId(business.id);
    return NextResponse.json(services);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
