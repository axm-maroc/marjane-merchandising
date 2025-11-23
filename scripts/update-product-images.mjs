#!/usr/bin/env node

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Mapping des images aux noms de produits
const imageMapping = {
  'Coca-Cola 1.5L': '/products/coca-cola-1-5l.png',
  'Sprite 1.5L': '/products/sprite-1-5l.png',
  'Fanta Orange 1.5L': '/products/fanta-orange-1-5l.png',
  'Eau Sidi Ali 1.5L': '/products/eau-sidi-ali-1-5l.png',
  'Jus Tropicana 1L': '/products/jus-tropicana-1l.png',
  'Lait Centrale Laitière 1L': '/products/lait-centrale-laitiere-1l.png',
  'Yaourt Danone 500g': '/products/yaourt-danone-500g.png',
  'Fromage Président 200g': '/products/fromage-president-200g.png',
  'Riz Oncle Ben\'s 1kg': '/products/riz-oncle-bens-1kg.png',
  'Farine Moulin Rouge 1kg': '/products/farine-1kg.jpg',
  'Sucre Cristal 1kg': '/products/sucre-1kg.png',
  'Huile Lesieur 1L': '/products/huile-lesieur-1l.jpg',
  'Dentifrice Signal 100ml': '/products/dentifrice-signal-100ml.png',
  'Déodorant Rexona 150ml': '/products/deodorant-rexona-150ml.png',
  'Savon Palmolive 100g': '/products/savon-palmolive-100g.png',
  'Shampoing Head & Shoulders 400ml': '/products/shampoing-head-shoulders-400ml.png',
  'Gel Douche Dove 250ml': '/products/gel-douche-dove-250ml.png',
  'Produit Nettoyant Ajax 500ml': '/products/produit-nettoyant-ajax-500ml.png',
  'Lessive Persil 2L': '/products/lessive-persil-2l.png',
  'Papier Toilette Lotus 12 rouleaux': '/products/papier-toilette-lotus-12.png',
};

async function updateProductImages() {
  let connection;
  try {
    // Utiliser DATABASE_URL si disponible
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      connection = await mysql.createConnection(dbUrl);
    } else {
      connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'marjane_merchandising',
      });
    }

    console.log('📸 Mise à jour des images des produits...\n');

    let updated = 0;
    let notFound = 0;

    for (const [productName, photoUrl] of Object.entries(imageMapping)) {
      try {
        // Chercher le produit par nom
        const [products] = await connection.execute(
          'SELECT id, name FROM products WHERE name = ? LIMIT 1',
          [productName]
        );

        if (products.length > 0) {
          const productId = products[0].id;
          
          // Mettre à jour la photoUrl
          await connection.execute(
            'UPDATE products SET photoUrl = ? WHERE id = ?',
            [photoUrl, productId]
          );
          
          console.log(`✅ ${productName}`);
          console.log(`   → ${photoUrl}\n`);
          updated++;
        } else {
          console.log(`⚠️  Produit non trouvé : ${productName}\n`);
          notFound++;
        }
      } catch (error) {
        console.error(`❌ Erreur pour ${productName}:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✨ Mise à jour terminée !`);
    console.log(`   ✅ ${updated} produits mis à jour`);
    console.log(`   ⚠️  ${notFound} produits non trouvés`);
    console.log('='.repeat(60));
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

updateProductImages();
