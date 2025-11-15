import { NextRequest, NextResponse } from 'next/server';
import { getPortfolioMetrics, getTickerMetrics, getAllTickers, getEnhancedPortfolioMetrics } from '@/lib/db-operations';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');
    const type = searchParams.get('type');

    if (type === 'tickers') {
      const tickers = getAllTickers();
      return NextResponse.json(tickers);
    }

    if (ticker) {
      const metrics = getTickerMetrics(ticker);
      return NextResponse.json(metrics);
    }

    if (type === 'enhanced') {
      const metrics = getEnhancedPortfolioMetrics();
      return NextResponse.json(metrics);
    }

    const metrics = getPortfolioMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
