// Service Worker for Movie Wiki PWA
const CACHE_NAME = 'movie-wiki-v1.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/pages/search.html',
  '/pages/details.html',
  '/pages/forum.html',
  '/pages/watchlist.html',
  '/pages/stream.html',
  '/pages/actors_detail.html',
  '/js/script.js',
  '/js/ad-modal.js',
  '/js/voiceSearch.js',
  '/js/watchlist.js',
  '/js/trailer.js',
  '/js/actors_details.js',
  '/css/style.css',
  '/offline.html'
];

// Install event - cache essential files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
  // Skip requests to external domains
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        // Clone the request because it's a stream and can only be consumed once
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(response => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response because it's a stream and can only be consumed once
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
            
          return response;
        }).catch(() => {
          // If fetch fails, try to serve offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});