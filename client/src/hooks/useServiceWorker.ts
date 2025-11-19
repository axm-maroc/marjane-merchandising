import { useEffect, useState } from 'react';

export function useServiceWorker() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Enregistrer le service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[App] Service Worker registered:', registration);
          setSwRegistration(registration);

          // Vérifier les mises à jour
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[App] New version available');
                  // Notifier l'utilisateur qu'une nouvelle version est disponible
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[App] Service Worker registration failed:', error);
        });
    }

    // Écouter les changements de connexion
    const handleOnline = () => {
      console.log('[App] Back online');
      setIsOnline(true);
      
      // Déclencher la synchronisation
      if (swRegistration && 'sync' in swRegistration) {
        (swRegistration as any).sync.register('sync-photos').catch((error: Error) => {
          console.error('[App] Background sync registration failed:', error);
        });
      }
    };

    const handleOffline = () => {
      console.log('[App] Gone offline');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.addEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [swRegistration]);

  return { isOnline, swRegistration };
}
