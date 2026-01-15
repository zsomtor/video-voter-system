import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/idea-pair
 * Returns a pair of ideas for voting with uncertainty-aware selection
 *
 * Priority tiers:
 * - 0-4 votes: URGENT (70% selection chance) - need immediate calibration
 * - 5-9 votes: PRIORITY (45% selection chance) - still finding their level
 * - 10+ votes: NORMAL (standard random pairing)
 *
 * New ideas are paired against middle-percentile opponents (40th-60th)
 */
export async function GET() {
  try {
    // Get all ideas
    const result = await sql`
      SELECT * FROM ideas
      ORDER BY elo_rating DESC
    `;

    const ideas = result.rows;

    if (ideas.length < 2) {
      return NextResponse.json(
        { error: 'Need at least 2 ideas to create a pair' },
        { status: 404 }
      );
    }

    // Categorize ideas by vote count
    const urgentIdeas = ideas.filter(idea => (idea.vote_count || 0) < 5);
    const priorityIdeas = ideas.filter(idea => {
      const count = idea.vote_count || 0;
      return count >= 5 && count < 10;
    });
    const normalIdeas = ideas.filter(idea => (idea.vote_count || 0) >= 10);

    let idea1, idea2;

    // Determine selection strategy based on available tiers
    const shouldPrioritizeUrgent = urgentIdeas.length > 0 && Math.random() < 0.7;
    const shouldPrioritizePriority = !shouldPrioritizeUrgent && priorityIdeas.length > 0 && Math.random() < 0.45;

    if (shouldPrioritizeUrgent) {
      // Select an urgent idea (< 5 votes)
      idea1 = urgentIdeas[Math.floor(Math.random() * urgentIdeas.length)];
      idea2 = selectMiddlePercentileOpponent(ideas, idea1);
    } else if (shouldPrioritizePriority) {
      // Select a priority idea (5-9 votes)
      idea1 = priorityIdeas[Math.floor(Math.random() * priorityIdeas.length)];
      idea2 = selectMiddlePercentileOpponent(ideas, idea1);
    } else {
      // Normal random pairing
      const shuffled = [...ideas].sort(() => Math.random() - 0.5);
      idea1 = shuffled[0];
      idea2 = shuffled[1];
    }

    return NextResponse.json({
      idea1,
      idea2,
    });
  } catch (error) {
    console.error('Error getting idea pair:', error);
    return NextResponse.json(
      { error: 'Failed to get idea pair' },
      { status: 500 }
    );
  }
}

/**
 * Select an opponent from the middle percentile (40th-60th) for calibration
 */
function selectMiddlePercentileOpponent(allIdeas: any[], selectedIdea: any) {
  // Sort by ELO to find percentiles
  const sortedByElo = [...allIdeas].sort((a, b) => (b.elo_rating || 1500) - (a.elo_rating || 1500));

  // Calculate 40th-60th percentile indices
  const fortiethIndex = Math.floor(sortedByElo.length * 0.4);
  const sixtiethIndex = Math.ceil(sortedByElo.length * 0.6);

  // Get middle-range ideas (excluding the selected idea)
  const middleIdeas = sortedByElo
    .slice(fortiethIndex, sixtiethIndex)
    .filter(idea => idea.id !== selectedIdea.id);

  // If no middle ideas available (e.g., only 2 total ideas), pick any other idea
  if (middleIdeas.length === 0) {
    const others = allIdeas.filter(idea => idea.id !== selectedIdea.id);
    return others[Math.floor(Math.random() * others.length)];
  }

  // Random selection from middle range
  return middleIdeas[Math.floor(Math.random() * middleIdeas.length)];
}
