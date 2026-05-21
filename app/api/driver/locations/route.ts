import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { drivers, orders } from '@/lib/schema';
import { eq, ne } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get all drivers
    const allDrivers = await db
      .select({
        id: drivers.id,
        name: drivers.name,
        phone: drivers.phone,
        vehiclePlate: drivers.vehiclePlate,
        latitude: drivers.latitude,
        longitude: drivers.longitude,
        locationUpdatedAt: drivers.locationUpdatedAt,
      })
      .from(drivers);

    // Get active orders (not completed) to check which drivers are in_progress
    const activeOrders = await db
      .select({
        id: orders.id,
        driverId: orders.driverId,
        status: orders.status,
        address: orders.address,
      })
      .from(orders)
      .where(ne(orders.status, 'completed'));

    // Map active orders to drivers
    const driversWithOrders = allDrivers.map(d => {
      const driverOrders = activeOrders.filter(o => o.driverId === d.id);
      const inProgressOrder = driverOrders.find(o => o.status === 'in_progress');
      
      return {
        ...d,
        activeOrders: driverOrders,
        isTracking: !!inProgressOrder,
        currentOrderAddress: inProgressOrder?.address || null,
      };
    });

    return NextResponse.json(driversWithOrders);
  } catch (error) {
    console.error('Error fetching driver locations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
