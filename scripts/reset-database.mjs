import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { stores, storeZones, zoneSponsors, planogramLocations, planograms, products, productCategories, stockHistory, storePhotos, planogramHistory, aiRecommendations, performanceScores, anomalies, recommendations, planogramProducts, planogramPhotos, salesForecasts } from "../drizzle/schema.ts";

async function resetDatabase() {
  console.log("🔄 Réinitialisation complète de la base de données...\n");

  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection, { mode: "default" });

  try {
    // 1. Supprimer TOUTES les données dans l'ordre inverse des dépendances
    console.log("🗑️  Suppression de toutes les données existantes...");
    
    await db.delete(salesForecasts);
    console.log("   ✓ Prévisions de ventes supprimées");
    
    await db.delete(recommendations);
    console.log("   ✓ Recommandations supprimées");
    
    await db.delete(anomalies);
    console.log("   ✓ Anomalies supprimées");
    
    await db.delete(performanceScores);
    console.log("   ✓ Scores de performance supprimés");
    
    await db.delete(aiRecommendations);
    console.log("   ✓ Recommandations IA supprimées");
    
    await db.delete(planogramHistory);
    console.log("   ✓ Historique des planogrammes supprimé");
    
    await db.delete(stockHistory);
    console.log("   ✓ Historique de stock supprimé");
    
    await db.delete(planogramPhotos);
    console.log("   ✓ Photos de planogrammes supprimées");
    
    await db.delete(planogramProducts);
    console.log("   ✓ Produits de planogrammes supprimés");
    
    await db.delete(planograms);
    console.log("   ✓ Planogrammes supprimés");
    
    await db.delete(planogramLocations);
    console.log("   ✓ Emplacements supprimés");
    
    await db.delete(zoneSponsors);
    console.log("   ✓ Contrats de sponsoring supprimés");
    
    await db.delete(storeZones);
    console.log("   ✓ Zones supprimées");
    
    await db.delete(storePhotos);
    console.log("   ✓ Photos de magasins supprimées");
    
    await db.delete(stores);
    console.log("   ✓ Magasins supprimés");
    
    await db.delete(products);
    console.log("   ✓ Produits supprimés");
    
    await db.delete(productCategories);
    console.log("   ✓ Catégories de produits supprimées");

    console.log("\n✅ Base de données complètement nettoyée!");
    console.log("\n🔄 Veuillez maintenant exécuter le script de génération de données:");
    console.log("   npx tsx scripts/seed-demo-data.mjs");

  } catch (error) {
    console.error("❌ Erreur lors de la réinitialisation:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

resetDatabase().catch(console.error);
