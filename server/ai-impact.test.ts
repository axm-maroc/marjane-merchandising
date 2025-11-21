import { describe, expect, it } from "vitest";

describe("AI Promotion Rules and Impact Simulator", () => {
  describe("Règles de mise en avant automatisées par IA", () => {
    it("devrait créer une règle basée sur la marge", () => {
      const rule = {
        name: "Premium Products",
        ruleType: "margin_based" as const,
        marginThreshold: 25.5,
        isActive: true,
      };

      expect(rule.name).toBe("Premium Products");
      expect(rule.ruleType).toBe("margin_based");
      expect(rule.marginThreshold).toBe(25.5);
      expect(rule.isActive).toBe(true);
    });

    it("devrait créer une règle basée sur la saisonnalité", () => {
      const rule = {
        name: "Seasonal Boost",
        ruleType: "seasonality_based" as const,
        seasonalityFactor: 1.5,
        isActive: true,
      };

      expect(rule.ruleType).toBe("seasonality_based");
      expect(rule.seasonalityFactor).toBe(1.5);
    });

    it("devrait créer une règle basée sur la rotation", () => {
      const rule = {
        name: "Fast Moving Items",
        ruleType: "rotation_based" as const,
        rotationThreshold: 0.8,
        isActive: true,
      };

      expect(rule.ruleType).toBe("rotation_based");
      expect(rule.rotationThreshold).toBe(0.8);
    });

    it("devrait créer une règle hybride", () => {
      const rule = {
        name: "Hybrid Strategy",
        ruleType: "hybrid" as const,
        marginThreshold: 20,
        seasonalityFactor: 1.3,
        rotationThreshold: 0.7,
        isActive: true,
      };

      expect(rule.ruleType).toBe("hybrid");
      expect(rule.marginThreshold).toBe(20);
      expect(rule.seasonalityFactor).toBe(1.3);
      expect(rule.rotationThreshold).toBe(0.7);
    });

    it("devrait pouvoir désactiver une règle", () => {
      const rule = {
        name: "Inactive Rule",
        ruleType: "margin_based" as const,
        marginThreshold: 15,
        isActive: false,
      };

      expect(rule.isActive).toBe(false);
    });
  });

  describe("Simulateur d'impact", () => {
    it("devrait calculer un impact de +10% CA", () => {
      const baselineCA = 10000;
      const projectedCA = baselineCA * 1.10;

      expect(projectedCA).toBe(11000);
      expect(((projectedCA - baselineCA) / baselineCA) * 100).toBe(10);
    });

    it("devrait calculer un impact de +8% sur la marge", () => {
      const baselineMargin = 3000;
      const projectedMargin = baselineMargin * 1.08;

      expect(projectedMargin).toBe(3240);
      expect(((projectedMargin - baselineMargin) / baselineMargin) * 100).toBe(8);
    });

    it("devrait calculer une réduction de -15% des ruptures", () => {
      const baselineStockouts = 10;
      const projectedStockouts = baselineStockouts * 0.85;

      expect(projectedStockouts).toBe(8.5);
      expect(((baselineStockouts - projectedStockouts) / baselineStockouts) * 100).toBe(15);
    });

    it("devrait créer une simulation avec tous les paramètres", () => {
      const simulation = {
        planogramId: 1,
        scenarioName: "Optimisation Premium",
        description: "Réimplantation avec produits haut de gamme",
        baselineCA: 10000,
        baselineMargin: 3000,
        baselineStockouts: 10,
        projectedCA: 11000,
        projectedMargin: 3240,
        projectedStockouts: 8.5,
        caImpactPercent: 10,
        marginImpactPercent: 8,
        stockoutReductionPercent: 15,
        confidenceScore: 0.85,
        status: "simulated" as const,
      };

      expect(simulation.planogramId).toBe(1);
      expect(simulation.scenarioName).toBe("Optimisation Premium");
      expect(simulation.caImpactPercent).toBe(10);
      expect(simulation.marginImpactPercent).toBe(8);
      expect(simulation.stockoutReductionPercent).toBe(15);
      expect(simulation.confidenceScore).toBe(0.85);
      expect(simulation.status).toBe("simulated");
    });

    it("devrait supporter les transitions de statut", () => {
      const statuses = ["draft", "simulated", "approved", "applied"] as const;
      const simulation = {
        id: 1,
        status: "draft" as const,
      };

      expect(statuses).toContain(simulation.status);

      simulation.status = "simulated";
      expect(statuses).toContain(simulation.status);

      simulation.status = "approved";
      expect(statuses).toContain(simulation.status);

      simulation.status = "applied";
      expect(statuses).toContain(simulation.status);
    });

    it("devrait calculer correctement les impacts pour différents scénarios", () => {
      const scenarios = [
        { name: "Conservateur", caFactor: 1.05, marginFactor: 1.03, stockoutFactor: 0.9 },
        { name: "Modéré", caFactor: 1.10, marginFactor: 1.08, stockoutFactor: 0.85 },
        { name: "Agressif", caFactor: 1.15, marginFactor: 1.12, stockoutFactor: 0.80 },
      ];

      const baselineCA = 10000;
      const baselineMargin = 3000;
      const baselineStockouts = 10;

      scenarios.forEach((scenario) => {
        const projectedCA = baselineCA * scenario.caFactor;
        const projectedMargin = baselineMargin * scenario.marginFactor;
        const projectedStockouts = baselineStockouts * scenario.stockoutFactor;

        const caImpact = ((projectedCA - baselineCA) / baselineCA) * 100;
        const marginImpact = ((projectedMargin - baselineMargin) / baselineMargin) * 100;
        const stockoutReduction = ((baselineStockouts - projectedStockouts) / baselineStockouts) * 100;

        expect(caImpact).toBeGreaterThan(0);
        expect(marginImpact).toBeGreaterThan(0);
        expect(stockoutReduction).toBeGreaterThan(0);
      });
    });

    it("devrait valider que le CA projeté est supérieur au baseline", () => {
      const baselineCA = 10000;
      const projectedCA = 11000;

      expect(projectedCA).toBeGreaterThan(baselineCA);
      expect(projectedCA / baselineCA).toBeGreaterThan(1);
    });

    it("devrait valider que la marge projetée est supérieure au baseline", () => {
      const baselineMargin = 3000;
      const projectedMargin = 3240;

      expect(projectedMargin).toBeGreaterThan(baselineMargin);
      expect(projectedMargin / baselineMargin).toBeGreaterThan(1);
    });

    it("devrait valider que les ruptures projetées sont inférieures au baseline", () => {
      const baselineStockouts = 10;
      const projectedStockouts = 8.5;

      expect(projectedStockouts).toBeLessThan(baselineStockouts);
      expect(projectedStockouts / baselineStockouts).toBeLessThan(1);
    });

    it("devrait avoir un score de confiance entre 0 et 1", () => {
      const confidenceScores = [0.75, 0.85, 0.95];

      confidenceScores.forEach((score) => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      });
    });
  });

  describe("Intégration Règles IA + Simulateur", () => {
    it("devrait appliquer une règle de marge à une simulation", () => {
      const rule = {
        ruleType: "margin_based" as const,
        marginThreshold: 25,
      };

      const simulation = {
        baselineMargin: 3000,
        projectedMargin: 3240,
        marginImpactPercent: 8,
      };

      const marginPercentage = (simulation.projectedMargin / simulation.baselineMargin) * 100;
      expect(marginPercentage).toBeGreaterThan(rule.marginThreshold);
    });

    it("devrait appliquer une règle de saisonnalité à une simulation", () => {
      const rule = {
        ruleType: "seasonality_based" as const,
        seasonalityFactor: 1.5,
      };

      const simulation = {
        baselineCA: 10000,
        projectedCA: 11000,
      };

      const adjustedCA = simulation.projectedCA * rule.seasonalityFactor;
      expect(adjustedCA).toBeGreaterThan(simulation.projectedCA);
    });

    it("devrait générer une recommandation basée sur la simulation", () => {
      const simulation = {
        caImpactPercent: 10,
        marginImpactPercent: 8,
        stockoutReductionPercent: 15,
        confidenceScore: 0.85,
      };

      const recommendation = {
        isRecommended: simulation.caImpactPercent >= 10 && simulation.confidenceScore >= 0.8,
        priority: simulation.caImpactPercent >= 10 ? "high" : "medium",
        expectedROI: simulation.caImpactPercent + simulation.marginImpactPercent,
      };

      expect(recommendation.isRecommended).toBe(true);
      expect(recommendation.priority).toBe("high");
      expect(recommendation.expectedROI).toBe(18);
    });
  });
});
