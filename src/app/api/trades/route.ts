import { NextRequest, NextResponse } from 'next/server';
import { getAllTrades, createTrade, getTradesByTicker } from '@/lib/db-operations';
import type { TradeFormData } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');

    const trades = ticker ? getTradesByTicker(ticker) : getAllTrades();
    return NextResponse.json(trades);
  } catch (error) {
    console.error('Error fetching trades:', error);
    return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: TradeFormData = await request.json();

    // Validate required fields
    if (!data.ticker || !data.type || !data.strike || !data.expiration || !data.premium || !data.quantity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const trade = createTrade(data);
    return NextResponse.json(trade, { status: 201 });
  } catch (error) {
    console.error('Error creating trade:', error);
    return NextResponse.json({ error: 'Failed to create trade' }, { status: 500 });
  }
}
