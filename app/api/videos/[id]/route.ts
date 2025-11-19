import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

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

    // Delete the video (CASCADE will delete associated votes)
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
