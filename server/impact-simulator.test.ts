import { describe, it, expect } from 'vitest';
import { simulateImpact } from './impact-simulator';

describe('Impact Simulator', () => {
  it('should calculate impact for product changes', () => {
    const changes = [
      {
        productId: 1,
        currentFacings: 3,
        newFacings: 5,
        currentShelfLevel: 2,
        newShelfLevel: 3,
        isNewProduct: false,
        isRemovedProduct: false,
      },
    ];

    const productMetrics = [
      {
        productId: 1,
        name: 'Coca-Cola 1.5L',
        currentSales: 100,
        currentMargin: 20,
        unitPrice: 250, // 2.50 EUR en centimes
        currentStock: 50,
        stockRotation: 15,
      },
    ];

    const result = simulateImpact(changes, productMetrics);

    // Vérifier que les résultats sont calculés
    expect(result).toBeDefined();
    expect(result.impact).toBeDefined();
    expect(result.currentMetrics).toBeDefined();
    expect(result.projectedMetrics).toBeDefined();
    expect(result.productImpacts).toBeDefined();

    // Vérifier que l'augmentation de facings augmente les ventes
    expect(result.impact.caImpact).toBeGreaterThan(0);
    expect(result.impact.caImpactPercent).toBeGreaterThan(0);

    // Vérifier que la marge augmente
    expect(result.impact.marginImpact).toBeGreaterThan(0);

    // Vérifier que la rotation s'améliore (diminue)
    expect(result.impact.rotationImpactPercent).toBeLessThan(0);
  });

  it('should handle product removal', () => {
    const changes = [
      {
        productId: 1,
        currentFacings: 3,
        newFacings: 0,
        currentShelfLevel: 2,
        newShelfLevel: 0,
        isNewProduct: false,
        isRemovedProduct: true,
      },
    ];

    const productMetrics = [
      {
        productId: 1,
        name: 'Coca-Cola 1.5L',
        currentSales: 100,
        currentMargin: 20,
        unitPrice: 250, // 2.50 EUR en centimes
        currentStock: 50,
        stockRotation: 15,
      },
    ];

    const result = simulateImpact(changes, productMetrics);

    // Vérifier que la suppression diminue le CA
    expect(result.impact.caImpact).toBeLessThan(0);
    expect(result.impact.caImpactPercent).toBeLessThan(0);

    // Vérifier que les ruptures augmentent
    expect(result.impact.rupturesImpactPercent).toBeGreaterThan(0);
  });

  it('should handle new product addition', () => {
    const changes = [
      {
        productId: 2,
        currentFacings: 0,
        newFacings: 3,
        currentShelfLevel: 0,
        newShelfLevel: 2,
        isNewProduct: true,
        isRemovedProduct: false,
      },
    ];

    const productMetrics = [
      {
        productId: 2,
        name: 'Sprite 1.5L',
        currentSales: 50, // Estimation conservatrice pour un nouveau produit
        currentMargin: 20,
        unitPrice: 250, // 2.50 EUR en centimes
        currentStock: 100,
        stockRotation: 20,
      },
    ];

    const result = simulateImpact(changes, productMetrics);

    // Vérifier que l'ajout augmente le CA
    // Le CA augmente car on ajoute un produit avec des ventes estimées
    expect(result.projectedMetrics.totalCA).toBeGreaterThan(result.currentMetrics.totalCA);
    expect(result.impact.caImpactPercent).toBeGreaterThan(0);
  });

  it('should provide confidence score', () => {
    const changes = [
      {
        productId: 1,
        currentFacings: 3,
        newFacings: 5,
        currentShelfLevel: 2,
        newShelfLevel: 3,
        isNewProduct: false,
        isRemovedProduct: false,
      },
    ];

    const productMetrics = [
      {
        productId: 1,
        name: 'Coca-Cola 1.5L',
        currentSales: 100,
        currentMargin: 20,
        unitPrice: 250, // 2.50 EUR en centimes
        currentStock: 50,
        stockRotation: 15,
      },
    ];

    const result = simulateImpact(changes, productMetrics);

    // Vérifier que le score de confiance est entre 0 et 100
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(100);
  });

  it('should provide recommendation', () => {
    const changes = [
      {
        productId: 1,
        currentFacings: 3,
        newFacings: 5,
        currentShelfLevel: 2,
        newShelfLevel: 3,
        isNewProduct: false,
        isRemovedProduct: false,
      },
    ];

    const productMetrics = [
      {
        productId: 1,
        name: 'Coca-Cola 1.5L',
        currentSales: 100,
        currentMargin: 20,
        unitPrice: 250, // 2.50 EUR en centimes
        currentStock: 50,
        stockRotation: 15,
      },
    ];

    const result = simulateImpact(changes, productMetrics);

    // Vérifier que la recommandation est une chaîne non vide
    expect(result.recommendation).toBeDefined();
    expect(result.recommendation.length).toBeGreaterThan(0);
  });
});
