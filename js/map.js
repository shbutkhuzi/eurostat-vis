const mapCtx = {
    MAP_WIDTH: 0,
    MAP_HEIGHT: 0,
    EUROPE_CENTER: [20, 52],
    NON_SELECTABLE_COUNTRY_COLOR: "#3e3e3e78",
    SELECTABLE_COUNTRY_COLOR: "#575757ff",
    SELECTED_COUNTRY_COLOR: "#6f6076ff",
    BORDER_COLOR: "#DDD",
    BORDER_COLOR_HIGHLIGHTED: "#ffffffff",
    SELECTED_CENTROID_COLOR: "#9d28d3ff",
    NON_SELECTED_CENTROID_COLOR: "#413cd6ff",
    CENTROID_GLYPH_SIZE: 1,
    TRANSITION_DEFAULT_DURATION: 750,
    TRANSITION_SHORT_DURATION: 250,
    HIGHLIGHT_OPACITY: 0.25
};

let currentZoomK = 1;
let currSelectedCountry = null;
let currSelectedYear = null;


function drawFlowPath(element, partnerCountry, partnerCountryData, selectedCountryCoords, pathId, defs, bezierInvert = false){

    const dashLength = 1;
    const gapLength = 1.5;
    mapCtx.dashArray = dashLength + gapLength;

    const partnerCountryCoords = dataCtx.countryInfo.get(partnerCountry);
    const gradientId = `gradient-${pathId}`;

    const gradient = defs.append("linearGradient")
        .attr("id", gradientId)
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", partnerCountryCoords.px)
        .attr("y1", partnerCountryCoords.py)
        .attr("x2", selectedCountryCoords.px)
        .attr("y2", selectedCountryCoords.py);

    const gradientMargin = 10;

    if (partnerCountryData.length === 3) {
        maleVal = partnerCountryData.find(item => item.sex === "M").value;
        totalVal = partnerCountryData.find(item => item.sex === "T").value;
        maleRatio = (maleVal/totalVal) * 100;

        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#2196F3");
        gradient.append("stop")
            .attr("offset", `${maleRatio-gradientMargin}%`)
            .attr("stop-color", "#2196F3");
        gradient.append("stop")
            .attr("offset", `${maleRatio+gradientMargin}%`)
            .attr("stop-color", "#F44336");
        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#F44336");

    } else if (partnerCountryData.length === 2) {
        maleVal = partnerCountryData.find(item => item.sex === "M")?.value || 0;
        femaleVal = partnerCountryData.find(item => item.sex === "F")?.value || 0;
        totalVal = partnerCountryData.find(item => item.sex === "T").value;

        if (femaleVal) {
            gradient.append("stop")
                .attr("offset", "0%")
                .attr("stop-color", "#F44336");
            gradient.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", "#F44336");
        }else if (maleVal) {
            gradient.append("stop")
                .attr("offset", "0%")
                .attr("stop-color", "#2196F3");
            gradient.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", "#2196F3");
        }
    } else if (partnerCountryData.length === 1) {
        totalVal = partnerCountryData.find(item => item.sex === "T").value;
        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#9e6aaaff");
        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#9e6aaaff");
    }

    d3.select(element)
        .attr("id", pathId)
        .attr("class", "flowPathGroup")
        .attr("opacity", 0)
        .append("path")
        .attr("id", pathId)
        .attr("d", () => {

            const x1 = partnerCountryCoords.px;
            const y1 = partnerCountryCoords.py;
            const x2 = selectedCountryCoords.px;
            const y2 = selectedCountryCoords.py;
            
            if (bezierInvert) {
                return quadraticBezierPath(x2, y2, x1, y1);
            } else {
                return quadraticBezierPath(x1, y1, x2, y2);
            }
            
        })
        .style("pointer-events", "none")
        .attr("fill", "none")
        .attr("stroke", `url(#${gradientId})`)
        .attr("stroke-width", 0.5)
        .attr("stroke-linecap", "round")
        .attr("stroke-dasharray", `${dashLength},${gapLength}`)
        .attr("migr-val", totalVal);
};

function animatePath(pathId) {
    const pathElement = d3.select(`path#${pathId}`);
    const totalVal = pathElement.attr("migr-val");
    
    pathElement
        .attr("stroke-dashoffset", mapCtx.dashArray)
        .transition()
        .duration(mapCtx.particleSpeedScale(totalVal))
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0)
        .end().then(() => {
            countryGroup = d3.select(
                                d3.select(
                                    d3.select(
                                        d3.select(pathElement.node().parentNode)
                                            .node().parentNode
                                    ).node().parentNode
                                ).node().parentNode
                            );

            const allPathsHidden = countryGroup.selectAll("g.flowPathGroup")
                .nodes()
                .every(node => d3.select(node).attr("opacity") == 0);
            
            if (allPathsHidden) {
                countryGroup.remove();
                return;
            }
            
            animatePath(pathId);
        })
        .catch(error => {
            // Ignore
        });
};


function highlightFlow(country){

    if (!currSelectedCountry || currSelectedCountry === country) {
        return;
    }

    const immData = dataCtx.immDataGrouped.get(currSelectedCountry);
    const emiData = dataCtx.emiDataGrouped.get(currSelectedCountry);
    
    const hasImmConnection = immData && immData.get(currSelectedYear) && immData.get(currSelectedYear).has(country);
    const hasEmiConnection = emiData && emiData.get(currSelectedYear) && emiData.get(currSelectedYear).has(country);
    
    if (!hasImmConnection || !hasEmiConnection) {
        return;
    }

    if (getCurrentMode() === "immigration") {

        const immGroup = d3.select("g#migrFlowG")
            .select(`g#${getCountryGroupId(currSelectedCountry)}`)
            .select("g#immigration")
            .select(getImmFlowYearGroupId(currSelectedYear));
        
        immGroup.selectAll("g.flowPathGroup")
            .attr("opacity", mapCtx.HIGHLIGHT_OPACITY);
        
        const immPath = immGroup.select(`g#${getFlowPathId('immigration', country, currSelectedCountry, currSelectedYear)}`);
        immPath.attr("opacity", 1);
        immPath.raise();

        const emiGroup = d3.select("g#migrFlowG")
            .select(`g#${getCountryGroupId(currSelectedCountry)}`)
            .select("g#emigration")
            .select(getImmFlowYearGroupId(currSelectedYear));

        emiGroup.selectAll("g.flowPathGroup")
            .attr("opacity", 0);

        const emiPathId = getFlowPathId('emigration', currSelectedCountry, country, currSelectedYear);

        const emiPath = emiGroup.select(`g#${emiPathId}`);
        emiPath.attr("opacity", 1);
        emiPath.raise();

        animatePath(emiPathId);

    } else if (getCurrentMode() === "emigration") {

        const emiGroup = d3.select("g#migrFlowG")
            .select(`g#${getCountryGroupId(currSelectedCountry)}`)
            .select("g#emigration")
            .select(getImmFlowYearGroupId(currSelectedYear));
        
        emiGroup.selectAll("g.flowPathGroup")
            .attr("opacity", mapCtx.HIGHLIGHT_OPACITY);
        
        emiGroup.select(`g#${getFlowPathId('emigration', currSelectedCountry, country, currSelectedYear)}`)
            .attr("opacity", 1);


        const immGroup = d3.select("g#migrFlowG")
            .select(`g#${getCountryGroupId(currSelectedCountry)}`)
            .select("g#immigration")
            .select(getImmFlowYearGroupId(currSelectedYear));

        immGroup.selectAll("g.flowPathGroup")
            .attr("opacity", 0);

        const immPathId = getFlowPathId('immigration', country, currSelectedCountry, currSelectedYear);

        immGroup.select(`g#${immPathId}`)
            .attr("opacity", 1);

        animatePath(immPathId);

    }

};


function unHighlightFlow(country){

    if (!currSelectedCountry || currSelectedCountry === country) {
        return;
    }

    const immData = dataCtx.immDataGrouped.get(currSelectedCountry);
    const emiData = dataCtx.emiDataGrouped.get(currSelectedCountry);
    
    const hasImmConnection = immData && immData.get(currSelectedYear) && immData.get(currSelectedYear).has(country);
    const hasEmiConnection = emiData && emiData.get(currSelectedYear) && emiData.get(currSelectedYear).has(country);
    
    if (!hasImmConnection || !hasEmiConnection) {
        return;
    }

    if (getCurrentMode() === "immigration") {

        d3.select("g#migrFlowG")
            .select(`g#${getCountryGroupId(currSelectedCountry)}`)
            .select("g#immigration")
            .select(getImmFlowYearGroupId(currSelectedYear))
            .selectAll("g.flowPathGroup")
            .attr("opacity", 1);

        d3.select("g#migrFlowG")
            .select(`g#${getCountryGroupId(currSelectedCountry)}`)
            .select("g#emigration")
            .selectAll("g.flowPathGroup")
            .attr("opacity", 0);

    } else if (getCurrentMode() === "emigration") {

        d3.select("g#migrFlowG")
            .select(`g#${getCountryGroupId(currSelectedCountry)}`)
            .select("g#emigration")
            .select(getImmFlowYearGroupId(currSelectedYear))
            .selectAll("g.flowPathGroup")
            .attr("opacity", 1);

        d3.select("g#migrFlowG")
            .select(`g#${getCountryGroupId(currSelectedCountry)}`)
            .select("g#immigration")
            .selectAll("g.flowPathGroup")
            .attr("opacity", 0);

    }
    
};


function drawFlowNetwork(selectedCountry){

    const selectedImmCountryData = dataCtx.immDataGrouped.get(selectedCountry);
    const selectedEmiCountryData = dataCtx.emiDataGrouped.get(selectedCountry);

    const flowG = d3.select("g#migrFlowG").empty()
                        ? d3.select("#mapG").append("g").attr("id", "migrFlowG")
                        : d3.select("g#migrFlowG");

    let countryFlowG = flowG.select(`g#${getCountryGroupId(selectedCountry)}`);
    if (countryFlowG.empty()) {
        countryFlowG = flowG.append("g")
                            .attr("id", getCountryGroupId(selectedCountry));
        
        countryFlowG.append("g").attr("id", "immigration");
        countryFlowG.append("g").attr("id", "emigration");
    }
    
    const selectedCountryCoords = dataCtx.countryInfo.get(selectedCountry);

    mapCtx.particleSpeedScale = d3.scaleLog().domain(dataCtx.migrValueExt).range([1000, 100]);

    if (selectedImmCountryData) {
        countryFlowG.select("g#immigration").selectAll("g")
            .data(selectedImmCountryData)
            .enter()
            .append("g")
            .attr("id", (d) => `year-${d[0]}`)
            .each(function(d) {

                const defs = d3.select(this).append("defs");

                d3.select(this).selectAll("g")
                    .data(d[1])
                    .enter()
                    .append("g")
                    .each(function(p) {
                        const pathId = getFlowPathId("immigration", p[0], selectedCountry, d[0]);
                        drawFlowPath(this, p[0], p[1], selectedCountryCoords, pathId, defs, false);
                    });
            });
    }

    if (selectedEmiCountryData) {
        countryFlowG.select("g#emigration").selectAll("g")
            .data(selectedEmiCountryData)
            .enter()
            .append("g")
            .attr("id", (d) => `year-${d[0]}`)
            .each(function(d) {

                const defs = d3.select(this).append("defs");

                d3.select(this).selectAll("g")
                    .data(d[1])
                    .enter()
                    .append("g")
                    .each(function(p) {
                        const pathId = getFlowPathId("emigration", selectedCountry, p[0], d[0]);
                        drawFlowPath(this, p[0], p[1], selectedCountryCoords, pathId, defs, true);
                    });
            });
    }
};


function quadraticBezierPath(x1, y1, x2, y2){

    const ro = Math.sqrt(Math.pow(x2-x1, 2) + Math.pow(y2-y1, 2)) / (2*Math.cos(Math.PI/6));
    const alpha = Math.atan2((y2-y1), (x2-x1));
    const xcp = x1 + ro*Math.cos(alpha+Math.PI/6);
    const ycp = y1 + ro*Math.sin(alpha+Math.PI/6);
    
    return `M ${x1},${y1} Q ${xcp},${ycp} ${x2},${y2}`;
};


function focusViewOnFlow(selectedCountry, selectedYear){

    const flowG = d3.select("g#migrFlowG")
                    .select(`g#${getCountryGroupId(selectedCountry)}`)
                    .select(`g#${getCurrentMode()}`)
                    .select(getImmFlowYearGroupId(selectedYear));
    
    if (flowG.empty()) {
        return;
    }

    const bbox = flowG.node().getBBox();
    
    if (bbox.width === 0 || bbox.height === 0) {
        return;
    }

    const sliderContainer = document.getElementById('slider-container');
    const sliderHeight = sliderContainer ? sliderContainer.offsetHeight : 0;
    const sliderStyles = sliderContainer ? window.getComputedStyle(sliderContainer) : null;
    const sliderPaddingBottom = sliderStyles ? parseFloat(sliderStyles.bottom) : 0;

    const availableHeight = mapCtx.MAP_HEIGHT - sliderHeight - sliderPaddingBottom;
    
    let padding = Math.max(10, Math.min(mapCtx.MAP_WIDTH, availableHeight) * 0.01);

    let scale = Math.min(
        mapCtx.MAP_WIDTH / (bbox.width + padding),
        availableHeight / (bbox.height + padding)
    );

    let centerX = bbox.x + bbox.width / 2;
    let centerY = bbox.y + bbox.height / 2;

    let focusTransform = d3.zoomIdentity
        .translate(mapCtx.MAP_WIDTH / 2, availableHeight / 2)
        .scale(scale)
        .translate(-centerX, -centerY);

    d3.select("svg")
        .transition()
        .duration(mapCtx.TRANSITION_DEFAULT_DURATION)
        .call(mapCtx.zoom.transform, focusTransform);
};


function updateFlow(selectedCountry, selectedYear){

    let migrCountries, migrDataGrouped;
    if (getCurrentMode() === "immigration") {
        migrCountries = dataCtx.immDstCountries;
        migrDataGrouped = dataCtx.immDataGrouped;
    }else if (getCurrentMode() === "emigration") {
        migrCountries = dataCtx.emiSrcCountries;
        migrDataGrouped = dataCtx.emiDataGrouped;
    }

    d3.select("#mapG")
        .selectAll("path.countryPath")
        .filter(d => migrCountries.includes(d.properties.GEOUNIT))
        .transition()
        .duration(mapCtx.TRANSITION_SHORT_DURATION)
        .attr("fill", mapCtx.SELECTABLE_COUNTRY_COLOR);

    d3.select("#mapG")
        .selectAll("path.countryPath")
        .filter(d => d.properties.GEOUNIT ===selectedCountry)
        .transition()
        .duration(mapCtx.TRANSITION_SHORT_DURATION)
        .attr("fill", mapCtx.SELECTED_COUNTRY_COLOR);

    d3.select("#mapG")
        .selectAll("path.centroidPath")
        .transition()
        .duration(mapCtx.TRANSITION_SHORT_DURATION)
        .attr("opacity", 0);

    const yearMap = migrDataGrouped.get(selectedCountry);
    currSelectedYear = selectedYear;
    let selectedYearData = yearMap.get(currSelectedYear);

    d3.select("#mapG")
        .selectAll("path.centroidPath")
        .filter(d => d.properties.GEOUNIT !== selectedCountry && 
                    selectedYearData.has(d.properties.GEOUNIT))
        .transition()
        .duration(mapCtx.TRANSITION_SHORT_DURATION)
        .attr("fill", mapCtx.NON_SELECTED_CENTROID_COLOR)
        .attr("opacity", 1);

    d3.select("#mapG")
        .selectAll("path.centroidPath")
        .filter(d => d.properties.GEOUNIT === selectedCountry)
        .transition()
        .duration(mapCtx.TRANSITION_SHORT_DURATION)
        .attr("fill", mapCtx.SELECTED_CENTROID_COLOR)
        .attr("opacity", 1);

    d3.select("g#migrFlowG")
        .select(`g#${getCountryGroupId(selectedCountry)}`)
        .selectAll("g.flowPathGroup")
        .transition()
        .ease(d3.easeSinInOut)
        .duration(mapCtx.TRANSITION_DEFAULT_DURATION)
        .attr("opacity", 0);

    d3.select("g#migrFlowG")
        .select(`g#${getCountryGroupId(selectedCountry)}`)
        .select(`g#${getCurrentMode()}`)
        .select(getImmFlowYearGroupId(currSelectedYear))
        .selectAll("g.flowPathGroup")
        .transition()
        .ease(d3.easeSinInOut)
        .duration(mapCtx.TRANSITION_DEFAULT_DURATION)
        .attr("opacity", 1)
        .selectAll("path")
        .on("start", function(d,i){
            const pathId = d3.select(this).attr("id");
            animatePath(pathId);
        });
    
    focusViewOnFlow(selectedCountry, currSelectedYear);
};

function getCountryGroupId(country){
    return `${country}`.replace(/\s+/g, '-');
};

function getImmFlowYearGroupId(year){
    return `g#year-${year}`;
};

function getFlowPathId(type, src, dst, year){
    return `${type}-${src}-${dst}-${year}`.replace(/\s+/g, '-');
};


function switchFlow() {

    if (!currSelectedCountry ||
        (getCurrentMode() === "immigration" && !dataCtx.immDstCountries.includes(currSelectedCountry)) ||
        (getCurrentMode() === "emigration" && !dataCtx.emiSrcCountries.includes(currSelectedCountry))) {
        
        diselectFlow();
        return;
    }

    let migrCountries, migrDataGrouped;
    if (getCurrentMode() === "immigration") {
        migrCountries = dataCtx.immDstCountries;
        migrDataGrouped = dataCtx.immDataGrouped;
    }else if (getCurrentMode() === "emigration") {
        migrCountries = dataCtx.emiSrcCountries;
        migrDataGrouped = dataCtx.emiDataGrouped;
    }

    d3.select("#mapG")
        .selectAll("path.countryPath")
        .transition()
        .duration(mapCtx.TRANSITION_DEFAULT_DURATION)
        .attr("fill", mapCtx.NON_SELECTABLE_COUNTRY_COLOR);

    d3.select("#mapG")
        .selectAll("path.centroidPath")
        .transition()
        .duration(mapCtx.TRANSITION_DEFAULT_DURATION)
        .attr("opacity", 0);

    d3.select("#mapG")
        .selectAll("path.countryPath")
        .filter(d => migrCountries.includes(d.properties.GEOUNIT))
        .transition()
        .duration(mapCtx.TRANSITION_DEFAULT_DURATION)
        .attr("fill", mapCtx.SELECTABLE_COUNTRY_COLOR);

    updatePopupContent(currSelectedCountry);

    d3.select("#mapG")
        .selectAll("path.countryPath")
        .filter(d => d.properties.GEOUNIT === currSelectedCountry)
        .transition()
        .duration(mapCtx.TRANSITION_DEFAULT_DURATION)
        .attr("fill", mapCtx.SELECTED_COUNTRY_COLOR);

    const avalYears = Array.from(migrDataGrouped.get(currSelectedCountry).keys());
    if (!avalYears.includes(currSelectedYear)) {
        currSelectedYear = d3.min(avalYears);
    }
    let selectedYearData = migrDataGrouped.get(currSelectedCountry).get(currSelectedYear);

    d3.select("#mapG")
        .selectAll("path.centroidPath")
        .filter(d => d.properties.GEOUNIT !== currSelectedCountry && 
                    selectedYearData.has(d.properties.GEOUNIT))
        .transition()
        .duration(mapCtx.TRANSITION_DEFAULT_DURATION)
        .attr("fill", mapCtx.NON_SELECTED_CENTROID_COLOR)
        .attr("opacity", 1);

    d3.select("#mapG")
        .selectAll("path.centroidPath")
        .filter(d => d.properties.GEOUNIT === currSelectedCountry)
        .transition()
        .duration(mapCtx.TRANSITION_DEFAULT_DURATION)
        .attr("fill", mapCtx.SELECTED_CENTROID_COLOR)
        .attr("opacity", 1);

    d3.select("g#migrFlowG").selectAll("g.flowPathGroup")
        .transition()
        .duration(mapCtx.TRANSITION_SHORT_DURATION)
        .attr("opacity", 0)
        .end()
        .then(() => {
            drawFlowNetwork(currSelectedCountry);

            migrCountries.forEach(country => {
                const countryGroup = d3.select("g#migrFlowG")
                                        .select(`g#${getCountryGroupId(country)}`);
                
                if (!countryGroup.empty() && country != currSelectedCountry) {

                    countryGroup.select(`g#${getCurrentMode()}`).selectAll("g.flowPathGroup")
                        .transition()
                        .duration(mapCtx.TRANSITION_DEFAULT_DURATION)
                        .attr("opacity", 0);
                }
            });

            d3.select("g#migrFlowG")
                .select(`g#${getCountryGroupId(currSelectedCountry)}`)
                .select(`g#${getCurrentMode()}`)
                .select(getImmFlowYearGroupId(currSelectedYear))
                .selectAll("g.flowPathGroup")
                .transition()
                .duration(mapCtx.TRANSITION_DEFAULT_DURATION)
                .attr("opacity", 1)
                .selectAll("path")
                .on("start", function(d,i){
                    const pathId = d3.select(this).attr("id");
                    animatePath(pathId);
                });
            
            focusViewOnFlow(currSelectedCountry, currSelectedYear);
        });

    updateVisibilities();
};


function diselectFlow(){

    let migrCountries;
    if (getCurrentMode() === "immigration") {
        migrCountries = dataCtx.immDstCountries;
    }else if (getCurrentMode() === "emigration") {
        migrCountries = dataCtx.emiSrcCountries;
    }

    d3.select("#mapG")
        .selectAll("path.countryPath")
        .transition()
        .duration(mapCtx.TRANSITION_DEFAULT_DURATION)
        .attr("fill", mapCtx.NON_SELECTABLE_COUNTRY_COLOR);

    d3.select("g#migrFlowG").selectAll("g.flowPathGroup")
        .transition()
        .duration(mapCtx.TRANSITION_DEFAULT_DURATION)
        .attr("opacity", 0);

    d3.select("#mapG")
        .selectAll("path.countryPath")
        .filter(d => migrCountries.includes(d.properties.GEOUNIT))
        .transition()
        .duration(mapCtx.TRANSITION_DEFAULT_DURATION)
        .attr("fill", mapCtx.SELECTABLE_COUNTRY_COLOR);

    d3.select("#mapG")
        .selectAll("path.centroidPath")
        .transition()
        .duration(mapCtx.TRANSITION_DEFAULT_DURATION)
        .attr("opacity", 0);

    d3.select("svg")
        .transition()
        .duration(mapCtx.TRANSITION_DEFAULT_DURATION)
        .call(mapCtx.zoom.transform, mapCtx.initialTransform);

    currSelectedCountry = null;
    updateVisibilities();
};


function drawFlow(selectedCountry){

    if ((getCurrentMode() === "immigration" && !dataCtx.immDstCountries.includes(selectedCountry)) ||
        (getCurrentMode() === "emigration" && !dataCtx.emiSrcCountries.includes(selectedCountry))) {
        return;
    }
    
    // country is diselected
    if (selectedCountry === currSelectedCountry) {
        diselectFlow();
    } else {
        currSelectedCountry = selectedCountry;
        switchFlow();
    }
};


function updateVisibilities(){
    updateOverlayVisibility(currSelectedCountry !== null);
    updateSliderVisibility(currSelectedCountry !== null, currSelectedCountry, currSelectedYear);
    updateRadioVisibility(currSelectedCountry);
};


function drawMap(){

    mapCtx.geoPathGen = d3.geoPath().projection(mapCtx.projection);
    
    let featureG = d3.select("#mapG")
                        .selectAll("g.feature")
                        .data(dataCtx.geoJson.features)
                        .enter()
                        .append("g")
                        .attr("class", "feature")
                        .attr("id", (d) => d.properties.GEOUNIT);

    featureG.append("path")
                .attr("class", "countryPath")
                .attr("d", mapCtx.geoPathGen)
                .attr("fill", (d) => dataCtx.immDstCountries.includes(d.properties.GEOUNIT)
                            ? mapCtx.SELECTABLE_COUNTRY_COLOR
                            : mapCtx.NON_SELECTABLE_COUNTRY_COLOR);

    featureG.append("path")
                .attr("class", "centroidPath")
                .attr("d", d3.symbol().type(d3.symbolCircle).size(mapCtx.CENTROID_GLYPH_SIZE))
                .attr("transform", function(d){
                    let [x,y] = mapCtx.projection([d.properties.LABEL_X, d.properties.LABEL_Y])
                    return `translate(${x},${y})`;
                })
                .attr("opacity", 0)
                .style("pointer-events", "none");

    let bordersG = d3.select("#mapG").append("g").attr("id", "bordersG")
                        .selectAll("g.borders")
                        .data(dataCtx.bordersJson.features)
                        .enter()
                        .append("g")
                        .attr("class", "borders")
                        .attr("id", (d) => d.properties.GEOUNIT)
                        .append("path")
                        .attr("class", "borderPath")
                        .attr("d", mapCtx.geoPathGen)
                        .attr("stroke", mapCtx.BORDER_COLOR)
                        .attr("stroke-width", 0.5)
                        .attr("fill", "transparent");

    bordersG.append("title").text((d) => d.properties.GEOUNIT);

    bordersG.on("mouseenter", function (event, d) {
                d3.select(this)
                    .attr("stroke", mapCtx.BORDER_COLOR_HIGHLIGHTED)
                    .attr("stroke-width", 1.5 / currentZoomK);

                highlightFlow(d.properties.GEOUNIT);
            })
            .on("mouseleave", function (event, d) {
                d3.select(this)
                    .attr("stroke", mapCtx.BORDER_COLOR)
                    .attr("stroke-width", 0.5 / currentZoomK);

                unHighlightFlow(d.properties.GEOUNIT);
            })
            .on("click", function (event, d) {
                drawFlow(d.properties.GEOUNIT);
            });

    const b = d3.select("#mapG").node().getBBox();
    const kMin = Math.max(mapCtx.MAP_HEIGHT / b.height, mapCtx.MAP_WIDTH / b.width);
    const worldExtent = [[b.x, b.y], [b.x + b.width, b.y + b.height]];

    mapCtx.zoom = d3.zoom()
        .scaleExtent([kMin, 16])
        .translateExtent(worldExtent)
        .on("zoom", function(event) {
            currentZoomK = event.transform.k;
            d3.select("#mapG").attr("transform", event.transform);
            bordersG.attr("stroke-width", 0.5 / currentZoomK);

            if (event.sourceEvent && event.sourceEvent.type === "mousemove") {
                d3.select("svg").style("cursor", "grabbing");
                d3.select("g#mapG").selectAll("path").style("cursor", "grabbing");
            }
        })
        .on("end", function() {
            d3.select("svg").style("cursor", "default");
            d3.select("g#mapG").selectAll("path").style("cursor", "pointer");
        });

    mapCtx.initialTransform = d3.zoomIdentity
        .translate(mapCtx.MAP_WIDTH / 2, mapCtx.MAP_HEIGHT / 2)
        .scale(5)
        .translate(-mapCtx.projection(mapCtx.EUROPE_CENTER)[0], -mapCtx.projection(mapCtx.EUROPE_CENTER)[1]);

    d3.select("svg")
        .call(mapCtx.zoom)
        .call(mapCtx.zoom.transform, mapCtx.initialTransform);

    d3.select("svg").on("dblclick.zoom", function() {
        d3.select("svg")
            .transition()
            .duration(mapCtx.TRANSITION_DEFAULT_DURATION)
            .call(mapCtx.zoom.transform, mapCtx.initialTransform);
    });

};

function createMap(){

    // console.log("Using D3 v"+d3.version);
    
    let mainElement = document.getElementById("main");

    mapCtx.MAP_WIDTH = mainElement.clientWidth;
    mapCtx.MAP_HEIGHT = mainElement.clientHeight;
    
    var svgEl = d3.select("#main").append("svg");
    svgEl.attr("width", mapCtx.MAP_WIDTH);
    svgEl.attr("height", mapCtx.MAP_HEIGHT);
    svgEl.append("g").attr("id", "mapG");

    loadData().then(() => {
        drawMap();
    });

};

