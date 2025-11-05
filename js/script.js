// API Base URLs
const API_BASE = 'https://imdb.iamidiotareyoutoo.com';
const SCRAPER_API_BASE = 'https://web-1-production.up.railway.app';
const FALLBACK_SCRAPER_API_BASE = 'https://web-1-mykj.onrender.com';

// Ensure API constants are properly exposed globally
window.API_BASE = API_BASE;
window.SCRAPER_API_BASE = SCRAPER_API_BASE;
window.FALLBACK_SCRAPER_API_BASE = FALLBACK_SCRAPER_API_BASE;

// Log when API constants are exposed
console.log('✅ API constants exposed globally:', {
    API_BASE: window.API_BASE,
    SCRAPER_API_BASE: window.SCRAPER_API_BASE,
    FALLBACK_SCRAPER_API_BASE: window.FALLBACK_SCRAPER_API_BASE
});

// Enhanced CORS Proxy with more, better, faster proxies and intelligent fallback
const CORS_PROXIES = [
    'https://corsproxy.io/?',                      // Tier 1: Fastest, high reliability
    'https://api.allorigins.win/raw?url=',         // Tier 2: Good reliability
    'https://api.codetabs.com/v1/proxy?quest=',    // Tier 3: Alternative
    'https://thingproxy.freeboard.io/fetch/',      // Tier 4: Fallback
    'https://cors-anywhere.herokuapp.com/',        // Tier 5: Last resort
    'https://crossorigin.me/',                     // Tier 6: Additional option
    'https://jsonp.afeld.me/?url=',                // Tier 7: JSONP proxy
    'https://yacdn.org/proxy/',                    // Tier 8: Yet another CDN proxy
    'https://api.proxycrawl.com/?url=',            // Tier 9: Professional proxy service
    'https://cors.bridged.cc/',                    // Tier 10: Bridge CORS proxy
    'https://api.shrtco.de/v2/info?url=',          // Tier 11: URL shortener with proxy
    'https://api.linkpreview.net/?key=12345&q='    // Tier 12: Link preview with proxy
];

let currentProxyIndex = 0;
let proxySuccessCount = Array(CORS_PROXIES.length).fill(0);
let proxyFailCount = Array(CORS_PROXIES.length).fill(0);
let proxyResponseTimes = Array(CORS_PROXIES.length).fill(0); // Track response times

// Enhanced proxy selection with performance tracking (including response time)
function selectBestProxy() {
    // Calculate success rate and response time for each proxy
    const proxyScores = CORS_PROXIES.map((_, index) => {
        const totalAttempts = proxySuccessCount[index] + proxyFailCount[index];
        if (totalAttempts === 0) return 0.5; // Default score for untested proxies
        
        // Calculate success rate (0-1)
        const successRate = proxySuccessCount[index] / totalAttempts;
        
        // Factor in response time (faster proxies get higher scores)
        // Normalize response time (lower is better)
        const avgResponseTime = proxyResponseTimes[index] / Math.max(proxySuccessCount[index], 1);
        const timeScore = avgResponseTime > 0 ? Math.max(0, 1 - (avgResponseTime / 5000)) : 1; // Normalize to 5s max
        
        // Combined score: 70% success rate, 30% speed
        return (successRate * 0.7) + (timeScore * 0.3);
    });
    
    // Find proxy with highest combined score
    let bestIndex = 0;
    let bestScore = -1;
    
    for (let i = 0; i < proxyScores.length; i++) {
        if (proxyScores[i] > bestScore) {
            bestScore = proxyScores[i];
            bestIndex = i;
        }
    }
    
    return bestIndex;
}

// Improved fetch with proxy that uses parallel fetching with sequential fallback
async function fetchWithProxy(url, options = {}) {
    // Try direct fetch first with clean headers
    try {
        const directOptions = {
            ...options,
            credentials: 'omit',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Referer': 'https://www.imdb.com/',
                ...options.headers
            }
        };
        
        const startTime = Date.now();
        const response = await fetch(url, directOptions);
        const endTime = Date.now();
        
        if (response.ok) {
            console.log('✅ Direct fetch succeeded');
            return response;
        }
        console.log(`Direct fetch failed with status: ${response.status}`);
    } catch (error) {
        console.log('Direct fetch failed:', error.message);
    }
    
    // Enhanced parallel fetching implementation - try more proxies simultaneously
    const PARALLEL_PROXY_COUNT = 10; // Increased from 6 to 10 proxies in parallel
    const bestProxyIndex = selectBestProxy();
    
    // Create array of proxies to try in parallel (best proxy first, then others)
    const parallelProxies = [bestProxyIndex];
    for (let i = 0; i < CORS_PROXIES.length && parallelProxies.length < PARALLEL_PROXY_COUNT; i++) {
        if (!parallelProxies.includes(i)) {
            parallelProxies.push(i);
        }
    }
    
    console.log(`🔄 Trying ${parallelProxies.length} proxies in parallel`);
    
    // Create promises for all parallel proxy attempts
    const proxyPromises = parallelProxies.map(async (proxyIndex) => {
        const proxy = CORS_PROXIES[proxyIndex];
        const proxiedUrl = proxy + encodeURIComponent(url);
        
        try {
            console.log(`🔄 Trying proxy ${proxyIndex + 1}:`, proxy);
            
            const proxyOptions = {
                ...options,
                credentials: 'omit',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    ...options.headers
                }
            };
            
            const startTime = Date.now();
            const response = await fetch(proxiedUrl, proxyOptions);
            const endTime = Date.now();
            
            if (response.ok) {
                console.log(`✅ Success with proxy ${proxyIndex + 1}`);
                proxySuccessCount[proxyIndex]++;
                proxyResponseTimes[proxyIndex] += (endTime - startTime);
                currentProxyIndex = proxyIndex; // Remember working proxy
                return { response, proxyIndex };
            } else {
                console.log(`❌ Proxy ${proxyIndex + 1} failed with status: ${response.status}`);
                proxyFailCount[proxyIndex]++;
                proxyResponseTimes[proxyIndex] += (endTime - startTime);
                throw new Error(`Proxy ${proxyIndex + 1} failed with status: ${response.status}`);
            }
        } catch (error) {
            console.log(`❌ Proxy ${proxyIndex + 1} failed:`, error.message);
            proxyFailCount[proxyIndex]++;
            throw error;
        }
    });
    
    // Try parallel fetching first with Promise.allSettled for better error handling
    try {
        const results = await Promise.allSettled(proxyPromises);
        const successfulResult = results.find(result => result.status === 'fulfilled' && result.value);
        
        if (successfulResult) {
            console.log('✅ Parallel fetching succeeded');
            return successfulResult.value.response;
        }
        
        console.log('❌ All parallel proxies failed');
    } catch (error) {
        console.log('Parallel fetching failed:', error.message);
    }
    
    // Fallback to sequential fetching if parallel fails
    console.log('🔄 Falling back to sequential fetching');
    const proxyOrder = [bestProxyIndex];
    
    // Add other proxies in order
    for (let i = 0; i < CORS_PROXIES.length; i++) {
        if (i !== bestProxyIndex) {
            proxyOrder.push(i);
        }
    }
    
    // Try with CORS proxies in order of performance
    for (const proxyIndex of proxyOrder) {
        const proxy = CORS_PROXIES[proxyIndex];
        const proxiedUrl = proxy + encodeURIComponent(url);
        
        try {
            console.log(`🔄 Trying proxy ${proxyIndex + 1}:`, proxy);
            
            const proxyOptions = {
                ...options,
                credentials: 'omit',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    ...options.headers
                }
            };
            
            const startTime = Date.now();
            const response = await fetch(proxiedUrl, proxyOptions);
            const endTime = Date.now();
            
            if (response.ok) {
                console.log(`✅ Success with proxy ${proxyIndex + 1}`);
                proxySuccessCount[proxyIndex]++;
                proxyResponseTimes[proxyIndex] += (endTime - startTime);
                currentProxyIndex = proxyIndex; // Remember working proxy
                return response;
            } else {
                console.log(`❌ Proxy ${proxyIndex + 1} failed with status: ${response.status}`);
                proxyFailCount[proxyIndex]++;
                proxyResponseTimes[proxyIndex] += (endTime - startTime);
            }
        } catch (error) {
            console.log(`❌ Proxy ${proxyIndex + 1} failed:`, error.message);
            proxyFailCount[proxyIndex]++;
        }
    }
    
    // If all proxies fail, throw an error
    throw new Error('All proxy attempts failed');
}

// Track pagination for each section
const sectionPagination = {
    popular: { page: 1, items: [], hasMore: true, isLoading: false },
    latest: { page: 1, items: [], hasMore: true, isLoading: false },
    comingSoon: { page: 1, items: [], hasMore: true, isLoading: false }
};

// Rate limiting for API calls - increased to prevent server blocking
const API_RATE_LIMIT = 500; // milliseconds between calls - increased to 500ms to prevent 500 errors

// Rate limiting for API calls - increased to prevent server blocking
// const API_RATE_LIMIT = 500; // milliseconds between calls - increased to 500ms to prevent 500 errors

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function to fetch details for titles sequentially to prevent 500 errors
// Updated with progressive rendering support
// Now includes batch fetching with fallback
// AND Firebase caching to prevent API bans
// WITH deduplication to prevent duplicate movies
// ENHANCED with better proxy handling and timeout management
async function fetchDetailsSequentially(titles, typeFilter = null, container = null, progressive = false) {
    console.log('fetchDetailsSequentially called with:', {titles, container, progressive});
    const detailedItems = [];
    const processedIds = new Set(); // Track processed movie IDs to prevent duplicates
    
    // For genre view, don't limit to 5
    const limitedTitles = progressive ? titles : titles.slice(0, 5);
    console.log('Limited titles:', limitedTitles);
    
    // Try Firebase cache first
    try {
        const cachedItems = await getCachedItems(limitedTitles);
        console.log('Cached items result:', cachedItems);
        if (cachedItems && cachedItems.length > 0) {
            console.log(` Found ${cachedItems.length} items in cache`);
            
            // Process cached results and deduplicate
            console.log('Processing cached items:', cachedItems);
            for (let i = 0; i < cachedItems.length; i++) {
                const item = cachedItems[i];
                console.log('Processing cached item:', item);
                if (item && item.id && !processedIds.has(item.id)) {
                    processedIds.add(item.id);
                    detailedItems.push(item);
                    
                    // Progressive rendering: add card immediately if container provided
                    console.log('Checking progressive rendering condition:', {progressive, container});
                    if (progressive && container) {
                        console.log('Progressive rendering cached card:', item.title, 'to container:', container);
                        addCardToContainer(item, container);
                    } else {
                        console.log('Skipping progressive rendering for cached item:', item.title, {progressive, container});
                    }
                } else {
                    console.log('Skipping cached item:', item, 'already processed:', processedIds.has(item.id));
                }
            }
            
            // If we got all items from cache, still process them for progressive rendering
            if (cachedItems.length === limitedTitles.length) {
                console.log(`✅ All items served from cache, returning ${detailedItems.length} items`);
                return detailedItems;
            }
            
            // If partial cache, continue with remaining titles
            const cachedTitles = cachedItems.map(item => item.title);
            const remainingTitles = limitedTitles.filter(title => !cachedTitles.includes(title));
            if (remainingTitles.length > 0) {
                console.log(`📦 Cache partial: ${cachedItems.length} cached, ${remainingTitles.length} to fetch`);
                // Continue with batch/sequential for remaining titles
            } else {
                return detailedItems;
            }
        }
    } catch (cacheError) {
        console.log('Cache check failed:', cacheError.message);
    }
    
    // Try batch fetching first (faster!)
    try {
        console.log(`🚀 Trying batch fetch for ${limitedTitles.length} titles`);
        const batchResults = await fetchDetailsBatch(limitedTitles);
        console.log(`✅ Batch fetch successful: ${batchResults.length} items`);
        
        // Deduplicate batch results
        const uniqueBatchResults = batchResults.filter(item => {
            if (item && item.id && !processedIds.has(item.id)) {
                processedIds.add(item.id);
                return true;
            }
            return false;
        });
        
        // Cache the results
        try {
            await cacheItems(uniqueBatchResults);
        } catch (cacheError) {
            console.log('Caching failed:', cacheError.message);
        }
        
        // Process batch results
        for (let i = 0; i < uniqueBatchResults.length; i++) {
            const item = uniqueBatchResults[i];
            if (item) {
                detailedItems.push(item);
                
                // Progressive rendering: add card immediately if container provided
                if (progressive && container) {
                    console.log('Progressive rendering card:', item.title, 'to container:', container);
                    addCardToContainer(item, container);
                }
            }
        }
        
        return detailedItems;
    } catch (batchError) {
        console.warn('Batch fetch failed, falling back to sequential:', batchError.message);
        
        // Fallback to sequential fetching with improved error handling
        for (let i = 0; i < limitedTitles.length; i++) {
            const title = limitedTitles[i];
            try {
                // Add delay between requests but with exponential backoff
                if (i > 0) {
                    const delayTime = Math.min(API_RATE_LIMIT * Math.pow(1.5, i), 2000); // Max 2 seconds
                    await delay(delayTime);
                }
                
                // Search for title with timeout
                console.log(`Searching for: ${title}`);
                
                const searchUrl = `${API_BASE}/search?q=${encodeURIComponent(title)}`;
                const searchResponse = await Promise.race([
                    fetchWithProxy(searchUrl),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Search request timeout')), 15000)
                    )
                ]);
                
                if (!searchResponse.ok) {
                    console.error(`Search failed for ${title}: ${searchResponse.status}`);
                    continue;
                }
                
                const searchData = await searchResponse.json();
                
                if (searchData.ok && searchData.description && searchData.description.length > 0) {
                    const item = searchData.description[0];
                    const imdbId = item['#IMDB_ID'];
                    
                    if (!imdbId) {
                        console.error(`No IMDb ID for ${title}`);
                        continue;
                    }
                    
                    // Deduplication: skip if already processed
                    if (processedIds.has(imdbId)) {
                        console.log(`⏭️ Skipping duplicate: ${item['#TITLE']} (${imdbId})`);
                        continue;
                    }
                    
                    processedIds.add(imdbId);
                    
                    // Use search result data directly to minimize API calls
                    const detailedItem = {
                        id: imdbId,
                        title: item['#TITLE'] || 'Unknown Title',
                        year: item['#YEAR'] || 'N/A',
                        image: item['#IMG_POSTER'] || 'https://via.placeholder.com/300x450?text=No+Image',
                        type: item['#YEAR']?.toString().includes('–') ? 'tv' : 'movie',
                        actors: item['#ACTORS'] ? item['#ACTORS'].split(', ') : [],
                        rating: item['#RATING'] || 'N/A'
                    };
                    
                    detailedItems.push(detailedItem);
                    console.log(`Added: ${item['#TITLE']} (${imdbId})`);
                    
                    // Cache the item
                    try {
                        await cacheItem(detailedItem);
                    } catch (cacheError) {
                        console.log('Caching single item failed:', cacheError.message);
                    }
                    
                    // Progressive rendering: add card immediately if container provided
                    if (progressive && container) {
                        console.log('Progressive rendering sequential card:', detailedItem.title, 'to container:', container);
                        addCardToContainer(detailedItem, container);
                    }
                }
            } catch (error) {
                console.error(`Error processing ${title}:`, error);
                // Continue with next title instead of breaking
                continue;
            }
        }
    }
    
    return detailedItems;
}

// Lightweight caching using localStorage (placeholder for Firebase)
// In production, replace with Firebase Realtime Database

// Enhanced caching configuration
const CACHE_CONFIG = {
    DURATION: 2 * 60 * 60 * 1000, // 2 hours cache duration
    MAX_ENTRIES: 100, // Maximum number of cache entries
    PREFIX: 'movie_cache_'
};

// Replace localStorage-based caching with service worker caching
// Get cached items using localStorage (primary) with service worker fallback
// Enhanced with better cache management
async function getCachedItems(titles) {
    try {
        // First try localStorage (faster and more reliable)
        const cachedItems = await getCachedItemsFromLocalStorage(titles);
        if (cachedItems.length > 0) {
            return cachedItems;
        }
        
        // If nothing in localStorage, try service worker cache
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            return new Promise((resolve) => {
                const messageChannel = new MessageChannel();
                messageChannel.port1.onmessage = (event) => {
                    if (event.data && event.data.cachedItems) {
                        resolve(event.data.cachedItems);
                    } else {
                        resolve([]);
                    }
                };
                
                navigator.serviceWorker.controller.postMessage({
                    command: 'GET_CACHED_ITEMS',
                    titles: titles
                }, [messageChannel.port2]);
                
                // Timeout fallback
                setTimeout(() => resolve([]), 1000);
            });
        }
        
        return [];
    } catch (error) {
        console.log('Cache get failed:', error.message);
        return [];
    }
}

// Fallback to localStorage for backward compatibility
// Enhanced with better cache management
async function getCachedItemsFromLocalStorage(titles) {
    try {
        const cachedItems = [];
        const processedIds = new Set();
        
        // Clean up expired cache entries first
        cleanupCache();
        
        for (const title of titles) {
            const key = `${CACHE_CONFIG.PREFIX}${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
            const cached = localStorage.getItem(key);
            if (cached) {
                const item = JSON.parse(cached);
                // Check if cache is less than configured duration old
                if (Date.now() - item.timestamp < CACHE_CONFIG.DURATION) {
                    // Deduplication: skip if already processed
                    if (item.data && item.data.id && !processedIds.has(item.data.id)) {
                        processedIds.add(item.data.id);
                        cachedItems.push(item.data);
                    }
                } else {
                    // Expired, remove
                    localStorage.removeItem(key);
                }
            }
        }
        return cachedItems;
    } catch (error) {
        console.log('LocalStorage cache get failed:', error.message);
        return [];
    }
}

// Cache single item using localStorage (primary) with service worker fallback
// Enhanced with better cache management
async function cacheItem(item) {
    try {
        // First cache to localStorage (faster and more reliable)
        await cacheItemToLocalStorage(item);
        
        // Then try to cache to service worker
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                command: 'CACHE_ITEM',
                item: item
            });
        }
    } catch (error) {
        console.log('Cache item failed:', error.message);
        // Fallback to localStorage only
        cacheItemToLocalStorage(item);
    }
}

// Fallback to localStorage for backward compatibility
// Enhanced with better cache management
async function cacheItemToLocalStorage(item) {
    try {
        // Check cache size and remove oldest entries if necessary
        const cacheKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(CACHE_CONFIG.PREFIX)) {
                cacheKeys.push(key);
            }
        }
        
        if (cacheKeys.length >= CACHE_CONFIG.MAX_ENTRIES) {
            // Remove oldest entry
            let oldestKey = cacheKeys[0];
            let oldestTimestamp = Infinity;
            
            for (const key of cacheKeys) {
                const cached = localStorage.getItem(key);
                if (cached) {
                    const item = JSON.parse(cached);
                    if (item.timestamp < oldestTimestamp) {
                        oldestTimestamp = item.timestamp;
                        oldestKey = key;
                    }
                }
            }
            
            localStorage.removeItem(oldestKey);
            console.log(`🗑️ Removed oldest cache entry: ${oldestKey}`);
        }
        
        const key = `${CACHE_CONFIG.PREFIX}${item.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        const cacheData = {
            data: item,
            timestamp: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(cacheData));
        
        // Clean up old cache entries
        cleanupCache();
    } catch (error) {
        console.log('LocalStorage cache item failed:', error.message);
    }
}

// Cache multiple items using localStorage (primary) with service worker fallback
// Enhanced with better cache management
async function cacheItems(items) {
    try {
        // First cache to localStorage (faster and more reliable)
        await cacheItemsToLocalStorage(items);
        
        // Then try to cache to service worker
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                command: 'CACHE_ITEMS',
                items: items
            });
        }
    } catch (error) {
        console.log('Cache items failed:', error.message);
        // Fallback to localStorage only
        cacheItemsToLocalStorage(items);
    }
}

// Fallback to localStorage for backward compatibility
// Enhanced with better cache management
async function cacheItemsToLocalStorage(items) {
    try {
        for (const item of items) {
            await cacheItemToLocalStorage(item);
        }
    } catch (error) {
        console.log('LocalStorage cache items failed:', error.message);
    }
}

// Clean up old cache entries
// Enhanced with better cache management
function cleanupCache() {
    try {
        const now = Date.now();
        const cutoffTime = CACHE_CONFIG.DURATION;
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(CACHE_CONFIG.PREFIX)) {
                const cached = localStorage.getItem(key);
                if (cached) {
                    const item = JSON.parse(cached);
                    // Remove if older than configured duration
                    if (now - item.timestamp > cutoffTime) {
                        localStorage.removeItem(key);
                    }
                }
            }
        }
    } catch (error) {
        console.log('Cache cleanup failed:', error.message);
    }
}

// Batch fetch using powerful proxy (faster!) with improved error handling
async function fetchDetailsBatch(titles) {
    console.log(`📦 Batch fetching ${titles.length} titles`);
    
    // Select the best performing proxy based on historical data
    const bestProxyIndex = selectBestProxy();
    const proxyOrder = [bestProxyIndex];
    
    // Add other proxies in order
    for (let i = 0; i < CORS_PROXIES.length; i++) {
        if (i !== bestProxyIndex) {
            proxyOrder.push(i);
        }
    }
    
    // Try different proxies for batch request in order of performance
    for (const proxyIndex of proxyOrder) {
        const proxy = CORS_PROXIES[proxyIndex];
        
        try {
            console.log(`🔄 Trying batch with proxy ${proxyIndex + 1}:`, proxy);
            
            // Create batch request URLs with better error handling
            const urls = titles.map(title => {
                const searchUrl = `${API_BASE}/search?q=${encodeURIComponent(title)}`;
                return `${proxy}${encodeURIComponent(searchUrl)}`;
            }).filter(url => url && url.length > proxy.length + 50); // Filter out malformed/empty URLs
            
            // Skip if no valid URLs
            if (urls.length === 0) {
                console.log('⏭️ No valid URLs to fetch, skipping proxy');
                proxyFailCount[proxyIndex]++;
                continue;
            }
            
            // Fetch all URLs in parallel with timeout
            const promises = urls.map(url => 
                Promise.race([
                    fetch(url, { 
                        method: 'GET',
                        credentials: 'omit',
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                            'Accept': 'application/json, text/plain, */*'
                        }
                    }).catch(err => {
                        console.log(`Individual fetch failed: ${err.message}`);
                        return null;
                    }),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Request timeout')), 10000)
                    )
                ])
            );
            
            const responses = await Promise.all(promises);
            console.log(`📡 Received ${responses.filter(r => r && r.ok).length}/${responses.length} responses`);
            
            // Process responses
            const results = [];
            for (let i = 0; i < responses.length; i++) {
                const response = responses[i];
                if (response && response.ok) {
                    try {
                        const data = await response.json();
                        if (data.ok && data.description && data.description.length > 0) {
                            const item = data.description[0];
                            const imdbId = item['#IMDB_ID'];
                            
                            if (imdbId) {
                                results.push({
                                    id: imdbId,
                                    title: item['#TITLE'] || 'Unknown Title',
                                    year: item['#YEAR'] || 'N/A',
                                    image: item['#IMG_POSTER'] || 'https://via.placeholder.com/300x450?text=No+Image',
                                    type: item['#YEAR']?.toString().includes('–') ? 'tv' : 'movie',
                                    actors: item['#ACTORS'] ? item['#ACTORS'].split(', ') : [],
                                    rating: item['#RATING'] || 'N/A'
                                });
                                console.log(`📦 Batch added: ${item['#TITLE']} (${imdbId})`);
                            }
                        }
                    } catch (parseError) {
                        console.log(`Parse error for response ${i}:`, parseError.message);
                    }
                }
            }
            
            // Update proxy performance metrics
            if (results.length > 0) {
                proxySuccessCount[proxyIndex]++;
                console.log(`✅ Batch fetch complete: ${results.length}/${titles.length} items`);
                return results;
            } else {
                proxyFailCount[proxyIndex]++;
                console.log(`⚠️ Batch fetch with proxy ${proxyIndex + 1} returned no valid results`);
            }
            
        } catch (error) {
            console.log(`Proxy ${proxyIndex + 1} batch failed:`, error.message);
            proxyFailCount[proxyIndex]++;
            continue;
        }
    }
    
    throw new Error('All batch proxies failed');
}

// Add single card to container (for progressive loading)
function addCardToContainer(item, containerId) {
    console.log('Adding card to container:', containerId, item);
    const container = document.getElementById(containerId);
    if (!container) {
        console.log('Container not found:', containerId);
        return;
    }
    
    console.log('Container found, adding card');
    const contentCard = document.createElement('div');
    contentCard.className = 'bg-secondary rounded-lg overflow-hidden hover:shadow-xl transition duration-300 cursor-pointer transform hover:-translate-y-1';
    
    // Build the HTML with additional information
    let additionalInfo = '';
    if (item.type) {
        additionalInfo += `<span class="inline-block bg-accent text-primary text-xs px-1 py-0.5 rounded mr-1 mt-1">${item.type}</span>`;
    }
    if (item.rating && item.rating !== 'N/A') {
        additionalInfo += `<span class="inline-block bg-gray-700 text-white text-xs px-1 py-0.5 rounded mr-1 mt-1">${item.rating}</span>`;
    }
    
    // Add actors if available
    let actorsInfo = '';
    if (item.actors && item.actors.length > 0) {
        const actors = item.actors.slice(0, 3).join(', ');
        actorsInfo = `<p class="text-gray-300 text-xs mt-1 truncate">${actors}</p>`;
    }
    
    const linkUrl = `details.html?id=${item.id}&title=${encodeURIComponent(item.title || 'Unknown Title')}`;
    
    contentCard.innerHTML = `
        <img src="${item.image}" alt="${item.title}" class="w-full h-48 object-cover" loading="lazy">
        <div class="p-3">
            <h4 class="font-bold text-sm mb-1 truncate">${item.title || 'Unknown Title'}</h4>
            <p class="text-gray-400 text-xs">${item.year || 'N/A'}</p>
            ${additionalInfo}
            ${actorsInfo}
        </div>
    `;
    
    contentCard.addEventListener('click', () => {
        window.location.href = linkUrl;
    });
    
    container.appendChild(contentCard);
    console.log('Card added successfully to:', containerId);
}

// Search movies using the API
async function searchMovies() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;
    
    // Redirect to search.html with the query parameter
    window.location.href = `search.html?q=${encodeURIComponent(query)}`;
}

// DOM loaded event
document.addEventListener('DOMContentLoaded', async function() {
    // Test scraper API
    try {
        const scraperResponse = await fetch('https://web-1-production.up.railway.app/top');
        const scraperData = await scraperResponse.json();
        console.log('Scraper API test result:', scraperData);
        
        const movieResponse = await fetch('https://imdb.iamidiotareyoutoo.com/search?q=The Shawshank Redemption');
        const movieData = await movieResponse.json();
        console.log('Movie API test result:', movieData);
    } catch (error) {
        console.error('API test error:', error);
    }
    
    // Start scraping movie data for homepage
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
    scrapeMovieData();
}
    
    // Add search event listeners
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchMovies();
            }
        });
    }
    
    const searchButton = document.getElementById('searchButton');
    if (searchButton) {
        searchButton.addEventListener('click', searchMovies);
    }
    
    // Add back to welcome button listener
    const backToWelcomeButton = document.getElementById('backToWelcome');
    if (backToWelcomeButton) {
        backToWelcomeButton.addEventListener('click', showWelcomeSection);
    }
    
    // Add keyboard navigation
    document.addEventListener('keydown', function(e) {
        // ESC key to close modals
        if (e.key === 'Escape') {
            hideMediaCarousel();
        }
        
        // Left/Right arrows for carousel navigation
        if (document.getElementById('mediaCarousel') && document.getElementById('mediaCarousel').style.display !== 'none') {
            if (e.key === 'ArrowLeft') {
                showPrevMedia();
            } else if (e.key === 'ArrowRight') {
                showNextMedia();
            }
        }
    });
    
    // Apply ad-blocking enhancements
    applyAdBlockingEnhancements();
    
    // Add scroll event listener for pagination
    window.addEventListener('scroll', handleScroll);
    

    
    // ===== GENRE FILTER FUNCTIONALITY =====
    console.log('🎭 Setting up genre filters...');
    const genrePills = document.querySelectorAll('.genre-pill');
    console.log('Found', genrePills.length, 'genre pills');
    
    genrePills.forEach(pill => {
        pill.addEventListener('click', function() {
            const selectedGenre = this.getAttribute('data-genre');
            console.log('🎬 Genre pill clicked:', selectedGenre);
            
            // Update active state
            genrePills.forEach(p => {
                p.classList.remove('active', 'bg-accent', 'text-primary');
                p.classList.add('bg-secondary', 'text-gray-300');
            });
            this.classList.add('active');
            this.classList.remove('bg-secondary', 'text-gray-300');
            this.classList.add('bg-accent', 'text-primary');
            
            // Call scrapeMovieData with selected genre
            console.log('🔄 Calling scrapeMovieData with genre:', selectedGenre);
            scrapeMovieData(selectedGenre);
        });
    });
    
    // Log initial proxy stats
    console.log('Intialized proxy system with', CORS_PROXIES.length, 'proxies');
    displayProxyStats();
    
    // Ensure marquee is visible
    const marquee = document.querySelector('.animate-marquee');
    if (marquee) {
        const marqueeContainer = marquee.closest('div');
        if (marqueeContainer) {
            marqueeContainer.style.display = 'block';
        }
    }
    
    // Initialize sitemap generator
    initializeSitemapGenerator();
});

// Handle scroll for pagination
function handleScroll() {
    // Check if user has scrolled to bottom of page
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 1000) {
        loadMoreContent();
    }
}

// Load more content for pagination
function loadMoreContent() {
    // This would be implemented to load more content when user scrolls
    // For now, we'll just log that we've reached the bottom
    console.log('Reached bottom of page - would load more content here');
}

// Search movies using the API
async function searchMovies() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;
    
    // Redirect to search.html with the query parameter
    window.location.href = `search.html?q=${encodeURIComponent(query)}`;
}

// Display search results (this function will be used in search.html)
function displaySearchResults(movies) {
    const resultsContainer = document.getElementById('resultsContainer');
    if (!resultsContainer) return;
    
    if (!movies || movies.length === 0) {
        resultsContainer.innerHTML = '<p class="text-center col-span-full">No movies found</p>';
        return;
    }
    
    resultsContainer.innerHTML = movies.map(movie => {
        // Provide fallback values for all fields
        const title = movie['#TITLE'] || 'Unknown Title';
        const year = movie['#YEAR'] || 'N/A';
        const rating = movie['#RATING'] || 'N/A';
        const genres = movie['#GENRES'] || 'N/A';
        const imdbId = movie['#IMDB_ID'] || 'N/A';
        const poster = movie['#IMG_POSTER'] || 'https://via.placeholder.com/300x450?text=No+Image';
        const actors = movie['#ACTORS'] || '';
        
        // Build additional info tags
        let additionalInfo = '';
        if (rating !== 'N/A') {
            additionalInfo += `<span class="inline-block bg-gray-700 text-white text-xs px-1 py-0.5 rounded mr-1 mt-1">${rating}</span>`;
        }
        if (genres !== 'N/A') {
            additionalInfo += `<span class="inline-block bg-accent text-primary text-xs px-1 py-0.5 rounded mr-1 mt-1">${genres.split(', ')[0]}</span>`;
        }
        
        // Add actors if available
        let actorsInfo = '';
        if (actors) {
            const actorsList = actors.split(', ').slice(0, 3).join(', ');
            actorsInfo = `<p class="text-gray-300 text-xs mt-1 truncate">${actorsList}</p>`;
        }
        
        return `
        <div class="movie-card" 
             onclick="window.location.href='details.html?id=${imdbId}&title=${encodeURIComponent(title)}'">
            <img src="${poster}" alt="${title}" class="w-full h-72 object-cover" loading="lazy" style="aspect-ratio: 2/3;">
            <div class="p-3">
                <h3 class="font-bold text-sm mb-1 truncate">${title}</h3>
                <p class="text-gray-400 text-xs">${year}</p>
                ${additionalInfo}
                ${actorsInfo}
            </div>
        </div>
    `}).join('');
}

// Fetch movie details
async function fetchMovieDetails(movieId) {
    if (!movieId) return;
    
    try {
        // Show loading indicator
        const movieDetails = document.getElementById('movieDetails');
        if (movieDetails) {
            movieDetails.innerHTML = '<div class="container mx-auto px-4 py-8"><p class="text-center">Loading...</p></div>';
            movieDetails.style.display = 'block';
        }
        
        document.getElementById('searchResults').style.display = 'none';
        document.getElementById('welcomeSection').style.display = 'none';
        
        // Fetch detailed movie information
        const response = await fetchWithProxy(`${API_BASE}/search?tt=${movieId}`);
        const data = await response.json();
        
        if (data.ok) {
            displayMovieDetails(data.short, movieId, data);
        } else {
            if (movieDetails) {
                movieDetails.innerHTML = '<div class="container mx-auto px-4 py-8"><p class="text-center text-red-500">Movie not found</p></div>';
            }
        }
    } catch (error) {
        console.error('Error fetching movie details:', error);
        const movieDetails = document.getElementById('movieDetails');
        if (movieDetails) {
            movieDetails.innerHTML = '<div class="container mx-auto px-4 py-8"><p class="text-center text-red-500">Failed to load movie details</p></div>';
        }
    }
}

// Display movie details
function displayMovieDetails(movie, movieId, fullData) {
    if (!movie) return;
    
    // Extract key information
    const title = movie['#TITLE'] || 'N/A';
    const year = movie['#YEAR'] || 'N/A';
    const rating = movie['#RATING'] || 'N/A';
    const duration = movie['#TIME'] || 'N/A';
    const genres = movie['#GENRES'] || 'N/A';
    const plot = movie['#PLOT'] || 'No plot available';
    const poster = movie['#IMG_POSTER'] || 'https://via.placeholder.com/300x450?text=No+Image';
    const type = movie['@type'] || 'Movie';
    const imdbId = movieId || 'N/A';
    
    // Format duration
    const formattedDuration = formatDuration(duration);
    
    // Update the HTML elements directly with safety checks
    const movieTitle = document.getElementById('movieTitle');
    if (movieTitle) movieTitle.textContent = title;
    
    const movieYear = document.getElementById('movieYear');
    if (movieYear) movieYear.textContent = year;
    
    const movieRating = document.getElementById('movieRating');
    if (movieRating) movieRating.textContent = rating;
    
    const movieDuration = document.getElementById('movieDuration');
    if (movieDuration) movieDuration.textContent = formattedDuration;
    
    const movieGenres = document.getElementById('movieGenres');
    if (movieGenres) movieGenres.textContent = genres;
    
    const movieImdbId = document.getElementById('movieImdbId');
    if (movieImdbId) movieImdbId.textContent = imdbId;
    
    const movieType = document.getElementById('movieType');
    if (movieType) movieType.textContent = type === 'TVSeries' ? 'TV Series' : 'Movie';
    
    const moviePoster = document.getElementById('moviePoster');
    if (moviePoster) {
        moviePoster.src = poster;
        moviePoster.alt = title;
    }
    
    const moviePlot = document.getElementById('moviePlot');
    if (moviePlot) moviePlot.textContent = plot;

    // Set streaming iframe source
    const streamingIframe = document.getElementById('streamingIframe');
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (streamingIframe && imdbId !== 'N/A') {
        const streamUrl = `${SCRAPER_API_BASE}/embed/${imdbId}${type === 'TVSeries' ? '?s=1&e=1' : ''}`; // Default to season 1, episode 1 for TV series
        streamingIframe.src = streamUrl;
        console.log('Streaming iframe src set to:', streamUrl);
        // Hide loading overlay once iframe src is set
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
    } else if (loadingOverlay) {
        // If no stream available or imdbId is N/A, hide loader and show error
        loadingOverlay.innerHTML = '<div class="text-center"><p class="text-red-500 font-medium text-sm md:text-base">No stream available for this content.</p></div>';
        loadingOverlay.classList.remove('hidden');
    }
    
    // Update cast information
    const movieCast = document.getElementById('movieCast');
    if (movieCast && fullData.cast) {
        let castHTML = '';
        if (fullData.cast.star) {
            fullData.cast.star.slice(0, 5).forEach(actor => {
                castHTML += `<div class="flex items-center mb-2">
                    <img src="${actor['#IMG'] || 'https://via.placeholder.com/50x75?text=No+Image'}" alt="${actor['#NAME'] || 'Unknown Actor'}" class="w-10 h-12 object-cover rounded mr-2">
                    <div>
                        <p class="font-medium">${actor['#NAME'] || 'Unknown Actor'}</p>
                        <p class="text-sm text-gray-400">${actor['#CHARACTER'] || 'Unknown Role'}</p>
                    </div>
                </div>`;
            });
        }
        movieCast.innerHTML = castHTML;
    }
    
    // Update crew information
    const movieCrew = document.getElementById('movieCrew');
    if (movieCrew && fullData.crew) {
        let crewHTML = '';
        if (fullData.crew.director) {
            const directors = fullData.crew.director.map(d => d['#NAME']).join(', ');
            crewHTML += `<li class="flex">
                <span class="font-semibold w-24">Director:</span>
                <span>${directors}</span>
            </li>`;
        }
        if (fullData.crew.writer) {
            const writers = fullData.crew.writer.map(w => w['#NAME']).join(', ');
            crewHTML += `<li class="flex">
                <span class="font-semibold w-24">Writers:</span>
                <span>${writers}</span>
            </li>`;
        }
        movieCrew.innerHTML = crewHTML;
    }
    
    // Update keywords
    const movieKeywords = document.getElementById('movieKeywords');
    if (movieKeywords && fullData.keywords && fullData.keywords.results) {
        let keywordsHTML = '';
        fullData.keywords.results.slice(0, 10).forEach(keyword => {
            keywordsHTML += `<span class="bg-gray-700 text-white text-xs px-2 py-1 rounded mr-2 mb-2 inline-block">${keyword['#TITLE']}</span>`;
        });
        movieKeywords.innerHTML = keywordsHTML;
    }
    
    // Show the movie details section
    const movieDetails = document.getElementById('movieDetails');
    const searchResults = document.getElementById('searchResults');
    const welcomeSection = document.getElementById('welcomeSection');
    
    if (movieDetails) movieDetails.style.display = 'block';
    if (searchResults) searchResults.style.display = 'none';
    if (welcomeSection) welcomeSection.style.display = 'none';
    
    // Add event listeners for buttons
    const backButton = document.getElementById('backButton');
    if (backButton) backButton.onclick = showSearchResults;
    
    const trailerButton = document.getElementById('trailerButton');
    if (trailerButton) {
        trailerButton.onclick = function() {
            if (fullData.media && fullData.media.trailers && fullData.media.trailers.results) {
                showMediaCarousel(fullData.media.trailers.results, 0, 'Trailers');
            }
        };
    }
    
    const photosButton = document.getElementById('photosButton');
    if (photosButton) {
        photosButton.onclick = function() {
            if (fullData.media && fullData.media.photos && fullData.media.photos.results) {
                showMediaCarousel(fullData.media.photos.results, 0, 'Photos');
            }
        };
    }
    
    const streamButton = document.getElementById('streamButton');
    if (streamButton) {
        streamButton.onclick = function() {
            showStreaming(movieId);
        };
    }
    
    // Load additional content
    displayAdditionalMedia(fullData);
    displayCastImages(extractCastWithImages(fullData));
    
    // Update type badge
    updateTypeBadge(movieId);
}

// Extract cast with images
function extractCastWithImages(fullData) {
    if (!fullData || !fullData.cast) return [];
    
    const cast = fullData.cast;
    const castWithImages = [];
    
    // Process main cast
    if (cast.star) {
        cast.star.forEach(actor => {
            castWithImages.push({
                name: actor['#NAME'] || 'Unknown',
                character: actor['#CHARACTER'] || 'Unknown Role',
                image: actor['#IMG'] || 'https://via.placeholder.com/100x150?text=No+Image'
            });
        });
    }
    
    // Process other cast members
    if (cast.others && cast.others['#CAST']) {
        cast.others['#CAST'].forEach(actor => {
            castWithImages.push({
                name: actor['#NAME'] || 'Unknown',
                character: actor['#CHARACTER'] || 'Unknown Role',
                image: actor['#IMG'] || 'https://via.placeholder.com/100x150?text=No+Image'
            });
        });
    }
    
    return castWithImages;
}

// Display additional media (trailers and photos)
function displayAdditionalMedia(fullData) {
    if (!fullData || !fullData.media) return;
    
    const media = fullData.media;
    window.trailers = media.trailers || [];
    window.photos = media.photos || [];
}

// Display cast information
function displayCastInfo(cast) {
    const castList = document.getElementById('castList');
    if (!castList) return;
    
    if (!cast || !cast.cast) {
        castList.innerHTML = '<p>No cast information available</p>';
        return;
    }
    
    let castHTML = '';
    
    // Main cast (stars)
    if (cast.cast.star && cast.cast.star.length > 0) {
        castHTML += '<h3 class="font-bold mb-2">Main Cast</h3>';
        cast.cast.star.forEach(actor => {
            castHTML += `
                <div class="flex items-center p-2 bg-gray-800 rounded">
                    <img src="${actor['#IMG'] || 'https://via.placeholder.com/50x75?text=No+Image'}" 
                         alt="${actor['#NAME'] || 'Unknown Actor'}" 
                         class="w-12 h-16 object-cover rounded mr-3">
                    <div>
                        <p class="font-semibold">${actor['#NAME'] || 'Unknown Actor'}</p>
                        <p class="text-sm text-gray-400">${actor['#CHARACTER'] || 'Unknown Role'}</p>
                    </div>
                </div>
            `;
        });
    }
    
    // Other cast members
    if (cast.cast.others && cast.cast.others['#CAST'] && cast.cast.others['#CAST'].length > 0) {
        castHTML += '<h3 class="font-bold mb-2 mt-4">Additional Cast</h3>';
        cast.cast.others['#CAST'].slice(0, 10).forEach(actor => {
            castHTML += `
                <div class="flex items-center p-2 bg-gray-800 rounded">
                    <img src="${actor['#IMG'] || 'https://via.placeholder.com/50x75?text=No+Image'}" 
                         alt="${actor['#NAME'] || 'Unknown Actor'}" 
                         class="w-12 h-16 object-cover rounded mr-3">
                    <div>
                        <p class="font-semibold">${actor['#NAME'] || 'Unknown Actor'}</p>
                        <p class="text-sm text-gray-400">${actor['#CHARACTER'] || 'Unknown Role'}</p>
                    </div>
                </div>
            `;
        });
    }
    
    if (!castHTML) {
        castList.innerHTML = '<p>No cast information available</p>';
    } else {
        castList.innerHTML = castHTML;
    }
}

// Display cast images
function displayCastImages(castWithImages) {
    // This function is called but the display is handled by displayCastInfo
    // We could enhance this to show a carousel of cast images if needed
}

// Display crew information
function displayCrewInfo(fullData) {
    const crew = extractCrewInformation(fullData);
    // This would be used if we want to display crew information separately
}

// Extract crew information
function extractCrewInformation(fullData) {
    if (!fullData || !fullData.crew) return {};
    
    const crew = fullData.crew;
    const crewInfo = {};
    
    // Director
    if (crew.director) {
        crewInfo.director = crew.director.map(d => d['#NAME']).join(', ');
    }
    
    // Writers
    if (crew.writer) {
        crewInfo.writers = crew.writer.map(w => w['#NAME']).join(', ');
    }
    
    return crewInfo;
}

// Format duration
function formatDuration(duration) {
    if (!duration || duration === 'N/A') return 'N/A';
    
    // If it's already formatted (e.g., "2h 12m")
    if (duration.includes('h') || duration.includes('m')) {
        return duration;
    }
    
    // If it's in minutes, convert to hours and minutes
    const minutes = parseInt(duration);
    if (isNaN(minutes)) return duration;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
        return `${hours}h ${remainingMinutes}m`;
    } else {
        return `${remainingMinutes}m`;
    }
}

// Display keywords
function displayKeywords(keywords) {
    // This would be used if we want to display keywords/tags
}

// Display reviews
function displayReviews(fullData) {
    // This would be used if we want to display user reviews
}

// Display additional information
function displayAdditionalInfo(fullData) {
    const additionalInfo = document.getElementById('additionalInfo');
    if (!additionalInfo) return;
    
    if (!fullData) {
        additionalInfo.innerHTML = '<p>No additional information available</p>';
        return;
    }
    
    let infoHTML = '';
    
    // Director
    if (fullData.director) {
        const directors = fullData.director.map(d => d['#NAME']).join(', ');
        infoHTML += `
            <div>
                <h3 class="font-bold mb-1">Director</h3>
                <p class="text-gray-300">${directors}</p>
            </div>
        `;
    }
    
    // Writers
    if (fullData.writer) {
        const writers = fullData.writer.map(w => w['#NAME']).join(', ');
        infoHTML += `
            <div>
                <h3 class="font-bold mb-1">Writers</h3>
                <p class="text-gray-300">${writers}</p>
            </div>
        `;
    }
    
    // Box office information
    displayBoxOfficeInfo(fullData);
    
    if (!infoHTML) {
        additionalInfo.innerHTML = '<p>No additional information available</p>';
    } else {
        additionalInfo.innerHTML = infoHTML;
    }
}

// Display box office information
function displayBoxOfficeInfo(fullData) {
    // This would be used if we want to display box office data
}

// Show trailer carousel
function showTrailerCarousel() {
    if (!window.trailers || window.trailers.length === 0) {
        alert('No trailers available');
        return;
    }
    
    showMediaCarousel(window.trailers, 0, 'Trailers');
}

// Show photos carousel
function showPhotosCarousel() {
    if (!window.photos || window.photos.length === 0) {
        alert('No photos available');
        return;
    }
    
    showMediaCarousel(window.photos, 0, 'Photos');
}

// Show streaming
function showStreaming(imdbId) {
    if (!imdbId) {
        alert('Invalid movie ID');
        return;
    }
    
    // Check if this is a TV series or movie by fetching the type
    fetch(`${API_BASE}/search?tt=${imdbId}`)
        .then(response => response.json())
        .then(data => {
            if (data.ok && data.short) {
                const type = data.short['@type'];
                if (type === 'TVSeries') {
                    // For TV series, show episode selection
                    showEpisodeSelection(imdbId);
                } else {
                    // For movies, go directly to streaming
                    window.open(`https://vidsrc-embed.ru/embed/movie/${imdbId}`, '_blank');
                }
            } else {
                // Default to movie streaming if we can't determine the type
                window.open(`https://vidsrc-embed.ru/embed/movie/${imdbId}`, '_blank');
            }
        })
        .catch(error => {
            console.error('Error checking content type:', error);
            // Default to movie streaming if there's an error
            window.open(`https://vidsrc-embed.ru/embed/movie/${imdbId}`, '_blank');
        });
}

// Show episode selection for TV series
function showEpisodeSelection(imdbId) {
    // Redirect to the TV show embed page which handles episode selection
    window.open(`https://vidsrc-embed.ru/embed/tv/${imdbId}`, '_blank');
}

// Show media carousel
function showMediaCarousel(mediaItems, startIndex, title) {
    window.currentMediaItems = mediaItems;
    window.currentMediaIndex = startIndex;
    window.currentMediaTitle = title;
    
    const carousel = document.getElementById('mediaCarousel');
    if (!carousel) return;
    
    updateCarousel();
    carousel.style.display = 'flex';
}

// Update carousel
function updateCarousel() {
    const carousel = document.getElementById('mediaCarousel');
    if (!carousel || !window.currentMediaItems) return;
    
    const currentItem = window.currentMediaItems[window.currentMediaIndex];
    const title = window.currentMediaTitle;
    
    if (currentItem['#CAPTION']) {
        // Photo
        carousel.innerHTML = `
            <button onclick="hideMediaCarousel()" class="absolute top-4 right-4 text-white text-2xl z-10 bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75 transition md:w-12 md:h-12">
                <i class="fas fa-times"></i>
            </button>
            <button onclick="showPrevMedia()" class="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-2xl z-10 bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center hover:bg-opacity-75 transition md:w-14 md:h-14">
                <i class="fas fa-chevron-left"></i>
            </button>
            <button onclick="showNextMedia()" class="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-2xl z-10 bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center hover:bg-opacity-75 transition md:w-14 md:h-14">
                <i class="fas fa-chevron-right"></i>
            </button>
            <div class="text-center w-full h-full flex flex-col">
                <h2 class="text-2xl font-bold mb-4">${title}</h2>
                <div class="w-full flex-grow flex items-center justify-center px-2">
                    <img src="${currentItem['#IMG']}" alt="Media" class="max-w-full max-h-full object-contain rounded-lg shadow-2xl">
                </div>
                <div class="mt-4">
                    <p class="text-white text-base md:text-lg">${currentItem['#CAPTION']}</p>
                    <p class="text-gray-400 text-sm mt-2">${window.currentMediaIndex + 1} of ${window.currentMediaItems.length}</p>
                </div>
            </div>
        `;
    } else if (currentItem['#SRC']) {
        // Trailer
        carousel.innerHTML = `
            <button onclick="hideMediaCarousel()" class="absolute top-4 right-4 text-white text-2xl z-10 bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75 transition md:w-12 md:h-12">
                <i class="fas fa-times"></i>
            </button>
            <button onclick="showPrevMedia()" class="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-2xl z-10 bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center hover:bg-opacity-75 transition md:w-14 md:h-14">
                <i class="fas fa-chevron-left"></i>
            </button>
            <button onclick="showNextMedia()" class="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-2xl z-10 bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center hover:bg-opacity-75 transition md:w-14 md:h-14">
                <i class="fas fa-chevron-right"></i>
            </button>
            <div class="text-center w-full h-full flex flex-col">
                <h2 class="text-2xl font-bold mb-4">${title}</h2>
                <div class="w-full flex-grow flex items-center justify-center px-2">
                    <iframe src="${currentItem['#SRC']}" class="w-full h-full max-w-4xl rounded-lg shadow-2xl" frameborder="0" allowfullscreen></iframe>
                </div>
                <div class="mt-4">
                    <p class="text-white text-base md:text-lg">${currentItem['#NAME'] || 'Trailer'}</p>
                    <p class="text-gray-400 text-sm mt-2">${window.currentMediaIndex + 1} of ${window.currentMediaItems.length}</p>
                </div>
            </div>
        `;
    }
}

// Show previous media
function showPrevMedia() {
    if (!window.currentMediaItems) return;
    
    window.currentMediaIndex = (window.currentMediaIndex - 1 + window.currentMediaItems.length) % window.currentMediaItems.length;
    updateCarousel();
}

// Show next media
function showNextMedia() {
    if (!window.currentMediaItems) return;
    
    window.currentMediaIndex = (window.currentMediaIndex + 1) % window.currentMediaItems.length;
    updateCarousel();
}

// Hide media carousel
function hideMediaCarousel() {
    const carousel = document.getElementById('mediaCarousel');
    if (carousel) {
        carousel.style.display = 'none';
    }
    window.currentMediaItems = null;
    window.currentMediaIndex = 0;
    window.currentMediaTitle = '';
}

// Show search results
function showSearchResults() {
    document.getElementById('movieDetails').style.display = 'none';
    document.getElementById('searchResults').style.display = 'block';
    document.getElementById('welcomeSection').style.display = 'none';
}

// Show welcome section
function showWelcomeSection() {
    document.getElementById('movieDetails').style.display = 'none';
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('welcomeSection').style.display = 'block';
}

// Apply ad-blocking enhancements
function applyAdBlockingEnhancements() {
    // Remove common ad containers
    const adSelectors = [
        'iframe[src*="ads"]',
        'div[class*="ad"]',
        'div[id*="ad"]',
        '.advertisement',
        '.sponsor',
        '[class*="popup"]',
        '[id*="popup"]'
    ];
    
    adSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            element.style.display = 'none';
        });
    });
    
    // Block common ad scripts
    const adScripts = document.querySelectorAll('script[src*="ads"], script[src*="doubleclick"], script[src*="googlesyndication"]');
    adScripts.forEach(script => {
        script.remove();
    });
}

// Web scraper for fetching movie and TV show data
async function scrapeMovieData(genre = null) {
    try {
        console.log('🎬 scrapeMovieData called with genre:', genre);
        
        // Show loading indicators
        const containers = [
            'popularContainer', 
            'latestContainer',
            'comingSoonContainer'
        ];
        
        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div class="flex flex-col items-center justify-center py-12 col-span-full">
                        <i class="fas fa-spinner fa-spin text-3xl text-accent mb-4"></i>
                        <p class="text-gray-400">Loading content...</p>
                    </div>
                `;
            }
        });
        
        // If genre is selected, fetch genre-specific content
        if (genre && genre !== 'all') {
            console.log('✅ Calling scrapeByGenre for:', genre);
            await scrapeByGenre(genre);
            return; // IMPORTANT: Stop here, don't continue to popular/latest/upcoming
        }
        
        // Restore section headers for "All" view
        showSectionHeaders();
        
        console.log('📺 Fetching all content (no genre filter)');
        
        // Fetch all data in parallel to improve performance
        const [
            popularResult,
            latestResult,
            comingSoonResult
        ] = await Promise.allSettled([
            scrapePopular(),
            scrapeLatest(),
            scrapeComingSoon()
        ]);
        
        console.log('All scraping results:', {
            popularResult,
            latestResult,
            comingSoonResult
        });
        
        // Check if any results were successful and display them
        if (popularResult.status === 'fulfilled' && popularResult.value) {
            console.log('Displaying popular content:', popularResult.value.length, 'items');
            displayPopularContent(popularResult.value, 'popularContainer');
        }
        
        if (latestResult.status === 'fulfilled' && latestResult.value) {
            console.log('Displaying latest content:', latestResult.value.length, 'items');
            displayPopularContent(latestResult.value, 'latestContainer');
        }
        
        if (comingSoonResult.status === 'fulfilled' && comingSoonResult.value) {
            console.log('Displaying coming soon content:', comingSoonResult.value.length, 'items');
            displayPopularContent(comingSoonResult.value, 'comingSoonContainer');
        }
        
        console.log('Finished progressive loading all content');
    } catch (error) {
        console.error('Error in web scraper:', error);
        
        // Show error message instead of fallback content
        const containers = [
            'popularContainer', 
            'latestContainer',
            'comingSoonContainer'
        ];
        
        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div class="flex flex-col items-center justify-center py-12 col-span-full">
                        <i class="fas fa-exclamation-triangle text-3xl text-red-500 mb-4"></i>
                        <p class="text-red-500">Failed to load content</p>
                        <p class="text-gray-400 text-sm mt-2">Please try again later</p>
                    </div>
                `;
            }
        });
    }
}

// Scrape content by genre
async function scrapeByGenre(genre) {
    try {
        console.log(`🎭 SCRAPING BY GENRE: ${genre}`);
        
        // Map frontend genre names to API genre names
        const genreMap = {
            'action': 'action',
            'comedy': 'comedy',
            'drama': 'drama',
            'horror': 'horror',
            'sci-fi': 'sci_fi',  // API uses underscore
            'thriller': 'thriller',
            'romance': 'romance',
            'animation': 'animation'
        };
        
        const apiGenre = genreMap[genre] || genre;
        const apiUrl = `${SCRAPER_API_BASE}/by_genre/${apiGenre}`;
        console.log(`Using primary scraper API: ${SCRAPER_API_BASE}`);
        
        console.log(`🔗 Fetching from: ${apiUrl}`);
        
        let response = await fetch(apiUrl);
        
        // If primary API fails, try fallback
        if (!response.ok) {
            console.log(`Primary API failed with status ${response.status}, trying fallback API: ${FALLBACK_SCRAPER_API_BASE}`);
            const fallbackUrl = `${FALLBACK_SCRAPER_API_BASE}/by_genre/${apiGenre}`;
            response = await fetch(fallbackUrl);
        }
        
        if (!response.ok) {
            throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`✅ API Response for ${genre}:`, data);
        console.log(`📦 Items received: ${data.items ? data.items.length : 0}`);
        
        if (data.items && data.items.length > 0) {
            // Hide section headers and show single grid
            hideSectionHeaders();
            
            // Update header with genre name with proper error handling
            const popularContainer = document.getElementById('popularContainer');
            const popularSection = popularContainer ? popularContainer.closest('.mb-8') : null;
            if (popularSection) {
                const popularHeader = popularSection.querySelector('h2');
                if (popularHeader) {
                    // Capitalize genre name
                    const genreName = genre.split('-').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                    ).join('-');
                    popularHeader.innerHTML = `<i class="fas fa-film mr-2"></i>Popular ${genreName} Movies`;
                }
            }
            
            // Clear containers
            const popularContainerEl = document.getElementById('popularContainer');
            const latestContainerEl = document.getElementById('latestContainer');
            const comingSoonContainerEl = document.getElementById('comingSoonContainer');
            
            if (popularContainerEl) {
                popularContainerEl.innerHTML = `
                    <div class="flex flex-col items-center justify-center py-12 col-span-full">
                        <i class="fas fa-spinner fa-spin text-3xl text-accent mb-4"></i>
                        <p class="text-gray-400">Loading ${genre} movies...</p>
                    </div>
                `;
            }
            
            if (latestContainerEl) latestContainerEl.innerHTML = '';
            if (comingSoonContainerEl) comingSoonContainerEl.innerHTML = '';
            
            // Get all items (up to 25)
            const allItems = data.items.slice(0, 25);
            
            console.log(`📦 Fetching ${allItems.length} ${genre} movies with progressive display`);
            
            // Clear loading message
            if (popularContainerEl) popularContainerEl.innerHTML = '';
            
            // Fetch details WITH progressive rendering (cards appear one by one)
            await fetchDetailsSequentially(
                allItems.map(item => item.title.replace(/^\d+\.\s*/, '')),
                null,
                'popularContainer',
                true  // Enable progressive loading
            );
            
            console.log(`✅ Finished displaying ${genre} content progressively`);
        } else {
            console.warn(`⚠️ No items found for genre: ${genre}`);
            showSectionHeaders();
            const popularContainerEl = document.getElementById('popularContainer');
            if (popularContainerEl) {
                popularContainerEl.innerHTML = `
                    <div class="flex flex-col items-center justify-center py-12 col-span-full">
                        <i class="fas fa-search text-3xl text-gray-400 mb-4"></i>
                        <p class="text-gray-400">No ${genre} content found</p>
                    </div>
                `;
            }
            const latestContainerEl = document.getElementById('latestContainer');
            const comingSoonContainerEl = document.getElementById('comingSoonContainer');
            if (latestContainerEl) latestContainerEl.innerHTML = '';
            if (comingSoonContainerEl) comingSoonContainerEl.innerHTML = '';
        }
    } catch (error) {
        console.error(`❌ Error fetching ${genre} content:`, error);
        console.error('Error details:', error.message);
        showSectionHeaders();
        const popularContainerEl = document.getElementById('popularContainer');
        if (popularContainerEl) {
            popularContainerEl.innerHTML = `
                <div class="flex flex-col items-center justify-center py-12 col-span-full">
                    <i class="fas fa-exclamation-triangle text-3xl text-red-500 mb-4"></i>
                    <p class="text-red-500">Failed to load ${genre} content</p>
                    <p class="text-gray-400 text-sm mt-2">Please try again later</p>
                </div>
            `;
        }
        const latestContainerEl = document.getElementById('latestContainer');
        const comingSoonContainerEl = document.getElementById('comingSoonContainer');
        if (latestContainerEl) latestContainerEl.innerHTML = '';
        if (comingSoonContainerEl) comingSoonContainerEl.innerHTML = '';
    }
}

// Hide section headers for genre view
function hideSectionHeaders() {
    // Get all section divs (they have class mb-8)
    const popularContainer = document.getElementById('popularContainer');
    const latestContainer = document.getElementById('latestContainer');
    const comingSoonContainer = document.getElementById('comingSoonContainer');
    
    // Get parent sections with proper error handling
    const popularSection = popularContainer ? popularContainer.closest('.mb-8') : null;
    const latestSection = latestContainer ? latestContainer.closest('.mb-8') : null;
    const comingSoonSection = comingSoonContainer ? comingSoonContainer.closest('.mb-8') : null;
    
    // Change Popular header to "All Movies" (will be updated with genre name later)
    if (popularSection) {
        const popularHeader = popularSection.querySelector('h2');
        if (popularHeader) {
            // Store original for later use
            popularHeader.dataset.originalText = popularHeader.innerHTML;
        }
    }
    
    // Hide Latest and Coming Soon sections
    if (latestSection) latestSection.style.display = 'none';
    if (comingSoonSection) comingSoonSection.style.display = 'none';
}

// Show section headers for normal view
function showSectionHeaders() {
    // Get all section divs with error handling
    const popularContainer = document.getElementById('popularContainer');
    const latestContainer = document.getElementById('latestContainer');
    const comingSoonContainer = document.getElementById('comingSoonContainer');
    
    // Get parent sections
    const popularSection = popularContainer ? popularContainer.closest('.mb-8') : null;
    const latestSection = latestContainer ? latestContainer.closest('.mb-8') : null;
    const comingSoonSection = comingSoonContainer ? comingSoonContainer.closest('.mb-8') : null;
    
    // Show all sections with safety checks
    if (popularSection) popularSection.style.display = 'block';
    if (latestSection) latestSection.style.display = 'block';
    if (comingSoonSection) comingSoonSection.style.display = 'block';
    
    // Restore Popular header with safety check
    if (popularSection) {
        const popularHeader = popularSection.querySelector('h2');
        if (popularHeader) {
            popularHeader.innerHTML = '<i class="fas fa-fire mr-2"></i>Popular';
        }
    }
}

// Scrape popular content (movies and TV shows combined)
// WITH progressive rendering
async function scrapePopular() {
    try {
        console.log('Fetching popular content from scraper API...');
        console.log(`Using primary scraper API: ${SCRAPER_API_BASE}`);
        let response = await fetch(`${SCRAPER_API_BASE}/popular`);
        
        // If primary API fails, try fallback
        if (!response.ok) {
            console.log(`Primary API failed with status ${response.status}, trying fallback API: ${FALLBACK_SCRAPER_API_BASE}`);
            response = await fetch(`${FALLBACK_SCRAPER_API_BASE}/popular`);
        }
        
        const data = await response.json();
        console.log('Scraper API response for popular:', data);
        
        if (data.items) {
            // Extract titles - remove numbering prefix
            const titles = data.items.slice(0, 5).map(item => 
                item.title.replace(/^\d+\.\s*/, '')
            );
            console.log('Extracted titles:', titles);
            
            // Clear container and show loading
            document.getElementById('popularContainer').innerHTML = '';
            
            console.log('Fetching popular content with progressive loading');
            const results = await fetchDetailsSequentially(titles, null, 'popularContainer', true);
            console.log('Popular content fetch results:', results);
            
            // Update section pagination
            sectionPagination.popular.items = results;
            
            console.log('Progressive popular content displayed');
            return results;
        }
        
        return [];
    } catch (error) {
        console.error('Error fetching popular content:', error);
        // Try fallback API
        try {
            console.log('Trying fallback API for popular content...');
            console.log(`Using fallback scraper API: ${FALLBACK_SCRAPER_API_BASE}`);
            const response = await fetch(`${FALLBACK_SCRAPER_API_BASE}/popular`);
            const data = await response.json();
            console.log('Fallback API response for popular:', data);
            
            if (data.items) {
                // Extract titles - remove numbering prefix
                const titles = data.items.slice(0, 5).map(item => 
                    item.title.replace(/^\d+\.\s*/, '')
                );
                console.log('Extracted titles from fallback:', titles);
                
                // Clear container and show loading
                document.getElementById('popularContainer').innerHTML = '';
                
                console.log('Fetching popular content with progressive loading from fallback');
                const results = await fetchDetailsSequentially(titles, null, 'popularContainer', true);
                console.log('Popular content fetch results from fallback:', results);
                
                // Update section pagination
                sectionPagination.popular.items = results;
                
                console.log('Progressive popular content displayed from fallback');
                return results;
            }
        } catch (fallbackError) {
            console.error('Error fetching popular content from fallback:', fallbackError);
        }
        return [];
    }
}

// Scrape latest content (movies and TV shows combined)
// WITH progressive rendering
async function scrapeLatest() {
    try {
        console.log('Fetching latest content from scraper API...');
        console.log(`Using primary scraper API: ${SCRAPER_API_BASE}`);
        let response = await fetch(`${SCRAPER_API_BASE}/popular`);
        
        // If primary API fails, try fallback
        if (!response.ok) {
            console.log(`Primary API failed with status ${response.status}, trying fallback API: ${FALLBACK_SCRAPER_API_BASE}`);
            response = await fetch(`${FALLBACK_SCRAPER_API_BASE}/popular`);
        }
        
        const data = await response.json();
        console.log('Scraper API response for latest:', data);
        
        if (data.items) {
            // Extract titles - skip first 5, get next 5
            const titles = data.items.slice(5, 10).map(item => 
                item.title.replace(/^\d+\.\s*/, '')
            );
            console.log('Extracted titles:', titles);
            
            // Clear container and show loading
            document.getElementById('latestContainer').innerHTML = '';
            
            console.log('Fetching latest content with progressive loading');
            const results = await fetchDetailsSequentially(titles, null, 'latestContainer', true);
            console.log('Latest content fetch results:', results);
            
            // Update section pagination
            sectionPagination.latest.items = results;
            
            console.log('Progressive latest content displayed');
            return results;
        }
        
        return [];
    } catch (error) {
        console.error('Error fetching latest content:', error);
        // Try fallback API
        try {
            console.log('Trying fallback API for latest content...');
            console.log(`Using fallback scraper API: ${FALLBACK_SCRAPER_API_BASE}`);
            const response = await fetch(`${FALLBACK_SCRAPER_API_BASE}/popular`);
            const data = await response.json();
            console.log('Fallback API response for latest:', data);
            
            if (data.items) {
                // Extract titles - skip first 5, get next 5
                const titles = data.items.slice(5, 10).map(item => 
                    item.title.replace(/^\d+\.\s*/, '')
                );
                console.log('Extracted titles from fallback:', titles);
                
                // Clear container and show loading
                document.getElementById('latestContainer').innerHTML = '';
                
                console.log('Fetching latest content with progressive loading from fallback');
                const results = await fetchDetailsSequentially(titles, null, 'latestContainer', true);
                console.log('Latest content fetch results from fallback:', results);
                
                // Update section pagination
                sectionPagination.latest.items = results;
                
                console.log('Progressive latest content displayed from fallback');
                return results;
            }
        } catch (fallbackError) {
            console.error('Error fetching latest content from fallback:', fallbackError);
        }
        return [];
    }
}

// Scrape coming soon content (movies and TV shows combined)
// WITH progressive rendering
async function scrapeComingSoon() {
    try {
        console.log('Fetching coming soon content from scraper API...');
        console.log(`Using primary scraper API: ${SCRAPER_API_BASE}`);
        let response = await fetch(`${SCRAPER_API_BASE}/upcoming`);
        
        // If primary API fails, try fallback
        if (!response.ok) {
            console.log(`Primary API failed with status ${response.status}, trying fallback API: ${FALLBACK_SCRAPER_API_BASE}`);
            response = await fetch(`${FALLBACK_SCRAPER_API_BASE}/upcoming`);
        }
        
        const data = await response.json();
        console.log('Scraper API response for coming soon:', data);
        
        if (data.items) {
            // Extract titles - remove numbering prefix
            const titles = data.items.slice(0, 5).map(item => 
                item.title.replace(/^\d+\.\s*/, '')
            );
            console.log('Extracted titles:', titles);
            
            // Clear container and show loading
            document.getElementById('comingSoonContainer').innerHTML = '';
            
            console.log('Fetching coming soon content with progressive loading');
            const results = await fetchDetailsSequentially(titles, null, 'comingSoonContainer', true);
            console.log('Coming soon content fetch results:', results);
            
            // Update section pagination
            sectionPagination.comingSoon.items = results;
            
            console.log('Progressive coming soon content displayed');
            return results;
        }
        
        return [];
    } catch (error) {
        console.error('Error fetching coming soon content:', error);
        // Try fallback API
        try {
            console.log('Trying fallback API for coming soon content...');
            console.log(`Using fallback scraper API: ${FALLBACK_SCRAPER_API_BASE}`);
            const response = await fetch(`${FALLBACK_SCRAPER_API_BASE}/upcoming`);
            const data = await response.json();
            console.log('Fallback API response for coming soon:', data);
            
            if (data.items) {
                // Extract titles - remove numbering prefix
                const titles = data.items.slice(0, 5).map(item => 
                    item.title.replace(/^\d+\.\s*/, '')
                );
                console.log('Extracted titles from fallback:', titles);
                
                // Clear container and show loading
                document.getElementById('comingSoonContainer').innerHTML = '';
                
                console.log('Fetching coming soon content with progressive loading from fallback');
                const results = await fetchDetailsSequentially(titles, null, 'comingSoonContainer', true);
                console.log('Coming soon content fetch results from fallback:', results);
                
                // Update section pagination
                sectionPagination.comingSoon.items = results;
                
                console.log('Progressive coming soon content displayed from fallback');
                return results;
            }
        } catch (fallbackError) {
            console.error('Error fetching coming soon content from fallback:', fallbackError);
        }
        // Show error message in the container
        const container = document.getElementById('comingSoonContainer');
        if (container) {
            container.innerHTML = '<p class="text-center col-span-full text-red-500">Failed to load coming soon content. Please try again later.</p>';
        }
        return [];
    }
}

// Display popular content (only real data, no fallback)
// Show 5 items per section with pagination support
function displayPopularContent(contentList, containerId) {
    console.log(`Displaying content for ${containerId}:`, contentList);
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container ${containerId} not found!`);
        return;
    }
    
    container.innerHTML = '';

    // Always display the actual content cards (even if empty)
    if (contentList && contentList.length > 0) {
        // Show only first 5 items initially
        const itemsToShow = contentList.slice(0, 5);
        
        itemsToShow.forEach(item => {
            const contentCard = document.createElement('div');
            contentCard.className = 'bg-secondary rounded-lg overflow-hidden hover:shadow-xl transition duration-300 cursor-pointer transform hover:-translate-y-1';
            
            // Build the HTML with additional information
            let additionalInfo = '';
            if (item.type) {
                additionalInfo += `<span class="inline-block bg-accent text-primary text-xs px-1 py-0.5 rounded mr-1 mt-1">${item.type}</span>`;
            }
            if (item.rating && item.rating !== 'N/A') {
                additionalInfo += `<span class="inline-block bg-gray-700 text-white text-xs px-1 py-0.5 rounded mr-1 mt-1">${item.rating}</span>`;
            }
            
            // Add actors if available
            let actorsInfo = '';
            if (item.actors && item.actors.length > 0) {
                const actors = item.actors.slice(0, 3).join(', ');
                actorsInfo = `<p class="text-gray-300 text-xs mt-1 truncate">${actors}</p>`;
            }
            
            console.log('Processing homepage item:', item);
            
            const linkUrl = `details.html?id=${item.id}&title=${encodeURIComponent(item.title || 'Unknown Title')}`;
            console.log('Generated homepage link URL:', linkUrl);
            
            contentCard.innerHTML = `
                <img src="${item.image}" alt="${item.title}" class="w-full h-48 object-cover" loading="lazy">
                <div class="p-3">
                    <h4 class="font-bold text-sm mb-1 truncate">${item.title || 'Unknown Title'}</h4>
                    <p class="text-gray-400 text-xs">${item.year || 'N/A'}</p>
                    ${additionalInfo}
                    ${actorsInfo}
                </div>
            `;
            
            contentCard.addEventListener('click', () => {
                console.log('Navigating to:', linkUrl);
                window.location.href = linkUrl;
            });
            
            container.appendChild(contentCard);
        });
        
        // Add "Load More" button if there are more items
        if (contentList.length > 5) {
            const loadMoreButton = document.createElement('div');
            loadMoreButton.className = 'col-span-full text-center mt-4';
            loadMoreButton.innerHTML = `
                <button id="loadMore${containerId}" class="bg-accent hover:bg-cyan-400 text-primary font-bold py-2 px-4 rounded-lg transition duration-300">
                    Load More
                </button>
            `;
            container.appendChild(loadMoreButton);
            
            // Add event listener for load more button
            document.getElementById(`loadMore${containerId}`).addEventListener('click', () => {
                loadMoreItems(containerId);
            });
        }
    } else {
        // Show message when no content is available
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-12 col-span-full">
                <i class="fas fa-film text-3xl text-gray-500 mb-4"></i>
                <p class="text-gray-500">No content available</p>
            </div>
        `;
    }
}

// Display genre content (shows ALL movies without 5-item limit)
function displayGenreContent(contentList, containerId) {
    console.log(`Displaying ALL genre content for ${containerId}:`, contentList);
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container ${containerId} not found!`);
        return;
    }
    
    container.innerHTML = '';

    if (contentList && contentList.length > 0) {
        // Display ALL items (no 5-item limit for genre view)
        contentList.forEach(item => {
            const contentCard = document.createElement('div');
            contentCard.className = 'bg-secondary rounded-lg overflow-hidden hover:shadow-xl transition duration-300 cursor-pointer transform hover:-translate-y-1';
            
            // Build the HTML with additional information
            let additionalInfo = '';
            if (item.type) {
                additionalInfo += `<span class="inline-block bg-accent text-primary text-xs px-1 py-0.5 rounded mr-1 mt-1">${item.type}</span>`;
            }
            if (item.rating && item.rating !== 'N/A') {
                additionalInfo += `<span class="inline-block bg-gray-700 text-white text-xs px-1 py-0.5 rounded mr-1 mt-1">${item.rating}</span>`;
            }
            
            // Add actors if available
            let actorsInfo = '';
            if (item.actors && item.actors.length > 0) {
                const actors = item.actors.slice(0, 3).join(', ');
                actorsInfo = `<p class="text-gray-300 text-xs mt-1 truncate">${actors}</p>`;
            }
            
            const linkUrl = `details.html?id=${item.id}&title=${encodeURIComponent(item.title || 'Unknown Title')}`;
            
            contentCard.innerHTML = `
                <img src="${item.image}" alt="${item.title}" class="w-full h-48 object-cover" loading="lazy">
                <div class="p-3">
                    <h4 class="font-bold text-sm mb-1 truncate">${item.title || 'Unknown Title'}</h4>
                    <p class="text-gray-400 text-xs">${item.year || 'N/A'}</p>
                    ${additionalInfo}
                    ${actorsInfo}
                </div>
            `;
            
            contentCard.addEventListener('click', () => {
                window.location.href = linkUrl;
            });
            
            container.appendChild(contentCard);
        });
    } else {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-12 col-span-full">
                <i class="fas fa-film text-3xl text-gray-500 mb-4"></i>
                <p class="text-gray-500">No content available</p>
            </div>
        `;
    }
}

// Load more items for a section
function loadMoreItems(containerId) {
    console.log('Loading more items for:', containerId);
    // Determine which section we're loading more for
    let sectionKey = '';
    if (containerId.includes('popular')) sectionKey = 'popular';
    else if (containerId.includes('latest')) sectionKey = 'latest';
    else if (containerId.includes('comingSoon')) sectionKey = 'comingSoon';
    
    if (!sectionKey) return;
    
    // Get current page and items
    const sectionData = sectionPagination[sectionKey];
    console.log('Section data:', sectionData);
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Remove the load more button
    const loadMoreButton = document.getElementById(`loadMore${containerId}`);
    if (loadMoreButton) {
        loadMoreButton.remove();
    }
    
    // Show next 5 items
    const startIndex = sectionData.page * 5;
    const endIndex = startIndex + 5;
    const nextItems = sectionData.items.slice(startIndex, endIndex);
    console.log('Next items to load:', nextItems);
    
    // Add new items to container
    nextItems.forEach(item => {
        const contentCard = document.createElement('div');
        contentCard.className = 'bg-secondary rounded-lg overflow-hidden hover:shadow-xl transition duration-300 cursor-pointer transform hover:-translate-y-1';
        
        // Build the HTML with additional information
        let additionalInfo = '';
        if (item.type) {
            additionalInfo += `<span class="inline-block bg-accent text-primary text-xs px-1 py-0.5 rounded mr-1 mt-1">${item.type}</span>`;
        }
        if (item.rating && item.rating !== 'N/A') {
            additionalInfo += `<span class="inline-block bg-gray-700 text-white text-xs px-1 py-0.5 rounded mr-1 mt-1">${item.rating}</span>`;
        }
        
        // Add actors if available
        let actorsInfo = '';
        if (item.actors && item.actors.length > 0) {
            const actors = item.actors.slice(0, 3).join(', ');
            actorsInfo = `<p class="text-gray-300 text-xs mt-1 truncate">${actors}</p>`;
        }
        
        console.log('Processing load more item:', item);
        
        const linkUrl = `details.html?id=${item.id}&title=${encodeURIComponent(item.title || 'Unknown Title')}`;
        console.log('Generated load more link URL:', linkUrl);
        
        contentCard.innerHTML = `
            <img src="${item.image}" alt="${item.title}" class="w-full h-48 object-cover" loading="lazy">
            <div class="p-3">
                <h4 class="font-bold text-sm mb-1 truncate">${item.title || 'Unknown Title'}</h4>
                <p class="text-gray-400 text-xs">${item.year || 'N/A'}</p>
                ${additionalInfo}
                ${actorsInfo}
            </div>
        `;
        
        contentCard.addEventListener('click', () => {
            console.log('Navigating to:', linkUrl);
            window.location.href = linkUrl;
        });
        
        container.appendChild(contentCard);
    });
    
    // Increment page
    sectionData.page++;
    
    // Add new load more button if there are more items
    if (sectionData.items.length > endIndex) {
        const loadMoreButton = document.createElement('div');
        loadMoreButton.className = 'col-span-full text-center mt-4';
        loadMoreButton.innerHTML = `
            <button id="loadMore${containerId}" class="bg-accent hover:bg-cyan-400 text-primary font-bold py-2 px-4 rounded-lg transition duration-300">
                Load More
            </button>
        `;
        container.appendChild(loadMoreButton);
        
        // Add event listener for load more button
        document.getElementById(`loadMore${containerId}`).addEventListener('click', () => {
            loadMoreItems(containerId);
        });
    }
}

// Function to display proxy performance statistics (for debugging)
function displayProxyStats() {
    console.log('=== Proxy Performance Statistics ===');
    CORS_PROXIES.forEach((proxy, index) => {
        const successes = proxySuccessCount[index];
        const failures = proxyFailCount[index];
        const total = successes + failures;
        const successRate = total > 0 ? (successes / total * 100).toFixed(2) : '0.00';
        
        console.log(`Proxy ${index + 1}: ${proxy.substring(0, 30)}...`);
        console.log(`  Successes: ${successes}, Failures: ${failures}, Success Rate: ${successRate}%`);
    });
    console.log('====================================');
}

// Export scrapeByGenre to global window object for accessibility from inline scripts
window.scrapeByGenre = scrapeByGenre;

// Add periodic stats logging
setInterval(displayProxyStats, 300000); // Log every 5 minutes

// Export scrapeByGenre to global window object for accessibility from inline scripts
window.scrapeByGenre = scrapeByGenre;

// Export scrapeByGenre to global window object for accessibility from inline scripts
window.scrapeByGenre = scrapeByGenre;

// Export scrapeByGenre to global window object for accessibility from inline scripts
window.scrapeByGenre = scrapeByGenre;

// Export scrapeByGenre to global window object for accessibility from inline scripts
window.scrapeByGenre = scrapeByGenre;

// Export scrapeByGenre to global window object for accessibility from inline scripts
window.scrapeByGenre = scrapeByGenre;

// Export scrapeByGenre to global window object for accessibility from inline scripts
window.scrapeByGenre = scrapeByGenre;

// Export scrapeByGenre to global window object for accessibility from inline scripts
window.scrapeByGenre = scrapeByGenre;

// Export scrapeByGenre to global window object for accessibility from inline scripts
window.scrapeByGenre = scrapeByGenre;

// Export scrapeByGenre to global window object for accessibility from inline scripts
window.scrapeByGenre = scrapeByGenre;

// Export scrapeByGenre to global window object for accessibility from inline scripts
window.scrapeByGenre = scrapeByGenre;

/**
 * Initialize the dynamic sitemap generator
 * This function sets up the sitemap generator and updates it with movies from the current page
 */
function initializeSitemapGenerator() {
    // Check if sitemap generator is available
    if (typeof sitemapGenerator === 'undefined') {
        console.warn('Sitemap generator not available');
        return;
    }
    
    // Wait for content to load
    setTimeout(() => {
        try {
            // Generate sitemap from current page
            const sitemapXML = sitemapGenerator.generateSitemapFromCurrentPage();
            
            // Save to storage
            sitemapGenerator.saveSitemapToStorage(sitemapXML);
            
            console.log('Sitemap generated and saved to localStorage');
        } catch (error) {
            console.error('Error generating sitemap:', error);
        }
    }, 2000); // Wait 2 seconds for content to load
}

// Add the MovieSitemapGenerator class
/**
 * Dynamic Sitemap Generator for Movie Wiki
 * This class can be used to automatically generate and update sitemaps with all movie detail pages.
 */
class MovieSitemapGenerator {
    constructor() {
        this.baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://moviewiki.qzz.io';
        this.staticPages = [
            { url: '/', priority: '1.0', changefreq: 'daily' },
            { url: '/index.html', priority: '1.0', changefreq: 'daily' },
            { url: '/search.html', priority: '0.8', changefreq: 'weekly' },
            { url: '/forum.html', priority: '0.7', changefreq: 'daily' },
            { url: '/stream.html', priority: '0.6', changefreq: 'weekly' },
            { url: '/details.html', priority: '0.9', changefreq: 'weekly' },
            { url: '/privacy-policy.html', priority: '0.3', changefreq: 'monthly' },
            { url: '/terms-of-service.html', priority: '0.3', changefreq: 'monthly' },
            { url: '/cookie-policy.html', priority: '0.3', changefreq: 'monthly' },
            { url: '/disclaimer.html', priority: '0.3', changefreq: 'monthly' }
        ];
        this.movieCache = new Map();
    }

    /**
     * Generate sitemap XML
     * @param {Array} moviePages - Array of movie objects with id and title properties
     * @returns {string} - XML sitemap string
     */
    generateSitemap(moviePages = []) {
        const currentDate = new Date().toISOString().split('T')[0];
        
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
        
        // Add static pages
        this.staticPages.forEach(page => {
            xml += this.generateUrlEntry(
                `${this.baseUrl}${page.url}`,
                currentDate,
                page.changefreq,
                page.priority
            );
        });
        
        // Add movie detail pages
        moviePages.forEach(movie => {
            const movieUrl = `${this.baseUrl}/details.html?id=${movie.id}&title=${encodeURIComponent(movie.title)}`;
            xml += this.generateUrlEntry(
                movieUrl,
                movie.lastmod || currentDate,
                'weekly',
                '0.8'
            );
        });
        
        xml += `</urlset>`;
        return xml;
    }

    /**
     * Generate a single URL entry for the sitemap
     * @param {string} loc - URL location
     * @param {string} lastmod - Last modified date
     * @param {string} changefreq - Change frequency
     * @param {string} priority - Priority (0.0 - 1.0)
     * @returns {string} - XML URL entry
     */
    generateUrlEntry(loc, lastmod, changefreq, priority) {
        return `  <url>\n` +
               `    <loc>${loc}</loc>\n` +
               `    <lastmod>${lastmod}</lastmod>\n` +
               `    <changefreq>${changefreq}</changefreq>\n` +
               `    <priority>${priority}</priority>\n` +
               `  </url>\n`;
    }

    /**
     * Extract movie data from the homepage containers
     * This function scans the DOM for movie cards and extracts their IDs and titles
     * @returns {Array} - Array of movie objects
     */
    extractMoviesFromDOM() {
        const movies = [];
        const selectors = [
            '#popularContainer .movie-card',
            '#latestContainer .movie-card',
            '#comingSoonContainer .movie-card'
        ];

        selectors.forEach(selector => {
            const cards = document.querySelectorAll(selector);
            cards.forEach(card => {
                // Extract onclick attribute to get the URL
                const onclick = card.getAttribute('onclick');
                if (onclick) {
                    // Extract ID and title from the onclick URL
                    const idMatch = onclick.match(/id=([^&'"']+)/);
                    const titleMatch = onclick.match(/title=([^&'"']+)/);
                    
                    if (idMatch && titleMatch) {
                        const id = idMatch[1];
                        const title = decodeURIComponent(titleMatch[1]);
                        
                        // Avoid duplicates
                        if (!this.movieCache.has(id)) {
                            movies.push({ id, title });
                            this.movieCache.set(id, { title, lastmod: new Date().toISOString().split('T')[0] });
                        }
                    }
                }
            });
        });

        return movies;
    }

    /**
     * Automatically generate sitemap from current DOM
     * @returns {string} - XML sitemap string
     */
    generateSitemapFromCurrentPage() {
        const movies = this.extractMoviesFromDOM();
        return this.generateSitemap(movies);
    }

    /**
     * Save sitemap to localStorage for persistence
     * @param {string} sitemapXML - XML sitemap string
     */
    saveSitemapToStorage(sitemapXML) {
        try {
            localStorage.setItem('movieWikiSitemap', sitemapXML);
            localStorage.setItem('movieWikiSitemapLastUpdate', new Date().toISOString());
        } catch (e) {
            console.warn('Could not save sitemap to localStorage:', e);
        }
    }

    /**
     * Load sitemap from localStorage
     * @returns {string|null} - XML sitemap string or null if not found
     */
    loadSitemapFromStorage() {
        try {
            return localStorage.getItem('movieWikiSitemap');
        } catch (e) {
            console.warn('Could not load sitemap from localStorage:', e);
            return null;
        }
    }

    /**
     * Update sitemap with new movies
     * @param {Array} newMovies - Array of new movie objects
     * @returns {string} - Updated XML sitemap string
     */
    updateSitemapWithNewMovies(newMovies) {
        // Merge with cached movies
        newMovies.forEach(movie => {
            this.movieCache.set(movie.id, { 
                title: movie.title, 
                lastmod: new Date().toISOString().split('T')[0] 
            });
        });

        // Convert cache to array
        const allMovies = Array.from(this.movieCache.entries()).map(([id, data]) => ({
            id,
            title: data.title,
            lastmod: data.lastmod
        }));

        const sitemapXML = this.generateSitemap(allMovies);
        this.saveSitemapToStorage(sitemapXML);
        return sitemapXML;
    }

    /**
     * Get cached movies
     * @returns {Array} - Array of cached movie objects
     */
    getCachedMovies() {
        return Array.from(this.movieCache.entries()).map(([id, data]) => ({
            id,
            title: data.title,
            lastmod: data.lastmod
        }));
    }

    /**
     * Fetch real movie data from API
     * @param {string} movieId - IMDb ID of the movie
     * @returns {Object} - Movie object with id, title, and lastmod
     */
    async fetchMovieData(movieId) {
        try {
            // Check if we already have this movie in cache
            if (this.movieCache.has(movieId)) {
                return {
                    id: movieId,
                    title: this.movieCache.get(movieId).title,
                    lastmod: this.movieCache.get(movieId).lastmod
                };
            }
            
            // Use the same API as the main application
            const response = await fetch(`https://imdb.iamidiotareyoutoo.com/search?tt=${movieId}`);
            const data = await response.json();
            
            if (data.ok && data.short) {
                const title = data.short['#TITLE'] || movieId;
                const lastmod = new Date().toISOString().split('T')[0];
                
                // Cache the movie data
                this.movieCache.set(movieId, { title, lastmod });
                
                return { id: movieId, title, lastmod };
            }
        } catch (error) {
            console.error('Error fetching movie data:', error);
        }
        
        // Fallback to ID if API fails
        const lastmod = new Date().toISOString().split('T')[0];
        this.movieCache.set(movieId, { title: movieId, lastmod });
        return { id: movieId, title: movieId, lastmod };
    }

    /**
     * Update sitemap with new movies by fetching real data
     * @param {Array} newMovieIds - Array of new movie IDs
     * @returns {Promise<string>} - Updated XML sitemap string
     */
    async updateSitemapWithNewMovieIds(newMovieIds) {
        // Fetch data for all new movies
        const moviePromises = newMovieIds.map(id => this.fetchMovieData(id));
        const movies = await Promise.all(moviePromises);
        
        // Update sitemap with new movies
        return this.updateSitemapWithNewMovies(movies);
    }
}

// Create a global instance
const sitemapGenerator = new MovieSitemapGenerator();


// Fetch more items from API for pagination
async function fetchMoreItems(sectionKey, containerId) {
    const sectionData = sectionPagination[sectionKey];
    
    try {
        // Set loading state
        sectionData.isLoading = true;
        
        // Show loading indicator
        const container = document.getElementById(containerId);
        const loadingIndicator = document.createElement('div');
        loadingIndicator.id = `loading${containerId}`;
        loadingIndicator.className = 'col-span-full text-center py-4';
        loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin text-accent text-xl"></i>';
        container.appendChild(loadingIndicator);
        
        // Fetch more data based on section
        let newData = [];
        if (sectionKey === 'popular') {
            newData = await scrapePopular(sectionData.page + 1);
        } else if (sectionKey === 'latest') {
            newData = await scrapeLatest(sectionData.page + 1);
        } else if (sectionKey === 'comingSoon') {
            newData = await scrapeComingSoon(sectionData.page + 1);
        }
        
        // Remove loading indicator
        if (loadingIndicator.parentNode) {
            loadingIndicator.parentNode.removeChild(loadingIndicator);
        }
        
        if (newData && newData.length > 0) {
            // Add new data to section
            sectionData.items = [...sectionData.items, ...newData];
            
            // Add load more button if there are more items
            addLoadMoreButton(containerId);
        } else {
            // No more items available
            sectionData.hasMore = false;
        }
    } catch (error) {
        console.error('Error fetching more items:', error);
        
        // Remove loading indicator
        const loadingIndicator = document.getElementById(`loading${containerId}`);
        if (loadingIndicator && loadingIndicator.parentNode) {
            loadingIndicator.parentNode.removeChild(loadingIndicator);
        }
        
        // Show error message
        const container = document.getElementById(containerId);
        const errorElement = document.createElement('div');
        errorElement.className = 'col-span-full text-center py-4 text-red-500';
        errorElement.innerHTML = '<p>Failed to load more items. Please try again.</p>';
        container.appendChild(errorElement);
        
        // Add retry button
        const retryButton = document.createElement('button');
        retryButton.className = 'bg-accent hover:bg-cyan-400 text-primary font-bold py-2 px-4 rounded-lg transition duration-300 mt-2';
        retryButton.innerHTML = 'Retry';
        retryButton.onclick = () => {
            errorElement.remove();
            retryButton.remove();
            fetchMoreItems(sectionKey, containerId);
        };
        container.appendChild(retryButton);
    } finally {
        sectionData.isLoading = false;
    }
}

// Add load more button to container
function addLoadMoreButton(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Remove existing load more button if any
    const existingButton = document.getElementById(`loadMore${containerId}`);
    if (existingButton) {
        existingButton.remove();
    }
    
    // Add new load more button
    const loadMoreButton = document.createElement('div');
    loadMoreButton.className = 'col-span-full text-center mt-4';
    loadMoreButton.innerHTML = `
        <button id="loadMore${containerId}" class="bg-accent hover:bg-cyan-400 text-primary font-bold py-2 px-4 rounded-lg transition duration-300">
            Load More
        </button>
    `;
    container.appendChild(loadMoreButton);
    
    // Add event listener for load more button
    document.getElementById(`loadMore${containerId}`).addEventListener('click', () => {
        loadMoreItems(containerId);
    });
}

// Enhanced scrape functions with pagination support
async function scrapePopular(page = 1) {
    try {
        console.log(`Fetching popular content from scraper API (page ${page})...`);
        console.log(`Using primary scraper API: ${SCRAPER_API_BASE}`);
        let response = await fetch(`${SCRAPER_API_BASE}/popular?page=${page}`);
        
        // If primary API fails, try fallback
        if (!response.ok) {
            console.log(`Primary API failed with status ${response.status}, trying fallback API: ${FALLBACK_SCRAPER_API_BASE}`);
            response = await fetch(`${FALLBACK_SCRAPER_API_BASE}/popular?page=${page}`);
        }
        
        const data = await response.json();
        console.log('Scraper API response for popular:', data);
        
        if (data.items) {
            // Extract titles - remove numbering prefix
            const titles = data.items.slice(0, 5).map(item => 
                item.title.replace(/^\d+\.\s*/, '')
            );
            console.log('Extracted titles:', titles);
            
            // Fetch details WITH progressive rendering
            const results = await fetchDetailsSequentially(titles, null, null, false, 'popular');
            
            console.log('Popular content fetched:', results);
            return results;
        }
        
        return [];
    } catch (error) {
        console.error('Error fetching popular content:', error);
        // Try fallback API
        try {
            console.log('Trying fallback API for popular content...');
            console.log(`Using fallback scraper API: ${FALLBACK_SCRAPER_API_BASE}`);
            const response = await fetch(`${FALLBACK_SCRAPER_API_BASE}/popular?page=${page}`);
            const data = await response.json();
            console.log('Fallback API response for popular:', data);
            
            if (data.items) {
                // Extract titles - remove numbering prefix
                const titles = data.items.slice(0, 5).map(item => 
                    item.title.replace(/^\d+\.\s*/, '')
                );
                console.log('Extracted titles from fallback:', titles);
                
                // Fetch details WITH progressive rendering
                const results = await fetchDetailsSequentially(titles, null, null, false, 'popular');
                
                console.log('Popular content fetched from fallback:', results);
                return results;
            }
        } catch (fallbackError) {
            console.error('Error fetching popular content from fallback:', fallbackError);
        }
        return [];
    }
}

async function scrapeLatest(page = 1) {
    try {
        console.log(`Fetching latest content from scraper API (page ${page})...`);
        console.log(`Using primary scraper API: ${SCRAPER_API_BASE}`);
        let response = await fetch(`${SCRAPER_API_BASE}/popular?page=${page}`);
        
        // If primary API fails, try fallback
        if (!response.ok) {
            console.log(`Primary API failed with status ${response.status}, trying fallback API: ${FALLBACK_SCRAPER_API_BASE}`);
            response = await fetch(`${FALLBACK_SCRAPER_API_BASE}/popular?page=${page}`);
        }
        
        const data = await response.json();
        console.log('Scraper API response for latest:', data);
        
        if (data.items) {
            // Extract titles - skip first 5, get next 5
            const titles = data.items.slice(5, 10).map(item => 
                item.title.replace(/^\d+\.\s*/, '')
            );
            console.log('Extracted titles:', titles);
            
            // Fetch details WITH progressive rendering
            const results = await fetchDetailsSequentially(titles, null, null, false, 'latest');
            
            console.log('Latest content fetched:', results);
            return results;
        }
        
        return [];
    } catch (error) {
        console.error('Error fetching latest content:', error);
        // Try fallback API
        try {
            console.log('Trying fallback API for latest content...');
            console.log(`Using fallback scraper API: ${FALLBACK_SCRAPER_API_BASE}`);
            const response = await fetch(`${FALLBACK_SCRAPER_API_BASE}/popular?page=${page}`);
            const data = await response.json();
            console.log('Fallback API response for latest:', data);
            
            if (data.items) {
                // Extract titles - skip first 5, get next 5
                const titles = data.items.slice(5, 10).map(item => 
                    item.title.replace(/^\d+\.\s*/, '')
                );
                console.log('Extracted titles from fallback:', titles);
                
                // Fetch details WITH progressive rendering
                const results = await fetchDetailsSequentially(titles, null, null, false, 'latest');
                
                console.log('Latest content fetched from fallback:', results);
                return results;
            }
        } catch (fallbackError) {
            console.error('Error fetching latest content from fallback:', fallbackError);
        }
        return [];
    }
}

async function scrapeComingSoon(page = 1) {
    try {
        console.log(`Fetching coming soon content from scraper API (page ${page})...`);
        console.log(`Using primary scraper API: ${SCRAPER_API_BASE}`);
        let response = await fetch(`${SCRAPER_API_BASE}/upcoming?page=${page}`);
        
        // If primary API fails, try fallback
        if (!response.ok) {
            console.log(`Primary API failed with status ${response.status}, trying fallback API: ${FALLBACK_SCRAPER_API_BASE}`);
            response = await fetch(`${FALLBACK_SCRAPER_API_BASE}/upcoming?page=${page}`);
        }
        
        const data = await response.json();
        console.log('Scraper API response for coming soon:', data);
        
        if (data.items) {
            // Extract titles - remove numbering prefix
            const titles = data.items.slice(0, 5).map(item => 
                item.title.replace(/^\d+\.\s*/, '')
            );
            console.log('Extracted titles:', titles);
            
            // Fetch details WITH progressive rendering
            const results = await fetchDetailsSequentially(titles, null, null, false, 'comingSoon');
            
            console.log('Coming soon content fetched:', results);
            return results;
        }
        
        return [];
    } catch (error) {
        console.error('Error fetching coming soon content:', error);
        // Try fallback API
        try {
            console.log('Trying fallback API for coming soon content...');
            console.log(`Using fallback scraper API: ${FALLBACK_SCRAPER_API_BASE}`);
            const response = await fetch(`${FALLBACK_SCRAPER_API_BASE}/upcoming?page=${page}`);
            const data = await response.json();
            console.log('Fallback API response for coming soon:', data);
            
            if (data.items) {
                // Extract titles - remove numbering prefix
                const titles = data.items.slice(0, 5).map(item => 
                    item.title.replace(/^\d+\.\s*/, '')
                );
                console.log('Extracted titles from fallback:', titles);
                
                // Fetch details WITH progressive rendering
                const results = await fetchDetailsSequentially(titles, null, null, false, 'comingSoon');
                
                console.log('Coming soon content fetched from fallback:', results);
                return results;
            }
        } catch (fallbackError) {
            console.error('Error fetching coming soon content from fallback:', fallbackError);
        }
        // Show error message in the container
        const container = document.getElementById('comingSoonContainer');
        if (container) {
            container.innerHTML = '<p class="text-center col-span-full text-red-500">Failed to load coming soon content. Please try again later.</p>';
        }
        return [];
    }
}

// Function to display proxy performance statistics (for debugging)
function displayProxyStats() {
    console.log('=== Proxy Performance Statistics ===');
    CORS_PROXIES.forEach((proxy, index) => {
        const successes = proxySuccessCount[index];
        const failures = proxyFailCount[index];
        const total = successes + failures;
        const successRate = total > 0 ? (successes / total * 100).toFixed(2) : '0.00';
        
        console.log(`Proxy ${index + 1}: ${proxy.substring(0, 30)}...`);
        console.log(`  Successes: ${successes}, Failures: ${failures}, Success Rate: ${successRate}%`);
    });
    console.log('====================================');
}

// Export scrapeByGenre to global window object for accessibility from inline scripts
window.scrapeByGenre = scrapeByGenre;

// Add periodic stats logging
setInterval(displayProxyStats, 300000); // Log every 5 minutes