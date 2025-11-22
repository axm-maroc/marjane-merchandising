import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "marjane",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const db = drizzle(pool);

// Produits réalistes par catégorie
const productCategories = {
  boissons: [
    { name: "Coca-Cola 1.5L", price: 15, margin: 0.25 },
    { name: "Sprite 1.5L", price: 14, margin: 0.25 },
    { name: "Fanta Orange 1.5L", price: 13, margin: 0.25 },
    { name: "Eau Sidi Ali 1.5L", price: 4, margin: 0.30 },
    { name: "Jus Tropicana 1L", price: 18, margin: 0.20 },
    { name: "Café Nescafé 200g", price: 45, margin: 0.35 },
    { name: "Thé Lipton 25 sachets", price: 22, margin: 0.40 },
  ],
  epicerie: [
    { name: "Riz Taureau 1kg", price: 25, margin: 0.20 },
    { name: "Huile Lesieur 1L", price: 45, margin: 0.15 },
    { name: "Sucre Cristal 1kg", price: 12, margin: 0.25 },
    { name: "Farine Tamawine 1kg", price: 8, margin: 0.30 },
    { name: "Pâtes Barilla 500g", price: 20, margin: 0.25 },
    { name: "Lentilles Corail 1kg", price: 28, margin: 0.22 },
    { name: "Pois Chiches 1kg", price: 24, margin: 0.23 },
  ],
  hygiene: [
    { name: "Shampoing Dove 400ml", price: 35, margin: 0.40 },
    { name: "Déodorant Rexona 150ml", price: 22, margin: 0.45 },
    { name: "Dentifrice Signal 100ml", price: 12, margin: 0.50 },
    { name: "Savon Lux 125g", price: 8, margin: 0.55 },
    { name: "Lessive Ariel 2L", price: 55, margin: 0.30 },
    { name: "Gel Douche Palmolive 250ml", price: 18, margin: 0.48 },
    { name: "Papier Toilette Lotus 4 rouleaux", price: 14, margin: 0.35 },
  ],
  laiterie: [
    { name: "Lait Président 1L", price: 18, margin: 0.25 },
    { name: "Yaourt Danone 125g", price: 6, margin: 0.35 },
    { name: "Fromage Président 200g", price: 28, margin: 0.30 },
    { name: "Beurre Président 250g", price: 32, margin: 0.28 },
    { name: "Crème Fraîche 200ml", price: 12, margin: 0.32 },
  ],
};

async function seedRealisticData() {
  try {
    console.log("🔄 Ajout des données réalistes massives...\n");

    // 1. Créer/récupérer les catégories
    console.log("📦 Phase 1: Catégories de produits");
    const categories = await db.select().from(schema.productCategories);
    console.log(`✅ ${categories.length} catégories trouvées\n`);

    // 2. Créer les produits
    console.log("📦 Phase 2: Création des produits");
    let productsCreated = 0;
    const productMap: Record<string, number> = {};

    for (const [categoryName, products] of Object.entries(productCategories)) {
      for (const product of products) {
        const existing = await db
          .select()
          .from(schema.products)
          .where(eq(schema.products.name, product.name))
          .limit(1);

        if (!existing || existing.length === 0) {
          const result = await db.insert(schema.products).values({
            name: product.name,
            categoryId: categories[0]?.id || 1,
            price: product.price,
            description: `Produit ${product.name} - Catégorie ${categoryName}`,
            imageUrl: `https://via.placeholder.com/200?text=${encodeURIComponent(product.name)}`,
          });
          productMap[product.name] = (result as any).insertId;
          productsCreated++;
        } else {
          productMap[product.name] = existing[0].id;
        }
      }
    }
    console.log(`✅ ${productsCreated} nouveaux produits créés\n`);

    // 3. Ajouter les produits aux planogrammes
    console.log("📦 Phase 3: Assignation des produits aux planogrammes");
    const planograms = await db.select().from(schema.planograms);
    let productsAssigned = 0;

    for (const planogram of planograms) {
      const location = await db
        .select()
        .from(schema.planogramLocations)
        .where(eq(schema.planogramLocations.id, planogram.locationId))
        .limit(1);

      if (!location || location.length === 0) continue;

      // Déterminer la catégorie
      let categoryKey = "boissons";
      if (location[0].name.toLowerCase().includes("epicerie")) categoryKey = "epicerie";
      else if (location[0].name.toLowerCase().includes("hygiene")) categoryKey = "hygiene";
      else if (location[0].name.toLowerCase().includes("laiterie")) categoryKey = "laiterie";

      const categoryProducts = productCategories[categoryKey as keyof typeof productCategories] || productCategories.boissons;

      for (let i = 0; i < categoryProducts.length; i++) {
        const product = categoryProducts[i];
        const productId = productMap[product.name];

        if (!productId) continue;

        const existing = await db
          .select()
          .from(schema.planogramProducts)
          .where(
            and(
              eq(schema.planogramProducts.planogramId, planogram.id),
              eq(schema.planogramProducts.productId, productId)
            )
          )
          .limit(1);

        if (!existing || existing.length === 0) {
          const shelfLevel = Math.floor(i / 3);
          const positionX = (i % 3) * 200;

          await db.insert(schema.planogramProducts).values({
            planogramId: planogram.id,
            productId: productId,
            quantity: Math.floor(Math.random() * 20) + 5,
            facings: Math.floor(Math.random() * 4) + 1,
            shelfLevel: shelfLevel,
            positionX: positionX,
            positionY: shelfLevel * 150,
            width: 150,
            height: 100,
          });

          productsAssigned++;
        }
      }
    }
    console.log(`✅ ${productsAssigned} produits assignés aux planogrammes\n`);

    // 4. Ajouter l'historique de stock
    console.log("📦 Phase 4: Historique de stock");
    const stores = await db.select().from(schema.stores);
    let stockRecordsCreated = 0;

    for (const store of stores) {
      for (const productName of Object.keys(productMap)) {
        const productId = productMap[productName];
        const now = new Date();

        // Créer 7 jours d'historique
        for (let day = 0; day < 7; day++) {
          const date = new Date(now);
          date.setDate(date.getDate() - day);

          const quantity = Math.floor(Math.random() * 100) + 10;
          const reserved = Math.floor(quantity * 0.1);

          await db.insert(schema.stockHistory).values({
            storeId: store.id,
            productId: productId,
            quantity: quantity,
            reserved: reserved,
            available: quantity - reserved,
            recordedAt: date,
          });

          stockRecordsCreated++;
        }
      }
    }
    console.log(`✅ ${stockRecordsCreated} enregistrements d'historique créés\n`);

    // 5. Ajouter les données de ventes
    console.log("📦 Phase 5: Données de ventes");
    let salesRecordsCreated = 0;

    for (const store of stores) {
      for (const productName of Object.keys(productMap)) {
        const productId = productMap[productName];
        const now = new Date();

        // Créer 30 jours de ventes
        for (let day = 0; day < 30; day++) {
          const date = new Date(now);
          date.setDate(date.getDate() - day);

          const quantity = Math.floor(Math.random() * 50) + 5;
          const product = Object.values(productCategories)
            .flat()
            .find(p => p.name === productName);

          if (product) {
            const revenue = quantity * product.price;

            await db.insert(schema.salesHistory).values({
              storeId: store.id,
              productId: productId,
              quantity: quantity,
              revenue: revenue,
              soldAt: date,
            });

            salesRecordsCreated++;
          }
        }
      }
    }
    console.log(`✅ ${salesRecordsCreated} enregistrements de ventes créés\n`);

    console.log("✨ Enrichissement des données terminé!");
    console.log("\n📊 Résumé:");
    console.log(`   - ${productsCreated} nouveaux produits`);
    console.log(`   - ${productsAssigned} assignations produit/planogramme`);
    console.log(`   - ${stockRecordsCreated} enregistrements d'historique`);
    console.log(`   - ${salesRecordsCreated} enregistrements de ventes`);

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur:", error);
    await pool.end();
    process.exit(1);
  }
}

seedRealisticData();
