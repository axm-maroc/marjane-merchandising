# Guide d'Intégration du Système de Feedback NPS

Ce document explique en détail où et comment le système de feedback client NPS a été intégré dans l'application Marjane.

---

## 📋 Vue d'Ensemble

Le système de feedback NPS permet de collecter les avis clients directement en magasin via des QR codes. Il se compose de **3 parties principales** :

1. **Formulaire public** - Page accessible via QR code pour les clients
2. **Administration des QR codes** - Interface pour générer et gérer les QR codes
3. **Calcul et affichage des KPIs** - Intégration dans les KPIs stratégiques

---

## 🗂️ Structure des Fichiers

### 1. Backend (Serveur)

#### **Base de données** - `drizzle/schema.ts`

Une table `npsScores` a été créée pour stocker les feedbacks clients :

```typescript
export const npsScores = mysqlTable("npsScores", {
  id: int("id").autoincrement().primaryKey(),
  storeId: int("storeId").notNull(),
  score: int("score").notNull(), // 0-10
  category: mysqlEnum("category", ["promoter", "passive", "detractor"]).notNull(),
  comment: text("comment"),
  customerEmail: varchar("customerEmail", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
```

**Localisation** : Ligne ~150 dans `drizzle/schema.ts`

---

#### **Fonctions de base de données** - `server/db.ts`

Deux fonctions principales ont été ajoutées :

**1. `calculateNPS(storeId, startDate?, endDate?)`**
- Calcule le score NPS d'un magasin
- Retourne : `{ npsScore, promoters, passives, detractors, totalResponses }`
- **Localisation** : Ligne ~450 dans `server/db.ts`

**2. `saveNPSScore(data)`**
- Enregistre un nouveau feedback NPS
- Catégorise automatiquement (promoteur 9-10, passif 7-8, détracteur 0-6)
- **Localisation** : Ligne ~490 dans `server/db.ts`

---

#### **Procédures tRPC** - `server/routers.ts`

Deux procédures tRPC exposent ces fonctions au frontend :

**1. `kpis.npsScore`** (Query)
```typescript
npsScore: publicProcedure
  .input(z.object({
    storeId: z.number(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
  }))
  .query(async ({ input }) => {
    return await calculateNPS(input.storeId, input.startDate, input.endDate);
  })
```

**2. `kpis.submitNPS`** (Mutation)
```typescript
submitNPS: publicProcedure
  .input(z.object({
    storeId: z.number(),
    score: z.number().min(0).max(10),
    comment: z.string().optional(),
    customerEmail: z.string().email().optional(),
  }))
  .mutation(async ({ input }) => {
    return await saveNPSScore(input);
  })
```

**Localisation** : Ligne ~280 dans `server/routers.ts` (dans le router `kpis`)

---

### 2. Frontend (Client)

#### **Formulaire Public** - `client/src/pages/CustomerFeedback.tsx`

**URL** : `/feedback/:storeId` (exemple : `/feedback/1` pour le magasin ID 1)

**Fonctionnalités** :
- ✅ Échelle de notation 0-10 interactive avec couleurs dynamiques
- ✅ Icônes visuelles (😊 promoteur, 😐 passif, ☹️ détracteur)
- ✅ Champ commentaire optionnel (500 caractères max)
- ✅ Champ email optionnel avec validation
- ✅ Page de remerciement après soumission
- ✅ Design gradient responsive (mobile-first)

**Composants utilisés** :
- `Card`, `Button`, `Textarea`, `Input` (shadcn/ui)
- `trpc.stores.getById` - Récupère les infos du magasin
- `trpc.kpis.submitNPS` - Soumet le feedback

**Localisation** : `client/src/pages/CustomerFeedback.tsx` (nouveau fichier)

---

#### **Administration des QR Codes** - `client/src/pages/FeedbackAdmin.tsx`

**URL** : `/feedback-admin`

**Fonctionnalités** :
- ✅ Liste de tous les magasins avec leurs QR codes
- ✅ Génération automatique de QR codes stylisés (bibliothèque `qr-code-styling`)
- ✅ Téléchargement en PNG
- ✅ Impression directe avec template professionnel
- ✅ Copie de l'URL dans le presse-papier
- ✅ Statistiques NPS en temps réel par magasin
- ✅ Badge de score NPS (vert si ≥50, gris sinon)

**Composants utilisés** :
- `QRCodeStyling` - Génération de QR codes stylisés
- `trpc.stores.list` - Liste des magasins
- `trpc.kpis.npsScore` - Statistiques NPS par magasin

**Localisation** : `client/src/pages/FeedbackAdmin.tsx` (nouveau fichier)

---

#### **Intégration dans KPIs Stratégiques** - `client/src/pages/StrategicKPIs.tsx`

Un bouton "QR Codes Feedback" a été ajouté dans l'en-tête de la page KPIs Stratégiques :

```tsx
<Link href="/feedback-admin">
  <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
    <QrCode className="w-4 h-4" />
    QR Codes Feedback
  </Button>
</Link>
```

**Localisation** : Ligne ~160 dans `client/src/pages/StrategicKPIs.tsx`

---

#### **Routes** - `client/src/App.tsx`

Deux nouvelles routes ont été ajoutées :

```tsx
<Route path="/feedback/:storeId" component={CustomerFeedback} />
<Route path="/feedback-admin" component={FeedbackAdmin} />
```

**Localisation** : Ligne ~51-52 dans `client/src/App.tsx`

---

## 🔄 Flux Complet d'Utilisation

### 1️⃣ Génération des QR Codes (Administrateur)

1. **Accéder** à la page KPIs Stratégiques (`/kpis`)
2. **Cliquer** sur le bouton "QR Codes Feedback" (en haut à droite)
3. **Voir** la liste de tous les magasins avec leurs QR codes
4. **Télécharger** le QR code en PNG ou **Imprimer** directement
5. **Placer** le QR code imprimé dans le magasin (caisse, accueil, sortie)

### 2️⃣ Collecte des Feedbacks (Client)

1. **Scanner** le QR code avec un smartphone
2. **Ouvrir** le formulaire de feedback (`/feedback/:storeId`)
3. **Sélectionner** une note de 0 à 10
4. **Ajouter** un commentaire (optionnel)
5. **Saisir** un email (optionnel)
6. **Soumettre** le feedback
7. **Voir** la page de remerciement

### 3️⃣ Consultation des Résultats (Administrateur)

1. **Accéder** à la page KPIs Stratégiques (`/kpis`)
2. **Sélectionner** un magasin
3. **Voir** le score NPS dans la section "KPI 4: Satisfaction client (NPS)"
4. **Consulter** la répartition : Promoteurs / Passifs / Détracteurs
5. **Comparer** avec l'objectif (+15 points sur 12 mois)

---

## 📊 Affichage dans les KPIs Stratégiques

Le KPI NPS est affiché dans la page `/kpis` :

```tsx
<Card>
  <CardHeader>
    <CardTitle className="flex items-center justify-between">
      <span className="flex items-center gap-2">
        <Smile className="w-5 h-5 text-yellow-600" />
        KPI 4: Satisfaction client (NPS)
      </span>
      <Badge variant={npsData.npsScore >= 50 ? "default" : "secondary"}>
        {npsData.npsScore}
      </Badge>
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-3 gap-4">
      <div className="text-center p-4 bg-emerald-50 rounded-lg">
        <div className="text-2xl font-bold text-emerald-700">
          {npsData.promoters}
        </div>
        <div className="text-sm text-slate-600">Promoteurs</div>
      </div>
      <div className="text-center p-4 bg-slate-50 rounded-lg">
        <div className="text-2xl font-bold text-slate-700">
          {npsData.passives}
        </div>
        <div className="text-sm text-slate-600">Passifs</div>
      </div>
      <div className="text-center p-4 bg-red-50 rounded-lg">
        <div className="text-2xl font-bold text-red-700">
          {npsData.detractors}
        </div>
        <div className="text-sm text-slate-600">Détracteurs</div>
      </div>
    </div>
  </CardContent>
</Card>
```

**Localisation** : Ligne ~300 dans `client/src/pages/StrategicKPIs.tsx`

---

## 🧪 Tests Unitaires

14 tests unitaires ont été créés dans `server/feedback.test.ts` :

### Tests de soumission (8 tests)
- ✅ Score promoteur (9-10)
- ✅ Score passif (7-8)
- ✅ Score détracteur (0-6)
- ✅ Feedback sans commentaire
- ✅ Feedback sans email
- ✅ Rejet score < 0
- ✅ Rejet score > 10
- ✅ Rejet email invalide

### Tests de calcul (2 tests)
- ✅ Calcul NPS après plusieurs soumissions
- ✅ NPS = 0 pour magasin sans feedback

### Tests de filtrage (2 tests)
- ✅ Filtrage par date de début
- ✅ Filtrage par plage de dates

### Tests d'intégration (2 tests)
- ✅ Validation des données du magasin
- ✅ Flux complet : soumission → calcul → vérification

**Localisation** : `server/feedback.test.ts` (nouveau fichier)

**Exécution** : `pnpm test server/feedback.test.ts`

---

## 📦 Dépendances Installées

Une nouvelle dépendance a été ajoutée :

```json
{
  "qr-code-styling": "1.9.2"
}
```

**Utilité** : Génération de QR codes stylisés avec couleurs personnalisées, coins arrondis, et logo central.

**Installation** : `pnpm add qr-code-styling`

---

## 🎨 Design et UX

### Couleurs par Score

- **0-6 (Détracteur)** : Rouge (`bg-red-500`)
- **7-8 (Passif)** : Bleu (`bg-blue-500`)
- **9-10 (Promoteur)** : Vert (`bg-emerald-500`)

### Icônes

- **Détracteur** : ☹️ `Frown`
- **Passif** : 😐 `Meh`
- **Promoteur** : 😊 `Smile`

### Animations

- Transition de scale sur les boutons de notation
- Fade-in pour les champs optionnels
- Ring coloré sur le score sélectionné

---

## 🔗 URLs Importantes

| Page | URL | Accès |
|------|-----|-------|
| **KPIs Stratégiques** | `/kpis` | Authentifié |
| **Admin QR Codes** | `/feedback-admin` | Authentifié |
| **Formulaire Public** | `/feedback/:storeId` | **Public** (pas d'authentification) |

⚠️ **Important** : Le formulaire de feedback (`/feedback/:storeId`) est **public** et accessible sans authentification pour permettre aux clients de donner leur avis facilement.

---

## 📝 Exemple d'URL de Feedback

Pour le magasin "Marjane Bouregreg" (ID = 1) :

```
https://votre-domaine.com/feedback/1
```

Cette URL est encodée dans le QR code et peut être :
- Scannée avec un smartphone
- Copiée dans le presse-papier
- Partagée par email/SMS
- Imprimée sur des supports physiques

---

## 🚀 Prochaines Améliorations Possibles

1. **Notifications email** automatiques pour feedbacks négatifs
2. **Dashboard NPS temps réel** avec graphiques d'évolution
3. **Système de récompense** pour inciter la participation
4. **Support multilingue** (FR/AR) pour le formulaire
5. **Export Excel** des feedbacks par magasin
6. **Analyse de sentiment** automatique des commentaires
7. **Comparaison inter-magasins** dans un tableau de bord dédié

---

## 📞 Support

Pour toute question sur l'intégration du système NPS, consultez :

- **Documentation technique** : Ce fichier (`GUIDE_INTEGRATION_NPS.md`)
- **Tests unitaires** : `server/feedback.test.ts`
- **Analyse des KPIs** : `ANALYSE_KPIs.md`
