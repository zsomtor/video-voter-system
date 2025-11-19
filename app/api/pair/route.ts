import { NextResponse } from 'next/server';
import { getRandomVideoPair } from '@/lib/db';

/**
 * GET /api/pair
 * Returns two random videos for comparison
 */
export async function GET() {
  try {
    const pair = await getRandomVideoPair();

    if (!pair) {
      return NextResponse.json(
        { error: 'Not enough videos in database. Please add at least 2 videos.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      videoA: pair[0],
      videoB: pair[1],
    });
  } catch (error) {
    console.error('Error fetching video pair:', error);
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}
