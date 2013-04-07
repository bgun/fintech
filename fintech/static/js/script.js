$(function() {

    var width, height;
    function getSize(){
        width = $('#map').width();
        height = $('#map').height();
        init();
    }

    function handleClick(d,i) {
        console.log(d);
        $('#sidebar .content').append("<p>"+d.properties.currency+","+d.properties.name+"</p>");
        if(d.properties.currency) {
            d3.selectAll('.currency-'+d.properties.currency).transition().style('fill','#0F0');
        }
    }

    function init() {

        console.log("Init");

        //Setup path for globe
        var autospin = true;
        var autoangle = 0;

        var projection = d3.geo.azimuthal()
            .mode("orthographic")
            .translate([width / 3, height / 2])

        var scale0 = projection.scale();
        var autoscale = scale0;

        var path = d3.geo.path()
            .projection(projection)
            .pointRadius(2);

        //Setup zoom behavior
        console.log(projection.origin());
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
            .attr('cx', width / 3)
            .attr('cy', height / 2)
            .attr('r', projection.scale())
            .attr('class', 'globe')
            .on('mouseover',function() {
                autospin = false;
            })
            .on('mouseout',function() {
                autospin = true;
            })

        var g = svg.append("g"),
            features;

        //Add all of the countries to the globe
        d3.json("/static/data/world-countries.json", function(collection) {
            features = g.selectAll(".feature").data(collection.features);
            features.enter().append("path")
                .attr("class", function(d,i) {
                    return "feature currency-"+d.properties.currency;
                })
                .attr("d", function(d){
                    var clip = path(circle.clip(d));
                    if(clip) {
                        return clip;
                    } else {
                        return "M 0 0";
                    }
                })
                .on("click",handleClick)
                .on('mouseover',function() {
                    autospin = false;
                })
                .on('mouseout',function() {
                    autospin = true;
                })

            console.log("Loaded!");
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
                autoscale = scale;
                autoangle = d3.event.translate[0] * -1;
                var origin = [autoangle, 15];// d3.event.translate[1]];
                
                projection.scale(autoscale);
                backgroundCircle.attr('r', autoscale);
                path.pointRadius(2 * autoscale / scale0);

                projection.origin(origin);
                circle.origin(origin);
                
                redraw();
            } else {
                if(autospin) {
                    autoangle = autoangle + 0.5;
                    var origin = [autoangle, 15];// d3.event.translate[1]];
                    
                    projection.scale(autoscale);
                    backgroundCircle.attr('r', autoscale);
                    path.pointRadius(2 * autoscale / scale0);

                    projection.origin(origin);
                    circle.origin(origin);
                    redraw();
                }
            }
        }

        function randomLonLat(){
            return [Math.random() * 360 - 180, Math.random() * 180 - 90];
        }
        setInterval(move,30);
    }

    getSize();

});
