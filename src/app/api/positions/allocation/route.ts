import { NextResponse } from 'next/server';
import { getCoveredCallAllocation, getAllTickers } from '@/lib/db-operations';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');

    if (ticker) {
      // Get allocation for specific ticker
      const allocation = getCoveredCallAllocation(ticker.toUpperCase());
      return NextResponse.json(allocation);
    } else {
      // Get allocation for all tickers with positions
      const tickers = getAllTickers();
      const allocations: Record<string, any> = {};

      tickers.forEach(t => {
        allocations[t] = getCoveredCallAllocation(t);
      });

      return NextResponse.json(allocations);
    }
  } catch (error) {
    console.error('Error fetching covered call allocation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch allocation data' },
      { status: 500 }
    );
  }
}
