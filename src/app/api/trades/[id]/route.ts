import { NextRequest, NextResponse } from 'next/server';
import { getTrade, updateTrade, deleteTrade, closeTrade, assignTrade } from '@/lib/db-operations';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const trade = getTrade(id);

    if (!trade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
    }

    return NextResponse.json(trade);
  } catch (error) {
    console.error('Error fetching trade:', error);
    return NextResponse.json({ error: 'Failed to fetch trade' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    const trade = getTrade(id);
    if (!trade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
    }

    // Handle special actions
    if (data.action === 'close' && data.closePremium !== undefined) {
      const updated = closeTrade(id, data.closePremium);
      return NextResponse.json(updated);
    }

    if (data.action === 'assign' && data.positionId) {
      const updated = assignTrade(id, data.positionId);
      return NextResponse.json(updated);
    }

    // Regular update
    const updated = updateTrade(id, data);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating trade:', error);
    return NextResponse.json({ error: 'Failed to update trade' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const trade = getTrade(id);

    if (!trade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
    }

    deleteTrade(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting trade:', error);
    return NextResponse.json({ error: 'Failed to delete trade' }, { status: 500 });
  }
}
