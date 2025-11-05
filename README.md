# Movie Wiki Application

A responsive movie search and information application built with HTML, Tailwind CSS, and JavaScript that uses the IMDB API to fetch movie data.

## Features

- Search for movies by title
- View detailed movie information including:
  - Title, year, and poster
  - Rating and duration
  - Genres and plot summary
  - Cast information
- Watch movie trailers
- View movie photos
- Browse popular, trending, and upcoming movies and TV shows
- Responsive design that works on mobile and desktop

## How to Use

1. Open `index.html` in a web browser
2. Enter a movie title in the search box
3. Click the search button or press Enter
4. Browse through the search results
5. Click on any movie to view detailed information
6. Use the "Watch Trailer" and "View Photos" buttons to see additional media
7. Explore popular, trending, and upcoming content sections on the homepage

## API Information

This application uses multiple APIs to fetch movie data:

### Main IMDB API

- Search movies: `https://imdb.iamidiotareyoutoo.com/search?q={query}`
- Get movie details: `https://imdb.iamidiotareyoutoo.com/search?tt={imdb_id}`
- Movie trailers: `https://imdb.iamidiotareyoutoo.com/media/{imdb_id}`
- Movie photos: `https://imdb.iamidiotareyoutoo.com/photo/{imdb_id}`

### IMDb Unlimited Scraper API

This application also integrates with a custom IMDb Unlimited Scraper API hosted at `https://web-1-production.up.railway.app/` to fetch:

- Top rated movies: `/top`
- Popular/trending content: `/popular`
- Upcoming releases: `/upcoming`

## File Structure

- `index.html` - Main HTML file with the application structure
- `script.js` - JavaScript file with application logic
- `README.md` - This file
- `IMDB_UNLIMITED_API_INTEGRATION.md` - Documentation for the IMDb Unlimited API integration
- `privacy-policy.html` - Privacy policy for the application
- `terms-of-service.html` - Terms of service for the application
- `disclaimer.html` - Disclaimer for the application
- `cookie-policy.html` - Cookie policy for the application

## Legal Pages

- [Privacy Policy](privacy-policy.html)
- [Terms of Service](terms-of-service.html)
- [Disclaimer](disclaimer.html)
- [Cookie Policy](cookie-policy.html)

## Technologies Used

- HTML5
- Tailwind CSS (via CDN)
- JavaScript (ES6+)
- Font Awesome (for icons)

## Notes

- The application requires an internet connection to fetch movie data from the APIs
- Some features may not work if the APIs are unavailable
- The application is designed to be responsive and should work on most modern browsers