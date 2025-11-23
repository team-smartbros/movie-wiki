// Client-side router for clean URLs
(function() {
    // Function to navigate to a page without showing .html extension
    function navigateTo(path) {
        // Remove .html extension if present
        if (path.endsWith('.html')) {
            path = path.slice(0, -5);
        }
        
        // Handle special cases
        if (path === '' || path === '/') {
            path = '/index';
        }
        
        // Add .html extension for actual file loading
        const actualPath = path + '.html';
        
        // Check if file exists
        const xhr = new XMLHttpRequest();
        xhr.open('HEAD', actualPath, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    window.location.href = actualPath;
                } else {
                    // Fallback to index.html
                    window.location.href = '/index.html';
                }
            }
        };
        xhr.send();
    }
    
    // Intercept all link clicks
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (link && link.href && !link.target) {
            const url = new URL(link.href);
            const origin = window.location.origin;
            
            // Only handle links within the same origin
            if (url.origin === origin) {
                e.preventDefault();
                navigateTo(url.pathname);
            }
        }
    });
    
    // Handle browser back/forward buttons
    window.addEventListener('popstate', function() {
        // The browser handles this automatically with our 404.html redirect
    });
    
    // Export for use in other modules
    window.navigateTo = navigateTo;
})();