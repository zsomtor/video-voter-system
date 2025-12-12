import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

/**
 * GET /api/test-group-pair
 * Returns a random pair of videos from the same test group
 * Uses uncertainty-aware pairing based on test_group_vote_count
 */
export async function GET() {
  try {
    // Get all videos that have a test_group_id
    const result = await sql`
      SELECT * FROM videos
      WHERE test_group_id IS NOT NULL
      ORDER BY test_group_id, test_group_elo DESC
    `;

    const allTestVideos = result.rows;

    if (allTestVideos.length === 0) {
      return NextResponse.json(
        { error: 'No test group videos available' },
        { status: 404 }
      );
    }

    // Group videos by test_group_id
    const testGroups = new Map<string, any[]>();
    allTestVideos.forEach((video) => {
      const groupId = video.test_group_id;
      if (!testGroups.has(groupId)) {
        testGroups.set(groupId, []);
      }
      testGroups.get(groupId)!.push(video);
    });

    // Filter to only groups with 2+ videos
    const validTestGroups = Array.from(testGroups.entries()).filter(
      ([_, videos]) => videos.length >= 2
    );

    if (validTestGroups.length === 0) {
      return NextResponse.json(
        { error: 'No test groups with 2 or more videos found' },
        { status: 404 }
      );
    }

    // Pick a random test group
    const [testGroupId, groupVideos] = validTestGroups[
      Math.floor(Math.random() * validTestGroups.length)
    ];

    // Simple random pairing - all pairs have equal probability
    // Shuffle the videos and take the first two
    const shuffled = [...groupVideos].sort(() => Math.random() - 0.5);
    const firstVideo = shuffled[0];
    const secondVideo = shuffled[1];

    return NextResponse.json({
      video1: firstVideo,
      video2: secondVideo,
      testGroupId,
    });
  } catch (error) {
    console.error('Error getting test group pair:', error);
    return NextResponse.json(
      { error: 'Failed to get test group pair' },
      { status: 500 }
    );
  }
}
