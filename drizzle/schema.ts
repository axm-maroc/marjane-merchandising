import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Magasins Marjane
 */
export const stores = mysqlTable("stores", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  surface: int("surface"), // Surface en m²
  phone: varchar("phone", { length: 20 }),
  managerName: varchar("managerName", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Store = typeof stores.$inferSelect;
export type InsertStore = typeof stores.$inferInsert;

/**
 * Photos des magasins
 */
export const storePhotos = mysqlTable("storePhotos", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  url: text("url").notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  description: text("description"),
  isPrimary: boolean("isPrimary").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StorePhoto = typeof storePhotos.$inferSelect;
export type InsertStorePhoto = typeof storePhotos.$inferInsert;

/**
 * Catégories de produits
 */
export const productCategories = mysqlTable("productCategories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  parentId: int("parentId"), // Pour hiérarchie de catégories
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProductCategory = typeof productCategories.$inferSelect;
export type InsertProductCategory = typeof productCategories.$inferInsert;

/**
 * Produits
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  sku: varchar("sku", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  brand: varchar("brand", { length: 255 }),
  categoryId: int("categoryId").notNull(),
  description: text("description"),
  photoUrl: text("photoUrl"),
  photoFileKey: varchar("photoFileKey", { length: 500 }),
  barcode: varchar("barcode", { length: 50 }),
  unitPrice: int("unitPrice").notNull(), // Prix en centimes
  width: int("width"), // Largeur en mm
  height: int("height"), // Hauteur en mm
  depth: int("depth"), // Profondeur en mm
  weight: int("weight"), // Poids en grammes
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Emplacements/Rayonnages dans les magasins
 */
export const planogramLocations = mysqlTable("planogramLocations", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  zoneId: int("zoneId"), // Référence à la zone du magasin (optionnel)
  name: varchar("name", { length: 255 }).notNull(),
  zone: varchar("zone", { length: 100 }), // Zone du magasin (entrée, allée 1, etc.) - legacy field
  shelfCount: int("shelfCount").default(4).notNull(), // Nombre d'étagères
  shelfWidth: int("shelfWidth").default(2000).notNull(), // Largeur en mm
  shelfHeight: int("shelfHeight").default(300).notNull(), // Hauteur par étagère en mm
  shelfDepth: int("shelfDepth").default(400).notNull(), // Profondeur en mm
  positionX: int("positionX"), // Position X sur le canvas de l'éditeur de zones (en pixels)
  positionY: int("positionY"), // Position Y sur le canvas de l'éditeur de zones (en pixels)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlanogramLocation = typeof planogramLocations.$inferSelect;
export type InsertPlanogramLocation = typeof planogramLocations.$inferInsert;

/**
 * Planogrammes (versions)
 */
export const planograms = mysqlTable("planograms", {
  id: int("id").autoincrement().primaryKey(),
  locationId: int("locationId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  version: int("version").default(1).notNull(),
  status: mysqlEnum("status", ["draft", "active", "archived"]).default("draft").notNull(),
  salesTarget: int("salesTarget"), // Objectif de vente en centimes
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  appliedAt: timestamp("appliedAt"), // Date d'application terrain du planogramme
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Planogram = typeof planograms.$inferSelect;
export type InsertPlanogram = typeof planograms.$inferInsert;

/**
 * Placement des produits dans les planogrammes
 */
export const planogramProducts = mysqlTable("planogramProducts", {
  id: int("id").autoincrement().primaryKey(),
  planogramId: int("planogramId").notNull(),
  productId: int("productId").notNull(),
  shelfLevel: int("shelfLevel").notNull(), // Niveau d'étagère (0 = bas, 3 = haut)
  positionX: int("positionX").notNull(), // Position horizontale en mm
  facings: int("facings").default(1).notNull(), // Nombre de faces du produit
  quantity: int("quantity").default(1).notNull(), // Quantité de produits
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PlanogramProduct = typeof planogramProducts.$inferSelect;
export type InsertPlanogramProduct = typeof planogramProducts.$inferInsert;

/**
 * Photos réelles des planogrammes
 */
export const planogramPhotos = mysqlTable("planogramPhotos", {
  id: int("id").autoincrement().primaryKey(),
  planogramId: int("planogramId"),
  storeId: int("storeId").notNull(),
  userId: int("userId").notNull(), // Merchandiser qui a pris la photo
  url: text("url").notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  latitude: varchar("latitude", { length: 50 }),
  longitude: varchar("longitude", { length: 50 }),
  description: text("description"),
  timestamp: timestamp("timestamp").notNull(), // Moment de la prise de photo
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PlanogramPhoto = typeof planogramPhotos.$inferSelect;
export type InsertPlanogramPhoto = typeof planogramPhotos.$inferInsert;

/**
 * Historique des versions de planogrammes
 */
export const planogramHistory = mysqlTable("planogramHistory", {
  id: int("id").autoincrement().primaryKey(),
  planogramId: int("planogramId").notNull(),
  version: int("version").notNull(),
  changeType: mysqlEnum("changeType", ["created", "updated", "activated", "archived", "restored"]).notNull(),
  changedBy: varchar("changedBy", { length: 255 }),
  comment: text("comment"),
  snapshot: text("snapshot"), // JSON snapshot des données du planogramme
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PlanogramHistory = typeof planogramHistory.$inferSelect;
export type InsertPlanogramHistory = typeof planogramHistory.$inferInsert;

/**
 * Historique des stocks
 */
export const stockHistory = mysqlTable("stockHistory", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  productId: int("productId").notNull(),
  quantity: int("quantity").notNull(),
  movementType: mysqlEnum("movementType", ["in", "out", "adjustment", "sale"]).notNull(),
  recordedAt: timestamp("recordedAt").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StockHistory = typeof stockHistory.$inferSelect;
export type InsertStockHistory = typeof stockHistory.$inferInsert;

/**
 * Prévisions de vente
 */
export const salesForecasts = mysqlTable("salesForecasts", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  productId: int("productId").notNull(),
  planogramId: int("planogramId"),
  forecastDate: timestamp("forecastDate").notNull(),
  predictedQuantity: int("predictedQuantity").notNull(),
  predictedRevenue: int("predictedRevenue").notNull(), // En centimes
  confidence: int("confidence").default(80).notNull(), // Pourcentage de confiance
  algorithm: varchar("algorithm", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SalesForecast = typeof salesForecasts.$inferSelect;
export type InsertSalesForecast = typeof salesForecasts.$inferInsert;

/**
 * Anomalies détectées
 */
export const anomalies = mysqlTable("anomalies", {
  id: int("id").autoincrement().primaryKey(),
  planogramId: int("planogramId").notNull(),
  planogramPhotoId: int("planogramPhotoId"),
  type: mysqlEnum("type", ["misplaced", "missing", "excess", "damaged"]).notNull(),
  productId: int("productId"),
  severity: mysqlEnum("severity", ["low", "medium", "high"]).default("medium").notNull(),
  description: text("description").notNull(),
  status: mysqlEnum("status", ["open", "resolved", "ignored"]).default("open").notNull(),
  detectedAt: timestamp("detectedAt").notNull(),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Anomaly = typeof anomalies.$inferSelect;
export type InsertAnomaly = typeof anomalies.$inferInsert;

/**
 * Recommandations
 */
export const recommendations = mysqlTable("recommendations", {
  id: int("id").autoincrement().primaryKey(),
  planogramId: int("planogramId").notNull(),
  type: mysqlEnum("type", ["placement", "assortment", "pricing", "stock"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium").notNull(),
  expectedImpact: text("expectedImpact"),
  status: mysqlEnum("status", ["pending", "accepted", "rejected", "implemented"]).default("pending").notNull(),
  shareToken: varchar("shareToken", { length: 64 }).unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Recommendation = typeof recommendations.$inferSelect;
export type InsertRecommendation = typeof recommendations.$inferInsert;

/**
 * Zones dans les magasins
 */
export const storeZones = mysqlTable("storeZones", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  name: varchar("name", { length: 255 }).notNull(), // Ex: "Zone Entrée", "Rayon Central", "Zone Promotions"
  code: varchar("code", { length: 50 }).notNull(), // Ex: "Z01", "Z02"
  surface: int("surface"), // Surface en m²
  location: text("location"), // Description de l'emplacement
  isSponsored: boolean("isSponsored").default(false).notNull(),
  status: mysqlEnum("status", ["active", "inactive", "maintenance"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StoreZone = typeof storeZones.$inferSelect;
export type InsertStoreZone = typeof storeZones.$inferInsert;

/**
 * Contrats de sponsoring des zones par les fournisseurs
 */
export const zoneSponsors = mysqlTable("zoneSponsors", {
  id: int("id").autoincrement().primaryKey(),
  zoneId: int("zoneId").notNull(),
  supplierName: varchar("supplierName", { length: 255 }).notNull(), // Ex: "Procter & Gamble", "Unilever"
  supplierLogo: text("supplierLogo"), // URL du logo du fournisseur
  contractAmount: int("contractAmount").notNull(), // Montant en centimes (DH)
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  status: mysqlEnum("status", ["active", "expired", "cancelled"]).default("active").notNull(),
  contactName: varchar("contactName", { length: 255 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 20 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ZoneSponsor = typeof zoneSponsors.$inferSelect;
export type InsertZoneSponsor = typeof zoneSponsors.$inferInsert;


/**
 * Recommandations IA pour l'optimisation merchandising
 */
export const aiRecommendations = mysqlTable("aiRecommendations", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  zoneId: int("zoneId"),
  planogramId: int("planogramId"),
  productId: int("productId"),
  type: mysqlEnum("type", [
    "reposition", // Repositionner un produit
    "facing", // Ajuster le nombre de facings
    "cross_merchandising", // Suggestion de cross-merchandising
    "dereference", // Déréférencer un produit
    "new_product", // Ajouter un nouveau produit
  ]).notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  currentValue: text("currentValue"), // Valeur actuelle (JSON)
  suggestedValue: text("suggestedValue"), // Valeur suggérée (JSON)
  estimatedImpact: int("estimatedImpact"), // Impact estimé en centimes (DH)
  estimatedImpactPercent: int("estimatedImpactPercent"), // Impact estimé en pourcentage
  confidence: int("confidence").notNull(), // Score de confiance 0-100
  status: mysqlEnum("status", ["pending", "applied", "dismissed", "expired"]).default("pending").notNull(),
  appliedAt: timestamp("appliedAt"),
  appliedBy: int("appliedBy"), // User ID
  dismissedAt: timestamp("dismissedAt"),
  dismissedBy: int("dismissedBy"), // User ID
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AIRecommendation = typeof aiRecommendations.$inferSelect;
export type InsertAIRecommendation = typeof aiRecommendations.$inferInsert;

/**
 * Scores de performance des produits/planogrammes
 */
export const performanceScores = mysqlTable("performanceScores", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  planogramId: int("planogramId"),
  productId: int("productId"),
  period: varchar("period", { length: 20 }).notNull(), // Ex: "2024-W12", "2024-03"
  salesScore: int("salesScore").notNull(), // Score de ventes 0-100
  rotationScore: int("rotationScore").notNull(), // Score de rotation 0-100
  marginScore: int("marginScore").notNull(), // Score de marge 0-100
  complianceScore: int("complianceScore").notNull(), // Score de conformité 0-100
  overallScore: int("overallScore").notNull(), // Score global 0-100
  salesAmount: int("salesAmount"), // CA en centimes
  stockLevel: int("stockLevel"), // Niveau de stock
  rotationDays: int("rotationDays"), // Jours de rotation
  marginPercent: int("marginPercent"), // Marge en pourcentage * 100
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PerformanceScore = typeof performanceScores.$inferSelect;
export type InsertPerformanceScore = typeof performanceScores.$inferInsert;


/**
 * Scores NPS (Net Promoter Score) - Satisfaction client
 */
export const npsScores = mysqlTable("npsScores", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  score: int("score").notNull(), // 0-10
  category: mysqlEnum("category", ["promoter", "passive", "detractor"]).notNull(),
  comment: text("comment"),
  customerEmail: varchar("customerEmail", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NPSScore = typeof npsScores.$inferSelect;
export type InsertNPSScore = typeof npsScores.$inferInsert;

/**
 * Historique des ruptures de stock
 */
export const stockoutHistory = mysqlTable("stockoutHistory", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  productId: int("productId").notNull(),
  planogramId: int("planogramId"),
  stockoutDate: timestamp("stockoutDate").notNull(),
  restoredDate: timestamp("restoredDate"),
  durationHours: int("durationHours"), // Durée de la rupture en heures
  lostSalesEstimate: int("lostSalesEstimate"), // Estimation des ventes perdues en centimes
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StockoutHistory = typeof stockoutHistory.$inferSelect;
export type InsertStockoutHistory = typeof stockoutHistory.$inferInsert;
