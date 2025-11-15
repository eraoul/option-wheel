import { NextRequest, NextResponse } from 'next/server';
import { upsertCurrentPrice, getCurrentPrice, getAllCurrentPrices } from '@/lib/db-operations';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');

    if (ticker) {
      const price = getCurrentPrice(ticker);
      return NextResponse.json(price);
    }

    const prices = getAllCurrentPrices();
    return NextResponse.json(prices);
  } catch (error) {
    console.error('Error fetching prices:', error);
    return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    if (!data.ticker) {
      return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
    }

    upsertCurrentPrice(data.ticker, data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating price:', error);
    return NextResponse.json({ error: 'Failed to update price' }, { status: 500 });
  }
}

// Batch update endpoint
export async function PUT(request: NextRequest) {
  try {
    const { prices } = await request.json();

    if (!Array.isArray(prices)) {
      return NextResponse.json({ error: 'Prices must be an array' }, { status: 400 });
    }

    for (const priceData of prices) {
      if (priceData.ticker) {
        upsertCurrentPrice(priceData.ticker, priceData);
      }
    }

    return NextResponse.json({ success: true, count: prices.length });
  } catch (error) {
    console.error('Error batch updating prices:', error);
    return NextResponse.json({ error: 'Failed to batch update prices' }, { status: 500 });
  }
}
