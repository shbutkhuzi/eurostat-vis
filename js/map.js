const mapCtx = {
    MAP_WIDTH: 0,
    MAP_HEIGHT: 0,
    GeoUrl: "data/ne_50m_admin_0_countries.geojson",
    immDataUrl: "data/raw/estat_migr_imm5prv.csv",
    europeCenter: [20, 52],
    NON_SELECTABLE_IMM_COUNTRY_COLOR: "#3e3e3e78",
    SELECTABLE_IMM_COUNTRY_COLOR: "#575757ff",
    SELECTED_IMM_COUNTRY_COLOR: "#6f6076ff",
    BORDER_COLOR: "#DDD",
    BORDER_COLOR_HIGHLIGHTED: "#ffffffff",
    SELECTED_CENTROID_COLOR: "#9d28d3ff",
    NON_SELECTED_CENTROID_COLOR: "#413cd6ff",
    CENTROID_GLYPH_SIZE: 1,
    TRANSITION_DEFAULT_DURATION: 750,
    TRANSITION_SHORT_DURATION: 250
};

let currentZoomK = 1;
let prevCountry = null;


function drawFlowNetwork(selectedCountry){

    const selectedCountryData = mapCtx.immDataGrouped.get(selectedCountry);

    const flowG = d3.select("g#immFlowG").empty()
                        ? d3.select("#mapG").append("g").attr("id", "immFlowG")
                        : d3.select("g#immFlowG");

    flowG.selectAll("*").remove();
    
    const dstCountryCoords = mapCtx.countryInfo.get(selectedCountry);

    let particleSpeedScale = d3.scaleLog().domain(mapCtx.immValueExt).range([1000, 100]);

    flowG.selectAll("g")
        .data(selectedCountryData)
        .enter()
        .append("g")
        .attr("id", (d) => `year-${d[0]}`)
        .each(function(d) {

            const defs = d3.select(this)
                            .attr("opacity", 0)
                            .append("defs");

            d3.select(this).selectAll("path")
                .data(d[1])
                .enter()
                .append("path")
                .each(function(p) {

                    srcCountry = p[0];
                    srcCountryData = p[1];

                    const dashLength = 1;
                    const gapLength = 1;
                    const dashArray = dashLength + gapLength;

                    const srcCountryCoords = mapCtx.countryInfo.get(srcCountry);
                    const gradientId = `gradient-${srcCountry}-${selectedCountry}-${d[0]}`.replace(/\s+/g, '-');

                    const gradient = defs.append("linearGradient")
                        .attr("id", gradientId)
                        .attr("gradientUnits", "userSpaceOnUse")
                        .attr("x1", srcCountryCoords.px)
                        .attr("y1", srcCountryCoords.py)
                        .attr("x2", dstCountryCoords.px)
                        .attr("y2", dstCountryCoords.py);

                    const gradientMargin = 10;

                    if (srcCountryData.length === 3) {
                        maleVal = srcCountryData.find(item => item.sex === "M").value;
                        totalVal = srcCountryData.find(item => item.sex === "T").value;
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

                    } else if (srcCountryData.length === 2) {
                        maleVal = srcCountryData.find(item => item.sex === "M")?.value || 0;
                        femaleVal = srcCountryData.find(item => item.sex === "F")?.value || 0;
                        totalVal = srcCountryData.find(item => item.sex === "T").value;

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
                    } else if (srcCountryData.length === 1) {
                        totalVal = srcCountryData.find(item => item.sex === "T").value;
                        gradient.append("stop")
                            .attr("offset", "0%")
                            .attr("stop-color", "#9e6aaaff");
                        gradient.append("stop")
                            .attr("offset", "100%")
                            .attr("stop-color", "#9e6aaaff");
                    }

                    let path = d3.select(this)
                        .attr("d", () => {
                            
                            const x1 = srcCountryCoords.px;
                            const y1 = srcCountryCoords.py;
                            const x2 = dstCountryCoords.px;
                            const y2 = dstCountryCoords.py;

                            return quadraticBezierPath(x1, y1, x2, y2);
                        })
                        .style("pointer-events", "none")
                        .attr("fill", "none")
                        .attr("stroke", `url(#${gradientId})`)
                        .attr("stroke-width", 0.6)
                        .attr("stroke-dasharray", `${dashLength},${gapLength}`);

                    function animatePath() {
                        path.attr("stroke-dashoffset", dashArray)
                            .transition()
                            .duration(particleSpeedScale(totalVal))
                            .ease(d3.easeLinear)
                            .attr("stroke-dashoffset", 0)
                            .on("end", animatePath);
                    }

                    animatePath();

                });
        });
    
    firstYear = selectedCountryData ? d3.min(Array.from(selectedCountryData.keys())) : undefined;

    flowG.select(getImmFlowYearGroupId(selectedYear))
        .transition()
        .duration(mapCtx.TRANSITION_DEFAULT_DURATION)
        .attr("opacity", 1);
};


function quadraticBezierPath(x1, y1, x2, y2){

    const ro = Math.sqrt(Math.pow(x2-x1, 2) + Math.pow(y2-y1, 2)) / (2*Math.cos(Math.PI/6));
    const alpha = Math.atan2((y2-y1), (x2-x1));
    const xcp = x1 + ro*Math.cos(alpha+Math.PI/6);
    const ycp = y1 + ro*Math.sin(alpha+Math.PI/6);
    
    return `M ${x1},${y1} Q ${xcp},${ycp} ${x2},${y2}`;
};


function focusViewOnImmFlow(selectedYear){

    const flowG = d3.select("g#immFlowG")
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
}


function drawImmFlow(selectedCountry) {

    if (!mapCtx.immDstCountries.includes(selectedCountry)) {
        return;
    }

    d3.select("#mapG")
        .selectAll("path.countryPath")
        .filter(d => mapCtx.immDstCountries.includes(d.properties.GEOUNIT))
        .transition()
        .duration(mapCtx.TRANSITION_DEFAULT_DURATION)
        .attr("fill", mapCtx.SELECTABLE_IMM_COUNTRY_COLOR);

    d3.select("#mapG")
        .selectAll("path.centroidPath")
        .transition()
        .duration(mapCtx.TRANSITION_DEFAULT_DURATION)
        .attr("opacity", 0);

    d3.select("g#immFlowG").selectAll("g")
        .transition()
        .ease(d3.easeSinInOut)
        .duration(mapCtx.TRANSITION_DEFAULT_DURATION)
        .attr("opacity", 0);
    
    if (selectedCountry != prevCountry) {

        d3.select("#mapG")
            .selectAll("path.countryPath")
            .filter(d => d.properties.GEOUNIT ===selectedCountry)
            .transition()
            .duration(mapCtx.TRANSITION_DEFAULT_DURATION)
            .attr("fill", mapCtx.SELECTED_IMM_COUNTRY_COLOR);

        const yearMap = mapCtx.immDataGrouped.get(selectedCountry);
        selectedYear = yearMap ? d3.min(Array.from(yearMap.keys())) : undefined
        let selectedYearData = yearMap.get(selectedYear);

        d3.select("#mapG")
            .selectAll("path.centroidPath")
            .filter(d => d.properties.GEOUNIT !== selectedCountry && 
                        selectedYearData.has(d.properties.GEOUNIT))
            .transition()
            .duration(mapCtx.TRANSITION_DEFAULT_DURATION)
            .attr("fill", mapCtx.NON_SELECTED_CENTROID_COLOR)
            .attr("opacity", 1);

        d3.select("#mapG")
            .selectAll("path.centroidPath")
            .filter(d => d.properties.GEOUNIT === selectedCountry)
            .transition()
            .duration(mapCtx.TRANSITION_DEFAULT_DURATION)
            .attr("fill", mapCtx.SELECTED_CENTROID_COLOR)
            .attr("opacity", 1);

        d3.select("g#immFlowG").selectAll("g")
            .transition()
            .ease(d3.easeSinInOut)
            .duration(mapCtx.TRANSITION_SHORT_DURATION)
            .attr("opacity", 0)
            .end()
            .then(() => {
                drawFlowNetwork(selectedCountry);
                focusViewOnImmFlow(selectedYear);
            });

    } else {
        d3.select("svg")
            .transition()
            .duration(mapCtx.TRANSITION_DEFAULT_DURATION)
            .call(mapCtx.zoom.transform, mapCtx.initialTransform);
    }

    prevCountry = selectedCountry === prevCountry ? null : selectedCountry;
    
    
    if (typeof updateOverlayVisibility === 'function') {
        updateOverlayVisibility(prevCountry !== null);
    }
    
    if (typeof updateSliderVisibility === 'function') {
        updateSliderVisibility(prevCountry !== null, selectedCountry);
    }
};


function updateImmFlow(selectedCountry, selectedYear){

    d3.select("#mapG")
        .selectAll("path.countryPath")
        .filter(d => mapCtx.immDstCountries.includes(d.properties.GEOUNIT))
        .transition()
        .duration(mapCtx.TRANSITION_SHORT_DURATION)
        .attr("fill", mapCtx.SELECTABLE_IMM_COUNTRY_COLOR);

    d3.select("#mapG")
        .selectAll("path.countryPath")
        .filter(d => d.properties.GEOUNIT ===selectedCountry)
        .transition()
        .duration(mapCtx.TRANSITION_SHORT_DURATION)
        .attr("fill", mapCtx.SELECTED_IMM_COUNTRY_COLOR);

    d3.select("#mapG")
        .selectAll("path.centroidPath")
        .transition()
        .duration(mapCtx.TRANSITION_SHORT_DURATION)
        .attr("opacity", 0);

    const yearMap = mapCtx.immDataGrouped.get(selectedCountry);
    let selectedYearData = yearMap.get(selectedYear);

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

    d3.select("g#immFlowG").selectAll("g")
        .transition()
        .ease(d3.easeSinInOut)
        .duration(mapCtx.TRANSITION_DEFAULT_DURATION)
        .attr("opacity", 0);

    d3.select("g#immFlowG")
        .select(getImmFlowYearGroupId(selectedYear))
        .transition()
        .ease(d3.easeSinInOut)
        .duration(mapCtx.TRANSITION_DEFAULT_DURATION)
        .attr("opacity", 1);
    
    focusViewOnImmFlow(selectedYear);
};


function getImmFlowYearGroupId(year){
    return `g#year-${year}`;
}


function drawImmMap(){

    mapCtx.geoPathGen = d3.geoPath().projection(mapCtx.projection);
    
    let featureG = d3.select("#mapG")
                        .selectAll("g.feature")
                        .data(mapCtx.geoJson.features)
                        .enter()
                        .append("g")
                        .attr("class", "feature")
                        .attr("id", (d) => d.properties.GEOUNIT);

    let paths = featureG.append("path")
                .attr("class", "countryPath")
                .attr("d", mapCtx.geoPathGen)
                .attr("fill", (d) => mapCtx.immDstCountries.includes(d.properties.GEOUNIT)
                            ? mapCtx.SELECTABLE_IMM_COUNTRY_COLOR
                            : mapCtx.NON_SELECTABLE_IMM_COUNTRY_COLOR)
                .attr("stroke", mapCtx.BORDER_COLOR)
                .attr("stroke-width", 0.5)
                .style("cursor", (d) => mapCtx.immDstCountries.includes(d.properties.GEOUNIT)
                            ? "pointer"
                            : "default"
                );

    featureG.append("path")
                .attr("class", "centroidPath")
                .attr("d", d3.symbol().type(d3.symbolCircle).size(mapCtx.CENTROID_GLYPH_SIZE))
                .attr("transform", function(d){
                    let [x,y] = mapCtx.projection([d.properties.LABEL_X, d.properties.LABEL_Y])
                    return `translate(${x},${y})`;
                })
                .attr("opacity", 0)
                .style("pointer-events", "none");

    paths
        .on("mouseenter", function (event, d) {
            if (mapCtx.immDstCountries.includes(d.properties.GEOUNIT)) {
                d3.select(this)
                    .attr("stroke", mapCtx.BORDER_COLOR_HIGHLIGHTED)
                    .attr("stroke-width", 1.5 / currentZoomK);
            }
        })
        .on("mouseleave", function (event, d) {
            if (mapCtx.immDstCountries.includes(d.properties.GEOUNIT)) {
                d3.select(this)
                    .attr("stroke", mapCtx.BORDER_COLOR)
                    .attr("stroke-width", 0.5 / currentZoomK);
            }
        })
        .on("click", function (event, d) {
            drawImmFlow(d.properties.GEOUNIT);
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
            paths.attr("stroke-width", 0.5 / currentZoomK);

            if (event.sourceEvent && event.sourceEvent.type === "mousemove") {
                d3.select("svg").style("cursor", "grabbing");
                d3.select("g#mapG").selectAll("path").style("cursor", "grabbing");
            }
        })
        .on("end", function() {
            d3.select("svg").style("cursor", "grab");
            d3.select("g#mapG")
                .selectAll("path.countryPath")
                .style("cursor", (d) => mapCtx.immDstCountries.includes(d.properties.GEOUNIT)
                                        ? "pointer"
                                        : "default"
                    );
        });

    mapCtx.initialTransform = d3.zoomIdentity
        .translate(mapCtx.MAP_WIDTH / 2, mapCtx.MAP_HEIGHT / 2)
        .scale(6)
        .translate(-mapCtx.projection(mapCtx.europeCenter)[0], -mapCtx.projection(mapCtx.europeCenter)[1]);

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

// If immigration data passes these checks once, it is not necessary to run every time
function checkImmDataIntegrity(){

    let missingCountries = [];
    let invalidCoordinates = [];
    let incompleteSexData = [];

    mapCtx.immDstCountries.forEach(country => {
        if (!mapCtx.countryInfo.has(country)) {
            missingCountries.push(country);
        } else {
            const info = mapCtx.countryInfo.get(country);
            if (info.center_x == null || info.center_y == null || 
                typeof info.center_x !== 'number' || typeof info.center_y !== 'number') {
                invalidCoordinates.push(country);
            }
        }
    });

    mapCtx.immSrcCoutries.forEach(country => {
        if (!mapCtx.countryInfo.has(country)) {
            if (!missingCountries.includes(country)) {
                missingCountries.push(country);
            }
        } else {
            const info = mapCtx.countryInfo.get(country);
            if (info.center_x == null || info.center_y == null || 
                typeof info.center_x !== 'number' || typeof info.center_y !== 'number') {
                if (!invalidCoordinates.includes(country)) {
                    invalidCoordinates.push(country);
                }
            }
        }
    });

    // Check sex data completeness: for each dstCountry, year and srcCountry there must be
    // either 3 different values: M, F and T;
    // or 2 different values: M and T or F and T;
    // or 1 distinct value: T;
    mapCtx.immDataGrouped.forEach((yearMap, dstCountry) => {
        yearMap.forEach((srcCountryMap, year) => {
            srcCountryMap.forEach((records, srcCountry) => {
                if (!Array.isArray(records) || records.length === 0) {
                    incompleteSexData.push({ dstCountry, year, srcCountry, issue: `Empty or invalid records` });
                } else {
                    const sexValues = records.map(r => r.sex).sort();
                    const uniqueSex = [...new Set(sexValues)];
                    
                    if (records.length === 3) {
                        if (uniqueSex.length !== 3 || !uniqueSex.includes("M") || !uniqueSex.includes("F") || !uniqueSex.includes("T")) {
                            incompleteSexData.push({ dstCountry, year, srcCountry, issue: `Expected [F, M, T], found [${sexValues.join(', ')}]` });
                        }
                    } else if (records.length === 2) {
                        const hasT = uniqueSex.includes("T");
                        const hasM = uniqueSex.includes("M");
                        const hasF = uniqueSex.includes("F");
                        if (!hasT || !(hasM || hasF)) {
                            incompleteSexData.push({ dstCountry, year, srcCountry, issue: `Expected [M, T] or [F, T], found [${sexValues.join(', ')}]` });
                        }
                    } else if (records.length === 1) {
                        if (sexValues[0] !== "T") {
                            incompleteSexData.push({ dstCountry, year, srcCountry, issue: `Expected [T], found [${sexValues.join(', ')}]` });
                        }
                    } else {
                        incompleteSexData.push({ dstCountry, year, srcCountry, issue: `Unexpected record count: ${records.length}` });
                    }
                }
            });
        });
    });

    if (missingCountries.length > 0) {
        console.warn("Missing countries in geoJSON:", missingCountries);
    }

    if (invalidCoordinates.length > 0) {
        console.warn("Countries with invalid coordinates:", invalidCoordinates);
    }

    if (incompleteSexData.length > 0) {
        console.warn("Incomplete sex data entries:", incompleteSexData);
    }

    if (missingCountries.length === 0 && invalidCoordinates.length === 0 && incompleteSexData.length === 0) {
        console.log("Data integrity check passed!");
    }

}


function loadData(){
    
    immData = d3.csv(mapCtx.immDataUrl, function(d) {
        
        const value = +d.OBS_VALUE;
        const dstCountry = d["Geopolitical entity (reporting)"];
        const srcCountry = d["Geopolitical entity (partner)"];

        if (value === 0 || dstCountry === srcCountry) {
            return null;
        }

        return {
            dstCountry: dstCountry,
            srcCountry: srcCountry,
            year: +d.TIME_PERIOD,
            value: value,
            sex: d.sex
        };

    });

    geoJson = d3.json(mapCtx.GeoUrl);

    mapCtx.countryInfo = new Map();
    
    Promise.all([immData, geoJson])
        .then((data) => {

            [immData, geoJson] = data;

            mapCtx.immData = immData;
            mapCtx.geoJson = geoJson;

            mapCtx.immDstCountries = [...new Set(immData.map(d => d.dstCountry))];
            mapCtx.immSrcCoutries = [...new Set(immData.map(d => d.srcCountry))];

            mapCtx.projection = d3.geoMercator().fitSize([mapCtx.MAP_WIDTH, mapCtx.MAP_HEIGHT], mapCtx.geoJson);
            mapCtx.immValueExt = d3.extent(mapCtx.immData.filter(d => d.sex === "T"), (d) => d.value);

            geoJson.features.forEach(feature => {
                const [px, py] = mapCtx.projection([feature.properties.LABEL_X, feature.properties.LABEL_Y]);

                mapCtx.countryInfo.set(
                    feature.properties.GEOUNIT, 
                    {
                        center_x: feature.properties.LABEL_X, 
                        center_y: feature.properties.LABEL_Y,
                        px: px,
                        py: py
                    }
                );
            });

            mapCtx.immDataGrouped = d3.group(immData, d => d.dstCountry, d => d.year, d => d.srcCountry);

            // checkImmDataIntegrity();

            // console.log("immDstCountries:", mapCtx.immDstCountries);
            // console.log("immSrcCoutries:", mapCtx.immSrcCoutries);
            // console.log("immDataGrouped:", mapCtx.immDataGrouped);
            // console.log("countryInfo:", mapCtx.countryInfo);
            // console.log("geoJson:", mapCtx.geoJson);

            drawImmMap();

        }).catch(function(error){console.log(error)});

};


function createMap(){

    console.log("Using D3 v"+d3.version);
    
    let mainElement = document.getElementById("main");

    mapCtx.MAP_WIDTH = mainElement.clientWidth;
    mapCtx.MAP_HEIGHT = mainElement.clientHeight;
    
    var svgEl = d3.select("#main").append("svg");
    svgEl.attr("width", mapCtx.MAP_WIDTH);
    svgEl.attr("height", mapCtx.MAP_HEIGHT);
    svgEl.append("g").attr("id", "mapG");

    loadData();
};


