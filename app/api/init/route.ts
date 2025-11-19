import { NextRequest, NextResponse } from 'next/server';
import { initDatabase } from '@/lib/db';

/**
 * GET /api/init?secret=YOUR_SECRET
 * Initializes the database tables
 * WARNING: This will drop all existing data!
 * PROTECTED: Requires secret parameter to prevent accidental deletion
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // Require secret parameter to prevent accidental database wipe
    const INIT_SECRET = process.env.INIT_SECRET || 'bazu-init-2024';

    if (secret !== INIT_SECRET) {
      return NextResponse.json(
        {
          error: 'Tilos! Védelmi kulcs szükséges az adatbázis törléséhez.',
          hint: 'Használat: /api/init?secret=TITKOS_KULCS'
        },
        { status: 401 }
      );
    }

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
