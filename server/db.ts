import { eq, desc, asc, and, or, gte, lte, sql } from "drizzle-orm";
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
  planogramTemplates,
  InsertPlanogramTemplate,
  aiPromotionRules,
  InsertAIPromotionRule,
  impactSimulations,
  InsertImpactSimulation,
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

  return planogram.id;
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


/**
 * Récupère la liste des feedbacks négatifs avec filtres
 */
export async function getNegativeFeedbacks(filters?: {
  storeId?: number;
  status?: "pending" | "in_progress" | "resolved";
  startDate?: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [sql`${npsScores.score} <= 6`];

  if (filters?.storeId) {
    conditions.push(eq(npsScores.storeId, filters.storeId));
  }

  if (filters?.status) {
    conditions.push(eq(npsScores.status, filters.status));
  }

  if (filters?.startDate) {
    conditions.push(sql`${npsScores.createdAt} >= ${filters.startDate}`);
  }

  if (filters?.endDate) {
    conditions.push(sql`${npsScores.createdAt} <= ${filters.endDate}`);
  }

  const result = await db
    .select({
      id: npsScores.id,
      storeId: npsScores.storeId,
      storeName: stores.name,
      storeCity: stores.city,
      score: npsScores.score,
      category: npsScores.category,
      comment: npsScores.comment,
      customerEmail: npsScores.customerEmail,
      status: npsScores.status,
      resolvedAt: npsScores.resolvedAt,
      resolvedBy: npsScores.resolvedBy,
      resolverName: users.name,
      createdAt: npsScores.createdAt,
    })
    .from(npsScores)
    .innerJoin(stores, eq(npsScores.storeId, stores.id))
    .leftJoin(users, eq(npsScores.resolvedBy, users.id))
    .where(and(...conditions))
    .orderBy(desc(npsScores.createdAt));

  return result;
}

/**
 * Met à jour le statut d'un feedback
 */
export async function updateFeedbackStatus(
  feedbackId: number,
  status: "pending" | "in_progress" | "resolved",
  userId?: number
) {
  const db = await getDb();
  if (!db) return null;

  const updateData: any = {
    status,
  };

  if (status === "resolved") {
    updateData.resolvedAt = new Date();
    if (userId) {
      updateData.resolvedBy = userId;
    }
  } else if (status === "pending" || status === "in_progress") {
    // Réinitialiser resolvedAt si on repasse en pending ou in_progress
    updateData.resolvedAt = null;
    updateData.resolvedBy = null;
  }

  await db
    .update(npsScores)
    .set(updateData)
    .where(eq(npsScores.id, feedbackId));

  return { success: true };
}

/**
 * Récupère les statistiques des feedbacks négatifs
 */
export async function getNegativeFeedbackStats(storeId?: number) {
  const db = await getDb();
  if (!db) return { total: 0, pending: 0, inProgress: 0, resolved: 0 };

  const conditions = [sql`${npsScores.score} <= 6`];

  if (storeId) {
    conditions.push(eq(npsScores.storeId, storeId));
  }

  const query = db
    .select({
      status: npsScores.status,
      count: sql<number>`COUNT(*)`,
    })
    .from(npsScores)
    .where(and(...conditions))
    .groupBy(npsScores.status);

  const result = await query;

  let pending = 0;
  let inProgress = 0;
  let resolved = 0;

  result.forEach((r) => {
    const count = Number(r.count);
    if (r.status === "pending") pending = count;
    else if (r.status === "in_progress") inProgress = count;
    else if (r.status === "resolved") resolved = count;
  });

  const total = pending + inProgress + resolved;

  return {
    total,
    pending,
    inProgress,
    resolved,
  };
}


/**
 * Crée un planogramme complet avec ses produits
 */
export async function createPlanogramWithProducts(data: {
  storeId: number;
  name: string;
  location: string;
  zoneId?: number;
  theme: string;
  width: number;
  height: number;
  depth: number;
  productIds: number[];
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 1. Créer l'emplacement du planogramme
  const [locationResult] = await db.insert(planogramLocations).values({
    storeId: data.storeId,
    name: data.name,
    zone: data.theme,
    zoneId: data.zoneId || null,
  }).$returningId();

  const locationId = locationResult.id;

  // 2. Créer le planogramme
  const [planogramResult] = await db.insert(planograms).values({
    locationId,
    name: data.name,
    version: 1,
    status: "draft",
  }).$returningId();

  const planogramId = planogramResult.id;

  // 3. Ajouter les produits au planogramme
  if (data.productIds.length > 0) {
    const productValues = data.productIds.map((productId, index) => ({
      planogramId,
      productId,
      positionX: (index + 1) * 100,
      quantity: 1,
      facings: 1,
      shelfLevel: 1,
    }));

    await db.insert(planogramProducts).values(productValues);
  }

  // 4. Créer l'entrée d'historique
  await db.insert(planogramHistory).values({
    planogramId,
    version: 1,
    changeType: "created",
    comment: `Planogramme créé avec ${data.productIds.length} produits`,
    snapshot: JSON.stringify({
      name: data.name,
      productCount: data.productIds.length,
    }),
  });

  return planogramId;
}


/**
 * Met à jour les positions et propriétés de plusieurs produits dans un planogramme
 */
export async function updateProductsPositions(
  planogramId: number,
  updates: Array<{
    id: number;
    quantity?: number;
    facings?: number;
    shelfLevel?: number;
    positionX?: number;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Mettre à jour chaque produit
  for (const update of updates) {
    const { id, ...fields } = update;
    
    if (Object.keys(fields).length > 0) {
      await db
        .update(planogramProducts)
        .set(fields)
        .where(eq(planogramProducts.id, id));
    }
  }

  return { success: true, updated: updates.length };
}


/**
 * Crée un template à partir d'un planogramme existant
 */
export async function createTemplateFromPlanogram(
  name: string,
  description: string | undefined,
  category: string | undefined,
  sourcePlanogramId: number,
  createdBy: number | undefined
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [template] = await db.insert(planogramTemplates).values({
    name,
    description,
    category,
    sourcePlanogramId,
    createdBy,
  }).$returningId();

  return template;
}

/**
 * Liste tous les templates disponibles
 */
export async function getAllTemplates() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      id: planogramTemplates.id,
      name: planogramTemplates.name,
      description: planogramTemplates.description,
      category: planogramTemplates.category,
      sourcePlanogramId: planogramTemplates.sourcePlanogramId,
      usageCount: planogramTemplates.usageCount,
      createdAt: planogramTemplates.createdAt,
    })
    .from(planogramTemplates)
    .orderBy(desc(planogramTemplates.createdAt));
}

/**
 * Applique un template à un ou plusieurs magasins
 */
export async function applyTemplateToStores(
  templateId: number,
  storeIds: number[],
  locationName: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Récupérer le template
  const [template] = await db
    .select()
    .from(planogramTemplates)
    .where(eq(planogramTemplates.id, templateId))
    .limit(1);

  if (!template) {
    throw new Error("Template introuvable");
  }

  // Récupérer le planogramme source
  const [sourcePlanogram] = await db
    .select()
    .from(planograms)
    .where(eq(planograms.id, template.sourcePlanogramId))
    .limit(1);

  if (!sourcePlanogram) {
    throw new Error("Planogramme source introuvable");
  }

  // Récupérer les produits du planogramme source
  const sourceProducts = await db
    .select()
    .from(planogramProducts)
    .where(eq(planogramProducts.planogramId, template.sourcePlanogramId));

  const createdPlanograms: number[] = [];

  // Créer un planogramme pour chaque magasin
  for (const storeId of storeIds) {
    // Créer une location pour ce magasin
    const [location] = await db.insert(planogramLocations).values({
      storeId,
      name: locationName,
      shelfCount: 4,
      shelfWidth: 2000,
      shelfHeight: 300,
      shelfDepth: 400,
    }).$returningId();

    // Créer le planogramme
    const [newPlanogram] = await db.insert(planograms).values({
      locationId: location.id,
      name: `${template.name} - ${locationName}`,
      status: "draft",
      version: 1,
      salesTarget: sourcePlanogram.salesTarget,
    }).$returningId();

    // Copier les produits
    for (const product of sourceProducts) {
      await db.insert(planogramProducts).values({
        planogramId: newPlanogram.id,
        productId: product.productId,
        shelfLevel: product.shelfLevel,
        positionX: product.positionX,
        facings: product.facings,
        quantity: product.quantity,
      });
    }

    // Créer l'historique
    await db.insert(planogramHistory).values({
      planogramId: newPlanogram.id,
      version: 1,
      changeType: "created",
      comment: `Créé depuis le template "${template.name}"`,
    });

    createdPlanograms.push(newPlanogram.id);
  }

  // Incrémenter le compteur d'utilisation du template
  await db
    .update(planogramTemplates)
    .set({ usageCount: sql`${planogramTemplates.usageCount} + ${storeIds.length}` })
    .where(eq(planogramTemplates.id, templateId));

  return {
    success: true,
    created: createdPlanograms.length,
    planogramIds: createdPlanograms,
  };
}

/**
 * Supprime un template
 */
export async function deleteTemplate(templateId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(planogramTemplates)
    .where(eq(planogramTemplates.id, templateId));

  return { success: true };
}


/**
 * Règles de mise en avant automatisées par IA
 */

export async function createPromotionRule(rule: InsertAIPromotionRule): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create promotion rule: database not available");
    return;
  }

  try {
    await db.insert(aiPromotionRules).values(rule);
  } catch (error) {
    console.error("[Database] Failed to create promotion rule:", error);
    throw error;
  }
}

export async function getAllPromotionRules() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get promotion rules: database not available");
    return [];
  }

  try {
    return await db.select().from(aiPromotionRules).where(eq(aiPromotionRules.isActive, true));
  } catch (error) {
    console.error("[Database] Failed to get promotion rules:", error);
    return [];
  }
}

export async function analyzeMarginAndSeasonality(storeId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot analyze margin: database not available");
    return null;
  }

  try {
    // Récupérer les ventes et marges par produit
    const result = await db.select({
      productId: planogramProducts.productId,
      totalSales: sql<number>`SUM(CAST(${salesForecasts.predictedQuantity} AS DECIMAL(15,2)))`,
      avgRevenue: sql<number>`AVG(CAST(${salesForecasts.predictedRevenue} AS DECIMAL(15,2)))`,
    })
    .from(planogramProducts)
    .leftJoin(salesForecasts, eq(planogramProducts.productId, salesForecasts.productId))
    .leftJoin(products, eq(planogramProducts.productId, products.id))
    .groupBy(planogramProducts.productId);

    return result;
  } catch (error) {
    console.error("[Database] Failed to analyze margin:", error);
    return null;
  }
}

/**
 * Simulateur d'impact
 */

export async function createImpactSimulation(simulation: InsertImpactSimulation): Promise<number> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create impact simulation: database not available");
    return 0;
  }

  try {
    const result = await db.insert(impactSimulations).values(simulation);
    return result[0]?.insertId || 0;
  } catch (error) {
    console.error("[Database] Failed to create impact simulation:", error);
    throw error;
  }
}

export async function getImpactSimulations(planogramId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get impact simulations: database not available");
    return [];
  }

  try {
    return await db.select()
      .from(impactSimulations)
      .where(eq(impactSimulations.planogramId, planogramId))
      .orderBy(desc(impactSimulations.createdAt));
  } catch (error) {
    console.error("[Database] Failed to get impact simulations:", error);
    return [];
  }
}

export async function simulateImpact(planogramId: number, baselineCA: number, baselineMargin: number, baselineStockouts: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot simulate impact: database not available");
    return null;
  }

  try {
    // Récupérer les données du planogramme
    const planogram = await db.select()
      .from(planograms)
      .where(eq(planograms.id, planogramId))
      .limit(1);

    if (!planogram.length) {
      console.warn("[Database] Planogram not found:", planogramId);
      return null;
    }

    // Simuler un impact de +10% CA avec amélioration de marge et réduction des ruptures
    const projectedCA = baselineCA * 1.10; // +10% CA
    const projectedMargin = baselineMargin * 1.08; // +8% marge
    const projectedStockouts = Math.max(0, baselineStockouts * 0.85); // -15% ruptures

    const caImpactPercent = ((projectedCA - baselineCA) / baselineCA) * 100;
    const marginImpactPercent = ((projectedMargin - baselineMargin) / baselineMargin) * 100;
    const stockoutReductionPercent = ((baselineStockouts - projectedStockouts) / baselineStockouts) * 100;

    return {
      projectedCA,
      projectedMargin,
      projectedStockouts,
      caImpactPercent,
      marginImpactPercent,
      stockoutReductionPercent,
      confidenceScore: 0.85, // Score de confiance de 85%
    };
  } catch (error) {
    console.error("[Database] Failed to simulate impact:", error);
    return null;
  }
}

export async function updateSimulationStatus(simulationId: number, status: "draft" | "simulated" | "approved" | "applied"): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update simulation status: database not available");
    return;
  }

  try {
    await db.update(impactSimulations)
      .set({ status })
      .where(eq(impactSimulations.id, simulationId));
  } catch (error) {
    console.error("[Database] Failed to update simulation status:", error);
    throw error;
  }
}


// Fonctions pour les graphiques de ventes
export async function getSalesTrendData(storeId?: number, days: number = 30) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get sales trend data: database not available");
    return [];
  }

  try {
    const query = db.select({
      date: salesForecasts.forecastDate,
      quantity: salesForecasts.predictedQuantity,
      revenue: salesForecasts.predictedRevenue,
      storeId: salesForecasts.storeId,
      productId: salesForecasts.productId,
    })
      .from(salesForecasts)
      .orderBy(asc(salesForecasts.forecastDate));

    if (storeId) {
      query.where(eq(salesForecasts.storeId, storeId));
    }

    const data = await query;

    // Grouper par date et calculer les totaux
    const grouped = new Map<string, { date: string; totalQuantity: number; totalRevenue: number }>();
    
    data.forEach(item => {
      const dateStr = item.date instanceof Date 
        ? item.date.toISOString().split('T')[0]
        : String(item.date).split('T')[0];
      
      const existing = grouped.get(dateStr) || { date: dateStr, totalQuantity: 0, totalRevenue: 0 };
      existing.totalQuantity += item.quantity || 0;
      existing.totalRevenue += item.revenue || 0;
      grouped.set(dateStr, existing);
    });

    return Array.from(grouped.values()).slice(-days);
  } catch (error) {
    console.error("[Database] Failed to get sales trend data:", error);
    return [];
  }
}

export async function getProductSalesData(storeId?: number, limit: number = 10) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get product sales data: database not available");
    return [];
  }

  try {
    const query = db.select({
      productId: salesForecasts.productId,
      productName: products.name,
      totalQuantity: sql<number>`SUM(${salesForecasts.predictedQuantity})`,
      totalRevenue: sql<number>`SUM(${salesForecasts.predictedRevenue})`,
      avgConfidence: sql<number>`AVG(${salesForecasts.confidence})`,
    })
      .from(salesForecasts)
      .leftJoin(products, eq(salesForecasts.productId, products.id))
      .groupBy(salesForecasts.productId, products.name);

    if (storeId) {
      query.where(eq(salesForecasts.storeId, storeId));
    }

    const data = await query;
    return data.slice(0, limit);
  } catch (error) {
    console.error("[Database] Failed to get product sales data:", error);
    return [];
  }
}

export async function getStoreSalesComparison() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get store sales comparison: database not available");
    return [];
  }

  try {
    return await db.select({
      storeId: salesForecasts.storeId,
      storeName: stores.name,
      totalQuantity: sql<number>`SUM(${salesForecasts.predictedQuantity})`,
      totalRevenue: sql<number>`SUM(${salesForecasts.predictedRevenue})`,
      avgConfidence: sql<number>`AVG(${salesForecasts.confidence})`,
    })
      .from(salesForecasts)
      .leftJoin(stores, eq(salesForecasts.storeId, stores.id))
      .groupBy(salesForecasts.storeId, stores.name)
      .orderBy(desc(sql<number>`SUM(${salesForecasts.predictedRevenue})`));
  } catch (error) {
    console.error("[Database] Failed to get store sales comparison:", error);
    return [];
  }
}

export async function getSalesMetrics(storeId?: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get sales metrics: database not available");
    return null;
  }

  try {
    const query = db.select({
      totalQuantity: sql<number>`SUM(${salesForecasts.predictedQuantity})`,
      totalRevenue: sql<number>`SUM(${salesForecasts.predictedRevenue})`,
      avgConfidence: sql<number>`AVG(${salesForecasts.confidence})`,
      countRecords: sql<number>`COUNT(*)`,
    })
      .from(salesForecasts);

    if (storeId) {
      query.where(eq(salesForecasts.storeId, storeId));
    }

    const result = await query;
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get sales metrics:", error);
    return null;
  }
}


// Fonction de recherche avancée des planogrammes
export async function searchPlanograms(filters: {
  searchQuery?: string;
  storeId?: number;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { results: [], total: 0 };

  const { searchQuery, storeId, status, startDate, endDate, limit = 20, offset = 0 } = filters;

  let query = db
    .select({
      id: planograms.id,
      name: planograms.name,
      locationId: planograms.locationId,
      locationName: planogramLocations.name,
      storeId: planogramLocations.storeId,
      storeName: stores.name,
      version: planograms.version,
      status: planograms.status,
      createdAt: planograms.createdAt,
      updatedAt: planograms.updatedAt,
    })
    .from(planograms)
    .innerJoin(planogramLocations, eq(planograms.locationId, planogramLocations.id))
    .innerJoin(stores, eq(planogramLocations.storeId, stores.id));

  const conditions = [];

  // Filtre par recherche textuelle
  if (searchQuery) {
    conditions.push(
      or(
        sql`LOWER(${planograms.name}) LIKE LOWER(${`%${searchQuery}%`})`,
        sql`LOWER(${planogramLocations.name}) LIKE LOWER(${`%${searchQuery}%`})`,
        sql`LOWER(${stores.name}) LIKE LOWER(${`%${searchQuery}%`})`
      )
    );
  }

  // Filtre par magasin
  if (storeId) {
    conditions.push(eq(planogramLocations.storeId, storeId));
  }

  // Filtre par statut
  if (status && status !== 'all') {
    conditions.push(eq(planograms.status, status as "draft" | "active" | "archived"));
  }

  // Filtre par date de création
  if (startDate) {
    conditions.push(gte(planograms.createdAt, startDate));
  }
  if (endDate) {
    conditions.push(lte(planograms.createdAt, endDate));
  }

  // Appliquer les conditions
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  // Compter le total
  const countResult = await db
    .select({ count: sql`COUNT(*)` })
    .from(planograms)
    .innerJoin(planogramLocations, eq(planograms.locationId, planogramLocations.id))
    .innerJoin(stores, eq(planogramLocations.storeId, stores.id));

  let totalCount = 0;
  if (countResult.length > 0) {
    totalCount = Number(countResult[0].count) || 0;
  }

  // Appliquer la pagination et le tri
  const results = await query
    .orderBy(desc(planograms.createdAt))
    .limit(limit)
    .offset(offset);

  return { results, total: totalCount };
}

// Fonction pour obtenir les statistiques de recherche
export async function getPlanogramSearchStats() {
  const db = await getDb();
  if (!db) return { totalPlanograms: 0, byStatus: {}, byStore: {} };

  // Total de planogrammes
  const totalResult = await db
    .select({ count: sql`COUNT(*)` })
    .from(planograms);
  const totalPlanograms = Number(totalResult[0]?.count) || 0;

  // Par statut
  const byStatusResult = await db
    .select({
      status: planograms.status,
      count: sql`COUNT(*)`,
    })
    .from(planograms)
    .groupBy(planograms.status);

  const byStatus: Record<string, number> = {};
  byStatusResult.forEach(row => {
    byStatus[row.status] = Number(row.count) || 0;
  });

  // Par magasin
  const byStoreResult = await db
    .select({
      storeId: stores.id,
      storeName: stores.name,
      count: sql`COUNT(${planograms.id})`,
    })
    .from(planograms)
    .innerJoin(planogramLocations, eq(planograms.locationId, planogramLocations.id))
    .innerJoin(stores, eq(planogramLocations.storeId, stores.id))
    .groupBy(stores.id, stores.name);

  const byStore: Record<string, number> = {};
  byStoreResult.forEach(row => {
    byStore[row.storeName] = Number(row.count) || 0;
  });

  return { totalPlanograms, byStatus, byStore };
}
