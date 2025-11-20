import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { stores, storeZones, zoneSponsors, planogramLocations, planograms, products, productCategories, stockHistory, storePhotos } from "../drizzle/schema.ts";
import { inArray, notInArray, sql } from "drizzle-orm";

// Liste des 12 magasins Marjane réels à conserver
const realMarjaneStoreNames = [
  "Marjane Bouregreg",
  "Marjane Californie",
  "Marjane Hay Riad",
  "Marjane Derb Sultan",
  "Marjane Menara",
  "Marjane Targa",
  "Marjane Agdal",
  "Marjane Founty",
  "Marjane Tanger City Center",
  "Marjane Oujda",
  "Marjane Meknès",
  "Marjane Tétouan"
];

async function cleanupDatabase() {
  console.log("🧹 Démarrage du nettoyage de la base de données...\n");

  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection, { mode: "default" });

  try {
    // 1. Récupérer les IDs des magasins Marjane réels
    console.log("📍 Identification des magasins Marjane réels...");
    const realStores = await db
      .select({ id: stores.id, name: stores.name })
      .from(stores)
      .where(inArray(stores.name, realMarjaneStoreNames));
    
    const realStoreIds = realStores.map(s => s.id);
    console.log(`   ✓ ${realStores.length} magasins Marjane trouvés:`);
    realStores.forEach(store => console.log(`      - ${store.name}`));

    if (realStoreIds.length === 0) {
      console.log("\n⚠️  Aucun magasin Marjane trouvé. Abandon du nettoyage.");
      return;
    }

    // 2. Récupérer les magasins à supprimer
    const storesToDelete = await db
      .select({ id: stores.id, name: stores.name })
      .from(stores)
      .where(notInArray(stores.name, realMarjaneStoreNames));
    
    const storeIdsToDelete = storesToDelete.map(s => s.id);
    
    if (storeIdsToDelete.length === 0) {
      console.log("\n✅ Aucun magasin de test à supprimer. La base est déjà propre!");
      return;
    }

    console.log(`\n🗑️  ${storesToDelete.length} magasins de test à supprimer:`);
    storesToDelete.forEach(store => console.log(`      - ${store.name}`));

    // 3. Supprimer les données associées aux magasins de test
    console.log("\n🗑️  Suppression des données associées...");

    // Supprimer l'historique de stock
    const deletedStock = await db
      .delete(stockHistory)
      .where(inArray(stockHistory.storeId, storeIdsToDelete));
    console.log(`   ✓ ${deletedStock[0].affectedRows || 0} enregistrements de stock supprimés`);

    // Supprimer les photos de magasins
    const deletedPhotos = await db
      .delete(storePhotos)
      .where(inArray(storePhotos.storeId, storeIdsToDelete));
    console.log(`   ✓ ${deletedPhotos[0].affectedRows || 0} photos de magasins supprimées`);

    // Récupérer les emplacements à supprimer
    const locationsToDelete = await db
      .select({ id: planogramLocations.id })
      .from(planogramLocations)
      .where(inArray(planogramLocations.storeId, storeIdsToDelete));
    
    const locationIdsToDelete = locationsToDelete.map(l => l.id);

    if (locationIdsToDelete.length > 0) {
      // Supprimer les planogrammes associés aux emplacements
      const deletedPlanograms = await db
        .delete(planograms)
        .where(inArray(planograms.locationId, locationIdsToDelete));
      console.log(`   ✓ ${deletedPlanograms[0].affectedRows || 0} planogrammes supprimés`);

      // Supprimer les emplacements
      const deletedLocations = await db
        .delete(planogramLocations)
        .where(inArray(planogramLocations.id, locationIdsToDelete));
      console.log(`   ✓ ${deletedLocations[0].affectedRows || 0} emplacements supprimés`);
    }

    // Récupérer les zones à supprimer
    const zonesToDelete = await db
      .select({ id: storeZones.id })
      .from(storeZones)
      .where(inArray(storeZones.storeId, storeIdsToDelete));
    
    const zoneIdsToDelete = zonesToDelete.map(z => z.id);

    if (zoneIdsToDelete.length > 0) {
      // Supprimer les contrats de sponsoring
      const deletedSponsors = await db
        .delete(zoneSponsors)
        .where(inArray(zoneSponsors.zoneId, zoneIdsToDelete));
      console.log(`   ✓ ${deletedSponsors[0].affectedRows || 0} contrats de sponsoring supprimés`);

      // Supprimer les zones
      const deletedZones = await db
        .delete(storeZones)
        .where(inArray(storeZones.id, zoneIdsToDelete));
      console.log(`   ✓ ${deletedZones[0].affectedRows || 0} zones supprimées`);
    }

    // 4. Supprimer les magasins de test
    const deletedStores = await db
      .delete(stores)
      .where(inArray(stores.id, storeIdsToDelete));
    console.log(`   ✓ ${deletedStores[0].affectedRows || 0} magasins supprimés`);

    // 5. Afficher le résumé
    console.log("\n✅ Nettoyage terminé avec succès!");
    console.log(`\n📊 État final de la base de données:`);
    
    const finalStoreCount = await db.select({ count: sql`count(*)` }).from(stores);
    const finalZoneCount = await db.select({ count: sql`count(*)` }).from(storeZones);
    const finalLocationCount = await db.select({ count: sql`count(*)` }).from(planogramLocations);
    const finalPlanogramCount = await db.select({ count: sql`count(*)` }).from(planograms);
    const finalSponsorCount = await db.select({ count: sql`count(*)` }).from(zoneSponsors);
    const finalStockCount = await db.select({ count: sql`count(*)` }).from(stockHistory);

    console.log(`   - ${finalStoreCount[0].count} magasins Marjane`);
    console.log(`   - ${finalZoneCount[0].count} zones`);
    console.log(`   - ${finalLocationCount[0].count} emplacements`);
    console.log(`   - ${finalPlanogramCount[0].count} planogrammes`);
    console.log(`   - ${finalSponsorCount[0].count} contrats de sponsoring`);
    console.log(`   - ${finalStockCount[0].count} enregistrements de stock`);

  } catch (error) {
    console.error("❌ Erreur lors du nettoyage:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

cleanupDatabase().catch(console.error);
