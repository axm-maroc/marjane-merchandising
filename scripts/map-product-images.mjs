import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Mapping des images aux noms de produits
const imageMapping = {
  'coca-cola-1-5l.png': 'Coca-Cola 1.5L',
  'coca-cola-1.5l.jpg': 'Coca-Cola 1.5L',
  'fanta-orange-1-5l.png': 'Fanta Orange 1.5L',
  'fanta-orange-1.5l.jpg': 'Fanta Orange 1.5L',
  'eau-sidi-ali-1-5l.png': 'Eau Sidi Ali 1.5L',
  'sprite-1-5l.png': 'Sprite 1.5L',
  'dentifrice-signal-100ml.png': 'Dentifrice Signal 100ml',
  'deodorant-rexona-150ml.png': 'Déodorant Rexona 150ml',
  'farine-1kg.jpg': 'Farine 1kg',
  'huile-lesieur-1l.jpg': 'Huile Lesieur 1L',
  'lait-centrale-laitiere-1l.png': 'Lait Centrale Laitière 1L',
  'sucre-1kg.png': 'Sucre 1kg',
};

async function mapProductImages() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'marjane_merchandising',
  });

  try {
    console.log('📸 Mapping des images aux produits...');

    for (const [imageName, productName] of Object.entries(imageMapping)) {
      const photoUrl = `/products/${imageName}`;
      
      // Chercher le produit par nom
      const [products] = await connection.execute(
        'SELECT id FROM products WHERE name = ? LIMIT 1',
        [productName]
      );

      if (products.length > 0) {
        const productId = products[0].id;
        
        // Mettre à jour la photoUrl
        await connection.execute(
          'UPDATE products SET photoUrl = ?, photoFileKey = ? WHERE id = ?',
          [photoUrl, imageName, productId]
        );
        
        console.log(`✅ ${productName} → ${photoUrl}`);
      } else {
        console.log(`⚠️  Produit non trouvé : ${productName}`);
      }
    }

    console.log('\n✨ Mapping terminé !');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await connection.end();
  }
}

mapProductImages();
