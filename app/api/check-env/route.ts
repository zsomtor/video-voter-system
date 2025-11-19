import { NextResponse } from 'next/server';

/**
 * GET /api/check-env
 * Check database connection details
 */
export async function GET() {
  try {
    const envVars = {
      POSTGRES_URL: process.env.POSTGRES_URL ?
        `${process.env.POSTGRES_URL.substring(0, 30)}...` : 'NOT SET',
      POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ?
        `${process.env.POSTGRES_PRISMA_URL.substring(0, 30)}...` : 'NOT SET',
      POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING ?
        `${process.env.POSTGRES_URL_NON_POOLING.substring(0, 30)}...` : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
    };

    return NextResponse.json({
      success: true,
      environment: envVars,
    });
  } catch (error) {
    console.error('Error checking environment:', error);
    return NextResponse.json(
      {
        error: 'Failed to check environment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
