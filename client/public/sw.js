// Service Worker pour le mode hors-ligne PWA
const CACHE_NAME = 'marjane-mobile-v1';
const STATIC_CACHE = 'marjane-static-v1';
const DYNAMIC_CACHE = 'marjane-dynamic-v1';

// Ressources à mettre en cache immédiatement
const STATIC_ASSETS = [
  '/',
  '/mobile',
  '/mobile/tasks',
  '/mobile/camera',
  '/mobile/anomalies',
  '/mobile/profile',
  '/manifest.json',
];

// Installation du service worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activation du service worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  return self.clients.claim();
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Stratégie Cache First pour les assets statiques
  if (request.destination === 'image' || request.destination === 'style' || request.destination === 'script') {
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request).then((fetchResponse) => {
          return caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      }).catch(() => {
        // Retourner une réponse par défaut en cas d'échec
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      })
    );
    return;
  }

  // Stratégie Network First pour les API
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Mettre en cache les réponses API réussies
          if (response.ok) {
            return caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, response.clone());
              return response;
            });
          }
          return response;
        })
        .catch(() => {
          // Retourner la version en cache si disponible
          return caches.match(request).then((response) => {
            if (response) {
              return response;
            }
            // Retourner une réponse d'erreur
            return new Response(
              JSON.stringify({ error: 'Offline', offline: true }),
              {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
              }
            );
          });
        })
    );
    return;
  }

  // Stratégie Cache First pour les pages
  event.respondWith(
    caches.match(request).then((response) => {
      return response || fetch(request).then((fetchResponse) => {
        return caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, fetchResponse.clone());
          return fetchResponse;
        });
      }).catch(() => {
        // Retourner la page d'accueil en cache
        return caches.match('/mobile');
      });
    })
  );
});

// Synchronisation en arrière-plan
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-photos') {
    event.waitUntil(syncPhotos());
  }
});

// Fonction de synchronisation des photos
async function syncPhotos() {
  try {
    // Récupérer les photos en attente depuis IndexedDB
    const db = await openDB();
    const pendingPhotos = await getPendingPhotos(db);
    
    for (const photo of pendingPhotos) {
      try {
        // Envoyer la photo au serveur
        const response = await fetch('/api/upload-photo', {
          method: 'POST',
          body: photo.formData,
        });
        
        if (response.ok) {
          // Supprimer de la file d'attente
          await removePendingPhoto(db, photo.id);
          console.log('[SW] Photo synced:', photo.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync photo:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Sync error:', error);
  }
}

// Helpers IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('marjane-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending-photos')) {
        db.createObjectStore('pending-photos', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getPendingPhotos(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending-photos'], 'readonly');
    const store = transaction.objectStore('pending-photos');
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function removePendingPhoto(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending-photos'], 'readwrite');
    const store = transaction.objectStore('pending-photos');
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}
