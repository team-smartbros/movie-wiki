// trailer.js - Trailer functionality for Movie Wiki
// Check if script already loaded to prevent duplicate declarations
if (window.trailerJSLoaded) {
    console.log('✅ trailer.js already loaded, skipping initialization');
} else {
    console.log('✅ trailer.js loaded');
    window.trailerJSLoaded = true;

    // Ensure CORS_PROXIES is defined
    if (!window.CORS_PROXIES) {
        window.CORS_PROXIES = [
            'https://corsproxy.io/?',
            'https://api.allorigins.win/raw?url=',
            'https://api.codetabs.com/v1/proxy?quest=',
            'https://thingproxy.freeboard.io/fetch/',
            'https://cors-anywhere.herokuapp.com/',
            'https://crossorigin.me/',
            'https://jsonp.afeld.me/?url=',
            'https://yacdn.org/proxy/',
            'https://api.proxycrawl.com/?url=',
            'https://cors.bridged.cc/',
            'https://api.shrtco.de/v2/info?url=',
            'https://api.linkpreview.net/?key=12345&q='
        ];
    }

    // Use the existing API_BASE and CORS_PROXIES from script.js instead of redeclaring them
    let currentProxyIndex = 0;
    let proxySuccessCount = Array(window.CORS_PROXIES?.length || 12).fill(0);
    let proxyFailCount = Array(window.CORS_PROXIES?.length || 12).fill(0);

    // Enhanced proxy selection with performance tracking (same as details.html)
    function selectBestProxy() {
        // Handle case where CORS_PROXIES might not be defined yet
        const proxies = window.CORS_PROXIES || [
            'https://corsproxy.io/?',
            'https://api.allorigins.win/raw?url=',
            'https://api.codetabs.com/v1/proxy?quest=',
            'https://thingproxy.freeboard.io/fetch/',
            'https://cors-anywhere.herokuapp.com/'
        ];
        
        // Calculate success rate for each proxy
        const proxyScores = proxies.map((_, index) => {
            const totalAttempts = (proxySuccessCount[index] || 0) + (proxyFailCount[index] || 0);
            if (totalAttempts === 0) return 0.5; // Default score for untested proxies
            return (proxySuccessCount[index] || 0) / totalAttempts;
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
        // Add safety check for trailerCache
        if (window.trailerCache && typeof window.trailerCache.get === 'function') {
            const cachedTrailer = window.trailerCache.get(movieId);
            if (cachedTrailer) {
                console.log(`✅ Using cached trailer for movie: ${movieId}`);
                return cachedTrailer;
            }
        } else {
            console.log('⚠️ Trailer cache not available, skipping cache check');
        }
        
        try {
            console.log(`📥 Fetching trailer for movie: ${movieId}`);
            
            // Use the same API as details page
            const url = `${window.API_BASE || 'https://imdb.iamidiotareyoutoo.com'}/search?tt=${movieId}`;
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
            
            // Try to get trailer from the main movie data as a last resort
            try {
                console.log(`Attempting to fetch trailer from main movie API for ${movieId}`);
                const mainUrl = `${window.API_BASE || 'https://imdb.iamidiotareyoutoo.com'}/movies/${movieId}`;
                let mainResponse = await fetchWithProxy(mainUrl);
                
                if (mainResponse.ok) {
                    const mainData = await mainResponse.json();
                    console.log(`Main API Response for ${movieId}:`, JSON.stringify(mainData, null, 2));
                    
                    // Try to extract trailer from main data
                    if (mainData.trailer && mainData.trailer.url) {
                        console.log(`Found trailer in main data for ${movieId}:`, mainData.trailer.url);
                        const trailerData = {
                            url: mainData.trailer.url,
                            title: mainData.trailer.title || mainData.title || 'Trailer',
                            type: 'direct',
                            thumbnail: mainData.image || 'https://placehold.co/600x900?text=No+Image&font=opensans',
                            movieId: movieId
                        };
                        
                        // Cache the trailer data for faster loading next time
                        if (window.trailerCache) {
                            window.trailerCache.set(movieId, trailerData);
                        }
                        
                        return trailerData;
                    }
                }
            } catch (mainError) {
                console.error(`Error fetching trailer from main API for movie ${movieId}:`, mainError);
            }
            
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
            // We'll wait up to 15 seconds for content to load
            let attempts = 0;
            const maxAttempts = 30; // 15 seconds with 500ms intervals
            let hasContent = false;
            
            while (attempts < maxAttempts && !hasContent) {
                // Check if any of the main containers have content
                const popularContainer = document.getElementById('popularContainer');
                const latestContainer = document.getElementById('latestContainer');
                const comingSoonContainer = document.getElementById('comingSoonContainer');
                
                // Debug logging
                console.log(`🔍 Checking containers - Popular: ${!!popularContainer}, Latest: ${!!latestContainer}, Coming Soon: ${!!comingSoonContainer}`);
                
                if (popularContainer) {
                    console.log(`📊 Popular container children: ${popularContainer.children.length}`);
                    console.log(`📊 Popular container innerHTML length: ${popularContainer.innerHTML.length}`);
                }
                
                if (latestContainer) {
                    console.log(`📊 Latest container children: ${latestContainer.children.length}`);
                    console.log(`📊 Latest container innerHTML length: ${latestContainer.innerHTML.length}`);
                }
                
                if (comingSoonContainer) {
                    console.log(`📊 Coming Soon container children: ${comingSoonContainer.children.length}`);
                    console.log(`📊 Coming Soon container innerHTML length: ${comingSoonContainer.innerHTML.length}`);
                }
                
                // Check if any container has movie cards
                const hasPopularContent = popularContainer && popularContainer.querySelectorAll('.movie-card').length > 0;
                const hasLatestContent = latestContainer && latestContainer.querySelectorAll('.movie-card').length > 0;
                const hasComingSoonContent = comingSoonContainer && comingSoonContainer.querySelectorAll('.movie-card').length > 0;
                
                // Also check if containers have error messages (which means loading completed)
                const hasPopularError = popularContainer && popularContainer.querySelector('.text-red-500');
                const hasLatestError = latestContainer && latestContainer.querySelector('.text-red-500');
                const hasComingSoonError = comingSoonContainer && comingSoonContainer.querySelector('.text-red-500');
                
                hasContent = hasPopularContent || hasLatestContent || hasComingSoonContent || 
                            hasPopularError || hasLatestError || hasComingSoonError;
                
                console.log(`🔄 Content check - Popular: ${hasPopularContent}, Latest: ${hasLatestContent}, Coming Soon: ${hasComingSoonContent}`);
                console.log(`🔄 Error check - Popular: ${!!hasPopularError}, Latest: ${!!hasLatestError}, Coming Soon: ${!!hasComingSoonError}`);
                console.log(`🔄 Has content: ${hasContent}`);
                
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
            
            console.log(`🎬 Found movie cards - Popular: ${popularMovies.length}, Latest: ${latestMovies.length}, Coming Soon: ${comingSoonMovies.length}`);
            
            // Combine all movie elements
            const allMovieElements = [...popularMovies, ...latestMovies, ...comingSoonMovies];
            
            // If we still don't have movie elements, try to get them from the container content directly
            // This handles cases where the content is loaded but not in movie-card elements
            if (allMovieElements.length === 0) {
                console.log('No movie cards found, trying to extract from container content...');
                
                // Try to extract movies from container content
                const extractMoviesFromContainer = (containerId, maxCount) => {
                    const container = document.getElementById(containerId);
                    if (!container) return [];
                    
                    // Look for movie elements that might not have the movie-card class
                    const movieElements = Array.from(container.querySelectorAll('[data-movie-id]')).slice(0, maxCount);
                    console.log(`🔍 Found ${movieElements.length} elements with data-movie-id in ${containerId}`);
                    return movieElements;
                };
                
                const popularMoviesAlt = extractMoviesFromContainer('popularContainer', 2);
                const latestMoviesAlt = extractMoviesFromContainer('latestContainer', 2);
                const comingSoonMoviesAlt = extractMoviesFromContainer('comingSoonContainer', 2);
                
                const allMovieElementsAlt = [...popularMoviesAlt, ...latestMoviesAlt, ...comingSoonMoviesAlt];
                
                if (allMovieElementsAlt.length > 0) {
                    console.log('Found alternative movie elements:', allMovieElementsAlt.length);
                    // Extract movie data from alternative elements
                    const featuredMovies = allMovieElementsAlt.map(element => {
                        const titleElement = element.querySelector('h4') || 
                                           element.querySelector('.font-bold') || 
                                           element.querySelector('[class*="title"]') || 
                                           element.querySelector('*');
                        const title = titleElement ? titleElement.textContent.trim() : '';
                        
                        const yearElement = element.querySelector('p') || 
                                          element.querySelector('[class*="year"]') || 
                                          element.querySelector(':nth-child(2)');
                        const year = yearElement ? yearElement.textContent.trim() : '';
                        
                        const ratingElement = element.querySelector('[class*="rating"]') || 
                                            element.querySelector('[class*="text"]') || 
                                            element.querySelector(':nth-child(3)');
                        const rating = ratingElement ? ratingElement.textContent.trim() : '';
                        
                        const imageElement = element.querySelector('img');
                        const image = imageElement ? imageElement.src : '';
                        
                        const movieId = element.dataset.movieId || '';
                        
                        console.log(`🎬 Extracted movie - Title: ${title}, Year: ${year}, Rating: ${rating}, Image: ${!!image}, ID: ${movieId}`);
                        
                        return { title, year, rating, image, id: movieId };
                    }).filter(movie => movie.id && movie.title); // Filter out incomplete movies
                    
                    console.log('Alternative featured movies:', featuredMovies);
                    
                    if (featuredMovies.length > 0) {
                        // Proceed with fetching trailers for these movies
                        await displayTrailersForMovies(featuredMovies, loader, carousel);
                        return;
                    }
                }
            }
            
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
                const titleElement = element.querySelector('.movie-title') || 
                                   element.querySelector('h4') || 
                                   element.querySelector('.font-bold') || 
                                   element.querySelector('*');
                const title = titleElement ? titleElement.textContent.trim() : '';
                
                const yearElement = element.querySelector('.movie-year') || 
                                  element.querySelector('p:not([class*="text"])') || 
                                  element.querySelector(':nth-child(2)');
                const year = yearElement ? yearElement.textContent.trim() : '';
                
                const ratingElement = element.querySelector('.movie-rating') || 
                                    element.querySelector('[class*="rating"]') || 
                                    element.querySelector('[class*="text"]') || 
                                    element.querySelector(':nth-child(3)');
                const rating = ratingElement ? ratingElement.textContent.trim() : '';
                
                const imageElement = element.querySelector('.movie-poster') || 
                                   element.querySelector('img');
                const image = imageElement ? imageElement.src : '';
                
                const movieId = element.dataset.movieId || '';
                
                console.log(`🎬 Extracted movie card - Title: ${title}, Year: ${year}, Rating: ${rating}, Image: ${!!image}, ID: ${movieId}`);
                
                return { title, year, rating, image, id: movieId };
            }).filter(movie => movie.id && movie.title); // Filter out incomplete movies
            
            console.log('Featured movies:', featuredMovies);
            
            if (featuredMovies.length === 0) {
                console.log('No valid movies with IDs found for featured trailers');
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
            
            // Display trailers for the featured movies
            await displayTrailersForMovies(featuredMovies, loader, carousel);
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
    
    // Helper function to display trailers for movies
    async function displayTrailersForMovies(featuredMovies, loader, carousel) {
        try {
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
                    
                    // Initialize carousel navigation
                    initializeCarouselNavigation();
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
            console.error('Error displaying trailers:', error);
            // Hide loader and show error message
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
    
    // Initialize carousel navigation functionality
    function initializeCarouselNavigation() {
        const carousel = document.getElementById('trailersCarousel');
        const scrollLeftBtn = document.getElementById('scrollLeftBtn');
        const scrollRightBtn = document.getElementById('scrollRightBtn');
        
        if (!carousel || !scrollLeftBtn || !scrollRightBtn) {
            console.log('Carousel navigation elements not found');
            return;
        }
        
        // Show/hide navigation buttons based on scroll position
        function updateNavigationButtons() {
            const scrollLeft = carousel.scrollLeft;
            const scrollWidth = carousel.scrollWidth;
            const clientWidth = carousel.clientWidth;
            
            // Show left button if we can scroll left
            if (scrollLeft > 0) {
                scrollLeftBtn.classList.add('pointer-events-auto');
                scrollLeftBtn.querySelector('button').classList.remove('opacity-0');
            } else {
                scrollLeftBtn.classList.remove('pointer-events-auto');
                scrollLeftBtn.querySelector('button').classList.add('opacity-0');
            }
            
            // Show right button if we can scroll right
            if (scrollLeft + clientWidth < scrollWidth) {
                scrollRightBtn.classList.add('pointer-events-auto');
                scrollRightBtn.querySelector('button').classList.remove('opacity-0');
            } else {
                scrollRightBtn.classList.remove('pointer-events-auto');
                scrollRightBtn.querySelector('button').classList.add('opacity-0');
            }
        }
        
        // Scroll left
        scrollLeftBtn.querySelector('button').addEventListener('click', () => {
            carousel.scrollBy({ left: -carousel.clientWidth, behavior: 'smooth' });
        });
        
        // Scroll right
        scrollRightBtn.querySelector('button').addEventListener('click', () => {
            carousel.scrollBy({ left: carousel.clientWidth, behavior: 'smooth' });
        });
        
        // Update navigation buttons on scroll
        carousel.addEventListener('scroll', updateNavigationButtons);
        
        // Initial update
        setTimeout(updateNavigationButtons, 100);
        
        // Update on window resize
        window.addEventListener('resize', updateNavigationButtons);
        
        console.log('✅ Carousel navigation initialized');
    }

    // Expose functions globally
    window.fetchTrailerForMovie = fetchTrailerForMovie;
    window.initializeFeaturedTrailers = initializeFeaturedTrailers;

    console.log('✅ Trailer functionality initialized');
    
    // Initialize featured trailers when DOM is loaded and main content is ready
    // Add safety check for DOM ready state
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

// Add safety check for trailer cache initialization
if (!window.trailerCache) {
    console.warn('⚠️ Trailer cache not initialized, creating fallback cache');
    window.trailerCache = {
        get: function(movieId) { return null; },
        set: function(movieId, data) { console.log('Cache not available, skipping cache set for', movieId); }
    };
}