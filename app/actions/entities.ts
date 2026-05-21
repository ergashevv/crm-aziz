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

function parseDate(dateStr: any): Date {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;
  
  // Try dd/mm/yyyy
  const parts = String(dateStr).split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }

  // Try dd.mm.yyyy
  const dotParts = String(dateStr).split('.');
  if (dotParts.length === 3) {
    const day = parseInt(dotParts[0], 10);
    const month = parseInt(dotParts[1], 10) - 1;
    const year = parseInt(dotParts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }

  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

// Orders
export async function createOrder(data: any) {
  try {
    const clientId = parseInt(data.clientId);
    const containerSizeM3 = parseInt(data.containerSizeM3);
    const paymentAmount = parseInt(data.paymentAmount);

    if (isNaN(clientId)) {
      return { success: false, error: "Пожалуйста, выберите клиента / Iltimos, mijozni tanlang" };
    }
    if (!data.address || data.address.trim() === '') {
      return { success: false, error: "Пожалуйста, укажите адрес / Iltimos, manzilni kiriting" };
    }
    if (isNaN(containerSizeM3)) {
      return { success: false, error: "Пожалуйста, укажите корректный размер контейнера / Iltimos, to'g'ri konteyner hajmini kiriting" };
    }
    if (isNaN(paymentAmount)) {
      return { success: false, error: "Пожалуйста, укажите корректную сумму оплаты / Iltimos, to'g'ri to'lov summasini kiriting" };
    }

    const newPaymentStatus = data.paymentStatus || 'pending';

    await db.transaction(async (tx) => {
      const [newOrder] = await tx.insert(orders).values({
        clientId,
        driverId: data.driverId ? parseInt(data.driverId) : null,
        operatorNote: data.operatorNote,
        address: data.address,
        scheduledAt: parseDate(data.scheduledAt),
        containerSizeM3,
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

    return { success: true };
  } catch (error: any) {
    console.error("Error creating order:", error);
    return { success: false, error: error.message || "Unknown database error occurred" };
  }
}

export async function updateOrder(id: number, data: any) {
  try {
    const clientId = parseInt(data.clientId);
    const containerSizeM3 = parseInt(data.containerSizeM3);
    const paymentAmount = parseInt(data.paymentAmount);

    if (isNaN(clientId)) {
      return { success: false, error: "Пожалуйста, выберите клиента / Iltimos, mijozni tanlang" };
    }
    if (!data.address || data.address.trim() === '') {
      return { success: false, error: "Пожалуйста, укажите адрес / Iltimos, manzilni kiriting" };
    }
    if (isNaN(containerSizeM3)) {
      return { success: false, error: "Пожалуйста, укажите корректный размер контейнера / Iltimos, to'g'ri konteyner hajmini kiriting" };
    }
    if (isNaN(paymentAmount)) {
      return { success: false, error: "Пожалуйста, укажите корректную сумму оплаты / Iltimos, to'g'ri to'lov summasini kiriting" };
    }

    // get order first
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    
    if (!order) {
      return { success: false, error: "Заказ не найден / Buyurtma topilmadi" };
    }

    const previousStatus = order.paymentStatus;
    const newPaymentStatus = data.paymentStatus;

    await db.transaction(async (tx) => {
      await tx.update(orders).set({
        clientId,
        driverId: data.driverId ? parseInt(data.driverId) : null,
        operatorNote: data.operatorNote,
        address: data.address,
        scheduledAt: parseDate(data.scheduledAt),
        containerSizeM3,
        rentalDuration: data.rentalDuration,
        status: data.status,
        paymentAmount,
        paymentType: data.paymentType,
        paymentStatus: data.paymentStatus,
        referralName: data.referralName,
        referralPercent: data.referralPercent ? parseInt(data.referralPercent) : null,
      }).where(eq(orders.id, id));

      // If transitioned to 'entered'
      if (newPaymentStatus === 'entered' && previousStatus !== 'entered') {
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

    return { success: true };
  } catch (error: any) {
    console.error("Error updating order:", error);
    return { success: false, error: error.message || "Unknown database error occurred" };
  }
}
