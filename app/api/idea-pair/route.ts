import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

/**
 * GET /api/idea-pair
 * Returns a random pair of ideas for voting
 */
export async function GET() {
  try {
    // Get all ideas
    const result = await sql`
      SELECT * FROM ideas
      ORDER BY elo_rating DESC
    `;

    const ideas = result.rows;

    if (ideas.length < 2) {
      return NextResponse.json(
        { error: 'Need at least 2 ideas to create a pair' },
        { status: 404 }
      );
    }

    // Simple random pairing - shuffle and take first two
    const shuffled = [...ideas].sort(() => Math.random() - 0.5);
    const idea1 = shuffled[0];
    const idea2 = shuffled[1];

    return NextResponse.json({
      idea1,
      idea2,
    });
  } catch (error) {
    console.error('Error getting idea pair:', error);
    return NextResponse.json(
      { error: 'Failed to get idea pair' },
      { status: 500 }
    );
  }
}
