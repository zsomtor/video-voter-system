import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

/**
 * POST /api/test-group-vote
 * Records a vote between two videos in the same test group
 * Updates test_group_elo and test_group_vote_count
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

    // Get both videos
    const videosResult = await sql`
      SELECT id, test_group_elo, test_group_vote_count, test_group_id
      FROM videos
      WHERE id IN (${winnerId}, ${loserId})
    `;

    if (videosResult.rows.length !== 2) {
      return NextResponse.json(
        { error: 'One or both videos not found' },
        { status: 404 }
      );
    }

    const winner = videosResult.rows.find((v) => v.id === winnerId);
    const loser = videosResult.rows.find((v) => v.id === loserId);

    if (!winner || !loser) {
      return NextResponse.json(
        { error: 'Invalid winner or loser ID' },
        { status: 400 }
      );
    }

    // Verify they're in the same test group
    if (winner.test_group_id !== loser.test_group_id) {
      return NextResponse.json(
        { error: 'Videos must be in the same test group' },
        { status: 400 }
      );
    }

    // Calculate new ELO ratings using the standard ELO formula
    const K = 32; // K-factor for ELO calculation
    const winnerRating = winner.test_group_elo || 1500;
    const loserRating = loser.test_group_elo || 1500;

    // Expected scores
    const winnerExpected = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
    const loserExpected = 1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400));

    // New ratings
    const newWinnerRating = Math.round(winnerRating + K * (1 - winnerExpected));
    const newLoserRating = Math.round(loserRating + K * (0 - loserExpected));

    // Update both videos in a transaction
    await sql`BEGIN`;

    try {
      // Update winner
      await sql`
        UPDATE videos
        SET test_group_elo = ${newWinnerRating},
            test_group_vote_count = test_group_vote_count + 1
        WHERE id = ${winnerId}
      `;

      // Update loser
      await sql`
        UPDATE videos
        SET test_group_elo = ${newLoserRating},
            test_group_vote_count = test_group_vote_count + 1
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
    console.error('Error recording test group vote:', error);
    return NextResponse.json(
      { error: 'Failed to record vote' },
      { status: 500 }
    );
  }
}
