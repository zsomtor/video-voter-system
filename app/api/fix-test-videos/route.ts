import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

/**
 * GET /api/fix-test-videos
 * Fix test videos that have actual views and should be converted to 'own' type
 */
export async function GET() {
  try {
    // Find test videos that have actual_views set
    const testVideos = await sql`
      SELECT id, title, source_type, actual_views, is_training_set
      FROM videos
      WHERE source_type = 'test' AND actual_views IS NOT NULL
    `;

    if (testVideos.rows.length === 0) {
      return NextResponse.json({
        message: 'No test videos with actual views found.',
        updated: [],
      });
    }

    // Update them to 'own' type
    const updated = [];
    for (const video of testVideos.rows) {
      const result = await sql`
        UPDATE videos
        SET
          source_type = 'own',
          channel_name = 'Bazu Podcast',
          is_training_set = true
        WHERE id = ${video.id}
        RETURNING *
      `;
      updated.push(result.rows[0]);
    }

    return NextResponse.json({
      message: `Successfully converted ${updated.length} test video(s) to 'own' type.`,
      updated,
    });
  } catch (error) {
    console.error('Error fixing test videos:', error);
    return NextResponse.json(
      {
        error: 'Failed to fix test videos',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
