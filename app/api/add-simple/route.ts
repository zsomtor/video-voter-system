import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

/**
 * POST /api/add-simple
 * Simple endpoint to add a video WITHOUT calibration
 * Use this for testing
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      thumbnailText,
      thumbnailUrl,
      sourceType = 'own',
      actualViews = null,
      channelName = 'Bazu Podcast',
      guestName,
      isTrainingSet = true,
    } = body;

    console.log('Adding video (simple):', { title, guestName, actualViews });

    // Calculate simple rating from views
    let initialRating = 1500;
    if (actualViews && actualViews > 0) {
      // Simple formula: rating increases with views
      initialRating = 1500 + Math.floor(Math.log10(actualViews) * 100);
    }

    // Direct SQL insert
    const result = await sql`
      INSERT INTO videos (
        title,
        thumbnail_text,
        thumbnail_url,
        source_type,
        actual_views,
        channel_name,
        guest_name,
        is_training_set,
        elo_rating
      )
      VALUES (
        ${title},
        ${thumbnailText},
        ${thumbnailUrl || null},
        ${sourceType},
        ${actualViews},
        ${channelName},
        ${guestName || null},
        ${isTrainingSet},
        ${initialRating}
      )
      RETURNING *
    `;

    console.log('Video added successfully:', result.rows[0]);

    return NextResponse.json({
      success: true,
      video: result.rows[0],
    });
  } catch (error) {
    console.error('Error adding video (simple):', error);
    return NextResponse.json(
      {
        error: 'Failed to add video',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
