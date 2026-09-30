import { NextRequest, NextResponse } from 'next/server';
import { processSmartBooking } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { business_slug, user_prompt } = body;

    if (!business_slug || !user_prompt) {
      return NextResponse.json({ error: 'Missing business_slug or user_prompt' }, { status: 400 });
    }

    const result = await processSmartBooking({ business_slug, user_prompt });
    return NextResponse.json(result);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Smart booking AI processing failed';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
