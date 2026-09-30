import { NextRequest, NextResponse } from 'next/server';
import { bookingStore } from '@/lib/booking-store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('business_id') || '11111111-1111-1111-1111-111111111111';

    const services = await bookingStore.getServicesByBusinessId(businessId);
    return NextResponse.json(services);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { business_id, name, description, duration_minutes, price } = body;

    if (!business_id || !name || !duration_minutes || price === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newService = await bookingStore.createService({
      business_id,
      name,
      description,
      duration_minutes: Number(duration_minutes),
      price: Number(price),
      active: true,
    });

    return NextResponse.json(newService, { status: 201 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
