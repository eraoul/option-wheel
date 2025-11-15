import { NextRequest, NextResponse } from 'next/server';
import { getAccountSettings, updateAccountSettings } from '@/lib/db-operations';

export async function GET() {
  try {
    const settings = getAccountSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching account settings:', error);
    return NextResponse.json({ error: 'Failed to fetch account settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { totalCapital, cashAvailable } = await request.json();

    if (typeof totalCapital !== 'number' || typeof cashAvailable !== 'number') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const settings = updateAccountSettings(totalCapital, cashAvailable);
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating account settings:', error);
    return NextResponse.json({ error: 'Failed to update account settings' }, { status: 500 });
  }
}
