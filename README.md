# YouTube Video Voter System

A web application that uses an **ELO rating algorithm** to predict YouTube video performance based on pairwise comparisons of titles and thumbnails.

## What This Does

This app helps you test different YouTube video packaging (titles + thumbnails) by having users vote on which videos they'd click on. Using an ELO rating system (like chess rankings), it predicts how well your new packaging will perform compared to your existing videos.

### Key Features

- **Pairwise Voting**: Users choose between two video options at a time
- **ELO Algorithm**: Sophisticated ranking system that adjusts based on vote outcomes
- **Performance Prediction**: Estimates view counts for new packaging based on ratings
- **Benchmark System**: Compare against your own past videos and competitors
- **Confidence Scoring**: Shows how reliable the predictions are based on vote count
- **Admin Dashboard**: View rankings, add videos, and track metrics

## How It Works

### The Algorithm

1. **Initial Ratings**: Videos start at 1500 ELO (or calculated from actual view count)
2. **Voting**: When users pick video A over B, ratings adjust:
   - Winner gains points
   - Loser loses points
   - Upset victories cause larger swings
3. **Prediction**: After collecting votes, compare your test video's rating to known videos
4. **Estimation**: Interpolate expected views based on rating position

### ELO Formula

```
Expected Score = 1 / (1 + 10^((Rating_B - Rating_A) / 400))
New Rating = Old Rating + K * (Actual - Expected)
```

Where:
- K = 32 (how quickly ratings change)
- Actual = 1 for winner, 0 for loser
- Expected = probability of winning

### View Count Mapping

```
Rating 1500 = ~10,000 views (baseline)
Rating 1900 = ~100,000 views
Rating 2300 = ~1,000,000 views
```

Each 400 points ≈ 10x increase in views (logarithmic scale)

## Deployment Guide

### Deploy to Vercel (Recommended)

1. **Fork/Clone this repository**

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your repository
   - Vercel will auto-detect Next.js

3. **Add Vercel Postgres**:
   - In your Vercel project dashboard, go to "Storage"
   - Click "Create Database"
   - Select "Postgres"
   - Follow the prompts to create your database
   - Vercel will automatically add environment variables

4. **Initialize Database**:
   - After deployment, visit: `https://your-app.vercel.app/api/init`
   - This creates the database tables

5. **Seed Example Data** (Optional):
   - Visit: `https://your-app.vercel.app/api/seed`
   - This adds 14 example videos to get started

6. **Start Using**:
   - Main voting page: `https://your-app.vercel.app`
   - Admin dashboard: `https://your-app.vercel.app/admin`

### Environment Variables

When using Vercel Postgres, these are automatically set:

```
POSTGRES_URL
POSTGRES_PRISMA_URL
POSTGRES_URL_NON_POOLING
POSTGRES_USER
POSTGRES_HOST
POSTGRES_PASSWORD
POSTGRES_DATABASE
```

## Local Development

### Prerequisites

- Node.js 18+ installed
- A Postgres database (local or remote)

### Setup

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd video-voter-system
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your Postgres connection details.

4. **Initialize database**:
   ```bash
   npm run dev
   ```
   Then visit: `http://localhost:3000/api/init`

5. **Seed example data** (optional):
   Visit: `http://localhost:3000/api/seed`

6. **Start developing**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## Usage Guide

### Adding Videos

1. Go to the **Admin Dashboard** (`/admin`)
2. Click **"+ Add New Video"**
3. Fill in:
   - **Title**: The video title
   - **Thumbnail Text**: Main text that appears on thumbnail
   - **Actual Views** (optional): If this is an existing video, enter view count for calibration
   - **Is Test**: Check if this is new packaging you're testing
   - **Is Competitor**: Check if this is a competitor's video

### Getting Votes

Share the main page URL (`/`) with your audience. They:
1. See two video options side-by-side
2. Click on the one they'd rather watch
3. Immediately get a new comparison
4. Repeat as many times as they want

### Reading Results

In the Admin Dashboard, you'll see:

- **ELO Rating**: Higher = more appealing packaging
- **Tier**: Performance level (S-Tier = elite, D-Tier = below average)
- **Vote Count**: How many comparisons this video has been in
- **Confidence**: How reliable the rating is (more votes = higher confidence)
- **Estimated Views**: Predicted view count based on rating
- **Actual Views**: Real performance (for benchmark videos)

### Interpreting Predictions

Example:
- Your 200k view video has rating 1900
- Your new test video has rating 1750 (after 50 votes, 85% confidence)
- Your 50k view video has rating 1600

**Prediction**: Your new packaging will likely perform between 50k-200k views, probably around 80-100k views.

## API Reference

### GET `/api/pair`
Returns two random videos for comparison.

**Response**:
```json
{
  "videoA": { /* video object */ },
  "videoB": { /* video object */ }
}
```

### POST `/api/vote`
Records a vote and updates ELO ratings.

**Body**:
```json
{
  "winnerId": 1,
  "loserId": 2
}
```

**Response**:
```json
{
  "success": true,
  "winner": {
    "id": 1,
    "oldRating": 1500,
    "newRating": 1516,
    "change": 16
  },
  "loser": { /* ... */ }
}
```

### GET `/api/rankings`
Returns all videos ranked by ELO with predictions.

**Response**:
```json
{
  "totalVotes": 150,
  "totalVideos": 10,
  "rankings": [ /* array of ranked videos */ ]
}
```

### POST `/api/videos`
Adds a new video.

**Body**:
```json
{
  "title": "Amazing Video Title",
  "thumbnailText": "CLICK ME",
  "actualViews": 100000,
  "isTest": false,
  "isCompetitor": false
}
```

### GET `/api/init`
Initializes database tables (run once).

### GET `/api/seed`
Seeds database with example videos.

## Project Structure

```
video-voter-system/
├── app/
│   ├── page.tsx              # Main voting interface
│   ├── admin/
│   │   └── page.tsx          # Admin dashboard
│   ├── api/
│   │   ├── pair/route.ts     # Get random video pair
│   │   ├── vote/route.ts     # Record votes
│   │   ├── rankings/route.ts # Get rankings
│   │   ├── videos/route.ts   # Add videos
│   │   ├── init/route.ts     # Initialize DB
│   │   └── seed/route.ts     # Seed data
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
├── lib/
│   ├── db.ts                 # Database functions
│   └── elo.ts                # ELO algorithm
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── README.md
```

## Technology Stack

- **Framework**: Next.js 14 (React)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Vercel Postgres (PostgreSQL)
- **Deployment**: Vercel
- **Algorithm**: ELO Rating System

## Algorithm Details

### Why ELO?

ELO is perfect for this because:
- Handles pairwise comparisons naturally
- Self-balancing (ratings stabilize over time)
- Proven system (chess, gaming, sports)
- Works with incomplete data
- Handles new items gracefully

### Rating Tiers

- **S-Tier** (2200+): Elite - Top 1% performance
- **A-Tier** (1900-2199): Excellent performance
- **B-Tier** (1600-1899): Above average
- **C-Tier** (1400-1599): Average performance
- **D-Tier** (<1400): Below average

### Confidence Calculation

Confidence increases with votes using a sigmoid function:
- 0 votes = 0% confidence
- 30 votes = 63% confidence
- 50 votes = 81% confidence
- 100 votes = 96% confidence

## Tips for Best Results

1. **Add Benchmarks**: Include several of your past videos with known view counts
2. **Add Competitors**: Include successful videos from your niche for reference
3. **Get Volume**: More votes = better predictions (aim for 50+ votes per video)
4. **Test Variations**: Create multiple test versions to find the best packaging
5. **Iterate**: Use results to create new variations and re-test

## Customization

### Adjust ELO Sensitivity

In `lib/elo.ts`, change the K-factor:
```typescript
const K_FACTOR = 32; // Higher = faster rating changes
```

### Modify View Count Formula

In `lib/elo.ts`, adjust the logarithmic mapping:
```typescript
const baseViews = 10000;
const rating = DEFAULT_RATING + 400 * Math.log10(views / baseViews);
```

### Change Styling

Edit `app/globals.css` and Tailwind classes in components.

## Troubleshooting

### "Not enough videos in database"
- Visit `/api/seed` to add example videos, or
- Add videos manually through the admin dashboard

### Database connection errors
- Check your Postgres environment variables
- Ensure Vercel Postgres is properly linked to your project
- Try visiting `/api/init` to initialize tables

### Votes not updating
- Check browser console for errors
- Verify API routes are working
- Check database connection

## Future Enhancements

Potential features to add:
- Image upload for actual thumbnails
- A/B test groups (test multiple variants at once)
- Historical performance tracking
- Export results to CSV
- User authentication for admin panel
- Vote limiting per IP/user
- Real-time leaderboard updates

## License

MIT License - feel free to use for your projects!

## Contributing

Contributions welcome! Please open an issue or PR.

## Support

For issues or questions, please open a GitHub issue.

---

Built with Next.js, TypeScript, and the ELO rating algorithm.
