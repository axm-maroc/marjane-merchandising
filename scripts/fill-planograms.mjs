import { execSync } from 'child_process';

// Créer un script pour remplir les planogrammes via l'API tRPC
const script = `
import { getDb } from '../server/db.ts';
import { planogramProducts, products as productsTable } from '../drizzle/schema.ts';

async function fillPlanograms() {
  const db = await getDb();
  if (!db) {
    console.error('Database not available');
    process.exit(1);
  }

  try {
    // Récupérer tous les produits
    const allProducts = await db.select().from(productsTable).limit(41);
    console.log(\`✅ \${allProducts.length} produits trouvés\`);

    // Récupérer tous les planogrammes
    const { planograms } = await import('../drizzle/schema.ts');
    const allPlanograms = await db.select().from(planograms).limit(10);
    console.log(\`✅ \${allPlanograms.length} planogrammes trouvés\`);

    // Assigner les produits aux planogrammes
    let assignedCount = 0;
    for (const planogram of allPlanograms) {
      // Assigner 8-10 produits par planogramme
      const productsPerPlanogram = Math.min(10, allProducts.length);
      
      for (let i = 0; i < productsPerPlanogram; i++) {
        const product = allProducts[i];
        const shelfLevel = Math.floor(i / 3);
        const positionX = (i % 3) * 200;
        
        await db.insert(planogramProducts).values({
          planogramId: planogram.id,
          productId: product.id,
          quantity: Math.floor(Math.random() * 20) + 5,
          facings: Math.floor(Math.random() * 4) + 1,
          shelfLevel,
          positionX,
          positionY: shelfLevel * 150,
          width: 150,
          height: 100,
        }).onConflictDoNothing();
        
        assignedCount++;
      }
      
      console.log(\`✅ Planogramme \${planogram.id} rempli avec \${productsPerPlanogram} produits\`);
    }

    console.log(\`\\n✨ Total: \${assignedCount} produits assignés aux planogrammes\`);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

fillPlanograms();
`;

// Écrire le script
execSync(`cat > /tmp/fill-planograms.ts << 'SCRIPT'
${script}
SCRIPT`, { stdio: 'inherit' });

console.log('✅ Script créé');
