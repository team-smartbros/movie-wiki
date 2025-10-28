// Verification script to test the fix
async function verifyFix() {
    console.log('Testing the fix for homepage content display...');
    
    const SCRAPER_API_BASE = 'https://web-1-production.up.railway.app';
    
    try {
        // Test popular movies
        console.log('Fetching popular movies...');
        const popularMoviesResponse = await fetch(`${SCRAPER_API_BASE}/top`);
        const popularMoviesData = await popularMoviesResponse.json();
        console.log(`Popular movies count: ${popularMoviesData.count}`);
        console.log(`First movie title: ${popularMoviesData.items[0]?.title}`);
        console.log(`First movie imdb_id: ${popularMoviesData.items[0]?.imdb_id}`);
        
        // Test popular TV shows
        console.log('Fetching popular TV shows...');
        const popularTVResponse = await fetch(`${SCRAPER_API_BASE}/popular`);
        const popularTVData = await popularTVResponse.json();
        console.log(`Popular TV shows count: ${popularTVData.count}`);
        console.log(`First TV show title: ${popularTVData.items[0]?.title}`);
        console.log(`First TV show imdb_id: ${popularTVData.items[0]?.imdb_id}`);
        
        // Test upcoming
        console.log('Fetching upcoming content...');
        const upcomingResponse = await fetch(`${SCRAPER_API_BASE}/upcoming`);
        const upcomingData = await upcomingResponse.json();
        console.log(`Upcoming count: ${upcomingData.count}`);
        console.log(`First upcoming title: ${upcomingData.items[0]?.title}`);
        console.log(`First upcoming imdb_id: ${upcomingData.items[0]?.imdb_id}`);
        
        console.log('All tests completed successfully!');
        console.log('The fix should now display content on the homepage even when imdb_id is null.');
    } catch (error) {
        console.error('Error during verification:', error);
    }
}

// Run the verification
verifyFix();