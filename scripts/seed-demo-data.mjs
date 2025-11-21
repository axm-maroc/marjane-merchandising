import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { stores, storeZones, zoneSponsors, planogramLocations, planograms, products, productCategories, stockHistory } from "../drizzle/schema.ts";

// Données réelles des magasins Marjane au Maroc
const realMarjaneStores = [
  {
    name: "Marjane Bouregreg",
    address: "Avenue Annakhil, Hay Riad",
    city: "Rabat",
    latitude: 33.9716,
    longitude: -6.8498,
    surface: 8500,
    phone: "+212 537-71-71-71",
    managerName: "Ahmed Bennani"
  },
  {
    name: "Marjane Californie",
    address: "Boulevard Moulay Youssef, Aïn Chock",
    city: "Casablanca",
    latitude: 33.5731,
    longitude: -7.5898,
    surface: 7200,
    phone: "+212 522-98-98-98",
    managerName: "Fatima Alaoui"
  },
  {
    name: "Marjane Hay Riad",
    address: "Angle Boulevard de la Corniche, Aïn Diab",
    city: "Casablanca",
    latitude: 33.6061,
    longitude: -7.6331,
    surface: 6800,
    phone: "+212 522-79-79-79",
    managerName: "Karim El Fassi"
  },
  {
    name: "Marjane Derb Sultan",
    address: "Boulevard Zerktouni, Centre Ville",
    city: "Casablanca",
    latitude: 33.5892,
    longitude: -7.6114,
    surface: 5500,
    phone: "+212 522-44-44-44",
    managerName: "Nadia Tazi"
  },
  {
    name: "Marjane Menara",
    address: "Avenue Mohammed VI",
    city: "Marrakech",
    latitude: 31.6295,
    longitude: -8.0089,
    surface: 7500,
    phone: "+212 524-33-33-33",
    managerName: "Hassan Berrada"
  },
  {
    name: "Marjane Targa",
    address: "Route de Safi, Quartier Targa",
    city: "Marrakech",
    latitude: 31.6369,
    longitude: -8.0463,
    surface: 6200,
    phone: "+212 524-38-38-38",
    managerName: "Samira Idrissi"
  },
  {
    name: "Marjane Agdal",
    address: "Boulevard Allal El Fassi",
    city: "Fès",
    latitude: 34.0181,
    longitude: -5.0078,
    surface: 6500,
    phone: "+212 535-65-65-65",
    managerName: "Youssef Benkirane"
  },
  {
    name: "Marjane Founty",
    address: "Avenue Mohammed V, Baie d'Agadir",
    city: "Agadir",
    latitude: 30.4278,
    longitude: -9.5981,
    surface: 7000,
    phone: "+212 528-82-82-82",
    managerName: "Rachid Amrani"
  },
  {
    name: "Marjane Tanger City Center",
    address: "Route de Tétouan, Quartier Bakhti",
    city: "Tanger",
    latitude: 35.7595,
    longitude: -5.8340,
    surface: 6800,
    phone: "+212 539-34-34-34",
    managerName: "Laila Chaoui"
  },
  {
    name: "Marjane Oujda",
    address: "Boulevard Derfoufi",
    city: "Oujda",
    latitude: 34.6867,
    longitude: -1.9114,
    surface: 5800,
    phone: "+212 536-68-68-68",
    managerName: "Mohamed Tahiri"
  },
  {
    name: "Marjane Meknès",
    address: "Avenue des FAR, Hamria",
    city: "Meknès",
    latitude: 33.8731,
    longitude: -5.5407,
    surface: 6000,
    phone: "+212 535-52-52-52",
    managerName: "Amina Benjelloun"
  },
  {
    name: "Marjane Tétouan",
    address: "Avenue Youssef Ibn Tachfine",
    city: "Tétouan",
    latitude: 35.5889,
    longitude: -5.3626,
    surface: 5200,
    phone: "+212 539-96-96-96",
    managerName: "Omar Kettani"
  }
];

// Zones types pour un hypermarché
const zoneTemplates = [
  { code: "ENT", name: "Zone Entrée", surface: 120, isSponsored: true },
  { code: "FRL", name: "Produits Frais & Laitiers", surface: 250, isSponsored: false },
  { code: "EPI", name: "Épicerie Salée", surface: 300, isSponsored: true },
  { code: "BOI", name: "Boissons", surface: 180, isSponsored: true },
  { code: "HYG", name: "Hygiène & Beauté", surface: 200, isSponsored: true },
  { code: "ENT-M", name: "Entretien Maison", surface: 150, isSponsored: false },
  { code: "TEX", name: "Textile & Mode", surface: 220, isSponsored: false },
  { code: "ELE", name: "Électroménager", surface: 180, isSponsored: false },
  { code: "BAZ", name: "Bazar & Décoration", surface: 160, isSponsored: false },
  { code: "CAI", name: "Caisse & Sortie", surface: 100, isSponsored: false }
];

// Fournisseurs sponsors réels au Maroc
const sponsors = [
  { name: "Coca-Cola Maroc", logo: "https://logo.clearbit.com/coca-cola.com" },
  { name: "Centrale Laitière (Danone)", logo: "https://logo.clearbit.com/danone.com" },
  { name: "Unilever Maghreb", logo: "https://logo.clearbit.com/unilever.com" },
  { name: "Procter & Gamble Maroc", logo: "https://logo.clearbit.com/pg.com" },
  { name: "Nestlé Maroc", logo: "https://logo.clearbit.com/nestle.com" },
  { name: "L'Oréal Maroc", logo: "https://logo.clearbit.com/loreal.com" },
  { name: "Henkel Maroc", logo: "https://logo.clearbit.com/henkel.com" }
];

// Catégories et produits types avec URLs de vraies photos
const productCategoriesData = [
  { 
    name: "Boissons", 
    products: [
      { name: "Coca-Cola 1.5L", photo: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=400&fit=crop" },
      { name: "Eau minérale Sidi Ali 1.5L", photo: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=400&fit=crop" },
      { name: "Jus d'orange Tropicana 1L", photo: "https://images.unsplash.com/photo-1600271886742-f049cd1f3033?w=400&h=400&fit=crop" },
      { name: "Sprite 1.5L", photo: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400&h=400&fit=crop" },
      { name: "Fanta Orange 1.5L", photo: "https://images.unsplash.com/photo-1624517452488-04869289c4ca?w=400&h=400&fit=crop" }
    ] 
  },
  { 
    name: "Produits Laitiers", 
    products: [
      { name: "Lait Centrale Laitière 1L", photo: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=400&fit=crop" },
      { name: "Yaourt Danone Nature", photo: "https://images.unsplash.com/photo-1488477181946-6428a0291840?w=400&h=400&fit=crop" },
      { name: "Fromage Vache qui rit", photo: "https://images.unsplash.com/photo-1618164436241-4473940d1f5c?w=400&h=400&fit=crop" },
      { name: "Beurre Président", photo: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&h=400&fit=crop" },
      { name: "Crème fraîche", photo: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400&h=400&fit=crop" }
    ] 
  },
  { 
    name: "Épicerie", 
    products: [
      { name: "Huile Lesieur 1L", photo: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop" },
      { name: "Riz Taureau 1kg", photo: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop" },
      { name: "Pâtes Tria", photo: "https://images.unsplash.com/photo-1551462147-37cbd8ab0d9d?w=400&h=400&fit=crop" },
      { name: "Sucre Cosumar 1kg", photo: "https://images.unsplash.com/photo-1518264803984-e4a3e5c0f3ce?w=400&h=400&fit=crop" },
      { name: "Farine 1kg", photo: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400&h=400&fit=crop" }
    ] 
  },
  { 
    name: "Hygiène", 
    products: [
      { name: "Shampoing Dove", photo: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&h=400&fit=crop" },
      { name: "Savon Lux", photo: "https://images.unsplash.com/photo-1600857544200-b5e6e6c6b600?w=400&h=400&fit=crop" },
      { name: "Dentifrice Signal", photo: "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400&h=400&fit=crop" },
      { name: "Gel douche Palmolive", photo: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop" },
      { name: "Déodorant Rexona", photo: "https://images.unsplash.com/photo-1615397349754-cfa2066a298e?w=400&h=400&fit=crop" }
    ] 
  },
  { 
    name: "Entretien", 
    products: [
      { name: "Lessive Ariel", photo: "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=400&h=400&fit=crop" },
      { name: "Liquide vaisselle Paic", photo: "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&h=400&fit=crop" },
      { name: "Javel Lacroix", photo: "https://images.unsplash.com/photo-1585421514738-01798e348b17?w=400&h=400&fit=crop" },
      { name: "Éponges Spontex", photo: "https://images.unsplash.com/photo-1585421514738-01798e348b17?w=400&h=400&fit=crop" },
      { name: "Sacs poubelle", photo: "https://images.unsplash.com/photo-1604187351574-c75ca79f5807?w=400&h=400&fit=crop" }
    ] 
  }
];

async function seedDemoData() {
  console.log("🚀 Démarrage de la génération de données de démonstration...\n");

  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection, { mode: "default" });

  try {
    // 1. Créer les magasins
    console.log("📍 Création des magasins Marjane...");
    const storeIds = [];
    for (const store of realMarjaneStores) {
      const [result] = await db.insert(stores).values(store);
      storeIds.push(result.insertId);
      console.log(`   ✓ ${store.name} - ${store.city}`);
    }

    // 2. Créer les catégories de produits
    console.log("\n📦 Création des catégories de produits...");
    const categoryIds = {};
    for (const category of productCategoriesData) {
      const [result] = await db.insert(productCategories).values({
        name: category.name,
        description: `Catégorie ${category.name}`
      });
      categoryIds[category.name] = result.insertId;
      console.log(`   ✓ ${category.name}`);
    }

    // 3. Créer les produits
    console.log("\n🛒 Création des produits...");
    const productIds = [];
    for (const category of productCategoriesData) {
      for (const product of category.products) {
        const productName = typeof product === 'string' ? product : product.name;
        const photoUrl = typeof product === 'string' ? `https://picsum.photos/seed/${productName.replace(/\s+/g, '-')}/400/400` : product.photo;
        const [result] = await db.insert(products).values({
          sku: `SKU-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          name: productName,
          brand: productName.split(' ')[0],
          categoryId: categoryIds[category.name],
          description: `Produit ${productName}`,
          photoUrl: photoUrl,
          unitPrice: Math.floor(Math.random() * 50) + 10,
          barcode: `${Math.floor(Math.random() * 9000000000000) + 1000000000000}`,
          weight: Math.floor(Math.random() * 2000) + 100,
          width: Math.floor(Math.random() * 20) + 5,
          height: Math.floor(Math.random() * 20) + 5,
          depth: Math.floor(Math.random() * 30) + 10
        });
        productIds.push(result.insertId);
      }
    }
    console.log(`   ✓ ${productIds.length} produits créés`);

    // 4. Pour chaque magasin, créer zones, emplacements et planogrammes
    console.log("\n🏢 Création des zones, emplacements et planogrammes...");
    let totalZones = 0;
    let totalLocations = 0;
    let totalPlanograms = 0;
    let totalSponsors = 0;

    for (let i = 0; i < storeIds.length; i++) {
      const storeId = storeIds[i];
      const storeName = realMarjaneStores[i].name;
      console.log(`\n   ${storeName}:`);

      // Créer les zones
      const zoneIds = [];
      let xOffset = 50;
      let yOffset = 50;

      for (const zoneTemplate of zoneTemplates) {
        const width = Math.floor(Math.random() * 150) + 200;
        const height = Math.floor(Math.random() * 100) + 150;

        const [zoneResult] = await db.insert(storeZones).values({
          storeId,
          code: zoneTemplate.code,
          name: zoneTemplate.name,
          x: xOffset,
          y: yOffset,
          width,
          height,
          surface: zoneTemplate.surface,
          isSponsored: zoneTemplate.isSponsored,
          status: "active"
        });
        zoneIds.push({ id: zoneResult.insertId, ...zoneTemplate });
        totalZones++;

        // Créer un contrat de sponsoring si la zone est sponsorisée
        if (zoneTemplate.isSponsored && Math.random() > 0.3) {
          const sponsor = sponsors[Math.floor(Math.random() * sponsors.length)];
          const startDate = new Date();
          startDate.setMonth(startDate.getMonth() - Math.floor(Math.random() * 6));
          const endDate = new Date(startDate);
          endDate.setMonth(endDate.getMonth() + 12);

          await db.insert(zoneSponsors).values({
            zoneId: zoneResult.insertId,
            supplierName: sponsor.name,
            supplierLogo: sponsor.logo,
            contractAmount: Math.floor(Math.random() * 50000) + 20000,
            startDate,
            endDate,
            status: "active",
            contactName: `Contact ${sponsor.name.split(' ')[0]}`,
            contactEmail: `contact@${sponsor.name.toLowerCase().replace(/\s+/g, '')}.ma`,
            contactPhone: `+212 ${Math.floor(Math.random() * 900000000) + 100000000}`
          });
          totalSponsors++;
        }

        // Positionner pour la prochaine zone
        xOffset += width + 30;
        if (xOffset > 1000) {
          xOffset = 50;
          yOffset += height + 30;
        }
      }

      // Créer 15-25 emplacements par magasin
      const numLocations = Math.floor(Math.random() * 11) + 15;
      for (let j = 0; j < numLocations; j++) {
        const zone = zoneIds[Math.floor(Math.random() * zoneIds.length)];
        const posX = zone.x ? Math.floor(Math.random() * (zone.width - 80)) + zone.x + 20 : null;
        const posY = zone.y ? Math.floor(Math.random() * (zone.height - 60)) + zone.y + 20 : null;

        const [locationResult] = await db.insert(planogramLocations).values({
          storeId,
          name: `Emplacement ${zone.code}-${j + 1}`,
          shelfCount: Math.floor(Math.random() * 4) + 3,
          zoneId: zone.id,
          positionX: posX,
          positionY: posY
        });
        totalLocations++;

        // Créer un planogramme pour cet emplacement (80% de chance)
        if (Math.random() > 0.2) {
          const statuses = ['draft', 'active', 'active', 'active', 'archived']; // Plus d'actifs
          const status = statuses[Math.floor(Math.random() * statuses.length)];

          await db.insert(planograms).values({
            locationId: locationResult.insertId,
            name: `Planogramme ${zone.name} ${j + 1}`,
            description: `Planogramme pour ${zone.name}`,
            status,
            version: 1,
            targetRevenue: Math.floor(Math.random() * 50000) + 10000,
            layout: JSON.stringify({ shelves: [] })
          });
          totalPlanograms++;
        }
      }

      console.log(`      ✓ ${zoneIds.length} zones, ${numLocations} emplacements créés`);
    }

    // 5. Créer l'historique de stock pour les 6 derniers mois
    console.log("\n📊 Création de l'historique de stock...");
    let stockRecords = 0;
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    for (const storeId of storeIds) {
      for (const productId of productIds.slice(0, 15)) { // 15 produits par magasin
        for (let month = 0; month < 6; month++) {
          const date = new Date(sixMonthsAgo);
          date.setMonth(date.getMonth() + month);
          
          await db.insert(stockHistory).values({
            storeId,
            productId,
            quantity: Math.floor(Math.random() * 500) + 50,
            recordedAt: date
          });
          stockRecords++;
        }
      }
    }
    console.log(`   ✓ ${stockRecords} enregistrements de stock créés`);

    console.log("\n✅ Génération terminée avec succès!");
    console.log(`\n📈 Résumé:`);
    console.log(`   - ${storeIds.length} magasins Marjane`);
    console.log(`   - ${totalZones} zones`);
    console.log(`   - ${totalSponsors} contrats de sponsoring`);
    console.log(`   - ${totalLocations} emplacements`);
    console.log(`   - ${totalPlanograms} planogrammes`);
    console.log(`   - ${productIds.length} produits`);
    console.log(`   - ${stockRecords} enregistrements de stock`);

  } catch (error) {
    console.error("❌ Erreur lors de la génération:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

seedDemoData().catch(console.error);
