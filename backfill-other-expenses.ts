import { db } from './lib/db';
import { expenses, drivers } from './lib/schema';
import { eq, inArray } from 'drizzle-orm';

async function main() {
  console.log("Starting GAI, Driver Salary, and Spare Parts expenses backfill...");

  // 1. Fetch all internal drivers
  const allDrivers = await db.select().from(drivers);
  console.log(`Loaded ${allDrivers.length} drivers:`);
  allDrivers.forEach(d => {
    console.log(`  Driver ID: ${d.id}, Name: ${d.name}, Plate: ${d.vehiclePlate}`);
  });

  // 2. Fetch all expenses with category 'driver_salary' or 'spare_parts'
  const otherExpenses = await db.select().from(expenses).where(
    inArray(expenses.category, ['driver_salary', 'spare_parts'])
  );
  console.log(`Found ${otherExpenses.length} target expense records.`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const exp of otherExpenses) {
    if (!exp.note) {
      skippedCount++;
      continue;
    }

    const note = exp.note;
    let matchedDriverId: number | null = null;

    // Search for a driver's name or vehicle plate in the note (case-insensitive)
    for (const d of allDrivers) {
      const nameMatch = note.toLowerCase().includes(d.name.toLowerCase());
      const plateMatch = d.vehiclePlate && note.toLowerCase().includes(d.vehiclePlate.toLowerCase());
      
      if (nameMatch || plateMatch) {
        matchedDriverId = d.id;
        break;
      }
    }

    if (matchedDriverId) {
      // Update only if driverId is not already set or is different
      if (exp.driverId !== matchedDriverId) {
        console.log(`Updating ${exp.category.toUpperCase()} Expense #${exp.id} | Note: "${note}" | Amount: ${exp.amountRub} RUB -> Mapped Driver ID: ${matchedDriverId}`);
        await db.update(expenses).set({ driverId: matchedDriverId }).where(eq(expenses.id, exp.id));
        updatedCount++;
      } else {
        skippedCount++;
      }
    } else {
      console.log(`Unmatched ${exp.category.toUpperCase()} Expense #${exp.id} | Note: "${note}" | Amount: ${exp.amountRub} RUB`);
      skippedCount++;
    }
  }

  console.log(`\nBackfill complete!`);
  console.log(`  Updated: ${updatedCount} records`);
  console.log(`  Skipped/Already Set: ${skippedCount} records`);
  process.exit(0);
}

main().catch(error => {
  console.error("Backfill failed:", error);
  process.exit(1);
});
