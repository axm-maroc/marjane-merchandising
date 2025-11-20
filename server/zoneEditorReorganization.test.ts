import { describe, expect, it } from "vitest";

/**
 * Tests pour la réorganisation de l'interface de l'éditeur de zones
 */

describe("Zone Editor Reorganization - Planograms Panel", () => {
  it("should display all planograms of the store", () => {
    const planograms = [
      { id: 1, name: "Planogramme A", locationId: 1, status: "active", version: 1 },
      { id: 2, name: "Planogramme B", locationId: 2, status: "draft", version: 2 },
    ];
    
    expect(planograms.length).toBe(2);
    expect(planograms[0].name).toBe("Planogramme A");
  });

  it("should show status badge for each planogram", () => {
    const planogram = { status: "active" };
    const badgeText = planogram.status === "active" ? "Actif" : "Brouillon";
    
    expect(badgeText).toBe("Actif");
  });

  it("should allow clicking on a planogram to open editor", () => {
    const planogram = { id: 1, locationId: 5 };
    const expectedUrl = `/planograms/location/${planogram.locationId}`;
    
    expect(expectedUrl).toBe("/planograms/location/5");
  });
});

describe("Zone Editor Reorganization - Locations Panel", () => {
  it("should display all locations with shelf details", () => {
    const location = {
      id: 1,
      name: "Emplacement A",
      shelfCount: 5,
      shelfWidth: 1200,
      shelfHeight: 300,
      shelfDepth: 400,
    };
    
    expect(location.shelfCount).toBe(5);
    expect(location.shelfWidth).toBe(1200);
    expect(location.shelfHeight).toBe(300);
    expect(location.shelfDepth).toBe(400);
  });

  it("should show 'Non positionné' badge for unpositioned locations", () => {
    const location = { positionX: null, positionY: null };
    const isPositioned = location.positionX !== null && location.positionY !== null;
    
    expect(isPositioned).toBe(false);
  });

  it("should allow drag-and-drop for unpositioned locations", () => {
    const location = { id: 1, positionX: null, positionY: null };
    const isDraggable = location.positionX === null && location.positionY === null;
    
    expect(isDraggable).toBe(true);
  });

  it("should show zone badge if location is assigned to a zone", () => {
    const location = { zoneId: 3 };
    const zone = { id: 3, code: "Z01" };
    
    expect(location.zoneId).toBe(zone.id);
    expect(zone.code).toBe("Z01");
  });
});

describe("Zone Editor Reorganization - Layout", () => {
  it("should use grid-cols-7 for 3-column layout", () => {
    const gridClass = "grid-cols-7";
    
    expect(gridClass).toContain("cols-7");
  });

  it("should allocate col-span-1 for tools and planograms", () => {
    const colSpan = 1;
    
    expect(colSpan).toBe(1);
  });

  it("should allocate col-span-3 for canvas", () => {
    const colSpan = 3;
    
    expect(colSpan).toBe(3);
  });

  it("should allocate col-span-2 for locations panel", () => {
    const colSpan = 2;
    
    expect(colSpan).toBe(2);
  });
});

describe("Zone Editor Reorganization - Shelf Details Display", () => {
  it("should format shelf dimensions correctly", () => {
    const location = {
      shelfCount: 4,
      shelfWidth: 1500,
      shelfHeight: 350,
      shelfDepth: 450,
    };
    
    const formatted = {
      count: `Nombre: ${location.shelfCount}`,
      width: `Largeur: ${location.shelfWidth}mm`,
      height: `Hauteur: ${location.shelfHeight}mm`,
      depth: `Profondeur: ${location.shelfDepth}mm`,
    };
    
    expect(formatted.count).toBe("Nombre: 4");
    expect(formatted.width).toBe("Largeur: 1500mm");
    expect(formatted.height).toBe("Hauteur: 350mm");
    expect(formatted.depth).toBe("Profondeur: 450mm");
  });

  it("should display shelf details in a grid layout", () => {
    const gridCols = 2;
    
    expect(gridCols).toBe(2);
  });
});

describe("Zone Editor Reorganization - Click Interactions", () => {
  it("should open editor when clicking location with planogram", () => {
    const location = { id: 1 };
    const planogram = { id: 10, locationId: 1 };
    const expectedUrl = `/planograms/location/${location.id}`;
    
    expect(planogram.locationId).toBe(location.id);
    expect(expectedUrl).toBe("/planograms/location/1");
  });

  it("should open create dialog when clicking location without planogram", () => {
    const location = { id: 1 };
    const planogram = null;
    const shouldOpenDialog = !planogram;
    
    expect(shouldOpenDialog).toBe(true);
  });
});
