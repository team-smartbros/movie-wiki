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
        // If we have a title but no ID, we need to search for the movie first
        if (!movieId && this && this.title) {
            console.log(`🔍 Searching for movie ID for title: ${this.title}`);
            try {
                // Search for the movie to get its ID
                const searchUrl = `${window.API_BASE || 'https://imdb.iamidiotareyoutoo.com'}/search?q=${encodeURIComponent(this.title)}`;
                console.log(`Search URL: ${searchUrl}`);
                
                let searchResponse = await fetchWithProxy(searchUrl);
                
                if (searchResponse.ok) {
                    const searchData = await searchResponse.json();
                    console.log(`Search results for ${this.title}:`, searchData);
                    
                    // Extract movie ID from search results
                    if (searchData.description && searchData.description.length > 0) {
                        // Find the best match
                        const bestMatch = searchData.description.find(result => 
                            result['#TITLE'] && result['#TITLE'].toLowerCase().includes(this.title.toLowerCase())
                        ) || searchData.description[0];
                        
                        if (bestMatch && bestMatch['#IMDB_ID']) {
                            movieId = bestMatch['#IMDB_ID'];
                            console.log(`Found movie ID for ${this.title}: ${movieId}`);
                        }
                    }
                }
            } catch (searchError) {
                console.error(`Error searching for movie ${this.title}:`, searchError);
            }
        }
        
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
            const topData = data.top || {};
            
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
                                    thumbnail: trailerNode.thumbnail?.url || topData.primaryImage?.url || 'https://placehold.co/600x900?text=No+Image&font=opensans',
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
                            thumbnail: trailerNode.thumbnail?.url || topData.primaryImage?.url || 'https://placehold.co/600x900?text=No+Image&font=opensans',
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
                            thumbnail: trailerNode.thumbnail?.url || topData.primaryImage?.url || 'https://placehold.co/600x900?text=No+Image&font=opensans',
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
            
            // Check if a genre is currently selected
            let selectedGenre = null;
            const activeGenrePill = document.querySelector('.genre-pill.active');
            if (activeGenrePill) {
                selectedGenre = activeGenrePill.getAttribute('data-genre');
                console.log(`🎬 Genre selected: ${selectedGenre}`);
            } else {
                // Also check for any active genre pill with different class structure
                const activePills = document.querySelectorAll('.genre-pill.bg-accent');
                if (activePills.length > 0) {
                    selectedGenre = activePills[0].getAttribute('data-genre');
                    console.log(`🎬 Genre selected (alternative method): ${selectedGenre}`);
                }
            }
            
            // Fetch movies using the same approach as homepage
            let movies = [];
            
            if (selectedGenre && selectedGenre !== 'all') {
                console.log(`📥 Fetching movies for genre: ${selectedGenre}`);
                movies = await fetchMoviesByGenre(selectedGenre);
            } else {
                console.log('📥 Fetching movies from all sections...');
                // Fetch movies from all sections (popular, latest, coming soon)
                movies = await fetchMoviesFromAllSections();
            }
            
            console.log('🎬 Movies for featured trailers:', movies);
            
            if (movies.length === 0) {
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
            
            // Display trailers for the featured movies
            await displayTrailersForMovies(movies, loader, carousel);
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
    
    // Fetch movies by genre (same approach as homepage)
    async function fetchMoviesByGenre(genre) {
        try {
            console.log(`📥 Fetching movies by genre: ${genre}`);
            
            // Map frontend genre names to API genre names
            const genreMap = {
                'action': 'action',
                'comedy': 'comedy',
                'drama': 'drama',
                'horror': 'horror',
                'sci-fi': 'sci_fi',
                'thriller': 'thriller',
                'romance': 'romance',
                'animation': 'animation'
            };
            
            const apiGenre = genreMap[genre] || genre;
            const apiUrl = `${window.SCRAPER_API_BASE || 'https://web-1-production.up.railway.app'}/by_genre/${apiGenre}`;
            console.log(`Using API URL: ${apiUrl}`);
            
            let response = await fetch(apiUrl);
            
            // If primary API fails, try fallback
            if (!response.ok) {
                console.log('Primary API failed, trying fallback...');
                const fallbackUrl = `${window.FALLBACK_SCRAPER_API_BASE || 'https://web-1-mykj.onrender.com'}/by_genre/${apiGenre}`;
                response = await fetch(fallbackUrl);
            }
            
            if (!response.ok) {
                throw new Error(`API returned ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log(`✅ API Response for ${genre}:`, data);
            
            if (data.items && data.items.length > 0) {
                // Extract titles and create movie objects - get up to 6 for genre selection
                const movies = data.items.slice(0, 6).map(item => ({
                    title: item.title.replace(/^\d+\.\s*/, ''),
                    id: item.imdb_id || '',
                    year: item.release || '',
                    rating: '',
                    image: item.image || ''
                }));
                
                console.log('Extracted genre movies:', movies);
                return movies;
            }
            
            return [];
        } catch (error) {
            console.error(`Error fetching movies by genre ${genre}:`, error);
            return [];
        }
    }
    
    // Fetch movies from all sections (popular, latest, coming soon)
    async function fetchMoviesFromAllSections() {
        try {
            console.log('📥 Fetching movies from all sections...');
            
            // Fetch all data in parallel to improve performance
            const [
                popularResult,
                latestResult,
                comingSoonResult
            ] = await Promise.allSettled([
                fetchPopularMoviesSection(),
                fetchLatestMoviesSection(),
                fetchComingSoonMoviesSection()
            ]);
            
            console.log('All section results:', {
                popularResult,
                latestResult,
                comingSoonResult
            });
            
            // Combine movies from all sections
            const allMovies = [];
            
            if (popularResult.status === 'fulfilled' && popularResult.value) {
                allMovies.push(...popularResult.value.slice(0, 2)); // Take first 2
            }
            
            if (latestResult.status === 'fulfilled' && latestResult.value) {
                allMovies.push(...latestResult.value.slice(0, 2)); // Take first 2
            }
            
            if (comingSoonResult.status === 'fulfilled' && comingSoonResult.value) {
                allMovies.push(...comingSoonResult.value.slice(0, 2)); // Take first 2
            }
            
            console.log(`🎬 Total movies from all sections: ${allMovies.length}`);
            return allMovies;
        } catch (error) {
            console.error('Error fetching movies from all sections:', error);
            return [];
        }
    }
    
    // Fetch popular movies section (same approach as homepage)
    async function fetchPopularMoviesSection() {
        try {
            console.log('📥 Fetching popular movies section...');
            let response = await fetch(`${window.SCRAPER_API_BASE || 'https://web-1-production.up.railway.app'}/popular?page=1`);
            
            // If primary API fails, try fallback
            if (!response.ok) {
                console.log('Primary API failed, trying fallback...');
                response = await fetch(`${window.FALLBACK_SCRAPER_API_BASE || 'https://web-1-mykj.onrender.com'}/popular?page=1`);
            }
            
            const data = await response.json();
            console.log('Scraper API response for popular:', data);
            
            if (data.items) {
                // Extract titles - skip first 5, get next 5
                const movies = data.items.slice(5, 10).map(item => ({
                    title: item.title.replace(/^\d+\.\s*/, ''),
                    id: item.imdb_id || '',
                    year: '',
                    rating: '',
                    image: item.image || ''
                }));
                console.log('Extracted popular movies:', movies);
                
                return movies;
            }
            
            return [];
        } catch (error) {
            console.error('Error fetching popular movies section:', error);
            return [];
        }
    }
    
    // Fetch latest movies section (same approach as homepage)
    async function fetchLatestMoviesSection() {
        try {
            console.log('📥 Fetching latest movies section...');
            let response = await fetch(`${window.SCRAPER_API_BASE || 'https://web-1-production.up.railway.app'}/popular?page=1`);
            
            // If primary API fails, try fallback
            if (!response.ok) {
                console.log('Primary API failed, trying fallback...');
                response = await fetch(`${window.FALLBACK_SCRAPER_API_BASE || 'https://web-1-mykj.onrender.com'}/popular?page=1`);
            }
            
            const data = await response.json();
            console.log('Scraper API response for latest:', data);
            
            if (data.items) {
                // Extract titles - take a different slice for "latest"
                const movies = data.items.slice(10, 15).map(item => ({
                    title: item.title.replace(/^\d+\.\s*/, ''),
                    id: item.imdb_id || '',
                    year: '',
                    rating: '',
                    image: item.image || ''
                }));
                console.log('Extracted latest movies:', movies);
                
                return movies;
            }
            
            return [];
        } catch (error) {
            console.error('Error fetching latest movies section:', error);
            return [];
        }
    }
    
    // Fetch coming soon movies section (same approach as homepage)
    async function fetchComingSoonMoviesSection() {
        try {
            console.log('📥 Fetching coming soon movies section...');
            let response = await fetch(`${window.SCRAPER_API_BASE || 'https://web-1-production.up.railway.app'}/upcoming?page=1`);
            
            // If primary API fails, try fallback
            if (!response.ok) {
                console.log('Primary API failed, trying fallback...');
                response = await fetch(`${window.FALLBACK_SCRAPER_API_BASE || 'https://web-1-mykj.onrender.com'}/upcoming?page=1`);
            }
            
            const data = await response.json();
            console.log('Scraper API response for coming soon:', data);
            
            if (data.items) {
                // Extract titles - remove numbering prefix
                const movies = data.items.slice(0, 5).map(item => ({
                    title: item.title.replace(/^\d+\.\s*/, ''),
                    id: item.imdb_id || '',
                    year: item.release || '',
                    rating: '',
                    image: item.image || ''
                }));
                console.log('Extracted coming soon movies:', movies);
                
                return movies;
            }
            
            return [];
        } catch (error) {
            console.error('Error fetching coming soon movies section:', error);
            return [];
        }
    }

    // Helper function to display trailers for movies
    async function displayTrailersForMovies(featuredMovies, loader, carousel) {
        try {
            console.log('🎬 Displaying trailers for movies:', featuredMovies);
            
            // For movies that only have titles, we need to search for their IDs first
            const moviesWithIds = [];
            
            for (const movie of featuredMovies) {
                if (movie.id) {
                    // Already have ID
                    moviesWithIds.push(movie);
                } else if (movie.title) {
                    // Need to search for ID
                    console.log(`🔍 Searching for ID for movie: ${movie.title}`);
                    try {
                        const searchUrl = `${window.API_BASE || 'https://imdb.iamidiotareyoutoo.com'}/search?q=${encodeURIComponent(movie.title)}`;
                        console.log(`Search URL: ${searchUrl}`);
                        
                        let searchResponse = await fetchWithProxy(searchUrl);
                        
                        if (searchResponse.ok) {
                            const searchData = await searchResponse.json();
                            console.log(`Search results for ${movie.title}:`, searchData);
                            
                            // Extract movie ID from search results
                            if (searchData.description && searchData.description.length > 0) {
                                // Find the best match
                                const bestMatch = searchData.description.find(result => 
                                    result['#TITLE'] && result['#TITLE'].toLowerCase().includes(movie.title.toLowerCase())
                                ) || searchData.description[0];
                                
                                if (bestMatch && bestMatch['#IMDB_ID']) {
                                    moviesWithIds.push({
                                        ...movie,
                                        id: bestMatch['#IMDB_ID'],
                                        year: bestMatch['#YEAR'] || movie.year || '',
                                        image: bestMatch['#IMG_POSTER'] || movie.image || ''
                                    });
                                    console.log(`Found ID for ${movie.title}: ${bestMatch['#IMDB_ID']}`);
                                }
                            }
                        }
                    } catch (searchError) {
                        console.error(`Error searching for movie ${movie.title}:`, searchError);
                    }
                }
            }
            
            console.log('Movies with IDs:', moviesWithIds);
            
            if (moviesWithIds.length === 0) {
                console.log('No movies with valid IDs found');
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
            
            // Fetch trailers for featured movies
            const trailerPromises = moviesWithIds.map(movie => 
                fetchTrailerForMovie.call(movie, movie.id) // Pass movie context for title-based search
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
                        const movie = moviesWithIds.find(m => m.id === trailer.movieId) || {};
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
        const scrollLeftBtn = document.getElementById('scrollLeftIndicator');
        const scrollRightBtn = document.getElementById('scrollRightIndicator');
        
        if (!carousel || !scrollLeftBtn || !scrollRightBtn) {
            console.log('Carousel navigation elements not found');
            return;
        }
        
        // Scroll left
        scrollLeftBtn.addEventListener('click', () => {
            carousel.scrollBy({ left: -carousel.offsetWidth, behavior: 'smooth' });
        });
        
        // Scroll right
        scrollRightBtn.addEventListener('click', () => {
            carousel.scrollBy({ left: carousel.offsetWidth, behavior: 'smooth' });
        });
        
        // Auto-scroll functionality
        let autoScrollInterval;
        let isHovering = false;
        
        function startAutoScroll() {
            if (isHovering) return;
            
            autoScrollInterval = setInterval(() => {
                if (carousel.scrollLeft + carousel.offsetWidth >= carousel.scrollWidth) {
                    // Reached the end, scroll back to start
                    carousel.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    // Scroll to next item
                    carousel.scrollBy({ left: carousel.offsetWidth, behavior: 'smooth' });
                }
            }, 5000); // Auto-scroll every 5 seconds
        }
        
        function stopAutoScroll() {
            if (autoScrollInterval) {
                clearInterval(autoScrollInterval);
                autoScrollInterval = null;
            }
        }
        
        // Mouse enter/leave events to pause auto-scroll on hover
        carousel.addEventListener('mouseenter', () => {
            isHovering = true;
            stopAutoScroll();
        });
        
        carousel.addEventListener('mouseleave', () => {
            isHovering = false;
            stopAutoScroll();
            startAutoScroll();
        });
        
        // Start auto-scroll initially
        startAutoScroll();
        
        console.log('✅ Carousel navigation initialized');
    }

    // Expose functions globally
    window.fetchTrailerForMovie = fetchTrailerForMovie;
    window.initializeFeaturedTrailers = initializeFeaturedTrailers;

    console.log('✅ Trailer functionality initialized');

    // Add event listener for genre changes
    function setupGenreChangeListener() {
        // Listen for clicks on genre pills
        document.addEventListener('click', function(event) {
            if (event.target.classList.contains('genre-pill') || event.target.closest('.genre-pill')) {
                const genrePill = event.target.classList.contains('genre-pill') ? event.target : event.target.closest('.genre-pill');
                const selectedGenre = genrePill.getAttribute('data-genre');
                
                if (selectedGenre) {
                    console.log(`🎬 Genre changed to: ${selectedGenre}`);
                    // Reinitialize featured trailers after a short delay to allow content to load
                    setTimeout(() => {
                        if (typeof window.initializeFeaturedTrailers === 'function') {
                            window.initializeFeaturedTrailers();
                        }
                    }, 2000);
                }
            }
        });
    }

    // Initialize featured trailers when DOM is loaded and main content is ready
    // Add safety check for DOM ready state
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setupGenreChangeListener();
            // Wait a bit more to ensure main content is loaded
            setTimeout(initializeFeaturedTrailers, 3000);
        });
    } else {
        // DOM is already loaded, wait a bit more to ensure main content is loaded
        setupGenreChangeListener();
        setTimeout(initializeFeaturedTrailers, 3000);
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