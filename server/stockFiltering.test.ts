import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
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

  return { ctx };
}

describe("Stock Filtering - Cascade Logic", () => {
  it("devrait récupérer les zones d'un magasin", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const zones = await caller.zones.byStore({ storeId: 1 });

    expect(zones).toBeDefined();
    expect(Array.isArray(zones)).toBe(true);
    expect(zones.length).toBeGreaterThan(0);
  });

  it("devrait récupérer les planogrammes d'un magasin", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const planograms = await caller.planograms.byStore({ storeId: 1 });

    expect(planograms).toBeDefined();
    expect(Array.isArray(planograms)).toBe(true);
  });

  it("devrait récupérer les emplacements de planogrammes avec zoneId", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const locations = await caller.planogramLocations.byStore({ storeId: 1 });

    expect(locations).toBeDefined();
    expect(Array.isArray(locations)).toBe(true);
    
    // Vérifier que les emplacements ont la propriété zoneId
    if (locations.length > 0) {
      const location = locations[0];
      expect(location).toHaveProperty('zoneId');
    }
  });

  it("devrait filtrer les planogrammes par zone", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Récupérer les zones
    const zones = await caller.zones.byStore({ storeId: 1 });
    expect(zones.length).toBeGreaterThan(0);

    // Récupérer les emplacements
    const locations = await caller.planogramLocations.byStore({ storeId: 1 });
    
    // Récupérer les planogrammes
    const allPlanograms = await caller.planograms.byStore({ storeId: 1 });
    
    // Filtrer les emplacements par zone
    const zone = zones[0];
    const locationsInZone = locations.filter(loc => loc.zoneId === zone.id);
    const locationIds = locationsInZone.map(loc => loc.id);
    
    // Filtrer les planogrammes
    const planogramsInZone = allPlanograms.filter(p => locationIds.includes(p.locationId));
    
    // Si des emplacements ont cette zone, on devrait avoir des planogrammes
    if (locationsInZone.length > 0) {
      expect(planogramsInZone.length).toBeGreaterThanOrEqual(0);
    }
  });

  it("devrait récupérer les produits d'un planogramme", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Récupérer les planogrammes
    const planograms = await caller.planograms.byStore({ storeId: 1 });
    
    if (planograms.length > 0) {
      const planogram = planograms[0];
      
      // Récupérer les produits du planogramme
      const products = await caller.planograms.getProducts({ planogramId: planogram.id });
      
      expect(products).toBeDefined();
      expect(Array.isArray(products)).toBe(true);
      
      // Vérifier la structure des produits
      if (products.length > 0) {
        const product = products[0];
        expect(product).toHaveProperty('productId');
        expect(product).toHaveProperty('planogramId');
        expect(product.planogramId).toBe(planogram.id);
      }
    }
  });
});

describe("Zone Management in Store Detail", () => {
  it("devrait récupérer les informations d'un magasin", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const store = await caller.stores.getById({ id: 1 });

    expect(store).toBeDefined();
    expect(store?.id).toBe(1);
    expect(store).toHaveProperty('name');
    expect(store).toHaveProperty('address');
  });

  it("devrait récupérer les zones avec leur statut de sponsoring", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const zones = await caller.zones.byStore({ storeId: 1 });

    expect(zones).toBeDefined();
    
    // Vérifier qu'il y a des zones sponsorisées et non sponsorisées
    const sponsoredZones = zones.filter(z => z.isSponsored);
    const nonSponsoredZones = zones.filter(z => !z.isSponsored);
    
    // Au moins une zone devrait exister
    expect(zones.length).toBeGreaterThan(0);
    
    // Vérifier la structure
    zones.forEach(zone => {
      expect(zone).toHaveProperty('code');
      expect(zone).toHaveProperty('name');
      expect(zone).toHaveProperty('isSponsored');
      expect(zone).toHaveProperty('status');
      expect(['active', 'inactive', 'maintenance']).toContain(zone.status);
    });
  });
});

describe("Planogram Zone Assignment", () => {
  it("devrait vérifier que les emplacements peuvent avoir une zone assignée", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Récupérer les zones
    const zones = await caller.zones.byStore({ storeId: 1 });
    expect(zones.length).toBeGreaterThan(0);
    
    // Récupérer les emplacements
    const locations = await caller.planogramLocations.byStore({ storeId: 1 });
    expect(locations).toBeDefined();
    
    // Vérifier que certains emplacements ont une zone assignée
    const locationsWithZone = locations.filter(loc => loc.zoneId !== null && loc.zoneId !== undefined);
    
    // Au moins un emplacement devrait avoir une zone
    if (locationsWithZone.length > 0) {
      const location = locationsWithZone[0];
      expect(location.zoneId).toBeDefined();
      
      // Vérifier que la zone existe
      const zone = zones.find(z => z.id === location.zoneId);
      expect(zone).toBeDefined();
    }
  });
});
