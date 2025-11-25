import { sql } from '@vercel/postgres';

/**
 * Migration script to add test_group_id field to existing videos table
 * This preserves all existing data
 */
async function migrateAddTestGroup() {
  try {
    console.log('Starting migration: Adding test_group_id field...');

    // Add test_group_id column if it doesn't exist
    await sql`
      ALTER TABLE videos
      ADD COLUMN IF NOT EXISTS test_group_id TEXT
    `;
    console.log('✓ Added test_group_id column');

    // Create index for test_group_id
    await sql`
      CREATE INDEX IF NOT EXISTS idx_videos_test_group
      ON videos(test_group_id)
      WHERE test_group_id IS NOT NULL
    `;
    console.log('✓ Added index on test_group_id');

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

migrateAddTestGroup()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
