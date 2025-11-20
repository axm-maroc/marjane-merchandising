import { getDb } from "./db";
import { aiRecommendations, performanceScores, products, planograms, stores } from "../drizzle/schema";
import type { InsertAIRecommendation, InsertPerformanceScore } from "../drizzle/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

/**
 * Moteur de recommandations IA pour l'optimisation merchandising
 */

// Seuils de performance
const THRESHOLDS = {
  LOW_SALES_SCORE: 40,
  LOW_ROTATION_SCORE: 35,
  LOW_MARGIN_SCORE: 30,
  HIGH_STOCK_DAYS: 45,
  LOW_FACING_THRESHOLD: 2,
  HIGH_FACING_THRESHOLD: 8,
};

/**
 * Calculer le score de performance d'un produit
 */
export async function calculatePerformanceScore(
  storeId: number,
  productId: number,
  planogramId?: number,
  period?: string
): Promise<InsertPerformanceScore> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Simuler des données de performance (à remplacer par de vraies données)
  // Dans un vrai système, ces données viendraient de l'historique des ventes, stocks, etc.
  const salesScore = Math.floor(Math.random() * 100);
  const rotationScore = Math.floor(Math.random() * 100);
  const marginScore = Math.floor(Math.random() * 100);
  const complianceScore = Math.floor(Math.random() * 100);
  
  // Score global pondéré
  const overallScore = Math.floor(
    salesScore * 0.4 +
    rotationScore * 0.3 +
    marginScore * 0.2 +
    complianceScore * 0.1
  );

  return {
    storeId,
    planogramId: planogramId || null,
    productId,
    period: period || new Date().toISOString().slice(0, 7), // Format: YYYY-MM
    salesScore,
    rotationScore,
    marginScore,
    complianceScore,
    overallScore,
    salesAmount: Math.floor(Math.random() * 1000000), // Simulé
    stockLevel: Math.floor(Math.random() * 500),
    rotationDays: Math.floor(Math.random() * 60),
    marginPercent: Math.floor(Math.random() * 5000), // 0-50%
  };
}

/**
 * Générer des recommandations pour un magasin
 */
export async function generateRecommendations(storeId: number): Promise<InsertAIRecommendation[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const recommendations: InsertAIRecommendation[] = [];

  // Récupérer les planogrammes du magasin
  // Note: La table planograms n'a pas de storeId direct, on passe par planogramLocations
  const storePlanograms = await db.select().from(planograms).limit(10);

  const allProducts = await db.select().from(products).limit(20);

  // Générer différents types de recommandations
  for (const planogram of storePlanograms) {
    for (const product of allProducts.slice(0, 3)) {
      // Calculer le score de performance
      const perfScore = await calculatePerformanceScore(storeId, product.id, planogram.id);

      // Recommandation 1: Repositionnement si faible performance
      if (perfScore.salesScore < THRESHOLDS.LOW_SALES_SCORE) {
        recommendations.push({
          storeId,
          planogramId: planogram.id,
          productId: product.id,
          type: "reposition",
          priority: perfScore.salesScore < 20 ? "high" : "medium",
          title: `Repositionner "${product.name}"`,
          description: `Le produit "${product.name}" a un score de ventes de ${perfScore.salesScore}/100. Déplacer au niveau des yeux (140-160cm) pourrait augmenter les ventes de 25-35%.`,
          currentValue: JSON.stringify({ level: "bottom", height: 40 }),
          suggestedValue: JSON.stringify({ level: "eye", height: 150 }),
          estimatedImpact: Math.floor(perfScore.salesAmount! * 0.30), // +30% estimé
          estimatedImpactPercent: 30,
          confidence: 75,
          status: "pending",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
        });
      }

      // Recommandation 2: Ajustement du facing
      const currentFacing = Math.floor(Math.random() * 10) + 1;
      if (perfScore.salesScore > 70 && currentFacing < THRESHOLDS.LOW_FACING_THRESHOLD) {
        recommendations.push({
          storeId,
          planogramId: planogram.id,
          productId: product.id,
          type: "facing",
          priority: "medium",
          title: `Augmenter le facing de "${product.name}"`,
          description: `Le produit "${product.name}" a un excellent score de ventes (${perfScore.salesScore}/100) mais seulement ${currentFacing} facings. Augmenter à 4-5 facings pourrait réduire les ruptures de stock.`,
          currentValue: JSON.stringify({ facings: currentFacing }),
          suggestedValue: JSON.stringify({ facings: 4 }),
          estimatedImpact: Math.floor(perfScore.salesAmount! * 0.15),
          estimatedImpactPercent: 15,
          confidence: 80,
          status: "pending",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
      }

      // Recommandation 3: Rotation lente - déréférencement
      if (perfScore.rotationScore < THRESHOLDS.LOW_ROTATION_SCORE && perfScore.rotationDays! > THRESHOLDS.HIGH_STOCK_DAYS) {
        recommendations.push({
          storeId,
          planogramId: planogram.id,
          productId: product.id,
          type: "dereference",
          priority: "low",
          title: `Envisager le déréférencement de "${product.name}"`,
          description: `Le produit "${product.name}" a une rotation très lente (${perfScore.rotationDays} jours) et un score de rotation de ${perfScore.rotationScore}/100. Libérer cet espace pour des produits plus performants.`,
          currentValue: JSON.stringify({ status: "active", facings: currentFacing }),
          suggestedValue: JSON.stringify({ status: "inactive", facings: 0 }),
          estimatedImpact: Math.floor(perfScore.salesAmount! * 0.50), // Gain d'opportunité
          estimatedImpactPercent: 50,
          confidence: 65,
          status: "pending",
          expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 jours
        });
      }
    }

    // Recommandation 4: Cross-merchandising
    if (allProducts.length >= 2) {
      const product1 = allProducts[0];
      const product2 = allProducts[1];
      
      recommendations.push({
        storeId,
        planogramId: planogram.id,
        productId: product1.id,
        type: "cross_merchandising",
        priority: "medium",
        title: `Cross-merchandising: "${product1.name}" + "${product2.name}"`,
        description: `Placer "${product1.name}" à côté de "${product2.name}" pourrait augmenter les ventes croisées. Ces produits sont souvent achetés ensemble.`,
        currentValue: JSON.stringify({ proximity: "far", distance: 10 }),
        suggestedValue: JSON.stringify({ proximity: "adjacent", distance: 0 }),
        estimatedImpact: 45000, // 450 DH
        estimatedImpactPercent: 18,
        confidence: 70,
        status: "pending",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
    }
  }

  // Limiter à 10 recommandations par magasin
  return recommendations.slice(0, 10);
}

/**
 * Sauvegarder les scores de performance
 */
export async function savePerformanceScores(scores: InsertPerformanceScore[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(performanceScores).values(scores);
}

/**
 * Sauvegarder les recommandations
 */
export async function saveRecommendations(recs: InsertAIRecommendation[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(aiRecommendations).values(recs);
}

/**
 * Récupérer les recommandations d'un magasin
 */
export async function getRecommendationsByStore(storeId: number, status?: string) {
  const db = await getDb();
  if (!db) return [];

  if (status) {
    return await db
      .select()
      .from(aiRecommendations)
      .where(
        and(
          eq(aiRecommendations.storeId, storeId),
          eq(aiRecommendations.status, status as any)
        )
      )
      .orderBy(desc(aiRecommendations.priority), desc(aiRecommendations.confidence));
  }

  return await db
    .select()
    .from(aiRecommendations)
    .where(eq(aiRecommendations.storeId, storeId))
    .orderBy(desc(aiRecommendations.priority), desc(aiRecommendations.confidence));
}

/**
 * Marquer une recommandation comme appliquée
 */
export async function markRecommendationAsApplied(recommendationId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(aiRecommendations)
    .set({
      status: "applied",
      appliedAt: new Date(),
      appliedBy: userId,
    })
    .where(eq(aiRecommendations.id, recommendationId));
}

/**
 * Rejeter une recommandation
 */
export async function dismissRecommendation(recommendationId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(aiRecommendations)
    .set({
      status: "dismissed",
      dismissedAt: new Date(),
      dismissedBy: userId,
    })
    .where(eq(aiRecommendations.id, recommendationId));
}
