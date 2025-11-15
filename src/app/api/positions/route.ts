import { NextRequest, NextResponse } from 'next/server';
import { getAllPositions, createPosition, getPositionsByTicker, getOpenPositions } from '@/lib/db-operations';
import type { PositionFormData } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');
    const status = searchParams.get('status');

    let positions;
    if (ticker) {
      positions = getPositionsByTicker(ticker);
    } else if (status === 'open') {
      positions = getOpenPositions();
    } else {
      positions = getAllPositions();
    }

    return NextResponse.json(positions);
  } catch (error) {
    console.error('Error fetching positions:', error);
    return NextResponse.json({ error: 'Failed to fetch positions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: PositionFormData = await request.json();

    // Validate required fields
    if (!data.ticker || !data.shares || !data.costBasis || !data.acquiredDate || !data.acquisitionType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Ensure shares are in lots of 100
    if (data.shares % 100 !== 0) {
      return NextResponse.json({ error: 'Shares must be in lots of 100' }, { status: 400 });
    }

    const position = createPosition(data);
    return NextResponse.json(position, { status: 201 });
  } catch (error) {
    console.error('Error creating position:', error);
    return NextResponse.json({ error: 'Failed to create position' }, { status: 500 });
  }
}
