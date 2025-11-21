# Analyse des KPIs Stratégiques - Marjane Merchandising

## KPIs Demandés vs KPIs Implémentés

### Vue d'ensemble

| KPI Demandé | Objectif | Période | Statut | Localisation |
|------------|----------|---------|--------|--------------|
| **CA/m² par catégories stratégiques** | +10% | 12 mois | ⚠️ Partiel | Dashboard |
| **Taux de rotation** | +15% | 12 mois | ✅ Implémenté | StockTracking, Dashboard |
| **Taux de rupture** | -30% | 6 mois | ⚠️ Partiel | StockTracking (alertes) |
| **Satisfaction client (NPS)** | +15 pts | 12 mois | ❌ Non implémenté | - |
| **Temps d'actualisation Planogrammes** | -30% | 6 mois | ❌ Non implémenté | - |

---

## 1. CA/m² par catégories stratégiques

### État actuel : ⚠️ PARTIEL

**Ce qui existe :**
- ✅ Calcul du CA total dans le Dashboard (`Dashboard.tsx`, ligne 92-96)
- ✅ Surface des magasins disponible dans la base de données (champ `area` dans `stores`)
- ✅ Catégories de produits disponibles (champ `category` dans `products`)

**Ce qui manque :**
- ❌ Calcul du CA/m² (CA total / surface magasin)
- ❌ Segmentation par catégorie stratégique
- ❌ Suivi de l'évolution sur 12 mois
- ❌ Objectif +10% non tracké

**Code existant :**
```typescript
// Dashboard.tsx, ligne 92-96
const totalRevenue = stockData.reduce((sum: number, stock: any) => {
  const product = products.find((p: any) => p.id === stock.productId);
  return sum + (product ? (product.unitPrice * stock.quantity) / 100 : 0);
}, 0);
```

**Actions requises :**
1. Créer une fonction `calculateRevenuePerSquareMeter()` dans `server/db.ts`
2. Ajouter une procédure tRPC `analytics.revenuePerSqm` dans `server/routers.ts`
3. Grouper par catégorie de produits
4. Afficher dans le Dashboard avec graphique d'évolution
5. Ajouter un système de suivi des objectifs (+10% sur 12 mois)

---

## 2. Taux de rotation

### État actuel : ✅ IMPLÉMENTÉ

**Ce qui existe :**
- ✅ Calcul du taux de rotation dans `StockTracking.tsx` (ligne 242)
- ✅ Affichage dans le module Suivi des Stocks
- ✅ Score de rotation dans le moteur de recommandations (`recommendation-engine.ts`, ligne 35)
- ✅ Affichage dans le Dashboard (ligne 98-101)

**Code existant :**
```typescript
// StockTracking.tsx, ligne 242
const rotationRate = totalIn > 0 ? ((totalOut / totalIn) * 100).toFixed(1) : '0';

// Dashboard.tsx, ligne 98-101
const stockRotation = stockData.length > 0 
  ? stockData.reduce((sum: number, s: any) => sum + s.quantity, 0) / stockData.length 
  : 0;
```

**Améliorations possibles :**
1. ⚠️ Ajouter le calcul par catégorie de produits
2. ⚠️ Ajouter le suivi de l'objectif +15% sur 12 mois
3. ⚠️ Créer un graphique d'évolution temporelle
4. ⚠️ Ajouter des alertes pour rotation trop lente

---

## 3. Taux de rupture

### État actuel : ⚠️ PARTIEL

**Ce qui existe :**
- ✅ Système d'alertes de stock critique dans `StockTracking.tsx`
- ✅ Calcul des jours avant rupture (prévisions)
- ✅ Badges de sévérité (Critique/Élevé/Moyen/Faible)
- ✅ Affichage des alertes dans le Dashboard

**Ce qui manque :**
- ❌ Calcul du **taux de rupture** (% de produits en rupture)
- ❌ Historique des ruptures de stock
- ❌ Suivi de l'objectif -30% sur 6 mois
- ❌ Graphique d'évolution du taux de rupture

**Code existant :**
```typescript
// StockTracking.tsx - Alertes de stock critique
const { data: stockAlerts } = trpc.stock.alerts.useQuery({
  storeId: selectedStoreId,
});
```

**Actions requises :**
1. Créer une table `stockoutHistory` pour enregistrer les ruptures
2. Créer une fonction `calculateStockoutRate()` dans `server/db.ts`
3. Ajouter une procédure tRPC `stock.stockoutRate`
4. Afficher le taux de rupture dans le Dashboard
5. Ajouter un graphique d'évolution sur 6 mois
6. Tracker l'objectif -30%

---

## 4. Satisfaction client (NPS)

### État actuel : ❌ NON IMPLÉMENTÉ

**Ce qui manque :**
- ❌ Table `customerFeedback` ou `npsScores` dans la base de données
- ❌ Interface de collecte de feedback client
- ❌ Calcul du score NPS (Promoteurs - Détracteurs)
- ❌ Affichage dans le Dashboard
- ❌ Suivi de l'objectif +15 points sur 12 mois

**Actions requises :**
1. Créer la table `npsScores` dans `drizzle/schema.ts` :
   ```typescript
   export const npsScores = mysqlTable("npsScores", {
     id: int("id").autoincrement().primaryKey(),
     storeId: int("storeId").notNull(),
     score: int("score").notNull(), // 0-10
     category: varchar("category", { length: 50 }), // "promoter", "passive", "detractor"
     comment: text("comment"),
     createdAt: timestamp("createdAt").defaultNow().notNull(),
   });
   ```

2. Créer une interface de collecte de feedback :
   - Page `/feedback` pour les clients
   - Formulaire avec échelle 0-10
   - Champ de commentaire optionnel

3. Créer les fonctions backend :
   - `saveNPSScore()` dans `server/db.ts`
   - `calculateNPS()` dans `server/db.ts`
   - Procédures tRPC `nps.submit` et `nps.calculate`

4. Afficher dans le Dashboard :
   - Score NPS actuel
   - Évolution sur 12 mois
   - Répartition Promoteurs/Passifs/Détracteurs
   - Objectif +15 points

---

## 5. Temps d'actualisation des planogrammes

### État actuel : ❌ NON IMPLÉMENTÉ

**Ce qui existe :**
- ✅ Table `planogramHistory` avec timestamps
- ✅ Champ `createdAt` et `updatedAt` dans `planograms`
- ✅ Historique des versions de planogrammes

**Ce qui manque :**
- ❌ Champ `appliedAt` pour marquer l'application terrain
- ❌ Calcul du délai entre modification et application
- ❌ Affichage du temps moyen d'actualisation
- ❌ Suivi de l'objectif -30% sur 6 mois

**Actions requises :**
1. Ajouter le champ `appliedAt` dans la table `planograms` :
   ```typescript
   appliedAt: timestamp("appliedAt"),
   ```

2. Créer une fonction `calculateUpdateTime()` dans `server/db.ts` :
   ```typescript
   export async function calculateUpdateTime(storeId: number, period: string) {
     // Calcule le délai moyen entre updatedAt et appliedAt
     const planograms = await db.select()
       .from(planograms)
       .where(eq(planograms.storeId, storeId));
     
     const delays = planograms
       .filter(p => p.appliedAt)
       .map(p => {
         const updated = new Date(p.updatedAt).getTime();
         const applied = new Date(p.appliedAt!).getTime();
         return (applied - updated) / (1000 * 60 * 60 * 24); // en jours
       });
     
     return {
       averageDelay: delays.reduce((a, b) => a + b, 0) / delays.length,
       minDelay: Math.min(...delays),
       maxDelay: Math.max(...delays),
     };
   }
   ```

3. Ajouter une procédure tRPC `planograms.updateTime`

4. Créer une interface pour marquer un planogramme comme "appliqué" :
   - Bouton dans l'application mobile terrain
   - Action "Marquer comme appliqué" avec timestamp

5. Afficher dans le Dashboard :
   - Temps moyen d'actualisation
   - Graphique d'évolution sur 6 mois
   - Objectif -30%
   - Liste des planogrammes en attente d'application

---

## Résumé des Actions Prioritaires

### 🔴 Priorité 1 : KPIs critiques manquants

1. **Satisfaction client (NPS)** - Complètement manquant
   - Créer la table `npsScores`
   - Implémenter l'interface de collecte
   - Afficher dans le Dashboard

2. **Temps d'actualisation** - Complètement manquant
   - Ajouter le champ `appliedAt`
   - Créer la fonction de calcul
   - Interface de marquage terrain

### 🟡 Priorité 2 : KPIs partiels à compléter

3. **CA/m² par catégorie** - Partiel
   - Ajouter le calcul par catégorie
   - Créer le graphique d'évolution
   - Tracker l'objectif +10%

4. **Taux de rupture** - Partiel
   - Créer l'historique des ruptures
   - Calculer le taux de rupture
   - Graphique d'évolution

### 🟢 Priorité 3 : KPIs existants à améliorer

5. **Taux de rotation** - Implémenté
   - Ajouter le suivi par catégorie
   - Tracker l'objectif +15%
   - Améliorer la visualisation

---

## Estimation du Temps de Développement

| KPI | Effort | Temps estimé |
|-----|--------|--------------|
| NPS | Élevé | 4-6 heures |
| Temps d'actualisation | Moyen | 2-3 heures |
| CA/m² par catégorie | Faible | 1-2 heures |
| Taux de rupture | Moyen | 2-3 heures |
| Amélioration rotation | Faible | 1 heure |
| **TOTAL** | - | **10-15 heures** |

---

## Conclusion

**État actuel de la couverture des KPIs demandés :**
- ✅ **1/5 KPI complètement implémenté** (Taux de rotation)
- ⚠️ **2/5 KPIs partiellement implémentés** (CA/m², Taux de rupture)
- ❌ **2/5 KPIs non implémentés** (NPS, Temps d'actualisation)

**Couverture globale : ~40%**

Pour atteindre 100% de couverture, il faut implémenter les 5 actions prioritaires listées ci-dessus.
