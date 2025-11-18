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
  }),

  // Planograms
  planograms: router({
    byLocation: publicProcedure
      .input(z.object({ locationId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPlanogramsByLocation(input.locationId);
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
        
        return planogram;
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
});

export type AppRouter = typeof appRouter;
