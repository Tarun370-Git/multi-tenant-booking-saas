import { NextRequest, NextResponse } from 'next/server';
import { bookingStore } from '@/lib/booking-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { business_id, plan = 'pro' } = body;

    if (!business_id) {
      return NextResponse.json({ error: 'Missing business_id' }, { status: 400 });
    }

    // Upgrade/update subscription status server-side
    const subscription = await bookingStore.updateSubscription(business_id, plan, 'active');

    return NextResponse.json({
      message: 'Subscription updated successfully',
      subscription,
      checkout_url: `/dashboard/billing?status=success&plan=${plan}`,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Billing checkout failed';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
