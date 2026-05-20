'use server';

import { db } from '@/lib/db';
import { 
  clients, 
  drivers, 
  orders, 
  fuelLogs, 
  expenses, 
  warehouseIncome 
} from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath, revalidateTag } from 'next/cache';

// Clients
export async function createClient(data: any) {
  await db.insert(clients).values({
    name: data.name,
    phone: data.phone,
    address: data.address,
  });
  revalidateTag('clients');
  revalidatePath('/clients');
}

export async function updateClient(id: number, data: any) {
  await db.update(clients).set({
    name: data.name,
    phone: data.phone,
    address: data.address,
  }).where(eq(clients.id, id));
  revalidateTag('clients');
  revalidatePath('/clients');
}

// Drivers
export async function createDriver(data: any) {
  await db.insert(drivers).values({
    name: data.name,
    phone: data.phone,
    vehiclePlate: data.vehiclePlate,
  });
  revalidateTag('drivers');
  revalidatePath('/drivers');
}

export async function updateDriver(id: number, data: any) {
  await db.update(drivers).set({
    name: data.name,
    phone: data.phone,
    vehiclePlate: data.vehiclePlate,
  }).where(eq(drivers.id, id));
  revalidateTag('drivers');
  revalidatePath('/drivers');
}

// Fuel
export async function createFuelLog(data: any) {
  await db.transaction(async (tx) => {
    await tx.insert(fuelLogs).values({
      driverId: parseInt(data.driverId),
      stationName: data.stationName,
      liters: parseInt(data.liters),
      priceRub: parseInt(data.priceRub),
      vehicle: data.vehicle,
    });

    await tx.insert(expenses).values({
      category: 'fuel',
      amountRub: parseInt(data.priceRub),
      note: `Автоматически добавлено из заправки: ${data.vehicle} (${data.liters}L) - ${data.stationName}`,
    });
  });

  revalidateTag('fuelLogs');
  revalidateTag('expenses');
  revalidatePath('/fuel');
  revalidatePath('/finance');
}

export async function updateFuelLog(id: number, data: any) {
  await db.update(fuelLogs).set({
    driverId: parseInt(data.driverId),
    stationName: data.stationName,
    liters: parseInt(data.liters),
    priceRub: parseInt(data.priceRub),
    vehicle: data.vehicle,
  }).where(eq(fuelLogs.id, id));
  revalidateTag('fuelLogs');
  revalidatePath('/fuel');
}

// Expenses
export async function createExpense(data: any) {
  await db.insert(expenses).values({
    category: data.category,
    amountRub: parseInt(data.amountRub),
    note: data.note,
  });
  revalidateTag('expenses');
  revalidatePath('/finance');
  revalidatePath('/warehouse');
}

export async function updateExpense(id: number, data: any) {
  await db.update(expenses).set({
    category: data.category,
    amountRub: parseInt(data.amountRub),
    note: data.note,
  }).where(eq(expenses.id, id));
  revalidateTag('expenses');
  revalidatePath('/finance');
  revalidatePath('/warehouse');
}

// Warehouse Income
export async function createWarehouseIncome(data: any) {
  await db.insert(warehouseIncome).values({
    source: data.source,
    amountRub: parseInt(data.amountRub),
    note: data.note,
  });
  revalidateTag('warehouse');
  revalidatePath('/warehouse');
  revalidatePath('/finance');
}

export async function updateWarehouseIncome(id: number, data: any) {
  await db.update(warehouseIncome).set({
    source: data.source,
    amountRub: parseInt(data.amountRub),
    note: data.note,
  }).where(eq(warehouseIncome.id, id));
  revalidateTag('warehouse');
  revalidatePath('/warehouse');
  revalidatePath('/finance');
}

// Orders
export async function createOrder(data: any) {
  const newPaymentStatus = data.paymentStatus || 'pending';
  const paymentAmount = parseInt(data.paymentAmount);

  await db.transaction(async (tx) => {
    const [newOrder] = await tx.insert(orders).values({
      clientId: parseInt(data.clientId),
      driverId: data.driverId ? parseInt(data.driverId) : null,
      operatorNote: data.operatorNote,
      address: data.address,
      scheduledAt: new Date(data.scheduledAt),
      containerSizeM3: parseInt(data.containerSizeM3),
      rentalDuration: data.rentalDuration,
      status: data.status || 'new',
      paymentAmount,
      paymentType: data.paymentType,
      paymentStatus: newPaymentStatus,
      referralName: data.referralName,
      referralPercent: data.referralPercent ? parseInt(data.referralPercent) : null,
    }).returning();

    // If created with 'entered' status directly
    if (newPaymentStatus === 'entered') {
      // 1. Add to warehouse income
      await tx.insert(warehouseIncome).values({
        source: 'client_payment',
        amountRub: paymentAmount,
        note: `Оплата за заказ #${newOrder.id}`,
      });

      // 2. Add referral fee to expenses if there's a percentage
      const referralPercent = data.referralPercent ? parseInt(data.referralPercent) : null;
      if (referralPercent && referralPercent > 0) {
        const feeAmount = (paymentAmount * referralPercent) / 100;
        await tx.insert(expenses).values({
          category: 'referral_fee',
          amountRub: Math.round(feeAmount),
          note: `Процент для 3-го лица (${data.referralName || 'Аноним'}) за заказ #${newOrder.id}`,
        });
      }
    }
  });

  revalidateTag('orders');
  revalidateTag('warehouse');
  revalidateTag('expenses');
  revalidatePath('/orders');
  revalidatePath('/dashboard');
  revalidatePath('/finance');
  revalidatePath('/warehouse');
}

export async function updateOrder(id: number, data: any) {
  // get order first
  const [order] = await db.select().from(orders).where(eq(orders.id, id));
  
  if (!order) return;

  const previousStatus = order.paymentStatus;
  const newPaymentStatus = data.paymentStatus;

  await db.transaction(async (tx) => {
    await tx.update(orders).set({
      clientId: parseInt(data.clientId),
      driverId: data.driverId ? parseInt(data.driverId) : null,
      operatorNote: data.operatorNote,
      address: data.address,
      scheduledAt: new Date(data.scheduledAt),
      containerSizeM3: parseInt(data.containerSizeM3),
      rentalDuration: data.rentalDuration,
      status: data.status,
      paymentAmount: parseInt(data.paymentAmount),
      paymentType: data.paymentType,
      paymentStatus: data.paymentStatus,
      referralName: data.referralName,
      referralPercent: data.referralPercent ? parseInt(data.referralPercent) : null,
    }).where(eq(orders.id, id));

    // If transitioned to 'entered'
    if (newPaymentStatus === 'entered' && previousStatus !== 'entered') {
      const paymentAmount = parseInt(data.paymentAmount);
      
      // 1. Add to warehouse income
      await tx.insert(warehouseIncome).values({
        source: 'client_payment',
        amountRub: paymentAmount,
        note: `Оплата за заказ #${id}`,
      });

      // 2. Add referral fee to expenses if there's a percentage
      const referralPercent = data.referralPercent ? parseInt(data.referralPercent) : null;
      if (referralPercent && referralPercent > 0) {
        const feeAmount = (paymentAmount * referralPercent) / 100;
        await tx.insert(expenses).values({
          category: 'referral_fee',
          amountRub: Math.round(feeAmount),
          note: `Процент для 3-го лица (${data.referralName || 'Аноним'}) за заказ #${id}`,
        });
      }
    }
  });

  revalidateTag('orders');
  revalidateTag('warehouse');
  revalidateTag('expenses');
  revalidatePath('/orders');
  revalidatePath(`/orders/${id}`);
  revalidatePath('/dashboard');
  revalidatePath('/finance');
  revalidatePath('/warehouse');
}
