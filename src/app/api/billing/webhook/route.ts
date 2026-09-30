import { NextRequest, NextResponse } from 'next/server';
import { bookingStore } from '@/lib/booking-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const eventType = body.type || 'customer.subscription.updated';
    const data = body.data?.object || body;

    const businessId = data.business_id || '11111111-1111-1111-1111-111111111111';
    const status = data.status || 'active';
    const plan = data.plan || 'pro';

    if (eventType === 'customer.subscription.updated' || eventType === 'invoice.payment_succeeded') {
      await bookingStore.updateSubscription(businessId, plan, status);
    } else if (eventType === 'customer.subscription.deleted') {
      await bookingStore.updateSubscription(businessId, plan, 'cancelled');
    }

    return NextResponse.json({ received: true, event: eventType });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Webhook error';
    return NextResponse.json({ error: errorMsg }, { status: 400 });
  }
}
