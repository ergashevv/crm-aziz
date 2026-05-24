import { db } from './lib/db';
import { expenses, drivers } from './lib/schema';
import { eq } from 'drizzle-orm';

async function main() {
  console.log("Starting GAI expenses backfill...");

  // 1. Fetch all internal drivers
  const allDrivers = await db.select().from(drivers);
  console.log(`Loaded ${allDrivers.length} drivers:`);
  allDrivers.forEach(d => {
    console.log(`  Driver ID: ${d.id}, Name: ${d.name}, Plate: ${d.vehiclePlate}`);
  });

  // 2. Fetch all expenses with category 'gai'
  const allGaiExpenses = await db.select().from(expenses).where(eq(expenses.category, 'gai'));
  console.log(`Found ${allGaiExpenses.length} GAI expense records.`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const exp of allGaiExpenses) {
    if (!exp.note) {
      skippedCount++;
      continue;
    }

    const note = exp.note;
    let matchedDriverId: number | null = null;

    // Search for a driver's vehicle plate in the note (case-insensitive)
    for (const d of allDrivers) {
      if (d.vehiclePlate && note.toLowerCase().includes(d.vehiclePlate.toLowerCase())) {
        matchedDriverId = d.id;
        break;
      }
    }

    if (matchedDriverId) {
      // Update only if driverId is not already set or is different
      if (exp.driverId !== matchedDriverId) {
        console.log(`Updating GAI Expense #${exp.id} | Note: "${note}" | Amount: ${exp.amountRub} RUB -> Mapped Driver ID: ${matchedDriverId}`);
        await db.update(expenses).set({ driverId: matchedDriverId }).where(eq(expenses.id, exp.id));
        updatedCount++;
      } else {
        skippedCount++;
      }
    } else {
      console.log(`Unmatched GAI Expense #${exp.id} | Note: "${note}" | Amount: ${exp.amountRub} RUB`);
      skippedCount++;
    }
  }

  console.log(`\nGAI backfill complete!`);
  console.log(`  Updated: ${updatedCount} GAI records`);
  console.log(`  Skipped/Already Set: ${skippedCount} GAI records`);
  process.exit(0);
}

main().catch(error => {
  console.error("GAI backfill failed:", error);
  process.exit(1);
});
