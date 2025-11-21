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

function updatePopupContent(selectedCountry) {
    //const popup = document.getElementById("popup-window");
    //popup.innerHTML = html;

    const popupContent = document.getElementById("popup-content");
    if (!popupContent) return;

    selectedCountryData = mapCtx.immDataGrouped.get(selectedCountry);

    let totalEntries = 0;
    if (selectedCountryData) {
        selectedCountryData.forEach((countryMap, year) => {
            countryMap.forEach((entries, country) => {
                totalEntries += d3.sum(entries.filter(x => x.sex === "T"), d => d.value);
            });
        });
    }

    popupContent.innerHTML = `
            <h2>${selectedCountry}</h2>
            <p><b>Total records:</b> ${totalEntries}</p>
            `;

    // Render chart if selectedCountry provided
    if (selectedCountry) {
        // Defer slightly to ensure DOM updated
        setTimeout(() => {
            renderPopupChart(selectedCountry);
        }, 0);
    }
}

// Nueva función: renderizar gráfico simple con D3 (línea anual)
function renderPopupChart(selectedCountry) {
    // Requiere [`mapCtx`](js/map.js)
    if (typeof mapCtx === 'undefined' || !mapCtx.immDataGrouped) {
        return;
    }

    const yearMap = mapCtx.immDataGrouped.get(selectedCountry);
    const container = document.getElementById("popup-content");
    if (!container) return;

    // Limpiar chart anterior
    const existing = container.querySelector('#popup-chart');
    if (existing) existing.remove();

    const chartDiv = document.createElement('div');
    chartDiv.id = 'popup-chart';
    chartDiv.style.width = '100%';
    chartDiv.style.height = '200px';
    container.appendChild(chartDiv);

    if (!yearMap) {
        chartDiv.innerHTML = '<p style="color:#ccc">No data available</p>';
        return;
    }

    // Construir array [{year, value}]
    const data = Array.from(yearMap.entries())
        .map(([y, countryMap]) => {
            let totalValue = 0;
            countryMap.forEach((entries) => {
                totalValue += d3.sum(entries.filter(x => x.sex === "T"), d => d.value || 0);
            });
            return { year: +y, value: totalValue };
        })
        .sort((a, b) => a.year - b.year);

    // dimensiones
    const margin = {top: 8, right: 12, bottom: 24, left: 100};
    const width = chartDiv.clientWidth || 400;
    const height = 200;
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    // Crear SVG
    const svg = d3.select(chartDiv)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('font-family', 'Inter, Arial, sans-serif') // fuente para elementos SVG
        .style('font-size', '12px');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.year))
        .range([0, w]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value) || 1])
        .nice()
        .range([h, 0]);

    // añadir padding a las etiquetas del eje y quitar ticks exteriores
    const xAxis = d3.axisBottom(x)
        .ticks(Math.min(6, data.length))
        .tickFormat(d3.format("d"))
        .tickPadding(8)     // separa labels del eje
        .tickSizeOuter(0);  // elimina el tick de fuera

    const yAxis = d3.axisLeft(y)
        .ticks(4)
        .tickPadding(6)
        .tickSizeOuter(0);

    g.append('g')
        .attr('transform', `translate(0,${h})`)
        .call(xAxis)
        .selectAll('text')
        .attr('fill', '#bbb');
        

    g.append('g')
        .call(yAxis)
        .selectAll('text')
        .attr('fill', '#bbb');
        

    // Line generator
    const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.value))
        .defined(d => !isNaN(d.value));

    g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', '#9d28d3')
        .attr('stroke-width', 2)
        .attr('d', line);

    // puntos
    g.selectAll('circle')
        .data(data)
        .enter()
        .append('circle')
        .attr('cx', d => x(d.year))
        .attr('cy', d => y(d.value))
        .attr('r', 3)
        .attr('fill', '#ffd6f8')
        .attr('stroke', '#6b1f9b')
        .attr('stroke-width', 0.5)
        .append('title')
        .text(d => `${d.year}: ${d.value}`);
}


