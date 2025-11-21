import { drizzle } from 'drizzle-orm/mysql2';
import { products } from '../drizzle/schema.ts';

const db = drizzle(process.env.DATABASE_URL);
const result = await db.select().from(products).limit(5);
console.log(JSON.stringify(result, null, 2));
process.exit(0);
