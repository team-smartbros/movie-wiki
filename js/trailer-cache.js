// trailer-cache.js - Trailer caching system for Movie Wiki
console.log('✅ trailer-cache.js loaded');

// Enhanced trailer cache with size limits and expiration
class TrailerCache {
    constructor(maxSize = 50, expirationTime = 30 * 60 * 1000) { // 30 minutes
        this.cache = new Map();
        this.maxSize = maxSize;
        this.expirationTime = expirationTime;
        this.accessOrder = []; // Track access order for LRU
        console.log(`✅ TrailerCache initialized with maxSize: ${maxSize}, expirationTime: ${expirationTime}ms`);
    }
    
    // Get cached trailer data
    get(movieId) {
        if (!this.cache.has(movieId)) {
            console.log(`🔍 Cache miss for movie: ${movieId}`);
            return null;
        }
        
        const cachedItem = this.cache.get(movieId);
        
        // Check if expired
        if (Date.now() - cachedItem.timestamp > this.expirationTime) {
            console.log(`⏰ Cache expired for movie: ${movieId}`);
            this.delete(movieId);
            return null;
        }
        
        // Update access order for LRU
        this.updateAccessOrder(movieId);
        
        console.log(`✅ Cache hit for movie: ${movieId}`);
        return cachedItem.data;
    }
    
    // Set trailer data in cache
    set(movieId, data) {
        // If cache is at max size, remove least recently used item
        if (this.cache.size >= this.maxSize) {
            this.evictLRU();
        }
        
        // Store with timestamp
        this.cache.set(movieId, {
            data: data,
            timestamp: Date.now()
        });
        
        // Update access order
        this.updateAccessOrder(movieId);
        
        console.log(`✅ Cached trailer for movie: ${movieId}`);
        this.saveToLocalStorage();
    }
    
    // Delete specific item from cache
    delete(movieId) {
        this.cache.delete(movieId);
        this.accessOrder = this.accessOrder.filter(id => id !== movieId);
        this.saveToLocalStorage();
    }
    
    // Clear entire cache
    clear() {
        this.cache.clear();
        this.accessOrder = [];
        this.saveToLocalStorage();
    }
    
    // Update access order for LRU tracking
    updateAccessOrder(movieId) {
        // Remove from current position
        this.accessOrder = this.accessOrder.filter(id => id !== movieId);
        // Add to end (most recently used)
        this.accessOrder.push(movieId);
    }
    
    // Evict least recently used item
    evictLRU() {
        if (this.accessOrder.length > 0) {
            const lruId = this.accessOrder[0];
            this.delete(lruId);
            console.log(`🗑️ Evicted LRU item: ${lruId}`);
        }
    }
    
    // Get cache statistics
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            accessOrderLength: this.accessOrder.length
        };
    }
    
    // Save cache to localStorage
    saveToLocalStorage() {
        try {
            // Convert Map to serializable object
            const serializableCache = {};
            for (const [key, value] of this.cache.entries()) {
                serializableCache[key] = value;
            }
            
            const cacheData = {
                cache: serializableCache,
                accessOrder: this.accessOrder,
                timestamp: Date.now()
            };
            
            localStorage.setItem('trailerCache', JSON.stringify(cacheData));
        } catch (error) {
            console.warn('⚠️ Failed to save trailer cache to localStorage:', error);
        }
    }
    
    // Load cache from localStorage
    loadFromLocalStorage() {
        try {
            const cacheData = localStorage.getItem('trailerCache');
            if (!cacheData) return;
            
            const parsedData = JSON.parse(cacheData);
            
            // Check if cache is too old (1 hour)
            if (Date.now() - parsedData.timestamp > 60 * 60 * 1000) {
                localStorage.removeItem('trailerCache');
                return;
            }
            
            // Restore cache
            this.cache = new Map();
            for (const [key, value] of Object.entries(parsedData.cache)) {
                // Check if individual items are expired
                if (Date.now() - value.timestamp <= this.expirationTime) {
                    this.cache.set(key, value);
                }
            }
            
            this.accessOrder = parsedData.accessOrder || [];
            
            console.log('✅ Trailer cache loaded from localStorage');
        } catch (error) {
            console.warn('⚠️ Failed to load trailer cache from localStorage:', error);
            localStorage.removeItem('trailerCache'); // Clear corrupted cache
        }
    }
    
    // Clean expired entries
    cleanExpired() {
        const now = Date.now();
        let cleanedCount = 0;
        
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.expirationTime) {
                this.delete(key);
                cleanedCount++;
            }
        }
        
        if (cleanedCount > 0) {
            console.log(`🧹 Cleaned ${cleanedCount} expired cache entries`);
        }
        
        return cleanedCount;
    }
}

// Initialize trailer cache
console.log('🎬 Initializing trailer cache...');
const trailerCache = new TrailerCache();

// Load existing cache data
console.log('📥 Loading trailer cache from localStorage...');
trailerCache.loadFromLocalStorage();

// Clean expired entries on startup
console.log('🧹 Cleaning expired cache entries...');
trailerCache.cleanExpired();

// Periodically clean expired entries (every 10 minutes)
setInterval(() => {
    trailerCache.cleanExpired();
}, 10 * 60 * 1000);

// Save cache periodically (every 5 minutes)
setInterval(() => {
    trailerCache.saveToLocalStorage();
}, 5 * 60 * 1000);

// Save cache before page unload
window.addEventListener('beforeunload', () => {
    trailerCache.saveToLocalStorage();
});

// Expose cache globally
window.trailerCache = trailerCache;

console.log('✅ Trailer cache system initialized');
console.log('📊 Cache stats:', trailerCache.getStats());