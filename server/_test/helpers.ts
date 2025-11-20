import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { stores } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

let _testStoreId: number | null = null;

/**
 * Récupère l'ID d'un magasin Marjane réel pour les tests
 * Cache le résultat pour éviter les requêtes répétées
 */
export async function getTestStoreId(): Promise<number> {
  if (_testStoreId !== null) {
    return _testStoreId;
  }

  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(connection, { mode: "default" });

  try {
    // Récupérer le premier magasin Marjane (Bouregreg)
    const result = await db
      .select({ id: stores.id })
      .from(stores)
      .where(eq(stores.name, "Marjane Bouregreg"))
      .limit(1);

    if (result.length === 0) {
      throw new Error("Aucun magasin Marjane trouvé dans la base de données de test");
    }

    _testStoreId = result[0].id;
    return _testStoreId;
  } finally {
    await connection.end();
  }
}

/**
 * Réinitialise le cache des IDs de test
 * Utile si les tests modifient la base de données
 */
export function resetTestCache() {
  _testStoreId = null;
}
