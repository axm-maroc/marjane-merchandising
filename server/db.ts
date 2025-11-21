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
  npsScores,
  InsertNPSScore,
  stockoutHistory,
  InsertStockoutHistory,
} from "../drizzle/schema";
import { ENV } from './_core/env';
import { notifyOwner } from './_core/notification';

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


// ===== KPIs STRATÉGIQUES =====

/**
 * Calcule le CA/m² par catégorie de produits
 */
export async function getRevenuePerSquareMeter(storeId: number, period?: string) {
  const db = await getDb();
  if (!db) return [];
  
  // Récupérer la surface du magasin
  const store = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
  if (!store.length || !store[0].surface) return [];
  
  const storeSurface = store[0].surface;
  
  // Calculer le CA par catégorie
  const result = await db
    .select({
      categoryId: products.categoryId,
      totalRevenue: sql<number>`SUM(${stockHistory.quantity} * ${products.unitPrice})`,
      revenuePerSqm: sql<number>`SUM(${stockHistory.quantity} * ${products.unitPrice}) / ${storeSurface}`,
    })
    .from(stockHistory)
    .innerJoin(products, eq(stockHistory.productId, products.id))
    .where(
      and(
        eq(stockHistory.storeId, storeId),
        eq(stockHistory.movementType, "sale") // Ventes uniquement
      )
    )
    .groupBy(products.categoryId);
  
  return result.map(r => ({
    categoryId: r.categoryId,
    totalRevenue: Number(r.totalRevenue) || 0,
    revenuePerSqm: Number(r.revenuePerSqm) || 0,
  }));
}

/**
 * Calcule le taux de rotation par catégorie
 */
export async function getRotationRateByCategory(storeId: number, period?: string) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      categoryId: products.categoryId,
      totalIn: sql<number>`SUM(CASE WHEN ${stockHistory.movementType} = 'in' THEN ${stockHistory.quantity} ELSE 0 END)`,
      totalOut: sql<number>`SUM(CASE WHEN ${stockHistory.movementType} = 'sale' THEN ${stockHistory.quantity} ELSE 0 END)`,
    })
    .from(stockHistory)
    .innerJoin(products, eq(stockHistory.productId, products.id))
    .where(eq(stockHistory.storeId, storeId))
    .groupBy(products.categoryId);
  
  return result.map(r => {
    const totalIn = Number(r.totalIn) || 0;
    const totalOut = Number(r.totalOut) || 0;
    const rotationRate = totalIn > 0 ? (totalOut / totalIn) * 100 : 0;
    
    return {
      categoryId: r.categoryId,
      totalIn,
      totalOut,
      rotationRate: Math.round(rotationRate * 10) / 10,
    };
  });
}

/**
 * Calcule le taux de rupture de stock
 */
export async function getStockoutRate(storeId: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return { stockoutRate: 0, totalStockouts: 0, averageDuration: 0 };
  
  const conditions = [eq(stockoutHistory.storeId, storeId)];
  
  if (startDate) {
    conditions.push(sql`${stockoutHistory.stockoutDate} >= ${startDate}`);
  }
  
  if (endDate) {
    conditions.push(sql`${stockoutHistory.stockoutDate} <= ${endDate}`);
  }
  
  const query = db
    .select({
      totalStockouts: sql<number>`COUNT(*)`,
      averageDuration: sql<number>`AVG(${stockoutHistory.durationHours})`,
      totalProducts: sql<number>`(SELECT COUNT(DISTINCT productId) FROM stockHistory WHERE storeId = ${storeId})`,
    })
    .from(stockoutHistory)
    .where(and(...conditions));
  
  const result = await query;
  const data = result[0];
  
  const totalProducts = Number(data?.totalProducts) || 1;
  const totalStockouts = Number(data?.totalStockouts) || 0;
  const stockoutRate = (totalStockouts / totalProducts) * 100;
  
  return {
    stockoutRate: Math.round(stockoutRate * 10) / 10,
    totalStockouts,
    averageDuration: Math.round(Number(data?.averageDuration) || 0),
  };
}

/**
 * Envoie une notification au propriétaire lorsqu'un feedback négatif est reçu
 */
async function notifyNegativeFeedback(storeId: number, score: number, comment?: string | null) {
  try {
    // Récupérer les informations du magasin
    const db = await getDb();
    if (!db) return;
    
    const storeResult = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
    if (storeResult.length === 0) return;
    
    const store = storeResult[0];
    
    // Construire le message de notification
    const title = `⚠️ Feedback négatif reçu - ${store.name}`;
    const content = `Un client a donné un avis négatif pour le magasin ${store.name} (à ${store.city}).

**Score NPS:** ${score}/10 (Détracteur)
${comment ? `\n**Commentaire:**\n${comment}` : '\n*Aucun commentaire fourni*'}

**Action recommandée:** Contactez le responsable du magasin (${store.managerName || 'non renseigné'}) pour analyser et résoudre le problème signalé.`;
    
    // Envoyer la notification
    const success = await notifyOwner({ title, content });
    
    if (success) {
      console.log(`[NPS] Notification envoyée pour feedback négatif - Magasin: ${store.name}, Score: ${score}`);
    } else {
      console.warn(`[NPS] Échec de l'envoi de notification pour feedback négatif - Magasin: ${store.name}, Score: ${score}`);
    }
  } catch (error) {
    console.error('[NPS] Erreur lors de l\'envoi de la notification:', error);
  }
}

/**
 * Enregistre un score NPS et envoie une notification si le feedback est négatif
 */
export async function saveNPSScore(data: Omit<InsertNPSScore, 'category'>) {
  const db = await getDb();
  if (!db) return null;
  
  // Déterminer la catégorie selon le score
  let category: "promoter" | "passive" | "detractor";
  if (data.score >= 9) category = "promoter";
  else if (data.score >= 7) category = "passive";
  else category = "detractor";
  
  const result = await db.insert(npsScores).values({
    ...data,
    category,
  });
  
  // Envoyer une notification si le feedback est négatif (score <= 6)
  if (data.score <= 6) {
    await notifyNegativeFeedback(data.storeId, data.score, data.comment);
  }
  
  return result;
}

/**
 * Calcule le score NPS pour un magasin
 */
export async function calculateNPS(storeId: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return { npsScore: 0, promoters: 0, passives: 0, detractors: 0, totalResponses: 0 };
  
  const conditions = [eq(npsScores.storeId, storeId)];
  
  if (startDate) {
    conditions.push(sql`${npsScores.createdAt} >= ${startDate}`);
  }
  
  if (endDate) {
    conditions.push(sql`${npsScores.createdAt} <= ${endDate}`);
  }
  
  const query = db
    .select({
      category: npsScores.category,
      count: sql<number>`COUNT(*)`,
    })
    .from(npsScores)
    .where(and(...conditions))
    .groupBy(npsScores.category);
  
  const result = await query;
  
  let promoters = 0;
  let passives = 0;
  let detractors = 0;
  
  result.forEach(r => {
    const count = Number(r.count);
    if (r.category === "promoter") promoters = count;
    else if (r.category === "passive") passives = count;
    else if (r.category === "detractor") detractors = count;
  });
  
  const totalResponses = promoters + passives + detractors;
  const npsScore = totalResponses > 0 
    ? Math.round(((promoters - detractors) / totalResponses) * 100)
    : 0;
  
  return {
    npsScore,
    promoters,
    passives,
    detractors,
    totalResponses,
  };
}

/**
 * Calcule le temps moyen d'actualisation des planogrammes
 */
export async function calculateUpdateTime(storeId: number, period?: string) {
  const db = await getDb();
  if (!db) return { averageDelay: 0, minDelay: 0, maxDelay: 0, pendingCount: 0 };
  
  // Récupérer les planogrammes du magasin via les locations
  const result = await db
    .select({
      updatedAt: planograms.updatedAt,
      appliedAt: planograms.appliedAt,
    })
    .from(planograms)
    .innerJoin(planogramLocations, eq(planograms.locationId, planogramLocations.id))
    .where(
      and(
        eq(planogramLocations.storeId, storeId),
        sql`${planograms.appliedAt} IS NOT NULL`
      )
    );
  
  if (result.length === 0) {
    // Compter les planogrammes en attente
    const pendingResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(planograms)
      .innerJoin(planogramLocations, eq(planograms.locationId, planogramLocations.id))
      .where(
        and(
          eq(planogramLocations.storeId, storeId),
          sql`${planograms.appliedAt} IS NULL`,
          eq(planograms.status, "active")
        )
      );
    
    return {
      averageDelay: 0,
      minDelay: 0,
      maxDelay: 0,
      pendingCount: Number(pendingResult[0]?.count) || 0,
    };
  }
  
  // Calculer les délais en jours
  const delays = result.map(r => {
    const updated = new Date(r.updatedAt).getTime();
    const applied = new Date(r.appliedAt!).getTime();
    return (applied - updated) / (1000 * 60 * 60 * 24); // en jours
  });
  
  const averageDelay = delays.reduce((a, b) => a + b, 0) / delays.length;
  const minDelay = Math.min(...delays);
  const maxDelay = Math.max(...delays);
  
  // Compter les planogrammes en attente
  const pendingResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(planograms)
    .innerJoin(planogramLocations, eq(planograms.locationId, planogramLocations.id))
    .where(
      and(
        eq(planogramLocations.storeId, storeId),
        sql`${planograms.appliedAt} IS NULL`,
        eq(planograms.status, "active")
      )
    );
  
  return {
    averageDelay: Math.round(averageDelay * 10) / 10,
    minDelay: Math.round(minDelay * 10) / 10,
    maxDelay: Math.round(maxDelay * 10) / 10,
    pendingCount: Number(pendingResult[0]?.count) || 0,
  };
}

/**
 * Marque un planogramme comme appliqué terrain
 */
export async function markPlanogramAsApplied(planogramId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .update(planograms)
    .set({ appliedAt: new Date() })
    .where(eq(planograms.id, planogramId));
  
  return result;
}

/**
 * Enregistre une rupture de stock
 */
export async function recordStockout(data: Omit<InsertStockoutHistory, 'createdAt'>) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(stockoutHistory).values(data);
  return result;
}
