import { NextResponse } from 'next/server';
import { addVideo } from '@/lib/db';
import { calculateRatingFromViews } from '@/lib/elo';

/**
 * GET /api/seed
 * Seeds the database with example videos
 */
export async function GET() {
  try {
    const exampleVideos = [
      // High performers (known successes)
      {
        title: 'How I Built a $1M SaaS in 6 Months',
        thumbnailText: 'FROM $0 TO $1M',
        actualViews: 500000,
        isTest: false,
        isCompetitor: false,
      },
      {
        title: 'The SECRET Algorithm Behind Viral Videos',
        thumbnailText: 'ALGORITHM EXPOSED',
        actualViews: 350000,
        isTest: false,
        isCompetitor: false,
      },
      {
        title: 'I Tried Every Productivity Hack for 30 Days',
        thumbnailText: '30 DAY CHALLENGE',
        actualViews: 280000,
        isTest: false,
        isCompetitor: false,
      },

      // Medium performers
      {
        title: 'Why Your YouTube Videos Aren\'t Getting Views',
        thumbnailText: 'STOP DOING THIS',
        actualViews: 120000,
        isTest: false,
        isCompetitor: false,
      },
      {
        title: 'The Best Free Tools for Content Creators',
        thumbnailText: 'FREE TOOLS 2024',
        actualViews: 95000,
        isTest: false,
        isCompetitor: false,
      },

      // Lower performers
      {
        title: 'My Morning Routine as a YouTuber',
        thumbnailText: 'MORNING ROUTINE',
        actualViews: 45000,
        isTest: false,
        isCompetitor: false,
      },
      {
        title: 'Behind the Scenes of Making Videos',
        thumbnailText: 'BTS FOOTAGE',
        actualViews: 32000,
        isTest: false,
        isCompetitor: false,
      },

      // Competitor videos
      {
        title: 'MrBeast Style Video Ideas That Work',
        thumbnailText: 'VIRAL IDEAS',
        actualViews: 420000,
        isTest: false,
        isCompetitor: true,
      },
      {
        title: 'How to Edit Like Casey Neistat',
        thumbnailText: 'EDITING SECRETS',
        actualViews: 180000,
        isTest: false,
        isCompetitor: true,
      },

      // Test videos (new packaging to test)
      {
        title: 'I Quit My Job to Make Videos Full Time',
        thumbnailText: 'I QUIT',
        actualViews: null,
        isTest: true,
        isCompetitor: false,
      },
      {
        title: 'The One Thing That Changed My Channel',
        thumbnailText: 'THIS CHANGED EVERYTHING',
        actualViews: null,
        isTest: true,
        isCompetitor: false,
      },
      {
        title: 'Why 99% of YouTubers Fail',
        thumbnailText: '99% FAIL',
        actualViews: null,
        isTest: true,
        isCompetitor: false,
      },
      {
        title: 'Making $10,000/Month on YouTube',
        thumbnailText: '$10K/MONTH',
        actualViews: null,
        isTest: true,
        isCompetitor: false,
      },
    ];

    const addedVideos = [];

    for (const video of exampleVideos) {
      const initialRating = video.actualViews
        ? calculateRatingFromViews(video.actualViews)
        : 1500;

      const addedVideo = await addVideo(
        video.title,
        video.thumbnailText,
        video.actualViews,
        video.isTest,
        video.isCompetitor,
        initialRating
      );

      addedVideos.push(addedVideo);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${addedVideos.length} videos`,
      videos: addedVideos,
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json(
      { error: 'Failed to seed database', details: String(error) },
      { status: 500 }
    );
  }
}
