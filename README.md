# Marjane - Optimisation Merchandising Omnicanal

Solution complète d'optimisation merchandising pour les hypermarchés Marjane au Maroc.

## 🎯 Fonctionnalités

### Gestion des Magasins
- **12 magasins Marjane authentiques** (Rabat, Casablanca, Marrakech, Fès, Agadir, Tanger, Oujda, Meknès, Tétouan)
- Géolocalisation et informations détaillées
- Gestion des zones et emplacements

### Planogrammes 2D/3D
- **Éditeur interactif de planogrammes** avec sélection visuelle des produits
- **Éditeur de zones** avec outils de dessin (rectangle, sélection, suppression)
- Visualisation 2D/3D des rayonnages
- Affectation de produits avec photos réelles
- Gestion des statuts (Brouillon, Actif, Archivé)

### Référentiel Produits
- **25 produits** avec photos réelles (Coca-Cola, Sprite, Fanta, eau minérale, produits laitiers, etc.)
- Catégorisation par type (Boissons, Frais, Épicerie, Hygiène, Entretien)
- Gestion des prix et marques

### Analytics & IA
- **Dashboard analytique** avec KPIs et performance
- **Prévisions IA** avec recommandations intelligentes
- **Détection d'anomalies** entre planogramme prévu et réel
- **Suivi des stocks** avec historique et prévisions

### Contrats de Sponsoring
- Gestion des contrats fournisseurs
- Suivi des revenus et emplacements premium
- Historique des contrats

## 🛠️ Stack Technique

### Frontend
- **React 19** avec TypeScript
- **Tailwind CSS 4** pour le styling
- **shadcn/ui** pour les composants
- **Wouter** pour le routing
- **tRPC** pour les appels API type-safe

### Backend
- **Node.js 22** avec Express 4
- **tRPC 11** pour l'API
- **Drizzle ORM** pour la base de données
- **MySQL/TiDB** comme base de données

### Authentification
- **OAuth** intégré
- Gestion des rôles (admin/user)

### Tests
- **Vitest** pour les tests unitaires
- **101 tests** passent avec succès

## 📦 Installation

```bash
# Cloner le dépôt
git clone https://github.com/axm-maroc/marjane-merchandising.git
cd marjane-merchandising

# Installer les dépendances
pnpm install

# Configurer les variables d'environnement

# Pousser le schéma vers la base de données
pnpm db:push

# Générer les données de démonstration
npx tsx scripts/seed-demo-data.mjs

# Démarrer le serveur de développement
pnpm dev
```

## 🚀 Démarrage Rapide

```bash
# Développement
pnpm dev

# Tests
pnpm test

# Build de production
pnpm build

# Démarrer en production
pnpm start
```

## 📁 Structure du Projet

```
marjane-merchandising/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── pages/         # Pages de l'application
│   │   ├── components/    # Composants réutilisables
│   │   ├── lib/           # Utilitaires et configuration
│   │   └── contexts/      # Contextes React
│   └── public/            # Assets statiques
├── server/                # Backend Express + tRPC
│   ├── routers.ts         # Routes tRPC
│   ├── db.ts              # Helpers de base de données
│   └── _core/             # Infrastructure (OAuth, LLM, etc.)
├── drizzle/               # Schéma de base de données
│   └── schema.ts
├── scripts/               # Scripts utilitaires
│   ├── seed-demo-data.mjs        # Génération de données
│   ├── reset-database.mjs        # Réinitialisation DB
│   └── delete-test-stores.mjs    # Nettoyage
└── shared/                # Types et constantes partagés
```

## 🗄️ Base de Données

Le projet utilise **Drizzle ORM** avec MySQL/TiDB. Schéma principal :

- `stores` - Magasins Marjane
- `zones` - Zones dans les magasins
- `planogram_locations` - Emplacements de rayonnage
- `planograms` - Planogrammes
- `products` - Référentiel produits
- `planogram_products` - Association produits-planogrammes
- `sponsorship_contracts` - Contrats fournisseurs
- `stock_records` - Historique des stocks
- `users` - Utilisateurs (OAuth)

## 🧪 Tests

```bash
# Exécuter tous les tests
pnpm test

# Tests en mode watch
pnpm test:watch

# Coverage
pnpm test:coverage
```

**Couverture actuelle :** 101 tests passent sur 105 (4 désactivés)

## 🔐 Sécurité

- Authentification OAuth
- Variables d'environnement sécurisées
- Validation des entrées avec Zod
- Protection CSRF
- Cookies HTTP-only

## 📝 Variables d'Environnement

Les variables suivantes sont requises :

- `DATABASE_URL` - Connexion MySQL/TiDB
- `JWT_SECRET` - Secret pour les sessions
- `OAUTH_SERVER_URL` - URL du serveur OAuth
- `BUILT_IN_FORGE_API_KEY` - Clé API
- `VITE_APP_TITLE` - Titre de l'application
- `VITE_APP_LOGO` - Logo de l'application

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est propriétaire et appartient à Marjane Maroc.

## 👥 Équipe

Développé pour **Marjane Maroc** - Leader de la grande distribution au Maroc

## 🔗 Liens Utiles

- [Site Marjane](https://www.marjane.ma)
- [Drizzle ORM](https://orm.drizzle.team)
- [tRPC](https://trpc.io)

---

**Version actuelle :** 82b14253  
**Dernière mise à jour :** Novembre 2025
