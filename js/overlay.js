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

function updatePopupContent(selectedCountry, selectedYear, selectedMode) {

    console.log(`updatePopupContent(${selectedCountry}, ${selectedYear}, ${selectedMode})`);

    updateStat1(selectedCountry, selectedYear, selectedMode);
    updateStat2(selectedCountry, selectedYear, selectedMode);
    
}

function updateStat1(selectedCountry, selectedYear, selectedMode){
    //const popup = document.getElementById("popup-window");
    //popup.innerHTML = html;

    const popupContent = document.getElementById("stat-1");
    if (!popupContent) return;

    selectedCountryData = dataCtx.immDataGrouped.get(selectedCountry);

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

function updateStat2(selectedCountry, selectedYear, selectedMode){

    let stat2Element = document.getElementById("stat-2");

    const width = stat2Element.clientWidth;
    const height = stat2Element.clientHeight;

    var divEl = d3.select("#stat-2");
    divEl.style("overflow", "hidden");
    var svgEl = divEl.select("svg");
    
    svgEl.style("display", "block")
         .attr("width", width)
         .attr("height", height);

    // Ensure bar chart is faded out and removed if we are switching back to ridgeline data
    svgEl.select("#barChartG")
        .transition().duration(750)
        .style("opacity", 0)
        .remove();

    let ageGroupData;
    if (selectedMode === "immigration") {
        ageGroupData = dataCtx.immDataWithAgeGrGrouped;
    } else if (selectedMode === "emigration"){
        ageGroupData = dataCtx.emiDataWithAgeGrGrouped;
    }

    // Get or create the ridgeline group wrapper
    let group = svgEl.select("#ridgelineG");
    if (group.empty()) {
        group = svgEl.append("g").attr("id", "ridgelineG");
    }

    if (!ageGroupData.has(selectedCountry) || !ageGroupData.get(selectedCountry).has(selectedYear)) {
        // Transition exit for all series
        group.selectAll(".series")
            .transition().duration(750)
            .style("opacity", 0)
            .remove();
        
        // Fade out axis
        group.select("#xAxisG")
            .transition()
            .duration(750)
            .style("opacity", 0);
        
        drawMigrationBarChart(selectedCountry, selectedYear, selectedMode);

        return;
    }

    // Ensure ridgeline group is visible
    group.transition().duration(750).style("opacity", 1);
    
    ageGroupData = ageGroupData.get(selectedCountry).get(selectedYear);

    const ageGroups = Object.values(dataCtx.ageGroupMap);
    
    let ageSeries = [];
    ageGroupData.forEach((d, key) => {
        let series = [];
        let sum = 0;
        for (let i = 0; i < ageGroups.length; i++) {
            const value = getTotalMigrValue(d.get(ageGroups[i]));
            series.push(value);
            sum += (value || 0);
        }
        ageSeries.push({ name: key, values: series, total: sum });
    });

    ageSeries.sort((a, b) => b.total - a.total);
    
    let availWidth = width;
    let availHeight = height;
    const countryLabelWidth = availWidth * 15/100;
    const xAxisHeight = availHeight * 8/100;
    const ridgelineHeight = availHeight - xAxisHeight;
    const margin = 5; 
    const bottomBuffer = 15;
    const areaOpacity = 0.6;

    const overlap = 8; 
    const n = ageSeries.length;
    
    let topReservedHeight = margin;
    if (n > 1) {
        const availableTotalH = ridgelineHeight - bottomBuffer - margin;
        const maxRidgeHeight = (overlap * availableTotalH) / (n + overlap - 1);
        topReservedHeight = maxRidgeHeight + margin;
    } else {
        topReservedHeight = (ridgelineHeight - bottomBuffer) / 2;
    }

    const x = d3.scalePoint()
        .domain(ageGroups)
        .range([countryLabelWidth, availWidth - margin])
        .padding(0.3);

    const y = d3.scalePoint()
        .domain(ageSeries.map(d => d.name))
        .range([topReservedHeight, ridgelineHeight - bottomBuffer]);

    let stepSize = y.step();
    if (n === 1) stepSize = 50; 

    const z = d3.scaleLog().base(10)
        .domain([1, d3.max(ageSeries, d => d3.max(d.values)) || 10]).nice()
        .range([0, -overlap * stepSize]);

    const area = d3.area()
        .curve(d3.curveBasis)
        .x((_, i) => x(ageGroups[i]))
        .y0(0)
        .y1(d => {
            const val = (d == null || isNaN(d)) ? 0 : d;
            return (val <= 1) ? 0 : z(val);
        });

    const line = area.lineY1();

    // --- Axis Update ---
    let xAxisG = group.select("#xAxisG");
    if (xAxisG.empty()) {
        xAxisG = group.append("g").attr("id", "xAxisG");
    }
    
    xAxisG.style("opacity", 1)
      .transition().duration(750)
      .attr("transform", `translate(0,${ridgelineHeight})`)
      .call(d3.axisBottom(x).tickSizeOuter(0));

    xAxisG.selectAll("text")
      .attr("transform", "rotate(-30) translate(0,0)")
      .style("text-anchor", "end")
      .style("fill", "#bbb");

    // --- Series Data Join ---
    
    const t = svgEl.transition().ease(d3.easeSinInOut).duration(750);

    const series = group.selectAll(".series")
        .data(ageSeries, d => d.name);

    series.exit()
        .transition(t)
        .style("opacity", 0)
        .remove();

    const seriesEnter = series.enter().append("g")
        .attr("class", "series")
        .attr("transform", d => `translate(0,${y(d.name)})`)
        .style("opacity", 0);

    seriesEnter.append("path")
        .attr("class", "area-path")
        .attr("fill", "#ddd")
        .attr("opacity", areaOpacity) 
        .attr("stroke", "#bbb") 
        .attr("stroke-width", 0.5)
        .attr("d", d => area(d.values));

    seriesEnter.append("path")
        .attr("class", "line-path")
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 0.5)
        .attr("d", d => line(d.values));

    seriesEnter.append("text")
        .attr("class", "label-text")
        .attr("x", countryLabelWidth)
        .attr("y", 0)
        .attr("text-anchor", "end") 
        .attr("font-size", "10px")
        .attr("fill", "#bbb");

    const seriesUpdate = seriesEnter.merge(series);

    // Ensure DOM order matches data order initially
    seriesUpdate.order();

    seriesUpdate
        .on("mouseenter", function() {
            const sel = d3.select(this);
            
            // Raise to top so it's not covered
            sel.raise();
            
            // Highlight text
            sel.select(".label-text")
                .attr("fill", "white")
                .attr("font-weight", "bold");
            
            // Make area opaque
            sel.select(".area-path")
                .attr("opacity", 1);
        })
        .on("mouseleave", function() {
            const sel = d3.select(this);
            
            // Reset text
            sel.select(".label-text")
                .attr("fill", "#bbb")
                .attr("font-weight", "normal");
            
            // Reset opacity
            sel.select(".area-path")
                .attr("opacity", areaOpacity);
            
            // Restore original DOM order
            seriesUpdate.order();
        });

    // Transition position
    seriesUpdate.transition(t)
        .attr("transform", d => `translate(0,${y(d.name)})`)
        .style("opacity", 1);

    // Transition shapes
    seriesUpdate.select(".area-path")
        .transition(t)
        .attr("d", d => area(d.values));

    seriesUpdate.select(".line-path")
        .transition(t)
        .attr("d", d => line(d.values));

    // Update text content and truncation
    seriesUpdate.select(".label-text")
        .text(d => d.name)
        .each(function(d) {
            const self = d3.select(this);
            const maxWidth = countryLabelWidth - 10; 
            const textLength = this.getComputedTextLength();
            
            if (textLength > maxWidth) {
                const approxCharWidth = 6; 
                const maxChars = Math.floor(maxWidth / approxCharWidth);
                if (d.name.length > maxChars) {
                     self.text(d.name.slice(0, maxChars - 2) + "...");
                }
            }
        });
        
    // Update tooltips
    seriesUpdate.select("title").remove();
    seriesUpdate.append("title").text(d => `${d.name}: ${d.total}`);

}

function getTotalMigrValue(array){
    if (!array || !Array.isArray(array)) return null;
    
    let maleVal = null;
    let femaleVal = null;

    for (let i = 0; i < array.length; i++) {
        const obj = array[i];
        if (obj.sex === "T") return obj.value;
        if (obj.sex === "M") maleVal = obj.value;
        if (obj.sex === "F") femaleVal = obj.value;
    }
    
    if (maleVal !== null && femaleVal !== null) {
        return maleVal + femaleVal;
    }
    
    if (maleVal !== null) return maleVal;
    if (femaleVal !== null) return femaleVal;
    
    return null;
}

function drawMigrationBarChart(selectedCountry, selectedYear, selectedMode){

    let migrationData;
    if (selectedMode === "immigration") {
        migrationData = dataCtx.immDataGrouped.get(selectedCountry).get(selectedYear);
    } else if (selectedMode === "emigration"){
        migrationData = dataCtx.emiDataGrouped.get(selectedCountry).get(selectedYear);
    }

    const divEl = d3.select("#stat-2");
    const svgEl = divEl.select("svg");
    const width = +svgEl.attr("width");
    const height = +svgEl.attr("height");

    // Create or select group for bar chart
    let barGroup = svgEl.select("#barChartG");
    if (barGroup.empty()) {
        barGroup = svgEl.append("g")
            .attr("id", "barChartG")
            .style("opacity", 0);
    }
    
    // Fade in the bar chart group
    barGroup.transition().duration(750).style("opacity", 1);

    // Dimensions
    const margin = { top: 30, right: 20, bottom: 10, left: width * 0.25 };
    const chartW = width - margin.left - margin.right;
    const chartH = height - margin.top - margin.bottom;

    // Inner group for content
    let contentG = barGroup.select(".content-group");
    if (contentG.empty()) {
        contentG = barGroup.append("g")
            .attr("class", "content-group")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);
    }

    if (!migrationData) {
        contentG.selectAll("*").remove();
        barGroup.select(".x-axis").remove();
        
        let noDataText = barGroup.select(".no-data-text");
        if(noDataText.empty()) {
             noDataText = barGroup.append("text")
                .attr("class", "no-data-text")
                .attr("x", width / 2)
                .attr("y", height / 2)
                .attr("text-anchor", "middle")
                .attr("fill", "#bbb");
        }
        noDataText.text("No data available");
        return;
    }
    
    barGroup.select(".no-data-text").remove();

    // Process data: extract total values and sort
    let data = [];
    migrationData.forEach((entries, country) => {
        const val = getTotalMigrValue(entries);
        if (val > 0) {
            data.push({ country: country, value: val });
        }
    });

    // Sort descending by value
    data.sort((a, b) => b.value - a.value);

    // Scales
    const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value) || 0])
        .range([0, chartW])
        .nice();

    const y = d3.scaleBand()
        .domain(data.map(d => d.country))
        .range([0, chartH])
        .padding(0.2);

    // --- Axis ---
    let xAxisG = barGroup.select(".x-axis");
    if (xAxisG.empty()) {
        xAxisG = barGroup.append("g").attr("class", "x-axis");
    }
    
    xAxisG.attr("transform", `translate(${margin.left}, ${margin.top})`)
        .transition().duration(750)
        .call(d3.axisTop(x).ticks(5).tickSizeOuter(0).tickFormat(d3.format(".2s")));

    xAxisG.selectAll("text").attr("fill", "#bbb");
    xAxisG.selectAll("line").attr("stroke", "#444");
    xAxisG.selectAll("path").attr("stroke", "#444");

    // --- Data Join ---
    const t = svgEl.transition().duration(750);

    const bars = contentG.selectAll(".bar-group")
        .data(data, d => d.country);

    // EXIT
    bars.exit()
        .transition(t)
        .style("opacity", 0)
        .remove();

    // ENTER
    const barsEnter = bars.enter().append("g")
        .attr("class", "bar-group")
        .attr("transform", d => `translate(0, ${y(d.country)})`)
        .style("opacity", 0);

    // Rectangles
    barsEnter.append("rect")
        .attr("class", "bar-rect")
        .attr("height", y.bandwidth())
        .attr("width", 0)
        .attr("fill", "#ddd")
        .attr("opacity", 0.6)
        .attr("stroke", "#bbb")
        .attr("stroke-width", 0.5);

    // Text Labels
    barsEnter.append("text")
        .attr("class", "label-text")
        .attr("x", -5)
        .attr("y", y.bandwidth() / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .attr("font-size", "10px")
        .attr("fill", "#bbb")
        .text(d => d.country);

    // UPDATE
    const barsUpdate = barsEnter.merge(bars);

    // Transition position (reordering)
    barsUpdate.transition(t)
        .attr("transform", d => `translate(0, ${y(d.country)})`)
        .style("opacity", 1);

    // Transition bar width
    barsUpdate.select(".bar-rect")
        .transition(t)
        .attr("width", d => x(d.value))
        .attr("height", y.bandwidth());

    // Update text truncation
    barsUpdate.select(".label-text")
        .attr("y", y.bandwidth() / 2)
        .each(function(d) {
            const self = d3.select(this);
            self.text(d.country);
            const maxWidth = margin.left - 10;
            const textLength = this.getComputedTextLength();
            if (textLength > maxWidth) {
                const approxCharWidth = 6;
                const maxChars = Math.floor(maxWidth / approxCharWidth);
                if (d.country.length > maxChars) {
                    self.text(d.country.slice(0, maxChars - 2) + "...");
                }
            }
        });

    // Tooltip
    barsUpdate.select("title").remove();
    barsUpdate.append("title")
        .text(d => `${d.country}: ${d.value}`);

    // Hover Effects
    barsUpdate.on("mouseenter", function() {
        const sel = d3.select(this);
        sel.raise();
        sel.select(".bar-rect").attr("opacity", 1);
        sel.select(".label-text").attr("fill", "white").attr("font-weight", "bold");
    })
    .on("mouseleave", function() {
        const sel = d3.select(this);
        sel.select(".bar-rect").attr("opacity", 0.6);
        sel.select(".label-text").attr("fill", "#bbb").attr("font-weight", "normal");
    });
}



// Nueva función: renderizar gráfico simple con D3 (línea anual)
function renderPopupChart(selectedCountry) {
    // Requiere [`mapCtx`](js/map.js)
    if (typeof mapCtx === 'undefined' || !dataCtx.immDataGrouped) {
        return;
    }

    const yearMap = dataCtx.immDataGrouped.get(selectedCountry);
    const container = document.getElementById("stat-1");
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


