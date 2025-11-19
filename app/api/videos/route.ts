import { NextRequest, NextResponse } from 'next/server';
import { addVideo } from '@/lib/db';
import { calculateRatingFromViews } from '@/lib/elo';

/**
 * POST /api/videos
 * Adds a new video to the database
 *
 * Body: {
 *   title: string,
 *   thumbnailText: string,
 *   actualViews?: number,
 *   isTest?: boolean,
 *   isCompetitor?: boolean
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, thumbnailText, actualViews, isTest, isCompetitor } = body;

    // Validate input
    if (!title || !thumbnailText) {
      return NextResponse.json(
        { error: 'Title and thumbnailText are required' },
        { status: 400 }
      );
    }

    // Calculate initial rating based on actual views (if provided)
    let initialRating = 1500; // Default rating
    if (actualViews && actualViews > 0) {
      initialRating = calculateRatingFromViews(actualViews);
    }

    // Add video to database
    const video = await addVideo(
      title,
      thumbnailText,
      actualViews || null,
      isTest || false,
      isCompetitor || false,
      initialRating
    );

    return NextResponse.json({
      success: true,
      video,
    });
  } catch (error) {
    console.error('Error adding video:', error);
    return NextResponse.json(
      { error: 'Failed to add video' },
      { status: 500 }
    );
  }
}
