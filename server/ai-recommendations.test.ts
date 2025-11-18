import { describe, expect, it, vi, beforeEach } from "vitest";
import * as aiRec from "./ai-recommendations";
import * as db from "./db";

// Mock the database functions
vi.mock("./db", () => ({
  getStoreById: vi.fn(),
  getPlanogramById: vi.fn(),
  getPlanogramProducts: vi.fn(),
  getSalesForecasts: vi.fn(),
  getAllProducts: vi.fn(),
}));

// Mock the LLM function
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

describe("AI Recommendations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw error if store not found", async () => {
    vi.mocked(db.getStoreById).mockResolvedValue(undefined);

    await expect(
      aiRec.generateRecommendations({
        storeId: 999,
        type: "assortment",
      })
    ).rejects.toThrow("Store not found");
  });

  it("should generate recommendations with valid store", async () => {
    // Mock store data
    vi.mocked(db.getStoreById).mockResolvedValue({
      id: 1,
      name: "Test Store",
      city: "Test City",
      surface: 1000,
      address: "123 Test St",
      latitude: null,
      longitude: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(db.getAllProducts).mockResolvedValue([
      {
        id: 1,
        categoryId: 1,
        name: "Test Product",
        brand: "Test Brand",
        unitPrice: 1000,
        sku: "TEST-001",
        barcode: "123456789",
        photoUrl: "http://example.com/photo.jpg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    vi.mocked(db.getSalesForecasts).mockResolvedValue([]);

    // Mock LLM response
    const { invokeLLM } = await import("./_core/llm");
    vi.mocked(invokeLLM).mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              title: "Test Recommendation",
              description: "Test description",
              confidence: 85,
              expectedImpact: "+10% CA",
              actions: [
                {
                  action: "Test action",
                  reason: "Test reason",
                  priority: "high",
                },
              ],
              insights: ["Test insight"],
            }),
            role: "assistant",
          },
          finish_reason: "stop",
          index: 0,
        },
      ],
      id: "test-id",
      created: Date.now(),
      model: "test-model",
      object: "chat.completion",
    });

    const result = await aiRec.generateRecommendations({
      storeId: 1,
      type: "assortment",
    });

    expect(result).toBeDefined();
    expect(result.type).toBe("assortment");
    expect(result.title).toBe("Test Recommendation");
    expect(result.confidence).toBe(85);
    expect(result.actions).toHaveLength(1);
    expect(result.insights).toHaveLength(1);
  });
});
