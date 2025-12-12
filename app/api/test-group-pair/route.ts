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

    // Use uncertainty-aware pairing within the test group
    // Prioritize videos with fewer test_group_vote_count
    const weights = groupVideos.map((v) => 1 / (v.test_group_vote_count + 1));
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    // Select first video weighted by uncertainty
    let random = Math.random() * totalWeight;
    let firstVideoIndex = 0;
    for (let i = 0; i < weights.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        firstVideoIndex = i;
        break;
      }
    }

    const firstVideo = groupVideos[firstVideoIndex];

    // Select second video (excluding first)
    let secondVideo;
    if (firstVideo.test_group_vote_count < 3) {
      // New video: random exploration
      const otherVideos = groupVideos.filter((v) => v.id !== firstVideo.id);
      secondVideo = otherVideos[Math.floor(Math.random() * otherVideos.length)];
    } else {
      // Established video: pair with similar test_group_elo
      const eloRange = 200;
      const similarVideos = groupVideos.filter(
        (v) =>
          v.id !== firstVideo.id &&
          Math.abs(v.test_group_elo - firstVideo.test_group_elo) <= eloRange
      );

      if (similarVideos.length > 0) {
        // Weight by uncertainty among similar videos
        const similarWeights = similarVideos.map(
          (v) => 1 / (v.test_group_vote_count + 1)
        );
        const similarTotalWeight = similarWeights.reduce((sum, w) => sum + w, 0);

        let similarRandom = Math.random() * similarTotalWeight;
        let secondVideoIndex = 0;
        for (let i = 0; i < similarWeights.length; i++) {
          similarRandom -= similarWeights[i];
          if (similarRandom <= 0) {
            secondVideoIndex = i;
            break;
          }
        }
        secondVideo = similarVideos[secondVideoIndex];
      } else {
        // No similar videos, pick random
        const otherVideos = groupVideos.filter((v) => v.id !== firstVideo.id);
        secondVideo = otherVideos[Math.floor(Math.random() * otherVideos.length)];
      }
    }

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
