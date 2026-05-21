import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!, {
  fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' })
});
export const db = drizzle(sql, { schema });
