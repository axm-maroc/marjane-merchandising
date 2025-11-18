import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("Recommendations Integration Test", () => {
  let ctx: TrpcContext;
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(() => {
    // Create a mock context
    ctx = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as any,
      res: {} as any,
    };
    caller = appRouter.createCaller(ctx);
  });

  it("should list stores", async () => {
    const stores = await caller.stores.list();
    expect(stores).toBeDefined();
    expect(Array.isArray(stores)).toBe(true);
    console.log(`Found ${stores.length} stores`);
    
    if (stores.length > 0) {
      console.log("First store:", stores[0]);
    }
  });

  it("should generate recommendations for a store", async () => {
    const stores = await caller.stores.list();
    
    if (stores.length === 0) {
      console.log("No stores found, skipping recommendation test");
      return;
    }

    const storeId = stores[0].id;
    console.log(`Generating recommendations for store ${storeId}...`);

    try {
      const recommendation = await caller.recommendations.generate({
        storeId,
        type: "assortment",
      });

      expect(recommendation).toBeDefined();
      expect(recommendation.type).toBe("assortment");
      console.log("Recommendation generated successfully:", recommendation);
    } catch (error) {
      console.error("Error generating recommendation:", error);
      throw error;
    }
  }, 60000); // 60 second timeout for LLM call
});
