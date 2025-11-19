import { getTrainingSetVideos } from './db';

/**
 * Calibration system for channel-specific ELO → view predictions
 *
 * This learns from YOUR actual video performance data, not generic formulas.
 * After inputting your 10 Bazu episodes with real view counts, this creates
 * a custom mapping: "For Bazu channel, 1750 ELO = ~80K views"
 */

export interface CalibrationData {
  isCalibrated: boolean;
  channelName: string | null;
  trainingDataCount: number;
  minViews: number;
  maxViews: number;
  minRating: number;
  maxRating: number;
  // Regression coefficients for ELO → views mapping
  slope: number;
  intercept: number;
  confidence: number; // 0-1, based on training data quantity
}

/**
 * Build calibration model from training set videos
 * Uses linear regression: log10(views) = slope * rating + intercept
 */
export async function calibrateFromTrainingSet(): Promise<CalibrationData> {
  const trainingVideos = await getTrainingSetVideos();

  if (trainingVideos.length === 0) {
    // No calibration data - return uncalibrated defaults
    return {
      isCalibrated: false,
      channelName: null,
      trainingDataCount: 0,
      minViews: 0,
      maxViews: 0,
      minRating: 1500,
      maxRating: 1500,
      slope: 0,
      intercept: 0,
      confidence: 0,
    };
  }

  // Extract channel name from first training video
  const channelName = trainingVideos[0].channel_name || 'Your Channel';

  // Calculate min/max for range
  const views = trainingVideos.map(v => v.actual_views!);
  const ratings = trainingVideos.map(v => v.elo_rating);
  const minViews = Math.min(...views);
  const maxViews = Math.max(...views);
  const minRating = Math.min(...ratings);
  const maxRating = Math.max(...ratings);

  // Perform linear regression: log10(views) vs rating
  // This accounts for exponential growth (views scale logarithmically)
  const logViews = trainingVideos.map(v => Math.log10(v.actual_views!));
  const n = trainingVideos.length;

  const sumX = ratings.reduce((a, b) => a + b, 0);
  const sumY = logViews.reduce((a, b) => a + b, 0);
  const sumXY = ratings.reduce((sum, x, i) => sum + x * logViews[i], 0);
  const sumX2 = ratings.reduce((sum, x) => sum + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate confidence based on:
  // - Number of training videos (more = better)
  // - Rating spread (wider range = better predictions)
  const dataConfidence = Math.min(n / 10, 1); // 10+ videos = 100%
  const spreadConfidence = Math.min((maxRating - minRating) / 400, 1); // 400+ spread = 100%
  const confidence = (dataConfidence + spreadConfidence) / 2;

  return {
    isCalibrated: true,
    channelName,
    trainingDataCount: n,
    minViews,
    maxViews,
    minRating,
    maxRating,
    slope,
    intercept,
    confidence,
  };
}

/**
 * Estimate views from ELO rating using channel-specific calibration
 */
export function estimateViewsFromRating(
  rating: number,
  calibration: CalibrationData
): number {
  if (!calibration.isCalibrated || calibration.trainingDataCount === 0) {
    // Fallback to generic formula if not calibrated
    const baseViews = 10000;
    const views = baseViews * Math.pow(10, (rating - 1500) / 400);
    return Math.round(views);
  }

  // Use channel-specific linear regression model
  const logViews = calibration.slope * rating + calibration.intercept;
  const views = Math.pow(10, logViews);

  // Clamp to training range (don't extrapolate too far)
  const minEstimate = calibration.minViews * 0.5; // Allow 50% below min
  const maxEstimate = calibration.maxViews * 2; // Allow 2x above max

  return Math.round(Math.max(minEstimate, Math.min(maxEstimate, views)));
}

/**
 * Estimate ELO rating from known views (inverse of estimateViewsFromRating)
 */
export function estimateRatingFromViews(
  views: number,
  calibration: CalibrationData
): number {
  if (!calibration.isCalibrated || calibration.trainingDataCount === 0) {
    // Fallback to generic formula
    const baseViews = 10000;
    const rating = 1500 + 400 * Math.log10(views / baseViews);
    return Math.round(Math.max(rating, 800));
  }

  // Use inverse of linear regression: rating = (log10(views) - intercept) / slope
  const logViews = Math.log10(views);
  const rating = (logViews - calibration.intercept) / calibration.slope;

  return Math.round(rating);
}

/**
 * Find which existing videos a new rating falls between
 */
export async function findBenchmarkRange(
  testRating: number
): Promise<{
  above: { guest_name: string; actual_views: number; elo_rating: number } | null;
  below: { guest_name: string; actual_views: number; elo_rating: number } | null;
  rank: number;
}> {
  const trainingVideos = await getTrainingSetVideos();

  if (trainingVideos.length === 0) {
    return { above: null, below: null, rank: 1 };
  }

  // Sort by rating
  const sorted = trainingVideos.sort((a, b) => b.elo_rating - a.elo_rating);

  // Find position
  let rank = 1;
  let above = null;
  let below = null;

  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].elo_rating > testRating) {
      rank = i + 2; // +1 for 0-index, +1 because we're below this video
      above = {
        guest_name: sorted[i].guest_name || sorted[i].title,
        actual_views: sorted[i].actual_views!,
        elo_rating: sorted[i].elo_rating,
      };
      if (i + 1 < sorted.length) {
        below = {
          guest_name: sorted[i + 1].guest_name || sorted[i + 1].title,
          actual_views: sorted[i + 1].actual_views!,
          elo_rating: sorted[i + 1].elo_rating,
        };
      }
      break;
    }
  }

  // If we didn't find anyone above, we're #1
  if (!above && sorted.length > 0) {
    rank = 1;
    below = {
      guest_name: sorted[0].guest_name || sorted[0].title,
      actual_views: sorted[0].actual_views!,
      elo_rating: sorted[0].elo_rating,
    };
  }

  // If we're below everyone
  if (!above && !below && sorted.length > 0) {
    rank = sorted.length + 1;
    above = {
      guest_name: sorted[sorted.length - 1].guest_name || sorted[sorted.length - 1].title,
      actual_views: sorted[sorted.length - 1].actual_views!,
      elo_rating: sorted[sorted.length - 1].elo_rating,
    };
  }

  return { above, below, rank };
}

/**
 * Get calibration status message
 */
export function getCalibrationStatus(calibration: CalibrationData): {
  status: 'excellent' | 'good' | 'needs_data' | 'uncalibrated';
  message: string;
  color: string;
} {
  if (!calibration.isCalibrated || calibration.trainingDataCount === 0) {
    return {
      status: 'uncalibrated',
      message: 'Nincs kalibráció - adj hozzá legalább 5 saját videót ismert nézettséggel!',
      color: 'text-red-600',
    };
  }

  if (calibration.trainingDataCount >= 10 && calibration.confidence >= 0.7) {
    return {
      status: 'excellent',
      message: `Kiváló kalibráció - ${calibration.trainingDataCount} edzési videó, ${Math.round(calibration.confidence * 100)}% megbízhatóság`,
      color: 'text-green-600',
    };
  }

  if (calibration.trainingDataCount >= 5 && calibration.confidence >= 0.5) {
    return {
      status: 'good',
      message: `Jó kalibráció - ${calibration.trainingDataCount} edzési videó. Több adat = jobb előrejelzés.`,
      color: 'text-blue-600',
    };
  }

  return {
    status: 'needs_data',
    message: `Gyenge kalibráció - csak ${calibration.trainingDataCount} edzési videó. Add hozzá legalább ${10 - calibration.trainingDataCount} videót még!`,
    color: 'text-orange-600',
  };
}
