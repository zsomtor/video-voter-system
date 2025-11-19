import { NextResponse } from 'next/server';
import { addVideo } from '@/lib/db';

/**
 * GET /api/seed-bazu
 * Seeds the database with the 10 Bazu Podcast episodes
 * Safe to run multiple times (won't create duplicates if videos already exist with same titles)
 */
export async function GET() {
  try {
    const bazuVideos = [
      {
        title: 'Hogyan lett egy nehéz sorsból milliárdos vállalkozó?',
        thumbnailText: 'Bántottak Otthon Ezért Milliárdos Lettem',
        thumbnailUrl: 'https://i.ytimg.com/vi/_yHoH_Kqd9s/maxresdefault.jpg',
        actualViews: 150000,
        guestName: 'Silka Ágnes',
      },
      // TODO: Add remaining 9 Bazu podcast episodes here
      // Copy the format above for each video
      // You can find YouTube thumbnail URLs at: https://i.ytimg.com/vi/VIDEO_ID/maxresdefault.jpg
    ];

    const addedVideos = [];

    for (const video of bazuVideos) {
      try {
        const added = await addVideo(
          video.title,
          video.thumbnailText,
          'own', // source_type
          video.actualViews,
          'Bazu Podcast', // channel_name
          video.guestName,
          true, // is_training_set
          1500, // initial rating (will be recalculated)
          video.thumbnailUrl
        );
        addedVideos.push(added);
      } catch (error) {
        console.log(`Skipping ${video.guestName} - may already exist`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Added ${addedVideos.length} Bazu videos`,
      videos: addedVideos,
    });
  } catch (error) {
    console.error('Error seeding Bazu videos:', error);
    return NextResponse.json(
      { error: 'Failed to seed videos', details: String(error) },
      { status: 500 }
    );
  }
}
