# 📱 Application Mobile Terrain - Marjane Merchandising

Application mobile-first optimisée pour les équipes terrain de Marjane, permettant la capture de photos, la remontée d'anomalies et le suivi des tâches en mobilité.

---

## 🎯 Fonctionnalités

### 🏠 Accueil
- **Statistiques en temps réel** : Tâches du jour, taux de conformité, anomalies détectées
- **Géolocalisation** : Affichage du magasin le plus proche
- **Accès rapide** : Liens directs vers les modules principaux

### ✅ Gestion des Tâches
- **Liste des planogrammes** à vérifier par magasin
- **Filtres** : Par statut (À faire, En cours, Terminé)
- **Progression** : Barre de progression visuelle
- **Actions** : Marquer comme terminé, voir détails, prendre photo

### 📷 Capture de Photos
- **Caméra native** : Accès direct à l'appareil photo du smartphone
- **Galerie** : Upload depuis la galerie de photos
- **Métadonnées** : Géolocalisation et timestamp automatiques
- **Upload S3** : Stockage sécurisé dans le cloud
- **Prévisualisation** : Vérification avant envoi

### 🚨 Remontée d'Anomalies
- **Signalement terrain** : Formulaire rapide pour signaler les problèmes
- **Types d'anomalies** :
  - Produit manquant
  - Produit mal positionné
  - Quantité incorrecte
  - Étiquette manquante
  - Autre
- **Sévérité** : Critique, Élevée, Moyenne, Faible
- **Photo jointe** : Preuve visuelle de l'anomalie
- **Commentaires** : Description détaillée du problème

### 👤 Profil
- **Statistiques personnelles** :
  - Tâches complétées aujourd'hui
  - Taux de conformité personnel
  - Anomalies signalées
  - Photos capturées
- **Réalisations** : Badges et accomplissements
- **Historique** : Activité récente

---

## 🏗️ Architecture Technique

### Technologies
- **React 19** + TypeScript
- **Tailwind CSS 4** pour le styling mobile-first
- **PWA** (Progressive Web App) pour fonctionnement hors-ligne
- **Service Worker** pour la synchronisation en arrière-plan
- **Geolocation API** pour la localisation
- **Camera API** pour la capture de photos

### Structure
```
Application Mobile Intégrée (dans l'app principale)
client/src/pages/mobile/
├── Home.tsx              # Page d'accueil mobile
├── Tasks.tsx             # Gestion des tâches
├── Camera.tsx            # Capture de photos
├── Anomalies.tsx         # Remontée d'anomalies
├── Profile.tsx           # Profil utilisateur
└── MobileLayout.tsx      # Layout avec navigation bottom bar

Application Mobile Standalone (port 3001)
mobile-app/
├── src/
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Tasks.tsx
│   │   ├── Camera.tsx
│   │   ├── Anomalies.tsx
│   │   └── Profile.tsx
│   ├── App.tsx
│   └── main.tsx
├── public/
│   └── manifest.json     # Manifest PWA
└── package.json
```

---

## 🚀 Accès à l'Application Mobile

### Option 1 : Intégrée dans l'Application Principale
**URL** : `https://[votre-domaine]/mobile`

L'application mobile est accessible directement depuis l'application web principale via la route `/mobile`.

### Option 2 : Application Standalone
**URL** : `https://3001-[votre-sandbox].manusvm.computer`

Une version standalone est également disponible sur le port 3001 pour les tests.

---

## 📱 Installation PWA

### Sur Android
1. Ouvrir l'URL dans Chrome
2. Appuyer sur le menu (⋮)
3. Sélectionner "Ajouter à l'écran d'accueil"
4. L'icône apparaît sur l'écran d'accueil

### Sur iOS
1. Ouvrir l'URL dans Safari
2. Appuyer sur le bouton Partager
3. Sélectionner "Sur l'écran d'accueil"
4. L'icône apparaît sur l'écran d'accueil

---

## 🔄 Synchronisation Hors-Ligne

### Service Worker
L'application utilise un Service Worker pour :
- **Cache des assets** : HTML, CSS, JS, images
- **Cache des données** : Planogrammes, produits, tâches
- **Queue de synchronisation** : Les actions sont mises en file d'attente quand hors-ligne
- **Sync en arrière-plan** : Envoi automatique quand la connexion revient

### Stratégies de Cache
```typescript
// Cache-first pour les assets statiques
workbox.routing.registerRoute(
  /\.(js|css|png|jpg|jpeg|svg|gif)$/,
  new workbox.strategies.CacheFirst()
);

// Network-first pour les données dynamiques
workbox.routing.registerRoute(
  /\/api\//,
  new workbox.strategies.NetworkFirst()
);
```

---

## 📸 Capture et Upload de Photos

### Flow Complet
1. **Capture** : Utilisateur prend une photo avec la caméra
2. **Métadonnées** : Ajout automatique de géolocalisation et timestamp
3. **Compression** : Réduction de la taille pour upload rapide
4. **Upload S3** : Envoi vers le stockage cloud
5. **Sauvegarde DB** : Enregistrement des métadonnées en base
6. **Notification** : Confirmation à l'utilisateur

### Code Exemple
```typescript
async function captureAndUploadPhoto(planogramId: number) {
  // 1. Capture photo
  const photo = await navigator.mediaDevices.getUserMedia({ video: true });
  
  // 2. Obtenir géolocalisation
  const position = await navigator.geolocation.getCurrentPosition();
  
  // 3. Upload vers S3
  const { url } = await uploadPhotoMutation.mutateAsync({
    planogramId,
    photoData: photo,
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    timestamp: new Date()
  });
  
  return url;
}
```

---

## 🚨 Système d'Alertes

### Notifications Push (à venir)
- Nouvelles tâches assignées
- Anomalies critiques détectées
- Rappels de tâches non complétées
- Mises à jour de planogrammes

### Alertes Locales
- Confirmation d'upload de photo
- Erreur de synchronisation
- Connexion perdue/rétablie
- Tâche complétée avec succès

---

## 📊 Métriques et Analytics

### Données Collectées
- **Temps de complétion** des tâches
- **Taux de conformité** par utilisateur
- **Nombre de photos** capturées par jour
- **Anomalies signalées** par type et sévérité
- **Localisation** des actions (avec consentement)

### Dashboard Manager
Les managers peuvent voir en temps réel :
- Activité des équipes terrain
- Progression des tâches par magasin
- Anomalies en attente de résolution
- Photos capturées avec géolocalisation

---

## 🔐 Sécurité et Permissions

### Permissions Requises
- **Caméra** : Pour capturer des photos
- **Géolocalisation** : Pour localiser les actions
- **Stockage** : Pour le cache hors-ligne
- **Notifications** : Pour les alertes (optionnel)

### Sécurité
- **Authentification** : OAuth Manus obligatoire
- **HTTPS** : Toutes les communications chiffrées
- **Upload sécurisé** : Signature des URLs S3
- **Validation** : Vérification côté serveur de toutes les données

---

## 🎨 Design Mobile-First

### Principes
- **Touch-friendly** : Boutons larges (min 44x44px)
- **Navigation bottom bar** : Accès rapide aux 5 sections principales
- **Gestes** : Swipe pour naviguer entre les tâches
- **Feedback visuel** : Animations et transitions fluides
- **Mode sombre** : Support du dark mode (à venir)

### Responsive
- **Mobile** : 320px - 767px (optimisé)
- **Tablette** : 768px - 1023px (adapté)
- **Desktop** : 1024px+ (redirection vers app principale)

---

## 🧪 Tests

### Tests Manuels
- ✅ Capture photo sur Android
- ✅ Capture photo sur iOS
- ✅ Upload avec géolocalisation
- ✅ Fonctionnement hors-ligne
- ✅ Synchronisation au retour de connexion
- ✅ Navigation bottom bar
- ✅ Filtres de tâches

### Tests Automatisés (à venir)
- Tests unitaires des composants
- Tests d'intégration de l'upload
- Tests de synchronisation hors-ligne
- Tests de performance

---

## 📈 Roadmap

### Version 1.0 (Actuelle)
- ✅ Page d'accueil avec statistiques
- ✅ Gestion des tâches avec filtres
- ✅ Capture de photos
- ✅ Remontée d'anomalies
- ✅ Profil utilisateur
- ✅ Navigation bottom bar

### Version 1.1 (Prochaine)
- [ ] Notifications push
- [ ] Mode hors-ligne complet
- [ ] Synchronisation en arrière-plan
- [ ] Scan de codes-barres
- [ ] Signature électronique

### Version 2.0 (Future)
- [ ] Application native React Native
- [ ] Reconnaissance d'image automatique
- [ ] Réalité augmentée pour visualisation 3D
- [ ] Chat en temps réel avec le support
- [ ] Gamification avec badges et classements

---

## 🛠️ Développement Local

### Démarrer l'Application Mobile Standalone
```bash
cd mobile-app
pnpm install
pnpm dev
```

L'application sera accessible sur `http://localhost:3001`

### Démarrer l'Application Mobile Intégrée
```bash
cd marjane-merchandising
pnpm dev
```

Accéder à `http://localhost:3000/mobile`

---

## 📞 Support

Pour toute question sur l'application mobile :
- **Documentation** : Voir ce fichier
- **Issues** : https://github.com/axm-maroc/marjane-merchandising/issues
- **Email** : support-mobile@marjane.ma

---

## 📄 Licence

Propriétaire - Marjane Holding © 2025

---

**Développé avec ❤️ pour les équipes terrain de Marjane**
