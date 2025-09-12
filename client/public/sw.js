const CACHE_NAME = 'city-discoverer-v2-force-update';
const urlsToCache = [
  '/',
  '/static/css/index.css',
  '/static/js/main.js',
  '/manifest.json'
];

// Install service worker
self.addEventListener('install', (event) => {
  console.log('SW: Installing new version');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  // Force immediate activation of new service worker
  self.skipWaiting();
});

// Fetch event - Network first for JS/HTML files to get updates immediately
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // Network-first for HTML, JS files, and API calls to always get updates
  if (url.includes('.js') || url.includes('.html') || url.includes('/api') || url.endsWith('/')) {
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
  console.log('SW: Activating new version');
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

// Push notifications (for future premium features)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New city discovery available!',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2'
    },
    actions: [
      {
        action: 'explore',
        title: 'Explore City',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Daily Felix', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Just close the notification
  }
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
