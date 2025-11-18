import { describe, expect, it, vi, beforeEach } from "vitest";
import * as visionAnomaly from "./vision-anomaly-detection";
import * as db from "./db";

// Mock the database functions
vi.mock("./db", () => ({
  getPlanogramById: vi.fn(),
  getPlanogramProducts: vi.fn(),
  getAllProducts: vi.fn(),
}));

// Mock the LLM function
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

describe("Vision Anomaly Detection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw error if planogram not found", async () => {
    vi.mocked(db.getPlanogramById).mockResolvedValue(undefined);

    await expect(
      visionAnomaly.detectAnomalies({
        planogramId: 999,
        photoUrl: "http://example.com/photo.jpg",
        photoType: "real",
      })
    ).rejects.toThrow("Planogram not found");
  });

  it("should detect anomalies with valid planogram", async () => {
    // Mock planogram data
    vi.mocked(db.getPlanogramById).mockResolvedValue({
      id: 1,
      locationId: 1,
      name: "Test Planogram",
      status: "active",
      salesTarget: 100000,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(db.getPlanogramProducts).mockResolvedValue([
      {
        id: 1,
        planogramId: 1,
        productId: 1,
        productName: "Test Product",
        productPhotoUrl: "http://example.com/product.jpg",
        shelfLevel: 2,
        positionX: 0,
        positionY: 0,
        width: 10,
        height: 20,
        depth: 15,
        facings: 3,
        quantity: 10,
      },
    ]);

    vi.mocked(db.getAllProducts).mockResolvedValue([
      {
        id: 1,
        categoryId: 1,
        name: "Test Product",
        brand: "Test Brand",
        unitPrice: 1000,
        sku: "TEST-001",
        barcode: "123456789",
        photoUrl: "http://example.com/product.jpg",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Mock LLM response
    const { invokeLLM } = await import("./_core/llm");
    vi.mocked(invokeLLM).mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              overallScore: 85,
              summary: "Good compliance",
              anomalies: [
                {
                  type: "wrong_position",
                  severity: "medium",
                  productName: "Test Product",
                  description: "Product slightly misplaced",
                  suggestion: "Adjust position",
                  confidence: 75,
                },
              ],
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

    const result = await visionAnomaly.detectAnomalies({
      planogramId: 1,
      photoUrl: "http://example.com/photo.jpg",
      photoType: "real",
    });

    expect(result).toBeDefined();
    expect(result.overallScore).toBe(85);
    expect(result.anomalies).toHaveLength(1);
    expect(result.anomalies[0].type).toBe("wrong_position");
  });
});
