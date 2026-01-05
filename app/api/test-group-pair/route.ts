import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/test-group-pair?testGroupId=xxx
 * Returns a random pair of videos from the specified test group (or random if not specified)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedTestGroupId = searchParams.get('testGroupId');

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

    // If a specific test group is requested, use it; otherwise pick random
    let testGroupId: string;
    let groupVideos: any[];

    if (requestedTestGroupId) {
      const requestedGroup = validTestGroups.find(([id]) => id === requestedTestGroupId);
      if (!requestedGroup) {
        return NextResponse.json(
          { error: `Test group "${requestedTestGroupId}" not found or has less than 2 videos` },
          { status: 404 }
        );
      }
      [testGroupId, groupVideos] = requestedGroup;
    } else {
      // Pick a random test group
      [testGroupId, groupVideos] = validTestGroups[
        Math.floor(Math.random() * validTestGroups.length)
      ];
    }

    // Simple random pairing - all pairs have equal probability
    // Shuffle the videos and take the first two
    const shuffled = [...groupVideos].sort(() => Math.random() - 0.5);
    const firstVideo = shuffled[0];
    const secondVideo = shuffled[1];

    // Return available test groups as well
    const availableTestGroups = validTestGroups.map(([id, videos]) => ({
      id,
      videoCount: videos.length,
    }));

    return NextResponse.json({
      video1: firstVideo,
      video2: secondVideo,
      testGroupId,
      availableTestGroups,
    });
  } catch (error) {
    console.error('Error getting test group pair:', error);
    return NextResponse.json(
      { error: 'Failed to get test group pair' },
      { status: 500 }
    );
  }
}
