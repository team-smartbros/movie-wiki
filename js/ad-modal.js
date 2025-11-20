// Ad Modal Functionality
// This script handles the display of an ad modal when navigating between pages

(function() {
    // Function to create and show ad modal
    function showAdModal() {
        // Check if ad modal already exists to prevent duplicates
        if (document.getElementById('adModal')) {
            return;
        }
        
        // Create modal container
        const modal = document.createElement('div');
        modal.id = 'adModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            backdrop-filter: blur(5px);
        `;
        
        // Create modal content
        const content = document.createElement('div');
        content.style.cssText = `
            background: #1e293b;
            border-radius: 12px;
            padding: 20px;
            max-width: 90%;
            max-height: 90%;
            position: relative;
            border: 1px solid #22d3ee;
            box-shadow: 0 0 30px rgba(34, 211, 238, 0.3);
        `;
        
        // Create close button
        const closeBtn = document.createElement('button');
        closeBtn.id = 'closeAdModal';
        closeBtn.innerHTML = 'Close Ad ×';
        closeBtn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: #22d3ee;
            color: #0f172a;
            border: none;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            font-weight: bold;
            cursor: pointer;
            z-index: 10001;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
        `;
        
        // Create ad container
        const adContainer = document.createElement('div');
        adContainer.style.cssText = `
            margin-top: 30px;
            min-width: 300px;
            min-height: 250px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
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
        
        // Assemble the modal
        adContainer.appendChild(adScript);
        adContainer.appendChild(adScript2);
        content.appendChild(closeBtn);
        content.appendChild(adContainer);
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        // Add event listener to close button
        closeBtn.addEventListener('click', function() {
            document.body.removeChild(modal);
        });
        
        // Close modal when clicking outside the content
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // Close modal with ESC key
        document.addEventListener('keydown', function closeOnEsc(e) {
            if (e.key === 'Escape' && document.getElementById('adModal')) {
                document.body.removeChild(modal);
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
            setTimeout(showAdModal, 500);
        }
    };

    // Override replaceState to detect navigation
    history.replaceState = function() {
        originalReplaceState.apply(history, arguments);
        navigationCount++;
        // Show ad modal every 3 navigations
        if (navigationCount % 3 === 0) {
            setTimeout(showAdModal, 500);
        }
    };

    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', function() {
        navigationCount++;
        // Show ad modal every 3 navigations
        if (navigationCount % 3 === 0) {
            setTimeout(showAdModal, 500);
        }
    });

    // Show ad modal on initial page load (if it's not the first visit)
    document.addEventListener('DOMContentLoaded', function() {
        // Check if this is not the first visit using sessionStorage
        if (sessionStorage.getItem('hasVisitedBefore')) {
            navigationCount = 1; // Start counting from 1
            // Show ad modal after a short delay
            setTimeout(showAdModal, 2000);
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