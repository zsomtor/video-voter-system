import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

/**
 * PUT /api/videos/[id]
 * Update a video by ID
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const videoId = parseInt(id);

    if (isNaN(videoId)) {
      return NextResponse.json(
        { error: 'Invalid video ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      title,
      thumbnailText,
      thumbnailUrl,
      actualViews,
      sourceType,
      channelName,
      guestName,
      isTrainingSet,
      testGroupId,
    } = body;

    // Update the video
    const result = await sql`
      UPDATE videos
      SET
        title = ${title},
        thumbnail_text = ${thumbnailText || ''},
        thumbnail_url = ${thumbnailUrl || null},
        actual_views = ${actualViews || null},
        source_type = ${sourceType},
        channel_name = ${channelName || null},
        guest_name = ${guestName || null},
        is_training_set = ${isTrainingSet},
        test_group_id = ${testGroupId || null}
      WHERE id = ${videoId}
      RETURNING *
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Video updated successfully',
      video: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating video:', error);
    return NextResponse.json(
      {
        error: 'Failed to update video',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/videos/[id]
 * Delete a video by ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const videoId = parseInt(id);

    if (isNaN(videoId)) {
      return NextResponse.json(
        { error: 'Invalid video ID' },
        { status: 400 }
      );
    }

    // First, delete all votes where this video was a winner or loser
    await sql`
      DELETE FROM votes
      WHERE winner_id = ${videoId} OR loser_id = ${videoId}
    `;

    // Then delete the video
    const result = await sql`
      DELETE FROM videos
      WHERE id = ${videoId}
      RETURNING *
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Video deleted successfully',
      video: result.rows[0],
    });
  } catch (error) {
    console.error('Error deleting video:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete video',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
