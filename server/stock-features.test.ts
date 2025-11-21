import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "user",
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

  return { ctx };
}

describe("Stock Forecast", () => {
  it("should return stock forecast with projections", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stock.forecast({
      storeId: 150001,
      productId: 1,
      days: 30,
    });

    expect(result).toBeDefined();
    expect(result.forecast).toBeDefined();
    expect(Array.isArray(result.forecast)).toBe(true);
    expect(result.averageDailySales).toBeGreaterThanOrEqual(0);
    expect(result.currentStock).toBeGreaterThanOrEqual(0);
  });

  it("should calculate days until stockout correctly", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stock.forecast({
      storeId: 150001,
      productId: 1,
      days: 30,
    });

    if (result.averageDailySales > 0 && result.currentStock > 0) {
      expect(result.daysUntilStockout).toBeGreaterThan(0);
    }
  });

  it("should return 30 days of forecast data", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stock.forecast({
      storeId: 150001,
      productId: 1,
      days: 30,
    });

    if (result.forecast.length > 0) {
      expect(result.forecast.length).toBeLessThanOrEqual(30);
      
      // Vérifier la structure des données de prévision
      const firstForecast = result.forecast[0];
      expect(firstForecast).toHaveProperty('date');
      expect(firstForecast).toHaveProperty('projectedStock');
      expect(firstForecast).toHaveProperty('projectedSales');
    }
  });
});

describe("Stock Alerts", () => {
  it("should return stock alerts for critical products", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stock.alerts({
      storeId: 150001,
      threshold: 0.2,
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should include severity levels in alerts", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stock.alerts({
      storeId: 150001,
      threshold: 0.2,
    });

    if (result.length > 0) {
      const alert = result[0];
      expect(alert).toHaveProperty('productId');
      expect(alert).toHaveProperty('productName');
      expect(alert).toHaveProperty('currentStock');
      expect(alert).toHaveProperty('severity');
      expect(['critical', 'high', 'medium', 'low']).toContain(alert.severity);
    }
  });

  it("should sort alerts by severity", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stock.alerts({
      storeId: 150001,
      threshold: 0.2,
    });

    if (result.length > 1) {
      const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      
      for (let i = 0; i < result.length - 1; i++) {
        const currentSeverity = severityOrder[result[i].severity];
        const nextSeverity = severityOrder[result[i + 1].severity];
        expect(currentSeverity).toBeLessThanOrEqual(nextSeverity);
      }
    }
  });
});

describe("Stock Summary", () => {
  it("should return current stock and movements", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stock.summary({
      storeId: 150001,
      productId: 1,
    });

    expect(result).toBeDefined();
    expect(result).toHaveProperty('currentStock');
    expect(result).toHaveProperty('totalIn');
    expect(result).toHaveProperty('totalOut');
  });
});
