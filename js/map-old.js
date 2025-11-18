const mapCtx = {
    MAP_WIDTH: 0,
    MAP_HEIGHT: 0,
    GeoUrl: "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson", // "https://gisco-services.ec.europa.eu/distribution/v2/nuts/geojson/NUTS_RG_20M_2021_4326_LEVL_0.geojson", 
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

function drawImmFlow(event, D) {

    if (mapCtx.immCountries && !mapCtx.immCountries.has(D.properties.ISO_A2_EH)) {
        return;
    }

    // console.log(prevCountry, D.properties.ISO_A2_EH);

    d3.select("#mapG")
        .selectAll("path.countryPath")
        .filter(d => mapCtx.immCountries && mapCtx.immCountries.has(d.properties.ISO_A2_EH))
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
    
    if (D.properties.ISO_A2_EH != prevCountry) {

        d3.select("#mapG")
            .selectAll("path.countryPath")
            .filter(d => d.properties.ISO_A2_EH === D.properties.ISO_A2_EH)
            .transition()
            .duration(mapCtx.TRANSITION_DEFAULT_DURATION)
            .attr("fill", mapCtx.SELECTED_IMM_COUNTRY_COLOR);

        const yearMap = mapCtx.immTransformed.get(D.properties.ISO_A2_EH);
        let minYear = yearMap ? d3.min(Array.from(yearMap.keys())) : undefined;
        let selectedYear = minYear;

        // console.log(yearMap.get(selectedYear));

        d3.select("#mapG")
            .selectAll("path.centroidPath")
            .filter(d => yearMap.get(selectedYear).some(item => item.srcCountry === d.properties.ISO_A2_EH && 
                                                           item.dstCountry !== d.properties.ISO_A2_EH
            ))
            .transition()
            .duration(mapCtx.TRANSITION_DEFAULT_DURATION)
            .attr("fill", mapCtx.NON_SELECTED_CENTROID_COLOR)
            .attr("opacity", 1);

        d3.select("#mapG")
            .selectAll("path.centroidPath")
            .filter(d => yearMap.get(selectedYear).some(item => item.dstCountry === d.properties.ISO_A2_EH))
            .transition()
            .duration(mapCtx.TRANSITION_DEFAULT_DURATION)
            .attr("fill", mapCtx.SELECTED_CENTROID_COLOR)
            .attr("opacity", 1);

        let focusCountryIDs = [...new Set(
            yearMap.get(selectedYear).flatMap(item => [item.srcCountry, item.dstCountry])
        )];

        focusViewOnCountries(focusCountryIDs);
        drawFlowNetwork(yearMap.get(selectedYear));
    }

    prevCountry = D.properties.ISO_A2_EH === prevCountry ? null : D.properties.ISO_A2_EH;
    
    
    if (typeof updateOverlayVisibility === 'function') {
        updateOverlayVisibility(prevCountry !== null);
    }
};

function drawFlowNetwork(currentYearData){

    let flowData = [];

    let flowGroups = d3.group(currentYearData, d => d.srcCountry);

    flowGroups.forEach(element => {

        if (element.length !== 3) {
            console.warn(`Expected 3 elements, but got ${element.length} for ${element}`);
            return;
        }

        const firstSrc = element[0].srcCountry;
        const firstDst = element[0].dstCountry;
        
        const allSame = element.every(e => 
            e.srcCountry === firstSrc && e.dstCountry === firstDst
        );

        if (!allSame) {
            console.warn(`Not all elements have matching srcCountry/dstCountry for ${element[0]}`);
            return;
        }

        let srcCountryCoords = mapCtx.projection(mapCtx.countryCoords.get(element[0].srcCountryLong).coords);
        let dscCountryCoords = mapCtx.projection(mapCtx.countryCoords.get(element[0].dstCountryLong).coords);

        flowData.push(
            {
                srcCountry: firstSrc,
                dstCountry: firstDst,
                srcCountryLong: element[0].srcCountryLong,
                dstCountryLong: element[0].dstCountryLong,
                srcCountry_X: srcCountryCoords[0],
                srcCountry_Y: srcCountryCoords[1],
                dstCountry_X: dscCountryCoords[0],
                dstCountry_Y: dscCountryCoords[1],
                year: element[0].year,
                m_value: (element.find(item => item.sex === "M").value),
                f_value: (element.find(item => item.sex === "F").value),
                t_value: (element.find(item => item.sex === "T").value)
            }
        );
    });

    console.log(flowData);

    const dashLength = 5;
    const gapLength = 5;
    const dashArray = dashLength + gapLength;

    // Create gradients in defs
    const defs = d3.select("svg").select("defs").empty() 
        ? d3.select("svg").append("defs") 
        : d3.select("svg").select("defs");

    flowData.forEach(d => {
        const gradientId = `path-gradient-${d.srcCountryLong}-${d.dstCountryLong}`;
        
        if (defs.select(`#${gradientId}`).empty()) {
            const gradient = defs.append("linearGradient")
                .attr("id", gradientId)
                .attr("gradientUnits", "userSpaceOnUse")
                .attr("x1", d.srcCountry_X)
                .attr("y1", d.srcCountry_Y)
                .attr("x2", d.dstCountry_X)
                .attr("y2", d.dstCountry_Y);

            gradient.append("stop")
                .attr("offset", "0%")
                .attr("stop-color", "#2196F3");
            gradient.append("stop")
                .attr("offset", "50%")
                .attr("stop-color", "#2196F3");
            gradient.append("stop")
                .attr("offset", "80%")
                .attr("stop-color", "#F44336");
            gradient.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", "#F44336");
        }
    });

    d3.select("g#immFlowG").selectAll("path")
        .data(flowData)
        .enter()
        .append("path")
        .each(function(d) {

            let path = d3.select(this)
                .attr("d", () => {
                    
                    const x1 = d.srcCountry_X;
                    const y1 = d.srcCountry_Y;
                    const x2 = d.dstCountry_X;
                    const y2 = d.dstCountry_Y;

                    const ro = Math.sqrt(Math.pow(x2-x1, 2) + Math.pow(y2-y1, 2)) / (2*Math.cos(Math.PI/6));
                    const alpha = Math.atan2((y2-y1), (x2-x1));
                    const xcp = x1 + ro*Math.cos(alpha+Math.PI/6);
                    const ycp = y1 + ro*Math.sin(alpha+Math.PI/6);
                    
                    return `M ${x1},${y1} Q ${xcp},${ycp} ${x2},${y2}`;
                })
                .attr("fill", "none")
                .attr("stroke", `url(#path-gradient-${d.srcCountryLong}-${d.dstCountryLong})`)
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", `${dashLength},${gapLength}`);

            function animatePath() {
                path.attr("stroke-dashoffset", dashArray)
                    .transition()
                    .duration(500)
                    .ease(d3.easeLinear)
                    .attr("stroke-dashoffset", 0)
                    .on("end", animatePath);
            }

            animatePath();

        });
    
    

};

function focusViewOnCountries(focusCountryIDs){

    let focusCountryCoords = mapCtx.geoData.features
        .filter(f => focusCountryIDs.includes(f.properties.ISO_A2_EH))
        .map(f => mapCtx.projection([f.properties.LABEL_X, f.properties.LABEL_Y]));

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

function drawImmMap() {

    d3.json(mapCtx.GeoUrl).then(function(raw) {
        return {
            type: "FeatureCollection",
            features: (raw.features || [])
                .filter(f => f && f.geometry && f.properties)
                .map(f => ({
                    type: "Feature",
                    geometry: f.geometry,
                    properties: {
                        ISO_A2_EH: f.properties.ISO_A2_EH,
                        NAME: f.properties.NAME,
                        LABEL_X: f.properties.LABEL_X,
                        LABEL_Y: f.properties.LABEL_Y
                    }
                }))
        };
    }).then(function(geoData) {

        // console.log(geoData);

        let projection = d3.geoMercator().fitSize([mapCtx.MAP_WIDTH, mapCtx.MAP_HEIGHT], geoData);
        mapCtx.projection = projection;
        
        let geoPathGen = d3.geoPath().projection(projection);

        mapCtx.geoData = geoData;
        mapCtx.geoPathGen = geoPathGen;

        mapCtx.countryCoords = new Map(
            geoData.features.map(d => [
                d.properties.NAME,
                {
                    coords: [d.properties.LABEL_X, d.properties.LABEL_Y]
                }
            ])
        );
        
        let featureG = d3.select("#mapG")
                            .selectAll("g.feature")
                            .data(geoData.features)
                            .enter()
                            .append("g")
                            .attr("class", "feature")
                            .attr("id", (d) => d.properties.ISO_A2_EH)
                            .attr("countryName", (d) => d.properties.NAME);

        let paths = featureG.append("path")
                    .attr("class", "countryPath")
                    .attr("d", geoPathGen)
                    .attr("fill", (d) => mapCtx.immCountries && mapCtx.immCountries.has(d.properties.ISO_A2_EH)
                                ? mapCtx.SELECTABLE_IMM_COUNTRY_COLOR
                                : mapCtx.NON_SELECTABLE_IMM_COUNTRY_COLOR)
                    .attr("stroke", mapCtx.BORDER_COLOR)
                    .attr("stroke-width", 0.5)
                    .style("cursor", (d) => mapCtx.immCountries && mapCtx.immCountries.has(d.properties.ISO_A2_EH)
                                ? "pointer"
                                : "default"
                    );

        featureG.append("path")
                    .attr("class", "centroidPath")
                    .attr("d", d3.symbol().type(d3.symbolCircle).size(mapCtx.CENTROID_GLYPH_SIZE))
                    .attr("transform", function(d){
                        let [x,y] = projection([d.properties.LABEL_X, d.properties.LABEL_Y])
                        return `translate(${x},${y})`;
                    })
                    .attr("opacity", 0);

        paths
            .on("mouseenter", function (event, d) {
                if (mapCtx.immCountries && mapCtx.immCountries.has(d.properties.ISO_A2_EH)) {
                    d3.select(this)
                        .attr("stroke", mapCtx.BORDER_COLOR_HIGHLIGHTED)
                        .attr("stroke-width", 1.5 / currentZoomK);
                }
            })
            .on("mouseleave", function (event, d) {
                if (mapCtx.immCountries && mapCtx.immCountries.has(d.properties.ISO_A2_EH)) {
                    d3.select(this)
                        .attr("stroke", mapCtx.BORDER_COLOR)
                        .attr("stroke-width", 0.5 / currentZoomK);
                }
            })
            .on("click", function (event, d) {
                drawImmFlow(event, d);
            });

        const b = d3.select("#mapG").node().getBBox();
        const kMin = Math.max(mapCtx.MAP_HEIGHT / b.height, mapCtx.MAP_WIDTH / b.width);
        const worldExtent = [[b.x, b.y], [b.x + b.width, b.y + b.height]];

        let zoom = d3.zoom()
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
                    .selectAll("path")
                    .style("cursor", (d) => mapCtx.immCountries && mapCtx.immCountries.has(d.properties.ISO_A2_EH)
                                            ? "pointer"
                                            : "default"
                     );
            });

        mapCtx.zoom = zoom;

        let initialTransform = d3.zoomIdentity
            .translate(mapCtx.MAP_WIDTH / 2, mapCtx.MAP_HEIGHT / 2)
            .scale(6)
            .translate(-projection(mapCtx.europeCenter)[0], -projection(mapCtx.europeCenter)[1]);
        mapCtx.initialTransform = initialTransform;

        d3.select("svg")
            .call(zoom)
            .call(zoom.transform, initialTransform);

        d3.select("svg").on("dblclick.zoom", function() {
            d3.select("svg")
              .transition()
              .duration(mapCtx.TRANSITION_DEFAULT_DURATION)
              .call(zoom.transform, initialTransform);
        });

    });

};

function loadCountries() {

    d3.csv("data/raw/estat_migr_imm5prv.csv", function(d) {

        // if (d.sex !== "T") {
        //     return null;
        // }
        
        return {
            dstCountry: d["geo"],
            srcCountry: d["partner"],
            dstCountryLong: d["Geopolitical entity (reporting)"],
            srcCountryLong: d["Geopolitical entity (partner)"],
            year: +d.TIME_PERIOD,
            value: +d.OBS_VALUE,
            sex: d.sex
        };

    }).then(function (data) {

        mapCtx.immData = data;

        mapCtx.immCountries = d3.rollup(
            data,
            (D) => ({}),
            (d) => d.dstCountry
        );

        mapCtx.immTransformed = d3.group(data, d => d.dstCountry, d => d.year)

        // console.log(mapCtx.immTransformed);

        // console.log(mapCtx.immData);
        // console.log(mapCtx.immCountries);
        console.log(`Total immigration countries: ${mapCtx.immCountries.size}`);

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
    svgEl.append("g").attr("id", "mapG")
        .append("g").attr("id", "immFlowG");

    loadCountries();


    // const svg = svgEl;

    // // Create your path with quadratic bezier curve
    // const path = svg.append("path")
    //     .attr("d", "M 50,100 Q 150,50 250,100")
    //     .attr("fill", "none")
    //     .attr("stroke", "#4CAF50")
    //     .attr("stroke-width", 2);

    // // Define dash pattern (dash length + gap length)
    // const dashLength = 5;
    // const gapLength = 5;
    // const dashArray = dashLength + gapLength; // Total pattern length = 10

    // path.attr("stroke-dasharray", `${dashLength},${gapLength}`);

    // // Animate stroke-dashoffset continuously
    // // The key: animate by one full pattern length (dashArray)
    // // This way, when it resets, it's visually identical
    // function animatePath() {
    //     path.attr("stroke-dashoffset", dashArray) // Start at one pattern length
    //         .transition()
    //         .duration(500) // Speed of animation
    //         .ease(d3.easeLinear) // Must be linear for smooth loop
    //         .attr("stroke-dashoffset", 0) // End at 0
    //         .on("end", animatePath); // Seamlessly restart
    // }

    // animatePath();










    // const svg = svgEl;

    // // Define a linear gradient from source to destination
    // const gradient = svg.append("defs")
    //     .append("linearGradient")
    //     .attr("id", "path-gradient")
    //     .attr("gradientUnits", "userSpaceOnUse")
    //     .attr("x1", 50)   // source x
    //     .attr("y1", 100)  // source y
    //     .attr("x2", 250)  // destination x
    //     .attr("y2", 100); // destination y

    // // Add color stops (customize these colors)
    // gradient.append("stop")
    //     .attr("offset", "0%")
    //     .attr("stop-color", "#2196F3");  // blue at start

    // gradient.append("stop")
    //     .attr("offset", "50%")           // keep blue until here
    //     .attr("stop-color", "#2196F3");  // still blue

    // gradient.append("stop")
    //     .attr("offset", "80%")           // transition happens between 50-70%
    //     .attr("stop-color", "#F44336");  // red

    // gradient.append("stop")
    //     .attr("offset", "100%")
    //     .attr("stop-color", "#F44336");  // red at end

    // // Create your path with the gradient stroke
    // const path = svg.append("path")
    //     .attr("d", "M 50,100 Q 150,50 250,100")
    //     .attr("fill", "none")
    //     .attr("stroke", "url(#path-gradient)")  // reference the gradient
    //     .attr("stroke-width", 2);

    // // Define dash pattern (dash length + gap length)
    // const dashLength = 5;
    // const gapLength = 5;
    // const dashArray = dashLength + gapLength;

    // path.attr("stroke-dasharray", `${dashLength},${gapLength}`);

    // // Animate stroke-dashoffset continuously
    // function animatePath() {
    //     path.attr("stroke-dashoffset", dashArray)
    //         .transition()
    //         .duration(500)
    //         .ease(d3.easeLinear)
    //         .attr("stroke-dashoffset", 0)
    //         .on("end", animatePath);
    // }

    // animatePath();









    // // Simple and fancy striped stroke examples using D3

    // const svg = svgEl;
    // const pathData = "M 50,100 Q 150,50 250,100";

    // // background (gap) stroke - full continuous stroke showing through gaps
    // svg.append("path")
    // .attr("d", pathData)
    // .attr("fill", "none")
    // .attr("stroke", "#FFC107")     // color for the gaps
    // .attr("stroke-width", 2)
    // .attr("stroke-linecap", "butt");

    // // top dashed stroke - dashes in front color
    // const dashLength = 16;
    // const gapLength = 8;
    // const dashCycle = dashLength + gapLength;

    // const top = svg.append("path")
    // .attr("d", pathData)
    // .attr("fill", "none")
    // .attr("stroke", "#4CAF50")     // color of dashes
    // .attr("stroke-width", 2)
    // .attr("stroke-linecap", "butt")
    // .attr("stroke-dasharray", `${dashLength},${gapLength}`);

    // // animate top dashed stroke continuously without visible jump
    // function animateTop() {
    // top.attr("stroke-dashoffset", dashCycle)
    //     .transition()
    //     .duration(800)                 // control speed here
    //     .ease(d3.easeLinear)
    //     .attr("stroke-dashoffset", 0)
    //     .on("end", animateTop);
    // }
    // animateTop();


};


