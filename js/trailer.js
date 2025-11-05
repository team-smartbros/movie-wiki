// trailer.js - Featured Trailers functionality for Movie Wiki

console.log('✅ trailer.js loaded');

// Global variables for trailer carousel
let trailerCarousel;
let trailerItems = [];
let currentTrailerIndex = 0;
let autoScrollInterval;
let isAutoScrolling = true;
let trailerData = [];
let currentGenre = 'all';

// Make trailerDataStore globally accessible
window.trailerDataStore = {};

// Initialize trailer carousel when DOM is loaded and API constants are available
function initTrailerCarousel() {
    console.log('🎬 Initializing trailer carousel...');
    // Check if API constants are available
    if (typeof window.API_BASE === 'undefined' || window.API_BASE === null) {
        console.warn('⚠️ API constants not available yet, waiting...');
        setTimeout(initTrailerCarousel, 100);
        return;
    }
    
    // Additional check to ensure constants are properly set
    if (!window.API_BASE || window.API_BASE === '') {
        console.warn('⚠️ API constants not properly initialized, waiting...');
        setTimeout(initTrailerCarousel, 100);
        return;
    }
    
    console.log('✅ API constants available, initializing trailer carousel');
    console.log('API_BASE:', window.API_BASE);
    initializeTrailerCarousel();
}

// Make sure the DOM is loaded before initializing
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        // Add a small delay to ensure main content has time to load
        setTimeout(initTrailerCarousel, 500);
    });
} else {
    // DOM is already loaded
    setTimeout(initTrailerCarousel, 500);
}

// Initialize trailer carousel
function initializeTrailerCarousel() {
    trailerCarousel = document.getElementById('trailersCarousel');
    
    if (!trailerCarousel) {
        console.warn('⚠️ Trailer carousel container not found');
        return;
    }
    
    // Start auto-scrolling
    startAutoScroll();
    
    // Add event listeners for user interaction
    trailerCarousel.addEventListener('mouseenter', pauseAutoScroll);
    trailerCarousel.addEventListener('mouseleave', resumeAutoScroll);
    
    // Load initial trailers
    loadFeaturedTrailers();
}

// Load featured trailers
async function loadFeaturedTrailers() {
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
    }
}

// Fetch trailer URL for a specific movie (following the same approach as details.html)
// Enhanced with caching for faster loading
async function fetchTrailerForMovie(movieId) {
    if (!movieId) return null;
    
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
        
        // Try direct fetch first (same method as details page)
        let response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Direct fetch failed with status ${response.status}`);
        }
        
        const data = await response.json();
        
        // Extract trailer information (same structure as details page)
        const shortData = data.short || {};
        const topData = data.top || {};
        
        // Log the data for debugging
        console.log(`API Response for ${movieId}:`, {shortData, topData});
        
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
                                thumbnail: trailerNode.thumbnail?.url || shortData.image || topData.primaryImage?.url || 'https://placehold.co/300x450?text=No+Image&font=opensans'
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
                        thumbnail: trailerNode.thumbnail?.url || shortData.image || topData.primaryImage?.url || 'https://placehold.co/300x450?text=No+Image&font=opensans'
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
                        thumbnail: trailerNode.thumbnail?.url || shortData.image || topData.primaryImage?.url || 'https://placehold.co/300x450?text=No+Image&font=opensans'
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
                thumbnail: shortData.image || topData.primaryImage?.url || 'https://placehold.co/300x450?text=No+Image&font=opensans'
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
        
        // Try primary API first
        let response = await fetch(apiUrl);
        
        // If primary API fails, try fallback
        if (!response.ok) {
            console.log(`Primary API failed for ${section}, trying fallback API`);
            
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
            
            response = await fetch(fallbackUrl);
        }
        
        if (!response.ok) {
            console.warn(`Failed to fetch ${section} movies`);
            return [];
        }
        
        const data = await response.json();
        
        // Extract titles based on section
        let titles = [];
        if (data.items) {
            if (section === 'latest') {
                // For latest, get items 5-10 (next 5 after popular)
                titles = data.items.slice(5, 5 + count).map(item => 
                    item.title.replace(/^\d+\.\s*/, '')
                );
            } else {
                // For popular and coming soon, get first 'count' items
                titles = data.items.slice(0, count).map(item => 
                    item.title.replace(/^\d+\.\s*/, '')
                );
            }
        }
        
        // Fetch detailed movie information for each title
        const movies = [];
        for (let i = 0; i < Math.min(titles.length, count); i++) {
            const movie = await fetchMovieDetailsByTitle(titles[i]);
            if (movie) {
                movies.push(movie);
            }
        }
        
        return movies;
        
    } catch (error) {
        console.error(`Error fetching ${section} movies:`, error);
        return [];
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
        
        // Try primary API first
        let response = await fetch(apiUrl);
        
        // If primary API fails, try fallback
        if (!response.ok) {
            console.log(`Primary API failed for ${genre}, trying fallback API`);
            const fallbackUrl = `${window.FALLBACK_SCRAPER_API_BASE}/by_genre/${apiGenre}`;
            response = await fetch(fallbackUrl);
        }
        
        if (!response.ok) {
            console.warn(`Failed to fetch ${genre} movies`);
            return [];
        }
        
        const data = await response.json();
        
        // Extract titles
        let titles = [];
        if (data.items) {
            titles = data.items.slice(0, count).map(item => 
                item.title.replace(/^\d+\.\s*/, '')
            );
        }
        
        // Fetch detailed movie information for each title
        const movies = [];
        for (let i = 0; i < Math.min(titles.length, count); i++) {
            const movie = await fetchMovieDetailsByTitle(titles[i]);
            if (movie) {
                movies.push(movie);
            }
        }
        
        return movies;
        
    } catch (error) {
        console.error(`Error fetching ${genre} movies:`, error);
        return [];
    }
}

// Fetch movie details by title
async function fetchMovieDetailsByTitle(title) {
    try {
        console.log(`📥 Fetching details for movie: ${title}`);
        
        // Search for the movie using the main API
        const searchUrl = `${window.API_BASE}/search?q=${encodeURIComponent(title)}`;
        
        // Try direct fetch first
        let response;
        try {
            response = await fetch(searchUrl);
            if (!response.ok) {
                throw new Error(`Direct fetch failed with status ${response.status}`);
            }
        } catch (directError) {
            console.log(`Direct fetch failed for ${title}, trying with proxy`);
            // Try with proxy
            const proxy = 'https://corsproxy.io/?';
            const proxiedUrl = proxy + encodeURIComponent(searchUrl);
            response = await fetch(proxiedUrl);
        }
        
        if (!response.ok) {
            console.warn(`Failed to fetch details for movie: ${title}`);
            return null;
        }
        
        const data = await response.json();
        
        if (data.ok && data.description && data.description.length > 0) {
            const item = data.description[0];
            
            return {
                id: item['#IMDB_ID'] || 'tt0000000',
                title: item['#TITLE'] || title,
                year: item['#YEAR'] || 'N/A',
                poster: item['#IMG_POSTER'] || 'https://via.placeholder.com/300x450?text=No+Image'
            };
        }
        
        return null;
        
    } catch (error) {
        console.error(`Error fetching details for movie ${title}:`, error);
        return null;
    }
}

// Get movies from a specific container
function getMoviesFromContainer(containerId, count) {
    const container = document.getElementById(containerId);
    if (!container) return [];
    
    // Extract movie data from the container
    const movieCards = container.querySelectorAll('.movie-card');
    
    // If no movie cards yet, return empty array
    if (movieCards.length === 0) {
        console.log(`📭 No movies found in ${containerId} yet`);
        return [];
    }
    
    const movies = [];
    
    // Get up to 'count' movies
    for (let i = 0; i < Math.min(movieCards.length, count); i++) {
        const card = movieCards[i];
        const titleElement = card.querySelector('h3');
        const yearElement = card.querySelector('.text-gray-400');
        const posterElement = card.querySelector('img');
        
        // Extract movie ID from onclick attribute or data attributes
        let movieId = 'tt0000000'; // Default ID
        const onclickAttr = card.getAttribute('onclick');
        if (onclickAttr) {
            const idMatch = onclickAttr.match(/id=([^&']+)/);
            if (idMatch) {
                movieId = idMatch[1];
            }
        }
        
        const title = titleElement ? titleElement.textContent.trim() : 'Unknown Title';
        const year = yearElement ? yearElement.textContent.trim() : 'N/A';
        const poster = posterElement ? posterElement.src : 'https://via.placeholder.com/300x450?text=Movie+Poster';
        
        movies.push({
            id: movieId,
            title: title,
            year: year,
            poster: poster
        });
    }
    
    return movies;
}

// Display trailers
async function displayTrailers(movies) {
    const trailerContainer = document.getElementById('trailersCarousel');
    
    if (!trailerContainer) {
        console.warn('⚠️ Trailer carousel container not found');
        return;
    }
    
    // Clear existing content
    trailerContainer.innerHTML = '';
    
    // Clear trailer data store
    window.trailerDataStore = {};
    
    // Create trailer items for each movie
    for (let i = 0; i < movies.length; i++) {
        const movie = movies[i];
        
        // Try to get trailer URL for the movie
        const trailerData = await fetchTrailerForMovie(movie.id);
        
        const trailerItem = document.createElement('div');
        trailerItem.className = 'trailer-item snap-start';
        trailerItem.setAttribute('data-index', i);
        
        // Always create with active play button
        window.trailerDataStore[i] = trailerData;
        console.log(`Stored trailer data for index ${i}:`, trailerData);
        
        // Create trailer item with play button always visible
        trailerItem.innerHTML = `
            <div class="bg-gray-800 w-full h-full flex items-center justify-center rounded-xl relative">
                <div class="thumbnail-container">
                    <img src="${movie.poster}" alt="${movie.title}" class="object-cover rounded-xl" onerror="this.src='https://placehold.co/1280x720/1e293b/22d3ee?text=No+Image'">
                </div>
                <div class="absolute inset-0 bg-gradient-to-t from-black to-transparent rounded-xl"></div>
                <div class="trailer-controls">
                    <button class="trailer-control-btn play-btn" data-index="${i}" data-movie-id="${movie.id}" style="opacity: 1 !important; pointer-events: auto !important;">
                        <i class="fas fa-play"></i>
                    </button>
                </div>
                <div class="trailer-overlay">
                    <div class="trailer-info">
                        <h3>${movie.title}</h3>
                        <p>${movie.year}${trailerData && trailerData.title ? ' • ' + trailerData.title : ''}</p>
                    </div>
                </div>
            </div>
        `;
        
        trailerContainer.appendChild(trailerItem);
        
        // Add event listener to play button (always active)
        const playBtn = trailerItem.querySelector('.play-btn');
        if (playBtn) {
            playBtn.addEventListener('click', function() {
                const movieId = this.getAttribute('data-movie-id');
                const index = parseInt(this.getAttribute('data-index'));
                
                // Retrieve trailer data from global store
                let trailerData = null;
                if (window.trailerDataStore && window.trailerDataStore[index]) {
                    trailerData = window.trailerDataStore[index];
                }
                
                console.log('Play button clicked', {index, movieId, trailerData});
                playTrailer(index, movieId, trailerData);
            });
        }
    }
    
    // Initialize carousel navigation
    initializeCarouselNavigation(movies.length);
}

// Create placeholder trailers for demonstration
function createPlaceholderTrailers() {
    const trailerContainer = document.getElementById('trailersCarousel');
    
    if (!trailerContainer) return;
    
    // Clear existing content
    trailerContainer.innerHTML = '';
    
    // Create 6 placeholder trailers
    for (let i = 0; i < 6; i++) {
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
                        <h3>Movie Title ${i + 1}</h3>
                        <p>Genre • Year</p>
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
    initializeCarouselNavigation();
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
function showTrailerError(message, trailerData = null) {
    // For now, we'll show an alert since we're redirecting to a new page
    alert(message + '\n\nYou will be redirected to the trailer page.');
    
    // If we have trailer data, redirect to trailer page anyway
    if (trailerData && trailerData.url) {
        setTimeout(() => {
            redirectToTrailerPage(trailerData.url, trailerData);
        }, 1000);
    } else {
        // Resume auto-scroll if we can't play trailer
        resumeAutoScroll();
    }
}

// Redirect to dedicated trailer page
function redirectToTrailerPage(videoUrl, trailerData, movieId) {
    console.log('Redirecting to trailer page with URL:', videoUrl);
    
    // Get movie data from the trailer data store if available
    const movie = window.trailerDataStore && window.trailerDataStore[movieId] ? 
                  window.trailerDataStore[movieId].movie : null;
    
    // Build URL parameters
    const params = new URLSearchParams();
    params.set('url', videoUrl);
    
    if (trailerData.title) {
        params.set('title', trailerData.title);
    }
    
    if (movieId) {
        params.set('movieId', movieId);
    }
    
    if (movie) {
        if (movie.title) params.set('title', movie.title);
        if (movie.poster) params.set('poster', movie.poster);
        if (movie.year) params.set('year', movie.year);
        if (movie.plot) params.set('plot', movie.plot);
        if (movie.rating) params.set('rating', movie.rating);
    }
    
    // Redirect to trailer page
    window.location.href = `trailer.html?${params.toString()}`;
}

// Close trailer
function closeTrailer(index) {
    console.log(`⏹️ Closing trailer ${index}`);
    
    // Close the modal
    closeTrailerModal();
    
    // Resume auto-scrolling after trailer is closed
    resumeAutoScroll();
    
    // Clean up trailer data store
    if (window.trailerDataStore && window.trailerDataStore[index]) {
        delete window.trailerDataStore[index];
    }
}

// Scroll to specific trailer
function scrollToTrailer(index) {
    const trailerContainer = document.getElementById('trailersCarousel');
    if (!trailerContainer) return;
    
    currentTrailerIndex = index;
    updateCarouselNavigation();
    
    // Scroll to the specific trailer item
    const trailerItems = document.querySelectorAll('.trailer-item');
    if (trailerItems.length > 0 && index < trailerItems.length) {
        const scrollPosition = trailerItems[index].offsetLeft;
        trailerContainer.scrollTo({
            left: scrollPosition,
            behavior: 'smooth'
        });
        console.log(`⏭️ Scrolling to trailer ${index} at position ${scrollPosition}`);
    } else {
        console.log(`⏭️ Could not scroll to trailer ${index}`);
    }
}

// Update carousel navigation dots
function updateCarouselNavigation() {
    const dots = document.querySelectorAll('.carousel-dot');
    dots.forEach((dot, index) => {
        if (index === currentTrailerIndex) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

// Start auto-scrolling
function startAutoScroll() {
    if (autoScrollInterval) return;
    
    isAutoScrolling = true;
    autoScrollInterval = setInterval(() => {
        if (isAutoScrolling) {
            scrollToNextTrailer();
        }
    }, 5000); // Scroll every 5 seconds
}

// Pause auto-scrolling
function pauseAutoScroll() {
    console.log('⏸️ Pausing auto-scroll');
    isAutoScrolling = false;
}

// Resume auto-scrolling
function resumeAutoScroll() {
    console.log('▶️ Resuming auto-scroll');
    isAutoScrolling = true;
}

// Scroll to next trailer
function scrollToNextTrailer() {
    const trailerItems = document.querySelectorAll('.trailer-item');
    if (trailerItems.length === 0) return;
    
    currentTrailerIndex = (currentTrailerIndex + 1) % trailerItems.length;
    updateCarouselNavigation();
    
    // Scroll to the next trailer item
    if (trailerCarousel) {
        const scrollPosition = trailerItems[currentTrailerIndex].offsetLeft;
        trailerCarousel.scrollTo({
            left: scrollPosition,
            behavior: 'smooth'
        });
    }
    
    console.log(`⏭️ Auto-scrolling to trailer ${currentTrailerIndex}`);
}

// Update trailers based on selected genre
function updateTrailersForGenre(genre) {
    console.log(`🔄 Updating trailers for genre: ${genre}`);
    
    // Update current genre
    currentGenre = genre;
    
    // Pause auto-scrolling during update
    pauseAutoScroll();
    
    // Fetch and display trailers for the selected genre
    fetchAndDisplayTrailers();
    
    // Resume auto-scrolling after update
    setTimeout(resumeAutoScroll, 1000);
}

// Expose trailer module functions globally
window.trailerModule = {
    updateTrailersForGenre: function(genre) {
        console.log(`Updating trailers for genre: ${genre}`);
        currentGenre = genre;
        fetchAndDisplayTrailers();
    },
    refreshTrailers: function() {
        console.log('Refreshing trailers');
        fetchAndDisplayTrailers();
    }
};

// Also expose individual functions for backward compatibility
window.updateTrailersForGenre = window.trailerModule.updateTrailersForGenre;
window.refreshTrailers = window.trailerModule.refreshTrailers;

console.log('✅ trailer.js module initialized and exposed globally');
