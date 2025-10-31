/**
 * Dynamic Sitemap Generator for Movie Wiki
 * This script can be integrated into your existing system to automatically 
 * generate and update sitemaps with all movie detail pages.
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
                    const idMatch = onclick.match(/id=([^&'"]+)/);
                    const titleMatch = onclick.match(/title=([^&'"]+)/);
                    
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
}

// Create a global instance
const sitemapGenerator = new MovieSitemapGenerator();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MovieSitemapGenerator, sitemapGenerator };
}

// For browser usage, make it available globally
if (typeof window !== 'undefined') {
    window.MovieSitemapGenerator = MovieSitemapGenerator;
    window.sitemapGenerator = sitemapGenerator;
}

// Example usage:
// 1. Generate sitemap from current page:
// const sitemapXML = sitemapGenerator.generateSitemapFromCurrentPage();
// console.log(sitemapXML);

// 2. Update with new movies:
// const newMovies = [{ id: 'tt1234567', title: 'New Movie' }];
// const updatedSitemap = sitemapGenerator.updateSitemapWithNewMovies(newMovies);

// 3. Get cached movies:
// const cachedMovies = sitemapGenerator.getCachedMovies();