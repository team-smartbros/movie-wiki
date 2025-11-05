// trailer.js - Trailer functionality for Movie Wiki
// Check if script already loaded to prevent duplicate declarations
if (window.trailerJSLoaded) {
    console.log('✅ trailer.js already loaded, skipping initialization');
} else {
    console.log('✅ trailer.js loaded');
    window.trailerJSLoaded = true;

    // Use the existing API_BASE and CORS_PROXIES from script.js instead of redeclaring them
    let currentProxyIndex = 0;
    let proxySuccessCount = Array(window.CORS_PROXIES?.length || 5).fill(0);
    let proxyFailCount = Array(window.CORS_PROXIES?.length || 5).fill(0);

    // Enhanced proxy selection with performance tracking (same as details.html)
    function selectBestProxy() {
        // Calculate success rate for each proxy
        const proxyScores = (window.CORS_PROXIES || []).map((_, index) => {
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
        for (let i = 0; i < (window.CORS_PROXIES || []).length; i++) {
            if (i !== bestProxyIndex) {
                proxyOrder.push(i);
            }
        }
        
        // Try with CORS proxies in order of performance
        for (const proxyIndex of proxyOrder) {
            const proxy = (window.CORS_PROXIES || [])[proxyIndex];
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
                                    thumbnail: trailerNode.thumbnail?.url || shortData.image || topData.primaryImage?.url || 'https://placehold.co/600x900?text=No+Image&font=opensans',
                                    movieId: movieId
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
                            thumbnail: trailerNode.thumbnail?.url || shortData.image || topData.primaryImage?.url || 'https://placehold.co/600x900?text=No+Image&font=opensans',
                            movieId: movieId
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
                            thumbnail: trailerNode.thumbnail?.url || shortData.image || topData.primaryImage?.url || 'https://placehold.co/600x900?text=No+Image&font=opensans',
                            movieId: movieId
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
                    thumbnail: shortData.image || topData.primaryImage?.url || 'https://placehold.co/600x900?text=No+Image&font=opensans',
                    movieId: movieId
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

    // Function to initialize featured trailers
    async function initializeFeaturedTrailers() {
        console.log('🎬 Initializing featured trailers...');
        
        try {
            // Show loader
            const loader = document.getElementById('trailersLoader');
            const carousel = document.getElementById('trailersCarousel');
            
            if (loader) loader.style.display = 'flex';
            if (carousel) carousel.innerHTML = '';
            
            // Wait for main content to load by checking if containers have content
            // We'll wait up to 10 seconds for content to load
            let attempts = 0;
            const maxAttempts = 20; // 10 seconds with 500ms intervals
            let hasContent = false;
            
            while (attempts < maxAttempts && !hasContent) {
                // Check if any of the main containers have content
                const popularContainer = document.getElementById('popularContainer');
                const latestContainer = document.getElementById('latestContainer');
                const comingSoonContainer = document.getElementById('comingSoonContainer');
                
                // Check if any container has movie cards
                const hasPopularContent = popularContainer && popularContainer.querySelectorAll('.movie-card').length > 0;
                const hasLatestContent = latestContainer && latestContainer.querySelectorAll('.movie-card').length > 0;
                const hasComingSoonContent = comingSoonContainer && comingSoonContainer.querySelectorAll('.movie-card').length > 0;
                
                hasContent = hasPopularContent || hasLatestContent || hasComingSoonContent;
                
                if (!hasContent) {
                    attempts++;
                    console.log(`Waiting for main content to load... Attempt ${attempts}/${maxAttempts}`);
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
            
            if (!hasContent) {
                console.log('Main content still not loaded after waiting, proceeding anyway');
            }
            
            // Get movie IDs from the existing containers
            const popularMovies = Array.from(document.querySelectorAll('#popularContainer .movie-card')).slice(0, 2);
            const latestMovies = Array.from(document.querySelectorAll('#latestContainer .movie-card')).slice(0, 2);
            const comingSoonMovies = Array.from(document.querySelectorAll('#comingSoonContainer .movie-card')).slice(0, 2);
            
            // Combine all movie elements
            const allMovieElements = [...popularMovies, ...latestMovies, ...comingSoonMovies];
            
            if (allMovieElements.length === 0) {
                console.log('No movies found for featured trailers');
                // Hide loader and show message
                if (loader) loader.style.display = 'none';
                if (carousel) {
                    carousel.innerHTML = `
                        <div class="w-full h-full flex items-center justify-center">
                            <div class="text-center p-8">
                                <i class="fas fa-film text-4xl text-gray-500 mb-4"></i>
                                <p class="text-gray-400">No featured trailers available at the moment</p>
                            </div>
                        </div>
                    `;
                }
                return;
            }
            
            // Extract movie data from elements
            const featuredMovies = allMovieElements.map(element => {
                const title = element.querySelector('.movie-title')?.textContent || '';
                const year = element.querySelector('.movie-year')?.textContent || '';
                const rating = element.querySelector('.movie-rating')?.textContent || '';
                const image = element.querySelector('.movie-poster')?.src || '';
                const movieId = element.dataset.movieId || '';
                
                return { title, year, rating, image, id: movieId };
            }).filter(movie => movie.id); // Filter out movies without IDs
            
            console.log('Featured movies:', featuredMovies);
            
            // Fetch trailers for featured movies
            const trailerPromises = featuredMovies.map(movie => 
                fetchTrailerForMovie(movie.id)
            );
            
            const trailers = await Promise.all(trailerPromises);
            console.log('Fetched trailers:', trailers);
            
            // Filter out null trailers
            const validTrailers = trailers.filter(trailer => trailer && trailer.url);
            console.log('Valid trailers:', validTrailers);
            
            if (validTrailers.length > 0) {
                // Hide loader and populate carousel
                if (loader) loader.style.display = 'none';
                
                // Populate carousel with trailer items
                if (carousel) {
                    carousel.innerHTML = validTrailers.map((trailer, index) => {
                        const movie = featuredMovies.find(m => m.id === trailer.movieId) || {};
                        return `
                            <div class="trailer-item snap-start relative flex-shrink-0 w-full">
                                <div class="thumbnail-container">
                                    <img src="${trailer.thumbnail || movie.image || 'https://placehold.co/600x900?text=No+Image&font=opensans'}" 
                                         alt="${trailer.title || movie.title || 'Trailer'}" 
                                         class="w-full h-full object-cover"
                                         onerror="this.src='https://placehold.co/600x900?text=No+Image&font=opensans'">
                                    <div class="trailer-overlay">
                                        <div class="trailer-info">
                                            <h3>${trailer.title || movie.title || 'Trailer'}</h3>
                                            <p>${movie.year ? movie.year : ''} ${movie.rating ? `• ${movie.rating}` : ''}</p>
                                        </div>
                                    </div>
                                    <div class="trailer-controls">
                                        <button class="trailer-control-btn play-trailer" 
                                                data-url="${encodeURIComponent(trailer.url)}" 
                                                data-title="${encodeURIComponent(trailer.title || movie.title || 'Trailer')}" 
                                                data-movie-id="${trailer.movieId || ''}"
                                                data-poster="${encodeURIComponent(trailer.thumbnail || movie.image || 'https://placehold.co/600x900?text=No+Image&font=opensans')}"
                                                data-year="${encodeURIComponent(movie.year || '')}"
                                                data-rating="${encodeURIComponent(movie.rating || '')}"
                                                data-plot="${encodeURIComponent('')}">
                                            <i class="fas fa-play"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('');
                    
                    // Add event listeners to play buttons
                    document.querySelectorAll('.play-trailer').forEach(button => {
                        button.addEventListener('click', function() {
                            const url = decodeURIComponent(this.dataset.url);
                            const title = decodeURIComponent(this.dataset.title);
                            const movieId = this.dataset.movieId;
                            const poster = decodeURIComponent(this.dataset.poster);
                            const year = decodeURIComponent(this.dataset.year);
                            const plot = decodeURIComponent(this.dataset.plot);
                            const rating = decodeURIComponent(this.dataset.rating);
                            
                            // Open trailer in trailer.html page
                            window.open(`trailer.html?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&movieId=${movieId}&poster=${encodeURIComponent(poster)}&year=${encodeURIComponent(year)}&plot=${encodeURIComponent(plot)}&rating=${encodeURIComponent(rating)}`, '_blank');
                        });
                    });
                }
            } else {
                // No trailers found, show message
                if (loader) loader.style.display = 'none';
                if (carousel) {
                    carousel.innerHTML = `
                        <div class="w-full h-full flex items-center justify-center">
                            <div class="text-center p-8">
                                <i class="fas fa-film text-4xl text-gray-500 mb-4"></i>
                                <p class="text-gray-400">No featured trailers available at the moment</p>
                            </div>
                        </div>
                    `;
                }
            }
        } catch (error) {
            console.error('Error initializing featured trailers:', error);
            // Hide loader and show error message
            const loader = document.getElementById('trailersLoader');
            const carousel = document.getElementById('trailersCarousel');
            
            if (loader) loader.style.display = 'none';
            if (carousel) {
                carousel.innerHTML = `
                    <div class="w-full h-full flex items-center justify-center">
                        <div class="text-center p-8">
                            <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                            <p class="text-red-400">Failed to load featured trailers</p>
                        </div>
                    </div>
                `;
            }
        }
    }

    // Expose functions globally
    window.fetchTrailerForMovie = fetchTrailerForMovie;
    window.initializeFeaturedTrailers = initializeFeaturedTrailers;

    console.log('✅ Trailer functionality initialized');
    
    // Initialize featured trailers when DOM is loaded and main content is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            // Wait a bit more to ensure main content is loaded
            setTimeout(initializeFeaturedTrailers, 5000);
        });
    } else {
        // DOM is already loaded, wait a bit more to ensure main content is loaded
        setTimeout(initializeFeaturedTrailers, 5000);
    }
}
