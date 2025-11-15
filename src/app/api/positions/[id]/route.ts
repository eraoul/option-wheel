import { NextRequest, NextResponse } from 'next/server';
import { getPosition, updatePosition, deletePosition, sellPosition } from '@/lib/db-operations';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const position = getPosition(id);

    if (!position) {
      return NextResponse.json({ error: 'Position not found' }, { status: 404 });
    }

    return NextResponse.json(position);
  } catch (error) {
    console.error('Error fetching position:', error);
    return NextResponse.json({ error: 'Failed to fetch position' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    const position = getPosition(id);
    if (!position) {
      return NextResponse.json({ error: 'Position not found' }, { status: 404 });
    }

    // Handle special action: sell position
    if (data.action === 'sell' && data.soldPrice !== undefined) {
      const updated = sellPosition(id, data.soldPrice, data.soldDate);
      return NextResponse.json(updated);
    }

    // Regular update
    const updated = updatePosition(id, data);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating position:', error);
    return NextResponse.json({ error: 'Failed to update position' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const position = getPosition(id);

    if (!position) {
      return NextResponse.json({ error: 'Position not found' }, { status: 404 });
    }

    deletePosition(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting position:', error);
    return NextResponse.json({ error: 'Failed to delete position' }, { status: 500 });
  }
}
