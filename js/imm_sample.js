const ctx = {
    CHART_WIDTH: 1280,
    CHART_HEIGHT: 760
};

function initSVGcanvas(immigrData){

    let maxImmigr = d3.max(immigrData, (d) => d.OBS_VALUE);
    let yearExt = d3.extent(immigrData, (d) => d.TIME_PERIOD);

    ctx.yScale = d3.scaleLinear().domain([0, maxImmigr])
                                 .range([ctx.CHART_HEIGHT-60, 20]);

    ctx.xScale = d3.scaleLinear().domain(yearExt)
                                 .range([100, ctx.CHART_WIDTH - 20]);

    d3.select("#mainG").append("g")
      .attr("transform", "translate(70,0)")
      .call(d3.axisLeft(ctx.yScale).ticks(Math.floor(maxImmigr/4000)))
      .selectAll("text")
      .style("text-anchor", "end");

    d3.select("#mainG").append("g")
      .attr("transform", `translate(0,${ctx.CHART_HEIGHT-50})`)
      .call(
        d3.axisBottom(ctx.xScale)
          .tickFormat(d3.format("d"))
          .tickValues(d3.range(
            Math.floor(ctx.xScale.domain()[0]), 
            Math.ceil(ctx.xScale.domain()[1]) + 1,
            2
          ))
      )
      .selectAll("text")
      .style("text-anchor", "middle");

    d3.select("#mainG")
      .append("text")
      .attr("y", ctx.CHART_HEIGHT - 12)
      .attr("x", ctx.CHART_WIDTH/2)
      .classed("axisLb", true)
      .text("Year")
      .style("text-anchor", "middle")
      .style("fill", "currentColor");

    d3.select("#mainG")
      .append("text")
      .attr("y", 10)
      .attr("x", 0)
      .attr("transform", `rotate(-90) translate(-${ctx.CHART_HEIGHT/2},0)`)
      .classed("axisLb", true)
      .text("Immigration Count in Finlad")
      .style("fill", "currentColor");


    d3.select("#mainG").append("path")
        .datum(immigrData.filter(d => d.sex === "M"))
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
            .x(function(d) { return ctx.xScale(d.TIME_PERIOD) })
            .y(function(d) { return ctx.yScale(d.OBS_VALUE) })
        );

    d3.select("#mainG").append("path")
        .datum(immigrData.filter(d => d.sex === "F"))
        .attr("fill", "none")
        .attr("stroke", "#b9002bff")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
            .x(function(d) { return ctx.xScale(d.TIME_PERIOD) })
            .y(function(d) { return ctx.yScale(d.OBS_VALUE) })
        );
        
}

function loadData() {
    d3.csv("data/raw/estat_migr_imm8.csv").then(function (data) {

        let immigrData = data.filter((d) => (d.geo === "FI") & (d.age === "TOTAL"));

        immigrData.forEach(
            (d) => { 
                d.OBS_VALUE = parseInt(d.OBS_VALUE);
                d.TIME_PERIOD = parseInt(d.TIME_PERIOD);
            }
        );

        console.log(`Total rows: ${immigrData.length}`);

        initSVGcanvas(immigrData);
;
    }).catch(function(error){console.log(error)});
};

function createViz(){
    console.log("Using D3 v"+d3.version);
    var svgEl = d3.select("#main").append("svg");
    svgEl.attr("width", ctx.CHART_WIDTH);
    svgEl.attr("height", ctx.CHART_HEIGHT);
    svgEl.append("g").attr("id", "mainG");
    loadData();
};
