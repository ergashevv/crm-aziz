'use server';

import { db } from '@/lib/db';
import { 
  clients, 
  drivers, 
  orders, 
  fuelLogs, 
  expenses, 
  warehouseIncome,
  dispatchers
} from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath, revalidateTag } from 'next/cache';

// Clients
export async function createClient(data: any) {
  await db.insert(clients).values({
    name: data.name,
    phone: data.phone,
    address: data.address,
    mapUrl: data.mapUrl || null,
  });
  revalidateTag('clients');
  revalidatePath('/clients');
}

export async function updateClient(id: number, data: any) {
  await db.update(clients).set({
    name: data.name,
    phone: data.phone,
    address: data.address,
    mapUrl: data.mapUrl || null,
  }).where(eq(clients.id, id));
  revalidateTag('clients');
  revalidatePath('/clients');
}

// Dispatchers
export async function createDispatcher(data: any) {
  const [row] = await db.insert(dispatchers).values({
    name: data.name,
    phone: data.phone,
  }).returning();
  revalidateTag('dispatchers');
  return row;
}

export async function updateDispatcher(id: number, data: any) {
  await db.update(dispatchers).set({
    name: data.name,
    phone: data.phone,
  }).where(eq(dispatchers.id, id));
  revalidateTag('dispatchers');
}

// Drivers
export async function createDriver(data: any) {
  await db.insert(drivers).values({
    name: data.name,
    phone: data.phone,
    vehiclePlate: data.vehiclePlate,
    username: data.username || null,
    password: data.password || null,
  });
  revalidateTag('drivers');
  revalidatePath('/drivers');
}

export async function updateDriver(id: number, data: any) {
  await db.update(drivers).set({
    name: data.name,
    phone: data.phone,
    vehiclePlate: data.vehiclePlate,
    username: data.username || null,
    password: data.password || null,
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
    const containerSizeM3 = parseInt(data.containerSizeM3);
    const paymentAmount = parseInt(data.paymentAmount);
    const clientCategory = data.clientCategory || 'direct';

    // --- Resolve clientId (upsert inline if needed) ---
    let clientId: number;
    if (data.clientId === 'new' || !data.clientId) {
      if (!data.clientName || !data.clientPhone) {
        return { success: false, error: "Пожалуйста, укажите имя и телефон клиента" };
      }
      const [newClient] = await db.insert(clients).values({
        name: data.clientName,
        phone: data.clientPhone,
        address: data.clientAddress || data.address,
        mapUrl: data.clientMapUrl || null,
      }).returning();
      clientId = newClient.id;
      revalidateTag('clients');
    } else {
      clientId = parseInt(data.clientId);
      // Update client if inline fields changed
      if (data.clientName || data.clientPhone) {
        await db.update(clients).set({
          name: data.clientName,
          phone: data.clientPhone,
          address: data.clientAddress || data.address,
          mapUrl: data.clientMapUrl || null,
        }).where(eq(clients.id, clientId));
        revalidateTag('clients');
      }
    }

    // --- Resolve dispatcherId (upsert inline if needed) ---
    let dispatcherId: number | null = null;
    if (clientCategory === 'dispatcher') {
      if (data.dispatcherId === 'new' || !data.dispatcherId) {
        if (!data.dispatcherName || !data.dispatcherPhone) {
          return { success: false, error: "Пожалуйста, укажите имя и телефон диспетчера" };
        }
        const [newDisp] = await db.insert(dispatchers).values({
          name: data.dispatcherName,
          phone: data.dispatcherPhone,
        }).returning();
        dispatcherId = newDisp.id;
        revalidateTag('dispatchers');
      } else {
        dispatcherId = parseInt(data.dispatcherId);
        // Update dispatcher if inline fields changed
        if (data.dispatcherName || data.dispatcherPhone) {
          await db.update(dispatchers).set({
            name: data.dispatcherName,
            phone: data.dispatcherPhone,
          }).where(eq(dispatchers.id, dispatcherId));
          revalidateTag('dispatchers');
        }
      }
    }

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
    const dispatcherFee = data.dispatcherFee ? parseInt(data.dispatcherFee) : null;

    const [newOrder] = await db.insert(orders).values({
      clientId,
      driverId: data.driverId ? parseInt(data.driverId) : null,
      operatorNote: data.operatorNote,
      address: data.address,
      mapUrl: data.mapUrl || null,
      scheduledAt: parseDate(data.scheduledAt),
      containerSizeM3,
      containerNumber: data.containerNumber || null,
      rentalDuration: data.rentalDuration,
      status: data.status || 'new',
      paymentAmount,
      paymentType: data.paymentType,
      paymentStatus: newPaymentStatus,
      clientCategory,
      dispatcherId,
      dispatcherFee,
      referralName: data.referralName,
      referralPercent: data.referralPercent ? parseInt(data.referralPercent) : null,
    }).returning();

    // If created with 'entered' status directly
    if (newPaymentStatus === 'entered') {
      await db.insert(warehouseIncome).values({
        source: 'client_payment',
        amountRub: paymentAmount,
        note: `Оплата за заказ #${newOrder.id}`,
      });

      // Dispatcher fee as expense
      if (dispatcherFee && dispatcherFee > 0) {
        await db.insert(expenses).values({
          category: 'dispatcher_salary',
          amountRub: dispatcherFee,
          note: `Услуга диспетчера за заказ #${newOrder.id}`,
        });
      }

      // Referral fee
      const referralPercent = data.referralPercent ? parseInt(data.referralPercent) : null;
      if (referralPercent && referralPercent > 0) {
        const feeAmount = (paymentAmount * referralPercent) / 100;
        await db.insert(expenses).values({
          category: 'referral_fee',
          amountRub: Math.round(feeAmount),
          note: `Процент для 3-го лица (${data.referralName || 'Аноним'}) за заказ #${newOrder.id}`,
        });
      }
    }

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
    const containerSizeM3 = parseInt(data.containerSizeM3);
    const paymentAmount = parseInt(data.paymentAmount);
    const clientCategory = data.clientCategory || 'direct';

    // --- Resolve clientId (upsert inline if needed) ---
    let clientId: number;
    if (data.clientId === 'new' || !data.clientId) {
      if (!data.clientName || !data.clientPhone) {
        return { success: false, error: "Пожалуйста, укажите имя и телефон клиента" };
      }
      const [newClient] = await db.insert(clients).values({
        name: data.clientName,
        phone: data.clientPhone,
        address: data.clientAddress || data.address,
        mapUrl: data.clientMapUrl || null,
      }).returning();
      clientId = newClient.id;
      revalidateTag('clients');
    } else {
      clientId = parseInt(data.clientId);
      if (data.clientName || data.clientPhone) {
        await db.update(clients).set({
          name: data.clientName,
          phone: data.clientPhone,
          address: data.clientAddress || data.address,
          mapUrl: data.clientMapUrl || null,
        }).where(eq(clients.id, clientId));
        revalidateTag('clients');
      }
    }

    // --- Resolve dispatcherId ---
    let dispatcherId: number | null = null;
    if (clientCategory === 'dispatcher') {
      if (data.dispatcherId === 'new' || !data.dispatcherId) {
        if (data.dispatcherName && data.dispatcherPhone) {
          const [newDisp] = await db.insert(dispatchers).values({
            name: data.dispatcherName,
            phone: data.dispatcherPhone,
          }).returning();
          dispatcherId = newDisp.id;
          revalidateTag('dispatchers');
        }
      } else {
        dispatcherId = parseInt(data.dispatcherId);
        if (data.dispatcherName || data.dispatcherPhone) {
          await db.update(dispatchers).set({
            name: data.dispatcherName,
            phone: data.dispatcherPhone,
          }).where(eq(dispatchers.id, dispatcherId));
          revalidateTag('dispatchers');
        }
      }
    }

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

    const previousPaymentStatus = order.paymentStatus;
    const newPaymentStatus = data.paymentStatus;
    const dispatcherFee = data.dispatcherFee ? parseInt(data.dispatcherFee) : null;

    await db.update(orders).set({
      clientId,
      driverId: data.driverId ? parseInt(data.driverId) : null,
      operatorNote: data.operatorNote,
      address: data.address,
      mapUrl: data.mapUrl || null,
      scheduledAt: parseDate(data.scheduledAt),
      containerSizeM3,
      containerNumber: data.containerNumber || null,
      rentalDuration: data.rentalDuration,
      status: data.status,
      paymentAmount,
      paymentType: data.paymentType,
      paymentStatus: data.paymentStatus,
      clientCategory,
      dispatcherId,
      dispatcherFee,
      referralName: data.referralName,
      referralPercent: data.referralPercent ? parseInt(data.referralPercent) : null,
    }).where(eq(orders.id, id));

    // If transitioned to 'entered'
    if (newPaymentStatus === 'entered' && previousPaymentStatus !== 'entered') {
      await db.insert(warehouseIncome).values({
        source: 'client_payment',
        amountRub: paymentAmount,
        note: `Оплата за заказ #${id}`,
      });

      // Dispatcher fee as expense
      if (dispatcherFee && dispatcherFee > 0) {
        await db.insert(expenses).values({
          category: 'dispatcher_salary',
          amountRub: dispatcherFee,
          note: `Услуга диспетчера за заказ #${id}`,
        });
      }

      // Referral fee
      const referralPercent = data.referralPercent ? parseInt(data.referralPercent) : null;
      if (referralPercent && referralPercent > 0) {
        const feeAmount = (paymentAmount * referralPercent) / 100;
        await db.insert(expenses).values({
          category: 'referral_fee',
          amountRub: Math.round(feeAmount),
          note: `Процент для 3-го лица (${data.referralName || 'Аноним'}) за заказ #${id}`,
        });
      }
    }

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
