# 🛒 Marjane - Solution d'Optimisation Merchandising Omnicanal

Solution complète de gestion et d'optimisation du merchandising pour la chaîne de distribution marocaine Marjane.

## 🎯 Fonctionnalités Principales

### 📊 Dashboard Analytique
- KPIs en temps réel (conformité, CA, rotation, alertes)
- Graphiques de tendances (ventes, conformité, anomalies)
- Performance par magasin et par produit
- 5 KPIs stratégiques : CA/m², Rotation, Rupture, NPS, Actualisation

### 🏪 Gestion des Magasins
- 12 magasins Marjane authentiques au Maroc
- Géolocalisation et informations détaillées
- Gestion des zones avec sponsoring fournisseurs
- Photos et plans de magasin

### 📦 Planogrammes 2D/3D
- Éditeur interactif avec drag & drop
- Visualisation 2D et 3D isométrique
- 174 planogrammes actifs
- 1,451 produits assignés
- Versioning et historique complet
- Import/Export CSV/XLSX
- Templates réutilisables

### 🤖 Intelligence Artificielle
- **Optimisation automatique** : Placement optimal selon règles merchandising
- **Prévisions de stock** : Projection sur 30 jours avec alertes
- **Détection d'anomalies** : Analyse par vision IA des photos rayons
- **Recommandations intelligentes** : Basées sur marges et saisonnalité
- **Simulateur d'impact** : Prévision CA/marge avant changements

### 📈 Suivi des Stocks
- Historique complet avec graphiques
- Prévisions sur 30 jours
- Alertes de stock critique
- Export CSV/Excel
- Filtres en cascade : Magasin → Zone → Planogramme → Produit

### 📱 Application Mobile Terrain
- Interface mobile-first optimisée
- Capture de photos rayons
- Remontée d'anomalies terrain
- Gestion des tâches
- Synchronisation hors-ligne (PWA)

### 💬 Feedback Client (NPS)
- Formulaires publics avec QR codes
- Dashboard de gestion des feedbacks négatifs
- Notifications automatiques au propriétaire
- Statistiques par magasin

## 🏗️ Architecture Technique

### Frontend
- **Framework** : React 19 + TypeScript
- **UI** : Tailwind CSS 4 + Shadcn/ui
- **Routing** : Wouter
- **Charts** : Recharts + Chart.js
- **State** : React Query (tRPC)

### Backend
- **Framework** : Express.js + tRPC 11
- **Base de données** : MySQL avec Drizzle ORM
- **Authentification** : Manus OAuth
- **API** : Type-safe avec tRPC (pas de REST)
- **IA** : Intégration LLM pour vision et recommandations

### Infrastructure
- **Hébergement** : Manus Platform
- **Stockage** : S3 pour les images
- **Maps** : Google Maps API
- **Notifications** : API Manus

## 📊 Données Actuelles

- **Magasins** : 12 magasins Marjane authentiques
- **Produits** : 41 produits avec photos (27 avec images réelles)
- **Planogrammes** : 174 actifs, 60 générés
- **Assignations** : 1,451 produits positionnés
- **Ventes** : 14,760 enregistrements (30 jours)
- **Zones** : 120 zones magasin
- **Sponsoring** : 35 contrats actifs

## 🚀 Installation

### Prérequis
- Node.js 22+
- pnpm 10+
- MySQL/TiDB

### Installation
```bash
# Cloner le dépôt
git clone https://github.com/axm-maroc/marjane-merchandising.git
cd marjane-merchandising

# Installer les dépendances
pnpm install

# Configurer la base de données
pnpm db:push

# Générer des données de démonstration
node scripts/generate-all-planograms.mjs
node scripts/generate-sales-data.mjs
node scripts/assign-products-to-planograms.mjs

# Démarrer le serveur de développement
pnpm dev
```

L'application sera accessible sur `http://localhost:3000`

## 📁 Structure du Projet

```
marjane-merchandising/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── pages/         # Pages de l'application
│   │   ├── components/    # Composants réutilisables
│   │   ├── lib/           # Utilitaires (tRPC client)
│   │   └── App.tsx        # Routes principales
│   └── public/            # Assets statiques
├── server/                # Backend Express + tRPC
│   ├── routers.ts         # Routes API (15 modules)
│   ├── db.ts              # Fonctions base de données
│   └── _core/             # Infrastructure (OAuth, LLM, Maps)
├── drizzle/               # Schéma base de données
│   └── schema.ts          # Définition des tables (20+)
├── scripts/               # Scripts de génération de données
└── shared/                # Types partagés
```

## 🔑 Fonctionnalités Avancées

### Optimisation IA des Planogrammes
```typescript
// Algorithme de placement optimal
- Produits forte rotation (Boissons, Laitiers, Épicerie) → Hauteur des yeux (niveaux 2-3)
- Produits faible rotation (Bazar, Textile) → Extrémités (niveaux 0 ou 5)
```

### Prévisions de Stock
```typescript
// Calcul des prévisions
projectedStock = currentStock - (averageDailySales × numberOfDays)
daysUntilStockout = currentStock / averageDailySales
```

### Détection d'Anomalies
- Upload photo du rayon
- Analyse IA avec LLM vision
- Détection : produits manquants, mal positionnés, quantités incorrectes

## 🧪 Tests

```bash
# Lancer tous les tests
pnpm test

# Tests unitaires
pnpm test server/

# Statistiques actuelles
# 167 tests passent, 10 skippés
```

## 📜 Scripts Utiles

```bash
# Génération de données
node scripts/generate-all-planograms.mjs      # Générer planogrammes
node scripts/generate-sales-data.mjs          # Générer ventes
node scripts/assign-products-to-planograms.mjs # Assigner produits

# Optimisation
node scripts/optimize-planogram-positions.mjs  # Optimiser positions

# Nettoyage
node scripts/clean-test-stores.mjs            # Nettoyer magasins test
node scripts/reset-database.mjs               # Réinitialiser DB

# Vérification
node scripts/list-products.mjs                # Lister produits
node scripts/count-stores.mjs                 # Compter magasins
```

## 🔐 Authentification

L'application utilise Manus OAuth pour l'authentification :
- Connexion automatique via portail Manus
- Sessions sécurisées avec JWT
- Rôles : `admin` et `user`

## 📞 Support

Pour toute question ou problème :
- **Email** : support@marjane.ma
- **Documentation** : Voir `/docs` dans le projet
- **Issues** : https://github.com/axm-maroc/marjane-merchandising/issues

## 📄 Licence

Propriétaire - Marjane Holding © 2025

---

Développé avec ❤️ pour Marjane par l'équipe AXM Maroc
