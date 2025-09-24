// PWA (Progressive Web App) utilities
export class PWAService {
  private static instance: PWAService;
  private serviceWorker: ServiceWorker | null = null;
  private isOnline: boolean = navigator.onLine;
  private deferredPrompt: any = null;

  private constructor() {
    this.initialize();
  }

  static getInstance(): PWAService {
    if (!PWAService.instance) {
      PWAService.instance = new PWAService();
    }
    return PWAService.instance;
  }

  private initialize() {
    // Register service worker
    if ('serviceWorker' in navigator) {
      this.registerServiceWorker();
    }

    // Listen for network changes
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    // Listen for beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.deferredPrompt = event;
      this.showInstallButton();
    });

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      this.handleAppInstalled();
    });

    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        this.handleServiceWorkerUpdate();
      });
    }
  }

  private async registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully:', registration);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.showUpdateNotification();
            }
          });
        }
      });

      this.serviceWorker = registration.active;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  // Handle network status
  private handleOnline() {
    this.isOnline = true;
    this.showNotification('Back Online', 'Your connection has been restored.', 'success');
    this.syncOfflineData();
  }

  private handleOffline() {
    this.isOnline = false;
    this.showNotification('Offline Mode', 'You are currently offline. Some features may be limited.', 'warning');
  }

  // Handle app installation
  private showInstallButton() {
    const installButton = document.createElement('button');
    installButton.textContent = 'Install App';
    installButton.className = 'install-button';
    installButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 24px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;

    installButton.addEventListener('click', () => this.installApp());
    document.body.appendChild(installButton);
  }

  private async installApp() {
    if (!this.deferredPrompt) return;

    try {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('App installed successfully');
      }

      this.deferredPrompt = null;

      // Remove install button
      const installButton = document.querySelector('.install-button');
      if (installButton) {
        installButton.remove();
      }
    } catch (error) {
      console.error('Installation failed:', error);
    }
  }

  private handleAppInstalled() {
    console.log('App was installed successfully');
    this.showNotification('App Installed', 'Thank you for installing AutoMedia!', 'success');
  }

  // Handle service worker updates
  private handleServiceWorkerUpdate() {
    console.log('New service worker is active');
    this.showUpdateNotification();
  }

  private showUpdateNotification() {
    if (confirm('A new version of AutoMedia is available. Would you like to update?')) {
      window.location.reload();
    }
  }

  // Show notifications
  private showNotification(title: string, message: string, type: 'success' | 'warning' | 'error' = 'success') {
    if ('Notification' in window && Notification.permission === 'granted') {
      const options = {
        body: message,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        vibrate: type === 'error' ? [100, 50, 100] : [50],
        tag: 'automedia-notification',
        renotify: type === 'error'
      };

      new Notification(title, options);
    }
  }

  // Sync offline data
  private async syncOfflineData() {
    if ('serviceWorker' in navigator && this.serviceWorker) {
      try {
        // Trigger background sync
        await this.serviceWorker.postMessage({ type: 'SYNC_OFFLINE_DATA' });

        // Register sync events
        await navigator.serviceWorker.ready.then(registration => {
          registration.sync.register('sync-posts');
          registration.sync.register('sync-analytics');
        });

        console.log('Offline data sync triggered');
      } catch (error) {
        console.error('Failed to sync offline data:', error);
      }
    }
  }

  // Offline data storage
  async saveOfflineData(key: string, data: any) {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(['offlineData'], 'readwrite');
      const store = transaction.objectStore('offlineData');
      await store.put({ id: key, data, timestamp: Date.now() });
    } catch (error) {
      console.error('Failed to save offline data:', error);
    }
  }

  async getOfflineData(key: string) {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(['offlineData'], 'readonly');
      const store = transaction.objectStore('offlineData');
      const result = await store.get(key);
      return result?.data || null;
    } catch (error) {
      console.error('Failed to get offline data:', error);
      return null;
    }
  }

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AutoMediaDB', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('offlineData')) {
          db.createObjectStore('offlineData', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('offlinePosts')) {
          db.createObjectStore('offlinePosts', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('offlineAnalytics')) {
          db.createObjectStore('offlineAnalytics', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  // Public methods
  isAppInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone ||
           document.referrer.includes('android-app://');
  }

  isOnlineStatus(): boolean {
    return this.isOnline;
  }

  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  async shareContent(data: ShareData): Promise<boolean> {
    if ('share' in navigator) {
      try {
        await navigator.share(data);
        return true;
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Share failed:', error);
        }
        return false;
      }
    }
    return false;
  }

  async addToHomeScreen(): Promise<boolean> {
    if (this.deferredPrompt) {
      try {
        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        this.deferredPrompt = null;
        return outcome === 'accepted';
      } catch (error) {
        console.error('Add to home screen failed:', error);
        return false;
      }
    }
    return false;
  }

  async getNetworkInformation(): Promise<any> {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };
    }
    return null;
  }

  async clearCache(): Promise<void> {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames
            .filter(name => name.startsWith('automedia-'))
            .map(name => caches.delete(name))
        );
        console.log('Cache cleared successfully');
      } catch (error) {
        console.error('Failed to clear cache:', error);
      }
    }
  }
}

// React Hook for PWA functionality
export const usePWA = () => {
  const pwaService = PWAService.getInstance();

  const isInstalled = pwaService.isAppInstalled();
  const isOnline = pwaService.isOnlineStatus();

  const shareContent = async (data: ShareData) => {
    return await pwaService.shareContent(data);
  };

  const addToHomeScreen = async () => {
    return await pwaService.addToHomeScreen();
  };

  const requestNotificationPermission = async () => {
    return await pwaService.requestNotificationPermission();
  };

  const getNetworkInfo = async () => {
    return await pwaService.getNetworkInformation();
  };

  const saveOfflineData = async (key: string, data: any) => {
    return await pwaService.saveOfflineData(key, data);
  };

  const getOfflineData = async (key: string) => {
    return await pwaService.getOfflineData(key);
  };

  const clearCache = async () => {
    return await pwaService.clearCache();
  };

  return {
    isInstalled,
    isOnline,
    shareContent,
    addToHomeScreen,
    requestNotificationPermission,
    getNetworkInfo,
    saveOfflineData,
    getOfflineData,
    clearCache
  };
};