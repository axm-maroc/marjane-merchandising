import { getDb } from '../server/db.ts';
import { planograms, planogramProducts, planogramLocations, products, productCategories } from '../drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const SAMPLE_PRODUCTS = [
  { name: 'Coca-Cola 1.5L', category: 'Boissons', price: 2500 },
  { name: 'Fanta Orange 1.5L', category: 'Boissons', price: 2200 },
  { name: 'Sprite 1.5L', category: 'Boissons', price: 2200 },
  { name: 'Eau Minérale 1.5L', category: 'Boissons', price: 800 },
  { name: 'Jus Orange 1L', category: 'Boissons', price: 1500 },
  { name: 'Lait Entier 1L', category: 'Produits Laitiers', price: 1200 },
  { name: 'Yaourt Nature 500g', category: 'Produits Laitiers', price: 1000 },
  { name: 'Fromage Blanc 500g', category: 'Produits Laitiers', price: 1400 },
  { name: 'Beurre 250g', category: 'Produits Laitiers', price: 1800 },
  { name: 'Dentifrice Colgate 75ml', category: 'Hygiène', price: 1500 },
  { name: 'Savon Dove 100g', category: 'Hygiène', price: 1200 },
  { name: 'Shampoing Pantène 400ml', category: 'Hygiène', price: 2000 },
  { name: 'Déodorant Rexona 150ml', category: 'Hygiène', price: 1800 },
  { name: 'Lessive Persil 2L', category: 'Entretien', price: 3500 },
  { name: 'Nettoyant Vitrex 750ml', category: 'Entretien', price: 1200 },
  { name: 'Savon Noir 1L', category: 'Entretien', price: 1500 },
];

async function seedPlanograms() {
  try {
    const db = await getDb();
    if (!db) {
      console.error('❌ Impossible de se connecter à la base de données');
      process.exit(1);
    }

    // Récupérer ou créer les catégories
    console.log('📂 Récupération des catégories...');
    const categoryMap = {};
    const categories = ['Boissons', 'Produits Laitiers', 'Hygiène', 'Entretien'];
    
    for (const cat of categories) {
      const existing = await db.select().from(productCategories).where(eq(productCategories.name, cat));
      if (existing.length === 0) {
        const [inserted] = await db.insert(productCategories).values({ name: cat });
        categoryMap[cat] = inserted.insertId;
      } else {
        categoryMap[cat] = existing[0].id;
      }
    }
    console.log(`✅ ${Object.keys(categoryMap).length} catégorie(s) disponible(s)`);

    // Créer les produits s'ils n'existent pas
    console.log('📦 Création des produits...');
    const productMap = {};
    for (const prod of SAMPLE_PRODUCTS) {
      const sku = prod.name.replace(/\s+/g, '-').toLowerCase();
      const existing = await db.select().from(products).where(eq(products.sku, sku));
      if (existing.length === 0) {
        const [inserted] = await db.insert(products).values({
          name: prod.name,
          sku,
          categoryId: categoryMap[prod.category],
          unitPrice: prod.price,
          brand: 'Marque Standard',
        });
        productMap[prod.name] = inserted.insertId;
      } else {
        productMap[prod.name] = existing[0].id;
      }
    }
    console.log(`✅ ${Object.keys(productMap).length} produit(s) disponible(s)`);

    // Récupérer les emplacements
    const locations = await db.select().from(planogramLocations);
    console.log(`📊 ${locations.length} emplacement(s) trouvé(s)`);

    if (locations.length === 0) {
      console.log('⚠️ Aucun emplacement disponible');
      process.exit(0);
    }

    let planogramCount = 0;
    let productCount = 0;

    // Créer des planogrammes pour les 30 premiers emplacements
    for (const location of locations.slice(0, 30)) {
      const existing = await db
        .select()
        .from(planograms)
        .where(eq(planograms.locationId, location.id));

      if (existing.length > 0) {
        continue;
      }

      const category = SAMPLE_PRODUCTS[Math.floor(Math.random() * SAMPLE_PRODUCTS.length)].category;
      const planogramName = `Planogramme ${category} - ${location.name}`;

      const [inserted] = await db.insert(planograms).values({
        locationId: location.id,
        name: planogramName,
        description: `Planogramme optimisé pour ${category}`,
        status: 'active',
        version: 1,
      });

      const planogramId = inserted.insertId;
      console.log(`✅ ${planogramName}`);
      planogramCount++;

      // Ajouter des produits au planogramme
      const categoryProducts = SAMPLE_PRODUCTS.filter(p => p.category === category);
      
      for (let shelfIndex = 0; shelfIndex < Math.min(3, location.shelfCount); shelfIndex++) {
        for (let i = 0; i < Math.min(3, categoryProducts.length); i++) {
          const product = categoryProducts[i];
          const productId = productMap[product.name];

          await db.insert(planogramProducts).values({
            planogramId,
            productId,
            shelfLevel: shelfIndex,
            positionX: i * 300,
            facings: Math.floor(Math.random() * 3) + 1,
            quantity: Math.floor(Math.random() * 10) + 3,
          });
          productCount++;
        }
      }
    }

    console.log(`\n✅ ${planogramCount} planogramme(s) créé(s)`);
    console.log(`✅ ${productCount} produit(s) assigné(s)`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

seedPlanograms();
