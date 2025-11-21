/**
 * Moteur de simulation d'impact des changements de planogrammes
 * Calcule l'impact potentiel sur CA, marge, rotation et ruptures
 */

export interface PlanogramChange {
  productId: number;
  currentFacings: number;
  newFacings: number;
  currentShelfLevel: number;
  newShelfLevel: number;
  isNewProduct?: boolean;
  isRemovedProduct?: boolean;
}

export interface ProductMetrics {
  productId: number;
  name: string;
  currentSales: number; // unités vendues (30 jours)
  currentMargin: number; // marge en %
  unitPrice: number; // prix en centimes
  currentStock: number;
  stockRotation: number; // jours de stock
}

export interface ImpactSimulation {
  currentMetrics: {
    totalCA: number;
    totalMargin: number;
    avgRotation: number;
    ruptures: number;
  };
  projectedMetrics: {
    totalCA: number;
    totalMargin: number;
    avgRotation: number;
    ruptures: number;
  };
  impact: {
    caImpact: number;
    caImpactPercent: number;
    marginImpact: number;
    marginImpactPercent: number;
    rotationImpact: number;
    rotationImpactPercent: number;
    rupturesImpact: number;
    rupturesImpactPercent: number;
  };
  productImpacts: ProductImpact[];
  confidence: number; // 0-100
  recommendation: string;
}

export interface ProductImpact {
  productId: number;
  name: string;
  facingsChange: number;
  shelfLevelChange: number;
  estimatedSalesChange: number;
  estimatedSalesChangePercent: number;
  estimatedCAChange: number;
  estimatedMarginChange: number;
  riskLevel: 'low' | 'medium' | 'high';
  reason: string;
}

/**
 * Calcule l'impact d'une modification de planogramme
 */
export function simulateImpact(
  changes: PlanogramChange[],
  productMetrics: ProductMetrics[]
): ImpactSimulation {
  // Calculer les métriques actuelles
  const currentMetrics = calculateCurrentMetrics(productMetrics);

  // Calculer les métriques projetées
  const productImpacts = changes.map(change => 
    calculateProductImpact(change, productMetrics)
  );

  const projectedMetrics = calculateProjectedMetrics(
    currentMetrics,
    productImpacts,
    productMetrics
  );

  // Calculer les impacts
  const impact = {
    caImpact: projectedMetrics.totalCA - currentMetrics.totalCA,
    caImpactPercent: ((projectedMetrics.totalCA - currentMetrics.totalCA) / currentMetrics.totalCA) * 100,
    marginImpact: projectedMetrics.totalMargin - currentMetrics.totalMargin,
    marginImpactPercent: ((projectedMetrics.totalMargin - currentMetrics.totalMargin) / currentMetrics.totalMargin) * 100,
    rotationImpact: projectedMetrics.avgRotation - currentMetrics.avgRotation,
    rotationImpactPercent: ((projectedMetrics.avgRotation - currentMetrics.avgRotation) / currentMetrics.avgRotation) * 100,
    rupturesImpact: projectedMetrics.ruptures - currentMetrics.ruptures,
    rupturesImpactPercent: ((projectedMetrics.ruptures - currentMetrics.ruptures) / currentMetrics.ruptures) * 100,
  };

  // Calculer le niveau de confiance
  const confidence = calculateConfidence(changes, productMetrics);

  // Générer une recommandation
  const recommendation = generateRecommendation(impact, productImpacts);

  return {
    currentMetrics,
    projectedMetrics,
    impact,
    productImpacts,
    confidence,
    recommendation,
  };
}

/**
 * Calcule les métriques actuelles
 */
function calculateCurrentMetrics(productMetrics: ProductMetrics[]) {
  const totalCA = productMetrics.reduce((sum, p) => 
    sum + (p.currentSales * p.unitPrice / 100), 0
  );

  const totalMargin = productMetrics.reduce((sum, p) => 
    sum + (p.currentSales * p.unitPrice / 100 * p.currentMargin / 100), 0
  );

  const avgRotation = productMetrics.length > 0
    ? productMetrics.reduce((sum, p) => sum + p.stockRotation, 0) / productMetrics.length
    : 0;

  const ruptures = productMetrics.filter(p => p.currentStock === 0).length;

  return {
    totalCA,
    totalMargin,
    avgRotation,
    ruptures,
  };
}

/**
 * Calcule l'impact pour un produit spécifique
 */
function calculateProductImpact(
  change: PlanogramChange,
  productMetrics: ProductMetrics[]
): ProductImpact {
  const product = productMetrics.find(p => p.productId === change.productId);
  if (!product) {
    return {
      productId: change.productId,
      name: 'Produit inconnu',
      facingsChange: change.newFacings - change.currentFacings,
      shelfLevelChange: change.newShelfLevel - change.currentShelfLevel,
      estimatedSalesChange: 0,
      estimatedSalesChangePercent: 0,
      estimatedCAChange: 0,
      estimatedMarginChange: 0,
      riskLevel: 'high',
      reason: 'Produit non trouvé dans les données',
    };
  }

  // Calculer l'impact des changements de facing
  let facingsImpact = 0;
  if (change.isRemovedProduct) {
    facingsImpact = -1; // -100% si le produit est supprimé
  } else if (change.isNewProduct) {
    facingsImpact = 0.5; // +50% pour un nouveau produit
  } else {
    const facingsRatio = change.newFacings / (change.currentFacings || 1);
    facingsImpact = (facingsRatio - 1) * 0.7; // 70% de l'impact du facing change
  }

  // Calculer l'impact du changement de niveau d'étagère
  // Niveau 0 (bas) = 0.8x, Niveau 1 (moyen) = 1.0x, Niveau 2 (haut) = 0.9x, Niveau 3 (très haut) = 0.7x
  const shelfLevelMultipliers = [0.8, 1.0, 0.9, 0.7];
  const currentShelfMultiplier = shelfLevelMultipliers[change.currentShelfLevel] || 1.0;
  const newShelfMultiplier = shelfLevelMultipliers[change.newShelfLevel] || 1.0;
  const shelfImpact = (newShelfMultiplier / currentShelfMultiplier - 1) * 0.3; // 30% de l'impact du shelf change

  // Impact total sur les ventes
  const totalImpactPercent = (facingsImpact + shelfImpact) * 100;
  const estimatedSalesChange = product.currentSales * (totalImpactPercent / 100);
  const estimatedCAChange = estimatedSalesChange * product.unitPrice / 100;
  const estimatedMarginChange = estimatedCAChange * product.currentMargin / 100;

  // Déterminer le niveau de risque
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  let reason = '';

  if (change.isRemovedProduct) {
    riskLevel = 'high';
    reason = 'Produit supprimé - risque de rupture de stock';
  } else if (change.isNewProduct) {
    riskLevel = 'medium';
    reason = 'Nouveau produit - impact incertain';
  } else if (Math.abs(totalImpactPercent) > 50) {
    riskLevel = 'high';
    reason = `Impact important (${totalImpactPercent.toFixed(1)}%) - à valider`;
  } else if (Math.abs(totalImpactPercent) > 20) {
    riskLevel = 'medium';
    reason = `Impact modéré (${totalImpactPercent.toFixed(1)}%) - à surveiller`;
  } else {
    riskLevel = 'low';
    reason = `Impact faible (${totalImpactPercent.toFixed(1)}%)`;
  }

  return {
    productId: change.productId,
    name: product.name,
    facingsChange: change.newFacings - change.currentFacings,
    shelfLevelChange: change.newShelfLevel - change.currentShelfLevel,
    estimatedSalesChange,
    estimatedSalesChangePercent: totalImpactPercent,
    estimatedCAChange,
    estimatedMarginChange,
    riskLevel,
    reason,
  };
}

/**
 * Calcule les métriques projetées après les changements
 */
function calculateProjectedMetrics(
  currentMetrics: ReturnType<typeof calculateCurrentMetrics>,
  productImpacts: ProductImpact[],
  productMetrics: ProductMetrics[]
) {
  // Calculer le CA projeté
  const totalCAChange = productImpacts.reduce((sum, p) => sum + p.estimatedCAChange, 0);
  const projectedCA = currentMetrics.totalCA + totalCAChange;

  // Calculer la marge projetée
  const totalMarginChange = productImpacts.reduce((sum, p) => sum + p.estimatedMarginChange, 0);
  const projectedMargin = currentMetrics.totalMargin + totalMarginChange;

  // Calculer la rotation projetée (moins de jours = meilleur)
  // Si CA augmente, rotation diminue (produit se vend plus vite)
  const rotationChange = totalCAChange > 0 ? -0.1 : 0.1;
  const projectedRotation = Math.max(1, currentMetrics.avgRotation * (1 + rotationChange));

  // Calculer les ruptures projetées
  // Les ruptures augmentent si on diminue les facings ou si on supprime un produit
  let projectedRuptures = currentMetrics.ruptures;
  productImpacts.forEach(impact => {
    if (impact.facingsChange < 0 || impact.estimatedSalesChange < 0) {
      projectedRuptures += 0.5; // Augmente le risque de rupture
    }
  });
  projectedRuptures = Math.round(projectedRuptures);

  return {
    totalCA: projectedCA,
    totalMargin: projectedMargin,
    avgRotation: projectedRotation,
    ruptures: projectedRuptures,
  };
}

/**
 * Calcule le niveau de confiance de la simulation
 */
function calculateConfidence(
  changes: PlanogramChange[],
  productMetrics: ProductMetrics[]
): number {
  let confidence = 100;

  // Réduire la confiance si des produits sont inconnus
  const unknownProducts = changes.filter(c => 
    !productMetrics.find(p => p.productId === c.productId)
  ).length;
  confidence -= unknownProducts * 10;

  // Réduire la confiance si beaucoup de changements
  if (changes.length > 10) {
    confidence -= (changes.length - 10) * 2;
  }

  // Réduire la confiance si des produits sont supprimés
  const removedProducts = changes.filter(c => c.isRemovedProduct).length;
  confidence -= removedProducts * 5;

  return Math.max(0, Math.min(100, confidence));
}

/**
 * Génère une recommandation basée sur l'impact
 */
function generateRecommendation(
  impact: ReturnType<typeof simulateImpact>['impact'],
  productImpacts: ProductImpact[]
): string {
  const highRiskProducts = productImpacts.filter(p => p.riskLevel === 'high').length;
  const positiveCAImpact = impact.caImpact > 0;
  const positiveMarginImpact = impact.marginImpact > 0;

  if (highRiskProducts > 0) {
    return `⚠️ ${highRiskProducts} produit(s) à haut risque. Recommandé de tester en petit volume avant déploiement complet.`;
  }

  if (positiveCAImpact && positiveMarginImpact) {
    return `✅ Simulation positive : +${impact.caImpactPercent.toFixed(1)}% CA, +${impact.marginImpactPercent.toFixed(1)}% marge. Recommandé de déployer.`;
  }

  if (positiveCAImpact && !positiveMarginImpact) {
    return `⚠️ CA en hausse (+${impact.caImpactPercent.toFixed(1)}%) mais marge en baisse (${impact.marginImpactPercent.toFixed(1)}%). À valider avec management.`;
  }

  if (!positiveCAImpact && positiveMarginImpact) {
    return `⚠️ Marge en hausse (+${impact.marginImpactPercent.toFixed(1)}%) mais CA en baisse (${impact.caImpactPercent.toFixed(1)}%). À valider avec management.`;
  }

  return `⚠️ Simulation négative. Recommandé de revoir les changements avant déploiement.`;
}
