import { NextRequest, NextResponse } from 'next/server';
import { getVideoById, recordVote } from '@/lib/db';
import { calculateNewRatings } from '@/lib/elo';

/**
 * POST /api/vote
 * Records a vote and updates ELO ratings
 *
 * Body: { winnerId: number, loserId: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { winnerId, loserId } = body;

    // Validate input
    if (!winnerId || !loserId) {
      return NextResponse.json(
        { error: 'Both winnerId and loserId are required' },
        { status: 400 }
      );
    }

    if (winnerId === loserId) {
      return NextResponse.json(
        { error: 'Winner and loser must be different videos' },
        { status: 400 }
      );
    }

    // Get current ratings
    const winner = await getVideoById(winnerId);
    const loser = await getVideoById(loserId);

    if (!winner || !loser) {
      return NextResponse.json(
        { error: 'One or both videos not found' },
        { status: 404 }
      );
    }

    // Calculate new ELO ratings
    const { newWinnerRating, newLoserRating } = calculateNewRatings(
      winner.elo_rating,
      loser.elo_rating
    );

    // Record the vote and update ratings
    await recordVote(winnerId, loserId, newWinnerRating, newLoserRating);

    return NextResponse.json({
      success: true,
      winner: {
        id: winnerId,
        oldRating: winner.elo_rating,
        newRating: newWinnerRating,
        change: newWinnerRating - winner.elo_rating,
      },
      loser: {
        id: loserId,
        oldRating: loser.elo_rating,
        newRating: newLoserRating,
        change: newLoserRating - loser.elo_rating,
      },
    });
  } catch (error) {
    console.error('Error recording vote:', error);
    return NextResponse.json(
      { error: 'Failed to record vote' },
      { status: 500 }
    );
  }
}
