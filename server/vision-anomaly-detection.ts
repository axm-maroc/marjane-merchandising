import { invokeLLM } from "./_core/llm";
import * as db from "./db";

export interface AnomalyDetectionInput {
  planogramId: number;
  photoUrl: string;
  photoType: "real" | "reference";
}

export interface DetectedAnomaly {
  type: "missing_product" | "wrong_position" | "wrong_product" | "quantity_mismatch" | "damaged_product";
  severity: "high" | "medium" | "low";
  productId?: number;
  productName?: string;
  expectedPosition?: { shelfLevel: number; position: number };
  actualPosition?: { shelfLevel: number; position: number };
  description: string;
  suggestion: string;
  confidence: number;
}

export interface AnomalyDetectionResult {
  planogramId: number;
  photoUrl: string;
  detectedAt: Date;
  anomalies: DetectedAnomaly[];
  overallScore: number;
  summary: string;
}

/**
 * Détecte les anomalies en comparant une photo réelle avec le planogramme prévu
 */
export async function detectAnomalies(
  input: AnomalyDetectionInput
): Promise<AnomalyDetectionResult> {
  const { planogramId, photoUrl } = input;

  // Récupérer le planogramme et ses produits
  const planogram = await db.getPlanogramById(planogramId);
  if (!planogram) {
    throw new Error("Planogram not found");
  }

  const planogramProducts = await db.getPlanogramProducts(planogramId);
  const allProducts = await db.getAllProducts();

  // Construire la description du planogramme attendu
  const expectedLayout = buildExpectedLayout(planogramProducts, allProducts);

  // Analyser la photo avec l'IA
  let response;
  try {
    response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `Tu es un expert en merchandising et analyse visuelle de rayonnages. 
Tu analyses des photos de rayonnages en magasin pour détecter les anomalies par rapport au planogramme prévu.
Tu dois identifier les produits manquants, mal placés, ou en quantité incorrecte.
Sois précis et fournis des recommandations actionnables.`,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyse cette photo de rayonnage et compare-la avec le planogramme attendu suivant:\n\n${expectedLayout}\n\nIdentifie toutes les anomalies et fournis des recommandations pour les corriger.`,
          },
          {
            type: "image_url",
            image_url: {
              url: photoUrl,
              detail: "high",
            },
          },
        ],
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "anomaly_detection_result",
        strict: true,
        schema: {
          type: "object",
          properties: {
            anomalies: {
              type: "array",
              description: "Liste des anomalies détectées",
              items: {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    enum: ["missing_product", "wrong_position", "wrong_product", "quantity_mismatch", "damaged_product"],
                    description: "Type d'anomalie",
                  },
                  severity: {
                    type: "string",
                    enum: ["high", "medium", "low"],
                    description: "Sévérité de l'anomalie",
                  },
                  productName: {
                    type: "string",
                    description: "Nom du produit concerné",
                  },
                  description: {
                    type: "string",
                    description: "Description de l'anomalie",
                  },
                  suggestion: {
                    type: "string",
                    description: "Suggestion pour corriger l'anomalie",
                  },
                  confidence: {
                    type: "number",
                    description: "Niveau de confiance de 0 à 100",
                  },
                },
                required: ["type", "severity", "description", "suggestion", "confidence"],
                additionalProperties: true,
              },
            },
            overallScore: {
              type: "number",
              description: "Score global de conformité de 0 à 100",
            },
            summary: {
              type: "string",
              description: "Résumé général de l'analyse",
            },
          },
          required: ["anomalies", "overallScore", "summary"],
          additionalProperties: true,
        },
      },
    },
  });

  } catch (error: any) {
    console.error('[Vision Anomaly] Error calling LLM:', error);
    throw new Error(`Erreur lors de l'analyse IA: ${error.message || 'Erreur inconnue'}`);
  }

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    throw new Error('Format de réponse invalide de l\'IA');
  }
  
  let result;
  try {
    result = JSON.parse(content);
  } catch (error) {
    console.error('[Vision Anomaly] Error parsing JSON:', content);
    throw new Error('Impossible de parser la réponse de l\'IA');
  }

  // Enrichir les anomalies avec les IDs de produits
  const enrichedAnomalies = result.anomalies.map((anomaly: any) => {
    const product = allProducts.find(
      (p) => p.name.toLowerCase() === anomaly.productName?.toLowerCase()
    );
    return {
      ...anomaly,
      productId: product?.id,
    };
  });

  return {
    planogramId,
    photoUrl,
    detectedAt: new Date(),
    anomalies: enrichedAnomalies,
    overallScore: result.overallScore,
    summary: result.summary,
  };
}

/**
 * Construit la description du layout attendu
 */
function buildExpectedLayout(planogramProducts: any[], allProducts: any[]): string {
  let layout = "# Planogramme Attendu\n\n";

  // Grouper par étagère
  const byShelf = new Map<number, any[]>();
  planogramProducts.forEach((pp) => {
    const shelf = byShelf.get(pp.shelfLevel) || [];
    shelf.push(pp);
    byShelf.set(pp.shelfLevel, shelf);
  });

  // Trier les étagères (du haut vers le bas)
  const sortedShelves = Array.from(byShelf.keys()).sort((a, b) => b - a);

  sortedShelves.forEach((shelfLevel) => {
    layout += `## Étagère ${shelfLevel}\n`;
    const products = byShelf.get(shelfLevel) || [];
    
    // Trier par position
    products.sort((a, b) => a.position - b.position);

    products.forEach((pp) => {
      const product = allProducts.find((p) => p.id === pp.productId);
      if (product) {
        layout += `- Position ${pp.position}: ${product.name} (${product.brand}) - ${pp.facings} facings\n`;
      }
    });
    layout += "\n";
  });

  return layout;
}

/**
 * Génère un rapport d'anomalies formaté
 */
export function generateAnomalyReport(result: AnomalyDetectionResult): string {
  let report = `# Rapport d'Analyse de Conformité\n\n`;
  report += `**Date**: ${result.detectedAt.toLocaleString('fr-FR')}\n`;
  report += `**Score de conformité**: ${result.overallScore}/100\n\n`;
  report += `## Résumé\n${result.summary}\n\n`;

  if (result.anomalies.length === 0) {
    report += `✅ Aucune anomalie détectée. Le rayonnage est conforme au planogramme.\n`;
    return report;
  }

  report += `## Anomalies Détectées (${result.anomalies.length})\n\n`;

  // Grouper par sévérité
  const bySeverity = {
    high: result.anomalies.filter((a) => a.severity === "high"),
    medium: result.anomalies.filter((a) => a.severity === "medium"),
    low: result.anomalies.filter((a) => a.severity === "low"),
  };

  if (bySeverity.high.length > 0) {
    report += `### 🔴 Priorité Haute (${bySeverity.high.length})\n`;
    bySeverity.high.forEach((anomaly, index) => {
      report += formatAnomaly(anomaly, index + 1);
    });
    report += "\n";
  }

  if (bySeverity.medium.length > 0) {
    report += `### 🟡 Priorité Moyenne (${bySeverity.medium.length})\n`;
    bySeverity.medium.forEach((anomaly, index) => {
      report += formatAnomaly(anomaly, index + 1);
    });
    report += "\n";
  }

  if (bySeverity.low.length > 0) {
    report += `### 🟢 Priorité Basse (${bySeverity.low.length})\n`;
    bySeverity.low.forEach((anomaly, index) => {
      report += formatAnomaly(anomaly, index + 1);
    });
  }

  return report;
}

function formatAnomaly(anomaly: DetectedAnomaly, index: number): string {
  const typeLabels: Record<DetectedAnomaly["type"], string> = {
    missing_product: "Produit manquant",
    wrong_position: "Mauvaise position",
    wrong_product: "Mauvais produit",
    quantity_mismatch: "Quantité incorrecte",
    damaged_product: "Produit endommagé",
  };

  let text = `#### ${index}. ${typeLabels[anomaly.type]}`;
  if (anomaly.productName) {
    text += ` - ${anomaly.productName}`;
  }
  text += `\n`;
  text += `**Description**: ${anomaly.description}\n`;
  text += `**Action recommandée**: ${anomaly.suggestion}\n`;
  text += `**Confiance**: ${anomaly.confidence}%\n\n`;

  return text;
}

/**
 * Compare deux photos de planogramme (avant/après)
 */
export async function comparePhotos(
  beforeUrl: string,
  afterUrl: string,
  planogramId: number
): Promise<{
  improvements: string[];
  remainingIssues: string[];
  score: number;
}> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "Tu es un expert en merchandising. Compare deux photos d'un même rayonnage (avant et après correction) et identifie les améliorations et les problèmes restants.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Photo AVANT corrections:",
          },
          {
            type: "image_url",
            image_url: { url: beforeUrl, detail: "high" },
          },
          {
            type: "text",
            text: "Photo APRÈS corrections:",
          },
          {
            type: "image_url",
            image_url: { url: afterUrl, detail: "high" },
          },
          {
            type: "text",
            text: "Identifie les améliorations apportées et les problèmes qui persistent.",
          },
        ],
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "photo_comparison",
        strict: true,
        schema: {
          type: "object",
          properties: {
            improvements: {
              type: "array",
              items: { type: "string" },
              description: "Liste des améliorations constatées",
            },
            remainingIssues: {
              type: "array",
              items: { type: "string" },
              description: "Liste des problèmes qui persistent",
            },
            score: {
              type: "number",
              description: "Score d'amélioration de 0 à 100",
            },
          },
          required: ["improvements", "remainingIssues", "score"],
          additionalProperties: true,
        },
      },
    },
  });

  const content = response.choices[0].message.content;
  if (typeof content !== 'string') {
    throw new Error('Invalid response format');
  }
  return JSON.parse(content);
}
