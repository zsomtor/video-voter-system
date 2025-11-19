import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

/**
 * GET /api/migrate
 * Migrates the database schema to add thumbnail_url field
 * This is safe to run - it won't delete existing data
 */
export async function GET() {
  try {
    // Check if column already exists
    const checkColumn = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'videos'
      AND column_name = 'thumbnail_url'
    `;

    if (checkColumn.rows.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Migration already completed - thumbnail_url column already exists',
        alreadyMigrated: true,
      });
    }

    // Add thumbnail_url column
    await sql`
      ALTER TABLE videos
      ADD COLUMN thumbnail_url TEXT
    `;

    return NextResponse.json({
      success: true,
      message: 'Database migrated successfully - thumbnail_url column added',
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
