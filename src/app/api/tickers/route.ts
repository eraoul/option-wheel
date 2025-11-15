import { NextResponse } from 'next/server';
import { getAllTickers } from '@/lib/db-operations';

export async function GET() {
  try {
    const tickers = getAllTickers();
    return NextResponse.json({ tickers });
  } catch (error) {
    console.error('Error fetching tickers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickers' },
      { status: 500 }
    );
  }
}
