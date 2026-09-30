import { NextRequest, NextResponse } from 'next/server';
import { calculateNoShowRisk } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { client_id, business_id, booking_starts_at } = body;

    if (!client_id || !business_id || !booking_starts_at) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const risk = await calculateNoShowRisk({ client_id, business_id, booking_starts_at });
    return NextResponse.json(risk);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Risk calculation failed';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
