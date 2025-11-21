import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  console.log('🔍 Recherche d\'un emplacement disponible...');
  
  // Trouver un emplacement dans le premier magasin
  const [locations] = await connection.execute(`
    SELECT l.id, l.name, z.name as zoneName, s.name as storeName
    FROM planogramLocations l
    JOIN storeZones z ON l.zoneId = z.id
    JOIN stores s ON z.storeId = s.id
    WHERE s.id = 150001
    LIMIT 1
  `);
  
  if (locations.length === 0) {
    console.log('❌ Aucun emplacement trouvé');
    process.exit(1);
  }
  
  const location = locations[0];
  console.log(`✅ Emplacement trouvé: ${location.name} (Zone: ${location.zoneName}, Magasin: ${location.storeName})`);
  
  // Créer un planogramme "Boissons"
  console.log('\n📦 Création du planogramme "Boissons"...');
  const [result] = await connection.execute(`
    INSERT INTO planograms (locationId, name, version, status, startDate, endDate, createdAt, updatedAt)
    VALUES (?, 'Planogramme Boissons', 1, 'active', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), NOW(), NOW())
  `, [location.id]);
  
  const planogramId = result.insertId;
  console.log(`✅ Planogramme créé avec ID: ${planogramId}`);
  
  // IDs des produits boissons
  const drinkProductIds = [150001, 150002, 150003, 150004, 150005]; // Coca, Eau Sidi Ali, Jus, Sprite, Fanta
  
  console.log('\n🥤 Association des produits boissons au planogramme...');
  
  for (const productId of drinkProductIds) {
    // Vérifier si le produit existe
    const [products] = await connection.execute('SELECT name FROM products WHERE id = ?', [productId]);
    
    if (products.length > 0) {
      const productName = products[0].name;
      
      // Ajouter le produit au planogramme
      await connection.execute(`
        INSERT INTO planogramProducts (planogramId, productId, facings, shelfLevel, positionX, quantity, createdAt)
        VALUES (?, ?, 3, 2, 0, 100, NOW())
      `, [planogramId, productId]);
      
      console.log(`  ✅ ${productName} ajouté`);
    }
  }
  
  console.log('\n✅ Planogramme "Boissons" créé avec succès!');
  console.log(`   - ID: ${planogramId}`);
  console.log(`   - Emplacement: ${location.name}`);
  console.log(`   - Produits: ${drinkProductIds.length} boissons`);
  
} catch (error) {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
} finally {
  await connection.end();
}
