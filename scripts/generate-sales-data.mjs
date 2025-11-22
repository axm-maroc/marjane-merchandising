import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  // Récupérer tous les magasins et produits
  const [stores] = await connection.execute('SELECT id FROM stores');
  const [products] = await connection.execute('SELECT id FROM products');

  console.log(`Génération de données de ventes pour ${stores.length} magasins et ${products.length} produits...`);

  // Générer des données de ventes réalistes (30 jours)
  const salesData = [];
  const today = new Date();

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    for (const store of stores) {
      for (const product of products) {
        // Générer des ventes réalistes basées sur des patterns
        const baseQuantity = Math.floor(Math.random() * 50) + 10;
        const dayOfWeek = date.getDay();
        
        // Augmenter les ventes le week-end
        const weekendMultiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 1.3 : 1;
        
        // Ajouter une tendance saisonnière
        const seasonalMultiplier = 1 + (Math.sin((i / 30) * Math.PI) * 0.2);
        
        const quantity = Math.floor(baseQuantity * weekendMultiplier * seasonalMultiplier);
        const confidence = 85 + Math.floor(Math.random() * 15);
        const revenue = quantity * (Math.floor(Math.random() * 10000) + 500);

        salesData.push({
          storeId: store.id,
          productId: product.id,
          forecastDate: date,
          predictedQuantity: quantity,
          predictedRevenue: revenue,
          confidence,
          algorithm: 'seasonal_pattern',
        });
      }
    }
  }

  // Insérer les données par batch
  const batchSize = 1000;
  for (let i = 0; i < salesData.length; i += batchSize) {
    const batch = salesData.slice(i, i + batchSize);
    
    const values = batch.map(d => {
      const dateStr = d.forecastDate.toISOString().replace('T', ' ').substring(0, 19);
      return `(${d.storeId}, ${d.productId}, NULL, '${dateStr}', ${d.predictedQuantity}, ${d.predictedRevenue}, ${d.confidence}, '${d.algorithm}')`;
    }).join(',');

    await connection.execute(
      `INSERT INTO salesForecasts (storeId, productId, planogramId, forecastDate, predictedQuantity, predictedRevenue, confidence, algorithm) 
       VALUES ${values}`
    );

    console.log(`Inséré ${Math.min(i + batchSize, salesData.length)}/${salesData.length} enregistrements`);
  }

  console.log(`✅ ${salesData.length} enregistrements de ventes générés avec succès!`);

} catch (error) {
  console.error('Erreur:', error.message);
} finally {
  await connection.end();
}
