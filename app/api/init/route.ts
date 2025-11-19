import { NextResponse } from 'next/server';
import { initDatabase } from '@/lib/db';

/**
 * GET /api/init
 * Initializes the database tables
 * Only needs to be run once
 */
export async function GET() {
  try {
    await initDatabase();

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
    });
  } catch (error) {
    console.error('Error initializing database:', error);
    return NextResponse.json(
      { error: 'Failed to initialize database', details: String(error) },
      { status: 500 }
    );
  }
}
