import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { db } from '@/lib/db';
import { orders } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = parseInt(params.id);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid Order ID' }, { status: 400 });
    }

    const body = await request.json();
    const { status, paymentType, paymentStatus } = body;

    // Build update object based on what is provided
    const updateData: any = {};
    if (status) updateData.status = status;
    if (paymentType) updateData.paymentType = paymentType;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    
    updateData.updatedAt = new Date();

    if (Object.keys(updateData).length === 1 && updateData.updatedAt) {
      return NextResponse.json({ error: 'No fields provided for update' }, { status: 400 });
    }

    const updated = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, orderId))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    revalidateTag('orders');
    revalidatePath('/dashboard');
    revalidatePath('/orders');
    revalidatePath(`/orders/${orderId}`);

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating driver order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
