import { NextRequest, NextResponse } from 'next/server';
import { getVideoById } from '@/lib/db';
import { findBenchmarkRange } from '@/lib/calibration';

/**
 * GET /api/benchmark/:id
 * Get benchmark comparison for a specific video
 * Shows where this video ranks compared to known performers
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const videoId = parseInt(params.id);

    if (isNaN(videoId)) {
      return NextResponse.json(
        { error: 'Érvénytelen videó ID' },
        { status: 400 }
      );
    }

    const video = await getVideoById(videoId);

    if (!video) {
      return NextResponse.json(
        { error: 'Videó nem található' },
        { status: 404 }
      );
    }

    // Get benchmark comparison
    const benchmarks = await findBenchmarkRange(video.elo_rating);

    return NextResponse.json({
      video,
      benchmarks,
    });
  } catch (error) {
    console.error('Error getting benchmark:', error);
    return NextResponse.json(
      { error: 'Sikertelen benchmark lekérdezés' },
      { status: 500 }
    );
  }
}
