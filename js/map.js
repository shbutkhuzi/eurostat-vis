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
    TRANSITION_DEFAULT_DURATION: 750
};

let currentZoomK = 1;
let prevCountry = null;


function drawFlowNetwork(selectedCountry, selectedYear){

    // console.log(selectedCountry);
    // console.log(selectedYear);

    const flowG = d3.select("g#immFlowG").empty()
                        ? d3.select("#mapG").append("g").attr("id", "immFlowG")
                        : d3.select("g#immFlowG");

    flowG.selectAll("*").remove();
    
    const dstCountryCoords = mapCtx.countryInfo.get(selectedCountry);

    const defs = flowG.select("defs").empty() 
        ? flowG.append("defs")
        : flowG.select("defs");

    let particleSpeedScale = d3.scaleLog().base(10).domain(mapCtx.immValueExt).range([2000, 500]);

    flowG.selectAll("path")
        .data(selectedYear)
        .enter()
        .append("path")
        .each(function(d) {

            // console.log(d);

            const dashLength = 1;
            const gapLength = 1;
            const dashArray = dashLength + gapLength;

            const srcCountryCoords = mapCtx.countryInfo.get(d[0]);
            const gradientId = `gradient-${d[0]}-${selectedCountry}`.replace(/\s+/g, '-');

            const gradient = defs.append("linearGradient")
                .attr("id", gradientId)
                .attr("gradientUnits", "userSpaceOnUse")
                .attr("x1", srcCountryCoords.px)
                .attr("y1", srcCountryCoords.py)
                .attr("x2", dstCountryCoords.px)
                .attr("y2", dstCountryCoords.py);

            const gradientMargin = 10;

            if (d[1].length === 3) {
                maleVal = d[1].find(item => item.sex === "M").value;
                totalVal = d[1].find(item => item.sex === "T").value;
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

            } else if (d[1].length === 2) {
                maleVal = d[1].find(item => item.sex === "M")?.value || 0;
                femaleVal = d[1].find(item => item.sex === "F")?.value || 0;
                totalVal = d[1].find(item => item.sex === "T").value;

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
            } else if (d[1].length === 1) {
                totalVal = d[1].find(item => item.sex === "T").value;
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
    
    flowG.transition()
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


function focusViewOnCountries(selectedCountry, selectedYear){

    let focusCountryIDs = [selectedCountry, ...Array.from(selectedYear.keys())];

    let focusCountryCoords = focusCountryIDs
        .filter(id => mapCtx.countryInfo.has(id))
        .map(id => {
            const info = mapCtx.countryInfo.get(id);
            return [info.px, info.py];
        });

    let xs = focusCountryCoords.map(p => p[0]);
    let ys = focusCountryCoords.map(p => p[1]);
    let minX = d3.min(xs), maxX = d3.max(xs);
    let minY = d3.min(ys), maxY = d3.max(ys);

    let bboxW = Math.max(1, maxX - minX);
    let bboxH = Math.max(1, maxY - minY);

    let padding = Math.max(15, Math.min(mapCtx.MAP_WIDTH, mapCtx.MAP_HEIGHT) * 0.01);
    // console.log(padding);

    let scale = Math.min(
            mapCtx.MAP_WIDTH / (bboxW + padding),
            mapCtx.MAP_HEIGHT / (bboxH + padding)
        );

    let centerX = (minX + maxX) / 2;
    let centerY = (minY + maxY) / 2;

    let focusTransform = d3.zoomIdentity
        .translate(mapCtx.MAP_WIDTH / 2, mapCtx.MAP_HEIGHT / 2)
        .scale(scale)
        .translate(-centerX, -centerY);

    d3.select("svg")
        .transition()
        .duration(mapCtx.TRANSITION_DEFAULT_DURATION)
        .call(mapCtx.zoom.transform, focusTransform);
};


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

    d3.select("svg")
        .transition()
        .duration(mapCtx.TRANSITION_DEFAULT_DURATION)
        .call(mapCtx.zoom.transform, mapCtx.initialTransform);

    d3.select("g#immFlowG")
        .transition()
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
        let minYear = yearMap ? d3.min(Array.from(yearMap.keys())) : undefined;
        let selectedYear = yearMap.get(minYear);

        d3.select("#mapG")
            .selectAll("path.centroidPath")
            .filter(d => d.properties.GEOUNIT !== selectedCountry && 
                        selectedYear.has(d.properties.GEOUNIT))
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

        focusViewOnCountries(selectedCountry, selectedYear);

        d3.select("g#immFlowG")
            .transition()
            .duration(mapCtx.TRANSITION_DEFAULT_DURATION)
            .attr("opacity", 0)
            .end()
            .then(() => {
                drawFlowNetwork(selectedCountry, selectedYear);
            });
    }

    prevCountry = selectedCountry === prevCountry ? null : selectedCountry;
    
    
    if (typeof updateOverlayVisibility === 'function') {
        updateOverlayVisibility(prevCountry !== null);
    }
};


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

            checkImmDataIntegrity();

            console.log("immDstCountries:", mapCtx.immDstCountries);
            console.log("immSrcCoutries:", mapCtx.immSrcCoutries);
            console.log("immDataGrouped:", mapCtx.immDataGrouped);
            console.log("countryInfo:", mapCtx.countryInfo);
            console.log("geoJson:", mapCtx.geoJson);

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


