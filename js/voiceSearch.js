// Voice Search Functionality for Movie Wiki
// This file contains the implementation for voice search feature

// Voice search functionality
function initVoiceSearch(searchInputId, searchButtonId, voiceButtonId) {
    // get main elements
    const search = document.querySelector(".search");
    const input = document.getElementById(searchInputId);
    const label = document.getElementById('searchLabel');
    const btnListen = document.getElementById(voiceButtonId);
    const btnSearch = document.getElementById(searchButtonId);
    let listening = false;
    
    /* Fallback for older browsers (not strictly needed but good practice) */
    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    // if there's speech recognition, show the microphone
    if (SpeechRecognition) {
        setTimeout(function () {
            if (btnListen) {
                btnListen.classList.add("show");
            }
            if (label) {
                const span = label.querySelector("span");
                if (span) {
                    span.classList.add("show");
                }
            }
        }, 1000);
    }
    
    // show/hide placeholder
    if (input) {
        input.addEventListener("input", function () {
            if (this.value.length === 0) {
                if (label) {
                    label.classList.remove("a11y-hidden");
                }
            } else {
                if (label) {
                    label.classList.add("a11y-hidden");
                }
            }
        });
    }
    
    // listen to speech
    if (btnListen) {
        btnListen.addEventListener("click", function () {
            // Check for microphone permissions before starting recognition
            if (navigator.permissions) {
                navigator.permissions.query({name: 'microphone'}).then(function(result) {
                    if (result.state === 'denied') {
                        alert('Microphone access is denied. Please enable microphone permissions in your browser settings to use voice search.');
                        return;
                    }
                    
                    // Start speech recognition
                    startSpeechRecognition();
                }).catch(function(err) {
                    console.log('Permission API not supported, starting speech recognition directly');
                    // Start speech recognition
                    startSpeechRecognition();
                });
            } else {
                // Browser doesn't support permissions API, start directly
                startSpeechRecognition();
            }
            
            function startSpeechRecognition() {
                if (!listening) {
                    const recognition = new SpeechRecognition();
                    
                    recognition.onstart = function () {
                        if (btnListen) {
                            btnListen.classList.add("active");
                            // Add visual feedback that voice search is active
                            const micIcon = btnListen.querySelector('i');
                            const micAnimation = btnListen.querySelector('svg');
                            if (micIcon) micIcon.classList.add('hidden');
                            if (micAnimation) micAnimation.classList.remove('hidden');
                        }
                        listening = true;
                    };
                    
                    recognition.onspeechend = function () {
                        recognition.stop();
                        if (btnListen) {
                            btnListen.classList.remove("active");
                            // Remove visual feedback
                            const micIcon = btnListen.querySelector('i');
                            const micAnimation = btnListen.querySelector('svg');
                            if (micIcon) micIcon.classList.remove('hidden');
                            if (micAnimation) micAnimation.classList.add('hidden');
                        }
                        listening = false;
                    };
                    
                    recognition.onerror = function (event) {
                        console.error('Speech recognition error:', event.error);
                        if (btnListen) {
                            btnListen.classList.remove("active");
                            // Remove visual feedback
                            const micIcon = btnListen.querySelector('i');
                            const micAnimation = btnListen.querySelector('svg');
                            if (micIcon) micIcon.classList.remove('hidden');
                            if (micAnimation) micAnimation.classList.add('hidden');
                        }
                        listening = false;
                        
                        // Show user-friendly error message
                        let errorMessage = 'Voice search error occurred.';
                        switch (event.error) {
                            case 'no-speech':
                                errorMessage = 'No speech was detected. Please try again.';
                                break;
                            case 'audio-capture':
                                errorMessage = 'Audio capture failed. Please check your microphone.';
                                break;
                            case 'not-allowed':
                                errorMessage = 'Permission to use microphone was denied. Please ensure you\'re using HTTPS and have granted microphone permissions. Voice search requires a secure connection (HTTPS) to function properly.';
                                break;
                            case 'service-not-allowed':
                                errorMessage = 'Speech service not allowed.';
                                break;
                            case 'bad-grammar':
                                errorMessage = 'There was an error with the grammar.';
                                break;
                            case 'language-not-supported':
                                errorMessage = 'The selected language is not supported.';
                                break;
                            default:
                                errorMessage = 'Voice search error: ' + event.error;
                        }
                        alert(errorMessage);
                    };
                    
                    recognition.onresult = function (event) {
                        const transcript = event.results[0][0].transcript;
                        const confidence = event.results[0][0].confidence;
                        
                        if (input) {
                            input.value = transcript;
                            input.focus();
                            if (transcript.length > 0) {
                                if (label) {
                                    label.classList.add("a11y-hidden");
                                }
                            }
                            // Perform search with the transcript
                            performSearch(transcript);
                        }
                    };
                    
                    try {
                        recognition.start();
                    } catch (error) {
                        console.error('Error starting speech recognition:', error);
                        alert('Voice search error: ' + error.message);
                    }
                }
            }
        });
    }
}

// Perform search function
function performSearch(query) {
    if (query && query.trim() !== '') {
        // Redirect to search results page with the query
        // Fix the path to use the correct relative path
        window.location.href = `./search.html?q=${encodeURIComponent(query)}`;
    }
}

// Export functions for use in other modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initVoiceSearch, performSearch };
}

// Perform search function
function performSearch(query) {
    if (query && query.trim() !== '') {
        // Redirect to search results page with the query
        // Fix the path to use the correct relative path
        window.location.href = `./search.html?q=${encodeURIComponent(query)}`;
    }
}

// Export functions for use in other modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initVoiceSearch, performSearch };
}