'use server';

import { db } from '@/lib/db';
import { orders, warehouseIncome, expenses } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath, revalidateTag } from 'next/cache';

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
  
  await db.transaction(async (tx) => {
    // Update order
    await tx.update(orders).set({ paymentStatus }).where(eq(orders.id, orderId));

    // If transitioned to 'entered'
    if (paymentStatus === 'entered' && previousStatus !== 'entered') {
      // 1. Add to warehouse income
      await tx.insert(warehouseIncome).values({
        source: 'client_payment',
        amountRub: order.paymentAmount,
        note: `Оплата за заказ #${order.id}`,
      });

      // 2. Add referral fee to expenses if there's a percentage
      if (order.referralPercent && order.referralPercent > 0) {
        const feeAmount = (order.paymentAmount * order.referralPercent) / 100;
        await tx.insert(expenses).values({
          category: 'referral_fee',
          amountRub: Math.round(feeAmount),
          note: `Процент для 3-го лица (${order.referralName || 'Аноним'}) за заказ #${order.id}`,
        });
      }
    }
  });

  revalidateTag('warehouse');
  revalidateTag('expenses');
  revalidatePath(`/orders/${orderId}`);
  revalidatePath(`/orders`);
  revalidatePath(`/dashboard`);
  revalidatePath(`/finance`);
  revalidatePath(`/warehouse`);
}
