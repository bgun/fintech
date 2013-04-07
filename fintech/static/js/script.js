$(function() {

    var width, height;
    function getSize(){
        width = $('#map').width();
        height = $('#map').height();
        init();
    }

    function handleClick(d,i) {
    }

    function init(){

        console.log("Init");

        //Setup path for globe
        var projection = d3.geo.azimuthal()
            .mode("orthographic")
            .translate([width / 2, height / 2])

        var scale0 = projection.scale();

        var path = d3.geo.path()
            .projection(projection)
            .pointRadius(2);

        //Setup zoom behavior
        var zoom = d3.behavior.zoom(true)
            .translate(projection.origin())
            .scale(projection.scale())
            .scaleExtent([100, 800])
            .on("zoom", move);

        var circle = d3.geo.greatCircle();

        console.log(height);

        var svg = d3.select("#map").append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
                .call(zoom)
                .on("dblclick.zoom", null);

        console.log(svg);

        svg.append("rect")
            .attr("class", "frame")
            .attr("width", width)
            .attr("height", height);

        //Create the base globe
        var backgroundCircle = svg.append("circle")
            .attr('cx', width / 2)
            .attr('cy', height / 2)
            .attr('r', projection.scale())
            .attr('class', 'globe')

        var g = svg.append("g"),
            features;

        //Add all of the countries to the globe
        d3.json("/static/data/world-countries.json", function(collection) {
            features = g.selectAll(".feature").data(collection.features);
            features.enter().append("path")
                .attr("class", "feature")
                .attr("title", function(d,i) {
                    return collection.features[i].properties.name;
                })
                .attr("d", function(d){
                    var clip = path(circle.clip(d));
                    if(clip) {
                        return clip;
                    } else {
                        return "M 0 0";
                    }
                })
                .on("click",handleClick);
        });

        //Redraw all items with new projections
        function redraw(){
            var d = features.attr("d");
            features.attr("d", function(d){
                var clip = path(circle.clip(d));
                if(clip) {
                    return clip;
                } else {
                    return "M 0 0";
                }
            });
        }


        function move() {
            if(d3.event){
                var scale = d3.event.scale;
                var origin = [d3.event.translate[0] * -1, 0];// d3.event.translate[1]];
                
                projection.scale(scale);
                backgroundCircle.attr('r', scale);
                path.pointRadius(2 * scale / scale0);

                projection.origin(origin);
                circle.origin(origin);
                
                redraw();
            }
        }


        function randomLonLat(){
            return [Math.random() * 360 - 180, Math.random() * 180 - 90];
        }
    }

    getSize();

});
