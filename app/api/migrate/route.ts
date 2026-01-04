import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

/**
 * GET /api/migrate
 * Migrates the database schema to add missing fields
 * This is safe to run - it won't delete existing data
 */
export async function GET() {
  try {
    const migrations: string[] = [];

    // Check if thumbnail_url column exists
    const checkThumbnailUrl = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'videos'
      AND column_name = 'thumbnail_url'
    `;

    if (checkThumbnailUrl.rows.length === 0) {
      // Add thumbnail_url column
      await sql`
        ALTER TABLE videos
        ADD COLUMN thumbnail_url TEXT
      `;
      migrations.push('thumbnail_url column added');
    }

    // Check if test_group_id column exists
    const checkTestGroupId = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'videos'
      AND column_name = 'test_group_id'
    `;

    if (checkTestGroupId.rows.length === 0) {
      // Add test_group_id column
      await sql`
        ALTER TABLE videos
        ADD COLUMN test_group_id TEXT
      `;
      migrations.push('test_group_id column added');

      // Create index for test_group_id
      await sql`
        CREATE INDEX IF NOT EXISTS idx_videos_test_group
        ON videos(test_group_id)
        WHERE test_group_id IS NOT NULL
      `;
      migrations.push('test_group_id index created');
    }

    // Check if test_group_elo column exists
    const checkTestGroupElo = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'videos'
      AND column_name = 'test_group_elo'
    `;

    if (checkTestGroupElo.rows.length === 0) {
      // Add test_group_elo and test_group_vote_count columns
      await sql`
        ALTER TABLE videos
        ADD COLUMN test_group_elo INTEGER DEFAULT 1500
      `;
      migrations.push('test_group_elo column added');

      await sql`
        ALTER TABLE videos
        ADD COLUMN test_group_vote_count INTEGER DEFAULT 0
      `;
      migrations.push('test_group_vote_count column added');
    }

    // Check if ideas table exists
    const checkIdeasTable = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name = 'ideas'
    `;

    if (checkIdeasTable.rows.length === 0) {
      // Create ideas table
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
      migrations.push('ideas table created');

      // Create index
      await sql`
        CREATE INDEX idx_ideas_rating ON ideas(elo_rating DESC)
      `;
      migrations.push('ideas rating index created');
    }

    // Check if idea_votes table exists (separate check)
    const checkIdeaVotesTable = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name = 'idea_votes'
    `;

    if (checkIdeaVotesTable.rows.length === 0) {
      // Create idea_votes table
      await sql`
        CREATE TABLE idea_votes (
          id SERIAL PRIMARY KEY,
          winner_id INTEGER NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
          loser_id INTEGER NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      migrations.push('idea_votes table created');

      // Create index
      await sql`
        CREATE INDEX idx_idea_votes_created ON idea_votes(created_at DESC)
      `;
      migrations.push('idea_votes index created');
    }

    if (migrations.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All migrations already completed - no changes needed',
        alreadyMigrated: true,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Database migrated successfully: ${migrations.join(', ')}`,
      migrations,
      alreadyMigrated: false,
    });
  } catch (error) {
    console.error('Error migrating database:', error);
    return NextResponse.json(
      {
        error: 'Failed to migrate database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
