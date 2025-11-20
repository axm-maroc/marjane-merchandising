import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { stores, storeZones, planogramLocations } from "../drizzle/schema";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
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

describe("Filtres du panneau Emplacements", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let testStoreId: number;
  let testZone1Id: number;
  let testZone2Id: number;

  beforeEach(async () => {
    const { ctx } = createAuthContext();
    caller = appRouter.createCaller(ctx);
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Créer un magasin de test
    const [insertedStore] = await db.insert(stores).values({
      name: "Test Store Filters",
      address: "123 Test Street",
      city: "Test City",
      surface: 5000,
    });
    testStoreId = insertedStore.insertId;

    // Créer deux zones de test
    const [insertedZone1] = await db.insert(storeZones).values({
      storeId: testStoreId,
      code: "Z1",
      name: "Zone Entrée",
      x: 50,
      y: 50,
      width: 200,
      height: 150,
      surface: 30,
      isSponsored: false,
      status: "active",
    });
    testZone1Id = insertedZone1.insertId;

    const [insertedZone2] = await db.insert(storeZones).values({
      storeId: testStoreId,
      code: "Z2",
      name: "Zone Centrale",
      x: 300,
      y: 100,
      width: 250,
      height: 200,
      surface: 50,
      isSponsored: true,
      status: "active",
    });
    testZone2Id = insertedZone2.insertId;

    // Créer trois emplacements de test
    await db.insert(planogramLocations).values([
      {
        storeId: testStoreId,
        name: "Emplacement Laitier",
        shelfCount: 5,
        zoneId: testZone1Id,
        positionX: 100,
        positionY: 80,
      },
      {
        storeId: testStoreId,
        name: "Emplacement Boissons",
        shelfCount: 4,
        zoneId: testZone1Id,
        positionX: 150,
        positionY: 120,
      },
      {
        storeId: testStoreId,
        name: "Emplacement Épicerie",
        shelfCount: 6,
        zoneId: testZone2Id,
        positionX: 350,
        positionY: 150,
      },
    ]);
  });

  it("devrait récupérer tous les emplacements d'un magasin", async () => {
    const locations = await caller.planogramLocations.byStore({ storeId: testStoreId });
    
    expect(locations).toHaveLength(3);
    expect(locations.map(l => l.name)).toContain("Emplacement Laitier");
    expect(locations.map(l => l.name)).toContain("Emplacement Boissons");
    expect(locations.map(l => l.name)).toContain("Emplacement Épicerie");
  });

  it("devrait filtrer les emplacements par zone", async () => {
    const locations = await caller.planogramLocations.byStore({ storeId: testStoreId });
    
    // Filtrer par zone 1
    const zone1Locations = locations.filter(l => l.zoneId === testZone1Id);
    expect(zone1Locations).toHaveLength(2);
    expect(zone1Locations.map(l => l.name)).toContain("Emplacement Laitier");
    expect(zone1Locations.map(l => l.name)).toContain("Emplacement Boissons");
    
    // Filtrer par zone 2
    const zone2Locations = locations.filter(l => l.zoneId === testZone2Id);
    expect(zone2Locations).toHaveLength(1);
    expect(zone2Locations[0]?.name).toBe("Emplacement Épicerie");
  });

  it("devrait filtrer les emplacements par recherche de nom", async () => {
    const locations = await caller.planogramLocations.byStore({ storeId: testStoreId });
    
    // Recherche "Laitier"
    const laitierResults = locations.filter(l => 
      l.name.toLowerCase().includes("laitier")
    );
    expect(laitierResults).toHaveLength(1);
    expect(laitierResults[0]?.name).toBe("Emplacement Laitier");
    
    // Recherche "Emplacement"
    const emplacementResults = locations.filter(l => 
      l.name.toLowerCase().includes("emplacement")
    );
    expect(emplacementResults).toHaveLength(3);
  });

  it("devrait combiner les filtres de recherche et de zone", async () => {
    const locations = await caller.planogramLocations.byStore({ storeId: testStoreId });
    
    // Filtrer par zone 1 ET recherche "Boissons"
    const filteredResults = locations.filter(l => 
      l.zoneId === testZone1Id && l.name.toLowerCase().includes("boissons")
    );
    
    expect(filteredResults).toHaveLength(1);
    expect(filteredResults[0]?.name).toBe("Emplacement Boissons");
    expect(filteredResults[0]?.zoneId).toBe(testZone1Id);
  });

  it("devrait retourner un tableau vide si aucun emplacement ne correspond aux filtres", async () => {
    const locations = await caller.planogramLocations.byStore({ storeId: testStoreId });
    
    // Recherche d'un nom inexistant
    const noResults = locations.filter(l => 
      l.name.toLowerCase().includes("inexistant")
    );
    
    expect(noResults).toHaveLength(0);
  });

  it("devrait afficher le nombre correct d'emplacements filtrés", async () => {
    const locations = await caller.planogramLocations.byStore({ storeId: testStoreId });
    
    // Tous les emplacements
    expect(locations.length).toBe(3);
    
    // Emplacements de la zone 1
    const zone1Count = locations.filter(l => l.zoneId === testZone1Id).length;
    expect(zone1Count).toBe(2);
    
    // Emplacements avec "Emplacement" dans le nom
    const searchCount = locations.filter(l => 
      l.name.toLowerCase().includes("emplacement")
    ).length;
    expect(searchCount).toBe(3);
  });
});
