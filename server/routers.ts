import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { z } from "zod";

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
  }),
});

export type AppRouter = typeof appRouter;
