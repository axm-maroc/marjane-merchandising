import { describe, expect, it } from "vitest";
import * as visionAnomaly from "./vision-anomaly-detection";

describe("Anomaly Detection", () => {
  it("should detect anomalies in a shelf photo", async () => {
    const input = {
      planogramId: 180002,
      photoUrl: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800",
      photoType: "real" as const,
    };

    const result = await visionAnomaly.detectAnomalies(input);

    expect(result).toBeDefined();
    expect(result.planogramId).toBe(180002);
    expect(result.photoUrl).toBe(input.photoUrl);
    expect(result.anomalies).toBeInstanceOf(Array);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.summary).toBeTruthy();
    expect(typeof result.summary).toBe("string");

    // Vérifier la structure des anomalies
    if (result.anomalies.length > 0) {
      const anomaly = result.anomalies[0];
      expect(anomaly.type).toBeDefined();
      expect(anomaly.severity).toBeDefined();
      expect(anomaly.description).toBeTruthy();
      expect(anomaly.suggestion).toBeTruthy();
      expect(anomaly.confidence).toBeGreaterThanOrEqual(0);
      expect(anomaly.confidence).toBeLessThanOrEqual(100);
    }

    console.log(`✅ Détection terminée: ${result.anomalies.length} anomalie(s) détectée(s)`);
    console.log(`   Score de conformité: ${result.overallScore}/100`);
    console.log(`   Résumé: ${result.summary.substring(0, 100)}...`);
  }, 60000); // Timeout de 60 secondes pour l'appel API
});
