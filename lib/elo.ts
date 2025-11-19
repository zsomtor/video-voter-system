/**
 * ELO Rating System for Video Packaging
 *
 * This algorithm ranks video packaging (titles + thumbnails) based on pairwise comparisons.
 * Similar to chess ratings, each video gets a score that goes up when it wins votes and down when it loses.
 */

// K-factor determines how much ratings change per match
// Higher K = faster rating changes, lower K = more stable ratings
const K_FACTOR = 32;

// Default starting rating for new videos
export const DEFAULT_RATING = 1500;

/**
 * Calculate expected probability that video A will beat video B
 * Based on current ELO ratings
 *
 * @param ratingA - Current ELO rating of video A
 * @param ratingB - Current ELO rating of video B
 * @returns Probability (0-1) that A will win
 */
export function getExpectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Calculate new ELO ratings after a match
 *
 * @param winnerRating - Current rating of the winning video
 * @param loserRating - Current rating of the losing video
 * @returns Object with new ratings for winner and loser
 */
export function calculateNewRatings(
  winnerRating: number,
  loserRating: number
): { newWinnerRating: number; newLoserRating: number } {
  // Calculate expected outcomes
  const expectedWinner = getExpectedScore(winnerRating, loserRating);
  const expectedLoser = getExpectedScore(loserRating, winnerRating);

  // Actual outcome: winner gets 1, loser gets 0
  const actualWinner = 1;
  const actualLoser = 0;

  // Calculate new ratings
  const newWinnerRating = Math.round(winnerRating + K_FACTOR * (actualWinner - expectedWinner));
  const newLoserRating = Math.round(loserRating + K_FACTOR * (actualLoser - expectedLoser));

  return { newWinnerRating, newLoserRating };
}

/**
 * Calculate initial ELO rating based on known video performance
 * Maps view counts to ELO ratings for anchoring
 *
 * @param views - Number of views the video got
 * @returns Estimated ELO rating
 */
export function calculateRatingFromViews(views: number): number {
  // Logarithmic scale: each 10x increase in views = ~400 ELO points
  // This creates a balanced distribution

  if (views <= 0) return DEFAULT_RATING;

  // Base formula: 1500 + 400 * log10(views / 10000)
  // Examples:
  // 10,000 views = 1500
  // 100,000 views = 1900
  // 1,000,000 views = 2300

  const baseViews = 10000;
  const rating = DEFAULT_RATING + 400 * Math.log10(views / baseViews);

  return Math.round(Math.max(rating, 800)); // Minimum rating of 800
}

/**
 * Estimate view count from ELO rating
 * Inverse of calculateRatingFromViews
 *
 * @param rating - ELO rating
 * @returns Estimated view count
 */
export function estimateViewsFromRating(rating: number): number {
  // Inverse of the rating formula
  const baseViews = 10000;
  const views = baseViews * Math.pow(10, (rating - DEFAULT_RATING) / 400);

  return Math.round(views);
}

/**
 * Get confidence level based on number of votes
 * More votes = higher confidence in the rating
 *
 * @param voteCount - Number of votes/comparisons
 * @returns Confidence level (0-1)
 */
export function getConfidenceLevel(voteCount: number): number {
  // Use sigmoid function to map votes to confidence
  // 0 votes = 0% confidence, 50 votes = ~90% confidence, 100+ votes = ~99% confidence

  if (voteCount <= 0) return 0;

  const confidence = 1 - Math.exp(-voteCount / 30);
  return Math.round(confidence * 100) / 100;
}

/**
 * Get performance tier based on ELO rating
 *
 * @param rating - ELO rating
 * @returns Performance tier description
 */
export function getPerformanceTier(rating: number): {
  tier: string;
  color: string;
  description: string;
} {
  if (rating >= 2200) {
    return {
      tier: 'S-Tier',
      color: 'text-purple-600',
      description: 'Elite Performance - Top 1%'
    };
  } else if (rating >= 1900) {
    return {
      tier: 'A-Tier',
      color: 'text-blue-600',
      description: 'Excellent Performance'
    };
  } else if (rating >= 1600) {
    return {
      tier: 'B-Tier',
      color: 'text-green-600',
      description: 'Above Average'
    };
  } else if (rating >= 1400) {
    return {
      tier: 'C-Tier',
      color: 'text-yellow-600',
      description: 'Average Performance'
    };
  } else {
    return {
      tier: 'D-Tier',
      color: 'text-red-600',
      description: 'Below Average'
    };
  }
}
