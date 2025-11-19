import { NextRequest, NextResponse } from 'next/server';
import { addVideo, type SourceType } from '@/lib/db';
import { estimateRatingFromViews, calibrateFromTrainingSet } from '@/lib/calibration';

/**
 * POST /api/videos
 * Adds a new video to the database
 *
 * Body: {
 *   title: string,
 *   thumbnailText: string,
 *   sourceType: 'own' | 'competitor' | 'test',
 *   actualViews?: number,
 *   channelName?: string,
 *   guestName?: string,
 *   isTrainingSet?: boolean
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      thumbnailText,
      sourceType,
      actualViews,
      channelName,
      guestName,
      isTrainingSet,
    } = body;

    // Validate input
    if (!title || !thumbnailText || !sourceType) {
      return NextResponse.json(
        { error: 'Title, thumbnailText, and sourceType are required' },
        { status: 400 }
      );
    }

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
    }

    // Add video to database
    const video = await addVideo(
      title,
      thumbnailText,
      sourceType as SourceType,
      actualViews || null,
      channelName || null,
      guestName || null,
      isTrainingSet || false,
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
