import { NextResponse } from 'next/server';
import { getDashboardStats } from '@/lib/db';

export async function GET() {
  try {
    const stats = getDashboardStats();
    return NextResponse.json({ stats });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
