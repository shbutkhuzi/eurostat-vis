const mapCtx = {
    MAP_WIDTH: 1400,
    MAP_HEIGHT: 750,
    GeoUrl: "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson", // "https://gisco-services.ec.europa.eu/distribution/v2/nuts/geojson/NUTS_RG_20M_2021_4326_LEVL_0.geojson", 
    europeCenter: [20, 52]
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
                        NAME: f.properties.NAME
                    }
                }))
        };
    }).then(function(geoData) {

        console.log(geoData);

        let projection = d3.geoMercator().fitSize([mapCtx.MAP_WIDTH, mapCtx.MAP_HEIGHT], geoData);
        
        let geoPathGen = d3.geoPath().projection(projection);
        
        let paths = d3.select("#mapG")
            .selectAll("path")
            .data(geoData.features)
            .enter()
            .append("path")
            .attr("d", geoPathGen)
            .attr("id", (d) => d.properties.ISO_A2_EH)
            .attr("countryName", (d) => d.properties.NAME)
            .attr("stroke", "#DDD")
            .attr("fill", (d) => mapCtx.immCountries && mapCtx.immCountries.has(d.properties.ISO_A2_EH)
                                    ? "#575757ff"
                                    : "#3e3e3e78")
            .attr("stroke-width", 0.5)
            .style("cursor", (d) => mapCtx.immCountries && mapCtx.immCountries.has(d.properties.ISO_A2_EH)
                                    ? "pointer"
                                    : "default"
            );

        let currentZoomK = 1;

        paths
            .on("mouseenter", function (event, d) {
                if (mapCtx.immCountries && mapCtx.immCountries.has(d.properties.ISO_A2_EH)) {
                    d3.select(this)
                        .raise()
                        .attr("stroke-width", 1.5 / currentZoomK);
                }
            })
            .on("mouseleave", function (event, d) {
                if (mapCtx.immCountries && mapCtx.immCountries.has(d.properties.ISO_A2_EH)) {
                    d3.select(this)
                        .attr("stroke-width", 0.5 / currentZoomK);
                }
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
                d3.select("g#mapG").selectAll("path")
                .style("cursor", (d) => mapCtx.immCountries && mapCtx.immCountries.has(d.properties.ISO_A2_EH)
                                        ? "pointer"
                                        : "default"
                );
            });

        let initialTransform = d3.zoomIdentity
            .translate(mapCtx.MAP_WIDTH / 2, mapCtx.MAP_HEIGHT / 2)
            .scale(6)
            .translate(-projection(mapCtx.europeCenter)[0], -projection(mapCtx.europeCenter)[1]);

        d3.select("svg")
            .call(zoom)
            .call(zoom.transform, initialTransform)
            .style("cursor", "grab");

        d3.select("svg").on("dblclick.zoom", function() {
            d3.select("svg")
              .transition()
              .duration(750)
              .call(zoom.transform, initialTransform);
        });

    });

}

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

        console.log(mapCtx.immData);
        console.log(mapCtx.immCountries);
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
    svgEl.append("g").attr("id", "mapG");

    loadCountries();

};