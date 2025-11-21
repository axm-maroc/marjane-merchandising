import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { stores } from "../drizzle/schema.ts";

async function countStores() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection, { mode: "default" });

  try {
    const allStores = await db.select().from(stores);
    console.log(`Total magasins: ${allStores.length}`);
    allStores.forEach(store => {
      console.log(`- ${store.name} (${store.city})`);
    });
  } finally {
    await connection.end();
  }
}

countStores();
