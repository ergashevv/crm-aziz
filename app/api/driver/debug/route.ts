import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders } from '@/lib/schema';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const recentOrders = await db
      .select({
        id: orders.id,
        driverId: orders.driverId,
        scheduledAt: orders.scheduledAt,
        address: orders.address
      })
      .from(orders)
      .orderBy(desc(orders.id))
      .limit(10);

    return NextResponse.json({
      dbUrlExists: !!process.env.DATABASE_URL,
      dbUrlLength: process.env.DATABASE_URL?.length || 0,
      dbUrlStart: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) : '',
      recentOrders
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
