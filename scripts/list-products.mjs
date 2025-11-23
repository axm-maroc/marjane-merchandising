#!/usr/bin/env node

import mysql from 'mysql2/promise';

async function listProducts() {
  let connection;
  try {
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

    const [products] = await connection.execute(
      'SELECT id, name, photoUrl FROM products ORDER BY name'
    );

    console.log('\n📦 Produits en base de données:\n');
    console.log('ID | Nom | Photo URL');
    console.log('-'.repeat(80));
    
    products.forEach(p => {
      const photoStatus = p.photoUrl ? '✅' : '❌';
      console.log(`${p.id} | ${p.name} | ${photoStatus} ${p.photoUrl || 'N/A'}`);
    });

    console.log(`\nTotal: ${products.length} produits`);
    console.log(`Avec image: ${products.filter(p => p.photoUrl).length}`);
    console.log(`Sans image: ${products.filter(p => !p.photoUrl).length}\n`);

    await connection.end();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

listProducts();
