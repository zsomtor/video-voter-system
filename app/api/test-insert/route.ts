import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

/**
 * POST /api/test-insert
 * Test INSERT and immediate SELECT
 */
export async function POST(request: Request) {
  try {
    const { title, thumbnailText } = await request.json();

    console.log('[TEST-INSERT] Starting test insert...');
    console.log('[TEST-INSERT] Input:', { title, thumbnailText });

    // Step 1: Count before insert
    const countBefore = await sql`SELECT COUNT(*) as count FROM ideas`;
    console.log('[TEST-INSERT] Count BEFORE insert:', countBefore.rows[0].count);

    // Step 2: Insert
    const insertResult = await sql`
      INSERT INTO ideas (title, thumbnail_text, description)
      VALUES (${title}, ${thumbnailText}, 'TEST INSERT')
      RETURNING *
    `;
    console.log('[TEST-INSERT] Insert RETURNING:', insertResult.rows[0]);

    // Step 3: Count after insert
    const countAfter = await sql`SELECT COUNT(*) as count FROM ideas`;
    console.log('[TEST-INSERT] Count AFTER insert:', countAfter.rows[0].count);

    // Step 4: Query the specific record by ID
    const verifyById = await sql`
      SELECT * FROM ideas WHERE id = ${insertResult.rows[0].id}
    `;
    console.log('[TEST-INSERT] Verify by ID:', verifyById.rows[0]);

    // Step 5: Query all records
    const allRecords = await sql`
      SELECT id, title, thumbnail_text FROM ideas ORDER BY id DESC LIMIT 5
    `;
    console.log('[TEST-INSERT] Last 5 records:', allRecords.rows);

    return NextResponse.json({
      success: true,
      countBefore: countBefore.rows[0].count,
      insertedId: insertResult.rows[0].id,
      countAfter: countAfter.rows[0].count,
      verifyById: verifyById.rows[0],
      last5Records: allRecords.rows,
    }, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[TEST-INSERT] Error:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
