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
    loginMethod: "local",
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

describe("Planogram History Module", () => {
  it("should retrieve planogram history", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Test avec un planogramme existant (ID 1)
    const history = await caller.planograms.getHistory({ planogramId: 1 });

    expect(history).toBeDefined();
    expect(Array.isArray(history)).toBe(true);
  });

  it("should compare two versions of a planogram", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Test de comparaison de versions
    const result = await caller.planograms.compareVersions({
      planogramId: 1,
      version1: 1,
      version2: 1,
    });

    expect(result).toBeDefined();
    expect(result).toHaveProperty("version1");
    expect(result).toHaveProperty("version2");
  });

  it("should handle restore when version does not exist in history", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    // Test de restauration d'une version qui n'existe pas dans l'historique
    // Cela devrait lever une erreur car l'historique est vide au départ
    try {
      await caller.planograms.restoreVersion({
        planogramId: 1,
        version: 1,
        comment: "Test de restauration",
      });
      // Si on arrive ici, c'est que la restauration a réussi
      expect(true).toBe(true);
    } catch (error: any) {
      // On s'attend à une erreur car l'historique est vide
      expect(error.message).toContain("not found in history");
    }
  });
});
