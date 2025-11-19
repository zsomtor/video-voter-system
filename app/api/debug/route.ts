import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

/**
 * GET /api/debug
 * Debug endpoint to check database schema
 */
export async function GET() {
  try {
    // Check table structure
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'videos'
      ORDER BY ordinal_position
    `;

    // Count videos
    const videoCount = await sql`
      SELECT COUNT(*) as count FROM videos
    `;

    // Try to select a video with all fields
    let sampleVideo = null;
    try {
      const sample = await sql`
        SELECT * FROM videos LIMIT 1
      `;
      sampleVideo = sample.rows[0] || null;
    } catch (error) {
      sampleVideo = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    return NextResponse.json({
      success: true,
      tableExists: columns.rows.length > 0,
      columns: columns.rows,
      videoCount: videoCount.rows[0].count,
      sampleVideo,
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      {
        error: 'Failed to get debug info',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
