import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL non définie');
  process.exit(1);
}

// Règles de merchandising
const MERCHANDISING_RULES = {
  // Hauteur des yeux : niveaux 2-3 (sur 5) = 40-60% de la hauteur
  EYE_LEVEL_SHELVES: [2, 3],
  
  // Catégories à forte rotation (doivent être à hauteur des yeux)
  HIGH_ROTATION_CATEGORIES: ['Boissons', 'Produits Laitiers', 'Épicerie Sèche'],
  
  // Catégories moins vendues (étagères hautes/basses)
  LOW_ROTATION_CATEGORIES: ['Bazar & Décoration', 'Textile & Mode']
};

// Déterminer la catégorie en fonction du nom du produit
function detectCategory(productName) {
  if (productName.includes('Boisson') || productName.includes('Eau') || productName.includes('Soda')) return 'Boissons';
  if (productName.includes('Lait') || productName.includes('Fromage') || productName.includes('Yaourt')) return 'Produits Laitiers';
  if (productName.includes('Pain') || productName.includes('Pates') || productName.includes('Riz')) return 'Épicerie Sèche';
  if (productName.includes('Savon') || productName.includes('Shampooing') || productName.includes('Dentifrice')) return 'Hygiène & Beauté';
  if (productName.includes('Bazar') || productName.includes('Décoration')) return 'Bazar & Décoration';
  if (productName.includes('Textile') || productName.includes('Mode')) return 'Textile & Mode';
  return 'Autres';
}

async function main() {
  const connection = await mysql.createConnection(DATABASE_URL);

  console.log('🔄 Optimisation des positions des produits...\n');

  // Récupérer tous les planogrammes actifs avec leurs produits
  const [planograms] = await connection.query(`
    SELECT p.id, p.name, pl.shelfCount, pl.shelfWidth, pl.shelfHeight
    FROM planograms p
    JOIN planogramLocations pl ON p.locationId = pl.id
    WHERE p.status = 'active'
    LIMIT 10
  `);

  console.log(`📊 ${planograms.length} planogrammes à optimiser\n`);

  let totalOptimized = 0;

  for (const planogram of planograms) {
    // Récupérer les produits du planogramme
    const [products] = await connection.query(`
      SELECT pp.id, pp.productId, pp.shelfLevel, pp.positionX, pp.facings, pp.quantity,
             p.name
      FROM planogramProducts pp
      JOIN products p ON pp.productId = p.id
      WHERE pp.planogramId = ?
      ORDER BY p.name
    `, [planogram.id]);

    if (products.length === 0) continue;

    // Grouper les produits par catégorie détectée
    const productsByCategory = {};
    products.forEach(p => {
      const category = detectCategory(p.name);
      if (!productsByCategory[category]) {
        productsByCategory[category] = [];
      }
      productsByCategory[category].push(p);
    });

    console.log(`\n📦 Optimisation du planogramme "${planogram.name}"`);
    console.log(`   Catégories: ${Object.keys(productsByCategory).join(', ')}`);

    // Appliquer les règles de merchandising
    let optimizedCount = 0;

    for (const [category, categoryProducts] of Object.entries(productsByCategory)) {
      // Déterminer le niveau d'étagère optimal
      let optimalShelfLevel;
      
      if (MERCHANDISING_RULES.HIGH_ROTATION_CATEGORIES.includes(category)) {
        // Produits à forte rotation : hauteur des yeux
        optimalShelfLevel = MERCHANDISING_RULES.EYE_LEVEL_SHELVES[0];
      } else if (MERCHANDISING_RULES.LOW_ROTATION_CATEGORIES.includes(category)) {
        // Produits à faible rotation : étagères hautes ou basses
        optimalShelfLevel = Math.random() > 0.5 ? 0 : planogram.shelfCount - 1;
      } else {
        // Autres catégories : distribuer uniformément
        optimalShelfLevel = Math.floor(Math.random() * planogram.shelfCount);
      }

      // Mettre à jour les positions
      for (let i = 0; i < categoryProducts.length; i++) {
        const product = categoryProducts[i];
        
        // Calculer la position X (grouper par catégorie)
        const positionX = (i * 150) % (planogram.shelfWidth - 100);
        
        // Mettre à jour la base de données
        await connection.query(`
          UPDATE planogramProducts 
          SET shelfLevel = ?, positionX = ?
          WHERE id = ?
        `, [optimalShelfLevel, positionX, product.id]);

        optimizedCount++;
      }

      console.log(`   ✅ ${category}: ${categoryProducts.length} produits optimisés (niveau ${optimalShelfLevel + 1})`);
    }

    totalOptimized += optimizedCount;
  }

  console.log(`\n✅ ${totalOptimized} positions optimisées avec succès !`);

  // Statistiques
  const [stats] = await connection.query(`
    SELECT 
      COUNT(*) as total_products,
      COUNT(DISTINCT planogramId) as planograms,
      AVG(shelfLevel) as avg_shelf_level,
      AVG(positionX) as avg_position_x
    FROM planogramProducts
  `);

  console.log(`\n📊 Statistiques après optimisation:`);
  console.log(`   - Total produits: ${stats[0].total_products}`);
  console.log(`   - Planogrammes optimisés: ${stats[0].planograms}`);
  console.log(`   - Niveau d'étagère moyen: ${Math.round(stats[0].avg_shelf_level * 10) / 10}`);
  console.log(`   - Position X moyenne: ${Math.round(stats[0].avg_position_x)}`);

  await connection.end();
}

main().catch(console.error);
