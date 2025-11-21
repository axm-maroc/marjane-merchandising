#!/usr/bin/env node

import mysql from 'mysql2/promise';

async function cleanTestStores() {
  console.log('🧹 Nettoyage de la base de données...\n');

  const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL,
  });

  try {
    // IDs des magasins de test à supprimer
    const testStoreIds = [210001, 210002, 210003, 210004, 210005, 210006, 210007, 210008, 210009, 210010, 210011, 210012];
    const idsString = testStoreIds.join(',');

    // Afficher les magasins avant suppression
    console.log('📊 Magasins avant nettoyage:');
    const [storesBefore] = await connection.execute('SELECT id, name, city FROM stores');
    console.log(`   Total: ${storesBefore.length} magasins\n`);

    const testStores = storesBefore.filter(s => testStoreIds.includes(s.id));
    console.log(`🗑️  Magasins de test trouvés: ${testStores.length}`);
    testStores.forEach(s => console.log(`   - ID ${s.id}: ${s.name} (${s.city})`));

    // Supprimer les magasins de test (cela supprimera aussi les données en cascade)
    console.log('\n⏳ Suppression des magasins de test...');

    // Supprimer les produits des planogrammes
    await connection.execute(`
      DELETE FROM planogramProducts 
      WHERE planogramId IN (
        SELECT id FROM planograms WHERE locationId IN (
          SELECT id FROM planogramLocations WHERE storeId IN (${idsString})
        )
      )
    `);
    console.log('✅ Produits des planogrammes supprimés');

    // Supprimer l'historique des planogrammes
    await connection.execute(`
      DELETE FROM planogramHistory 
      WHERE planogramId IN (
        SELECT id FROM planograms WHERE locationId IN (
          SELECT id FROM planogramLocations WHERE storeId IN (${idsString})
        )
      )
    `);
    console.log('✅ Historique des planogrammes supprimé');

    // Supprimer les photos des planogrammes
    await connection.execute(`
      DELETE FROM planogramPhotos 
      WHERE planogramId IN (
        SELECT id FROM planograms WHERE locationId IN (
          SELECT id FROM planogramLocations WHERE storeId IN (${idsString})
        )
      )
    `);
    console.log('✅ Photos des planogrammes supprimées');

    // Supprimer les recommandations
    await connection.execute(`
      DELETE FROM recommendations 
      WHERE planogramId IN (
        SELECT id FROM planograms WHERE locationId IN (
          SELECT id FROM planogramLocations WHERE storeId IN (${idsString})
        )
      )
    `);
    console.log('✅ Recommandations supprimées');

    // Supprimer les planogrammes
    await connection.execute(`
      DELETE FROM planograms WHERE locationId IN (
        SELECT id FROM planogramLocations WHERE storeId IN (${idsString})
      )
    `);
    console.log('✅ Planogrammes supprimés');

    // Supprimer les emplacements
    await connection.execute(`
      DELETE FROM planogramLocations WHERE storeId IN (${idsString})
    `);
    console.log('✅ Emplacements supprimés');

    // Supprimer les zones
    await connection.execute(`
      DELETE FROM storeZones WHERE storeId IN (${idsString})
    `);
    console.log('✅ Zones supprimées');

    // Supprimer les photos des magasins
    await connection.execute(`
      DELETE FROM storePhotos WHERE storeId IN (${idsString})
    `);
    console.log('✅ Photos des magasins supprimées');

    // Supprimer les prévisions de ventes
    await connection.execute(`
      DELETE FROM salesForecasts 
      WHERE planogramId IN (
        SELECT id FROM planograms WHERE locationId IN (
          SELECT id FROM planogramLocations WHERE storeId IN (${idsString})
        )
      )
    `);
    console.log('✅ Prévisions de ventes supprimées');

    // Supprimer les anomalies
    await connection.execute(`
      DELETE FROM anomalies 
      WHERE planogramId IN (
        SELECT id FROM planograms WHERE locationId IN (
          SELECT id FROM planogramLocations WHERE storeId IN (${idsString})
        )
      )
    `);
    console.log('✅ Anomalies supprimées');

    // Supprimer les scores de performance
    await connection.execute(`
      DELETE FROM performanceScores 
      WHERE planogramId IN (
        SELECT id FROM planograms WHERE locationId IN (
          SELECT id FROM planogramLocations WHERE storeId IN (${idsString})
        )
      )
    `);
    console.log('✅ Scores de performance supprimés');

    // Supprimer les magasins
    await connection.execute(`
      DELETE FROM stores WHERE id IN (${idsString})
    `);
    console.log('✅ Magasins supprimés');

    // Vérifier le résultat
    const [storesAfter] = await connection.execute('SELECT id, name, city FROM stores ORDER BY name');
    console.log(`\n📊 Magasins après nettoyage: ${storesAfter.length}`);
    console.log('\n✨ Magasins restants:');
    storesAfter.forEach(s => console.log(`   - ${s.name} (${s.city})`));

    console.log('\n✅ Nettoyage terminé avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

cleanTestStores();
