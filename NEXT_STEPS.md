# Marjane Merchandising - Prochaines Étapes

## 📋 Résumé des Implémentations Complétées

### ✅ Étape 1 : Mapper les images aux produits
- **Status** : Complétée (27/41 produits avec images - 66%)
- **Fichiers créés** :
  - `scripts/update-product-images.mjs` - Script pour mettre à jour les URLs d'images
  - `scripts/list-products.mjs` - Script pour lister les produits
- **Intégration** :
  - ProductCard.tsx affiche les images en 3 variantes (grid, list, compact)
  - PlanogramView onglet "Produits" affiche les images
  - Fallback sur icône Package si pas d'image

### ✅ Étape 2 : Générer des planogrammes réalistes
- **Status** : Complétée (60 planogrammes générés)
- **Fichier créé** : `scripts/generate-all-planograms.mjs`
- **Résultats** :
  - 12 magasins traités
  - 60 planogrammes créés (5 par magasin)
  - 228 produits assignés
  - Catégories : Boissons, Produits Laitiers, Épicerie, Hygiène, Ménagers
  - Statuts variés : active (48), draft (12)

### ✅ Étape 3 : Ajouter l'interface de validation
- **Status** : Complétée
- **Fichiers créés** :
  - `client/src/components/ValidationPanel.tsx` - Composant de validation
- **Implémentation** :
  - Procédure tRPC `planograms.updateStatus` dans routers.ts
  - Fonction `db.updatePlanogram()` dans db.ts
  - Intégration dans PlanogramView.tsx
  - Boutons : "Valider & Déployer" (draft→active), "Archiver" (active→archived)

---

## 🎯 Recommandations Supplémentaires à Implémenter

### Recommandation 1 : Compléter les 14 images manquantes (66% → 100%)

**Objectif** : Avoir des images pour tous les 41 produits

**Approche** :
1. Identifier les 14 produits sans images :
   ```bash
   node scripts/list-products.mjs | grep "Sans image"
   ```

2. Générer des images pour les produits manquants :
   - Utiliser le composant `generate` pour créer des images réalistes
   - Ou télécharger depuis Unsplash/Pexels
   - Sauvegarder dans `/client/public/products/`

3. Mettre à jour les URLs :
   ```bash
   node scripts/update-product-images.mjs
   ```

**Impact** : 100% des produits auront des images, meilleure expérience utilisateur

---

### Recommandation 2 : Tester le workflow de validation

**Objectif** : Vérifier que le workflow draft→active→archived fonctionne correctement

**Étapes de test** :
1. Accéder à PlanogramView pour un planogramme en statut "draft"
2. Cliquer sur "Valider & Déployer"
3. Vérifier que :
   - Le statut passe à "active" en base de données
   - Le badge affiche "Actif"
   - Le bouton change en "Archiver"
4. Cliquer sur "Archiver"
5. Vérifier que le statut passe à "archived"

**Fichiers à tester** :
- `client/src/components/ValidationPanel.tsx` - Composant de validation
- `server/routers.ts` - Procédure `planograms.updateStatus`
- `server/db.ts` - Fonction `updatePlanogram()`

**Test unitaire suggéré** :
```typescript
// server/validation-workflow.test.ts
describe('Planogram Validation Workflow', () => {
  it('should transition from draft to active', async () => {
    // Create draft planogram
    // Call updateStatus mutation
    // Assert status is 'active'
  });
});
```

---

### Recommandation 3 : Ajouter des notifications de déploiement

**Objectif** : Notifier les responsables de magasin quand un planogramme est déployé

**Implémentation** :
1. Ajouter un appel à `notifyOwner()` dans la procédure `updateStatus` :
   ```typescript
   // server/routers.ts
   updateStatus: protectedProcedure
     .input(z.object({
       planogramId: z.number(),
       status: z.enum(['draft', 'active', 'archived']),
     }))
     .mutation(async ({ input, ctx }) => {
       const result = await db.updatePlanogram(input.planogramId, {
         status: input.status,
       });
       
       // Notify owner on deployment
       if (input.status === 'active') {
         const { notifyOwner } = await import('./_core/notification');
         await notifyOwner({
           title: `📋 Planogramme déployé - ID ${input.planogramId}`,
           content: `Le planogramme a été validé et déployé en magasin.`,
         });
       }
       
       return { success: true };
     }),
   ```

2. Ajouter un toast de confirmation au frontend :
   ```typescript
   // client/src/components/ValidationPanel.tsx
   const handleValidateAndDeploy = async () => {
     try {
       await updateStatusMutation.mutateAsync({
         planogramId,
         status: "active",
       });
       toast.success("✅ Planogramme déployé et notification envoyée !");
     } catch (error) {
       toast.error("Erreur lors du déploiement");
     }
   };
   ```

3. Ajouter un historique de déploiement :
   - Créer une table `planogramDeployments` pour tracer les déploiements
   - Enregistrer : planogramId, userId, timestamp, status, notes

**Impact** : Traçabilité complète des déploiements, communication en temps réel

---

## 📊 Tableau de Synthèse

| Recommandation | Status | Effort | Impact | Priorité |
|---|---|---|---|---|
| 1. Images manquantes | ⏳ À faire | Faible | Moyen | Haute |
| 2. Tester validation | ⏳ À faire | Faible | Moyen | Haute |
| 3. Notifications | ⏳ À faire | Moyen | Élevé | Moyenne |

---

## 🚀 Commandes Utiles

```bash
# Lister les produits et leurs images
node scripts/list-products.mjs

# Mettre à jour les images
node scripts/update-product-images.mjs

# Générer des planogrammes
node scripts/generate-all-planograms.mjs

# Exécuter les tests
pnpm test

# Vérifier les erreurs TypeScript
pnpm tsc
```

---

## 📝 Notes Techniques

- **ProductCard.tsx** : Affiche les images en 3 variantes (grid, list, compact)
- **PlanogramView.tsx** : Onglet "Produits" avec galerie d'images
- **ValidationPanel.tsx** : Composant réutilisable pour la validation
- **generate-all-planograms.mjs** : Script pour générer des planogrammes réalistes

---

## ✨ Résultat Final

Après implémentation de ces 3 recommandations supplémentaires :
- ✅ 100% des produits avec images
- ✅ Workflow de validation testé et validé
- ✅ Notifications de déploiement en temps réel
- ✅ Traçabilité complète des changements
