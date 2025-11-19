import { NextResponse } from 'next/server';
import { getBazuOnlyVideoPair } from '@/lib/db';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/bazu-pair
 * Returns two random Bazu Podcast videos for comparison
 */
export async function GET() {
  try {
    const pair = await getBazuOnlyVideoPair();

    if (!pair) {
      return NextResponse.json(
        { error: 'Nincs elég Bazu Podcast videó. Kérlek adj hozzá legalább 2 Bazu videót.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      videoA: pair[0],
      videoB: pair[1],
    });
  } catch (error) {
    console.error('Error fetching Bazu video pair:', error);
    return NextResponse.json(
      { error: 'Sikertelen videó betöltés' },
      { status: 500 }
    );
  }
}
