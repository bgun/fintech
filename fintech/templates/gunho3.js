var App = {
    initMap: function(world) {
        console.log("Init map");
        var wWidth = $('#map').width();
        var wHeight = $('#map').height();

        var globe = { type: "Sphere" };
        var diameter = wHeight-50;
        var radius = diameter / 2;

        var transX = (wWidth/2)-(radius/2);
        var transY = (wHeight/2)-(radius/2);
        console.log(transX);
        transX = wWidth / 2;
        transY = wHeight / 2;

        App.projection = d3.geo.orthographic()
            .scale(radius - 2)
            .rotate([0,0])
            .translate([transX,transY])
            .clipAngle(90);
            //.origin([-71.03,42.37])
            //.mode("orthographic")

        App.svgGlobe = d3.select("#map svg g");

        App.path = d3.geo.path().projection(App.projection);

        App.svgGlobe.append("path")
            .datum(globe)
            .attr("class", "globe")
            .attr("d", App.path);

        var land = topojson.object(world, world.objects.land)
        console.log(land);

            App.svgGlobe.append("path")
                //.selectAll("path")
                .data(land.coordinates)
                //.enter().append("path")
                //.attr("id", function(d,i) { return geoJsonObj.features[i].id; })
                //.attr("title", function(d,i) { return geoJsonObj.features[i].properties.name; })
                .attr("class", "country")
                .attr("d", App.path)
                .on('click',App.handleClick)
                /*
                /*
                .on('mouseover',function(d,i) {
                })
                .on('mouseout',function(d,i) {
                });
                */

    },
    renderMap: function(angle) {
        App.projection.rotate([angle,0]);
        App.svgGlobe.selectAll("path")
            .attr("d", App.path.projection(App.projection));
    },
    handleClick: function(d,i) {
        console.log(this);
        var title = $(this).attr('title');
        var abbr = $(this).attr('id');
        $('#map path').attr('style','');
        if(abbr == App.activeCountry) {
            this.style.fill = "";
            App.activeCountry = null;
        } else {
            this.style.fill = "#FFF";
            App.activeCountry = abbr;
            alert(title);
        }
    },
    init: function() {
        console.log("Init");
        App.angle = 0;
        App.deltaX = 0;
        $.get('/static/data/world-110m.json',function(resp) {
            App.initMap(resp);
            /*
            setInterval(function() {
               App.renderMap((App.angle+=0.5)/3);
            },15);
            */
            $('#map')
                .on('mousedown',function() {
                    App.dragging = true;
                })
                .on('mouseup',function() {
                    App.dragging = false;
                    App.lastX = null;
                })
                .on('mousemove',function(e) {
                    if(App.dragging) {
                        //$('#map svg g').empty();
                        if(App.lastX) {
                            App.deltaX = e.clientX - App.lastX;
                            App.lastX = e.clientX;
                            console.log(App.deltaX);
                            App.angle += App.deltaX;
                        } else {
                            App.deltaX = 0;
                            App.lastX = e.clientX;
                        }
                        App.renderMap(App.angle/3);
                    }
            });
        });
    }
}

$(App.init());
