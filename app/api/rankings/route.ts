import { NextResponse } from 'next/server';
import { getAllVideosRanked, getTotalVotes } from '@/lib/db';
import { getConfidenceLevel, getPerformanceTier } from '@/lib/elo';
import {
  calibrateFromTrainingSet,
  estimateViewsFromRating,
  getCalibrationStatus,
} from '@/lib/calibration';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/rankings
 * Returns all videos ranked by ELO rating with performance predictions
 * Uses channel-specific calibration for accurate view estimates
 */
export async function GET() {
  try {
    const videos = await getAllVideosRanked();
    const totalVotes = await getTotalVotes();

    // Get calibration data from training set
    const calibration = await calibrateFromTrainingSet();
    const calibrationStatus = getCalibrationStatus(calibration);

    // Enhance each video with predictions and metadata
    const rankedVideos = videos.map((video, index) => {
      const estimatedViews = estimateViewsFromRating(video.elo_rating, calibration);
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
      calibration: {
        ...calibration,
        ...calibrationStatus,
      },
    });
  } catch (error) {
    console.error('Error fetching rankings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rankings' },
      { status: 500 }
    );
  }
}
