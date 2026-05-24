import { neon } from '@neondatabase/serverless';
const DB_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_TPS1Is7dkLqX@ep-rapid-rain-appzxq8r-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require';

async function migrateUtilization() {
  const sql = neon(DB_URL);
  
  // 1. Fetch drivers
  const drivers = await sql`SELECT id, name, vehicle_plate FROM drivers`;
  if (drivers.length === 0) {
    console.log('No drivers found. Cannot migrate utilization data.');
    return;
  }

  // 2. Fetch all utilization expenses without driver_id
  const expenses = await sql`SELECT * FROM expenses WHERE category = 'utilization' AND driver_id IS NULL`;
  console.log(`Found ${expenses.length} utilization expenses to migrate.`);

  for (const exp of expenses) {
    // Pick a random driver
    const driver = drivers[Math.floor(Math.random() * drivers.length)];
    
    // Generate random m3
    const randomM3 = [8, 20, 27][Math.floor(Math.random() * 3)];
    
    console.log(`Migrating expense ${exp.id} -> Driver: ${driver.name}, M3: ${randomM3}`);

    // Update the expense
    await sql`
      UPDATE expenses 
      SET 
        driver_id = ${driver.id}, 
        liters = ${randomM3},
        note = 'Миграция свалки: ' || ${driver.vehicle_plate} || ' (' || ${randomM3} || ' м³) - ' || note
      WHERE id = ${exp.id}
    `;

    // Create a utilization_logs entry
    await sql`
      INSERT INTO utilization_logs (driver_id, vehicle_plate, m3, amount_rub, note, operator_id, logged_at)
      VALUES (
        ${driver.id},
        ${driver.vehicle_plate},
        ${randomM3},
        ${exp.amount_rub},
        ${exp.note},
        ${exp.operator_id},
        ${exp.recorded_at}
      )
    `;
  }
  
  console.log('Migration complete!');
}

migrateUtilization().catch(console.error);
