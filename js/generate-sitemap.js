/**
 * Dynamic Sitemap Generator for Movie Wiki
 * This script generates a sitemap.xml file with all static pages and 
 * provides a framework for dynamically adding movie detail pages.
 */

// List of static pages
const staticPages = [
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

// Function to generate sitemap XML
function generateSitemap(staticPages, moviePages = []) {
  const currentDate = new Date().toISOString().split('T')[0];
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  
  // Add static pages
  staticPages.forEach(page => {
    xml += `  <url>\n`;
    xml += `    <loc>https://moviewiki.qzz.io${page.url}</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += `  </url>\n`;
  });
  
  // Add movie detail pages
  moviePages.forEach(movie => {
    xml += `  <url>\n`;
    xml += `    <loc>https://moviewiki.qzz.io/details.html?id=${movie.id}&amp;title=${encodeURIComponent(movie.title)}</loc>\n`;
    xml += `    <lastmod>${movie.lastmod || currentDate}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n`;
  });
  
  xml += `</urlset>`;
  
  return xml;
}

// Function to extract movie IDs from the existing codebase
function extractMovieIds() {
  // This would typically scan your database or API responses
  // For now, we'll return a sample list
  return [
    { id: 'tt0111161', title: 'The Shawshank Redemption' },
    { id: 'tt0068646', title: 'The Godfather' },
    { id: 'tt0071562', title: 'The Godfather Part II' },
    { id: 'tt0468569', title: 'The Dark Knight' },
    { id: 'tt0050083', title: '12 Angry Men' }
  ];
}

// Generate the sitemap
const moviePages = extractMovieIds();
const sitemapXML = generateSitemap(staticPages, moviePages);

// Save to file (in a real implementation, this would write to sitemap.xml)
console.log('Generated Sitemap:');
console.log(sitemapXML);

// For browser usage, we can also create a function to update the sitemap dynamically
function updateSitemapWithNewMovies(newMovies) {
  const updatedSitemap = generateSitemap(staticPages, newMovies);
  // In a real implementation, this would update the sitemap.xml file
  return updatedSitemap;
}

// Export for Node.js usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { generateSitemap, extractMovieIds, updateSitemapWithNewMovies };
}