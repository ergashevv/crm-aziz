import { db } from './lib/db';
import { users, orders, expenses, warehouseIncome } from './lib/schema';
import { isNull, eq } from 'drizzle-orm';

async function main() {
  console.log("Checking for old data...");
  
  // Find the admin user
  const adminUsers = await db.select().from(users).where(eq(users.role, 'admin'));
  if (adminUsers.length === 0) {
    console.log("No admin user found. Cannot assign old data.");
    process.exit(1);
  }
  
  const adminId = adminUsers[0].id;
  console.log(`Found Admin User: ${adminUsers[0].username} (ID: ${adminId})`);

  // Orders
  const unassignedOrders = await db.select().from(orders).where(isNull(orders.operatorId));
  if (unassignedOrders.length > 0) {
    console.log(`Assigning ${unassignedOrders.length} unassigned orders to Admin...`);
    await db.update(orders).set({ operatorId: adminId }).where(isNull(orders.operatorId));
  } else {
    console.log("No unassigned orders found.");
  }

  // Expenses
  const unassignedExpenses = await db.select().from(expenses).where(isNull(expenses.operatorId));
  if (unassignedExpenses.length > 0) {
    console.log(`Assigning ${unassignedExpenses.length} unassigned expenses to Admin...`);
    await db.update(expenses).set({ operatorId: adminId }).where(isNull(expenses.operatorId));
  } else {
    console.log("No unassigned expenses found.");
  }

  // Warehouse Income
  const unassignedWarehouse = await db.select().from(warehouseIncome).where(isNull(warehouseIncome.operatorId));
  if (unassignedWarehouse.length > 0) {
    console.log(`Assigning ${unassignedWarehouse.length} unassigned warehouse incomes to Admin...`);
    await db.update(warehouseIncome).set({ operatorId: adminId }).where(isNull(warehouseIncome.operatorId));
  } else {
    console.log("No unassigned warehouse incomes found.");
  }

  console.log("Done!");
  process.exit(0);
}

main().catch(console.error);
