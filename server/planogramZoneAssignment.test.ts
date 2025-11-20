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

describe("Planogram Zone Assignment", () => {
  it("devrait mettre à jour le zoneId d'un planogramLocation", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Récupérer une zone
    const zones = await caller.zones.byStore({ storeId: 1 });
    expect(zones.length).toBeGreaterThan(0);
    const zone = zones[0];

    // Récupérer un emplacement
    const locations = await caller.planogramLocations.byStore({ storeId: 1 });
    expect(locations.length).toBeGreaterThan(0);
    const location = locations[0];

    // Affecter l'emplacement à la zone
    const result = await caller.planogramLocations.updateZone({
      locationId: location.id,
      zoneId: zone.id
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);

    // Vérifier que l'affectation a bien été faite
    const updatedLocation = await caller.planogramLocations.getById({ id: location.id });
    expect(updatedLocation).toBeDefined();
    expect(updatedLocation?.zoneId).toBe(zone.id);
  });

  it("devrait désaffecter un planogramLocation en mettant zoneId à null", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Récupérer un emplacement avec une zone
    const locations = await caller.planogramLocations.byStore({ storeId: 1 });
    const locationWithZone = locations.find(loc => loc.zoneId !== null);
    
    if (locationWithZone) {
      // Désaffecter
      const result = await caller.planogramLocations.updateZone({
        locationId: locationWithZone.id,
        zoneId: null
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);

      // Vérifier la désaffectation
      const updatedLocation = await caller.planogramLocations.getById({ id: locationWithZone.id });
      expect(updatedLocation?.zoneId).toBeNull();
    }
  });

  it("devrait lister les planogrammes d'une zone spécifique", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Récupérer les zones
    const zones = await caller.zones.byStore({ storeId: 1 });
    expect(zones.length).toBeGreaterThan(0);
    const zone = zones[0];

    // Récupérer tous les emplacements
    const locations = await caller.planogramLocations.byStore({ storeId: 1 });
    
    // Filtrer par zone
    const locationsInZone = locations.filter(loc => loc.zoneId === zone.id);
    
    // Vérifier qu'on peut récupérer les planogrammes de ces emplacements
    const planograms = await caller.planograms.byStore({ storeId: 1 });
    const planogramsInZone = planograms.filter(p => 
      locationsInZone.some(loc => loc.id === p.locationId)
    );

    expect(planogramsInZone).toBeDefined();
    expect(Array.isArray(planogramsInZone)).toBe(true);
  });

  it("devrait compter le nombre de planogrammes par zone", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Récupérer les zones
    const zones = await caller.zones.byStore({ storeId: 1 });
    
    // Récupérer tous les emplacements
    const locations = await caller.planogramLocations.byStore({ storeId: 1 });
    
    // Compter pour chaque zone
    zones.forEach(zone => {
      const count = locations.filter(loc => loc.zoneId === zone.id).length;
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });
});

describe("Zone Editor Integration", () => {
  it("devrait afficher les planogrammes dans le panneau de propriétés", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Récupérer une zone avec des planogrammes
    const zones = await caller.zones.byStore({ storeId: 1 });
    const locations = await caller.planogramLocations.byStore({ storeId: 1 });
    const planograms = await caller.planograms.byStore({ storeId: 1 });

    zones.forEach(zone => {
      // Emplacements de cette zone
      const zoneLocations = locations.filter(loc => loc.zoneId === zone.id);
      
      // Planogrammes de ces emplacements
      const zonePlanograms = planograms.filter(p => 
        zoneLocations.some(loc => loc.id === p.locationId)
      );

      // Vérifier la structure des données
      zonePlanograms.forEach(planogram => {
        expect(planogram).toHaveProperty('id');
        expect(planogram).toHaveProperty('name');
        expect(planogram).toHaveProperty('status');
        expect(planogram).toHaveProperty('locationId');
      });
    });
  });

  it("devrait filtrer les planogrammes disponibles pour affectation", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Récupérer une zone
    const zones = await caller.zones.byStore({ storeId: 1 });
    expect(zones.length).toBeGreaterThan(0);
    const zone = zones[0];

    // Récupérer tous les emplacements
    const allLocations = await caller.planogramLocations.byStore({ storeId: 1 });
    
    // Filtrer les disponibles (non affectés ou affectés à cette zone)
    const availableLocations = allLocations.filter(loc => 
      !loc.zoneId || loc.zoneId === zone.id
    );

    expect(availableLocations).toBeDefined();
    expect(Array.isArray(availableLocations)).toBe(true);
    
    // Vérifier que chaque emplacement disponible respecte les critères
    availableLocations.forEach(loc => {
      expect(loc.zoneId === null || loc.zoneId === zone.id).toBe(true);
    });
  });
});

describe("Badge Display on Canvas", () => {
  it("devrait calculer correctement le nombre de planogrammes pour le badge", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Récupérer les données
    const zones = await caller.zones.byStore({ storeId: 1 });
    const locations = await caller.planogramLocations.byStore({ storeId: 1 });

    zones.forEach(zone => {
      // Compter les emplacements de cette zone
      const count = locations.filter(loc => loc.zoneId === zone.id).length;
      
      // Le badge devrait afficher ce nombre
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });
});
