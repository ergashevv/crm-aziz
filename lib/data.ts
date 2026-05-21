import { db } from './db';
import { orders, clients, drivers, fuelLogs, expenses, warehouseIncome, dispatchers } from './schema';
import { unstable_cache } from 'next/cache';
import { desc, eq, and, or, ilike, ne } from 'drizzle-orm';

export const getDashboardData = unstable_cache(
  async () => {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  },
  ['dashboard-orders'],
  { revalidate: 30, tags: ['orders'] }
);

export const getOrders = unstable_cache(
  async (status?: string, q?: string) => {
    let conditions = [];
    
    if (status === 'active') {
      conditions.push(ne(orders.status, 'completed'));
    } else if (status && status !== 'all') {
      conditions.push(eq(orders.status, status as any));
    }
    
    if (q) {
      const num = parseInt(q);
      if (!isNaN(num)) {
        conditions.push(or(
          ilike(clients.name, `%${q}%`),
          ilike(orders.address, `%${q}%`),
          ilike(drivers.name, `%${q}%`),
          eq(orders.id, num),
          eq(orders.paymentAmount, num)
        ));
      } else {
        conditions.push(or(
          ilike(clients.name, `%${q}%`),
          ilike(orders.address, `%${q}%`),
          ilike(drivers.name, `%${q}%`)
        ));
      }
    }

    const query = db.select({
      order: orders,
      client: clients,
      driver: drivers,
      dispatcher: dispatchers,
    })
    .from(orders)
    .leftJoin(clients, eq(orders.clientId, clients.id))
    .leftJoin(drivers, eq(orders.driverId, drivers.id))
    .leftJoin(dispatchers, eq(orders.dispatcherId, dispatchers.id));

    return await (conditions.length > 0 
      ? query.where(and(...conditions)).orderBy(desc(orders.createdAt))
      : query.orderBy(desc(orders.createdAt)));
  },
  ['orders-list'],
  { revalidate: 30, tags: ['orders'] }
);

export const getClients = unstable_cache(
  async () => {
    return await db.select().from(clients).orderBy(desc(clients.createdAt));
  },
  ['clients-list'],
  { revalidate: 30, tags: ['clients'] }
);

export const getDispatchers = unstable_cache(
  async () => {
    return await db.select().from(dispatchers).orderBy(desc(dispatchers.createdAt));
  },
  ['dispatchers-list'],
  { revalidate: 30, tags: ['dispatchers'] }
);

export const getDrivers = unstable_cache(
  async () => {
    return await db.select().from(drivers).orderBy(desc(drivers.createdAt));
  },
  ['drivers-list'],
  { revalidate: 30, tags: ['drivers'] }
);

export const getFinanceData = unstable_cache(
  async () => {
    const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
    const allExpenses = await db.select().from(expenses).orderBy(desc(expenses.recordedAt));
    const allWarehouseIncome = await db.select().from(warehouseIncome);
    return { allOrders, allExpenses, allWarehouseIncome };
  },
  ['finance-data'],
  { revalidate: 30, tags: ['orders', 'expenses', 'warehouse'] }
);

export const getFuelLogs = unstable_cache(
  async () => {
    return await db.select({
      log: fuelLogs,
      driver: drivers,
    })
    .from(fuelLogs)
    .leftJoin(drivers, eq(fuelLogs.driverId, drivers.id))
    .orderBy(desc(fuelLogs.loggedAt));
  },
  ['fuel-logs'],
  { revalidate: 30, tags: ['fuelLogs'] }
);

export const getWarehouseData = unstable_cache(
  async () => {
    const allIncomes = await db.select().from(warehouseIncome).orderBy(desc(warehouseIncome.recordedAt));
    const allExpenses = await db.select().from(expenses).orderBy(desc(expenses.recordedAt));
    return { allIncomes, allExpenses };
  },
  ['warehouse-data'],
  { revalidate: 30, tags: ['warehouse', 'expenses'] }
);
