// Ad Modal Functionality
(function() {
    // Check if we're on the homepage - don't show modal ads there
    const pathname = window.location.pathname;
    const isHomepage = (
        pathname === '/' || 
        pathname === '/index.html' || 
        pathname.endsWith('/index.html') || 
        pathname === '/pages/' ||
        pathname === '/pages' ||
        pathname.endsWith('/pages/') ||
        pathname.endsWith('/pages/index.html') ||
        pathname === '/pages/index.html'
    );
    
    if (isHomepage) {
        console.log('Homepage detected, skipping ad modal');
        return;
    }

    // Function to create and show ad modal
    function showAdModal() {
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'adModalOverlay';
        modalOverlay.style.cssText = `
            all: unset !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background-color: rgba(0, 0, 0, 0.85) !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            z-index: 10000 !important;
            backdrop-filter: blur(3px) !important;
            border-radius: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            outline: none !important;
            box-shadow: none !important;
            transform: none !important;
            transition: none !important;
        `;

        // Create modal container - sized specifically for 300x250 ad
        const modalContainer = document.createElement('div');
        modalContainer.id = 'adModalContainer';
        modalContainer.style.cssText = `
            all: unset !important;
            position: relative !important;
            background: #1e293b !important;
            border-radius: 16px !important;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6) !important;
            width: 330px !important;
            height: 280px !important;
            min-width: 330px !important;
            min-height: 280px !important;
            max-width: 330px !important;
            max-height: 280px !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            outline: none !important;
            transform: none !important;
            transition: none !important;
        `;

        // Create close button with appropriate styling
        const closeBtn = document.createElement('button');
        closeBtn.id = 'closeAdModal';
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cssText = `
            all: unset !important;
            position: absolute !important;
            top: 8px !important;
            right: 8px !important;
            background: #22d3ee !important;
            color: #0f172a !important;
            border: none !important;
            border-radius: 50% !important;
            width: 24px !important;
            height: 24px !important;
            font-weight: bold !important;
            cursor: pointer !important;
            z-index: 10001 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 18px !important;
            line-height: 1 !important;
            padding: 0 !important;
            margin: 0 !important;
            box-sizing: border-box !important;
            outline: none !important;
            transform: none !important;
            transition: none !important;
        `;

        // Create ad container - exactly 300x250
        const adContainer = document.createElement('div');
        adContainer.id = 'adContainer';
        adContainer.style.cssText = `
            all: unset !important;
            margin-top: 20px !important;
            width: 300px !important;
            height: 250px !important;
            min-width: 300px !important;
            min-height: 250px !important;
            max-width: 300px !important;
            max-height: 250px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background: #0f172a !important;
            border-radius: 8px !important;
            position: relative !important;
            overflow: hidden !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            outline: none !important;
        `;

        // Add loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'adLoadingIndicator';
        loadingIndicator.innerHTML = 'Loading advertisement...';
        loadingIndicator.style.cssText = `
            all: unset !important;
            color: #94a3b8 !important;
            font-size: 14px !important;
            position: absolute !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            z-index: 1 !important;
            margin: 0 !important;
            padding: 0 !important;
        `;
        adContainer.appendChild(loadingIndicator);

        // Assemble the modal
        modalContainer.appendChild(closeBtn);
        modalContainer.appendChild(adContainer);
        modalOverlay.appendChild(modalContainer);
        document.body.appendChild(modalOverlay);

        // Add ad script
        const adScript = document.createElement('script');
        adScript.type = 'text/javascript';
        adScript.text = `
            atOptions = {
                'key' : 'e65cc55a1c5f4c4ff04d43a949ba5eea',
                'format' : 'iframe',
                'height' : 250,
                'width' : 300,
                'params' : {}
            };
        `;

        const adScript2 = document.createElement('script');
        adScript2.type = 'text/javascript';
        adScript2.src = '//www.highperformanceformat.com/e65cc55a1c5f4c4ff04d43a949ba5eea/invoke.js';

        // Add multiple event listeners to ensure loading indicator is hidden
        adScript2.onload = function() {
            hideLoadingIndicator();
        };

        adScript2.onerror = function() {
            hideLoadingIndicator();
        };

        // Also hide loading indicator after a shorter timeout as fallback
        setTimeout(function() {
            hideLoadingIndicator();
        }, 1000);

        // Additional check for when the iframe content is loaded
        const checkAdLoaded = setInterval(function() {
            const adContainer = document.getElementById('adContainer');
            const iframe = adContainer.querySelector('iframe');
            if (iframe && iframe.contentDocument && iframe.contentDocument.body && iframe.contentDocument.body.children.length > 0) {
                hideLoadingIndicator();
                clearInterval(checkAdLoaded);
            }
        }, 500);

        // Stop checking after 5 seconds
        setTimeout(function() {
            clearInterval(checkAdLoaded);
        }, 5000);

        // Function to hide loading indicator
        function hideLoadingIndicator() {
            const loadingIndicator = document.getElementById('adLoadingIndicator');
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
        }

        // Append scripts to ad container
        adContainer.appendChild(adScript);
        adContainer.appendChild(adScript2);

        // Add event listener to close button
        closeBtn.addEventListener('click', function() {
            document.body.removeChild(modalOverlay);
        });

        // Close modal when clicking outside the content
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                document.body.removeChild(modalOverlay);
            }
        });

        // Close modal with ESC key
        document.addEventListener('keydown', function closeOnEsc(e) {
            if (e.key === 'Escape' && document.getElementById('adModalOverlay')) {
                document.body.removeChild(modalOverlay);
                document.removeEventListener('keydown', closeOnEsc);
            }
        });
    }

    // Track navigation events to show ad modal
    let navigationCount = 0;
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    // Override pushState to detect navigation
    history.pushState = function() {
        originalPushState.apply(history, arguments);
        navigationCount++;
        // Show ad modal every 3 navigations
        if (navigationCount % 3 === 0) {
            setTimeout(showAdModal, 50); // Show faster after navigation
        }
    };

    // Override replaceState to detect navigation
    history.replaceState = function() {
        originalReplaceState.apply(history, arguments);
        navigationCount++;
        // Show ad modal every 3 navigations
        if (navigationCount % 3 === 0) {
            setTimeout(showAdModal, 50); // Show faster after navigation
        }
    };

    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', function() {
        navigationCount++;
        // Show ad modal every 3 navigations
        if (navigationCount % 3 === 0) {
            setTimeout(showAdModal, 50); // Show faster after navigation
        }
    });

    // Show ad modal on initial page load (if it's not the first visit)
    document.addEventListener('DOMContentLoaded', function() {
        // Check if this is not the first visit using sessionStorage
        if (sessionStorage.getItem('hasVisitedBefore')) {
            navigationCount = 1; // Start counting from 1
            // Show ad modal after a short delay
            setTimeout(showAdModal, 500); // Show faster on initial load
        } else {
            // Mark that the user has visited before
            sessionStorage.setItem('hasVisitedBefore', 'true');
        }
    });

    // Export for use in other modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { showAdModal };
    } else {
        window.showAdModal = showAdModal;
    }
})();