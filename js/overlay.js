// Overlay state management
const overlayState = {
    isPopupOpen: false,
    isAnimating: false
};

// Initialize overlay UI
function initOverlay() {
    const overlayContainer = document.getElementById('overlay-container');
    const detailsButton = document.getElementById('details-button');
    const popupWindow = document.getElementById('popup-window');

    // Button click handler
    detailsButton.addEventListener('click', togglePopup);
}

// Toggle popup window
function togglePopup() {
    if (overlayState.isAnimating) return;
    
    const popupWindow = document.getElementById('popup-window');
    const buttonIcon = document.getElementById('button-icon');
    
    if (overlayState.isPopupOpen) {
        closePopup();
    } else {
        openPopup();
    }
}

// Open popup window
function openPopup() {
    overlayState.isAnimating = true;
    const popupWindow = document.getElementById('popup-window');
    const buttonIcon = document.getElementById('button-icon');
    
    popupWindow.classList.remove('closing');
    popupWindow.classList.add('visible');
    
    // Change icon to close (X)
    buttonIcon.innerHTML = `
        <line x1="6" y1="6" x2="18" y2="18" stroke="white" stroke-width="2" stroke-linecap="round"/>
        <line x1="18" y1="6" x2="6" y2="18" stroke="white" stroke-width="2" stroke-linecap="round"/>
    `;
    
    overlayState.isPopupOpen = true;
    
    setTimeout(() => {
        overlayState.isAnimating = false;
    }, 400);
}

// Close popup window
function closePopup() {
    overlayState.isAnimating = true;
    const popupWindow = document.getElementById('popup-window');
    const buttonIcon = document.getElementById('button-icon');
    
    popupWindow.classList.add('closing');
    
    // Change icon back to info/details
    buttonIcon.innerHTML = `
        <circle cx="12" cy="12" r="9" stroke="white" stroke-width="2" fill="none"/>
        <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">i</text>
    `;
    
    setTimeout(() => {
        popupWindow.classList.remove('visible', 'closing');
        overlayState.isPopupOpen = false;
        overlayState.isAnimating = false;
    }, 300);
}

// Show button when country is selected
function showDetailsButton() {
    const detailsButton = document.getElementById('details-button');
    detailsButton.classList.add('visible');
}

// Hide button when country is deselected
function hideDetailsButton() {
    const detailsButton = document.getElementById('details-button');
    
    // If popup is open, close it first
    if (overlayState.isPopupOpen) {
        closePopup();
        // Wait for popup close animation to finish before hiding button
        setTimeout(() => {
            detailsButton.classList.remove('visible');
        }, 300);
    } else {
        detailsButton.classList.remove('visible');
    }
}

// Update overlay based on country selection
function updateOverlayVisibility(countrySelected) {
    if (countrySelected) {
        showDetailsButton();
    } else {
        hideDetailsButton();
    }
}
