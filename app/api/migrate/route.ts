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
