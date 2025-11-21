# Recommandations Futures - Éditeur de Zones

Ce document liste les 3 recommandations principales pour améliorer l'éditeur de zones et l'application Marjane Merchandising.

## 1. Filtres et Recherche dans les Panneaux Latéraux

### Objectif
Ajouter des champs de recherche et filtres par statut dans les panneaux Planogrammes et Emplacements pour faciliter la navigation dans les magasins avec de nombreux éléments.

### Bénéfices
- **Recherche rapide** : Trouver un planogramme ou emplacement par nom/code
- **Filtrage par statut** : Afficher uniquement les planogrammes Actifs, Brouillons ou Archivés
- **Filtrage par zone** : Voir uniquement les emplacements d'une zone spécifique
- **Meilleure performance** : Réduire le nombre d'éléments affichés

### Implémentation
- Ajouter un champ `<Input type="search">` en haut de chaque panneau
- Implémenter des filtres avec des boutons/checkboxes
- Utiliser `filter()` et `includes()` pour filtrer les données côté client
- Persister les préférences de filtre dans localStorage

### Priorité
⭐⭐⭐ Haute - Essentiel pour les magasins avec 50+ planogrammes/emplacements

---

## 2. Mode Plein Écran et Zoom sur le Canvas

### Objectif
Ajouter un bouton pour masquer les panneaux latéraux et passer en mode plein écran sur le canvas, avec contrôles de zoom (+/-) pour travailler sur les détails des grandes surfaces de vente.

### Bénéfices
- **Meilleure visibilité** : Voir le plan complet du magasin sans distractions
- **Zoom précis** : Travailler sur les détails des petites zones
- **Navigation fluide** : Déplacer la vue avec la molette de souris
- **Productivité** : Réduire le temps de manipulation

### Implémentation
- Ajouter un bouton "Plein écran" dans le header
- Implémenter le zoom avec `canvas.scale()` et `canvas.translate()`
- Gérer les événements souris pour le pan (déplacement)
- Ajouter des contrôles de zoom (+10%, -10%, Reset 100%)
- Supporter le zoom à la molette (Ctrl + Wheel)

### Priorité
⭐⭐⭐ Haute - Améliore significativement l'expérience utilisateur

---

## 3. Export PDF du Plan de Magasin

### Objectif
Créer une fonctionnalité d'export qui génère un PDF haute résolution du canvas avec toutes les zones, emplacements et légende (codes couleur, dimensions, planogrammes), prêt pour impression et distribution aux équipes terrain.

### Bénéfices
- **Documentation** : Créer un document de référence pour les équipes terrain
- **Conformité** : Avoir une trace écrite de la configuration du magasin
- **Partage** : Distribuer facilement le plan aux responsables de magasin
- **Archivage** : Conserver l'historique des configurations

### Implémentation
- Utiliser la librairie `html2pdf` ou `jsPDF` + `html2canvas`
- Exporter le canvas en image haute résolution (300 DPI)
- Ajouter une légende avec :
  - Codes couleur (zones sponsorisées vs libres)
  - Liste des zones avec dimensions
  - Liste des planogrammes par zone
  - Date et heure de l'export
  - Nom du magasin
- Permettre de choisir l'orientation (Portrait/Paysage)
- Ajouter un bouton "Exporter PDF" dans le header

### Priorité
⭐⭐ Moyenne - Utile pour la documentation et le partage

---

## Améliorations de Présentation - Bloc Outils

### Changements Proposés
1. **Icônes plus grandes** : Passer de 4×4 à 5×5 pour meilleure visibilité
2. **Disposition verticale** : Afficher les boutons en 3 colonnes au lieu de 2
3. **Sections avec en-têtes** : Ajouter des en-têtes colorés pour chaque section (Dessin, Affichage, Fichier)
4. **Meilleur espacement** : Augmenter l'espace entre les sections (space-y-6 au lieu de space-y-4)
5. **Badges visuels** : Ajouter des couleurs aux en-têtes (bleu pour Dessin, vert pour Affichage, violet pour Fichier)

### Fichier de Référence
Voir `client/src/pages/ZoneEditor-tools-improved.tsx` pour un exemple d'implémentation.

---

## Roadmap de Priorité

| Recommandation | Priorité | Effort | Impact | Trimestre |
|---|---|---|---|---|
| Filtres et Recherche | ⭐⭐⭐ | Moyen | Élevé | Q1 2024 |
| Mode Plein Écran & Zoom | ⭐⭐⭐ | Moyen | Élevé | Q1 2024 |
| Export PDF | ⭐⭐ | Moyen | Moyen | Q2 2024 |
| Amélioration Présentation | ⭐⭐ | Faible | Moyen | Q1 2024 |

---

## Notes Techniques

- **Filtres** : Implémenter côté client pour une réactivité instantanée
- **Zoom** : Utiliser Canvas API native pour performance optimale
- **PDF** : Tester sur différents navigateurs (Chrome, Firefox, Safari)
- **Responsive** : Adapter les contrôles pour mobile/tablette

---

**Dernière mise à jour** : 20 novembre 2025
