import { NextRequest, NextResponse } from 'next/server';
import { generateFollowUpMessage } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { client_name, service_name, business_name, tone } = body;

    if (!client_name || !service_name || !business_name) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const result = await generateFollowUpMessage({ client_name, service_name, business_name, tone });
    return NextResponse.json(result);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Followup generation failed';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
