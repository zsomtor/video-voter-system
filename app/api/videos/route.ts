import { NextRequest, NextResponse } from 'next/server';
import { addVideo, type SourceType } from '@/lib/db';
import { estimateRatingFromViews, calibrateFromTrainingSet } from '@/lib/calibration';
import { sql } from '@vercel/postgres';

/**
 * POST /api/videos
 * Adds a new video to the database
 *
 * Body: {
 *   title: string,
 *   thumbnailText: string,
 *   thumbnailUrl?: string,
 *   sourceType: 'own' | 'competitor' | 'test',
 *   actualViews?: number,
 *   channelName?: string,
 *   guestName?: string,
 *   isTrainingSet?: boolean,
 *   testGroupId?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      thumbnailText,
      thumbnailUrl,
      sourceType,
      actualViews,
      channelName,
      guestName,
      isTrainingSet,
      testGroupId,
    } = body;

    // Validate input
    if (!title || !sourceType) {
      return NextResponse.json(
        { error: 'Title and sourceType are required' },
        { status: 400 }
      );
    }

    // Use empty string as default for thumbnailText if not provided
    const finalThumbnailText = thumbnailText || '';

    if (!['own', 'competitor', 'test'].includes(sourceType)) {
      return NextResponse.json(
        { error: 'sourceType must be own, competitor, or test' },
        { status: 400 }
      );
    }

    // Calculate initial rating based on actual views (if provided) using calibration
    let initialRating = 1500; // Default rating
    if (actualViews && actualViews > 0) {
      const calibration = await calibrateFromTrainingSet();
      initialRating = estimateRatingFromViews(actualViews, calibration);
    } else {
      // For new test videos without actual views, start from the current average ELO
      // This ensures they start in a realistic position
      try {
        const avgResult = await sql`
          SELECT AVG(elo_rating)::integer as avg_rating, COUNT(*) as count
          FROM videos
        `;

        if (avgResult.rows[0].count > 0 && avgResult.rows[0].avg_rating) {
          initialRating = avgResult.rows[0].avg_rating;
        }
      } catch (error) {
        console.log('Could not get average rating, using default 1500');
        // Keep default 1500 if query fails
      }
    }

    // Add video to database
    const video = await addVideo(
      title,
      finalThumbnailText,
      sourceType as SourceType,
      actualViews || null,
      channelName || null,
      guestName || null,
      isTrainingSet || false,
      initialRating,
      thumbnailUrl || null,
      testGroupId || null
    );

    return NextResponse.json({
      success: true,
      video,
    });
  } catch (error) {
    console.error('Error adding video:', error);
    return NextResponse.json(
      {
        error: 'Failed to add video',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
