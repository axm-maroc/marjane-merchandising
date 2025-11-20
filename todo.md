# Marjane - Optimisation Merchandising Omnicanal - TODO

## Phase 1 : Base de données et architecture
- [x] Créer le schéma de base de données complet (magasins, produits, planogrammes, stocks, etc.)
- [x] Générer des données d'échantillon réalistes pour Marjane
- [x] Configurer l'architecture frontend avec navigation latérale

## Phase 2 : Gestion des magasins
- [x] Interface de création/édition de magasin
- [ ] Upload et gestion des photos de magasin
- [x] Intégration de la géolocalisation (adresse, coordonnées GPS)
- [x] Gestion de la surface et des caractéristiques du magasin
- [x] Liste et recherche des magasins

## Phase 3 : Référentiel produits
- [x] Créer le catalogue de produits avec catégories
- [x] Générer des photos de produits dynamiques (boissons, alimentaire, etc.)
- [x] Interface de gestion des produits
- [x] Recherche et filtrage de produits

## Phase 4 : Planogrammes 2D/3D
- [x] Créer des emplacements/rayonnages dans un magasin
- [x] Sélection et ajout de produits au planogramme
- [x] Visualisation 2D du planogramme (vue de face du rayonnage)
- [x] Visualisation 3D du planogramme (vue perspective)
- [ ] Placement interactif des produits sur le rayonnage
- [x] Définition des objectifs de vente par planogramme
- [x] Sauvegarde et gestion des versions de planogrammes

## Phase 5 : Historique et suivi des stocks
- [ ] Enregistrement de l'historique des mouvements de stock
- [ ] Visualisation graphique de l'historique par produit
- [ ] Filtrage par période et par produit
- [ ] Indicateurs clés (stock moyen, rotation, ruptures)

## Phase 6 : Moteur IA de prévisions
- [ ] Moteur de règles paramétrable pour les prévisions
- [ ] Calcul des prévisions basé sur l'historique
- [ ] Recommandations d'assortiment optimales
- [ ] Suggestions de placement basées sur les ventes
- [ ] Alertes et notifications automatiques

## Phase 7 : Comparaison photo réel vs prévu
- [ ] Upload de photos réelles du planogramme en magasin
- [ ] Affichage côte à côte (prévu vs réel)
- [ ] Analyse visuelle des différences

## Phase 8 : Détection d'anomalies
- [ ] Identification automatique des produits mal placés
- [ ] Détection des produits manquants
- [ ] Détection des produits en surplus
- [ ] Génération de rapports d'anomalies
- [ ] Recommandations de correction

## Phase 9 : Partage de recommandations
- [ ] Génération de liens de partage uniques
- [ ] Page publique de visualisation des recommandations
- [ ] Export PDF des recommandations
- [ ] Historique des partages

## Phase 10 : Tests et finalisation
- [ ] Tests unitaires des fonctionnalités critiques
- [ ] Tests d'intégration du flux complet
- [ ] Optimisation des performances
- [ ] Documentation utilisateur
- [ ] Checkpoint final et déploiement


## Nouvelles fonctionnalités demandées

### Module de suivi des stocks avec graphiques
- [x] Créer des graphiques interactifs d'évolution des stocks
- [x] Afficher les tendances de vente par produit
- [x] Visualiser les prévisions basées sur l'historique
- [x] Ajouter des indicateurs de performance (rotation, ruptures)

### Moteur IA de recommandations avancé
- [x] Implémenter des algorithmes d'apprentissage automatique
- [x] Générer des recommandations d'assortiment optimisées
- [x] Suggérer des placements basés sur les corrélations de vente
- [x] Calculer l'impact prévu des recommandations

### Détection d'anomalies par vision
- [x] Système de comparaison automatique photo vs planogramme
- [x] Identification des produits mal placés par IA
- [x] Détection des produits manquants ou en surplus
- [x] Génération de rapports d'anomalies avec suggestions de correction


## Bugs à corriger

- [x] Corriger l'erreur de génération IA dans le module de recommandations
- [x] Vérifier et tester tous les modules pour s'assurer qu'ils fonctionnent correctement


## Bugs critiques à corriger

- [x] Corriger l'erreur 404 dans le module Planogrammes 2D/3D
- [x] Corriger la vue 3D dans le module gestion des magasins
- [x] Corriger l'upload de photos réelles dans le module gestion des magasins
- [x] Corriger le bouton "Générer recommandations" dans le module Recommandations IA
- [x] Corriger l'analyse de photo dans le module Détection d'anomalies
- [x] Corriger l'erreur 404 dans le module Partage de recommandations


## Nouvelles fonctionnalités demandées

### Module de partage de recommandations
- [x] Développer la page complète de partage de recommandations
- [x] Générer des liens partageables avec QR codes
- [ ] Créer une vue publique des recommandations partagées
- [ ] Ajouter un système de tracking des recommandations partagées

### Création et gestion de planogrammes
- [x] Créer une interface de création de nouveaux planogrammes
- [x] Ajouter la sélection de thème d'étalage (boissons, snacks, etc.)
- [x] Permettre l'ajout de produits par thème
- [x] Implémenter la sélection multiple de produits
- [ ] Ajouter un système de drag & drop pour placer les produits

### Amélioration de la vue 3D
- [ ] Synchroniser la vue 3D avec la vue 2D
- [ ] Afficher les vrais produits avec leurs dimensions dans la vue 3D
- [ ] Ajouter des contrôles de rotation et zoom pour la vue 3D
- [ ] Améliorer le rendu visuel des produits en 3D


## Bugs 404 à corriger

- [x] Corriger l'erreur 404 sur la page des étagères dans le détail du magasin
- [x] Corriger l'erreur 404 sur "Voir le planogramme" dans Planogrammes 2D/3D


## Bug à corriger - Étagères

- [x] Corriger le message "emplacement introuvable" dans les étagères
- [x] Restaurer le fonctionnement des étagères comme dans les versions précédentes


## Nouvelles fonctionnalités avancées

### Système de drag & drop interactif
- [x] Implémenter la bibliothèque de drag & drop pour React
- [x] Créer une zone de canvas interactif pour le planogramme 2D
- [x] Permettre de glisser-déposer les produits depuis la liste vers le rayonnage
- [x] Ajouter l'ajustement automatique des positions
- [x] Implémenter la détection de collisions entre produits
- [x] Ajouter le redimensionnement visuel des produits
- [ ] Sauvegarder automatiquement les positions des produits

### Export PDF professionnel
- [x] Installer les dépendances pour la génération PDF
- [x] Créer un template PDF professionnel pour les planogrammes
- [x] Inclure la vue 2D du planogramme dans le PDF
- [x] Inclure la vue 3D du planogramme dans le PDF
- [x] Ajouter la liste détaillée des produits avec photos
- [x] Inclure les objectifs de vente et statistiques
- [x] Ajouter un bouton d'export PDF dans l'interface
- [x] Générer un nom de fichier descriptif avec date

### Historique et versioning
- [ ] Créer une table pour l'historique des versions de planogrammes
- [ ] Implémenter la sauvegarde automatique des versions
- [ ] Créer une interface de visualisation de l'historique
- [ ] Permettre la comparaison entre deux versions
- [ ] Implémenter la restauration d'une version antérieure
- [ ] Ajouter des commentaires/notes sur chaque version
- [ ] Afficher un timeline visuel de l'évolution


## Fonctionnalités avancées demandées

### Historique et versioning des planogrammes
- [x] Créer une table pour l'historique des versions de planogrammes
- [x] Implémenter la sauvegarde automatique des versions
- [x] Créer une interface de visualisation de l'historique
- [x] Permettre la comparaison entre deux versions
- [x] Implémenter la restauration d'une version antérieure
- [x] Ajouter des commentaires/notes sur chaque version
- [x] Afficher un timeline visuel de l'évolution
- [x] Ajouter un bouton d'accès à l'historique depuis la page de visualisation des planogrammes
- [x] Ajouter les procédures tRPC pour l'historique (getHistory, compareVersions, restoreVersion)

### Dashboard analytique consolidé
- [ ] Créer la page du dashboard avec layout responsive
- [ ] Implémenter le calcul des KPIs (taux de conformité, CA, rotation stocks)
- [ ] Ajouter des graphiques de tendances temporelles
- [ ] Créer un système d'alertes critiques en temps réel
- [ ] Ajouter des filtres temporels (jour, semaine, mois, année)
- [ ] Implémenter la comparaison inter-magasins
- [ ] Ajouter l'export automatique des rapports

### Application mobile terrain
- [ ] Créer une interface mobile responsive
- [ ] Implémenter la prise de photos de rayonnages
- [ ] Ajouter la validation de conformité des planogrammes
- [ ] Créer un système de remontée d'informations terrain
- [ ] Implémenter la synchronisation en temps réel
- [ ] Ajouter la géolocalisation des actions terrain
- [ ] Créer un mode hors-ligne avec synchronisation différée


## Nouvelles fonctionnalités avancées - Phase 2

### Dashboard analytique consolidé
- [x] Créer la page Dashboard.tsx avec layout responsive
- [x] Implémenter le calcul des KPIs (taux de conformité, CA, rotation stocks, alertes)
- [x] Ajouter des graphiques de tendances temporelles avec Chart.js
- [x] Créer un système d'alertes critiques en temps réel
- [x] Ajouter des filtres temporels (jour, semaine, mois, année)
- [x] Implémenter la comparaison inter-magasins
- [ ] Ajouter l'export automatique des rapports PDF/Excel
- [x] Ajouter la route /dashboard dans l'application
- [x] Ajouter le lien vers le dashboard dans la page d'accueil

### Application mobile terrain (séparée)
- [x] Créer un nouveau projet web mobile optimisé pour smartphones
- [x] Configurer un port séparé pour l'application mobile (port 3001)
- [x] Développer une interface mobile-first responsive
- [x] Implémenter la page d'accueil mobile avec statistiques et géolocalisation
- [x] Créer le module de prise de photos de rayonnages
- [x] Ajouter la page de gestion des tâches avec filtres
- [x] Créer un système de remontée d'anomalies terrain
- [x] Implémenter la navigation bottom bar mobile
- [x] Ajouter la géolocalisation des actions terrain
- [x] Créer la page de profil avec statistiques et réalisations
- [x] Configurer PWA avec manifest.json
- [x] Exposer l'application sur une URL publique

### Automatisation du versioning
- [x] Implémenter la sauvegarde automatique lors du changement de statut
- [x] Ajouter la sauvegarde automatique lors de l'ajout/suppression de produits
- [x] Créer un système de détection des modifications importantes
- [x] Ajouter des procédures tRPC pour updateStatus, addProduct, removeProduct
- [x] Implémenter la génération automatique de commentaires descriptifs
- [x] Ajouter la fonction savePlanogramVersion dans db.ts
- [x] Sauvegarder automatiquement la version initiale lors de la création


## Intégration de l'application mobile dans l'application principale
- [x] Copier les pages mobiles dans client/src/pages/mobile/
- [x] Copier les styles CSS mobiles
- [x] Créer les routes /mobile/* dans App.tsx
- [x] Créer le composant MobileLayout avec navigation bottom bar
- [x] Ajouter un point d'entrée depuis la page d'accueil
- [x] Tester l'accès et la navigation mobile


## Upload photo avec S3 et métadonnées
- [x] Créer la table photos dans le schéma de base de données (planogramPhotos)
- [x] Ajouter les procédures tRPC pour upload et liste des photos
- [x] Implémenter la capture photo réelle dans Camera.tsx
- [x] Ajouter l'upload vers S3 avec métadonnées (magasin, planogramme, timestamp, géolocalisation)
- [x] Créer l'endpoint /api/upload-photo avec multer
- [x] Intégrer la géolocalisation automatique lors de la prise de photo
- [ ] Afficher la galerie des photos uploadées
- [ ] Tester l'upload et la récupération des photos

## Système de synchronisation hors-ligne PWA
- [x] Créer le service worker pour le cache des ressources
- [x] Implémenter la stratégie de cache (Cache First pour assets, Network First pour API)
- [x] Ajouter le stockage local IndexedDB pour les actions hors-ligne
- [x] Implémenter la synchronisation automatique lors de la reconnexion (Background Sync API)
- [x] Ajouter un indicateur de statut de connexion dans MobileLayout
- [x] Créer le hook useServiceWorker pour gérer l'état en ligne/hors-ligne
- [ ] Tester le mode hors-ligne et la synchronisation


## Amélioration du module Suivi des Stocks
- [x] Ajouter le filtre planogramme entre le filtre magasin et le filtre produit
- [x] Réorganiser la disposition des filtres (Magasin → Planogramme → Produit)
- [x] Ajouter la procédure tRPC planograms.byStore
- [x] Ajouter la fonction getPlanogramsByStore dans db.ts
- [x] Tester le filtrage avec les trois filtres combinés
