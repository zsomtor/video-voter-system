import { NextResponse } from 'next/server';
import { getTrainingVideoPair } from '@/lib/db';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/practice-pair
 * Returns two random videos from training set for practice mode
 */
export async function GET() {
  try {
    const pair = await getTrainingVideoPair();

    if (!pair) {
      return NextResponse.json(
        { error: 'Nincs elég edzési videó. Adj hozzá legalább 2 videót ismert nézettséggel.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      videoA: pair[0],
      videoB: pair[1],
    });
  } catch (error) {
    console.error('Error fetching practice pair:', error);
    return NextResponse.json(
      { error: 'Sikertelen videó betöltés' },
      { status: 500 }
    );
  }
}
