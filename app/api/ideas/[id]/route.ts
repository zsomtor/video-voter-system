import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/ideas/[id]
 * Returns a single idea
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ideaId = parseInt(params.id);

    const result = await sql`
      SELECT * FROM ideas
      WHERE id = ${ideaId}
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Idea not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      idea: result.rows[0],
    });
  } catch (error) {
    console.error('Error fetching idea:', error);
    return NextResponse.json(
      { error: 'Failed to fetch idea' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/ideas/[id]
 * Updates an idea
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ideaId = parseInt(params.id);
    const { title, thumbnailText, description } = await request.json();

    if (!title || !thumbnailText) {
      return NextResponse.json(
        { error: 'Title and thumbnail text are required' },
        { status: 400 }
      );
    }

    const result = await sql`
      UPDATE ideas
      SET
        title = ${title},
        thumbnail_text = ${thumbnailText},
        description = ${description || null}
      WHERE id = ${ideaId}
      RETURNING *
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Idea not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      idea: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating idea:', error);
    return NextResponse.json(
      { error: 'Failed to update idea' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ideas/[id]
 * Deletes an idea and all its votes
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ideaId = parseInt(params.id);

    // Start transaction
    await sql`BEGIN`;

    try {
      // Delete all votes involving this idea
      await sql`
        DELETE FROM idea_votes
        WHERE winner_id = ${ideaId} OR loser_id = ${ideaId}
      `;

      // Delete the idea
      const result = await sql`
        DELETE FROM ideas
        WHERE id = ${ideaId}
        RETURNING *
      `;

      if (result.rows.length === 0) {
        await sql`ROLLBACK`;
        return NextResponse.json(
          { error: 'Idea not found' },
          { status: 404 }
        );
      }

      await sql`COMMIT`;

      return NextResponse.json({
        success: true,
        message: 'Idea deleted successfully',
      });
    } catch (error) {
      await sql`ROLLBACK`;
      throw error;
    }
  } catch (error) {
    console.error('Error deleting idea:', error);
    return NextResponse.json(
      { error: 'Failed to delete idea' },
      { status: 500 }
    );
  }
}
