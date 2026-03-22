const CACHE_NAME = 'city-discoverer-v7-nashville-colors-20250914';
// Remove pre-caching - Vite uses /assets/* not /static/*
const urlsToCache = [];

// Install service worker
self.addEventListener('install', (event) => {
  console.log('SW: Installing new version v3');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache v3');
        return cache.addAll(urlsToCache);
      })
  );
  // Force immediate activation of new service worker
  self.skipWaiting();
});

// Fetch event - Network first for JS/HTML files to get updates immediately
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // For API calls, always bypass cache for fresh database data
  if (url.includes('/api')) {
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          // For API calls, delete old cached version first, then cache new response
          const cache = await caches.open(CACHE_NAME);
          await cache.delete(event.request);
          
          const responseClone = response.clone();
          cache.put(event.request, responseClone);
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(event.request);
        })
    );
  }
  // Network-first for HTML, JS files to get updates immediately  
  else if (url.includes('.js') || url.includes('.html') || url.endsWith('/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the new response
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(event.request);
        })
    );
  } else {
    // Cache-first for other static assets (images, CSS)
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          return response || fetch(event.request);
        }
      )
    );
  }
});

// Activate service worker
self.addEventListener('activate', (event) => {
  console.log('SW: Activating new version v4 - Enhanced cache refresh');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Background sync for offline functionality
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Sync any pending data when back online
    const cache = await caches.open(CACHE_NAME);
    
    // Update today's city data
    try {
      const response = await fetch('/api/cities/today');
      if (response.ok) {
        await cache.put('/api/cities/today', response.clone());
      }
    } catch (error) {
      console.log('Background sync failed:', error);
    }
  } catch (error) {
    console.log('Background sync error:', error);
  }
}

// Push notifications — City Discoverer daily city alerts
self.addEventListener('push', (event) => {
  let data = { title: 'City Discoverer', body: 'Your City of the Day is ready!', url: '/' };
  if (event.data) {
    try { data = { ...data, ...JSON.parse(event.data.text()) }; } catch (e) {}
  }

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/favicon-32.png',
    vibrate: [100, 50, 100],
    data: { url: data.url },
    actions: [
      { action: 'open', title: 'Explore Now' },
      { action: 'close', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks — open the app to the right URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/';

  if (event.action === 'close') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});