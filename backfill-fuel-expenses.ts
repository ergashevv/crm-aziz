import { db } from './lib/db';
import { expenses, drivers } from './lib/schema';
import { eq, inArray } from 'drizzle-orm';

async function main() {
  console.log("Starting fuel expenses backfill...");

  // 1. Fetch all internal drivers
  const allDrivers = await db.select().from(drivers);
  console.log(`Loaded ${allDrivers.length} drivers:`);
  allDrivers.forEach(d => {
    console.log(`  Driver ID: ${d.id}, Name: ${d.name}, Plate: ${d.vehiclePlate}`);
  });

  // 2. Fetch all expenses with fuel or diesel category
  const allFuelExpenses = await db.select().from(expenses).where(
    inArray(expenses.category, ['fuel', 'diesel'])
  );
  console.log(`Found ${allFuelExpenses.length} fuel/diesel expense records.`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const exp of allFuelExpenses) {
    if (!exp.note) {
      skippedCount++;
      continue;
    }

    const note = exp.note;
    let matchedDriverId: number | null = null;
    let matchedLiters: number | null = null;

    // Search for a driver's vehicle plate in the note (case-insensitive)
    for (const d of allDrivers) {
      if (d.vehiclePlate && note.toLowerCase().includes(d.vehiclePlate.toLowerCase())) {
        matchedDriverId = d.id;
        break;
      }
    }

    // Try to extract liters e.g., "(50L)" or "50L" or "50 L" or "50л"
    const litersMatch = note.match(/(\d+)\s*L/i) || note.match(/(\d+)\s*л/i) || note.match(/\((\d+)\)/);
    if (litersMatch) {
      matchedLiters = parseInt(litersMatch[1], 10);
    }

    if (matchedDriverId || matchedLiters) {
      // Build the update payload only updating fields if they aren't already set or are different
      const updatePayload: Record<string, any> = {};
      if (matchedDriverId && exp.driverId !== matchedDriverId) {
        updatePayload.driverId = matchedDriverId;
      }
      if (matchedLiters !== null && exp.liters !== matchedLiters) {
        updatePayload.liters = matchedLiters;
      }

      if (Object.keys(updatePayload).length > 0) {
        console.log(`Updating Expense #${exp.id} | Note: "${note}" | Amount: ${exp.amountRub} RUB -> Mapped Driver ID: ${matchedDriverId}, Liters: ${matchedLiters}`);
        await db.update(expenses).set(updatePayload).where(eq(expenses.id, exp.id));
        updatedCount++;
      } else {
        skippedCount++;
      }
    } else {
      console.log(`Unmatched Expense #${exp.id} | Note: "${note}" | Amount: ${exp.amountRub} RUB`);
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
