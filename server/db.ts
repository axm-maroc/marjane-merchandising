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
  stockHistory,
  salesForecasts,
  anomalies,
  recommendations,
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
  return await db.select().from(planogramPhotos).where(eq(planogramPhotos.planogramId, planogramId)).orderBy(desc(planogramPhotos.takenAt));
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
