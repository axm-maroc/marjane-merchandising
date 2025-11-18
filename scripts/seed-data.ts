import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import {
  stores,
  productCategories,
  products,
  planogramLocations,
  planograms,
  planogramProducts,
  stockHistory,
  salesForecasts,
} from "../drizzle/schema";

const connection = await mysql.createConnection(process.env.DATABASE_URL!);
const db = drizzle(connection);

console.log("🌱 Seeding database with Marjane sample data...");

// 1. Créer des magasins Marjane
console.log("Creating stores...");
const storesData = [
  {
    name: "Marjane Hay Riad",
    address: "Boulevard Al Qods, Hay Riad",
    city: "Rabat",
    latitude: "33.9716",
    longitude: "-6.8498",
    surface: 8500,
    phone: "+212 5 37 71 78 00",
    managerName: "Ahmed Bennani",
  },
  {
    name: "Marjane Bouregreg",
    address: "Avenue Annakhil, Hay Riad",
    city: "Rabat",
    latitude: "33.9598",
    longitude: "-6.8632",
    surface: 7200,
    phone: "+212 5 37 57 99 00",
    managerName: "Fatima Alaoui",
  },
  {
    name: "Marjane Californie",
    address: "Boulevard de la Résistance",
    city: "Casablanca",
    latitude: "33.5731",
    longitude: "-7.5898",
    surface: 9500,
    phone: "+212 5 22 36 82 00",
    managerName: "Karim El Fassi",
  },
  {
    name: "Marjane Derb Sultan",
    address: "Boulevard Mohamed V",
    city: "Casablanca",
    latitude: "33.5892",
    longitude: "-7.6114",
    surface: 6800,
    phone: "+212 5 22 30 45 00",
    managerName: "Sanaa Tazi",
  },
];

await db.insert(stores).values(storesData);

// 2. Créer des catégories de produits
console.log("Creating product categories...");
const categoriesData = [
  { id: 1, name: "Boissons Gazeuses", description: "Sodas et boissons pétillantes", parentId: null },
  { id: 2, name: "Eaux", description: "Eaux minérales et de source", parentId: null },
  { id: 3, name: "Jus", description: "Jus de fruits et nectars", parentId: null },
  { id: 4, name: "Produits Laitiers", description: "Lait, yaourts et fromages", parentId: null },
  { id: 5, name: "Épicerie Salée", description: "Conserves, pâtes, riz", parentId: null },
  { id: 6, name: "Épicerie Sucrée", description: "Biscuits, chocolats, confiseries", parentId: null },
];

await db.insert(productCategories).values(categoriesData);

// 3. Créer des produits
console.log("Creating products...");
const productsData = [
  // Boissons Coca-Cola
  {
    sku: "CC-001",
    name: "Coca-Cola Original 1.5L",
    brand: "Coca-Cola",
    categoryId: 1,
    description: "Boisson gazeuse au cola",
    photoUrl: "/products/riUu1qoXKFly.jpg",
    barcode: "5449000000996",
    unitPrice: 850,
    width: 95,
    height: 320,
    depth: 95,
    weight: 1550,
  },
  {
    sku: "CC-002",
    name: "Coca-Cola Original 500ml",
    brand: "Coca-Cola",
    categoryId: 1,
    description: "Boisson gazeuse au cola format individuel",
    photoUrl: "/products/b7f3A8ZOWD3Z.jpeg",
    barcode: "5449000000897",
    unitPrice: 550,
    width: 65,
    height: 210,
    depth: 65,
    weight: 530,
  },
  {
    sku: "SP-001",
    name: "Sprite 1.5L",
    brand: "Coca-Cola",
    categoryId: 1,
    description: "Boisson gazeuse citron-citron vert",
    photoUrl: "/products/ibs5QYTLwCZF.png",
    barcode: "5449000017871",
    unitPrice: 850,
    width: 95,
    height: 320,
    depth: 95,
    weight: 1550,
  },
  {
    sku: "FT-001",
    name: "Fanta Orange 1.5L",
    brand: "Coca-Cola",
    categoryId: 1,
    description: "Boisson gazeuse à l'orange",
    photoUrl: "/products/SPSzi2AV0vPc.jpg",
    barcode: "5449000017864",
    unitPrice: 850,
    width: 95,
    height: 320,
    depth: 95,
    weight: 1550,
  },
  {
    sku: "FT-002",
    name: "Fanta Orange 500ml",
    brand: "Coca-Cola",
    categoryId: 1,
    description: "Boisson gazeuse à l'orange format individuel",
    photoUrl: "/products/hX5bMnnZnsdc.jpg",
    barcode: "5449000017857",
    unitPrice: 550,
    width: 65,
    height: 210,
    depth: 65,
    weight: 530,
  },
  // Eaux
  {
    sku: "EAU-001",
    name: "Sidi Ali 1.5L",
    brand: "Sidi Ali",
    categoryId: 2,
    description: "Eau minérale naturelle",
    photoUrl: "/products/riUu1qoXKFly.jpg",
    barcode: "6111000001234",
    unitPrice: 450,
    width: 95,
    height: 320,
    depth: 95,
    weight: 1520,
  },
  {
    sku: "EAU-002",
    name: "Ain Saiss 1.5L",
    brand: "Ain Saiss",
    categoryId: 2,
    description: "Eau de source",
    photoUrl: "/products/riUu1qoXKFly.jpg",
    barcode: "6111000005678",
    unitPrice: 350,
    width: 95,
    height: 320,
    depth: 95,
    weight: 1520,
  },
  // Jus
  {
    sku: "JUS-001",
    name: "Jus d'Orange Tropicana 1L",
    brand: "Tropicana",
    categoryId: 3,
    description: "Pur jus d'orange",
    photoUrl: "/products/ks4J5oQcoVCv.jpg",
    barcode: "5000112548389",
    unitPrice: 1250,
    width: 75,
    height: 240,
    depth: 75,
    weight: 1050,
  },
  {
    sku: "JUS-002",
    name: "Nectar Pêche Miami 1L",
    brand: "Miami",
    categoryId: 3,
    description: "Nectar de pêche",
    photoUrl: "/products/ks4J5oQcoVCv.jpg",
    barcode: "6111000012345",
    unitPrice: 950,
    width: 75,
    height: 240,
    depth: 75,
    weight: 1050,
  },
  // Produits laitiers
  {
    sku: "LAIT-001",
    name: "Lait Centrale Demi-Écrémé 1L",
    brand: "Centrale Danone",
    categoryId: 4,
    description: "Lait UHT demi-écrémé",
    photoUrl: "/products/riUu1qoXKFly.jpg",
    barcode: "6111000023456",
    unitPrice: 850,
    width: 70,
    height: 195,
    depth: 70,
    weight: 1030,
  },
  {
    sku: "YAO-001",
    name: "Yaourt Activia Nature Pack 8",
    brand: "Danone",
    categoryId: 4,
    description: "Yaourt au bifidus actif",
    photoUrl: "/products/riUu1qoXKFly.jpg",
    barcode: "6111000034567",
    unitPrice: 1850,
    width: 180,
    height: 120,
    depth: 140,
    weight: 1000,
  },
  // Épicerie
  {
    sku: "RIZ-001",
    name: "Riz Basmati Taureau Ailé 1kg",
    brand: "Taureau Ailé",
    categoryId: 5,
    description: "Riz basmati de qualité supérieure",
    photoUrl: "/products/riUu1qoXKFly.jpg",
    barcode: "6111000045678",
    unitPrice: 2250,
    width: 120,
    height: 200,
    depth: 80,
    weight: 1000,
  },
  {
    sku: "PATE-001",
    name: "Pâtes Tria Spaghetti 500g",
    brand: "Tria",
    categoryId: 5,
    description: "Spaghetti de semoule de blé dur",
    photoUrl: "/products/riUu1qoXKFly.jpg",
    barcode: "6111000056789",
    unitPrice: 650,
    width: 80,
    height: 250,
    depth: 50,
    weight: 500,
  },
  {
    sku: "BISC-001",
    name: "Biscuits Prince Chocolat",
    brand: "LU",
    categoryId: 6,
    description: "Biscuits fourrés au chocolat",
    photoUrl: "/products/riUu1qoXKFly.jpg",
    barcode: "7622210449283",
    unitPrice: 1150,
    width: 180,
    height: 120,
    depth: 60,
    weight: 300,
  },
  {
    sku: "CHOC-001",
    name: "Chocolat Milka Lait 100g",
    brand: "Milka",
    categoryId: 6,
    description: "Chocolat au lait des Alpes",
    photoUrl: "/products/riUu1qoXKFly.jpg",
    barcode: "7622210449276",
    unitPrice: 950,
    width: 100,
    height: 150,
    depth: 10,
    weight: 100,
  },
];

await db.insert(products).values(productsData);

// 4. Créer des emplacements de planogrammes
console.log("Creating planogram locations...");
const locationsData = [
  {
    id: 1,
    storeId: 1,
    name: "Rayon Boissons - Allée Centrale",
    zone: "Allée 3",
    shelfCount: 5,
    shelfWidth: 2400,
    shelfHeight: 350,
    shelfDepth: 450,
  },
  {
    id: 2,
    storeId: 1,
    name: "Rayon Produits Laitiers",
    zone: "Zone Fraîche",
    shelfCount: 4,
    shelfWidth: 1800,
    shelfHeight: 300,
    shelfDepth: 400,
  },
  {
    id: 3,
    storeId: 2,
    name: "Rayon Boissons Gazeuses",
    zone: "Allée 2",
    shelfCount: 5,
    shelfWidth: 2000,
    shelfHeight: 350,
    shelfDepth: 450,
  },
  {
    id: 4,
    storeId: 3,
    name: "Rayon Boissons - Entrée",
    zone: "Zone Promotionnelle",
    shelfCount: 4,
    shelfWidth: 3000,
    shelfHeight: 400,
    shelfDepth: 500,
  },
];

await db.insert(planogramLocations).values(locationsData);

// 5. Créer des planogrammes
console.log("Creating planograms...");
const planogramsData = [
  {
    id: 1,
    locationId: 1,
    name: "Planogramme Boissons Été 2025",
    version: 1,
    status: "active" as const,
    salesTarget: 5000000, // 50,000 DH
    startDate: new Date("2025-06-01"),
    endDate: new Date("2025-09-30"),
  },
  {
    id: 2,
    locationId: 2,
    name: "Planogramme Produits Laitiers",
    version: 1,
    status: "active" as const,
    salesTarget: 3500000,
    startDate: new Date("2025-01-01"),
    endDate: new Date("2025-12-31"),
  },
  {
    id: 3,
    locationId: 3,
    name: "Planogramme Boissons Ramadan 2025",
    version: 1,
    status: "draft" as const,
    salesTarget: 7500000,
    startDate: new Date("2025-03-01"),
    endDate: new Date("2025-04-30"),
  },
];

await db.insert(planograms).values(planogramsData);

// 6. Placer des produits dans les planogrammes
console.log("Creating planogram products...");
const planogramProductsData = [
  // Planogramme 1 - Boissons (étagère du bas = 0, du haut = 4)
  { planogramId: 1, productId: 1, shelfLevel: 0, positionX: 0, facings: 4, quantity: 12 },
  { planogramId: 1, productId: 2, shelfLevel: 1, positionX: 0, facings: 6, quantity: 18 },
  { planogramId: 1, productId: 3, shelfLevel: 0, positionX: 400, facings: 4, quantity: 12 },
  { planogramId: 1, productId: 4, shelfLevel: 0, positionX: 800, facings: 4, quantity: 12 },
  { planogramId: 1, productId: 5, shelfLevel: 1, positionX: 400, facings: 6, quantity: 18 },
  { planogramId: 1, productId: 6, shelfLevel: 2, positionX: 0, facings: 8, quantity: 24 },
  { planogramId: 1, productId: 7, shelfLevel: 2, positionX: 800, facings: 8, quantity: 24 },
  { planogramId: 1, productId: 8, shelfLevel: 3, positionX: 0, facings: 4, quantity: 12 },
  { planogramId: 1, productId: 9, shelfLevel: 3, positionX: 400, facings: 4, quantity: 12 },
  
  // Planogramme 2 - Produits Laitiers
  { planogramId: 2, productId: 10, shelfLevel: 0, positionX: 0, facings: 6, quantity: 18 },
  { planogramId: 2, productId: 11, shelfLevel: 1, positionX: 0, facings: 4, quantity: 12 },
];

await db.insert(planogramProducts).values(planogramProductsData);

// 7. Créer un historique de stock (6 derniers mois)
console.log("Creating stock history...");
const stockHistoryData = [];
const now = new Date();

// Pour chaque magasin et produit, créer un historique
for (let storeId = 1; storeId <= 4; storeId++) {
  for (let productId = 1; productId <= 15; productId++) {
    // Générer des entrées de stock mensuelles
    for (let monthsAgo = 6; monthsAgo >= 0; monthsAgo--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - monthsAgo);
      
      // Entrée de stock
      stockHistoryData.push({
        storeId,
        productId,
        quantity: Math.floor(Math.random() * 100) + 50,
        movementType: "in" as const,
        recordedAt: date,
        notes: "Réapprovisionnement mensuel",
      });
      
      // Ventes quotidiennes simulées
      for (let day = 0; day < 30; day++) {
        const saleDate = new Date(date);
        saleDate.setDate(saleDate.getDate() + day);
        
        stockHistoryData.push({
          storeId,
          productId,
          quantity: Math.floor(Math.random() * 15) + 5,
          movementType: "sale" as const,
          recordedAt: saleDate,
          notes: "Vente journalière",
        });
      }
    }
  }
}

// Insérer par lots de 1000 pour éviter les timeouts
for (let i = 0; i < stockHistoryData.length; i += 1000) {
  const batch = stockHistoryData.slice(i, i + 1000);
  await db.insert(stockHistory).values(batch);
  console.log(`  Inserted ${Math.min(i + 1000, stockHistoryData.length)}/${stockHistoryData.length} stock records`);
}

// 8. Créer des prévisions de vente
console.log("Creating sales forecasts...");
const forecastsData = [];
const futureDate = new Date(now);
futureDate.setMonth(futureDate.getMonth() + 1);

for (let storeId = 1; storeId <= 4; storeId++) {
  for (let productId = 1; productId <= 15; productId++) {
    forecastsData.push({
      storeId,
      productId,
      planogramId: storeId <= 2 ? 1 : 3,
      forecastDate: futureDate,
      predictedQuantity: Math.floor(Math.random() * 200) + 100,
      predictedRevenue: Math.floor(Math.random() * 50000) + 25000,
      confidence: Math.floor(Math.random() * 20) + 75,
      algorithm: "Linear Regression",
    });
  }
}

await db.insert(salesForecasts).values(forecastsData);

console.log("✅ Database seeded successfully!");
await connection.end();
