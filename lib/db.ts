import { sql } from '@vercel/postgres';

export interface Video {
  id: number;
  title: string;
  thumbnail_text: string;
  actual_views: number | null;
  elo_rating: number;
  vote_count: number;
  is_test: boolean;
  is_competitor: boolean;
  created_at: Date;
}

export interface Vote {
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
    // Create videos table
    await sql`
      CREATE TABLE IF NOT EXISTS videos (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        thumbnail_text TEXT NOT NULL,
        actual_views INTEGER,
        elo_rating INTEGER DEFAULT 1500,
        vote_count INTEGER DEFAULT 0,
        is_test BOOLEAN DEFAULT false,
        is_competitor BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create votes table
    await sql`
      CREATE TABLE IF NOT EXISTS votes (
        id SERIAL PRIMARY KEY,
        winner_id INTEGER NOT NULL REFERENCES videos(id),
        loser_id INTEGER NOT NULL REFERENCES videos(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create indexes for better query performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_videos_rating ON videos(elo_rating DESC)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_votes_created ON votes(created_at DESC)
    `;

    console.log('Database initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

/**
 * Get two random videos for comparison
 * Prioritizes videos with fewer votes to balance data collection
 */
export async function getRandomVideoPair(): Promise<[Video, Video] | null> {
  try {
    // Get videos weighted by vote count (prefer videos with fewer votes)
    // This ensures new videos get rated quickly
    const result = await sql<Video>`
      SELECT *
      FROM videos
      ORDER BY (vote_count + 1) * RANDOM()
      LIMIT 2
    `;

    if (result.rows.length < 2) {
      return null;
    }

    return [result.rows[0], result.rows[1]];
  } catch (error) {
    console.error('Error getting random video pair:', error);
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
  actualViews: number | null = null,
  isTest: boolean = false,
  isCompetitor: boolean = false,
  initialRating: number = 1500
): Promise<Video> {
  try {
    const result = await sql<Video>`
      INSERT INTO videos (title, thumbnail_text, actual_views, elo_rating, is_test, is_competitor)
      VALUES (${title}, ${thumbnailText}, ${actualViews}, ${initialRating}, ${isTest}, ${isCompetitor})
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
