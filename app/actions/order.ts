'use server';

import { db } from '@/lib/db';
import { orders, warehouseIncome, expenses } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath, revalidateTag } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';

export async function updateOrderStatus(orderId: number, status: any) {
  await db.update(orders).set({ status }).where(eq(orders.id, orderId));
  revalidatePath(`/orders/${orderId}`);
  revalidatePath(`/orders`);
  revalidatePath(`/dashboard`);
}

export async function updateOrderPayment(orderId: number, paymentStatus: any) {
  // get order first
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  
  if (!order) return;

  const previousStatus = order.paymentStatus;
  
  // Update order
  const updateData: any = { paymentStatus };
  
  if (paymentStatus === 'entered' && previousStatus !== 'entered') {
    const user = await getCurrentUser();
    if (user && user.role === 'operator') {
      updateData.operatorId = user.id;
    } else if (user) {
      updateData.operatorId = user.id; // Or leave null if admin? Let's assign it anyway
    }
    updateData.isClosed = true;
  }

  await db.update(orders).set(updateData).where(eq(orders.id, orderId));

  // If transitioned to 'entered'
  if (paymentStatus === 'entered' && previousStatus !== 'entered') {
    const user = await getCurrentUser();
    // 1. Add to warehouse income
    await db.insert(warehouseIncome).values({
      source: 'client_payment',
      amountRub: order.paymentAmount,
      note: `Оплата за заказ #${order.id}`,
      operatorId: user ? user.id : undefined,
    });

    // 2. Add referral fee to expenses if there's a percentage
    if (order.referralPercent && order.referralPercent > 0) {
      const feeAmount = (order.paymentAmount * order.referralPercent) / 100;
      await db.insert(expenses).values({
        category: 'referral_fee',
        amountRub: Math.round(feeAmount),
        note: `Процент для 3-го лица (${order.referralName || 'Аноним'}) за заказ #${order.id}`,
        operatorId: user ? user.id : undefined,
      });
    }
  }

  revalidateTag('warehouse');
  revalidateTag('expenses');
  revalidatePath(`/orders/${orderId}`);
  revalidatePath(`/orders`);
  revalidatePath(`/dashboard`);
  revalidatePath(`/finance`);
  revalidatePath(`/warehouse`);
}
