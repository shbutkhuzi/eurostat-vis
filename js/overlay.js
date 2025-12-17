// Overlay state management
const overlayState = {
    isStatsPopupOpen: false,
    isInfoPopupOpen: false,
    isAnimating: false,
    lastPopupSelection: null,
    _stat1LayoutRaf: null
};

// Initialize overlay UI
function initOverlay() {
    const detailsButton = document.getElementById('details-button');
    const statisticsButton = document.getElementById('statistics-button');

    // Button click handler
    detailsButton.addEventListener('click', toggleInfoPopup);
    statisticsButton.addEventListener('click', toggleStatsPopup);
}

// Toggle stats popup window
function toggleStatsPopup() {
    if (overlayState.isAnimating) return;
    
    if (overlayState.isStatsPopupOpen) {
        closeStatsPopup();
    } else {
        openStatsPopup();
    }
}

// Toggle info popup window
function toggleInfoPopup() {
    if (overlayState.isAnimating) return;
    
    if (overlayState.isInfoPopupOpen) {
        closeInfoPopup();
    } else {
        openInfoPopup();
    }
}

// Open stats popup window
function openStatsPopup() {
    overlayState.isAnimating = true;
    const popupWindow = document.getElementById('popup-window');
    const statsIcon = document.getElementById('stats-icon');
    
    popupWindow.classList.remove('closing');
    popupWindow.classList.add('visible');
    
    // Change icon to close (X)
    statsIcon.innerHTML = `
        <line x1="6" y1="6" x2="18" y2="18" stroke="white" stroke-width="2" stroke-linecap="round"/>
        <line x1="18" y1="6" x2="6" y2="18" stroke="white" stroke-width="2" stroke-linecap="round"/>
    `;
    
    overlayState.isStatsPopupOpen = true;
    
    setTimeout(() => {
        overlayState.isAnimating = false;
    }, 400);
}

// Close stats popup window
function closeStatsPopup() {
    overlayState.isAnimating = true;
    const popupWindow = document.getElementById('popup-window');
    const statsIcon = document.getElementById('stats-icon');
    
    popupWindow.classList.add('closing');
    
    // Change icon back to stats
    statsIcon.innerHTML = `
        <path d="M3 20H21" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M3 20V4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="7" y="12" width="3" height="6" fill="white" rx="0.5"/>
        <rect x="12" y="6" width="3" height="12" fill="white" rx="0.5"/>
        <rect x="17" y="9" width="3" height="9" fill="white" rx="0.5"/>
    `;
    
    setTimeout(() => {
        popupWindow.classList.remove('visible', 'closing');
        overlayState.isStatsPopupOpen = false;
        overlayState.isAnimating = false;
    }, 300);
}

// Open info popup window
function openInfoPopup() {
    overlayState.isAnimating = true;
    const popupWindow = document.getElementById('info-popup-window');
    const buttonIcon = document.getElementById('button-icon');
    
    popupWindow.classList.remove('closing');
    popupWindow.classList.add('visible');
    
    // Change icon to close (X)
    buttonIcon.innerHTML = `
        <line x1="6" y1="6" x2="18" y2="18" stroke="white" stroke-width="2" stroke-linecap="round"/>
        <line x1="18" y1="6" x2="6" y2="18" stroke="white" stroke-width="2" stroke-linecap="round"/>
    `;
    
    overlayState.isInfoPopupOpen = true;
    
    setTimeout(() => {
        overlayState.isAnimating = false;
    }, 400);
}

// Close info popup window
function closeInfoPopup() {
    overlayState.isAnimating = true;
    const popupWindow = document.getElementById('info-popup-window');
    const buttonIcon = document.getElementById('button-icon');
    
    popupWindow.classList.add('closing');
    
    // Change icon back to info
    buttonIcon.innerHTML = `
        <circle cx="12" cy="12" r="9" stroke="white" stroke-width="2" fill="none"/>
        <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">i</text>
    `;
    
    setTimeout(() => {
        popupWindow.classList.remove('visible', 'closing');
        overlayState.isInfoPopupOpen = false;
        overlayState.isAnimating = false;
    }, 300);
}

// Show button when country is selected
function showDetailsButton() {
    const statisticsButton = document.getElementById('statistics-button');
    statisticsButton.classList.add('visible');
}

// Hide button when country is deselected
function hideDetailsButton() {
    const statisticsButton = document.getElementById('statistics-button');
    
    // If popup is open, close it first
    if (overlayState.isStatsPopupOpen) {
        closeStatsPopup();
        // Wait for popup close animation to finish before hiding button
        setTimeout(() => {
            statisticsButton.classList.remove('visible');
        }, 300);
    } else {
        statisticsButton.classList.remove('visible');
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

     // expose current selected year so highlight/playback helpers can use it
    window.popupSelectedYear = selectedYear;

    // if a highlight helper exists, ask it to update (keeps sync with slider/play)
    if (typeof window.highlightPopupYear === "function" && selectedYear != null) {
        // call async so render/update sequence finished
        setTimeout(() => window.highlightPopupYear(selectedYear), 20);
    }

    updateStat1(selectedCountry, selectedYear, selectedMode);
    updateStat2(selectedCountry, selectedYear, selectedMode);

    overlayState.lastPopupSelection = { selectedCountry, selectedYear, selectedMode };
    
}


let lastRenderedCountry = null;
let lastRenderedMode = null;


function updateStat1(selectedCountry, selectedYear, selectedMode){
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

    popupContent.style.display = "flex";
    popupContent.style.flexDirection = "column";
    popupContent.style.overflow = "hidden";

    // ONLY rebuild HTML if country OR mode changed
    if (selectedCountry !== lastRenderedCountry || selectedMode !== lastRenderedMode) {
        popupContent.innerHTML = `
            <div id="stat-1-header">
                <h2>${selectedCountry || ''}</h2>
                <p><b>Total records:</b> ${totalEntries.toLocaleString()}</p>
            </div>
            <div id="popup-chart-wrapper"></div>
            <div id="gdp-chart-container" style="margin-top:12px;"></div>
        `;

        lastRenderedCountry = selectedCountry;
        lastRenderedMode = selectedMode;
    } else {
        // Country didn't change, just update the header text (if needed)
        const header = popupContent.querySelector("#stat-1-header");
        if (header) {
            header.querySelector("p").innerHTML = `<b>Total records:</b> ${totalEntries.toLocaleString()}`;
        }
    }
    // update lastRenderedMode even if only header updated
    lastRenderedMode = selectedMode;

    scheduleStat1Layout(selectedCountry, selectedYear, selectedMode);
}

function scheduleStat1Layout(selectedCountry, selectedYear, selectedMode) {
    if (overlayState._stat1LayoutRaf) {
        cancelAnimationFrame(overlayState._stat1LayoutRaf);
    }
    overlayState._stat1LayoutRaf = requestAnimationFrame(() => {
        overlayState._stat1LayoutRaf = null;
        layoutStat1Charts(selectedCountry, selectedYear, selectedMode);
    });
}

function layoutStat1Charts(selectedCountry, selectedYear, selectedMode) {
    const stat1 = document.getElementById("stat-1");
    if (!stat1) return;

    const header = stat1.querySelector("#stat-1-header");
    const lineContainer = stat1.querySelector("#popup-chart-wrapper");
    const gdpContainer = stat1.querySelector("#gdp-chart-container");
    if (!lineContainer || !gdpContainer) return;

    stat1.style.overflow = "hidden";
    lineContainer.style.overflow = "hidden";
    gdpContainer.style.overflow = "hidden";
    gdpContainer.style.marginTop = "12px";

    const totalH = stat1.clientHeight || 0;
    const headerH = header ? header.offsetHeight : 0;
    const gapH = 12;
    const safety = 10;
    const available = Math.max(0, totalH - headerH - gapH - safety);
    if (available <= 0) return;

    const ratio = 0.38;
    const minLine = 140;
    const minGdp = 160;

    let lineH;
    let gdpH;

    if (available >= (minLine + minGdp)) {
        lineH = Math.round(available * ratio);
        lineH = Math.max(minLine, Math.min(lineH, available - minGdp));
        gdpH = available - lineH;
    } else {
        lineH = Math.max(110, Math.floor(available * ratio));
        gdpH = Math.max(110, available - lineH);
        if (lineH + gdpH > available) {
            lineH = Math.max(0, available - gdpH);
        }
    }

    lineContainer.style.flex = `0 0 ${lineH}px`;
    lineContainer.style.height = `${lineH}px`;

    gdpContainer.style.flex = `0 0 ${gdpH}px`;
    gdpContainer.style.height = `${gdpH}px`;

    window._stat1LayoutKeys = window._stat1LayoutKeys || { line: null, gdp: null };

    const lineKey = `${selectedCountry || ''}|${selectedMode || ''}|${lineContainer.clientWidth}|${lineH}`;
    if (selectedCountry && selectedMode && window._stat1LayoutKeys.line !== lineKey) {
        renderPopupChart(selectedCountry, selectedMode, lineH);
        window._stat1LayoutKeys.line = lineKey;
    }

    if (selectedYear) {
        const gdpKey = `${selectedCountry || ''}|${selectedMode || ''}|${selectedYear}|${gdpContainer.clientWidth}|${gdpH}`;
        if (window._stat1LayoutKeys.gdp !== gdpKey) {
            renderGdpBarChart(selectedCountry, selectedYear, selectedMode, 10, gdpH);
            window._stat1LayoutKeys.gdp = gdpKey;
        }
    } else {
        gdpContainer.innerHTML = '<p style="color:#999">Select a year to show GDP top 10.</p>';
        window._stat1LayoutKeys.gdp = null;
    }
}

window.addEventListener("resize", () => {
    if (!overlayState.isStatsPopupOpen || !overlayState.lastPopupSelection) return;
    const { selectedCountry, selectedYear, selectedMode } = overlayState.lastPopupSelection;
    scheduleStat1Layout(selectedCountry, selectedYear, selectedMode);
});

function updateStat2(selectedCountry, selectedYear, selectedMode){

    const stat2Element = document.getElementById("stat-2");
    if (!stat2Element) return;

    const titleHeight = 28;

    stat2Element.style.display = "flex";
    stat2Element.style.flexDirection = "column";

    let titleEl = stat2Element.querySelector("#stat-2-title");
    if (!titleEl) {
        titleEl = document.createElement("div");
        titleEl.id = "stat-2-title";
        stat2Element.insertBefore(titleEl, stat2Element.firstChild);
    }

    titleEl.textContent = "Migration volume breakdown (partner country, age when available)";
    Object.assign(titleEl.style, {
        height: `${titleHeight}px`,
        lineHeight: `${titleHeight}px`,
        flex: `0 0 ${titleHeight}px`,
        padding: "0 8px",
        fontSize: "12px",
        fontWeight: "600",
        color: "#ccc",
        textAlign: "center",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        userSelect: "none"
    });

    const width = stat2Element.clientWidth;
    const containerHeight = stat2Element.clientHeight;
    const height = Math.max(0, containerHeight - titleHeight);

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

function renderPopupChart(selectedCountry, selectedMode, targetHeight = null) {
    const container = document.getElementById("popup-chart-wrapper");
    if (!container || !dataCtx) return;

    // choose correct grouped timeseries map based on mode
    const grouped = (selectedMode === "emigration") ? dataCtx.emiDataGrouped : dataCtx.immDataGrouped;
    if (!grouped) {
        container.innerHTML = '<div class="fallback-text" style="color:#ccc">No migration time series data</div>';
        window.popupSeriesData = null;
        window.popupScales = null;
        return;
    }

    const yearMap = grouped.get(selectedCountry);

    // ensure DOM order: popup-chart-wrapper above gdp-chart-container (updateStat1 already does this)

    // create or reuse svg
    let svg = d3.select(container).select("svg#popup-svg");
    if (svg.empty()) {
        container.innerHTML = ''; // clear any fallback
        svg = d3.select(container)
            .append("svg")
            .attr("id", "popup-svg")
            .style("font-family", "Inter, Arial, sans-serif")
            .style("font-size", "12px");
    }

    if (!yearMap) {
        svg.remove();
        const msg = document.createElement('div');
        msg.className = 'fallback-text';
        msg.style.color = '#ccc';
        msg.textContent = 'No migration time series data';
        container.appendChild(msg);
        // clear any previously stored series so highlight doesn't try to access it
        window.popupSeriesData = null;
        window.popupScales = null;
        return;
    }

    const data = Array.from(yearMap.entries())
        .map(([y, countryMap]) => {
            let totalValue = 0;
            countryMap.forEach(entries => {
                totalValue += d3.sum(entries.filter(x => x.sex === "T"), d => d.value || 0);
            });
            return { year: +y, value: totalValue };
        })
        .sort((a, b) => a.year - b.year);

    // store series (years + values) globally so slider/play controls can sync highlights
    window.popupSeriesData = data;
    // allow clients to find year indices
    window.popupSeriesYears = data.map(d => d.year);

    const margin = { top: 12, right: 12, bottom: 38, left: 100 };
    const width = Math.max(320, container.clientWidth || 400);
    const height = (targetHeight != null) ? Math.max(140, Math.floor(targetHeight)) : 200;
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    svg.attr("width", width).attr("height", height);

    // main group
    let g = svg.select("g#popupG");
    if (g.empty()) g = svg.append("g").attr("id", "popupG");
    g.attr("transform", `translate(${margin.left},${margin.top})`);

    // scales
    const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.year))
        .range([0, w]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value) || 1])
        .nice()
        .range([h, 0]);

    // keep scales and groups accessible for highlight function
    window.popupScales = { x, y, g, svg, margin, w, h, width, height };

    // axis groups (clear group contents to avoid doubling)
    let xAxisG = g.select("g#popup-x-axis");
    if (xAxisG.empty()) xAxisG = g.append("g").attr("id", "popup-x-axis");
    xAxisG.attr("transform", `translate(0, ${h})`);
    xAxisG.selectAll("*").remove();

    let yAxisG = g.select("g#popup-y-axis");
    if (yAxisG.empty()) yAxisG = g.append("g").attr("id", "popup-y-axis");
    yAxisG.selectAll("*").remove();

    const svgT = svg.transition().duration(750).ease(d3.easeSinInOut);

    // draw axes
    xAxisG.transition(svgT).call(d3.axisBottom(x).ticks(Math.min(6, data.length)).tickFormat(d3.format("d")).tickPadding(8).tickSizeOuter(0));
    xAxisG.selectAll("text")
        .attr("fill", "#bbb")
        .style("font-size", "11px")
        .attr("transform", "rotate(-30)")
        .attr("text-anchor", "end");
    yAxisG.transition(svgT).call(d3.axisLeft(y).ticks(4).tickPadding(6).tickSizeOuter(0));
    yAxisG.selectAll("text").attr("fill", "#bbb").style("font-size", "11px");

    // line generator & path
    const lineGen = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.value))
        .defined(d => !isNaN(d.value));

    let path = g.select("path#popup-line");
    const pathD = lineGen(data);

    if (path.empty()) {
        path = g.append("path")
            .attr("id", "popup-line")
            .attr("fill", "none")
            .attr("stroke", "#9d28d3")
            .attr("stroke-width", 2);
    }

    path.attr("d", pathD);

    // stroke-dash animation (same transition style)
    try {
        const node = path.node();
        const totalLen = node.getTotalLength();
        path.attr("stroke-dasharray", `${totalLen} ${totalLen}`)
            .attr("stroke-dashoffset", totalLen)
            .transition(svgT)
            .attr("stroke-dashoffset", 0);
    } catch (e) {
        path.style("opacity", 0).transition(svgT).style("opacity", 1);
    }

    // points data join
    const points = g.selectAll("circle.popup-point").data(data, d => d.year);

    points.exit().transition(svgT).attr("r", 0).style("opacity", 0).remove();

    const pointsEnter = points.enter().append("circle")
        .attr("class", "popup-point")
        .attr("cx", d => x(d.year))
        .attr("cy", d => y(d.value))
        .attr("r", 0)
        .attr("fill", "#ffd6f8")
        .attr("stroke", "#6b1f9b")
        .attr("stroke-width", 0.5)
        .style("opacity", 0);

    const pointsMerge = pointsEnter.merge(points);
    pointsMerge.transition(svgT)
        .delay((d, i) => 200 + i * 50)
        .duration(400)
        .ease(d3.easeCubicOut)
        .attr("r", 3)
        .style("opacity", 1)
        .attr("cx", d => x(d.year))
        .attr("cy", d => y(d.value));

    // tooltip title
    pointsMerge.select("title").remove();
    pointsMerge.append("title").text(d => `${d.year}: ${d.value}`);
    // Highlight group (single marker + label) — create once and reuse
    let hl = svg.select("g#popup-highlight-group");
    if (hl.empty()) {
        hl = svg.append("g").attr("id", "popup-highlight-group").style("pointer-events", "none").style("opacity", 0);
        // marker circle (in popup G coordinates -> append inside g and translate with margin)
        hl.append("circle").attr("id", "popup-highlight-circle")
            .attr("r", 6)
            .attr("fill", "#ffeb3b")
            .attr("stroke", "#6b1f9b")
            .attr("stroke-width", 1.5);
        // numeric label background
        hl.append("rect").attr("id", "popup-highlight-bg")
            .attr("rx", 4)
            .attr("ry", 4)
            .attr("fill", "rgba(0,0,0,0.6)");
        // numeric label text
        hl.append("text").attr("id", "popup-highlight-label")
            .attr("fill", "#fff")
            .style("font-size", "12px")
            .style("font-weight", "700")
            .attr("dy", "0.35em");
    }

    // Ensure highlight state matches currently selected year (if any)
    if (window.popupSelectedYear != null) {
        setTimeout(() => {
            if (typeof window.highlightPopupYear === "function") window.highlightPopupYear(window.popupSelectedYear);
        }, 120);
    }
}


function renderGdpBarChart(selectedCountry, selectedYear, selectedMode, topN = 10, maxHeight = null) {
    const container = document.getElementById("gdp-chart-container");
    if (!container || !dataCtx || !dataCtx.gdpDataGrouped) return;

    // Determine connected partner countries for selectedCountry/year/mode
    let connectedSet = new Set();
    try {
        if (selectedCountry && selectedYear) {
            let yearMapForCountry = null;
            if (selectedMode === "immigration") {
                const countryMap = dataCtx.immDataGrouped.get(selectedCountry);
                if (countryMap) yearMapForCountry = countryMap.get(selectedYear);
            } else if (selectedMode === "emigration") {
                const countryMap = dataCtx.emiDataGrouped.get(selectedCountry);
                if (countryMap) yearMapForCountry = countryMap.get(selectedYear);
            }
            if (yearMapForCountry && typeof yearMapForCountry.forEach === "function") {
                yearMapForCountry.forEach((entries, partnerCountry) => {
                    connectedSet.add(partnerCountry);
                });
            }
        }
    } catch (e) {
        // fallback to empty connected set
        connectedSet = new Set();
    }

    // Build GDP map but include selectedCountry explicitly so it will appear among candidates
    const gdpMap = new Map();
    dataCtx.gdpDataGrouped.forEach((yearMap, country) => {
        // include country if it's a connected partner OR it's the selectedCountry OR there are no connections (fallback)
        if (!connectedSet.size || connectedSet.has(country) || (selectedCountry && country === selectedCountry)) {
            if (yearMap.has(selectedYear)) {
                const recs = yearMap.get(selectedYear);
                const total = d3.sum(recs, r => r.value || +r.VALUE || 0);
                gdpMap.set(country, total);
            }
        }
    });

    // If we expected connections but found none and selectedCountry has no GDP -> show message
    if (selectedCountry && selectedYear && connectedSet.size && gdpMap.size === 0) {
        container.innerHTML = `<p style="color:#999">No GDP data for connected partners of ${selectedCountry} in ${selectedYear} (and selected country has no GDP for that year).</p>`;
        return;
    }

    // If selectedCountry provided but no connected partners found, show message (unless selectedCountry had GDP and will be shown)
    if (selectedCountry && selectedYear && !connectedSet.size && !gdpMap.has(selectedCountry)) {
        container.innerHTML = `<p style="color:#999">No connected partner data for ${selectedCountry} in ${selectedYear}.</p>`;
        return;
    }

    // Compute top list (sorted descending). Because selectedCountry was included in gdpMap above,
    // it will appear in the ranking even if not a partner.
    const entries = Array.from(gdpMap.entries()).map(([country, value]) => ({ country, value }));
    entries.sort((a, b) => b.value - a.value);

    // If there are more than topN and selectedCountry is not in topN, ensure selectedCountry is included:
    let top = entries.slice(0, topN);
    if (selectedCountry && gdpMap.has(selectedCountry)) {
        const inTop = top.some(d => d.country === selectedCountry);
        if (!inTop) {
            const selVal = gdpMap.get(selectedCountry);
            // Insert selectedCountry into correct position and trim to topN
            top.push({ country: selectedCountry, value: selVal });
            top.sort((a, b) => b.value - a.value);
            top = top.slice(0, topN);
        }
    }

    container.style.position = 'relative';
    container.style.overflow = 'visible';

    if (top.length === 0) {
        container.innerHTML = `<p style="color:#999">No GDP data for year ${selectedYear}.</p>`;
        return;
    }

    // --- Dynamic left margin based on longest country name ---
    const maxLabelChars = d3.max(top, d => d.country.length) || 10;
    const approxCharWidth = 8; // px per char approximation
    const computedLeft = Math.max(60, Math.min(140, maxLabelChars * approxCharWidth + 16));

    const heightCap = (maxHeight != null && isFinite(maxHeight)) ? Math.max(140, Math.floor(maxHeight)) : null;
    const compact = heightCap != null && heightCap < 240;

    const margin = { top: compact ? 44 : 52, right: 12, bottom: compact ? 18 : 28, left: computedLeft };
    const width = Math.max(320, container.clientWidth || 420);
    const rowH = compact ? 22 : 30;
    const desiredHeight = top.length * rowH + margin.top + margin.bottom;
    let height = Math.max(compact ? 160 : 200, desiredHeight);
    if (heightCap != null) height = Math.min(height, heightCap);
    const chartW = width - margin.left - margin.right;
    const chartH = height - margin.top - margin.bottom;

    let svg = d3.select(container).select("svg#gdp-svg");
    if (svg.empty()) {
        container.innerHTML = '';
        svg = d3.select(container).append("svg").attr("id", "gdp-svg")
            .style("font-family", "Inter, Arial, sans-serif")
            .style("font-size", "12px");
    }

    svg.attr("width", width).attr("height", height);

    // clip-path
    let defs = svg.select("defs");
    if (defs.empty()) defs = svg.append("defs");
    let clip = defs.select("clipPath#gdp-clip");
    if (clip.empty()) {
        clip = defs.append("clipPath").attr("id", "gdp-clip")
            .append("rect").attr("id", "gdp-clip-rect");
    }
    svg.select("#gdp-clip-rect").attr("x", 0).attr("y", 0).attr("width", chartW).attr("height", chartH);

    let mainG = svg.select("g#gdpChartG");
    if (mainG.empty()) mainG = svg.append("g").attr("id", "gdpChartG");
    mainG.attr("transform", `translate(${margin.left},${margin.top})`);
    mainG.attr("clip-path", "url(#gdp-clip)");

    let axisContainerG = svg.select("g#gdp-axis-container");
    if (axisContainerG.empty()) axisContainerG = svg.append("g").attr("id", "gdp-axis-container");

    const x = d3.scaleLinear()
        .domain([0, d3.max(top, d => d.value) || 0])
        .nice()
        .range([0, chartW]);

    const y = d3.scaleBand()
        .domain(top.map(d => d.country))
        .range([0, chartH])
        .padding(0.15);

    const t = svg.transition().duration(750).ease(d3.easeSinInOut);

    // X axis (top)
    let xAxisG = axisContainerG.select("g#gdp-x-axis");
    if (xAxisG.empty()) xAxisG = axisContainerG.append("g").attr("id", "gdp-x-axis");
    xAxisG.transition(t)
        .call(d3.axisTop(x).ticks(4).tickSizeOuter(0).tickFormat(d3.format(".2s")));
    xAxisG.attr("transform", `translate(${margin.left}, ${margin.top - 12})`);
    xAxisG.selectAll("text").attr("fill", "#aaa").style("font-size", "11px");

    // Y axis (left labels)
    let yAxisG = axisContainerG.select("g#gdp-y-axis");
    if (yAxisG.empty()) yAxisG = axisContainerG.append("g").attr("id", "gdp-y-axis");
    yAxisG.attr("transform", `translate(${margin.left}, ${margin.top})`);
    yAxisG.transition(t)
        .call(d3.axisLeft(y).tickSizeOuter(0));
    yAxisG.selectAll("text")
        .attr("fill", "#ddd")
        .style("font-size", "11px");

    // Rows
    const rows = mainG.selectAll(".gdp-row").data(top, d => d.country);

    rows.exit().transition(t).style("opacity", 0).remove();

    const rowsEnter = rows.enter()
        .append("g")
        .attr("class", "gdp-row")
        .attr("transform", d => `translate(0, ${y(d.country) || chartH})`)
        .style("opacity", 0);

    rowsEnter.append("rect")
        .attr("class", "gdp-rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("height", y.bandwidth())
        .attr("width", 0)
        .attr("fill", "#7c3aed")
        .attr("opacity", 0.9)
        .attr("rx", 3);

    rowsEnter.append("text")
        .attr("class", "gdp-value")
        .attr("x", 6)
        .attr("y", y.bandwidth() / 2)
        .attr("dy", "0.35em")
        .attr("fill", "#fff")
        .style("font-size", "11px")
        .style("font-weight", "600")
        .style("opacity", 0)
        .text(d => d.value.toLocaleString());

    const rowsUpdate = rowsEnter.merge(rows);
    rowsUpdate.order();

    rowsUpdate.transition(t)
        .attr("transform", d => `translate(0, ${y(d.country)})`)
        .style("opacity", 1);

    rowsUpdate.select(".gdp-rect")
        .transition()
        .delay((d, i) => 120 + i * 40)
        .duration(600)
        .ease(d3.easeCubicOut)
        .attr("width", d => x(d.value))
        .attr("height", y.bandwidth());

    rowsUpdate.select(".gdp-value")
        .transition(t)
        .delay((d, i) => 120 + i * 40 + 420)
        .duration(320)
        .style("opacity", 1)
        .attr("x", function(d) {
            const txt = d.value.toLocaleString();
            const approxTxtWidth = txt.length * 7;
            const barX = x(d.value);
            if (barX + 8 + approxTxtWidth < chartW) {
                d3.select(this).attr("text-anchor", "start");
                return barX + 8;
            } else {
                d3.select(this).attr("text-anchor", "end");
                return Math.max(barX - 6, 6);
            }
        });

    rowsUpdate.on("mouseenter", function() {
        const sel = d3.select(this);
        sel.select(".gdp-rect").transition().duration(120).attr("fill", "#a78bfa").attr("opacity", 1);
    }).on("mouseleave", function() {
        const sel = d3.select(this);
        sel.select(".gdp-rect").transition().duration(120).attr("fill", "#7c3aed").attr("opacity", 0.9);
    });

    // Title
    let title = svg.select("text#gdp-title");
    if (title.empty()) title = svg.append("text").attr("id", "gdp-title");
    const modeLabel = selectedMode ? (selectedMode === "immigration" ? "Immigration partners" : "Emigration partners") : "Partners";
    title.attr("x", width / 2)
        .attr("y", 18)
        .attr("text-anchor", "middle")
        .attr("fill", "#ccc")
        .style("font-size", "13px")
        .style("font-weight", "600")
        .style("opacity", 0)
        .text(`${modeLabel} — Top ${topN} by GDP (Million EUR) — ${selectedYear}`);
    title.transition().delay(100).duration(400).style("opacity", 1);
}

// Highlight helper & simple playback sync for popup timeline
// call highlightPopupYear(yearNumber) to move the emphasis marker + show numeric label
function highlightPopupYear(year) {
    const data = window.popupSeriesData;
    const s = window.popupScales;
    if (!data || !s || year == null) {
        const svg = d3.select("#popup-svg");
        svg.select("g#popup-highlight-group").transition().duration(120).style("opacity", 0);
        return;
    }

    const point = data.find(d => d.year === +year);
    if (!point) {
        d3.select("#popup-svg").select("g#popup-highlight-group").transition().duration(120).style("opacity", 0);
        return;
    }

    const xPos = s.margin.left + s.x(point.year);
    const yPos = s.margin.top + s.y(point.value);

    const svg = d3.select("#popup-svg");
    const hl = svg.select("g#popup-highlight-group");
    if (hl.empty()) return;

    // show only the volume (no year)
    const labelText = `${Math.round(point.value).toLocaleString()}`;
    const txt = hl.select("text#popup-highlight-label").text(labelText);

    // measure text to size bg rect
    txt.attr("x", 0).attr("y", 0);
    const bbox = txt.node().getBBox();
    const pad = 6;

    // Determine placement: for the last year place label to the left,
    // otherwise prefer right placement but ensure it doesn't overflow.
    let placeLeft = false;
    try {
        const years = Array.isArray(window.popupSeriesYears) ? window.popupSeriesYears : data.map(d => d.year);
        if (years.length && years[years.length - 1] === +year) {
            placeLeft = true;
        } else {
            const rightNeeded = xPos + 10 + bbox.width + pad;
            if (rightNeeded > (s.width - 4)) placeLeft = true;
        }
    } catch (e) {
        placeLeft = false;
    }

    if (placeLeft) {
        const bgX = Math.max(s.margin.left + 4, xPos - 10 - bbox.width - pad * 2);
        hl.select("rect#popup-highlight-bg")
            .attr("width", bbox.width + pad * 2)
            .attr("height", bbox.height + pad)
            .attr("x", bgX)
            .attr("y", yPos - bbox.height / 2 - pad / 2);

        txt.attr("x", Math.max(s.margin.left + 6, xPos - 10))
            .attr("y", yPos)
            .attr("text-anchor", "end");
    } else {
        const bgX = Math.min(s.width - 4 - (bbox.width + pad * 2), xPos + 10 - pad);
        hl.select("rect#popup-highlight-bg")
            .attr("width", bbox.width + pad * 2)
            .attr("height", bbox.height + pad)
            .attr("x", bgX)
            .attr("y", yPos - bbox.height / 2 - pad / 2);

        txt.attr("x", Math.min(s.width - 6, xPos + 10))
            .attr("y", yPos)
            .attr("text-anchor", "start");
    }

    hl.select("circle#popup-highlight-circle")
        .attr("cx", xPos)
        .attr("cy", yPos);

    hl.transition().duration(120).style("opacity", 1);
    const circ = hl.select("circle#popup-highlight-circle");
    circ.transition().duration(220).attr("r", 10).transition().duration(220).attr("r", 6);

    // --- SILENTLY update slider value to avoid re-triggering handlers and loops ---
    try {
        const slider = document.getElementById("year-slider");
        if (slider && Array.isArray(window.popupSeriesYears)) {
            const idx = window.popupSeriesYears.indexOf(+year);
            if (idx >= 0 && slider.value != idx) {
                // set value silently (do NOT dispatch input/change events)
                slider.value = idx;
            }
        }
    } catch (e) {
        // ignore
    }
}
// expose globally so other modules can call it
window.highlightPopupYear = highlightPopupYear;

// Simple playback for popup timeline (keeps slider and highlight in sync).
// This will toggle an internal interval and manipulate the #year-slider value so the rest of the app reacts.
(function setupPopupPlayback() {
    const playBtn = document.getElementById("play-pause-button");
    if (!playBtn) return;

    let intervalId = null;
    playBtn.addEventListener("click", () => {
        const slider = document.getElementById("year-slider");
        if (!slider) return;

        // toggle: if we control playback start, otherwise try to detect existing play state
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
            playBtn.classList.remove("playing");
            // optionally revert icon handled elsewhere
            return;
        }

        // start playback: advance index each step
        playBtn.classList.add("playing");
        intervalId = setInterval(() => {
            const years = window.popupSeriesYears || [];
            if (!years.length) return;

            // slider likely uses index; ensure we have integer index
            let idx = parseInt(slider.value, 10) || 0;
            idx = Math.min(Number(slider.max || years.length - 1), idx + 1);
            if (idx > (slider.max || years.length - 1)) idx = 0;

            slider.value = idx;
            slider.dispatchEvent(new Event("input", { bubbles: true }));
            slider.dispatchEvent(new Event("change", { bubbles: true }));

            // highlightPopupYear will be invoked from updatePopupContent (we also call it directly to be safe)
            const year = years[idx];
            if (typeof window.highlightPopupYear === "function") window.highlightPopupYear(year);

        }, 900); // playback speed (ms) — adjust as needed
    });
})();
