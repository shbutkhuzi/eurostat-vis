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

// Show radio button with selective enabling/disabling
function showRadio(immigrationEnable = true, emigrationEnable = true) {
    const radioContainer = document.getElementById('radio-container');
    const immigrationInput = document.getElementById('immigration-radio');
    const emigrationInput = document.getElementById('emigration-radio');
    const immigrationLabel = document.querySelector('label[for="immigration-radio"]');
    const emigrationLabel = document.querySelector('label[for="emigration-radio"]');
    
    // Enable/disable immigration radio
    immigrationInput.disabled = !immigrationEnable;
    if (immigrationEnable) {
        immigrationLabel.classList.remove('disabled');
    } else {
        immigrationLabel.classList.add('disabled');
    }
    
    // Enable/disable emigration radio
    emigrationInput.disabled = !emigrationEnable;
    if (emigrationEnable) {
        emigrationLabel.classList.remove('disabled');
    } else {
        emigrationLabel.classList.add('disabled');
    }
    
    // If current selection is disabled, switch to enabled one
    if (!immigrationEnable && radioState.currentMode === 'immigration' && emigrationEnable) {
        emigrationInput.checked = true;
        radioState.currentMode = 'emigration';
    } else if (!emigrationEnable && radioState.currentMode === 'emigration' && immigrationEnable) {
        immigrationInput.checked = true;
        radioState.currentMode = 'immigration';
    }
    
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
    switchFlow();
}

// Update radio visibility based on country selection
function updateRadioVisibility(selectedCountry) {
    if (selectedCountry) {
        const immigrationEnable = dataCtx.immDstCountries.includes(selectedCountry);
        const emigrationEnable = dataCtx.emiSrcCountries.includes(selectedCountry);
        showRadio(immigrationEnable, emigrationEnable);
    } else {
        hideRadio();
    }
}
