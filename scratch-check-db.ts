import { db } from './lib/db';
import { sql } from 'drizzle-orm';

async function check() {
  try {
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables:', tables.rows);

    const fuelLogCols = await db.execute(sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'fuel_logs'
    `);
    console.log('fuel_logs columns:', fuelLogCols.rows);

    const orderCols = await db.execute(sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'orders'
    `);
    console.log('orders columns:', orderCols.rows);

    const enumValues = await db.execute(sql`
      SELECT e.enumlabel 
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid 
      WHERE t.typname = 'expense_category'
    `);
    console.log('expense_category enum labels in DB:', enumValues.rows.map(r => r.enumlabel));
  } catch (err) {
    console.error('Error querying schema:', err);
  }
  process.exit(0);
}

check();
