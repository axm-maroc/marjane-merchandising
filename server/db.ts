import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users,
  stores,
  storePhotos,
  productCategories,
  products,
  planogramLocations,
  planograms,
  planogramProducts,
  planogramPhotos,
  InsertPlanogramPhoto,
  planogramHistory,
  stockHistory,
  salesForecasts,
  anomalies,
  recommendations,
  storeZones,
  InsertStoreZone,
  zoneSponsors,
  InsertZoneSponsor,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ===== STORES =====
export async function getAllStores() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(stores).orderBy(desc(stores.createdAt));
}

export async function getStoreById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(stores).where(eq(stores.id, id)).limit(1);
  return result[0];
}

export async function getStorePhotos(storeId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(storePhotos).where(eq(storePhotos.storeId, storeId)).orderBy(desc(storePhotos.isPrimary), desc(storePhotos.createdAt));
}

// ===== PRODUCTS =====
export async function getAllProducts() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(products).orderBy(products.name);
}

export async function getProductsByCategory(categoryId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(products).where(eq(products.categoryId, categoryId)).orderBy(products.name);
}

export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(productCategories).orderBy(productCategories.name);
}

// ===== PLANOGRAM LOCATIONS =====
export async function getAllPlanogramLocations() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(planogramLocations).orderBy(planogramLocations.storeId, planogramLocations.name);
}

export async function getPlanogramLocationsByStore(storeId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(planogramLocations).where(eq(planogramLocations.storeId, storeId)).orderBy(planogramLocations.name);
}

export async function getPlanogramLocationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(planogramLocations).where(eq(planogramLocations.id, id)).limit(1);
  return result[0];
}

export async function createPlanogramLocation(data: {
  storeId: number;
  name: string;
  location: string;
  width: number;
  height: number;
  depth: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(planogramLocations).values(data);
  const insertedId = result[0].insertId;
  
  // Récupérer le planogramme créé
  const planogram = await getPlanogramLocationById(insertedId);
  if (!planogram) throw new Error("Failed to create planogram location");
  
  return planogram;
}

export async function updatePlanogramLocationZone(locationId: number, zoneId: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(planogramLocations)
    .set({ zoneId })
    .where(eq(planogramLocations.id, locationId));
  
  return { success: true };
}

export async function updatePlanogramLocationPosition(
  locationId: number, 
  positionX: number, 
  positionY: number, 
  zoneId: number | null
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(planogramLocations)
    .set({ positionX, positionY, zoneId })
    .where(eq(planogramLocations.id, locationId));
  
  return { success: true };
}

// ===== PLANOGRAMS =====
export async function getPlanogramsByLocation(locationId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(planograms).where(eq(planograms.locationId, locationId)).orderBy(desc(planograms.version));
}

export async function getPlanogramById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(planograms).where(eq(planograms.id, id)).limit(1);
  return result[0];
}

export async function getPlanogramProducts(planogramId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      id: planogramProducts.id,
      planogramId: planogramProducts.planogramId,
      productId: planogramProducts.productId,
      shelfLevel: planogramProducts.shelfLevel,
      positionX: planogramProducts.positionX,
      facings: planogramProducts.facings,
      quantity: planogramProducts.quantity,
      product: products,
    })
    .from(planogramProducts)
    .leftJoin(products, eq(planogramProducts.productId, products.id))
    .where(eq(planogramProducts.planogramId, planogramId));
  
  return result;
}

export async function getPlanogramPhotos(planogramId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(planogramPhotos).where(eq(planogramPhotos.planogramId, planogramId)).orderBy(desc(planogramPhotos.timestamp));
}

export async function addProductToPlanogram(data: {
  planogramId: number;
  productId: number;
  position: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Pour l'instant, on crée un planogramme par défaut avec version 1
  // TODO: Améliorer pour gérer les versions correctement
  
  // Vérifier si un planogramme existe déjà pour cette location
  const existingPlanograms = await db
    .select()
    .from(planograms)
    .where(eq(planograms.locationId, data.planogramId))
    .limit(1);
  
  let planogramId: number;
  
  if (existingPlanograms.length === 0) {
    // Créer un nouveau planogramme
    const result = await db.insert(planograms).values({
      locationId: data.planogramId,
      name: "Planogramme v1",
      version: 1,
      status: "draft",
      salesTarget: 0,
    });
    planogramId = result[0].insertId;
  } else {
    planogramId = existingPlanograms[0].id;
  }
  
  // Ajouter le produit au planogramme
  await db.insert(planogramProducts).values({
    planogramId,
    productId: data.productId,
    shelfLevel: 0, // Niveau par défaut
    positionX: data.position, // Position horizontale
    facings: 1,
    quantity: 1,
  });
  
  return { success: true };
}

// ===== STOCK HISTORY =====
export async function getStockHistory(storeId: number, productId: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(stockHistory)
    .where(and(
      eq(stockHistory.storeId, storeId),
      eq(stockHistory.productId, productId)
    ))
    .$dynamic();
  
  if (startDate) {
    query = query.where(gte(stockHistory.recordedAt, startDate));
  }
  if (endDate) {
    query = query.where(lte(stockHistory.recordedAt, endDate));
  }
  
  return await query.orderBy(stockHistory.recordedAt);
}

export async function getStockSummary(storeId: number, productId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select({
      totalIn: sql<number>`SUM(CASE WHEN ${stockHistory.movementType} = 'in' THEN ${stockHistory.quantity} ELSE 0 END)`,
      totalOut: sql<number>`SUM(CASE WHEN ${stockHistory.movementType} IN ('out', 'sale') THEN ${stockHistory.quantity} ELSE 0 END)`,
      currentStock: sql<number>`SUM(CASE WHEN ${stockHistory.movementType} = 'in' THEN ${stockHistory.quantity} ELSE -${stockHistory.quantity} END)`,
    })
    .from(stockHistory)
    .where(and(
      eq(stockHistory.storeId, storeId),
      eq(stockHistory.productId, productId)
    ));
  
  return result[0];
}

// ===== SALES FORECASTS =====
export async function getSalesForecasts(storeId: number, planogramId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(salesForecasts)
    .where(eq(salesForecasts.storeId, storeId))
    .$dynamic();
  
  if (planogramId) {
    query = query.where(eq(salesForecasts.planogramId, planogramId));
  }
  
  return await query.orderBy(salesForecasts.forecastDate);
}

// ===== ANOMALIES =====
export async function getAnomaliesByPlanogram(planogramId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(anomalies).where(eq(anomalies.planogramId, planogramId)).orderBy(desc(anomalies.detectedAt));
}

// ===== RECOMMENDATIONS =====
export async function getRecommendationsByPlanogram(planogramId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(recommendations).where(eq(recommendations.planogramId, planogramId)).orderBy(desc(recommendations.createdAt));
}

export async function getRecommendationByToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(recommendations).where(eq(recommendations.shareToken, token)).limit(1);
  return result[0];
}


// ===== PLANOGRAM HISTORY =====
export async function getPlanogramHistory(planogramId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select()
    .from(planogramHistory)
    .where(eq(planogramHistory.planogramId, planogramId))
    .orderBy(desc(planogramHistory.version));
  
  return result;
}

export async function addPlanogramHistoryEntry(data: {
  planogramId: number;
  version: number;
  changeType: "created" | "updated" | "activated" | "archived" | "restored";
  changedBy?: string;
  comment?: string;
  snapshot?: string;
}) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(planogramHistory).values({
    planogramId: data.planogramId,
    version: data.version,
    changeType: data.changeType,
    changedBy: data.changedBy,
    comment: data.comment,
    snapshot: data.snapshot,
  });
  
  return result;
}

export async function restorePlanogramVersion(planogramId: number, version: number, comment?: string) {
  const db = await getDb();
  if (!db) return null;
  
  // Récupérer l'historique de la version à restaurer
  const historyEntry = await db.select()
    .from(planogramHistory)
    .where(and(
      eq(planogramHistory.planogramId, planogramId),
      eq(planogramHistory.version, version)
    ))
    .limit(1);
  
  if (historyEntry.length === 0) {
    throw new Error(`Version ${version} not found in history`);
  }
  
  // Récupérer le planogramme actuel
  const currentPlanogram = await db.select()
    .from(planograms)
    .where(eq(planograms.id, planogramId))
    .limit(1);
  
  if (currentPlanogram.length === 0) {
    throw new Error(`Planogram ${planogramId} not found`);
  }
  
  const newVersion = currentPlanogram[0].version + 1;
  
  // Créer une entrée d'historique pour la restauration
  await addPlanogramHistoryEntry({
    planogramId,
    version: newVersion,
    changeType: "restored",
    comment: comment || `Restauration de la version ${version}`,
    snapshot: historyEntry[0].snapshot || undefined,
  });
  
  // Mettre à jour le planogramme avec la nouvelle version
  await db.update(planograms)
    .set({
      version: newVersion,
      updatedAt: new Date(),
    })
    .where(eq(planograms.id, planogramId));
  
  return { success: true, newVersion };
}

// ===== Planogram History Functions =====

export async function getPlanogramVersion(planogramId: number, version: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(planogramHistory)
    .where(
      and(
        eq(planogramHistory.planogramId, planogramId),
        eq(planogramHistory.version, version)
      )
    )
    .limit(1);

  if (result.length === 0) return null;

  return {
    ...result[0],
    snapshot: result[0].snapshot ? JSON.parse(result[0].snapshot) : null,
  };
}

export async function getLatestPlanogramVersion(planogramId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(planogramHistory)
    .where(eq(planogramHistory.planogramId, planogramId))
    .orderBy(desc(planogramHistory.version))
    .limit(1);

  if (result.length === 0) return null;

  return {
    ...result[0],
    snapshot: result[0].snapshot ? JSON.parse(result[0].snapshot) : null,
  };
}


// Fonction pour mettre à jour le statut d'un planogramme
export async function updatePlanogramStatus(planogramId: number, status: string) {
  const database = await getDb();
  if (!database) return null;

  await database.update(planograms)
    .set({ status: status as "draft" | "active" | "archived" })
    .where(eq(planograms.id, planogramId));

  return { success: true };
}

// Fonction pour récupérer un produit par ID
export async function getProductById(productId: number) {
  const database = await getDb();
  if (!database) return null;

  const result = await database.select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

// Fonction pour supprimer un produit d'un planogramme
export async function removeProductFromPlanogram(planogramId: number, productId: number) {
  const database = await getDb();
  if (!database) return null;

  await database.delete(planogramProducts)
    .where(
      and(
        eq(planogramProducts.planogramId, planogramId),
        eq(planogramProducts.productId, productId)
      )
    );

  return { success: true };
}


// Fonction pour sauvegarder automatiquement une version d'un planogramme
export async function savePlanogramVersion(planogramId: number, comment: string) {
  const database = await getDb();
  if (!database) return null;

  // Récupérer la dernière version
  const latestVersion = await getLatestPlanogramVersion(planogramId);
  const newVersionNumber = latestVersion ? latestVersion.version + 1 : 1;

  // Récupérer l'état actuel du planogramme
  const planogram = await getPlanogramLocationById(planogramId);
  if (!planogram) {
    throw new Error(`Planogram ${planogramId} not found`);
  }

  // Récupérer les produits du planogramme
  const planogramProductsList = await getPlanogramProducts(planogramId);

  // Créer une snapshot de l'état actuel
  const snapshot = {
    planogram,
    products: planogramProductsList,
  };

  // Insérer la nouvelle version dans l'historique
  await database.insert(planogramHistory).values({
    planogramId,
    version: newVersionNumber,
    changeType: "updated",
    snapshot: JSON.stringify(snapshot),
    comment,
    createdAt: new Date(),
  });

  return { success: true, version: newVersionNumber };
}


// Photos terrain
export async function savePlanogramPhoto(data: InsertPlanogramPhoto) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(planogramPhotos).values(data);
  return result;
}

export async function getUserPhotos(userId: number, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(planogramPhotos)
    .where(eq(planogramPhotos.userId, userId))
    .orderBy(desc(planogramPhotos.timestamp))
    .limit(limit);
}


export async function getPlanogramsByStore(storeId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Récupérer tous les planogrammes via les locations du magasin
  const result = await db
    .select({
      id: planograms.id,
      name: planograms.name,
      locationId: planograms.locationId,
      version: planograms.version,
      status: planograms.status,
      createdAt: planograms.createdAt,
    })
    .from(planograms)
    .innerJoin(planogramLocations, eq(planograms.locationId, planogramLocations.id))
    .where(eq(planogramLocations.storeId, storeId))
    .orderBy(desc(planograms.createdAt));
  
  return result;
}


// ============ ZONES ET SPONSORING ============

export async function createStoreZone(data: InsertStoreZone) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(storeZones).values(data);
  return result[0]?.insertId;
}

export async function getZonesByStore(storeId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(storeZones)
    .where(eq(storeZones.storeId, storeId))
    .orderBy(storeZones.code);
}

export async function getZoneById(zoneId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(storeZones)
    .where(eq(storeZones.id, zoneId))
    .limit(1);
    
  return result[0] || null;
}

export async function updateStoreZone(zoneId: number, data: Partial<InsertStoreZone>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(storeZones)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(storeZones.id, zoneId));
    
  return { success: true };
}

export async function deleteStoreZone(zoneId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(storeZones).where(eq(storeZones.id, zoneId));
  return { success: true };
}

// Sponsoring
export async function createZoneSponsor(data: InsertZoneSponsor) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Marquer la zone comme sponsorisée
  await db
    .update(storeZones)
    .set({ isSponsored: true, updatedAt: new Date() })
    .where(eq(storeZones.id, data.zoneId));
  
  const result = await db.insert(zoneSponsors).values(data);
  return result[0]?.insertId;
}

export async function getSponsorsByZone(zoneId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(zoneSponsors)
    .where(eq(zoneSponsors.zoneId, zoneId))
    .orderBy(desc(zoneSponsors.startDate));
}

export async function getActiveSponsorByZone(zoneId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const now = new Date();
  const result = await db
    .select()
    .from(zoneSponsors)
    .where(
      and(
        eq(zoneSponsors.zoneId, zoneId),
        eq(zoneSponsors.status, 'active'),
        lte(zoneSponsors.startDate, now),
        gte(zoneSponsors.endDate, now)
      )
    )
    .limit(1);
    
  return result[0] || null;
}

export async function updateZoneSponsor(sponsorId: number, data: Partial<InsertZoneSponsor>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(zoneSponsors)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(zoneSponsors.id, sponsorId));
    
  return { success: true };
}

export async function getExpiringSponsorships(daysBeforeExpiry: number = 30) {
  const db = await getDb();
  if (!db) return [];
  
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysBeforeExpiry);
  
  return await db
    .select({
      sponsor: zoneSponsors,
      zone: storeZones,
      store: stores,
    })
    .from(zoneSponsors)
    .innerJoin(storeZones, eq(zoneSponsors.zoneId, storeZones.id))
    .innerJoin(stores, eq(storeZones.storeId, stores.id))
    .where(
      and(
        eq(zoneSponsors.status, 'active'),
        lte(zoneSponsors.endDate, futureDate),
        gte(zoneSponsors.endDate, new Date())
      )
    )
    .orderBy(zoneSponsors.endDate);
}

export async function getSponsorshipRevenue(storeId?: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return { totalRevenue: 0, activeContracts: 0, expiredContracts: 0 };
  
  let query = db
    .select({
      totalRevenue: sql<number>`SUM(${zoneSponsors.contractAmount})`,
      activeContracts: sql<number>`COUNT(CASE WHEN ${zoneSponsors.status} = 'active' THEN 1 END)`,
      expiredContracts: sql<number>`COUNT(CASE WHEN ${zoneSponsors.status} = 'expired' THEN 1 END)`,
    })
    .from(zoneSponsors);
  
  if (storeId) {
    query = query
      .innerJoin(storeZones, eq(zoneSponsors.zoneId, storeZones.id))
      .where(eq(storeZones.storeId, storeId)) as any;
  }
  
  const result = await query;
  return result[0] || { totalRevenue: 0, activeContracts: 0, expiredContracts: 0 };
}


// Stock Forecast Functions
export async function getStockForecast(storeId: number, productId: number, days: number = 30) {
  const db = await getDb();
  if (!db) return { forecast: [], daysUntilStockout: null, averageDailySales: 0 };
  
  // Get stock history for the last 30 days to calculate average daily sales
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const history = await db
    .select()
    .from(stockHistory)
    .where(
      and(
        eq(stockHistory.storeId, storeId),
        eq(stockHistory.productId, productId),
        gte(stockHistory.recordedAt, thirtyDaysAgo)
      )
    )
    .orderBy(stockHistory.recordedAt);
  
  // Calculate current stock
  let currentStock = 0;
  history.forEach(record => {
    if (record.movementType === 'in') {
      currentStock += record.quantity;
    } else {
      currentStock -= record.quantity;
    }
  });
  
  // Calculate average daily sales (out movements)
  const totalSales = history
    .filter(r => r.movementType === 'out')
    .reduce((sum, r) => sum + r.quantity, 0);
  const averageDailySales = history.length > 0 ? totalSales / 30 : 0;
  
  // Generate forecast for the next N days
  const forecast = [];
  let projectedStock = currentStock;
  
  for (let i = 1; i <= days; i++) {
    projectedStock = Math.max(0, projectedStock - averageDailySales);
    const forecastDate = new Date();
    forecastDate.setDate(forecastDate.getDate() + i);
    
    forecast.push({
      date: forecastDate.toISOString().split('T')[0],
      projectedStock: Math.round(projectedStock),
      projectedSales: Math.round(averageDailySales),
    });
  }
  
  // Calculate days until stockout
  let daysUntilStockout = null;
  if (averageDailySales > 0) {
    daysUntilStockout = Math.floor(currentStock / averageDailySales);
  }
  
  return {
    forecast,
    daysUntilStockout,
    averageDailySales: Math.round(averageDailySales * 10) / 10,
    currentStock,
  };
}

export async function getStockAlerts(storeId: number, threshold: number = 0.2) {
  const db = await getDb();
  if (!db) return [];
  
  // Get all products in the store
  const allProducts = await db.select().from(products);
  
  const alerts = [];
  
  for (const product of allProducts) {
    // Get stock summary
    const summary = await getStockSummary(storeId, product.id);
    if (!summary) continue;
    
    const { currentStock, totalIn, totalOut } = summary;
    
    // Calculate average stock (total in / 2 as a simple estimate)
    const averageStock = totalIn / 2;
    const criticalThreshold = averageStock * threshold;
    
    // Get forecast to calculate days until stockout
    const forecast = await getStockForecast(storeId, product.id, 30);
    
    // Alert if stock is below threshold or stockout is imminent
    if (currentStock < criticalThreshold || (forecast.daysUntilStockout && forecast.daysUntilStockout < 7)) {
      alerts.push({
        productId: product.id,
        productName: product.name,
        currentStock,
        criticalThreshold: Math.round(criticalThreshold),
        daysUntilStockout: forecast.daysUntilStockout,
        severity: currentStock === 0 ? 'critical' : 
                  (forecast.daysUntilStockout && forecast.daysUntilStockout < 3) ? 'high' : 
                  (forecast.daysUntilStockout && forecast.daysUntilStockout < 7) ? 'medium' : 'low',
      });
    }
  }
  
  // Sort by severity and days until stockout
  return alerts.sort((a, b) => {
    const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return (a.daysUntilStockout || 999) - (b.daysUntilStockout || 999);
  });
}


// ============================================================================
// Analytics Functions
// ============================================================================

export async function getGlobalKPIs() {
  const db = await getDb();
  if (!db) return null;

  // Calculer les KPIs globaux
  const storesList = await db.select().from(stores);
  const productsList = await db.select().from(products);
  
  // Stock total
  const stockData = await db.select({
    totalStock: sql<number>`SUM(${stockHistory.quantity})`,
    totalValue: sql<number>`SUM(${stockHistory.quantity} * ${products.unitPrice})`,
  })
  .from(stockHistory)
  .leftJoin(products, eq(stockHistory.productId, products.id))
  .where(eq(stockHistory.movementType, 'in'));

  // Taux de rotation moyen (calculé sur les 30 derniers jours)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const salesData = await db.select({
    totalSales: sql<number>`SUM(${stockHistory.quantity})`,
  })
  .from(stockHistory)
  .where(
    and(
      eq(stockHistory.movementType, 'out'),
      sql`${stockHistory.recordedAt} >= ${thirtyDaysAgo}`
    )
  );

  const totalStock = stockData[0]?.totalStock || 0;
  const totalSales = salesData[0]?.totalSales || 0;
  const rotationRate = totalStock > 0 ? (totalSales / totalStock) * 100 : 0;

  return {
    totalStores: storesList.length,
    totalProducts: productsList.length,
    totalStock: totalStock,
    stockValue: stockData[0]?.totalValue || 0,
    rotationRate: Math.round(rotationRate * 10) / 10,
    totalSales: totalSales,
  };
}

export async function getStorePerformance(period: 'week' | 'month' | 'year' = 'month') {
  const db = await getDb();
  if (!db) return [];

  // Calculer la date de début selon la période
  const startDate = new Date();
  if (period === 'week') {
    startDate.setDate(startDate.getDate() - 7);
  } else if (period === 'month') {
    startDate.setMonth(startDate.getMonth() - 1);
  } else {
    startDate.setFullYear(startDate.getFullYear() - 1);
  }

  // Récupérer les performances par magasin
  const performance = await db.select({
    storeId: stores.id,
    storeName: stores.name,
    storeCity: stores.city,
    totalSales: sql<number>`SUM(CASE WHEN ${stockHistory.movementType} = 'out' THEN ${stockHistory.quantity} ELSE 0 END)`,
    totalStock: sql<number>`SUM(CASE WHEN ${stockHistory.movementType} = 'in' THEN ${stockHistory.quantity} ELSE 0 END)`,
    revenue: sql<number>`SUM(CASE WHEN ${stockHistory.movementType} = 'out' THEN ${stockHistory.quantity} * ${products.unitPrice} ELSE 0 END)`,
  })
  .from(stores)
  .leftJoin(stockHistory, eq(stores.id, stockHistory.storeId))
  .leftJoin(products, eq(stockHistory.productId, products.id))
  .where(sql`${stockHistory.recordedAt} >= ${startDate}`)
  .groupBy(stores.id, stores.name, stores.city);

  return performance.map(p => ({
    ...p,
    rotationRate: p.totalStock > 0 ? Math.round((p.totalSales / p.totalStock) * 1000) / 10 : 0,
  }));
}

export async function getTopProducts(limit: number = 10, storeId?: number) {
  const db = await getDb();
  if (!db) return [];

  // Calculer les ventes des 30 derniers jours
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const conditions = [
    eq(stockHistory.movementType, 'out'),
    sql`${stockHistory.recordedAt} >= ${thirtyDaysAgo}`,
  ];

  if (storeId) {
    conditions.push(eq(stockHistory.storeId, storeId));
  }

  const topProducts = await db.select({
    productId: products.id,
    productName: products.name,
    productBarcode: products.barcode,
    totalSales: sql<number>`SUM(${stockHistory.quantity})`,
    revenue: sql<number>`SUM(${stockHistory.quantity} * ${products.unitPrice})`,
    avgPrice: products.unitPrice,
  })
  .from(products)
  .leftJoin(stockHistory, eq(products.id, stockHistory.productId))
  .where(and(...conditions))
  .groupBy(products.id, products.name, products.barcode, products.unitPrice)
  .orderBy(sql`SUM(${stockHistory.quantity}) DESC`)
  .limit(limit);

  return topProducts;
}

export async function getSalesTrends(period: 'week' | 'month' | 'year' = 'month') {
  const db = await getDb();
  if (!db) return [];

  // Calculer la date de début selon la période
  const startDate = new Date();
  if (period === 'week') {
    startDate.setDate(startDate.getDate() - 7);
  } else if (period === 'month') {
    startDate.setMonth(startDate.getMonth() - 1);
  } else {
    startDate.setFullYear(startDate.getFullYear() - 1);
  }

  // Grouper par jour pour avoir les tendances
  const trends = await db.select({
    date: sql<string>`DATE(${stockHistory.recordedAt})`,
    totalSales: sql<number>`SUM(CASE WHEN ${stockHistory.movementType} = 'out' THEN ${stockHistory.quantity} ELSE 0 END)`,
    totalEntries: sql<number>`SUM(CASE WHEN ${stockHistory.movementType} = 'in' THEN ${stockHistory.quantity} ELSE 0 END)`,
    revenue: sql<number>`SUM(CASE WHEN ${stockHistory.movementType} = 'out' THEN ${stockHistory.quantity} * ${products.unitPrice} ELSE 0 END)`,
  })
  .from(stockHistory)
  .leftJoin(products, eq(stockHistory.productId, products.id))
  .where(sql`${stockHistory.recordedAt} >= ${startDate}`)
  .groupBy(sql`DATE(${stockHistory.recordedAt})`)
  .orderBy(sql`DATE(${stockHistory.recordedAt}) ASC`);

  return trends;
}


// ============================================================================
// Import/Export Planogrammes
// ============================================================================

export async function exportPlanogramToCSV(planogramId: number) {
  const db = await getDb();
  if (!db) return null;

  // Récupérer le planogramme
  const planogram = await db.select().from(planograms).where(eq(planograms.id, planogramId)).limit(1);
  if (planogram.length === 0) return null;

  // Récupérer les produits du planogramme
  const planogramProductsList = await db.select({
    productId: planogramProducts.productId,
    productName: products.name,
    productBarcode: products.barcode,
    positionX: planogramProducts.positionX,
    facings: planogramProducts.facings,
    shelfLevel: planogramProducts.shelfLevel,
  })
  .from(planogramProducts)
  .leftJoin(products, eq(planogramProducts.productId, products.id))
  .where(eq(planogramProducts.planogramId, planogramId));

  // Générer le CSV
  const headers = ['Product ID', 'Product Name', 'Barcode', 'Position', 'Facings', 'Shelf Level'];
  const rows = planogramProductsList.map(p => [
    p.productId,
    p.productName || '',
    p.productBarcode || '',
    p.positionX || 0,
    p.facings || 1,
    p.shelfLevel || 1,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return {
    planogramId,
    planogramName: planogram[0].name,
    csvContent,
    productCount: planogramProductsList.length,
  };
}

export async function importPlanogramFromCSV(storeId: number, csvData: string, name: string, locationId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Parser le CSV
  const lines = csvData.trim().split('\n');
  if (lines.length < 2) {
    throw new Error("CSV file is empty or invalid");
  }

  // Ignorer la première ligne (headers)
  const dataLines = lines.slice(1);

  // Si locationId n'est pas fourni, trouver le premier emplacement du magasin
  let targetLocationId = locationId;
  if (!targetLocationId) {
    const locations = await db.select().from(planogramLocations).where(eq(planogramLocations.storeId, storeId)).limit(1);
    if (locations.length === 0) {
      throw new Error("No planogram location found for this store");
    }
    targetLocationId = locations[0].id;
  }

  // Créer le planogramme
  const newPlanogram = await db.insert(planograms).values({
    name,
    locationId: targetLocationId,
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
  }).$returningId();

  const planogramId = newPlanogram[0].id;

  // Importer les produits
  let importedCount = 0;
  for (const line of dataLines) {
    const [productIdStr, productName, barcode, positionStr, facingsStr, shelfLevelStr] = line.split(',');
    
    const productId = parseInt(productIdStr);
    const position = parseInt(positionStr) || 0;
    const facings = parseInt(facingsStr) || 1;
    const shelfLevel = parseInt(shelfLevelStr) || 1;

    if (isNaN(productId)) continue;

    // Vérifier que le produit existe
    const product = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    if (product.length === 0) continue;

    // Ajouter le produit au planogramme
    await db.insert(planogramProducts).values({
      planogramId,
      productId,
      positionX: position,
      facings,
      shelfLevel,
    });

    importedCount++;
  }

  // Sauvegarder une version
  await savePlanogramVersion(planogramId, `Import CSV: ${importedCount} produits importés`);

  return {
    planogramId,
    name,
    importedCount,
  };
}
