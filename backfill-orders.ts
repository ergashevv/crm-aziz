import { db } from './lib/db';
import { expenses, orders } from './lib/schema';
import { eq, isNull } from 'drizzle-orm';

async function main() {
  const allExpenses = await db.select().from(expenses).where(isNull(expenses.orderId));
  let updatedCount = 0;

  for (const exp of allExpenses) {
    if (exp.note) {
      // Look for "за заказ #123" pattern
      const match = exp.note.match(/заказ #(\d+)/i);
      if (match && match[1]) {
        const orderId = parseInt(match[1], 10);
        
        // Verify order exists
        const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
        if (order) {
          await db.update(expenses).set({ orderId }).where(eq(expenses.id, exp.id));
          updatedCount++;
          console.log(`Updated expense ${exp.id} with orderId ${orderId}`);
        }
      }
    }
  }
  console.log(`Successfully backfilled ${updatedCount} expenses.`);
  process.exit(0);
}

main().catch(console.error);
