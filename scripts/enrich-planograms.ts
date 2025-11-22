import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../drizzle/schema";
import { eq } from "drizzle-orm";

const pool = mysql.createPool({
  host: process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] || "localhost",
  user: process.env.DATABASE_URL?.split("://")[1]?.split(":")[0] || "root",
  password: process.env.DATABASE_URL?.split(":")[2]?.split("@")[0] || "",
  database: process.env.DATABASE_URL?.split("/").pop() || "marjane",
});

const db = drizzle(pool);

const productsByCategory: Record<string, any[]> = {
  boissons: [
    { name: "Coca-Cola 1.5L", price: 15, quantity: 8, facings: 3 },
    { name: "Sprite 1.5L", price: 14, quantity: 8, facings: 3 },
    { name: "Fanta Orange 1.5L", price: 13, quantity: 6, facings: 2 },
    { name: "Eau Sidi Ali 1.5L", price: 4, quantity: 15, facings: 5 },
    { name: "Jus Tropicana 1L", price: 18, quantity: 5, facings: 2 },
  ],
  epicerie: [
    { name: "Riz Taureau 1kg", price: 25, quantity: 12, facings: 4 },
    { name: "Huile Lesieur 1L", price: 45, quantity: 8, facings: 2 },
    { name: "Sucre Cristal 1kg", price: 12, quantity: 10, facings: 3 },
    { name: "Farine Tamawine 1kg", price: 8, quantity: 15, facings: 5 },
    { name: "Pâtes Barilla 500g", price: 20, quantity: 10, facings: 3 },
  ],
  hygiene: [
    { name: "Shampoing Dove 400ml", price: 35, quantity: 6, facings: 2 },
    { name: "Déodorant Rexona 150ml", price: 22, quantity: 8, facings: 3 },
    { name: "Dentifrice Signal 100ml", price: 12, quantity: 12, facings: 4 },
    { name: "Savon Lux 125g", price: 8, quantity: 20, facings: 6 },
    { name: "Lessive Ariel 2L", price: 55, quantity: 5, facings: 2 },
  ],
  laiterie: [
    { name: "Lait Président 1L", price: 18, quantity: 10, facings: 3 },
    { name: "Yaourt Danone 125g", price: 6, quantity: 20, facings: 6 },
    { name: "Fromage Président 200g", price: 28, quantity: 8, facings: 2 },
    { name: "Beurre Président 250g", price: 32, quantity: 6, facings: 2 },
  ],
};

async function enrichPlanograms() {
  try {
    console.log("🔄 Enrichissement des planogrammes avec données réalistes...");

    const planograms = await db.select().from(schema.planograms);
    console.log(`📊 ${planograms.length} planogrammes trouvés`);

    let productsAdded = 0;

    for (const planogram of planograms) {
      const location = await db
        .select()
        .from(schema.planogramLocations)
        .where(eq(schema.planogramLocations.id, planogram.locationId))
        .limit(1);

      if (!location || location.length === 0) continue;

      let category = "boissons";
      if (location[0].name.toLowerCase().includes("epicerie")) category = "epicerie";
      else if (location[0].name.toLowerCase().includes("hygiene")) category = "hygiene";
      else if (location[0].name.toLowerCase().includes("laiterie")) category = "laiterie";

      const products = productsByCategory[category] || productsByCategory.boissons;

      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        
        const existingProducts = await db
          .select()
          .from(schema.products)
          .where(eq(schema.products.name, product.name))
          .limit(1);

        let productId;
        if (existingProducts && existingProducts.length > 0) {
          productId = existingProducts[0].id;
        } else {
          const result = await db.insert(schema.products).values({
            name: product.name,
            categoryId: 1,
            price: product.price,
            description: `Produit ${product.name}`,
            imageUrl: `https://via.placeholder.com/150?text=${encodeURIComponent(product.name)}`,
          });
          productId = (result as any).insertId;
        }

        const existingPlanogramProduct = await db
          .select()
          .from(schema.planogramProducts)
          .where(
            eq(schema.planogramProducts.planogramId, planogram.id)
          )
          .limit(1);

        if (!existingPlanogramProduct || existingPlanogramProduct.length === 0) {
          const shelfLevel = Math.floor(i / 3);
          const positionX = (i % 3) * 200;
          
          await db.insert(schema.planogramProducts).values({
            planogramId: planogram.id,
            productId: productId,
            quantity: product.quantity,
            facings: product.facings,
            shelfLevel: shelfLevel,
            positionX: positionX,
            positionY: shelfLevel * 150,
            width: 150,
            height: 100,
          });
          
          productsAdded++;
        }
      }

      console.log(`✅ Planogramme "${planogram.name}" enrichi`);
    }

    console.log(`\n📦 Total: ${productsAdded} produits ajoutés`);
    console.log("✨ Enrichissement terminé!");
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur:", error);
    await pool.end();
    process.exit(1);
  }
}

enrichPlanograms();
