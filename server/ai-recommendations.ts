import { invokeLLM } from "./_core/llm";
import * as db from "./db";

/**
 * Types de recommandations
 */
export type RecommendationType = 
  | "assortment" // Recommandation d'assortiment produits
  | "placement" // Recommandation de placement sur rayonnage
  | "pricing" // Recommandation de prix
  | "promotion"; // Recommandation de promotion

export interface RecommendationInput {
  storeId: number;
  planogramId?: number;
  productIds?: number[];
  type: RecommendationType;
}

export interface RecommendationOutput {
  type: RecommendationType;
  title: string;
  description: string;
  confidence: number;
  expectedImpact: string;
  actions: Array<{
    productId?: number;
    action: string;
    reason: string;
    priority: "high" | "medium" | "low";
  }>;
  insights: string[];
}

/**
 * Génère des recommandations basées sur l'historique de vente et les données de stock
 */
export async function generateRecommendations(
  input: RecommendationInput
): Promise<RecommendationOutput> {
  const { storeId, planogramId, productIds, type } = input;

  // Récupérer les données nécessaires
  const store = await db.getStoreById(storeId);
  if (!store) {
    throw new Error("Store not found");
  }

  let planogram = null;
  let planogramProducts: any[] = [];
  
  if (planogramId) {
    planogram = await db.getPlanogramById(planogramId);
    planogramProducts = await db.getPlanogramProducts(planogramId);
  }

  // Récupérer les prévisions de vente
  const forecasts = await db.getSalesForecasts(storeId, planogramId);

  // Récupérer les produits
  const allProducts = await db.getAllProducts();
  const relevantProducts = productIds 
    ? allProducts.filter(p => productIds.includes(p.id))
    : allProducts;

  // Construire le contexte pour l'IA
  const context = buildContext(
    store,
    planogram,
    planogramProducts,
    forecasts,
    relevantProducts,
    type
  );

  // Appeler l'IA pour générer des recommandations
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `Tu es un expert en merchandising et optimisation de rayonnage pour la grande distribution. 
Tu analyses les données de vente, de stock et de placement produit pour générer des recommandations actionnables.
Tu dois fournir des recommandations précises, basées sur les données, avec des justifications claires.`,
      },
      {
        role: "user",
        content: context,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "merchandising_recommendations",
        strict: true,
        schema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Titre de la recommandation",
            },
            description: {
              type: "string",
              description: "Description détaillée de la recommandation",
            },
            confidence: {
              type: "number",
              description: "Niveau de confiance de 0 à 100",
            },
            expectedImpact: {
              type: "string",
              description: "Impact attendu sur les ventes (ex: +15% de CA)",
            },
            actions: {
              type: "array",
              description: "Liste des actions recommandées",
              items: {
                type: "object",
                properties: {
                  productId: {
                    type: ["number", "null"],
                    description: "ID du produit concerné (si applicable)",
                  },
                  action: {
                    type: "string",
                    description: "Action à réaliser",
                  },
                  reason: {
                    type: "string",
                    description: "Justification de l'action",
                  },
                  priority: {
                    type: "string",
                    enum: ["high", "medium", "low"],
                    description: "Priorité de l'action",
                  },
                },
                required: ["action", "reason", "priority"],
                additionalProperties: false,
              },
            },
            insights: {
              type: "array",
              description: "Insights clés basés sur les données",
              items: {
                type: "string",
              },
            },
          },
          required: ["title", "description", "confidence", "expectedImpact", "actions", "insights"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0].message.content;
  if (typeof content !== 'string') {
    throw new Error('Invalid response format');
  }
  const result = JSON.parse(content);

  return {
    type,
    ...result,
  };
}

/**
 * Construit le contexte pour l'IA
 */
function buildContext(
  store: any,
  planogram: any,
  planogramProducts: any[],
  forecasts: any[],
  products: any[],
  type: RecommendationType
): string {
  let context = `# Contexte Merchandising\n\n`;
  context += `## Magasin\n`;
  context += `- Nom: ${store.name}\n`;
  context += `- Ville: ${store.city}\n`;
  context += `- Surface: ${store.surface} m²\n\n`;

  if (planogram) {
    context += `## Planogramme\n`;
    context += `- Nom: ${planogram.name}\n`;
    context += `- Statut: ${planogram.status}\n`;
    context += `- Objectif de vente: ${(planogram.salesTarget / 100).toLocaleString()} DH\n`;
    context += `- Produits placés: ${planogramProducts.length}\n\n`;
  }

  context += `## Produits\n`;
  products.slice(0, 20).forEach(product => {
    context += `- ${product.name} (${product.brand}): ${(product.unitPrice / 100).toFixed(2)} DH\n`;
  });
  context += `\n`;

  if (forecasts.length > 0) {
    context += `## Prévisions de Vente\n`;
    forecasts.slice(0, 10).forEach(forecast => {
      const product = products.find(p => p.id === forecast.productId);
      if (product) {
        context += `- ${product.name}: ${forecast.predictedQuantity} unités prévues (confiance: ${forecast.confidence}%)\n`;
      }
    });
    context += `\n`;
  }

  context += `## Type de Recommandation Demandée\n`;
  switch (type) {
    case "assortment":
      context += `Recommandation d'assortiment: Quels produits ajouter, retirer ou remplacer pour optimiser les ventes?\n`;
      context += `Considère les tendances de vente, la complémentarité des produits, et les préférences clients.\n`;
      break;
    case "placement":
      context += `Recommandation de placement: Comment optimiser le placement des produits sur le rayonnage?\n`;
      context += `Considère la hauteur des yeux, les produits d'appel, les associations de produits, et la rotation.\n`;
      break;
    case "pricing":
      context += `Recommandation de prix: Quels ajustements de prix proposer pour maximiser la marge et le volume?\n`;
      context += `Considère l'élasticité prix, la concurrence, et les objectifs de rentabilité.\n`;
      break;
    case "promotion":
      context += `Recommandation de promotion: Quels produits mettre en promotion et avec quelle mécanique?\n`;
      context += `Considère les stocks, la saisonnalité, et l'impact sur le panier moyen.\n`;
      break;
  }

  context += `\nGénère des recommandations concrètes et actionnables avec des justifications basées sur les données.`;

  return context;
}

/**
 * Calcule les corrélations entre produits (produits souvent achetés ensemble)
 */
export async function calculateProductCorrelations(
  storeId: number,
  productId: number
): Promise<Array<{ productId: number; correlation: number; productName: string }>> {
  // Simulation de corrélations basées sur les catégories
  // Dans une vraie implémentation, on analyserait les tickets de caisse
  const product = (await db.getAllProducts()).find(p => p.id === productId);
  if (!product) return [];

  const allProducts = await db.getAllProducts();
  const sameCategory = allProducts.filter(
    p => p.categoryId === product.categoryId && p.id !== productId
  );

  return sameCategory.slice(0, 5).map((p, index) => ({
    productId: p.id,
    productName: p.name,
    correlation: 0.8 - index * 0.1, // Simulation
  }));
}

/**
 * Analyse l'efficacité d'un planogramme
 */
export async function analyzePlanogramEfficiency(
  planogramId: number
): Promise<{
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}> {
  const planogram = await db.getPlanogramById(planogramId);
  if (!planogram) {
    throw new Error("Planogram not found");
  }

  const products = await db.getPlanogramProducts(planogramId);
  const forecasts = await db.getSalesForecasts(planogram.locationId);

  // Analyse simple basée sur des heuristiques
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const suggestions: string[] = [];
  let score = 70; // Score de base

  // Vérifier la densité de produits
  if (products.length > 8) {
    strengths.push("Bon assortiment de produits");
    score += 10;
  } else {
    weaknesses.push("Assortiment limité");
    suggestions.push("Ajouter plus de variété de produits");
    score -= 5;
  }

  // Vérifier la répartition sur les étagères
  const shelfLevels = new Set(products.map(p => p.shelfLevel));
  if (shelfLevels.size >= 3) {
    strengths.push("Bonne utilisation de l'espace vertical");
    score += 5;
  } else {
    weaknesses.push("Espace vertical sous-utilisé");
    suggestions.push("Répartir les produits sur plus d'étagères");
  }

  // Vérifier les facings
  const avgFacings = products.reduce((sum, p) => sum + p.facings, 0) / products.length;
  if (avgFacings >= 4) {
    strengths.push("Bonne visibilité des produits");
    score += 5;
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    strengths,
    weaknesses,
    suggestions,
  };
}
