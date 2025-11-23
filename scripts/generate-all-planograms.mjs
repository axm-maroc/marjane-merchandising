#!/usr/bin/env node

import mysql from 'mysql2/promise';

// Configuration des catégories de planogrammes
const planogramTemplates = [
  {
    name: 'Boissons Froides',
    productIds: [1, 4, 5, 2], // Coca-Cola, Sprite, Fanta, Eau
    quantities: [45, 40, 35, 50],
    status: 'active',
  },
  {
    name: 'Produits Laitiers',
    productIds: [6, 7, 8],
    quantities: [30, 25, 15],
    status: 'active',
  },
  {
    name: 'Épicerie Sèche',
    productIds: [9, 10, 11, 12],
    quantities: [20, 18, 15, 12],
    status: 'active',
  },
  {
    name: 'Hygiène & Beauté',
    productIds: [13, 14, 15, 16],
    quantities: [25, 20, 30, 22],
    status: 'draft',
  },
  {
    name: 'Produits Ménagers',
    productIds: [17, 18, 19, 20],
    quantities: [28, 32, 25, 20],
    status: 'active',
  },
];

async function generateAllPlanograms() {
  let connection;
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      connection = await mysql.createConnection(dbUrl);
    } else {
      connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'marjane_merchandising',
      });
    }

    console.log('\n📊 Génération de planogrammes réalistes pour tous les magasins...\n');

    // Récupérer tous les magasins
    const [stores] = await connection.execute(
      'SELECT id, name FROM stores ORDER BY id'
    );

    let totalCreated = 0;
    let totalProducts = 0;

    for (const store of stores) {
      const storeId = store.id;
      
      // Récupérer les emplacements du magasin
      const [locations] = await connection.execute(
        'SELECT id FROM planogramLocations WHERE storeId = ? LIMIT 5',
        [storeId]
      );

      if (locations.length === 0) {
        console.log(`⚠️  ${store.name} : Aucun emplacement trouvé`);
        continue;
      }

      console.log(`\n🏪 ${store.name} (${locations.length} emplacements):`);

      // Créer des planogrammes pour chaque emplacement
      for (let i = 0; i < locations.length && i < planogramTemplates.length; i++) {
        const template = planogramTemplates[i];
        const locationId = locations[i].id;

        // Créer le planogramme
        const [result] = await connection.execute(
          `INSERT INTO planograms (locationId, name, version, status, createdAt) 
           VALUES (?, ?, 1, ?, NOW())`,
          [locationId, template.name, template.status]
        );

        const planogramId = result.insertId;

        // Ajouter les produits
        for (let j = 0; j < template.productIds.length; j++) {
          const productId = template.productIds[j];
          const quantity = template.quantities[j];

          await connection.execute(
            `INSERT INTO planogramProducts (planogramId, productId, quantity, facings, shelfLevel, positionX, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [planogramId, productId, quantity, Math.ceil(quantity / 3), j % 3, j * 10]
          );

          totalProducts++;
        }

        console.log(`  ✅ ${template.name} (${template.productIds.length} produits, ${template.status})`);
        totalCreated++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✨ Génération terminée !`);
    console.log(`   ✅ ${totalCreated} planogrammes créés`);
    console.log(`   ✅ ${totalProducts} produits assignés`);
    console.log(`   ✅ ${stores.length} magasins traités`);
    console.log('='.repeat(60) + '\n');

    await connection.end();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

generateAllPlanograms();
