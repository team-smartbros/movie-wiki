// Service Worker for Movie Wiki
// Version: 1.0

const CACHE_NAME = 'movie-wiki-v1';
const CACHE_EXPIRATION = 1000 * 60 * 60; // 1 hour
const MAX_CACHE_ITEMS = 100;

// Files to cache
const urlsToCache = [
  '../',
  '../index.html',
  '../forum.html',
  '../search.html',
  '../stream.html',
  '../details.html',
  './script.js',
  '../assets/favicon.png',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[Service Worker] Install');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(urlsToCache);
      })
  );
  
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activate');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Claim clients
  return self.clients.claim();
});

// Fetch event - implement caching strategy
self.addEventListener('fetch', event => {
  // Only cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Don't cache requests to Firebase or other APIs
  const url = new URL(event.request.url);
  if (url.hostname.includes('firebase') || 
      url.hostname.includes('imdb') || 
      url.hostname.includes('web-1-production')) {
    return;
  }
  
  // For movie data requests, use network-first strategy with cache fallback
  if (url.pathname.includes('/search') || url.search.includes('q=')) {
    event.respondWith(
      networkFirstWithCache(event.request)
    );
    return;
  }
  
  // For static assets, use cache-first strategy
  event.respondWith(
    cacheFirst(event.request)
  );
});

// Cache-first strategy for static assets
async function cacheFirst(request) {
  // Try to get from cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    console.log('[Service Worker] Serving from cache:', request.url);
    return cachedResponse;
  }
  
  // If not in cache, fetch from network
  try {
    const networkResponse = await fetch(request);
    
    // Cache the response for future requests
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      console.log('[Service Worker] Caching new response:', request.url);
      cache.put(request, networkResponse.clone());
      
      // Clean up cache if it gets too large
      cleanUpCache();
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Network error:', error);
    // Return a fallback response if available
    return new Response('Offline content', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Network-first strategy with cache fallback for API requests
async function networkFirstWithCache(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // If successful, cache the response
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      console.log('[Service Worker] Caching API response:', request.url);
      cache.put(request, networkResponse.clone());
      
      // Clean up cache
      cleanUpCache();
    }
    
    return networkResponse;
  } catch (error) {
    // If network fails, try cache
    console.log('[Service Worker] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[Service Worker] Serving from cache:', request.url);
      return cachedResponse;
    }
    
    // If no cache, return offline response
    return new Response(JSON.stringify({ 
      ok: false, 
      error: 'Network error and no cached data available' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Clean up cache to prevent it from growing too large
async function cleanUpCache() {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();
  
  // If we have too many items, remove the oldest ones
  if (keys.length > MAX_CACHE_ITEMS) {
    // Sort by URL to get consistent ordering
    keys.sort((a, b) => a.url.localeCompare(b.url));
    
    // Remove oldest items
    const keysToDelete = keys.slice(0, keys.length - MAX_CACHE_ITEMS + 10);
    for (const key of keysToDelete) {
      await cache.delete(key);
      console.log('[Service Worker] Deleted old cache entry:', key.url);
    }
  }
  
  // Remove expired entries
  const now = Date.now();
  for (const key of keys) {
    const response = await cache.match(key);
    if (response) {
      const dateHeader = response.headers.get('date');
      if (dateHeader) {
        const cacheTime = new Date(dateHeader).getTime();
        if (now - cacheTime > CACHE_EXPIRATION) {
          await cache.delete(key);
          console.log('[Service Worker] Deleted expired cache entry:', key.url);
        }
      }
    }
  }
}

// Handle messages from main thread
self.addEventListener('message', async event => {
  console.log('[Service Worker] Received message:', event.data);
  
  if (event.data.command === 'CACHE_ITEM') {
    try {
      const cache = await caches.open(CACHE_NAME);
      const key = `movie_cache_${event.data.item.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      const cacheData = {
        data: event.data.item,
        timestamp: Date.now()
      };
      
      // Create a Response object to cache
      const response = new Response(JSON.stringify(cacheData), {
        headers: { 'Content-Type': 'application/json' }
      });
      
      await cache.put(key, response);
      console.log('[Service Worker] Cached item:', event.data.item.title);
    } catch (error) {
      console.log('[Service Worker] Failed to cache item:', error.message);
    }
  } else if (event.data.command === 'CACHE_ITEMS') {
    try {
      const cache = await caches.open(CACHE_NAME);
      for (const item of event.data.items) {
        const key = `movie_cache_${item.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        const cacheData = {
          data: item,
          timestamp: Date.now()
        };
        
        // Create a Response object to cache
        const response = new Response(JSON.stringify(cacheData), {
          headers: { 'Content-Type': 'application/json' }
        });
        
        await cache.put(key, response);
      }
      console.log('[Service Worker] Cached items:', event.data.items.length);
    } catch (error) {
      console.log('[Service Worker] Failed to cache items:', error.message);
    }
  } else if (event.data.command === 'GET_CACHED_ITEMS') {
    try {
      const cachedItems = [];
      const processedIds = new Set();
      
      // Try to get items from service worker cache
      const cache = await caches.open(CACHE_NAME);
      const keys = await cache.keys();
      
      for (const title of event.data.titles) {
        // Look for cached items matching the title
        for (const key of keys) {
          if (key.url.includes(encodeURIComponent(title))) {
            const cachedResponse = await cache.match(key);
            if (cachedResponse) {
              const item = await cachedResponse.json();
              // Check if cache is less than 1 hour old
              if (Date.now() - item.timestamp < 3600000) {
                // Deduplication: skip if already processed
                if (item.data && item.data.id && !processedIds.has(item.data.id)) {
                  processedIds.add(item.data.id);
                  cachedItems.push(item.data);
                }
              }
            }
          }
        }
      }
      
      // Send response back to main thread
      event.ports[0].postMessage({ cachedItems });
    } catch (error) {
      console.log('[Service Worker] Failed to get cached items:', error.message);
      event.ports[0].postMessage({ cachedItems: [] });
    }
  }
});

// Handle background sync for comments
self.addEventListener('sync', event => {
  if (event.tag === 'sync-comments') {
    console.log('[Service Worker] Background sync for comments');
    event.waitUntil(syncComments());
  }
});

// Sync comments when online
async function syncComments() {
  // This would handle syncing offline comments when connection is restored
  // Implementation would depend on how comments are stored
  console.log('[Service Worker] Syncing comments');
}