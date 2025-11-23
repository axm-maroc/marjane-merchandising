import { eq, and, or, gte, lte, like, inArray, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  users,
  stores,
  products,
  planograms,
  planogramLocations,
  planogramProducts,
  stockHistory,
  planogramHistory,
  storeZones,
  zoneSponsors,
  aiRecommendations,
  performanceScores,
  planogramPhotos,
  npsScores,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import type { InsertUser } from "../drizzle/schema";

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
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db
      .insert(users)
      .values(values)
      .onDuplicateKeyUpdate({
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

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Store queries
export async function getStoreById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(stores).where(eq(stores.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getAllStores() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(stores);
}

export async function createStore(data: any) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(stores).values(data);
  return result;
}

// Product queries
export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getAllProducts() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(products);
}

export async function getProductsByCategory(category: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(products).where(eq(products.category, category));
}

// Planogram queries
export async function getPlanogramById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(planograms).where(eq(planograms.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getPlanogramsByStore(storeId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({
      planogram: planograms,
      location: planogramLocations,
    })
    .from(planograms)
    .innerJoin(planogramLocations, eq(planograms.locationId, planogramLocations.id))
    .where(eq(planogramLocations.storeId, storeId));
  return result;
}

export async function getPlanogramsByLocation(locationId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(planograms).where(eq(planograms.locationId, locationId));
}

export async function createPlanogram(data: any) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(planograms).values(data);
  return result;
}

export async function updatePlanogram(id: number, data: any) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.update(planograms).set(data).where(eq(planograms.id, id));
  return result;
}

// Planogram Location queries
export async function getPlanogramLocationById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(planogramLocations)
    .where(eq(planogramLocations.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getPlanogramLocationsByStore(storeId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(planogramLocations).where(eq(planogramLocations.storeId, storeId));
}

export async function getAllPlanogramLocations() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(planogramLocations);
}

export async function createPlanogramLocation(data: any) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(planogramLocations).values(data);
  return result;
}

export async function updatePlanogramLocation(id: number, data: any) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.update(planogramLocations).set(data).where(eq(planogramLocations.id, id));
  return result;
}

// Planogram Product queries
export async function getPlanogramProducts(planogramId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(planogramProducts)
    .where(eq(planogramProducts.planogramId, planogramId));
}

export async function addProductToPlanogram(data: any) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(planogramProducts).values(data);
  return result;
}

export async function removeProductFromPlanogram(planogramId: number, productId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .delete(planogramProducts)
    .where(
      and(
        eq(planogramProducts.planogramId, planogramId),
        eq(planogramProducts.productId, productId)
      )
    );
  return result;
}

// Stock History queries
export async function getStockHistory(productId: number, storeId: number, days: number = 30) {
  const db = await getDb();
  if (!db) return [];
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  return await db
    .select()
    .from(stockHistory)
    .where(
      and(
        eq(stockHistory.productId, productId),
        eq(stockHistory.storeId, storeId),
        gte(stockHistory.date, fromDate)
      )
    )
    .orderBy(desc(stockHistory.date));
}

export async function recordStockHistory(data: any) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(stockHistory).values(data);
  return result;
}

// Planogram History queries
export async function getPlanogramHistory(planogramId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(planogramHistory)
    .where(eq(planogramHistory.planogramId, planogramId))
    .orderBy(desc(planogramHistory.createdAt));
}

export async function savePlanogramVersion(data: any) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(planogramHistory).values(data);
  return result;
}

// Zone queries
export async function getZonesByStore(storeId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(storeZones).where(eq(storeZones.storeId, storeId));
}

export async function getZoneById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(storeZones).where(eq(storeZones.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createZone(data: any) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(storeZones).values(data);
  // Drizzle returns an array with the inserted row when using MySQL
  if (Array.isArray(result) && result.length > 0) {
    return result[0].id;
  }
  // For some drivers, insertId is available
  return (result as any).insertId || null;
}

export async function updateZone(id: number, data: any) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.update(storeZones).set(data).where(eq(storeZones.id, id));
  return result;
}

// Zone Sponsor queries
export async function getZoneSponsorsByZone(zoneId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(zoneSponsors).where(eq(zoneSponsors.zoneId, zoneId));
}

export async function createZoneSponsor(data: any) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(zoneSponsors).values(data);
  return result;
}

// AI Recommendation queries
export async function getRecommendationsByStore(storeId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(aiRecommendations)
    .where(eq(aiRecommendations.storeId, storeId))
    .orderBy(desc(aiRecommendations.createdAt));
}

export async function createRecommendation(data: any) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(aiRecommendations).values(data);
  return result;
}

export async function updateRecommendation(id: number, data: any) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.update(aiRecommendations).set(data).where(eq(aiRecommendations.id, id));
  return result;
}

// Performance Score queries
export async function getPerformanceScores(planogramId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(performanceScores)
    .where(eq(performanceScores.planogramId, planogramId));
}

export async function recordPerformanceScore(data: any) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(performanceScores).values(data);
  return result;
}

// Planogram Photo queries
export async function getPlanogramPhotos(planogramId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(planogramPhotos)
    .where(eq(planogramPhotos.planogramId, planogramId));
}

export async function addPlanogramPhoto(data: any) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(planogramPhotos).values(data);
  return result;
}

// NPS Response queries
export async function getNpsResponsesByStore(storeId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(npsScores).where(eq(npsScores.storeId, storeId));
}

export async function recordNpsResponse(data: any) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(npsScores).values(data);
  return result;
}

// Search queries
export async function searchPlanograms(filters: {
  storeId?: number;
  name?: string;
  status?: string;
  fromDate?: Date;
  toDate?: Date;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];

  if (filters.storeId) {
    conditions.push(eq(planogramLocations.storeId, filters.storeId));
  }

  if (filters.name) {
    conditions.push(like(planograms.name, `%${filters.name}%`));
  }

  if (filters.status) {
    conditions.push(eq(planograms.status, filters.status));
  }

  if (filters.fromDate) {
    conditions.push(gte(planograms.createdAt, filters.fromDate));
  }

  if (filters.toDate) {
    conditions.push(lte(planograms.createdAt, filters.toDate));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  return await db
    .select()
    .from(planograms)
    .innerJoin(planogramLocations, eq(planograms.locationId, planogramLocations.id))
    .where(whereClause)
    .orderBy(desc(planograms.createdAt));
}

// Bulk operations
export async function archivePlanograms(planogramIds: number[]) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .update(planograms)
    .set({ status: "archived" })
    .where(inArray(planograms.id, planogramIds));
  return result;
}

export async function duplicatePlanogram(planogramId: number, newName: string) {
  const db = await getDb();
  if (!db) return null;
  try {
    // Récupérer le planogramme original
    const original = await getPlanogramById(planogramId);
    if (!original) throw new Error("Planogramme introuvable");

    // Récupérer les produits du planogramme original
    const products = await getPlanogramProducts(planogramId);

    // Créer une copie du planogramme
    const location = await getPlanogramLocationById(original.locationId);
    if (!location) throw new Error("Emplacement introuvable");

    // Insérer le nouveau planogramme
    const result = await db.insert(planograms).values({
      locationId: original.locationId,
      name: newName,
      version: 1,
    });

    return result;
  } catch (error) {
    console.error("[Database] Failed to duplicate planogram:", error);
    throw error;
  }
}

// Additional functions for zone management
export async function updatePlanogramLocationZone(locationId: number, zoneId: number | null) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .update(planogramLocations)
    .set({ zoneId })
    .where(eq(planogramLocations.id, locationId));
  return result;
}

export async function getSponsorsByZone(zoneId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(zoneSponsors).where(eq(zoneSponsors.zoneId, zoneId));
}
