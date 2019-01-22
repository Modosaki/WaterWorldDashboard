// Define SVG area dimensions
var svgWidth = 1140;
var svgHeight = 505;

// Define the chart's margins as an object
var margin = {
  top: 60,
  right: 60,
  bottom: 60,
  left: 60
};

// Define dimensions of the chart area
var chartWidth = svgWidth - margin.left - margin.right;
var chartHeight = svgHeight - margin.top - margin.bottom;

// Select body, append SVG area to it, and set its dimensions
var svg = d3.select("#svg")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight);

  
// Append a group area, then set its margins
var chartGroup = svg.append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Configure a parseTime function which will return a new Date object from a string
var parseTime = d3.timeParse("%Y");

//##################################################################################################
//function to build line charts
//##################################################################################################
function buildCharts(iso) {
  //fetch countries data from iso code
  d3.json("/aquadata/"+iso).then(function(data){
    //console.log(data);
    //#################################################################################################
    //make pie chart
    //#################################################################################################
    function makePieChart(availability, id, title){
      var pieData = [{
        values: [availability, 100-availability],
        labels: ['available', 'unavailable'],
        type: 'pie'
      }];
      
      var pieLayout = {
        title: title,
        height: 350,
        width: 350,
        legend: {
          x: 0.3,
          y: 0
        }
      };
      
      Plotly.newPlot(id, pieData, pieLayout); 
    }
    totalList = data['Total population with access to safe drinking-water (JMP)'].Value
    ruralList = data['Rural population with access to safe drinking-water (JMP)'].Value
    urbanList = data['Urban population with access to safe drinking-water (JMP)'].Value


    totalCleanWater = totalList[totalList.length-1];
    ruralCleanWater = ruralList[ruralList.length-1];
    urbanCleanWater = urbanList[urbanList.length-1];

    makePieChart(totalCleanWater,"pie-total", "total population");
    makePieChart(ruralCleanWater,"pie-rural", "rural population");
    makePieChart(urbanCleanWater,"pie-urban", "urban population");

    //#########################################################################################################
    //make the area chart
    //#########################################################################################################
    var country = data.country;
    // clear previous graph
    chartGroup.selectAll(".line").remove();
    chartGroup.selectAll(".axis").remove();
    chartGroup.selectAll(".text").remove();
    chartGroup.selectAll(".area").remove();
    
    svg.selectAll(".mouse-over-effects").remove();
    svg.selectAll(".legend").remove();

    //format data for plotting   
    var resultData = []
    var dataCollection = [ data["Urban population with access to safe drinking-water (JMP)"],
                           data['Total population with access to safe drinking-water (JMP)'],
                           data["Rural population with access to safe drinking-water (JMP)"],
                            ]
    
    dataCollection.forEach(function(d){
      var temp=[]  
      for (let i in d.Year){
          temp.push({ date: parseTime(d.Year[i]),
                      value: d.Value[i]})
        }
      resultData.push(temp)
    })
    
    //configure a time scale function
    var xTimeScale = d3.scaleTime()
                       .domain(d3.extent(resultData[0], data => data.date))
                       .range([0, chartWidth]);

    // // Configure a linear scale with a range between the chartHeight and 0
    var yLinearScale = d3.scaleLinear()
                         .domain([0, 105] )
                         .range([chartHeight, 0]);

    // // Create two new functions passing the scales in as arguments
    // // These will be used to create the chart's axes
    var bottomAxis = d3.axisBottom(xTimeScale);
    var leftAxis = d3.axisLeft(yLinearScale);

    var drawLine = d3.line()
                     .x( d => xTimeScale(d.date) )
                     .y( d => yLinearScale(d.value) );

    //Area
    var drawArea = d3.area()
                 .x( d => xTimeScale(d.date ) )
                 .y0((d,i)=> yLinearScale(0))
                 .y1( (d,i) => { return yLinearScale(d.value)});

    //draw line charts             
    var lineChart = chartGroup.selectAll(".line")
                          .data(resultData)
                          .enter()

    //set the colors and texts for each data
    var colors=["rgba(255, 0, 0, 0.5)","rgba(0, 0, 0, 0.7)", "rgba(0, 174, 0, 0.7)"]
    var legendColors=["rgba(255, 0, 0, 0.5)","rgba(75, 0, 0, 1)", "rgba(0, 125, 0, 0.8)"]
    var legendTexts=["urban","total","rural"]
    
    //Draw the lines with different color
    var path = lineChart.append("path")
                        .attr("class", "line")
                        .style("stroke", (d,i)=> colors[i] )
                        .attr("d", drawLine);
    
    //Draw areas with different color
     chartGroup.selectAll(".area")
              .data(resultData)
              .enter()
              .append("path")
              .attr("class", "area")
              .attr('transform', 'translate(-1200, 0)')
              .transition()
              .duration(3000)
              .style("fill", (d,i)=> colors[i] )
              .attr('transform', 'translate(0, 0)')
              .attr("d", d => { return drawArea(d);})
                      
    
    //adding path transition effect to each line, from "https://stackoverflow.com/questions/21140547/accessing-svg-path-length-in-d3"    
    path.each(function(d){d.totalLength = this.getTotalLength(); })
        .attr("stroke-dasharray", function(d){ return d.totalLength+" "+d.totalLength ;})
        .attr("stroke-dashoffset", function(d) { return d.totalLength; })
        .transition()
        .duration(1500)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset",0);


    //Append y-axis title
    chartGroup.append("text")
              .classed("text", true)
              .attr("transform", "rotate(-90)")
              .attr("y", 0 - margin.left)
              .attr("x",0 - (chartHeight / 2))
              .attr("dy", "1em")
              .style("text-anchor", "middle")
              .style("font-weight", "bold")
              .text("Percentage of population with access to clean water");      
    
    // // Append an SVG group element to the chartGroup, create the left axis inside of it
    chartGroup.append("g")
              .classed("axis", true)
              .call(leftAxis);

    //append x-axis title
    chartGroup.append("text")
              .attr("transform", `translate(${chartWidth / 2}, ${chartHeight +margin.top/1.5})`)
              .classed("text", true)
              .style("font-weight", "bold")
              .text( country);      

    // // Append an SVG group element to the chartGroup, create the bottom axis inside of it
    // // Translate the bottom axis to the bottom of the page
    chartGroup.append("g")
              .classed("axis", true)
              .attr("transform", `translate(0, ${chartHeight})`)
              .call(bottomAxis);
    //###########################################################  
    //append legened
    //############################################################
    var legend = svg.append("g")
                    .classed("legend", true)
                    .attr("x", 65)
                    .attr("y", 25)
                    .attr("height", 100)
                    .attr("width", 100);
    

    legend.selectAll('g').data(resultData)
                         .enter()
                         .append('g')
                         .each(function(d, i) {
                          var g = d3.select(this);
                              g.append("rect")
                                .attr("x", chartWidth- 65)
                                .attr("y", i*25+5)
                                .attr("width", 10)
                                .attr("height", 10)
                                .style("fill", (legendColors[i]));

                              g.append("text")
                               .attr("x", chartWidth - 50)
                               .attr("y", i * 25+15 )
                               .attr("height",30)
                               .attr("width",-90)
                               .style("fill", "black")
                               .text(legendTexts[i]);});
    //#######################################################################################
    //tooltip, adapted from https://bl.ocks.org/larsenmtl/e3b8b7c2ca4787f77d78f58d41c3da91
    //#######################################################################################

    var mouseG = svg.append("g")
          .attr("class", "mouse-over-effects")
          .attr("transform", "translate(60,60)");
    

      mouseG.append("path") // this is the black vertical line to follow mouse
            .attr("class", "mouse-line")
            .style("stroke", "black")
            .style("stroke-width", "1px")
            .style("opacity", "0");
    
      var lines = document.getElementsByClassName('line');

      var mousePerLine = mouseG.selectAll('.mouse-per-line')
                              .data(resultData)
                              .enter()
                              .append("g")
                              .attr("class", "mouse-per-line");

          mousePerLine.append("circle")
                      .attr("r", 7)
                      .style("stroke", "black")
                      .style("fill", "none")
                      .style("stroke-width", "1px")
                      .style("opacity", "0");

          mousePerLine.append("text")
                      .attr("transform", "translate(10,10)");

  mouseG.append('svg:rect') // append a rect to catch mouse movements on canvas
        .attr('width', chartWidth) // can't catch mouse events on a g element
        .attr('height', chartHeight)
        .attr('fill', 'none')
        .attr('pointer-events', 'all')
        .on('mouseout', function() { // on mouse out hide line, circles and text
                        d3.select(".mouse-line")
                          .style("opacity", "0");
                        d3.selectAll(".mouse-per-line circle")
                          .style("opacity", "0");
                        d3.selectAll(".mouse-per-line text")
                          .style("opacity", "0");
                      })
        .on('mouseover', function() { // on mouse in show line, circles and text
          d3.select(".mouse-line")
            .style("opacity", "1");
          d3.selectAll(".mouse-per-line circle")
            .style("opacity", "1");
          d3.selectAll(".mouse-per-line text")
            .style("opacity", "1");
        })
    .on('mousemove', function() { // mouse moving over canvas
      var mouse = d3.mouse(this);
      d3.select(".mouse-line")
        .attr("d", function() {
          var d = "M" + mouse[0] + "," + chartHeight;
          d += " " + mouse[0] + "," + 0;
          return d;
        });

      d3.selectAll(".mouse-per-line")
        .attr("transform", function(d, i) {
          // var xDate = xTimeScale.invert(mouse[0]),
          //     bisect = d3.bisector(function(d) {console.log(d) }).right;
          //     idx = bisect(d.value, xDate);
             
          var beginning = 0,
              end = lines[i].getTotalLength(),
              target = null;

          while (true){
            target = Math.floor((beginning + end) / 2);
            pos = lines[i].getPointAtLength(target);
            if ((target === end || target === beginning) && pos.x !== mouse[0]) {
                break;
            }
            if (pos.x > mouse[0])      {end = target;}
            else if (pos.x < mouse[0]) {beginning = target;}
            else {break;} //position found
          }
          
          d3.select(this).select('text')
            .text(yLinearScale.invert(pos.y).toFixed(2));
            
          return "translate(" + mouse[0] + "," + pos.y +")";
        });
    });

  }).catch(function(error){
    console.log(error);
    alert("Missing accessibility data!");
  });
}

//#################################################################################
//leaflet map set up
//#################################################################################
//Build the leaflet map
var map = L.map("map", {
  center: [30.0626, 31.2497],
  zoom: 2 
});
//initialize title layer
var streetmap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a> contributors, <a href=\"http://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"http://mapbox.com\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox.light",
    accessToken: API_KEY
  }).addTo(map);

//Get country border polygon data using Jquery
  const geoPath = "https://s3.amazonaws.com/rawstore.datahub.io/23f420f929e0e09c39d916b8aaa166fb.geojson"
  $.getJSON(geoPath, function(data) {
    //console.log(data)
    //data.features.forEach(d => {console.log( d.properties.ISO_A3)})
    L.geoJson(data, {
      
      onEachFeature: function(feature, layer){
        //console.log(feature.properties.ISO_A3);
        d3.json("/wqidata/"+feature.properties.ISO_A3).then(function(data){
          //console.log(data)
          try{
          waterIndex = data[0].H2O_current
          layer.setStyle({color: d3.interpolateRgb("white", "rgb(0, 0, 255)")(waterIndex/100), 
                          fillOpacity:0.7});
          
          layer.on(
            {    
              click: function(event) {
                              country_ISO = feature.properties.ISO_A3;
                              //change the dropdown menu to match current country selection
                              //JQuery version
                              $("#selDataset").find('option[value="'+ country_ISO +'"]').prop('selected', 'selected')
                              //regular js version
                              //document.getElementByValue(country_ISO).selected = true;
                              buildCharts(country_ISO);
                              map.flyToBounds(event.target.getBounds())
                            },
                  
              mouseover: function(event){
                              event.target.setStyle({
                                fillOpacity: 0.2
                              });
                            },
                  
              mouseout: function(event){
                              event.target.setStyle({
                                fillOpacity: 0.7
                              });
                            }
                          });

          layer.bindPopup("<h4>" + "Water quality index" + "</h4> <hr> <h5>" + waterIndex + "</h5>");

          }
          catch{
            layer.setStyle({color: "black",
                            fillOpacity:0.7 })
          }
        }).catch(function(error){
          console.log(error);
        })
      }
    }).addTo(map);

    //When the dropdown menu changed, map will fly to the corresponding boundary
    //map.eachLayer(function(layer){console.log(layer)});
    isoToLeafletId = {}          //leaflet uses a special id for each polygon of different countries, build a dictionary/object to convert this into iso code of that country
    map.eachLayer((layer)=>{
      try{
        isoToLeafletId[layer.feature.properties.ISO_A3] = layer._leaflet_id;
      }
      catch(error){console.log("no data")}
    });

    //update map when a dropdown menu is changed, Jquery version
    $("#selDataset").change(function(){
              try{
                let country_ISO = this.value; 
                buildCharts(country_ISO);
                
                leaflet_id = isoToLeafletId[country_ISO];
                selectLayer = map._layers[leaflet_id];
                map.flyToBounds(selectLayer.getBounds());
              }
              catch(error){
                console.log(error);
                console.log("no such data");
              }})        
  });


//##################################################################################################
// function used to initialize the dashborad
//##################################################################################################
function init() {
  // Grab a reference to the dropdown select element
  // $( "#map" ).css( "border", "3px solid red" );

  var selector = d3.select("#selDataset");
  // Use the list of sample names to populate the select options
  d3.json("/names").then((sampleNames) => {
    sampleNames.forEach((sample) => {
      selector
        .append("option")
        .text(sample.country)
        .property("value", sample.iso);
    });

    // Use the first sample from the list to build the initial plots
    const firstSample = sampleNames[0].iso;  
    buildCharts(firstSample);
  });
}
init();

