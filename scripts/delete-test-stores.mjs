import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { stores } from "../drizzle/schema.ts";
import { eq } from "drizzle-orm";

async function deleteTestStores() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection, { mode: "default" });

  try {
    // Supprimer les magasins "Test Store Filters"
    const result = await db.delete(stores).where(eq(stores.name, "Test Store Filters"));
    console.log("✓ Magasins de test supprimés");
    
    // Vérifier les magasins restants
    const allStores = await db.select().from(stores);
    console.log(`\nTotal magasins restants: ${allStores.length}`);
    allStores.forEach(store => {
      console.log(`- ${store.name} (${store.city})`);
    });
  } finally {
    await connection.end();
  }
}

deleteTestStores();
