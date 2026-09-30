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
      return NextResponse.json(
        { error: 'Business not found or inactive' },
        { status: 404 }
      );
    }

    // Return sanitized public profile (excluding internal notes, owner IDs, etc.)
    return NextResponse.json({
      id: business.id,
      name: business.name,
      slug: business.slug,
      timezone: business.timezone,
      phone: business.phone,
      email: business.email,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
