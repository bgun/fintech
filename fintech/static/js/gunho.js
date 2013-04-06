var App = {
    renderMap: function(geoJsonObj) {
        var width = "100%";
        var height = "100%";
        var path = d3.geo.path();
        var svg = d3.select("#map").append("svg")
            .attr("width", width)
            .attr("height", height);

        svg.append("g")
            .selectAll("path")
            .data(geoJsonObj.features)
            .enter().append("path")
            .attr("id", function(d,i) { return geoJsonObj.features[i].id })
            .attr("class", "country")
            .attr("d", path)
    },
    init: function() {
        console.log("Init");
        $.get('/static/data/countries.geo.json',function(resp) {
            App.renderMap(resp);
        });
    }
}

$(App.init());
