import { db } from './lib/db';
import { orders, expenses, warehouseIncome, users } from './lib/schema';
import { eq, sql } from 'drizzle-orm';

async function check() {
  // Get all users
  const allUsers = await db.select().from(users);
  console.log('\n=== USERS ===');
  allUsers.forEach(u => console.log(`  ID: ${u.id}, Name: ${u.name}, Role: ${u.role}`));

  // Count orders by operatorId
  console.log('\n=== ORDERS BY OPERATOR ===');
  for (const u of allUsers) {
    const userOrders = await db.select().from(orders).where(eq(orders.operatorId, u.id));
    const enteredOrders = userOrders.filter(o => o.paymentStatus === 'entered');
    const totalRevenue = enteredOrders.reduce((sum, o) => sum + o.paymentAmount, 0);
    console.log(`  ${u.name} (${u.role}): ${userOrders.length} orders, ${enteredOrders.length} entered, revenue: ${totalRevenue.toLocaleString()} RUB`);
  }

  // Count expenses by operatorId
  console.log('\n=== EXPENSES BY OPERATOR ===');
  for (const u of allUsers) {
    const userExpenses = await db.select().from(expenses).where(eq(expenses.operatorId, u.id));
    const totalExpenses = userExpenses.reduce((sum, e) => sum + e.amountRub, 0);
    console.log(`  ${u.name} (${u.role}): ${userExpenses.length} records, total: ${totalExpenses.toLocaleString()} RUB`);
  }

  // Count warehouse income by operatorId
  console.log('\n=== WAREHOUSE INCOME BY OPERATOR ===');
  for (const u of allUsers) {
    const userIncome = await db.select().from(warehouseIncome).where(eq(warehouseIncome.operatorId, u.id));
    const totalIncome = userIncome.reduce((sum, w) => sum + w.amountRub, 0);
    console.log(`  ${u.name} (${u.role}): ${userIncome.length} records, total: ${totalIncome.toLocaleString()} RUB`);
  }

  // Totals
  const allOrders = await db.select().from(orders);
  const allExpenses = await db.select().from(expenses);
  const allIncome = await db.select().from(warehouseIncome);
  console.log('\n=== TOTALS (what ADMIN sees) ===');
  console.log(`  Total orders: ${allOrders.length}`);
  console.log(`  Total expenses records: ${allExpenses.length}`);
  console.log(`  Total income records: ${allIncome.length}`);
  
  process.exit(0);
}

check().catch(console.error);
