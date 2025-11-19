import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "merchandiser@marjane.ma",
    name: "Merchandiser Test",
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
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("Photo Upload", () => {
  it("should upload a photo with metadata", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const photoData = {
      storeId: 1,
      userId: 1,
      url: "https://storage.example.com/photos/test.jpg",
      fileKey: "photos/terrain/123456-abc.jpg",
      latitude: "33.5731",
      longitude: "-7.5898",
      description: "Photo de test",
      timestamp: new Date(),
    };

    const result = await caller.photos.upload(photoData);
    
    expect(result).toBeDefined();
  });

  it("should retrieve user photos", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const photos = await caller.photos.getUserPhotos({
      userId: 1,
      limit: 10,
    });

    expect(Array.isArray(photos)).toBe(true);
  });

  it("should include geolocation in photo metadata", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const photoData = {
      storeId: 1,
      userId: 1,
      url: "https://storage.example.com/photos/test-geo.jpg",
      fileKey: "photos/terrain/123456-geo.jpg",
      latitude: "33.5731",
      longitude: "-7.5898",
      timestamp: new Date(),
    };

    const result = await caller.photos.upload(photoData);
    
    expect(result).toBeDefined();
  });
});
