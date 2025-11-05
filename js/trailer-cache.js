// trailer-cache.js - Dedicated caching system for trailer URLs
// This file provides a robust caching mechanism specifically for trailer data to ensure fast loading

console.log('✅ trailer-cache.js loaded');

// Cache configuration
const TRAILER_CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours cache duration
const TRAILER_CACHE_MAX_ENTRIES = 100; // Maximum number of trailer cache entries
const TRAILER_CACHE_PREFIX = 'trailer_cache_';

// Initialize cache
let trailerCache = {};

// Load cache from localStorage on startup
function loadTrailerCache() {
    try {
        const cachedData = localStorage.getItem('trailerCache');
        if (cachedData) {
            const parsedData = JSON.parse(cachedData);
            // Check if cache is still valid
            if (Date.now() - parsedData.timestamp < TRAILER_CACHE_DURATION) {
                trailerCache = parsedData.data;
                console.log('✅ Trailer cache loaded from localStorage');
            } else {
                console.log('🗑️ Trailer cache expired, clearing');
                clearTrailerCache();
            }
        }
    } catch (error) {
        console.warn('⚠️ Failed to load trailer cache:', error);
        trailerCache = {};
    }
}

// Save cache to localStorage
function saveTrailerCache() {
    try {
        const cacheData = {
            timestamp: Date.now(),
            data: trailerCache
        };
        localStorage.setItem('trailerCache', JSON.stringify(cacheData));
    } catch (error) {
        console.warn('⚠️ Failed to save trailer cache:', error);
    }
}

// Get cache key for a trailer
function getTrailerCacheKey(movieId) {
    return `${TRAILER_CACHE_PREFIX}${movieId}`;
}

// Get trailer data from cache
function getCachedTrailer(movieId) {
    try {
        const key = getTrailerCacheKey(movieId);
        const cachedItem = trailerCache[key];
        
        if (cachedItem) {
            // Check if item is still valid
            if (Date.now() - cachedItem.timestamp < TRAILER_CACHE_DURATION) {
                console.log(`✅ Found cached trailer for movie ${movieId}`);
                return cachedItem.data;
            } else {
                // Remove expired item
                console.log(`🗑️ Cached trailer for movie ${movieId} expired`);
                delete trailerCache[key];
                saveTrailerCache();
                return null;
            }
        }
        console.log(`📭 No cached trailer found for movie ${movieId}`);
        return null;
    } catch (error) {
        console.warn(`⚠️ Error retrieving cached trailer for ${movieId}:`, error);
        return null;
    }
}

// Cache trailer data
function cacheTrailer(movieId, trailerData) {
    try {
        // Check cache size and remove oldest entries if necessary
        const cacheKeys = Object.keys(trailerCache);
        if (cacheKeys.length >= TRAILER_CACHE_MAX_ENTRIES) {
            // Remove oldest entry
            const oldestKey = cacheKeys.reduce((oldest, key) => {
                return trailerCache[key].timestamp < trailerCache[oldest].timestamp ? key : oldest;
            });
            delete trailerCache[oldestKey];
            console.log(`🗑️ Removed oldest trailer cache entry: ${oldestKey}`);
        }
        
        const key = getTrailerCacheKey(movieId);
        trailerCache[key] = {
            timestamp: Date.now(),
            data: trailerData
        };
        
        console.log(`✅ Cached trailer for movie ${movieId}`);
        saveTrailerCache();
        return true;
    } catch (error) {
        console.warn(`⚠️ Error caching trailer for ${movieId}:`, error);
        return false;
    }
}

// Clear trailer cache
function clearTrailerCache() {
    trailerCache = {};
    try {
        localStorage.removeItem('trailerCache');
        console.log('🗑️ Trailer cache cleared');
    } catch (error) {
        console.warn('⚠️ Error clearing trailer cache:', error);
    }
}

// Get cache statistics
function getTrailerCacheStats() {
    const keys = Object.keys(trailerCache);
    const totalEntries = keys.length;
    const totalSize = JSON.stringify(trailerCache).length;
    
    // Calculate expiration times
    const expirations = keys.map(key => {
        const item = trailerCache[key];
        return item.timestamp + TRAILER_CACHE_DURATION - Date.now();
    });
    
    const avgExpiration = expirations.length > 0 
        ? expirations.reduce((sum, exp) => sum + exp, 0) / expirations.length 
        : 0;
    
    return {
        totalEntries,
        totalSize,
        averageExpirationTime: avgExpiration
    };
}

// Clean up expired cache entries
function cleanupExpiredTrailerCache() {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const key in trailerCache) {
        const item = trailerCache[key];
        if (now - item.timestamp >= TRAILER_CACHE_DURATION) {
            delete trailerCache[key];
            cleanedCount++;
        }
    }
    
    if (cleanedCount > 0) {
        console.log(`🗑️ Cleaned up ${cleanedCount} expired trailer cache entries`);
        saveTrailerCache();
    }
    
    return cleanedCount;
}

// Initialize the cache when module loads
loadTrailerCache();

// Periodically clean up expired entries
setInterval(cleanupExpiredTrailerCache, 30 * 60 * 1000); // Every 30 minutes

// Expose functions globally
window.trailerCache = {
    get: getCachedTrailer,
    set: cacheTrailer,
    clear: clearTrailerCache,
    stats: getTrailerCacheStats,
    cleanup: cleanupExpiredTrailerCache
};

console.log('✅ Trailer cache system initialized');