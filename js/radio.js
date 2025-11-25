// Radio button state management
const radioState = {
    currentMode: 'immigration' // 'immigration' or 'emigration'
};

// Initialize radio button UI
function initRadio() {
    const radioContainer = document.getElementById('radio-container');
    const radioInputs = document.querySelectorAll('input[name="data-mode"]');

    // Add change event listeners to radio inputs
    radioInputs.forEach(input => {
        input.addEventListener('change', function() {
            if (this.checked) {
                radioState.currentMode = this.value;
                onRadioModeChange(this.value);
            }
        });
    });

    // Don't show radio button on page load - wait for country selection
    // showRadio();
}

// Show radio button
function showRadio() {
    const radioContainer = document.getElementById('radio-container');
    radioContainer.classList.add('visible');
}

// Hide radio button
function hideRadio() {
    const radioContainer = document.getElementById('radio-container');
    radioContainer.classList.remove('visible');
}

// Get current selected mode
function getCurrentMode() {
    return radioState.currentMode;
}

// Callback when radio selection changes
function onRadioModeChange(mode) {
    // console.log('Radio mode changed to:', mode);
    
}

// Update radio visibility based on country selection
function updateRadioVisibility(countrySelected) {
    if (countrySelected) {
        showRadio();
    } else {
        hideRadio();
    }
}
