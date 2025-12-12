import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

/**
 * POST /api/finalize-test-group
 * Finalizes an A/B test by keeping the winner and deleting the losers
 *
 * Body: {
 *   testGroupId: string,
 *   winnerId: number,
 *   actualViews?: number (optional - add real view count to winner)
 * }
 */
export async function POST(request: Request) {
  try {
    const { testGroupId, winnerId, actualViews } = await request.json();

    if (!testGroupId || !winnerId) {
      return NextResponse.json(
        { error: 'Test group ID and winner ID are required' },
        { status: 400 }
      );
    }

    // Get all videos in this test group
    const videosResult = await sql`
      SELECT id, title, thumbnail_text, test_group_id
      FROM videos
      WHERE test_group_id = ${testGroupId}
    `;

    const videos = videosResult.rows;

    if (videos.length === 0) {
      return NextResponse.json(
        { error: 'No videos found with this test group ID' },
        { status: 404 }
      );
    }

    // Verify winner exists in this group
    const winner = videos.find(v => v.id === winnerId);
    if (!winner) {
      return NextResponse.json(
        { error: 'Winner not found in this test group' },
        { status: 400 }
      );
    }

    const losers = videos.filter(v => v.id !== winnerId);

    // Start transaction
    await sql`BEGIN`;

    try {
      // Delete all loser videos
      for (const loser of losers) {
        // Delete votes involving this video
        await sql`
          DELETE FROM votes
          WHERE winner_id = ${loser.id} OR loser_id = ${loser.id}
        `;

        // Delete the video
        await sql`
          DELETE FROM videos
          WHERE id = ${loser.id}
        `;
      }

      // Update winner: remove test_group_id and optionally add actual_views
      if (actualViews !== undefined && actualViews !== null) {
        await sql`
          UPDATE videos
          SET test_group_id = NULL,
              actual_views = ${actualViews},
              source_type = 'own'
          WHERE id = ${winnerId}
        `;
      } else {
        await sql`
          UPDATE videos
          SET test_group_id = NULL
          WHERE id = ${winnerId}
        `;
      }

      await sql`COMMIT`;

      return NextResponse.json({
        success: true,
        message: 'Test group finalized successfully',
        winner: {
          id: winnerId,
          title: winner.title,
        },
        deletedCount: losers.length,
      });
    } catch (error) {
      await sql`ROLLBACK`;
      throw error;
    }
  } catch (error) {
    console.error('Error finalizing test group:', error);
    return NextResponse.json(
      { error: 'Failed to finalize test group' },
      { status: 500 }
    );
  }
}
