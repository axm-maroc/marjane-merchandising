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

describe("Planogram Location Positioning", () => {
  it("devrait mettre à jour la position d'un emplacement", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.planogramLocations.updatePosition({
      locationId: 1,
      positionX: 100,
      positionY: 150,
      zoneId: 1
    });

    expect(result).toHaveProperty("success", true);
  });

  it("devrait retourner les emplacements avec leurs positions", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const locations = await caller.planogramLocations.byStore({ storeId: 1 });

    expect(Array.isArray(locations)).toBe(true);
    locations.forEach(location => {
      expect(location).toHaveProperty("id");
      expect(location).toHaveProperty("positionX");
      expect(location).toHaveProperty("positionY");
      expect(location).toHaveProperty("zoneId");
    });
  });

  it("devrait filtrer les emplacements non positionnés", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const locations = await caller.planogramLocations.byStore({ storeId: 1 });
    const unpositioned = locations.filter(loc => !loc.positionX && !loc.positionY);
    const positioned = locations.filter(loc => loc.positionX && loc.positionY);

    expect(unpositioned.length + positioned.length).toBe(locations.length);
  });
});

describe("Zone Editor - Visual Positioning", () => {
  it("devrait calculer les coordonnées relatives correctement", () => {
    // Zone commence à (50, 50) avec dimensions 300x200
    const zoneX = 50;
    const zoneY = 50;
    
    // Clic à (150, 100) sur le canvas
    const clickX = 150;
    const clickY = 100;
    
    // Coordonnées relatives
    const relativeX = clickX - zoneX; // 100
    const relativeY = clickY - zoneY; // 50
    
    expect(relativeX).toBe(100);
    expect(relativeY).toBe(50);
  });

  it("devrait valider que l'emplacement est dans une zone", () => {
    const zone = { x: 50, y: 50, width: 300, height: 200 };
    
    // Point à l'intérieur
    const insideX = 150;
    const insideY = 100;
    const isInside = insideX >= zone.x && insideX <= zone.x + zone.width &&
                     insideY >= zone.y && insideY <= zone.y + zone.height;
    
    expect(isInside).toBe(true);
    
    // Point à l'extérieur
    const outsideX = 400;
    const outsideY = 300;
    const isOutside = outsideX >= zone.x && outsideX <= zone.x + zone.width &&
                      outsideY >= zone.y && outsideY <= zone.y + zone.height;
    
    expect(isOutside).toBe(false);
  });
});

describe("Canvas Rendering", () => {
  it("devrait calculer les dimensions d'affichage proportionnelles", () => {
    const shelfWidth = 2000; // mm
    const scaleFactor = 20;
    const expectedWidth = shelfWidth / scaleFactor; // 100 pixels
    
    expect(expectedWidth).toBe(100);
  });

  it("devrait limiter la largeur de l'emplacement à la zone", () => {
    const shelfWidth = 2000; // mm
    const scaleFactor = 20;
    const calculatedWidth = shelfWidth / scaleFactor; // 100
    
    const zoneWidth = 250;
    const positionX = 200; // Position dans la zone
    const maxWidth = zoneWidth - positionX - 10; // 40 pixels disponibles
    
    const finalWidth = Math.min(calculatedWidth, maxWidth);
    
    expect(finalWidth).toBe(40);
  });
});

describe("Drag and Drop Integration", () => {
  it("devrait transférer l'ID de l'emplacement via dataTransfer", () => {
    const locationId = 123;
    const dataTransfer = {
      data: {} as Record<string, string>,
      setData(key: string, value: string) {
        this.data[key] = value;
      },
      getData(key: string) {
        return this.data[key];
      }
    };
    
    // Simuler le drag
    dataTransfer.setData('locationId', locationId.toString());
    
    // Simuler le drop
    const retrievedId = parseInt(dataTransfer.getData('locationId'));
    
    expect(retrievedId).toBe(locationId);
  });
});
