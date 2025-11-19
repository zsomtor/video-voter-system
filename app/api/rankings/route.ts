import { NextResponse } from 'next/server';
import { getAllVideosRanked, getTotalVotes } from '@/lib/db';
import { estimateViewsFromRating, getConfidenceLevel, getPerformanceTier } from '@/lib/elo';

/**
 * GET /api/rankings
 * Returns all videos ranked by ELO rating with performance predictions
 */
export async function GET() {
  try {
    const videos = await getAllVideosRanked();
    const totalVotes = await getTotalVotes();

    // Enhance each video with predictions and metadata
    const rankedVideos = videos.map((video, index) => {
      const estimatedViews = estimateViewsFromRating(video.elo_rating);
      const confidence = getConfidenceLevel(video.vote_count);
      const tier = getPerformanceTier(video.elo_rating);

      return {
        rank: index + 1,
        ...video,
        estimatedViews,
        confidence,
        tier: tier.tier,
        tierColor: tier.color,
        tierDescription: tier.description,
      };
    });

    return NextResponse.json({
      totalVotes,
      totalVideos: videos.length,
      rankings: rankedVideos,
    });
  } catch (error) {
    console.error('Error fetching rankings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rankings' },
      { status: 500 }
    );
  }
}
