// trailer.js - Trailer functionality for Movie Wiki
console.log('✅ trailer.js loaded');

// Use the existing API_BASE from script.js instead of redeclaring it
// const API_BASE = 'https://imdb.iamidiotareyoutoo.com'; // This line was causing the conflict

// Enhanced CORS Proxy with better, faster proxies and intelligent fallback (same as details.html)
const CORS_PROXIES = [
    'https://corsproxy.io/?',                      // Tier 1: Fastest, high reliability
    'https://api.allorigins.win/raw?url=',         // Tier 2: Good reliability
    'https://api.codetabs.com/v1/proxy?quest=',    // Tier 3: Alternative
    'https://thingproxy.freeboard.io/fetch/',      // Tier 4: Fallback
    'https://cors-anywhere.herokuapp.com/'         // Tier 5: Last resort
];

let currentProxyIndex = 0;
let proxySuccessCount = Array(CORS_PROXIES.length).fill(0);
let proxyFailCount = Array(CORS_PROXIES.length).fill(0);

// Enhanced proxy selection with performance tracking (same as details.html)
function selectBestProxy() {
    // Calculate success rate for each proxy
    const proxyScores = CORS_PROXIES.map((_, index) => {
        const totalAttempts = proxySuccessCount[index] + proxyFailCount[index];
        if (totalAttempts === 0) return 0.5; // Default score for untested proxies
        return proxySuccessCount[index] / totalAttempts;
    });
    
    // Find proxy with highest success rate
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

// Improved fetch with proxy that quickly switches to better proxies (same as details.html)
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
        
        const response = await fetch(url, directOptions);
        if (response.ok) {
            console.log('✅ Direct fetch succeeded');
            return response;
        }
        console.log(`Direct fetch failed with status: ${response.status}`);
    } catch (error) {
        console.log('Direct fetch failed:', error.message);
    }
    
    // Select the best performing proxy based on historical data
    const bestProxyIndex = selectBestProxy();
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
            
            const response = await fetch(proxiedUrl, proxyOptions);
            if (response.ok) {
                console.log(`✅ Success with proxy ${proxyIndex + 1}`);
                proxySuccessCount[proxyIndex]++;
                currentProxyIndex = proxyIndex; // Remember working proxy
                return response;
            } else {
                console.log(`❌ Proxy ${proxyIndex + 1} failed with status: ${response.status}`);
                proxyFailCount[proxyIndex]++;
            }
        } catch (error) {
            console.log(`❌ Proxy ${proxyIndex + 1} failed:`, error.message);
            proxyFailCount[proxyIndex]++;
        }
    }
    
    // All proxies failed, throw error
    throw new Error('All fetch attempts failed (direct + proxies)');
}

// Fetch trailer URL for a specific movie (following the same approach as details.html)
// Enhanced with caching for faster loading
async function fetchTrailerForMovie(movieId) {
    // If no movie ID, we can't fetch a trailer
    if (!movieId) {
        console.log('No movie ID provided, cannot fetch trailer');
        return null;
    }
    
    // Check cache first for faster loading
    if (window.trailerCache) {
        const cachedTrailer = window.trailerCache.get(movieId);
        if (cachedTrailer) {
            console.log(`✅ Using cached trailer for movie: ${movieId}`);
            return cachedTrailer;
        }
    }
    
    try {
        console.log(`📥 Fetching trailer for movie: ${movieId}`);
        
        // Use the same API as details page
        const url = `${window.API_BASE}/search?tt=${movieId}`;
        console.log(`Trailer search URL: ${url}`);
        
        // Try direct fetch first (same method as details page)
        let response = await fetchWithProxy(url);
        console.log(`Trailer fetch response status: ${response.status}`);
        console.log(`Trailer fetch response headers:`, [...response.headers.entries()]);
        
        if (!response.ok) {
            throw new Error(`Direct fetch failed with status ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`Trailer API Response for ${movieId}:`, JSON.stringify(data, null, 2));
        
        // Check if we have valid data
        if (!data) {
            console.warn(`No data received for trailer: ${movieId}`);
            return null;
        }
        
        // Extract trailer information (same structure as details page)
        const shortData = data.short || {};
        const topData = data.top || {};
        
        console.log(`Short data for trailer ${movieId}:`, shortData);
        console.log(`Top data for trailer ${movieId}:`, topData);
        
        // Try to get trailer from top data primary videos FIRST (same approach as details.html)
        // This is the key difference - we need to get the actual playable URLs, not just the IMDb links
        const videos = topData.primaryVideos?.edges || [];
        if (videos.length > 0) {
            const trailerNode = videos[0].node;
            if (trailerNode) {
                console.log(`Found trailer node for ${movieId}:`, trailerNode);
                
                // Try to get playback URL (same approach as details.html)
                const playbackURLs = trailerNode.playbackURLs || [];
                if (playbackURLs.length > 0) {
                    console.log(`Found playback URLs for ${movieId}:`, playbackURLs);
                    
                    // Get the highest quality available (same approach as details.html)
                    const qualityOptions = ['DEF_1080p', 'DEF_720p', 'DEF_480p', 'DEF_360p', 'DEF_AUTO'];
                    for (const quality of qualityOptions) {
                        const playback = playbackURLs.find(p => p.videoDefinition === quality);
                        if (playback && playback.url) {
                            console.log(`Found ${quality} playback URL for ${movieId}:`, playback.url);
                            const trailerData = {
                                url: playback.url,  // Use URL directly as in details.html
                                title: trailerNode.name?.value || trailerNode.contentTitle?.text || 'Trailer',
                                type: 'playback',  // Indicate this is a playback URL for embedding
                                thumbnail: trailerNode.thumbnail?.url || shortData.image || topData.primaryImage?.url || 'https://placehold.co/600x900?text=No+Image&font=opensans'
                            };
                            
                            // Cache the trailer data for faster loading next time
                            if (window.trailerCache) {
                                window.trailerCache.set(movieId, trailerData);
                            }
                            
                            return trailerData;
                        }
                    }
                    // Fallback to first available URL (same approach as details.html)
                    console.log(`Using first playback URL for ${movieId}:`, playbackURLs[0].url);
                    const trailerData = {
                        url: playbackURLs[0].url,  // Use URL directly as in details.html
                        title: trailerNode.name?.value || trailerNode.contentTitle?.text || 'Trailer',
                        type: 'playback',  // Indicate this is a playback URL for embedding
                        thumbnail: trailerNode.thumbnail?.url || shortData.image || topData.primaryImage?.url || 'https://placehold.co/600x900?text=No+Image&font=opensans'
                    };
                    
                    // Cache the trailer data for faster loading next time
                    if (window.trailerCache) {
                        window.trailerCache.set(movieId, trailerData);
                    }
                    
                    return trailerData;
                }
                
                // If no playback URLs, try to get preview URL (for embedding)
                const previewURLs = trailerNode.previewURLs || [];
                if (previewURLs.length > 0) {
                    console.log(`Found preview URL for ${movieId}:`, previewURLs[0].url);
                    const trailerData = {
                        url: previewURLs[0].url,
                        title: trailerNode.name?.value || trailerNode.contentTitle?.text || 'Trailer',
                        type: 'preview',  // Indicate this is a preview URL for embedding
                        thumbnail: trailerNode.thumbnail?.url || shortData.image || topData.primaryImage?.url || 'https://placehold.co/600x900?text=No+Image&font=opensans'
                    };
                    
                    // Cache the trailer data for faster loading next time
                    if (window.trailerCache) {
                        window.trailerCache.set(movieId, trailerData);
                    }
                    
                    return trailerData;
                }
            }
        }
        
        // ONLY fallback to shortData.trailer if no playback URLs found
        // In details.html, when there's a direct trailer URL, it opens in a new tab
        if (shortData.trailer && shortData.trailer.url) {
            console.log(`Found trailer in shortData for ${movieId}:`, shortData.trailer.url);
            const trailerData = {
                url: shortData.trailer.url,  // Use URL directly as in details.html
                title: shortData.trailer.title || 'Trailer',
                type: 'direct',  // Indicate this is a direct URL to open in new tab
                thumbnail: shortData.image || topData.primaryImage?.url || 'https://placehold.co/600x900?text=No+Image&font=opensans'
            };
            
            // Cache the trailer data for faster loading next time
            if (window.trailerCache) {
                window.trailerCache.set(movieId, trailerData);
            }
            
            return trailerData;
        }
        
        console.log(`No trailer found for movie ${movieId}`);
        return null;
        
    } catch (error) {
        console.error(`Error fetching trailer for movie ${movieId}:`, error);
        return null;
    }
}

// Expose functions globally
window.fetchTrailerForMovie = fetchTrailerForMovie;

console.log('✅ Trailer functionality initialized');
