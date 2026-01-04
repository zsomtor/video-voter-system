import { sql } from '@vercel/postgres';

export type SourceType = 'own' | 'competitor' | 'test';

export interface Video {
  id: number;
  title: string;
  thumbnail_text: string;
  thumbnail_url: string | null;
  actual_views: number | null;
  elo_rating: number;
  vote_count: number;
  source_type: SourceType;
  channel_name: string | null;
  guest_name: string | null;
  is_training_set: boolean;
  test_group_id: string | null; // For A/B testing: videos with same test_group_id are variants
  test_group_elo: number; // Separate ELO for A/B test comparisons within test group
  test_group_vote_count: number; // Vote count for test group comparisons
  created_at: Date;
}

export interface Vote {
  id: number;
  winner_id: number;
  loser_id: number;
  created_at: Date;
}

export interface Idea {
  id: number;
  title: string;
  thumbnail_text: string;
  description: string | null;
  elo_rating: number;
  vote_count: number;
  created_at: Date;
}

export interface IdeaVote {
  id: number;
  winner_id: number;
  loser_id: number;
  created_at: Date;
}

/**
 * Initialize database tables
 * Run this once to set up your database
 */
export async function initDatabase() {
  try {
    // Drop old table if exists (for clean migration)
    await sql`DROP TABLE IF EXISTS idea_votes CASCADE`;
    await sql`DROP TABLE IF EXISTS ideas CASCADE`;
    await sql`DROP TABLE IF EXISTS votes CASCADE`;
    await sql`DROP TABLE IF EXISTS videos CASCADE`;

    // Create videos table with new schema
    await sql`
      CREATE TABLE videos (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        thumbnail_text TEXT NOT NULL,
        thumbnail_url TEXT,
        actual_views INTEGER,
        elo_rating INTEGER DEFAULT 1500,
        vote_count INTEGER DEFAULT 0,
        source_type TEXT CHECK (source_type IN ('own', 'competitor', 'test')) DEFAULT 'test',
        channel_name TEXT,
        guest_name TEXT,
        is_training_set BOOLEAN DEFAULT false,
        test_group_id TEXT,
        test_group_elo INTEGER DEFAULT 1500,
        test_group_vote_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create votes table
    await sql`
      CREATE TABLE votes (
        id SERIAL PRIMARY KEY,
        winner_id INTEGER NOT NULL REFERENCES videos(id),
        loser_id INTEGER NOT NULL REFERENCES videos(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create indexes for better query performance
    await sql`
      CREATE INDEX idx_videos_rating ON videos(elo_rating DESC)
    `;

    await sql`
      CREATE INDEX idx_videos_source ON videos(source_type)
    `;

    await sql`
      CREATE INDEX idx_videos_test_group ON videos(test_group_id) WHERE test_group_id IS NOT NULL
    `;

    await sql`
      CREATE INDEX idx_votes_created ON votes(created_at DESC)
    `;

    // Create ideas table (for pre-production video concept testing)
    await sql`
      CREATE TABLE ideas (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        thumbnail_text TEXT NOT NULL,
        description TEXT,
        elo_rating INTEGER DEFAULT 1500,
        vote_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create idea_votes table
    await sql`
      CREATE TABLE idea_votes (
        id SERIAL PRIMARY KEY,
        winner_id INTEGER NOT NULL REFERENCES ideas(id),
        loser_id INTEGER NOT NULL REFERENCES ideas(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create indexes for ideas
    await sql`
      CREATE INDEX idx_ideas_rating ON ideas(elo_rating DESC)
    `;

    await sql`
      CREATE INDEX idx_idea_votes_created ON idea_votes(created_at DESC)
    `;

    console.log('Database initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

/**
 * Helper function: Uncertainty-aware pairing algorithm
 * Given an array of videos, select two using smart pairing strategy
 */
function getUncertaintyAwarePair(videos: Video[]): [Video, Video] | null {
  if (videos.length < 2) {
    return null;
  }

  // Step 1: Select first video weighted by uncertainty
  const weights = videos.map((v) => 1 / (v.vote_count + 1));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  let random = Math.random() * totalWeight;
  let firstVideoIndex = 0;
  for (let i = 0; i < weights.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      firstVideoIndex = i;
      break;
    }
  }

  const firstVideo = videos[firstVideoIndex];

  // Step 2: Select second video based on first video's uncertainty
  let secondVideo: Video;

  if (firstVideo.vote_count < 3) {
    // New video: pair with any other video (random exploration)
    const otherVideos = videos.filter((v) => v.id !== firstVideo.id);
    secondVideo = otherVideos[Math.floor(Math.random() * otherVideos.length)];
  } else {
    // Established video: pair with ELO-similar video (informative comparison)
    const eloRange = 200;
    const similarVideos = videos.filter(
      (v) =>
        v.id !== firstVideo.id &&
        Math.abs(v.elo_rating - firstVideo.elo_rating) <= eloRange
    );

    if (similarVideos.length > 0) {
      secondVideo = similarVideos[Math.floor(Math.random() * similarVideos.length)];
    } else {
      const sortedByDistance = videos
        .filter((v) => v.id !== firstVideo.id)
        .sort((a, b) => {
          const distA = Math.abs(a.elo_rating - firstVideo.elo_rating);
          const distB = Math.abs(b.elo_rating - firstVideo.elo_rating);
          return distA - distB;
        });
      secondVideo = sortedByDistance[0];
    }
  }

  return [firstVideo, secondVideo];
}

/**
 * Get two videos for comparison using uncertainty-aware pairing
 * This smart algorithm maximizes information gained from each vote:
 * 1. Prioritizes videos with fewer votes (higher uncertainty)
 * 2. Pairs videos with similar ELO ratings (most informative comparisons)
 * 3. Adapts strategy based on vote count (exploration vs exploitation)
 * 4. A/B Test Mode: 70% chance to pair videos from same test_group_id
 */
export async function getRandomVideoPair(): Promise<[Video, Video] | null> {
  try {
    // Get all videos
    const allVideos = await sql<Video>`
      SELECT *
      FROM videos
      ORDER BY id
    `;

    if (allVideos.rows.length < 2) {
      return null;
    }

    const videos = allVideos.rows;

    // A/B Test Mode: 70% chance to pair videos from same test_group_id
    const testGroupVideos = videos.filter((v) => v.test_group_id !== null);
    const testGroups = new Map<string, Video[]>();

    // Group videos by test_group_id
    testGroupVideos.forEach((v) => {
      if (v.test_group_id) {
        if (!testGroups.has(v.test_group_id)) {
          testGroups.set(v.test_group_id, []);
        }
        testGroups.get(v.test_group_id)!.push(v);
      }
    });

    // Find test groups with at least 2 videos
    const validTestGroups = Array.from(testGroups.entries()).filter(
      ([_, videos]) => videos.length >= 2
    );

    // 20% chance to use A/B test pairing if available (3 out of 15 votes)
    if (validTestGroups.length > 0 && Math.random() < 0.2) {
      // Pick random test group
      const [testGroupId, groupVideos] = validTestGroups[
        Math.floor(Math.random() * validTestGroups.length)
      ];

      // Use uncertainty-aware pairing within the test group
      return getUncertaintyAwarePair(groupVideos);
    }

    // Fall back to regular uncertainty-aware pairing
    return getUncertaintyAwarePair(videos);
  } catch (error) {
    console.error('Error getting random video pair:', error);
    throw error;
  }
}

/**
 * Get two videos from Bazu Podcast only using uncertainty-aware pairing
 * For internal Bazu ranking with smart pairing strategy and A/B test support
 */
export async function getBazuOnlyVideoPair(): Promise<[Video, Video] | null> {
  try {
    const allVideos = await sql<Video>`
      SELECT *
      FROM videos
      WHERE channel_name = 'Bazu Podcast'
      ORDER BY id
    `;

    if (allVideos.rows.length < 2) {
      return null;
    }

    const videos = allVideos.rows;

    // A/B Test Mode: 70% chance to pair videos from same test_group_id
    const testGroupVideos = videos.filter((v) => v.test_group_id !== null);
    const testGroups = new Map<string, Video[]>();

    testGroupVideos.forEach((v) => {
      if (v.test_group_id) {
        if (!testGroups.has(v.test_group_id)) {
          testGroups.set(v.test_group_id, []);
        }
        testGroups.get(v.test_group_id)!.push(v);
      }
    });

    const validTestGroups = Array.from(testGroups.entries()).filter(
      ([_, videos]) => videos.length >= 2
    );

    // 20% chance to use A/B test pairing if available (3 out of 15 votes)
    if (validTestGroups.length > 0 && Math.random() < 0.2) {
      const [testGroupId, groupVideos] = validTestGroups[
        Math.floor(Math.random() * validTestGroups.length)
      ];
      return getUncertaintyAwarePair(groupVideos);
    }

    // Fall back to regular uncertainty-aware pairing
    return getUncertaintyAwarePair(videos);
  } catch (error) {
    console.error('Error getting Bazu-only video pair:', error);
    throw error;
  }
}

/**
 * Record a vote and update ELO ratings
 */
export async function recordVote(
  winnerId: number,
  loserId: number,
  newWinnerRating: number,
  newLoserRating: number
): Promise<void> {
  try {
    // Start a transaction
    await sql`BEGIN`;

    // Insert vote record
    await sql`
      INSERT INTO votes (winner_id, loser_id)
      VALUES (${winnerId}, ${loserId})
    `;

    // Update winner's rating and vote count
    await sql`
      UPDATE videos
      SET elo_rating = ${newWinnerRating},
          vote_count = vote_count + 1
      WHERE id = ${winnerId}
    `;

    // Update loser's rating and vote count
    await sql`
      UPDATE videos
      SET elo_rating = ${newLoserRating},
          vote_count = vote_count + 1
      WHERE id = ${loserId}
    `;

    // Commit transaction
    await sql`COMMIT`;
  } catch (error) {
    // Rollback on error
    await sql`ROLLBACK`;
    console.error('Error recording vote:', error);
    throw error;
  }
}

/**
 * Get all videos sorted by ELO rating
 */
export async function getAllVideosRanked(): Promise<Video[]> {
  try {
    const result = await sql<Video>`
      SELECT *
      FROM videos
      ORDER BY elo_rating DESC
    `;

    return result.rows;
  } catch (error) {
    console.error('Error getting ranked videos:', error);
    throw error;
  }
}

/**
 * Add a new video to the database
 */
export async function addVideo(
  title: string,
  thumbnailText: string,
  sourceType: SourceType,
  actualViews: number | null = null,
  channelName: string | null = null,
  guestName: string | null = null,
  isTrainingSet: boolean = false,
  initialRating: number = 1500,
  thumbnailUrl: string | null = null,
  testGroupId: string | null = null
): Promise<Video> {
  try {
    const result = await sql<Video>`
      INSERT INTO videos (
        title,
        thumbnail_text,
        thumbnail_url,
        source_type,
        actual_views,
        channel_name,
        guest_name,
        is_training_set,
        elo_rating,
        test_group_id
      )
      VALUES (
        ${title},
        ${thumbnailText},
        ${thumbnailUrl},
        ${sourceType},
        ${actualViews},
        ${channelName},
        ${guestName},
        ${isTrainingSet},
        ${initialRating},
        ${testGroupId}
      )
      RETURNING *
    `;

    return result.rows[0];
  } catch (error) {
    console.error('Error adding video:', error);
    throw error;
  }
}

/**
 * Get total vote count
 */
export async function getTotalVotes(): Promise<number> {
  try {
    const result = await sql`
      SELECT COUNT(*) as count
      FROM votes
    `;

    return parseInt(result.rows[0].count as string);
  } catch (error) {
    console.error('Error getting total votes:', error);
    throw error;
  }
}

/**
 * Get video by ID
 */
export async function getVideoById(id: number): Promise<Video | null> {
  try {
    const result = await sql<Video>`
      SELECT *
      FROM videos
      WHERE id = ${id}
    `;

    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting video by ID:', error);
    throw error;
  }
}

/**
 * Get training set videos (videos with actual views for calibration)
 * Only returns Bazu Podcast videos for channel-specific calibration
 */
export async function getTrainingSetVideos(): Promise<Video[]> {
  try {
    const result = await sql<Video>`
      SELECT *
      FROM videos
      WHERE is_training_set = true
      AND actual_views IS NOT NULL
      AND channel_name = 'Bazu Podcast'
      ORDER BY actual_views DESC
    `;

    return result.rows;
  } catch (error) {
    console.error('Error getting training set videos:', error);
    throw error;
  }
}

/**
 * Get videos by source type
 */
export async function getVideosBySourceType(sourceType: SourceType): Promise<Video[]> {
  try {
    const result = await sql<Video>`
      SELECT *
      FROM videos
      WHERE source_type = ${sourceType}
      ORDER BY elo_rating DESC
    `;

    return result.rows;
  } catch (error) {
    console.error('Error getting videos by source type:', error);
    throw error;
  }
}

/**
 * Get training video pair using uncertainty-aware pairing (for practice mode)
 * Smart pairing even for training helps users learn better comparison strategies
 */
export async function getTrainingVideoPair(): Promise<[Video, Video] | null> {
  try {
    const allVideos = await sql<Video>`
      SELECT *
      FROM videos
      WHERE is_training_set = true
      ORDER BY id
    `;

    if (allVideos.rows.length < 2) {
      return null;
    }

    const videos = allVideos.rows;

    // A/B Test Mode: 70% chance to pair videos from same test_group_id
    const testGroupVideos = videos.filter((v) => v.test_group_id !== null);
    const testGroups = new Map<string, Video[]>();

    testGroupVideos.forEach((v) => {
      if (v.test_group_id) {
        if (!testGroups.has(v.test_group_id)) {
          testGroups.set(v.test_group_id, []);
        }
        testGroups.get(v.test_group_id)!.push(v);
      }
    });

    const validTestGroups = Array.from(testGroups.entries()).filter(
      ([_, videos]) => videos.length >= 2
    );

    // 20% chance to use A/B test pairing if available (3 out of 15 votes)
    if (validTestGroups.length > 0 && Math.random() < 0.2) {
      const [testGroupId, groupVideos] = validTestGroups[
        Math.floor(Math.random() * validTestGroups.length)
      ];
      return getUncertaintyAwarePair(groupVideos);
    }

    // Fall back to regular uncertainty-aware pairing
    return getUncertaintyAwarePair(videos);
  } catch (error) {
    console.error('Error getting training video pair:', error);
    throw error;
  }
}
