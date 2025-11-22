import { getDb } from '../server/db.ts';
import { stores } from '../drizzle/schema.ts';
import { eq, like } from 'drizzle-orm';

async function cleanTestStores() {
  try {
    const db = await getDb();
    if (!db) {
      console.error('❌ Impossible de se connecter à la base de données');
      process.exit(1);
    }

    // Récupérer tous les magasins de test
    const testStores = await db
      .select()
      .from(stores)
      .where(like(stores.name, '%Test Store Filters%'));

    console.log(`📊 Magasins de test trouvés: ${testStores.length}`);
    testStores.forEach(store => {
      console.log(`  - ${store.id}: ${store.name}`);
    });

    if (testStores.length === 0) {
      console.log('✅ Aucun magasin de test à supprimer');
      process.exit(0);
    }

    // Supprimer les magasins de test
    for (const testStore of testStores) {
      await db.delete(stores).where(eq(stores.id, testStore.id));
      console.log(`✅ Supprimé: ${testStore.name} (ID: ${testStore.id})`);
    }

    console.log(`\n✅ ${testStores.length} magasin(s) de test supprimé(s)`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

cleanTestStores();
