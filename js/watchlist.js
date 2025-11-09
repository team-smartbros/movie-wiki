// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDeTE5otOE58jq1-bIPNbiYdwiwX88iT00",
    authDomain: "movie-wiki-86d4d.firebaseapp.com",
    databaseURL: "https://movie-wiki-86d4d-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "movie-wiki-86d4d",
    storageBucket: "movie-wiki-86d4d.firebasestorage.app",
    messagingSenderId: "453451714779",
    appId: "1:453451714779:web:e94ad0ef8df299b733fcfe",
    measurementId: "G-91SHQF7F4P"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

let currentUser = null;

// Google Sign-In
function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then((result) => {
            console.log('✅ Signed in:', result.user.displayName);
        })
        .catch((error) => {
            console.error('Sign-in error:', error);
            alert('Failed to sign in. Please try again.');
        });
}

// Auth State Observer
auth.onAuthStateChanged((user) => {
    currentUser = user;
    updateAuthUI(user);
    
    if (user) {
        loadWatchlist();
    } else {
        // Hide loading indicator and show empty watchlist message
        document.getElementById('loadingIndicator').classList.add('hidden');
        document.getElementById('emptyWatchlist').classList.remove('hidden');
    }
});

// Update UI based on auth state
function updateAuthUI(user) {
    const loginBtn = document.getElementById('loginBtn');
    const mobileLoginBtn = document.getElementById('mobileLoginBtn');
    const userNameDisplay = document.getElementById('userNameDisplay');
    const mobileUserName = document.getElementById('mobileUserName');
    const mobileUserPhotoDisplay = document.getElementById('mobileUserPhotoDisplay');
    const mobileUserIconDisplay = document.getElementById('mobileUserIconDisplay');
    
    if (user) {
        const displayName = user.displayName || 'User';
        const userPhoto = user.photoURL || '';
        const shortName = displayName.split(' ')[0];
        
        if (userNameDisplay) userNameDisplay.textContent = shortName;
        if (mobileUserName) mobileUserName.textContent = shortName;
        
        // For desktop: show profile image with name
        if (loginBtn) {
            if (userPhoto) {
                loginBtn.innerHTML = '<img src="' + userPhoto + '" alt="Profile" class="w-8 h-8 rounded-full object-cover"><span>' + displayName + '</span>';
            } else {
                loginBtn.innerHTML = '<i class="fas fa-user"></i><span>' + displayName + '</span>';
            }
        }
        
        // For mobile: show only profile image
        if (mobileLoginBtn) {
            if (userPhoto) {
                mobileLoginBtn.innerHTML = '<img src="' + userPhoto + '" alt="Profile" class="w-6 h-6 rounded-full object-cover">';
                if (mobileUserPhotoDisplay) {
                    mobileUserPhotoDisplay.src = userPhoto;
                    mobileUserPhotoDisplay.classList.remove('hidden');
                }
                if (mobileUserIconDisplay) mobileUserIconDisplay.classList.add('hidden');
            } else {
                mobileLoginBtn.innerHTML = '<i class="fas fa-user text-xl"></i>';
                if (mobileUserPhotoDisplay) mobileUserPhotoDisplay.classList.add('hidden');
                if (mobileUserIconDisplay) mobileUserIconDisplay.classList.remove('hidden');
            }
        }
    } else {
        if (userNameDisplay) userNameDisplay.textContent = 'Login';
        if (mobileUserName) mobileUserName.textContent = 'Login';
        
        if (loginBtn) {
            loginBtn.innerHTML = '<i class="fas fa-user"></i><span>Login</span>';
        }
        
        if (mobileLoginBtn) {
            mobileLoginBtn.innerHTML = '<i class="fas fa-user text-xl"></i>';
            if (mobileUserPhotoDisplay) mobileUserPhotoDisplay.classList.add('hidden');
            if (mobileUserIconDisplay) mobileUserIconDisplay.classList.remove('hidden');
        }
    }
}

// Login button handlers
document.getElementById('loginBtn').addEventListener('click', () => {
    if (currentUser) {
        if (confirm(`Sign out ${currentUser.displayName}?`)) {
            auth.signOut();
        }
    } else {
        signInWithGoogle();
    }
});

document.getElementById('mobileLoginBtn').addEventListener('click', () => {
    if (currentUser) {
        if (confirm(`Sign out ${currentUser.displayName}?`)) {
            auth.signOut();
        }
    } else {
        signInWithGoogle();
    }
});

// Load watchlist from Firebase
function loadWatchlist() {
    if (!currentUser) return;
    
    const watchlistRef = database.ref(`watchlist/${currentUser.uid}`);
    watchlistRef.on('value', (snapshot) => {
        const watchlistContainer = document.getElementById('watchlistContainer');
        const loadingIndicator = document.getElementById('loadingIndicator');
        const emptyWatchlist = document.getElementById('emptyWatchlist');
        
        loadingIndicator.classList.add('hidden');
        
        if (snapshot.exists()) {
            const movies = snapshot.val();
            const movieList = Object.values(movies);
            
            if (movieList.length > 0) {
                emptyWatchlist.classList.add('hidden');
                displayWatchlist(movieList);
            } else {
                emptyWatchlist.classList.remove('hidden');
            }
        } else {
            emptyWatchlist.classList.remove('hidden');
        }
    });
}

// Display watchlist items with improved design
function displayWatchlist(movies) {
    const watchlistContainer = document.getElementById('watchlistContainer');
    
    // Clear container except for special elements
    watchlistContainer.innerHTML = `
        <div id="emptyWatchlist" class="col-span-full text-center py-12 glass-card rounded-xl hidden">
            <i class="fas fa-bookmark text-gray-500 text-5xl mb-4"></i>
            <h3 class="text-xl font-semibold mb-2">Your watchlist is empty</h3>
            <p class="text-gray-400 mb-4">Start adding movies and shows to your watchlist</p>
            <a href="./index.html" class="inline-block bg-accent hover:bg-cyan-400 text-primary font-bold py-2 px-6 rounded-lg transition duration-300">
                Browse Movies
            </a>
        </div>
        
        <div id="loadingIndicator" class="col-span-full text-center py-12 hidden">
            <i class="fas fa-spinner fa-spin text-accent text-3xl mb-4"></i>
            <p class="text-gray-400">Loading your watchlist...</p>
        </div>
    `;
    
    // Add movie items with improved design
    movies.forEach(movie => {
        const movieElement = document.createElement('div');
        movieElement.className = 'watchlist-card glass-card';
        movieElement.innerHTML = `
            <div class="relative overflow-hidden">
                <img src="${movie.poster}" alt="${movie.title}" class="w-full watchlist-card-img">
                <button class="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center remove-btn shadow-lg" 
                        data-movie-id="${movie.id}">
                    <i class="fas fa-times"></i>
                </button>
                <div class="absolute bottom-3 left-3 rating-badge text-white text-sm font-bold px-2 py-1 rounded">
                    <i class="fas fa-star mr-1"></i>${movie.rating.replace('⭐ ', '')}
                </div>
            </div>
            <div class="p-4">
                <h3 class="font-bold text-lg mb-1 truncate">${movie.title}</h3>
                <div class="flex justify-between items-center">
                    <span class="text-gray-400 text-sm">${movie.year}</span>
                    <button class="text-accent hover:text-cyan-300 text-sm flex items-center">
                        <i class="fas fa-info-circle mr-1"></i>Details
                    </button>
                </div>
            </div>
        `;
        
        // Add click event to view movie details
        movieElement.addEventListener('click', (e) => {
            if (!e.target.classList.contains('remove-btn') && !e.target.closest('.remove-btn')) {
                window.location.href = `details.html?id=${movie.id}`;
            }
        });
        
        // Add remove button event
        const removeBtn = movieElement.querySelector('.remove-btn');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeFromWatchlist(movie.id);
        });
        
        watchlistContainer.appendChild(movieElement);
    });
}

// Remove from watchlist
function removeFromWatchlist(movieId) {
    if (!currentUser) return;
    
    if (confirm('Remove this movie from your watchlist?')) {
        const watchlistRef = database.ref(`watchlist/${currentUser.uid}/${movieId}`);
        watchlistRef.remove()
            .then(() => {
                console.log('Movie removed from watchlist');
            })
            .catch((error) => {
                console.error('Error removing from watchlist:', error);
                alert('Error removing from watchlist. Please try again.');
            });
    }
}

// Add to watchlist - make it globally accessible
window.addToWatchlist = function() {
    if (!currentUser) {
        alert('Please log in to add movies to your watchlist.');
        return;
    }
    
    // Get movie data from the page
    const movieData = {
        id: window.currentMovieId,
        title: document.getElementById('movieTitle').textContent,
        poster: document.getElementById('moviePoster').src,
        year: document.getElementById('movieYear').textContent,
        rating: document.getElementById('movieRating').textContent,
        timestamp: Date.now()
    };
    
    // Save to Firebase
    const watchlistRef = database.ref(`watchlist/${currentUser.uid}/${window.currentMovieId}`);
    watchlistRef.set(movieData)
        .then(() => {
            // Update button UI
            const watchlistButton = document.getElementById('watchlistButton');
            if (watchlistButton) {
                watchlistButton.innerHTML = '<i class="fas fa-check-circle mr-2"></i>Added to Watchlist';
                watchlistButton.classList.remove('bg-purple-600', 'hover:bg-purple-700');
                watchlistButton.classList.add('bg-green-600', 'hover:bg-green-700');
                
                // Don't reset the button - keep it in the "Added" state permanently
                // The button will reset when the page is reloaded
            }
            
            console.log('Movie added to watchlist');
        })
        .catch((error) => {
            console.error('Error adding to watchlist:', error);
            alert('Error adding to watchlist. Please try again.');
        });
};

// Function to check if a movie is in the watchlist
window.isMovieInWatchlist = function(movieId) {
    if (!currentUser) return Promise.resolve(false);
    
    return database.ref(`watchlist/${currentUser.uid}/${movieId}`).once('value')
        .then(snapshot => snapshot.exists());
};