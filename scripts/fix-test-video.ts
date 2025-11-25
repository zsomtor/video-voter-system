import { sql } from '@vercel/postgres';

async function fixTestVideo() {
  try {
    // Find the video with "Bizalom" in title that's still marked as test
    const result = await sql`
      SELECT id, title, source_type, actual_views, is_training_set, guest_name, channel_name
      FROM videos
      WHERE (title ILIKE '%Bizalom%' OR title ILIKE '%bizalom%')
        AND source_type = 'test'
    `;

    if (result.rows.length === 0) {
      console.log('No test video found with "Bizalom" in the title.');
      return;
    }

    console.log('Found video:', result.rows[0]);

    // Update it to 'own' type
    const updateResult = await sql`
      UPDATE videos
      SET
        source_type = 'own',
        channel_name = 'Bazu Podcast',
        is_training_set = true
      WHERE id = ${result.rows[0].id}
      RETURNING *
    `;

    console.log('Updated successfully!');
    console.log('New state:', updateResult.rows[0]);
  } catch (error) {
    console.error('Error:', error);
  }
}

fixTestVideo();
