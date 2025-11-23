import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'marjane',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const products = [
  { name: 'Coca-Cola 1.5L', price: 15, category: 'Boissons' },
  { name: 'Sprite 1.5L', price: 14, category: 'Boissons' },
  { name: 'Fanta Orange 1.5L', price: 13, category: 'Boissons' },
  { name: 'Eau Sidi Ali 1.5L', price: 4, category: 'Boissons' },
  { name: 'Riz Taureau 1kg', price: 25, category: 'Épicerie' },
  { name: 'Huile Lesieur 1L', price: 45, category: 'Épicerie' },
  { name: 'Sucre Cristal 1kg', price: 12, category: 'Épicerie' },
  { name: 'Shampoing Dove 400ml', price: 35, category: 'Hygiène' },
  { name: 'Déodorant Rexona 150ml', price: 22, category: 'Hygiène' },
  { name: 'Dentifrice Signal 100ml', price: 12, category: 'Hygiène' },
];

async function populateData() {
  const conn = await pool.getConnection();
  try {
    console.log('🔄 Remplissage des données réelles...\n');

    // 1. Créer les produits
    console.log('📦 Phase 1: Création des produits');
    const productIds = [];
    for (const product of products) {
      const [result] = await conn.query(
        'INSERT IGNORE INTO products (name, categoryId, price, description, imageUrl) VALUES (?, ?, ?, ?, ?)',
        [product.name, 1, product.price, `${product.name} - ${product.category}`, `https://via.placeholder.com/150?text=${encodeURIComponent(product.name)}`]
      );
      if (result.insertId) {
        productIds.push(result.insertId);
        console.log(`  ✅ ${product.name} créé`);
      }
    }

    // 2. Récupérer les planogrammes
    console.log('\n📦 Phase 2: Assignation des produits aux planogrammes');
    const [planograms] = await conn.query('SELECT id, locationId FROM planograms LIMIT 5');
    
    for (const planogram of planograms) {
      const [location] = await conn.query('SELECT name FROM planogramLocations WHERE id = ?', [planogram.locationId]);
      
      // Assigner 8-10 produits par planogramme
      for (let i = 0; i < Math.min(10, productIds.length); i++) {
        const shelfLevel = Math.floor(i / 3);
        const positionX = (i % 3) * 200;
        
        await conn.query(
          'INSERT IGNORE INTO planogramProducts (planogramId, productId, quantity, facings, shelfLevel, positionX, positionY, width, height) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [planogram.id, productIds[i], Math.floor(Math.random() * 20) + 5, Math.floor(Math.random() * 4) + 1, shelfLevel, positionX, shelfLevel * 150, 150, 100]
        );
      }
      console.log(`  ✅ Planogramme ${planogram.id} rempli avec ${Math.min(10, productIds.length)} produits`);
    }

    // 3. Insérer les données de ventes et stock
    console.log('\n📦 Phase 3: Insertion des données de ventes et stock');
    const [stores] = await conn.query('SELECT id FROM stores LIMIT 12');
    
    for (const store of stores) {
      for (const productId of productIds.slice(0, 5)) {
        // Données de ventes (30 jours)
        for (let day = 0; day < 30; day++) {
          const date = new Date();
          date.setDate(date.getDate() - day);
          const quantity = Math.floor(Math.random() * 50) + 10;
          const product = products[productIds.indexOf(productId)];
          const revenue = quantity * (product?.price || 20);
          
          await conn.query(
            'INSERT IGNORE INTO salesHistory (storeId, productId, quantity, revenue, soldAt) VALUES (?, ?, ?, ?, ?)',
            [store.id, productId, quantity, revenue, date]
          );
        }
        
        // Données de stock (7 jours)
        for (let day = 0; day < 7; day++) {
          const date = new Date();
          date.setDate(date.getDate() - day);
          const quantity = Math.floor(Math.random() * 100) + 20;
          
          await conn.query(
            'INSERT IGNORE INTO stockHistory (storeId, productId, quantity, reserved, available, recordedAt) VALUES (?, ?, ?, ?, ?, ?)',
            [store.id, productId, quantity, Math.floor(quantity * 0.1), Math.floor(quantity * 0.9), date]
          );
        }
      }
      console.log(`  ✅ Données de ventes et stock pour magasin ${store.id}`);
    }

    console.log('\n✨ Remplissage des données terminé!');
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await conn.release();
    await pool.end();
  }
}

populateData();
