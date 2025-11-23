import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL non définie');
  process.exit(1);
}

async function main() {
  const connection = await mysql.createConnection(DATABASE_URL);

  console.log('🔄 Assignation des produits aux planogrammes...\n');

  // Récupérer tous les planogrammes
  const [planograms] = await connection.query(`
    SELECT p.id, p.name, pl.shelfCount, pl.shelfWidth, pl.shelfHeight
    FROM planograms p
    JOIN planogramLocations pl ON p.locationId = pl.id
    WHERE p.status = 'active'
    ORDER BY p.id
  `);

  console.log(`📊 ${planograms.length} planogrammes actifs trouvés\n`);

  // Récupérer les produits avec photos
  const [products] = await connection.query(`
    SELECT id, name, categoryId, unitPrice, photoUrl, width, height, depth
    FROM products
    WHERE photoUrl IS NOT NULL
    ORDER BY id
  `);

  console.log(`📦 ${products.length} produits avec photos disponibles\n`);

  // Supprimer les anciennes assignations
  await connection.query('DELETE FROM planogramProducts');
  console.log('🗑️  Anciennes assignations supprimées\n');

  let totalAssigned = 0;

  // Pour chaque planogramme, assigner 5-15 produits aléatoires
  for (const planogram of planograms) {
    const numProducts = Math.floor(Math.random() * 11) + 5; // 5-15 produits
    const selectedProducts = [];

    // Sélectionner des produits aléatoires
    for (let i = 0; i < numProducts && i < products.length; i++) {
      const randomIndex = Math.floor(Math.random() * products.length);
      const product = products[randomIndex];
      
      if (!selectedProducts.find(p => p.id === product.id)) {
        selectedProducts.push(product);
      }
    }

    // Assigner les produits au planogramme
    for (let i = 0; i < selectedProducts.length; i++) {
      const product = selectedProducts[i];
      
      // Calculer la position et le niveau d'étagère
      const shelfLevel = Math.floor(Math.random() * planogram.shelfCount);
      const positionX = Math.floor(Math.random() * (planogram.shelfWidth - 100));
      const quantity = Math.floor(Math.random() * 20) + 5; // 5-25 unités
      const facings = Math.floor(Math.random() * 3) + 1; // 1-3 facings

      await connection.query(`
        INSERT INTO planogramProducts 
        (planogramId, productId, quantity, facings, shelfLevel, positionX, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
      `, [planogram.id, product.id, quantity, facings, shelfLevel, positionX]);

      totalAssigned++;
    }

    console.log(`✅ Planogramme "${planogram.name}" : ${selectedProducts.length} produits assignés`);
  }

  console.log(`\n✅ ${totalAssigned} produits assignés avec succès !`);

  // Statistiques
  const [stats] = await connection.query(`
    SELECT 
      COUNT(DISTINCT planogramId) as planograms_with_products,
      COUNT(*) as total_assignments,
      AVG(quantity) as avg_quantity,
      AVG(facings) as avg_facings
    FROM planogramProducts
  `);

  console.log(`\n📊 Statistiques:`);
  console.log(`   - Planogrammes avec produits: ${stats[0].planograms_with_products}`);
  console.log(`   - Total assignations: ${stats[0].total_assignments}`);
  console.log(`   - Quantité moyenne: ${Math.round(stats[0].avg_quantity)}`);
  console.log(`   - Facings moyens: ${Math.round(stats[0].avg_facings * 10) / 10}`);

  await connection.end();
}

main().catch(console.error);
