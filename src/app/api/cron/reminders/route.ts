import { NextRequest, NextResponse } from 'next/server';
import { bookingStore } from '@/lib/booking-store';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Secret validation if configured
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized cron execution' }, { status: 401 });
    }

    const result = await bookingStore.processPendingReminders();

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'success',
      processedCount: result.processedCount,
      sentReminders: result.sent,
      failedReminders: result.failed,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Cron execution failed';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
