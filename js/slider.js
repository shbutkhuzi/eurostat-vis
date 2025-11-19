// Slider state management
const sliderState = {
    currentCountry: null,
    availableYears: [],
    currentYearIndex: 0,
    isPlaying: false,
    playInterval: null
};

// Initialize slider UI
function initSlider() {
    const playPauseButton = document.getElementById('play-pause-button');
    const yearSlider = document.getElementById('year-slider');

    // Play/Pause button click handler
    playPauseButton.addEventListener('click', togglePlayPause);

    // Slider input handler
    yearSlider.addEventListener('input', function() {
        if (sliderState.isPlaying) {
            stopAutoPlay();
        }
        sliderState.currentYearIndex = parseInt(this.value);
        updateYearDisplay();
        onSliderValueChange();
    });
}

// Toggle play/pause
function togglePlayPause() {
    if (sliderState.isPlaying) {
        stopAutoPlay();
    } else {
        startAutoPlay();
    }
}

// Start automatic progression
function startAutoPlay() {
    if (sliderState.availableYears.length === 0) return;
    
    sliderState.isPlaying = true;
    updatePlayPauseIcon();
    
    sliderState.playInterval = setInterval(() => {
        // Move to next year
        sliderState.currentYearIndex++;
        
        // Loop back to start if at the end
        if (sliderState.currentYearIndex >= sliderState.availableYears.length) {
            sliderState.currentYearIndex = 0;
        }
        
        updateSliderPosition();
        updateYearDisplay();
        onSliderValueChange();
    }, 2000);
}

// Stop automatic progression
function stopAutoPlay() {
    sliderState.isPlaying = false;
    updatePlayPauseIcon();
    
    if (sliderState.playInterval) {
        clearInterval(sliderState.playInterval);
        sliderState.playInterval = null;
    }
}

// Update play/pause icon
function updatePlayPauseIcon() {
    const icon = document.getElementById('play-pause-icon');
    
    if (sliderState.isPlaying) {
        // Pause icon (two vertical bars)
        icon.innerHTML = `
            <rect x="7" y="5" width="3" height="14" fill="white" rx="1"/>
            <rect x="14" y="5" width="3" height="14" fill="white" rx="1"/>
        `;
    } else {
        // Play icon (triangle)
        icon.innerHTML = `
            <path d="M8 5 L8 19 L18 12 Z" fill="white"/>
        `;
    }
}

// Update slider position
function updateSliderPosition() {
    const slider = document.getElementById('year-slider');
    slider.value = sliderState.currentYearIndex;
}

// Update year display
function updateYearDisplay() {
    const yearDisplay = document.getElementById('year-display');
    if (sliderState.availableYears.length > 0) {
        yearDisplay.textContent = sliderState.availableYears[sliderState.currentYearIndex];
    } else {
        yearDisplay.textContent = '';
    }
}

// Load years for selected country
function loadYearsForCountry(country) {
    // Stop any ongoing auto-play
    if (sliderState.isPlaying) {
        stopAutoPlay();
    }
    
    sliderState.currentCountry = country;
    
    // Get years from mapCtx
    const yearMap = mapCtx.immDataGrouped.get(country);
    
    if (yearMap) {
        // Extract all years and sort them
        sliderState.availableYears = Array.from(yearMap.keys()).sort((a, b) => a - b);
        sliderState.currentYearIndex = 0; // Start at minimum year
        
        // Update slider attributes
        const slider = document.getElementById('year-slider');
        slider.min = 0;
        slider.max = sliderState.availableYears.length - 1;
        slider.value = 0;
        slider.step = 1;
        
        // Update display
        updateYearDisplay();
        updatePlayPauseIcon();
        
        // Show slider
        showSlider();
        
        // Trigger initial visualization update
        // onSliderValueChange();
    }
}

// Clear slider when no country is selected
function clearSlider() {
    // Stop any ongoing auto-play
    if (sliderState.isPlaying) {
        stopAutoPlay();
    }
    
    sliderState.currentCountry = null;
    sliderState.availableYears = [];
    sliderState.currentYearIndex = 0;
    
    // Hide slider
    hideSlider();
}

// Show slider
function showSlider() {
    const sliderContainer = document.getElementById('slider-container');
    sliderContainer.classList.add('visible');
}

// Hide slider
function hideSlider() {
    const sliderContainer = document.getElementById('slider-container');
    sliderContainer.classList.remove('visible');
}

// Get current selected year
function getCurrentYear() {
    if (sliderState.availableYears.length > 0) {
        return sliderState.availableYears[sliderState.currentYearIndex];
    }
    return null;
}

// Callback when slider value changes
function onSliderValueChange() {

    const currentYear = getCurrentYear();
    console.log('Slider changed to year:', currentYear, 'for country:', sliderState.currentCountry);
    
    updateImmFlow(sliderState.currentCountry, currentYear);
}

// Update slider visibility based on country selection
function updateSliderVisibility(countrySelected, selectedCountry = null) {
    if (countrySelected && selectedCountry) {
        loadYearsForCountry(selectedCountry);
    } else {
        clearSlider();
    }
}
