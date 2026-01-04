import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

/**
 * GET /api/idea-rankings
 * Returns all ideas ranked by ELO rating
 */
export async function GET() {
  try {
    console.log('[GET /api/idea-rankings] Fetching ideas...');
    const result = await sql`
      SELECT * FROM ideas
      ORDER BY elo_rating DESC
    `;

    const ideas = result.rows;
    console.log('[GET /api/idea-rankings] Found ideas:', ideas.length);

    // Calculate total votes
    const votesResult = await sql`
      SELECT COUNT(*) as total FROM idea_votes
    `;
    const totalVotes = parseInt(votesResult.rows[0]?.total || '0');

    // Add ranking position to each idea
    const rankedIdeas = ideas.map((idea, index) => ({
      ...idea,
      rank: index + 1,
    }));

    console.log('[GET /api/idea-rankings] Returning:', { totalIdeas: ideas.length, totalVotes });

    return NextResponse.json({
      ideas: rankedIdeas,
      totalIdeas: ideas.length,
      totalVotes,
    });
  } catch (error) {
    console.error('Error fetching idea rankings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rankings' },
      { status: 500 }
    );
  }
}
