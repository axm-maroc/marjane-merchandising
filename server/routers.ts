import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { z } from "zod";
import * as aiRec from "./ai-recommendations";
import * as visionAnomaly from "./vision-anomaly-detection";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Stores
  stores: router({
    list: publicProcedure.query(async () => {
      return await db.getAllStores();
    }),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getStoreById(input.id);
      }),
    getPhotos: publicProcedure
      .input(z.object({ storeId: z.number() }))
      .query(async ({ input }) => {
        return await db.getStorePhotos(input.storeId);
      }),
  }),

  // Products
  products: router({
    list: publicProcedure.query(async () => {
      return await db.getAllProducts();
    }),
    byCategory: publicProcedure
      .input(z.object({ categoryId: z.number() }))
      .query(async ({ input }) => {
        return await db.getProductsByCategory(input.categoryId);
      }),
  }),

  // Categories
  categories: router({
    list: publicProcedure.query(async () => {
      return await db.getAllCategories();
    }),
  }),

  // Planogram Locations
  planogramLocations: router({
    list: publicProcedure
      .query(async () => {
        return await db.getAllPlanogramLocations();
      }),
    byStore: publicProcedure
      .input(z.object({ storeId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPlanogramLocationsByStore(input.storeId);
      }),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getPlanogramLocationById(input.id);
      }),
    updateZone: publicProcedure
      .input(z.object({ 
        locationId: z.number(),
        zoneId: z.number().nullable()
      }))
      .mutation(async ({ input }) => {
        return await db.updatePlanogramLocationZone(input.locationId, input.zoneId);
      }),
    updatePosition: publicProcedure
      .input(z.object({ 
        locationId: z.number(),
        positionX: z.number(),
        positionY: z.number(),
        zoneId: z.number().nullable()
      }))
      .mutation(async ({ input }) => {
        return await db.updatePlanogramLocationPosition(input.locationId, input.positionX, input.positionY, input.zoneId);
      }),
  }),

  // Planograms
  planograms: router({
    byLocation: publicProcedure
      .input(z.object({ locationId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPlanogramsByLocation(input.locationId);
      }),
    byStore: publicProcedure
      .input(z.object({ storeId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPlanogramsByStore(input.storeId);
      }),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getPlanogramById(input.id);
      }),
    getProducts: publicProcedure
      .input(z.object({ planogramId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPlanogramProducts(input.planogramId);
      }),
    getPhotos: publicProcedure
      .input(z.object({ planogramId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPlanogramPhotos(input.planogramId);
      }),
    getHistory: publicProcedure
      .input(z.object({ planogramId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPlanogramHistory(input.planogramId);
      }),
    compareVersions: publicProcedure
      .input(z.object({ 
        planogramId: z.number(),
        version1: z.number(),
        version2: z.number()
      }))
      .query(async ({ input }) => {
        const v1 = await db.getPlanogramVersion(input.planogramId, input.version1);
        const v2 = await db.getPlanogramVersion(input.planogramId, input.version2);
        return { version1: v1, version2: v2 };
      }),
    restoreVersion: publicProcedure
      .input(z.object({
        planogramId: z.number(),
        version: z.number(),
        comment: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.restorePlanogramVersion(input.planogramId, input.version, input.comment);
      }),
    createSimple: publicProcedure
      .input(z.object({
        locationId: z.number(),
        name: z.string(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Récupérer les informations de l'emplacement
        const location = await db.getPlanogramLocationById(input.locationId);
        if (!location) {
          throw new Error("Emplacement introuvable");
        }
        
        // Créer le planogramme avec les dimensions de l'emplacement
        const planogram = await db.createPlanogramLocation({
          storeId: location.storeId,
          name: input.name,
          location: location.name,
          width: location.shelfWidth,
          height: location.shelfHeight * location.shelfCount,
          depth: location.shelfDepth,
        });
        
        return planogram;
      }),
    create: publicProcedure
      .input(z.object({
        storeId: z.number(),
        name: z.string(),
        location: z.string(),
        width: z.number(),
        height: z.number(),
        depth: z.number(),
        theme: z.string(),
        productIds: z.array(z.number()),
      }))
      .mutation(async ({ input }) => {
        // Créer le planogramme
        const planogram = await db.createPlanogramLocation({
          storeId: input.storeId,
          name: input.name,
          location: input.location,
          width: input.width,
          height: input.height,
          depth: input.depth,
        });
        
        // Ajouter les produits au planogramme
        for (const productId of input.productIds) {
          await db.addProductToPlanogram({
            planogramId: planogram.id,
            productId,
            position: 0, // Position par défaut, sera mise à jour lors du placement
          });
        }
        
        // Sauvegarder automatiquement la version initiale
        await db.savePlanogramVersion(planogram.id, "Création initiale du planogramme");
        
        return planogram;
      }),
    updateStatus: publicProcedure
      .input(z.object({
        planogramId: z.number(),
        status: z.enum(["draft", "active", "archived"]),
      }))
      .mutation(async ({ input }) => {
        // Mettre à jour le statut
        await db.updatePlanogramStatus(input.planogramId, input.status);
        
        // Sauvegarder automatiquement une version
        await db.savePlanogramVersion(
          input.planogramId, 
          `Changement de statut vers "${input.status}"`
        );
        
        return { success: true };
      }),
    addProduct: publicProcedure
      .input(z.object({
        planogramId: z.number(),
        productId: z.number(),
        position: z.number(),
      }))
      .mutation(async ({ input }) => {
        // Ajouter le produit
        await db.addProductToPlanogram(input);
        
        // Sauvegarder automatiquement une version
        const product = await db.getProductById(input.productId);
        await db.savePlanogramVersion(
          input.planogramId,
          `Ajout du produit "${product?.name || 'inconnu'}" au planogramme`
        );
        
        return { success: true };
      }),
    removeProduct: publicProcedure
      .input(z.object({
        planogramId: z.number(),
        productId: z.number(),
      }))
      .mutation(async ({ input }) => {
        // Récupérer le nom du produit avant suppression
        const product = await db.getProductById(input.productId);
        
        // Supprimer le produit
        await db.removeProductFromPlanogram(input.planogramId, input.productId);
        
        // Sauvegarder automatiquement une version
        await db.savePlanogramVersion(
          input.planogramId,
          `Suppression du produit "${product?.name || 'inconnu'}" du planogramme`
        );
        
        return { success: true };
      }),
  }),

  // Stock History
  stock: router({
    history: publicProcedure
      .input(z.object({
        storeId: z.number(),
        productId: z.number(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getStockHistory(input.storeId, input.productId, input.startDate, input.endDate);
      }),
    summary: publicProcedure
      .input(z.object({
        storeId: z.number(),
        productId: z.number(),
      }))
      .query(async ({ input }) => {
        return await db.getStockSummary(input.storeId, input.productId);
      }),
    forecast: publicProcedure
      .input(z.object({
        storeId: z.number(),
        productId: z.number(),
        days: z.number().default(30),
      }))
      .query(async ({ input }) => {
        return await db.getStockForecast(input.storeId, input.productId, input.days);
      }),
    alerts: publicProcedure
      .input(z.object({
        storeId: z.number(),
        threshold: z.number().default(0.2), // 20% du stock moyen
      }))
      .query(async ({ input }) => {
        return await db.getStockAlerts(input.storeId, input.threshold);
      }),
  }),

  // Sales Forecasts
  forecasts: router({
    list: publicProcedure
      .input(z.object({
        storeId: z.number(),
        planogramId: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getSalesForecasts(input.storeId, input.planogramId);
      }),
  }),

  // Anomalies
  anomalies: router({
    byPlanogram: publicProcedure
      .input(z.object({ planogramId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAnomaliesByPlanogram(input.planogramId);
      }),
    detect: publicProcedure
      .input(z.object({
        planogramId: z.number(),
        photoUrl: z.string(),
        photoType: z.enum(["real", "reference"]),
      }))
      .mutation(async ({ input }) => {
        return await visionAnomaly.detectAnomalies(input);
      }),
    compare: publicProcedure
      .input(z.object({
        beforeUrl: z.string(),
        afterUrl: z.string(),
        planogramId: z.number(),
      }))
      .mutation(async ({ input }) => {
        return await visionAnomaly.comparePhotos(input.beforeUrl, input.afterUrl, input.planogramId);
      }),
  }),

  // Recommendations
  recommendations: router({
    byPlanogram: publicProcedure
      .input(z.object({ planogramId: z.number() }))
      .query(async ({ input }) => {
        return await db.getRecommendationsByPlanogram(input.planogramId);
      }),
    byToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        return await db.getRecommendationByToken(input.token);
      }),
    generate: publicProcedure
      .input(z.object({
        storeId: z.number(),
        planogramId: z.number().optional(),
        productIds: z.array(z.number()).optional(),
        type: z.enum(["assortment", "placement", "pricing", "promotion"]),
      }))
      .mutation(async ({ input }) => {
        return await aiRec.generateRecommendations(input);
      }),
    analyzePlanogram: publicProcedure
      .input(z.object({ planogramId: z.number() }))
      .query(async ({ input }) => {
        return await aiRec.analyzePlanogramEfficiency(input.planogramId);
      }),
    productCorrelations: publicProcedure
      .input(z.object({ storeId: z.number(), productId: z.number() }))
      .query(async ({ input }) => {
        return await aiRec.calculateProductCorrelations(input.storeId, input.productId);
      }),
    share: publicProcedure
      .input(z.object({ 
        recommendationId: z.number(),
        expiresInDays: z.number().default(30),
      }))
      .mutation(async ({ input }) => {
        // Générer un token unique
        const shareToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);
        
        // TODO: Sauvegarder le lien de partage dans la base de données
        // Pour l'instant, on retourne juste le token
        
        return { shareToken, expiresAt };
      }),
  }),

  // Photos terrain
  photos: router({
    upload: publicProcedure
      .input(z.object({
        planogramId: z.number().optional(),
        storeId: z.number(),
        userId: z.number(),
        url: z.string(),
        fileKey: z.string(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        description: z.string().optional(),
        timestamp: z.date(),
      }))
      .mutation(async ({ input }) => {
        return await db.savePlanogramPhoto(input);
      }),
    getUserPhotos: publicProcedure
      .input(z.object({ 
        userId: z.number(),
        limit: z.number().default(20),
      }))
      .query(async ({ input }) => {
        return await db.getUserPhotos(input.userId, input.limit);
      }),
  }),

  // Zones magasin
  zones: router({
    byStore: publicProcedure
      .input(z.object({ storeId: z.number() }))
      .query(async ({ input }) => {
        return await db.getZonesByStore(input.storeId);
      }),
    byId: publicProcedure
      .input(z.object({ zoneId: z.number() }))
      .query(async ({ input }) => {
        return await db.getZoneById(input.zoneId);
      }),
    create: publicProcedure
      .input(z.object({
        storeId: z.number(),
        name: z.string(),
        code: z.string(),
        surface: z.number().optional(),
        location: z.string().optional(),
        status: z.enum(['active', 'inactive', 'maintenance']).default('active'),
      }))
      .mutation(async ({ input }) => {
        return await db.createStoreZone(input);
      }),
    update: publicProcedure
      .input(z.object({
        zoneId: z.number(),
        name: z.string().optional(),
        code: z.string().optional(),
        surface: z.number().optional(),
        location: z.string().optional(),
        status: z.enum(['active', 'inactive', 'maintenance']).optional(),
      }))
      .mutation(async ({ input }) => {
        const { zoneId, ...data } = input;
        return await db.updateStoreZone(zoneId, data);
      }),
    delete: publicProcedure
      .input(z.object({ zoneId: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteStoreZone(input.zoneId);
      }),
  }),

  // Sponsoring
  sponsors: router({
    byZone: publicProcedure
      .input(z.object({ zoneId: z.number() }))
      .query(async ({ input }) => {
        return await db.getSponsorsByZone(input.zoneId);
      }),
    active: publicProcedure
      .input(z.object({ zoneId: z.number() }))
      .query(async ({ input }) => {
        return await db.getActiveSponsorByZone(input.zoneId);
      }),
    create: publicProcedure
      .input(z.object({
        zoneId: z.number(),
        supplierName: z.string(),
        supplierLogo: z.string().optional(),
        contractAmount: z.number(),
        startDate: z.date(),
        endDate: z.date(),
        contactName: z.string().optional(),
        contactEmail: z.string().optional(),
        contactPhone: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createZoneSponsor(input);
      }),
    update: publicProcedure
      .input(z.object({
        sponsorId: z.number(),
        supplierName: z.string().optional(),
        supplierLogo: z.string().optional(),
        contractAmount: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        status: z.enum(['active', 'expired', 'cancelled']).optional(),
        contactName: z.string().optional(),
        contactEmail: z.string().optional(),
        contactPhone: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { sponsorId, ...data } = input;
        return await db.updateZoneSponsor(sponsorId, data);
      }),
    expiring: publicProcedure
      .input(z.object({ daysBeforeExpiry: z.number().default(30) }))
      .query(async ({ input }) => {
        return await db.getExpiringSponsorships(input.daysBeforeExpiry);
      }),
    revenue: publicProcedure
      .input(z.object({
        storeId: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getSponsorshipRevenue(input.storeId, input.startDate, input.endDate);
      }),
  }),

  // Recommandations IA
  aiRecommendations: router({
    generate: publicProcedure
      .input(z.object({ storeId: z.number() }))
      .mutation(async ({ input }) => {
        const { generateRecommendations, saveRecommendations } = await import('./recommendation-engine');
        const recommendations = await generateRecommendations(input.storeId);
        await saveRecommendations(recommendations);
        return { count: recommendations.length, recommendations };
      }),
    byStore: publicProcedure
      .input(z.object({
        storeId: z.number(),
        status: z.enum(['pending', 'applied', 'dismissed', 'expired']).optional(),
      }))
      .query(async ({ input }) => {
        const { getRecommendationsByStore } = await import('./recommendation-engine');
        return await getRecommendationsByStore(input.storeId, input.status);
      }),
    markAsApplied: publicProcedure
      .input(z.object({ recommendationId: z.number() }))
      .mutation(async ({ input }) => {
        const { markRecommendationAsApplied } = await import('./recommendation-engine');
        // Utiliser un userId par défaut pour le moment
        await markRecommendationAsApplied(input.recommendationId, 1);
        return { success: true };
      }),
    dismiss: publicProcedure
      .input(z.object({ recommendationId: z.number() }))
      .mutation(async ({ input }) => {
        const { dismissRecommendation } = await import('./recommendation-engine');
        // Utiliser un userId par défaut pour le moment
        await dismissRecommendation(input.recommendationId, 1);
        return { success: true };
      }),
  }),

  // Analytics Dashboard
  analytics: router({
    globalKPIs: publicProcedure.query(async () => {
      return await db.getGlobalKPIs();
    }),
    storePerformance: publicProcedure
      .input(z.object({ 
        period: z.enum(['week', 'month', 'year']).optional() 
      }))
      .query(async ({ input }) => {
        return await db.getStorePerformance(input.period || 'month');
      }),
    topProducts: publicProcedure
      .input(z.object({ 
        limit: z.number().optional(),
        storeId: z.number().optional()
      }))
      .query(async ({ input }) => {
        return await db.getTopProducts(input.limit || 10, input.storeId);
      }),
    salesTrends: publicProcedure
      .input(z.object({ 
        period: z.enum(['week', 'month', 'year']).optional() 
      }))
      .query(async ({ input }) => {
        return await db.getSalesTrends(input.period || 'month');
      }),
  }),

  // Import/Export Planogrammes
  planogramExport: router({
    toCSV: publicProcedure
      .input(z.object({ planogramId: z.number() }))
      .query(async ({ input }) => {
        return await db.exportPlanogramToCSV(input.planogramId);
      }),
    fromCSV: publicProcedure
      .input(z.object({
        storeId: z.number(),
        csvData: z.string(),
        name: z.string(),
      }))
      .mutation(async ({ input }) => {
        return await db.importPlanogramFromCSV(input.storeId, input.csvData, input.name);
      }),
  }),


  // Simulateur d'Impact
  impactSimulator: router({
    simulate: publicProcedure
      .input(z.object({
        planogramId: z.number(),
        changes: z.array(z.object({
          productId: z.number(),
          currentFacings: z.number(),
          newFacings: z.number(),
          currentShelfLevel: z.number(),
          newShelfLevel: z.number(),
          isNewProduct: z.boolean().optional(),
          isRemovedProduct: z.boolean().optional(),
        })),
      }))
      .query(async ({ input }) => {
        const { simulateImpact } = await import('./impact-simulator');
        const productMetrics = await db.getProductMetricsForSimulation(input.planogramId);
        return simulateImpact(input.changes, productMetrics || []);
      }),
    compareVersions: publicProcedure
      .input(z.object({
        currentPlanogramId: z.number(),
        newPlanogramId: z.number(),
      }))
      .query(async ({ input }) => {
        const { simulateImpact } = await import('./impact-simulator');
        const changes = await db.getPlanogramChanges(input.currentPlanogramId, input.newPlanogramId);
        const productMetrics = await db.getProductMetricsForSimulation(input.currentPlanogramId);
        return simulateImpact(changes, productMetrics || []);
      }),
  }),
});

export type AppRouter = typeof appRouter;
