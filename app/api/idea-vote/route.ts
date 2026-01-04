import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

/**
 * POST /api/idea-vote
 * Records a vote between two ideas and updates ELO ratings
 */
export async function POST(request: Request) {
  try {
    const { winnerId, loserId } = await request.json();

    if (!winnerId || !loserId) {
      return NextResponse.json(
        { error: 'Winner and loser IDs are required' },
        { status: 400 }
      );
    }

    // Get both ideas
    const ideasResult = await sql`
      SELECT id, elo_rating, vote_count
      FROM ideas
      WHERE id IN (${winnerId}, ${loserId})
    `;

    if (ideasResult.rows.length !== 2) {
      return NextResponse.json(
        { error: 'One or both ideas not found' },
        { status: 404 }
      );
    }

    const winner = ideasResult.rows.find((i) => i.id === winnerId);
    const loser = ideasResult.rows.find((i) => i.id === loserId);

    if (!winner || !loser) {
      return NextResponse.json(
        { error: 'Invalid winner or loser ID' },
        { status: 400 }
      );
    }

    // Calculate new ELO ratings
    const K = 32; // K-factor
    const winnerRating = winner.elo_rating || 1500;
    const loserRating = loser.elo_rating || 1500;

    // Expected scores
    const winnerExpected = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
    const loserExpected = 1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400));

    // New ratings
    const newWinnerRating = Math.round(winnerRating + K * (1 - winnerExpected));
    const newLoserRating = Math.round(loserRating + K * (0 - loserExpected));

    // Update both ideas in a transaction
    await sql`BEGIN`;

    try {
      // Record the vote
      await sql`
        INSERT INTO idea_votes (winner_id, loser_id)
        VALUES (${winnerId}, ${loserId})
      `;

      // Update winner
      await sql`
        UPDATE ideas
        SET elo_rating = ${newWinnerRating},
            vote_count = vote_count + 1
        WHERE id = ${winnerId}
      `;

      // Update loser
      await sql`
        UPDATE ideas
        SET elo_rating = ${newLoserRating},
            vote_count = vote_count + 1
        WHERE id = ${loserId}
      `;

      await sql`COMMIT`;

      return NextResponse.json({
        success: true,
        winner: {
          id: winnerId,
          oldRating: winnerRating,
          newRating: newWinnerRating,
        },
        loser: {
          id: loserId,
          oldRating: loserRating,
          newRating: newLoserRating,
        },
      });
    } catch (error) {
      await sql`ROLLBACK`;
      throw error;
    }
  } catch (error) {
    console.error('Error recording idea vote:', error);
    return NextResponse.json(
      { error: 'Failed to record vote' },
      { status: 500 }
    );
  }
}
