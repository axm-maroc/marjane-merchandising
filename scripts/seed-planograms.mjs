import { getDb } from '../server/db.ts';
import { planograms, planogramProducts, planogramLocations } from '../drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const SAMPLE_PRODUCTS = [
  { name: 'Coca-Cola 1.5L', category: 'Boissons', price: 25 },
  { name: 'Fanta Orange 1.5L', category: 'Boissons', price: 22 },
  { name: 'Sprite 1.5L', category: 'Boissons', price: 22 },
  { name: 'Eau Minérale 1.5L', category: 'Boissons', price: 8 },
  { name: 'Jus Orange 1L', category: 'Boissons', price: 15 },
  { name: 'Lait Entier 1L', category: 'Produits Laitiers', price: 12 },
  { name: 'Yaourt Nature 500g', category: 'Produits Laitiers', price: 10 },
  { name: 'Fromage Blanc 500g', category: 'Produits Laitiers', price: 14 },
  { name: 'Beurre 250g', category: 'Produits Laitiers', price: 18 },
  { name: 'Dentifrice Colgate 75ml', category: 'Hygiène', price: 15 },
  { name: 'Savon Dove 100g', category: 'Hygiène', price: 12 },
  { name: 'Shampoing Pantène 400ml', category: 'Hygiène', price: 20 },
  { name: 'Déodorant Rexona 150ml', category: 'Hygiène', price: 18 },
  { name: 'Lessive Persil 2L', category: 'Entretien', price: 35 },
  { name: 'Nettoyant Vitrex 750ml', category: 'Entretien', price: 12 },
  { name: 'Savon Noir 1L', category: 'Entretien', price: 15 },
];

async function seedPlanograms() {
  try {
    const db = await getDb();
    if (!db) {
      console.error('❌ Impossible de se connecter à la base de données');
      process.exit(1);
    }

    // Récupérer les emplacements
    const locations = await db.select().from(planogramLocations);
    console.log(`📊 ${locations.length} emplacement(s) trouvé(s)`);

    if (locations.length === 0) {
      console.log('⚠️ Aucun emplacement disponible pour créer des planogrammes');
      process.exit(0);
    }

    let planogramCount = 0;
    let productCount = 0;

    // Créer des planogrammes pour chaque emplacement
    for (const location of locations) {
      // Vérifier si un planogramme existe déjà
      const existing = await db
        .select()
        .from(planograms)
        .where(eq(planograms.locationId, location.id));

      if (existing.length > 0) {
        console.log(`⏭️ Emplacement ${location.name} a déjà un planogramme`);
        continue;
      }

      // Créer un planogramme
      const category = SAMPLE_PRODUCTS[Math.floor(Math.random() * SAMPLE_PRODUCTS.length)].category;
      const planogramName = `Planogramme ${category} - ${location.name}`;

      const [inserted] = await db.insert(planograms).values({
        locationId: location.id,
        name: planogramName,
        description: `Planogramme optimisé pour ${category} - ${location.shelfCount} étagères`,
        status: 'active',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const planogramId = inserted.insertId;
      console.log(`✅ Créé: ${planogramName} (ID: ${planogramId})`);
      planogramCount++;

      // Ajouter des produits au planogramme
      const categoryProducts = SAMPLE_PRODUCTS.filter(p => p.category === category);
      const productsToAdd = categoryProducts.slice(0, Math.min(4, categoryProducts.length));

      for (let shelfIndex = 0; shelfIndex < location.shelfCount; shelfIndex++) {
        for (let i = 0; i < productsToAdd.length; i++) {
          const product = productsToAdd[i];
          const positionX = i * (location.shelfWidth / productsToAdd.length);
          const positionY = shelfIndex * (location.shelfHeight / location.shelfCount);

          await db.insert(planogramProducts).values({
            planogramId,
            productName: product.name,
            category: product.category,
            quantity: Math.floor(Math.random() * 10) + 3,
            positionX: Math.round(positionX),
            positionY: Math.round(positionY),
            width: Math.round(location.shelfWidth / productsToAdd.length - 10),
            height: Math.round(location.shelfHeight / location.shelfCount - 10),
            faceCount: Math.floor(Math.random() * 3) + 1,
            status: 'active',
          });
          productCount++;
        }
      }
    }

    console.log(`\n✅ ${planogramCount} planogramme(s) créé(s)`);
    console.log(`✅ ${productCount} produit(s) ajouté(s) aux planogrammes`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

seedPlanograms();
