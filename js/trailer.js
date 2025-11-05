// Trailer Carousel System
// Handles fetching, displaying, and playing movie trailers with auto-scrolling

console.log('🎬 Initializing trailer carousel system...');

// Global variables
let trailerCarousel = null;
let currentSlide = 0;
let isLoading = false;
let autoScrollInterval = null;
let currentGenre = 'all'; // Default to showing mixed content

// Debounce function to limit expensive operations
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function to limit execution rate
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Initialize trailer carousel system
function initTrailerCarousel() {
    console.log('🔄 Initializing trailer carousel...');
    
    // Check if API constants are available
    if (typeof window.API_BASE === 'undefined' || typeof window.SCRAPER_API_BASE === 'undefined') {
        console.warn('⚠️ API constants not available yet, waiting...');
        setTimeout(initTrailerCarousel, 100);
        return;
    }
    
    // Make sure all API constants are properly set
    if (!window.API_BASE || window.API_BASE === '' || 
        !window.SCRAPER_API_BASE || window.SCRAPER_API_BASE === '' ||
        !window.FALLBACK_SCRAPER_API_BASE || window.FALLBACK_SCRAPER_API_BASE === '') {
        console.warn('⚠️ API constants not properly initialized, waiting...');
        setTimeout(initTrailerCarousel, 100);
        return;
    }
    
    console.log('✅ API constants available, initializing trailer carousel');
    console.log('API_BASE:', window.API_BASE);
    initializeTrailerCarousel();
}

// Make sure the DOM is loaded before initializing
function waitForDOMAndInit() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            // Add a small delay to ensure main content has time to load
            setTimeout(initTrailerCarousel, 500);
        });
    } else {
        // DOM is already loaded
        setTimeout(initTrailerCarousel, 500);
    }
}

// Initialize trailer carousel
function initializeTrailerCarousel() {
    trailerCarousel = document.getElementById('trailersCarousel');
    
    if (!trailerCarousel) {
        console.warn('⚠️ Trailer carousel container not found, retrying in 1 second...');
        setTimeout(initializeTrailerCarousel, 1000);
        return;
    }
    
    console.log('✅ Trailer carousel container found');
    
    // Start auto-scrolling
    startAutoScroll();
    
    // Add event listeners for user interaction (throttled)
    trailerCarousel.addEventListener('mouseenter', throttle(pauseAutoScroll, 200));
    trailerCarousel.addEventListener('mouseleave', throttle(resumeAutoScroll, 200));
    
    // Load initial trailers
    loadFeaturedTrailers();
}

// Load featured trailers
async function loadFeaturedTrailers() {
    // Prevent multiple simultaneous loads
    if (isLoading) {
        console.log('⏭️ Load already in progress, skipping...');
        return;
    }
    
    isLoading = true;
    console.log('📥 Loading featured trailers...');
    
    // Show loader
    const loader = document.getElementById('trailersLoader');
    if (loader) {
        loader.style.display = 'flex';
    }
    
    try {
        // Get the first 6 movies from the existing containers
        await fetchAndDisplayTrailers();
        
        // Hide loader when done
        if (loader) {
            loader.style.display = 'none';
        }
        
    } catch (error) {
        console.error('❌ Error loading featured trailers:', error);
        createPlaceholderTrailers();
        
        // Hide loader even on error
        if (loader) {
            loader.style.display = 'none';
        }
    } finally {
        isLoading = false;
    }
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
        let response = await fetch(url);
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

// Fetch and display real trailers
async function fetchAndDisplayTrailers() {
    console.log('📥 Fetching trailer data...');
    
    try {
        // Get movie data independently
        const movies = await getMoviesForTrailers();
        
        if (movies.length === 0) {
            console.log('📭 No movies found for trailers, showing placeholders');
            createPlaceholderTrailers();
            // Try again in a bit in case movies load later
            setTimeout(fetchAndDisplayTrailers, 1000);
            return;
        }
        
        // Display trailers
        await displayTrailers(movies);
        
    } catch (error) {
        console.error('❌ Error fetching trailer data:', error);
        createPlaceholderTrailers();
    }
}

// Get movies for trailers based on current genre
async function getMoviesForTrailers() {
    console.log(`📋 Getting movies for trailers (genre: ${currentGenre})`);
    
    // Fetch movies independently instead of relying on existing containers
    if (currentGenre === 'all') {
        // Get 2 movies from each section (popular, latest, coming soon)
        console.log('📥 Fetching popular movies...');
        const popularMovies = await fetchMoviesBySection('popular', 2);
        console.log('📥 Fetching latest movies...');
        const latestMovies = await fetchMoviesBySection('latest', 2);
        console.log('📥 Fetching coming soon movies...');
        const comingSoonMovies = await fetchMoviesBySection('comingSoon', 2);
        
        console.log('📊 Fetched movies:', {popularMovies, latestMovies, comingSoonMovies});
        
        const allMovies = [...popularMovies, ...latestMovies, ...comingSoonMovies];
        console.log(`✅ Total movies for trailers: ${allMovies.length}`);
        return allMovies;
    } else {
        // Get first 6 movies for the selected genre
        console.log(`📥 Fetching ${currentGenre} movies...`);
        const genreMovies = await fetchMoviesByGenre(currentGenre, 6);
        console.log(`📊 Fetched ${currentGenre} movies:`, genreMovies);
        return genreMovies;
    }
}

// Fetch movies by section (popular, latest, coming soon)
async function fetchMoviesBySection(section, count) {
    try {
        console.log(`📥 Fetching ${count} ${section} movies`);
        
        let apiUrl;
        switch(section) {
            case 'popular':
                apiUrl = `${window.SCRAPER_API_BASE}/popular`;
                break;
            case 'latest':
                apiUrl = `${window.SCRAPER_API_BASE}/popular`;
                break;
            case 'comingSoon':
                apiUrl = `${window.SCRAPER_API_BASE}/upcoming`;
                break;
            default:
                apiUrl = `${window.SCRAPER_API_BASE}/popular`;
        }
        
        console.log(`API URL for ${section}:`, apiUrl);
        
        // Try primary API first
        let response = await fetch(apiUrl);
        console.log(`Primary API response status for ${section}:`, response.status);
        
        // Log response headers for debugging
        console.log(`Primary API response headers for ${section}:`, [...response.headers.entries()]);
        
        // If primary API fails, try fallback
        if (!response.ok) {
            console.log(`Primary API failed for ${section} with status ${response.status}, trying fallback API`);
            
            let fallbackUrl;
            switch(section) {
                case 'popular':
                case 'latest':
                    fallbackUrl = `${window.FALLBACK_SCRAPER_API_BASE}/popular`;
                    break;
                case 'comingSoon':
                    fallbackUrl = `${window.FALLBACK_SCRAPER_API_BASE}/upcoming`;
                    break;
                default:
                    fallbackUrl = `${window.FALLBACK_SCRAPER_API_BASE}/popular`;
            }
            
            console.log(`Fallback URL for ${section}:`, fallbackUrl);
            response = await fetch(fallbackUrl);
            console.log(`Fallback API response status for ${section}:`, response.status);
            console.log(`Fallback API response headers for ${section}:`, [...response.headers.entries()]);
        }
        
        if (!response.ok) {
            console.warn(`Failed to fetch ${section} movies with status ${response.status}`);
            // Return basic movie info even if we can't fetch details
            return Array(count).fill().map((_, i) => ({
                id: null,
                title: `${section} Movie ${i + 1}`,
                year: 'N/A',
                image: 'https://placehold.co/600x900?text=No+Image&font=opensans',
                rating: 'N/A',
                genre: 'Movie'
            }));
        }
        
        const data = await response.json();
        console.log(`API Response for ${section}:`, JSON.stringify(data, null, 2));
        
        // Check if data has items
        if (!data || !data.items || !Array.isArray(data.items)) {
            console.warn(`Invalid data structure for ${section} movies:`, data);
            // Return basic movie info even if we can't fetch details
            return Array(count).fill().map((_, i) => ({
                id: null,
                title: `${section} Movie ${i + 1}`,
                year: 'N/A',
                image: 'https://placehold.co/600x900?text=No+Image&font=opensans',
                rating: 'N/A',
                genre: 'Movie'
            }));
        }
        
        // Extract titles based on section
        let titles = [];
        let rawItems = [];
        if (data.items) {
            if (section === 'latest') {
                // For latest, get items 5-10 (next 5 after popular)
                rawItems = data.items.slice(5, 5 + count);
                titles = rawItems.map(item => {
                    // Remove numbering prefix if present
                    const title = item.title.replace(/^\d+\.\s*/, '');
                    console.log(`Extracted title for ${section}:`, title);
                    return title;
                });
            } else {
                // For popular and coming soon, get first 'count' items
                rawItems = data.items.slice(0, count);
                titles = rawItems.map(item => {
                    // Remove numbering prefix if present
                    const title = item.title.replace(/^\d+\.\s*/, '');
                    console.log(`Extracted title for ${section}:`, title);
                    return title;
                });
            }
        }
        
        console.log(`Extracted titles for ${section}:`, titles);
        console.log(`Raw items for ${section}:`, rawItems);
        
        // Fetch detailed movie information for each title
        const movies = [];
        for (let i = 0; i < Math.min(titles.length, count); i++) {
            console.log(`Fetching details for ${section} movie ${i + 1}/${Math.min(titles.length, count)}:`, titles[i]);
            
            // Try to get movie details from the raw item first
            const rawItem = rawItems[i];
            if (rawItem) {
                // Try to extract ID from the raw item with more flexible patterns
                let id = null;
                if (rawItem.id) {
                    id = rawItem.id;
                } else if (rawItem.url) {
                    // More flexible ID extraction
                    const idMatch = rawItem.url.match(/\/title\/(tt\d+)/);
                    if (idMatch) {
                        id = idMatch[1];
                    }
                } else if (rawItem.link) {
                    // Check for link property as well
                    const idMatch = rawItem.link.match(/\/title\/(tt\d+)/);
                    if (idMatch) {
                        id = idMatch[1];
                    }
                }
                
                // Create movie object from raw item data with better genre and year handling
                const movieFromRaw = {
                    id: id,
                    title: titles[i],
                    year: rawItem.year || rawItem.releaseYear || rawItem.ReleaseYear || new Date().getFullYear().toString(),
                    image: rawItem.image || rawItem.poster || rawItem.Poster || 'https://placehold.co/600x900?text=No+Image&font=opensans',
                    rating: rawItem.rating || rawItem.imdbRating || rawItem.Rating || 'N/A',
                    genre: rawItem.genre || rawItem.Genre || 'Movie'
                };

                // Improve genre formatting
                if (Array.isArray(movieFromRaw.genre)) {
                    movieFromRaw.genre = movieFromRaw.genre.join(', ');
                } else if (typeof movieFromRaw.genre === 'string') {
                    // Clean up genre string
                    movieFromRaw.genre = movieFromRaw.genre.replace(/\|/g, ', ');
                }

                // Ensure year is a string
                if (typeof movieFromRaw.year === 'number') {
                    movieFromRaw.year = movieFromRaw.year.toString();
                }

                console.log(`Movie from raw item ${i}:`, movieFromRaw);
                
                // If we have an ID, try to fetch more detailed info
                if (id) {
                    const detailedMovie = await fetchMovieDetailsByTitle(titles[i]);
                    if (detailedMovie && detailedMovie.id) {
                        movies.push(detailedMovie);
                    } else {
                        movies.push(movieFromRaw);
                    }
                } else {
                    // If no ID, use the raw item data
                    movies.push(movieFromRaw);
                }
            } else {
                // Fallback to fetching details by title
                const movie = await fetchMovieDetailsByTitle(titles[i]);
                if (movie) {
                    movies.push(movie);
                }
            }
            
            if (movies[movies.length - 1]) {
                console.log(`Successfully fetched details for ${section} movie:`, movies[movies.length - 1].title);
            } else {
                console.log(`Failed to fetch details for ${section} movie:`, titles[i]);
            }
        }
        
        console.log(`Fetched ${movies.length} movies for ${section}`);
        return movies;
        
    } catch (error) {
        console.error(`Error fetching ${section} movies:`, error);
        // Return basic movie info even if we encounter an error
        return Array(count).fill().map((_, i) => ({
            id: null,
            title: `${section} Movie ${i + 1}`,
            year: new Date().getFullYear().toString(),
            image: 'https://placehold.co/600x900?text=No+Image&font=opensans',
            rating: 'N/A',
            genre: 'Movie'
        }));
    }
}

// Fetch movies by genre
async function fetchMoviesByGenre(genre, count) {
    try {
        console.log(`📥 Fetching ${count} ${genre} movies`);
        
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
        const apiUrl = `${window.SCRAPER_API_BASE}/by_genre/${apiGenre}`;
        
        console.log(`API URL for ${genre}:`, apiUrl);
        
        // Try primary API first
        let response = await fetch(apiUrl);
        console.log(`Primary API response status for ${genre}:`, response.status);
        
        // Log response headers for debugging
        console.log(`Primary API response headers for ${genre}:`, [...response.headers.entries()]);
        
        // If primary API fails, try fallback
        if (!response.ok) {
            console.log(`Primary API failed for ${genre} with status ${response.status}, trying fallback API`);
            const fallbackUrl = `${window.FALLBACK_SCRAPER_API_BASE}/by_genre/${apiGenre}`;
            console.log(`Fallback URL for ${genre}:`, fallbackUrl);
            response = await fetch(fallbackUrl);
            console.log(`Fallback API response status for ${genre}:`, response.status);
            console.log(`Fallback API response headers for ${genre}:`, [...response.headers.entries()]);
        }
        
        if (!response.ok) {
            console.warn(`Failed to fetch ${genre} movies with status ${response.status}`);
            // Return basic movie info even if we can't fetch details
            return Array(count).fill().map((_, i) => ({
                id: null,
                title: `${genre} Movie ${i + 1}`,
                year: new Date().getFullYear().toString(),
                image: 'https://placehold.co/600x900?text=No+Image&font=opensans',
                rating: 'N/A',
                genre: genre
            }));
        }
        
        const data = await response.json();
        console.log(`API Response for ${genre}:`, JSON.stringify(data, null, 2));
        
        // Check if data has items
        if (!data || !data.items || !Array.isArray(data.items)) {
            console.warn(`Invalid data structure for ${genre} movies:`, data);
            // Return basic movie info even if we can't fetch details
            return Array(count).fill().map((_, i) => ({
                id: null,
                title: `${genre} Movie ${i + 1}`,
                year: new Date().getFullYear().toString(),
                image: 'https://placehold.co/600x900?text=No+Image&font=opensans',
                rating: 'N/A',
                genre: genre
            }));
        }
        
        // Extract titles
        let titles = [];
        let rawItems = [];
        if (data.items) {
            rawItems = data.items.slice(0, count);
            titles = rawItems.map(item => {
                // Remove numbering prefix if present
                const title = item.title.replace(/^\d+\.\s*/, '');
                console.log(`Extracted title for ${genre}:`, title);
                return title;
            });
        }
        
        console.log(`Extracted titles for ${genre}:`, titles);
        console.log(`Raw items for ${genre}:`, rawItems);
        
        // Fetch detailed movie information for each title
        const movies = [];
        for (let i = 0; i < Math.min(titles.length, count); i++) {
            console.log(`Fetching details for ${genre} movie ${i + 1}/${Math.min(titles.length, count)}:`, titles[i]);
            
            // Try to get movie details from the raw item first
            const rawItem = rawItems[i];
            if (rawItem) {
                // Try to extract ID from the raw item with more flexible patterns
                let id = null;
                if (rawItem.id) {
                    id = rawItem.id;
                } else if (rawItem.url) {
                    // More flexible ID extraction
                    const idMatch = rawItem.url.match(/\/title\/(tt\d+)/);
                    if (idMatch) {
                        id = idMatch[1];
                    }
                } else if (rawItem.link) {
                    // Check for link property as well
                    const idMatch = rawItem.link.match(/\/title\/(tt\d+)/);
                    if (idMatch) {
                        id = idMatch[1];
                    }
                }
                
                // Create movie object from raw item data
                const movieFromRaw = {
                    id: id,
                    title: titles[i],
                    year: rawItem.year || rawItem.releaseYear || new Date().getFullYear().toString(),
                    image: rawItem.image || rawItem.poster || 'https://placehold.co/600x900?text=No+Image&font=opensans',
                    rating: rawItem.rating || rawItem.imdbRating || 'N/A',
                    genre: genre
                };
                
                console.log(`Movie from raw item ${i}:`, movieFromRaw);
                
                // If we have an ID, try to fetch more detailed info
                if (id) {
                    const detailedMovie = await fetchMovieDetailsByTitle(titles[i]);
                    if (detailedMovie && detailedMovie.id) {
                        movies.push(detailedMovie);
                    } else {
                        movies.push(movieFromRaw);
                    }
                } else {
                    // If no ID, use the raw item data
                    movies.push(movieFromRaw);
                }
            } else {
                // Fallback to fetching details by title
                const movie = await fetchMovieDetailsByTitle(titles[i]);
                if (movie) {
                    movies.push(movie);
                }
            }
            
            if (movies[movies.length - 1]) {
                console.log(`Successfully fetched details for ${genre} movie:`, movies[movies.length - 1].title);
            } else {
                console.log(`Failed to fetch details for ${genre} movie:`, titles[i]);
            }
        }
        
        console.log(`Fetched ${movies.length} movies for ${genre}`);
        return movies;
        
    } catch (error) {
        console.error(`Error fetching ${genre} movies:`, error);
        // Return basic movie info even if we encounter an error
        return Array(count).fill().map((_, i) => ({
            id: null,
            title: `${genre} Movie ${i + 1}`,
            year: new Date().getFullYear().toString(),
            image: 'https://placehold.co/600x900?text=No+Image&font=opensans',
            rating: 'N/A',
            genre: genre
        }));
    }
}

// Fetch movie details by title
async function fetchMovieDetailsByTitle(title) {
    try {
        console.log(`📥 Fetching details for movie: ${title}`);
        
        // Search for the movie using the main API
        const searchUrl = `${window.API_BASE}/search?q=${encodeURIComponent(title)}`;
        console.log(`Search URL: ${searchUrl}`);
        
        // Try direct fetch first
        let response;
        try {
            response = await fetch(searchUrl);
            console.log(`Direct fetch response status: ${response.status}`);
            console.log(`Direct fetch response headers:`, [...response.headers.entries()]);
            
            if (!response.ok) {
                throw new Error(`Direct fetch failed with status ${response.status}`);
            }
        } catch (directError) {
            console.log(`Direct fetch failed for ${title}, trying with proxy`);
            // Try with proxy
            const proxy = 'https://corsproxy.io/?';
            const proxiedUrl = proxy + encodeURIComponent(searchUrl);
            console.log(`Proxy URL: ${proxiedUrl}`);
            response = await fetch(proxiedUrl);
            console.log(`Proxy fetch response status: ${response.status}`);
            console.log(`Proxy fetch response headers:`, [...response.headers.entries()]);
        }
        
        if (!response.ok) {
            console.warn(`Failed to fetch details for movie: ${title}`);
            // Return basic movie info even if we can't fetch details
            return {
                id: null,
                title: title,
                year: new Date().getFullYear().toString(),
                image: 'https://placehold.co/600x900?text=No+Image&font=opensans',
                rating: 'N/A',
                genre: 'Movie'
            };
        }
        
        const data = await response.json();
        console.log(`Movie details response for ${title}:`, JSON.stringify(data, null, 2));
        
        // Check if we have valid data
        if (!data) {
            console.warn(`No data received for movie: ${title}`);
            // Return basic movie info even if we can't fetch details
            return {
                id: null,
                title: title,
                year: new Date().getFullYear().toString(),
                image: 'https://placehold.co/600x900?text=No+Image&font=opensans',
                rating: 'N/A',
                genre: 'Movie'
            };
        }
        
        // Extract movie information
        const short = data.short || {};
        const top = data.top || {};
        
        console.log(`Short data for ${title}:`, short);
        console.log(`Top data for ${title}:`, top);
        
        // Get ID from URL if not directly available with more flexible patterns
        let id = short.id || top.id;
        if (!id && short.url) {
            const idMatch = short.url.match(/\/title\/(tt\d+)/);
            if (idMatch) {
                id = idMatch[1];
            }
        }
        
        // Try to extract ID from top data URL
        if (!id && top.url) {
            const idMatch = top.url.match(/\/title\/(tt\d+)/);
            if (idMatch) {
                id = idMatch[1];
            }
        }
        
        // If we still don't have an ID, try to get it from the IMDb URL in short data
        if (!id && short.imdburl) {
            const idMatch = short.imdburl.match(/\/title\/(tt\d+)/);
            if (idMatch) {
                id = idMatch[1];
            }
        }
        
        // Try to extract ID from the search URL pattern
        if (!id) {
            // Try to extract ID from various possible URL formats
            const possibleUrls = [short.url, top.url, short.imdburl].filter(url => url);
            for (const url of possibleUrls) {
                const idMatch = url.match(/\/title\/(tt\d+)/);
                if (idMatch) {
                    id = idMatch[1];
                    break;
                }
            }
        }
        
        // If we still don't have an ID, this movie data is incomplete
        if (!id) {
            console.warn(`No ID found for movie: ${title}`);
            // Even without an ID, we can still display basic movie info
            const movie = {
                id: null, // No ID available
                title: short.name || top.titleText?.text || title,
                year: short.year || top.releaseYear?.year || new Date().getFullYear().toString(),
                image: short.image || top.primaryImage?.url || 'https://placehold.co/600x900?text=No+Image&font=opensans',
                rating: short.rating || top.ratingsSummary?.aggregateRating || 'N/A',
                genre: short.genre?.join(', ') || 'Movie'
            };
            
            // Improve genre formatting
            if (movie.genre !== 'Movie' && Array.isArray(movie.genre)) {
                movie.genre = movie.genre.join(', ');
            } else if (movie.genre !== 'Movie' && typeof movie.genre === 'string') {
                // Clean up genre string
                movie.genre = movie.genre.replace(/\|/g, ', ');
            }
            
            // Ensure year is a string
            if (typeof movie.year === 'number') {
                movie.year = movie.year.toString();
            }
            
            return movie;
        }
        
        const movie = {
            id: id,
            title: short.name || top.titleText?.text || title,
            year: short.year || top.releaseYear?.year || new Date().getFullYear().toString(),
            image: short.image || top.primaryImage?.url || 'https://placehold.co/600x900?text=No+Image&font=opensans',
            rating: short.rating || top.ratingsSummary?.aggregateRating || 'N/A',
            genre: short.genre?.join(', ') || 'Movie'
        };
        
        // Improve genre formatting
        if (movie.genre !== 'Movie' && Array.isArray(movie.genre)) {
            movie.genre = movie.genre.join(', ');
        } else if (movie.genre !== 'Movie' && typeof movie.genre === 'string') {
            // Clean up genre string
            movie.genre = movie.genre.replace(/\|/g, ', ');
        }
        
        // Ensure year is a string
        if (typeof movie.year === 'number') {
            movie.year = movie.year.toString();
        }
        
        return movie;
        
    } catch (error) {
        console.error(`Error fetching details for movie ${title}:`, error);
        // Return basic movie info even if we encounter an error
        return {
            id: null,
            title: title,
            year: new Date().getFullYear().toString(),
            image: 'https://placehold.co/600x900?text=No+Image&font=opensans',
            rating: 'N/A',
            genre: 'Movie'
        };
    }
}

// Display trailers in carousel
async function displayTrailers(movies) {
    console.log('📺 Displaying trailers...');
    console.log('Movies to display:', movies);
    
    const trailerContainer = document.getElementById('trailersCarousel');
    if (!trailerContainer) {
        console.error('❌ Trailer container not found');
        return;
    }
    
    // Clear existing content
    trailerContainer.innerHTML = '';
    
    // Check if we have movies to display
    if (!movies || movies.length === 0) {
        console.log('No movies to display, showing placeholders');
        createPlaceholderTrailers();
        return;
    }
    
    // Create trailer items
    const fragment = document.createDocumentFragment();
    
    for (let i = 0; i < movies.length; i++) {
        const movie = movies[i];
        console.log(`Processing movie ${i}:`, movie);
        
        // Validate movie data
        if (!movie || !movie.title) {
            console.log(`Skipping invalid movie at index ${i}`);
            continue;
        }
        
        const trailerItem = document.createElement('div');
        trailerItem.className = 'trailer-item snap-start';
        trailerItem.setAttribute('data-index', i);
        
        // Fetch trailer data with caching (only if we have a movie ID)
        let trailerInfo = null;
        if (movie.id) {
            console.log(`Fetching trailer for movie ${i} with ID: ${movie.id}`);
            trailerInfo = await fetchTrailerForMovie(movie.id);
            console.log(`Trailer info for movie ${i}:`, trailerInfo);
        } else {
            console.log(`No ID for movie ${i}, skipping trailer fetch`);
        }
        
        // Store trailer data for later use
        if (trailerInfo) {
            window.trailerDataStore[i] = {
                url: trailerInfo.url,
                title: trailerInfo.title,
                type: trailerInfo.type,
                thumbnail: trailerInfo.thumbnail,
                movie: movie
            };
        }
        
        // Create trailer item HTML
        // Always show the play button for better UX
        const playButtonHtml = 
            `<button class="trailer-control-btn play-btn" data-index="${i}" style="opacity: 1 !important; pointer-events: auto !important;">
                <i class="fas fa-play"></i>
            </button>`;

        // Use the best available image with higher quality
        let imageUrl = movie.image || trailerInfo?.thumbnail || 'https://placehold.co/600x900?text=No+Image&font=opensans';

        // Try to get a higher resolution version
        if (imageUrl && !imageUrl.includes('placehold.co')) {
            // Try to get a higher resolution version
            // Replace common low-res image patterns with higher res versions
            imageUrl = imageUrl.replace(/SX300|SX200|SX150/, 'SX600');
            // If it's an IMDb image, try to get a larger size
            if (imageUrl.includes('media-amazon.com')) {
                imageUrl = imageUrl.replace(/\._V1_.*\.jpg/, '._V1_SX600_CR0,0,600,900_AL_.jpg');
            }
        }

        // Use the best available title
        const displayTitle = movie.title || 'Unknown Title';

        // Use the best available genre and year with better defaults
        let displayGenre = 'Movie';
        let displayYear = new Date().getFullYear().toString();

        // Only override defaults if we have valid data
        if (movie.genre) {
            if (typeof movie.genre === 'string' && movie.genre !== 'N/A' && movie.genre !== '') {
                displayGenre = movie.genre;
            } else if (Array.isArray(movie.genre) && movie.genre.length > 0) {
                displayGenre = movie.genre.join(', ');
            }
        }

        if (movie.year) {
            if (typeof movie.year === 'string' && movie.year !== 'N/A' && movie.year !== '') {
                displayYear = movie.year;
            } else if (typeof movie.year === 'number') {
                displayYear = movie.year.toString();
            }
        }

        console.log(`Movie ${i} processed with display values:`, {displayTitle, displayGenre, displayYear});
        
        trailerItem.innerHTML = `
            <div class="bg-gray-800 w-full h-full flex items-center justify-center rounded-xl relative">
                <div class="thumbnail-container">
                    <img src="${imageUrl}" 
                         alt="${displayTitle} Trailer" 
                         class="w-full h-full object-cover rounded-xl"
                         loading="lazy"
                         onerror="this.src='https://placehold.co/600x900?text=No+Image&font=opensans'">
                </div>
                <div class="absolute inset-0 bg-gradient-to-t from-black to-transparent rounded-xl"></div>
                <div class="trailer-controls">
                    ${playButtonHtml}
                </div>
                <div class="trailer-overlay">
                    <div class="trailer-info">
                        <h3>${displayTitle}</h3>
                        <p>${displayGenre} • ${displayYear}</p>
                    </div>
                </div>
            </div>
        `;
        
        fragment.appendChild(trailerItem);
    }
    
    // Append all items at once for better performance
    trailerContainer.appendChild(fragment);
    
    // Add event listeners to play buttons (debounced)
    const playButtons = document.querySelectorAll('.play-btn');
    console.log(`Found ${playButtons.length} play buttons`);
    
    playButtons.forEach(button => {
        button.addEventListener('click', debounce(function() {
            const index = parseInt(this.getAttribute('data-index'));
            let movieId = null;
            let trailerData = null;
            
            if (window.trailerDataStore && window.trailerDataStore[index]) {
                movieId = window.trailerDataStore[index].movie?.id || null;
                trailerData = window.trailerDataStore[index];
            }
            
            console.log('Play button clicked', {index, movieId, trailerData});
            playTrailer(index, movieId, trailerData);
        }, 300)); // 300ms debounce
    });
    
    // Initialize carousel navigation
    initializeCarouselNavigation(movies.length);
}

// Create placeholder trailers for demonstration
function createPlaceholderTrailers() {
    const trailerContainer = document.getElementById('trailersCarousel');
    
    if (!trailerContainer) return;
    
    // Clear existing content
    trailerContainer.innerHTML = '';
    
    // Create 6 placeholder trailers with more realistic data
    const placeholderMovies = [
        { title: "The Matrix", genre: "Action, Sci-Fi", year: "1999" },
        { title: "Inception", genre: "Action, Thriller", year: "2010" },
        { title: "The Dark Knight", genre: "Action, Crime", year: "2008" },
        { title: "Pulp Fiction", genre: "Crime, Drama", year: "1994" },
        { title: "Forrest Gump", genre: "Drama, Romance", year: "1994" },
        { title: "The Shawshank Redemption", genre: "Drama", year: "1994" }
    ];
    
    for (let i = 0; i < placeholderMovies.length; i++) {
        const movie = placeholderMovies[i];
        const trailerItem = document.createElement('div');
        trailerItem.className = 'trailer-item snap-start';
        trailerItem.setAttribute('data-index', i);
        trailerItem.innerHTML = `
            <div class="bg-gray-800 w-full h-full flex items-center justify-center rounded-xl relative">
                <div class="thumbnail-container">
                    <div class="bg-gray-700 w-full h-full rounded-xl flex items-center justify-center">
                        <i class="fas fa-film text-4xl text-gray-600"></i>
                    </div>
                </div>
                <div class="absolute inset-0 bg-gradient-to-t from-black to-transparent rounded-xl"></div>
                <div class="trailer-controls">
                    <button class="trailer-control-btn play-btn" data-index="${i}" style="opacity: 1 !important; pointer-events: auto !important;">
                        <i class="fas fa-play"></i>
                    </button>
                </div>
                <div class="trailer-overlay">
                    <div class="trailer-info">
                        <h3>${movie.title}</h3>
                        <p>${movie.genre} • ${movie.year}</p>
                    </div>
                </div>
            </div>
        `;
        
        trailerContainer.appendChild(trailerItem);
        
        // Add event listener to play button (always active)
        const playBtn = trailerItem.querySelector('.play-btn');
        if (playBtn) {
            playBtn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                // Placeholder trailers don't have movie ID or trailer data
                playTrailer(index, null, null);
            });
        }
    }
    
    // Initialize carousel navigation
    initializeCarouselNavigation(placeholderMovies.length);
}

// Initialize carousel navigation
function initializeCarouselNavigation(count = 6) {
    // Remove existing navigation if any
    const existingNav = document.querySelector('.carousel-nav');
    if (existingNav) {
        existingNav.remove();
    }
    
    const trailerContainer = document.getElementById('trailersCarousel');
    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'carousel-nav';
    
    for (let i = 0; i < count; i++) {
        const dot = document.createElement('div');
        dot.className = `carousel-dot ${i === 0 ? 'active' : ''}`;
        dot.setAttribute('data-index', i);
        dot.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            scrollToTrailer(index);
        });
        dotsContainer.appendChild(dot);
    }
    
    trailerContainer.parentNode.appendChild(dotsContainer);
}

// Enhanced CORS proxies for video playback with more reliable options
const VIDEO_PROXIES = [
    // Local proxy (highest priority if running)
    'http://localhost:3001/proxy/',
    // High reliability proxies first
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    'https://thingproxy.freeboard.io/fetch/',
    // Additional backup proxies
    'https://api.codetabs.com/v1/proxy?quest=',
    'https://cors-anywhere.herokuapp.com/',
    // Alternative proxies
    'https://yacdn.org/proxy/',
    'https://fetch-cors-proxy.deno.dev/?url=',
    'https://crossorigin.me/',
    'https://jsonp.afeld.me/?url='
];

// Function to check if local proxy is available
async function isLocalProxyAvailable() {
    try {
        const response = await fetch('http://localhost:3001/health', { 
            method: 'GET',
            mode: 'cors',
            timeout: 2000 // 2 second timeout
        });
        return response.ok;
    } catch (error) {
        console.log('Local proxy not available:', error.message);
        return false;
    }
}

// Play trailer in modal with enhanced proxy support
function playTrailer(index, movieId, trailerData) {
    console.log(`▶️ Playing trailer ${index} for movie ${movieId}`, trailerData);
    
    // Pause auto-scrolling when trailer is played
    pauseAutoScroll();
    console.log('Auto-scroll paused');
    
    if (trailerData && trailerData.url) {
        const trailerUrl = trailerData.url;
        
        // Validate that we have a proper URL
        if (!trailerUrl.startsWith('http')) {
            console.error('Invalid trailer URL:', trailerUrl);
            showTrailerError('Invalid trailer URL. Please try again.');
            return;
        }
        
        // Redirect to dedicated trailer page
        redirectToTrailerPage(trailerUrl, trailerData, movieId);
    } else {
        // Fallback if no trailer URL
        console.log('No trailer URL available for movie', {index, movieId, trailerData});
        showTrailerError('No trailer available for this movie.');
    }
}

// Show error message for trailer playback issues
function showTrailerError(message) {
    // Create error modal
    const errorModal = document.createElement('div');
    errorModal.id = 'trailerErrorModal';
    errorModal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
    errorModal.innerHTML = `
        <div class="bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-red-400">Trailer Error</h3>
                <button id="closeErrorModal" class="text-gray-400 hover:text-white">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <p class="text-gray-300 mb-6">${message}</p>
            <div class="flex gap-3">
                <button id="retryTrailer" class="flex-1 bg-accent hover:bg-cyan-400 text-primary font-bold py-2 px-4 rounded-lg transition duration-300">
                    Retry
                </button>
                <button id="closeErrorModalBtn" class="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition duration-300">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(errorModal);
    
    // Add event listeners
    document.getElementById('closeErrorModal').addEventListener('click', function() {
        errorModal.remove();
        resumeAutoScroll();
    });
    
    document.getElementById('closeErrorModalBtn').addEventListener('click', function() {
        errorModal.remove();
        resumeAutoScroll();
    });
    
    document.getElementById('retryTrailer').addEventListener('click', function() {
        errorModal.remove();
        // Retry logic would go here
        resumeAutoScroll();
    });
}

// Redirect to dedicated trailer page
function redirectToTrailerPage(trailerUrl, trailerData, movieId) {
    console.log('Redirecting to trailer page with data:', {trailerUrl, trailerData, movieId});
    
    // Create URL parameters
    const params = new URLSearchParams({
        url: trailerUrl,
        title: trailerData.title || 'Movie Trailer',
        movieId: movieId || '',
        poster: trailerData.thumbnail || '',
        year: trailerData.movie?.year || new Date().getFullYear().toString(),
        plot: trailerData.movie?.plot || 'No plot information available',
        rating: trailerData.movie?.rating || 'N/A'
    });
    
    // Redirect to trailer page
    window.location.href = `trailer.html?${params.toString()}`;
}

// Auto-scroll functionality
function startAutoScroll() {
    if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
    }
    
    autoScrollInterval = setInterval(() => {
        if (trailerCarousel && !isLoading) {
            const items = trailerCarousel.querySelectorAll('.trailer-item');
            if (items.length > 0) {
                currentSlide = (currentSlide + 1) % items.length;
                scrollToTrailer(currentSlide);
            }
        }
    }, 5000); // Scroll every 5 seconds
}

// Pause auto-scroll
function pauseAutoScroll() {
    if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
        autoScrollInterval = null;
    }
}

// Resume auto-scroll
function resumeAutoScroll() {
    startAutoScroll();
}

// Scroll to specific trailer
function scrollToTrailer(index) {
    const items = document.querySelectorAll('.trailer-item');
    if (items.length > 0 && index < items.length) {
        const item = items[index];
        item.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
        });
        
        // Update active dot
        const dots = document.querySelectorAll('.carousel-dot');
        dots.forEach((dot, i) => {
            if (i === index) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
        
        currentSlide = index;
    }
}

// Update scroll indicators for genre filters
function updateScrollIndicators() {
    const genreFilters = document.getElementById('genreFilters');
    const scrollLeftBtn = document.getElementById('scrollLeftBtn');
    const scrollRightBtn = document.getElementById('scrollRightBtn');
    
    if (genreFilters && scrollLeftBtn && scrollRightBtn) {
        const scrollLeft = genreFilters.scrollLeft;
        const scrollWidth = genreFilters.scrollWidth;
        const clientWidth = genreFilters.clientWidth;
        
        // Show left indicator if not at start
        if (scrollLeft > 0) {
            scrollLeftBtn.classList.add('visible');
        } else {
            scrollLeftBtn.classList.remove('visible');
        }
        
        // Show right indicator if not at end
        if (scrollLeft + clientWidth < scrollWidth) {
            scrollRightBtn.classList.add('visible');
        } else {
            scrollRightBtn.classList.remove('visible');
        }
    }
}

// Initialize genre filter scroll indicators
function initGenreFilterScroll() {
    const genreFilters = document.getElementById('genreFilters');
    const scrollLeftBtn = document.getElementById('scrollLeftBtn');
    const scrollRightBtn = document.getElementById('scrollRightBtn');
    
    if (genreFilters && scrollLeftBtn && scrollRightBtn) {
        // Check if scrolling is needed
        if (genreFilters.scrollWidth > genreFilters.clientWidth) {
            // Show scroll indicators
            scrollLeftBtn.style.display = 'flex';
            scrollRightBtn.style.display = 'flex';
            
            // Update indicators on scroll
            genreFilters.addEventListener('scroll', throttle(updateScrollIndicators, 100));
            
            // Add click handlers for scroll buttons
            scrollLeftBtn.addEventListener('click', function() {
                genreFilters.scrollBy({ left: -200, behavior: 'smooth' });
            });
            
            scrollRightBtn.addEventListener('click', function() {
                genreFilters.scrollBy({ left: 200, behavior: 'smooth' });
            });
            
            // Initial check
            setTimeout(updateScrollIndicators, 100);
        } else {
            // Hide scroll indicators if not needed
            scrollLeftBtn.style.display = 'none';
            scrollRightBtn.style.display = 'none';
        }
    }
}

// Expose functions globally for use in HTML
window.fetchTrailerForMovie = fetchTrailerForMovie;
window.playTrailer = playTrailer;
window.scrollToTrailer = scrollToTrailer;
window.pauseAutoScroll = pauseAutoScroll;
window.resumeAutoScroll = resumeAutoScroll;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize trailer data store
    window.trailerDataStore = {};
    
    // Initialize genre filter scroll functionality
    setTimeout(initGenreFilterScroll, 100); // Small delay to ensure DOM is fully ready
});

// Start initialization when script loads
waitForDOMAndInit();

console.log('✅ trailer.js module initialized and exposed globally');
