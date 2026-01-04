import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

/**
 * GET /api/debug-ideas
 * Direct database query for debugging
 */
export async function GET() {
  try {
    console.log('[DEBUG] Querying ideas table directly...');

    // Direct query without any caching
    const result = await sql`
      SELECT id, title, thumbnail_text, description, elo_rating, vote_count, created_at
      FROM ideas
      ORDER BY id DESC
    `;

    console.log('[DEBUG] Raw result:', result.rows);

    return NextResponse.json({
      totalRows: result.rows.length,
      ideas: result.rows,
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
  } catch (error) {
    console.error('[DEBUG] Error:', error);
    return NextResponse.json(
      { error: 'Failed to query database', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
