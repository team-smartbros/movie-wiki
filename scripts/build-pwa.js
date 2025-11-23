// PWA Build Script
const fs = require('fs');
const path = require('path');

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '..', 'icons');
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

// Copy favicon to icons directory
const faviconPath = path.join(__dirname, '..', 'assets', 'favicon.png');
const icon192Path = path.join(iconsDir, 'icon-192x192.png');
const icon512Path = path.join(iconsDir, 'icon-512x512.png');

if (fs.existsSync(faviconPath)) {
    fs.copyFileSync(faviconPath, icon192Path);
    fs.copyFileSync(faviconPath, icon512Path);
    console.log('✅ PWA icons created successfully');
} else {
    console.log('⚠️  Favicon not found. Please add favicon.png to assets folder');
}

// Update all HTML files to include PWA meta tags
const pagesDir = path.join(__dirname, '..', 'pages');
const htmlFiles = fs.readdirSync(pagesDir).filter(file => file.endsWith('.html'));

const pwaMetaTags = `
    <!-- PWA Meta Tags -->
    <meta name="theme-color" content="#22d3ee">
    <meta name="description" content="Discover movies, actors, and trailers with Movie Wiki. Your ultimate destination for movie information.">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-title" content="Movie Wiki">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    
    <!-- PWA Manifest -->
    <link rel="manifest" href="/manifest.json">
    
    <!-- Icons -->
    <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192x192.png">
    <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512x512.png">
    <link rel="apple-touch-icon" href="/icons/icon-192x192.png">
`;

htmlFiles.forEach(file => {
    const filePath = path.join(pagesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add PWA meta tags if not already present
    if (!content.includes('rel="manifest"')) {
        // Find the position to insert PWA meta tags
        const headEndIndex = content.indexOf('</head>');
        if (headEndIndex !== -1) {
            content = content.slice(0, headEndIndex) + pwaMetaTags + content.slice(headEndIndex);
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ PWA meta tags added to ${file}`);
        }
    }
});

console.log('✅ PWA build completed successfully!');