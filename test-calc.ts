import { db } from './lib/db';
import { expenses, orders, fuelLogs, warehouseIncome } from './lib/schema';
import { desc } from 'drizzle-orm';

async function run() {
  const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
  const allExpenses = await db.select().from(expenses).orderBy(desc(expenses.recordedAt));
  const allWarehouseIncome = await db.select().from(warehouseIncome);

  console.log('Total expenses:', allExpenses.length);
  
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const fromParam = "2026-05-22";
  const toParam = "2026-05-22";

  function parseLocal(dateStr: string) {
    const [y, m, d] = dateStr.split('-');
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d), 0, 0, 0, 0);
  }

  const currentFrom = parseLocal(fromParam);
  const currentTo = parseLocal(toParam);
  currentTo.setHours(23, 59, 59, 999);

  console.log('currentFrom:', currentFrom.toString());
  console.log('currentTo:', currentTo.toString());

  for (const o of allOrders) {
    const oDate = new Date(o.createdAt);
    if (isCurrent(oDate)) {
      console.log('Order today:', o.paymentAmount, o.status, o.paymentStatus);
    }
  }
}

run().catch(console.error);
