import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

/**
 * GET /api/ideas
 * Returns all ideas
 */
export async function GET() {
  try {
    const result = await sql`
      SELECT * FROM ideas
      ORDER BY elo_rating DESC
    `;

    return NextResponse.json({
      ideas: result.rows,
    });
  } catch (error) {
    console.error('Error fetching ideas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ideas' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ideas
 * Creates a new idea
 */
export async function POST(request: Request) {
  try {
    const { title, thumbnailText, description } = await request.json();

    console.log('[POST /api/ideas] Request:', { title, thumbnailText, description });

    if (!title || !thumbnailText) {
      return NextResponse.json(
        { error: 'Title and thumbnail text are required' },
        { status: 400 }
      );
    }

    console.log('[POST /api/ideas] Inserting into database...');
    const result = await sql`
      INSERT INTO ideas (title, thumbnail_text, description)
      VALUES (${title}, ${thumbnailText}, ${description || null})
      RETURNING *
    `;

    console.log('[POST /api/ideas] Insert result:', result.rows[0]);

    // Verify it's in the database
    const verifyResult = await sql`
      SELECT COUNT(*) as count FROM ideas
    `;
    console.log('[POST /api/ideas] Total ideas in DB after insert:', verifyResult.rows[0].count);

    return NextResponse.json({
      success: true,
      idea: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating idea:', error);
    return NextResponse.json(
      { error: 'Failed to create idea' },
      { status: 500 }
    );
  }
}
