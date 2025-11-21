import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@marjane.ma",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("KPIs Stratégiques", () => {
  const ctx = createTestContext();
  const caller = appRouter.createCaller(ctx);

  describe("CA/m² par catégorie", () => {
    it("devrait retourner un tableau de CA/m² par catégorie", async () => {
      const result = await caller.kpis.revenuePerSqm({ storeId: 1 });
      
      expect(Array.isArray(result)).toBe(true);
      
      if (result.length > 0) {
        expect(result[0]).toHaveProperty("categoryId");
        expect(result[0]).toHaveProperty("totalRevenue");
        expect(result[0]).toHaveProperty("revenuePerSqm");
        expect(typeof result[0].categoryId).toBe("number");
        expect(typeof result[0].totalRevenue).toBe("number");
        expect(typeof result[0].revenuePerSqm).toBe("number");
      }
    });
  });

  describe("Taux de rotation par catégorie", () => {
    it("devrait retourner un tableau de taux de rotation par catégorie", async () => {
      const result = await caller.kpis.rotationByCategory({ storeId: 1 });
      
      expect(Array.isArray(result)).toBe(true);
      
      if (result.length > 0) {
        expect(result[0]).toHaveProperty("categoryId");
        expect(result[0]).toHaveProperty("totalIn");
        expect(result[0]).toHaveProperty("totalOut");
        expect(result[0]).toHaveProperty("rotationRate");
        expect(typeof result[0].rotationRate).toBe("number");
        expect(result[0].rotationRate).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("Taux de rupture", () => {
    it("devrait calculer le taux de rupture de stock", async () => {
      const result = await caller.kpis.stockoutRate({ storeId: 1 });
      
      expect(result).toHaveProperty("stockoutRate");
      expect(result).toHaveProperty("totalStockouts");
      expect(result).toHaveProperty("averageDuration");
      
      expect(typeof result.stockoutRate).toBe("number");
      expect(typeof result.totalStockouts).toBe("number");
      expect(typeof result.averageDuration).toBe("number");
      
      expect(result.stockoutRate).toBeGreaterThanOrEqual(0);
      expect(result.totalStockouts).toBeGreaterThanOrEqual(0);
    });

    it("devrait accepter des filtres de date", async () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-12-31");
      
      const result = await caller.kpis.stockoutRate({ 
        storeId: 1,
        startDate,
        endDate
      });
      
      expect(result).toHaveProperty("stockoutRate");
      expect(typeof result.stockoutRate).toBe("number");
    });
  });

  describe("Score NPS", () => {
    it("devrait calculer le score NPS", async () => {
      const result = await caller.kpis.npsScore({ storeId: 1 });
      
      expect(result).toHaveProperty("npsScore");
      expect(result).toHaveProperty("promoters");
      expect(result).toHaveProperty("passives");
      expect(result).toHaveProperty("detractors");
      expect(result).toHaveProperty("totalResponses");
      
      expect(typeof result.npsScore).toBe("number");
      expect(result.npsScore).toBeGreaterThanOrEqual(-100);
      expect(result.npsScore).toBeLessThanOrEqual(100);
      
      expect(result.totalResponses).toBe(result.promoters + result.passives + result.detractors);
    });

    it("devrait soumettre un score NPS et déterminer la catégorie automatiquement", async () => {
      // Test promoteur (9-10)
      const promoterResult = await caller.kpis.submitNPS({
        storeId: 1,
        score: 9,
        comment: "Excellent service!",
      });
      
      expect(promoterResult).toBeDefined();

      // Test passif (7-8)
      const passiveResult = await caller.kpis.submitNPS({
        storeId: 1,
        score: 7,
        comment: "Bien mais peut mieux faire",
      });
      
      expect(passiveResult).toBeDefined();

      // Test détracteur (0-6)
      const detractorResult = await caller.kpis.submitNPS({
        storeId: 1,
        score: 5,
        comment: "Service décevant",
      });
      
      expect(detractorResult).toBeDefined();
    });

    it("devrait rejeter un score NPS invalide", async () => {
      await expect(
        caller.kpis.submitNPS({
          storeId: 1,
          score: 11, // Score invalide
        })
      ).rejects.toThrow();

      await expect(
        caller.kpis.submitNPS({
          storeId: 1,
          score: -1, // Score invalide
        })
      ).rejects.toThrow();
    });
  });

  describe("Temps d'actualisation des planogrammes", () => {
    it("devrait calculer le temps moyen d'actualisation", async () => {
      const result = await caller.kpis.updateTime({ storeId: 1 });
      
      expect(result).toHaveProperty("averageDelay");
      expect(result).toHaveProperty("minDelay");
      expect(result).toHaveProperty("maxDelay");
      expect(result).toHaveProperty("pendingCount");
      
      expect(typeof result.averageDelay).toBe("number");
      expect(typeof result.minDelay).toBe("number");
      expect(typeof result.maxDelay).toBe("number");
      expect(typeof result.pendingCount).toBe("number");
      
      expect(result.averageDelay).toBeGreaterThanOrEqual(0);
      expect(result.pendingCount).toBeGreaterThanOrEqual(0);
    });

    it("devrait marquer un planogramme comme appliqué", async () => {
      const result = await caller.kpis.markPlanogramApplied({ planogramId: 1 });
      expect(result).toBeDefined();
    });
  });

  describe("Enregistrement de rupture de stock", () => {
    it("devrait enregistrer une rupture de stock", async () => {
      const stockoutDate = new Date("2024-06-01");
      const restoredDate = new Date("2024-06-02");
      const durationHours = 24;

      const result = await caller.kpis.recordStockout({
        storeId: 1,
        productId: 1,
        planogramId: 1,
        stockoutDate,
        restoredDate,
        durationHours,
        lostSalesEstimate: 50000, // 500 MAD en centimes
      });

      expect(result).toBeDefined();
    });
  });

  describe("Validation des objectifs", () => {
    it("les KPIs devraient être mesurables et comparables aux objectifs", async () => {
      // Objectifs définis dans le document
      const objectives = {
        revenuePerSqmIncrease: 10, // +10%
        rotationIncrease: 15, // +15%
        stockoutDecrease: 30, // -30%
        npsIncrease: 15, // +15 points
        updateTimeDecrease: 30, // -30%
      };

      // Vérifier que chaque KPI retourne des valeurs numériques mesurables
      const revenueData = await caller.kpis.revenuePerSqm({ storeId: 1 });
      const rotationData = await caller.kpis.rotationByCategory({ storeId: 1 });
      const stockoutData = await caller.kpis.stockoutRate({ storeId: 1 });
      const npsData = await caller.kpis.npsScore({ storeId: 1 });
      const updateTimeData = await caller.kpis.updateTime({ storeId: 1 });

      // Tous les KPIs doivent retourner des valeurs numériques
      expect(Array.isArray(revenueData)).toBe(true);
      expect(Array.isArray(rotationData)).toBe(true);
      expect(typeof stockoutData.stockoutRate).toBe("number");
      expect(typeof npsData.npsScore).toBe("number");
      expect(typeof updateTimeData.averageDelay).toBe("number");
    });
  });
});
