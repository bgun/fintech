var App = {
    initMap: function(geoJsonObj,r) {
        console.log("Init map");
        App.projection = d3.geo.orthographic()
            .scale(380)
            .clipAngle(-180)
            .rotate([r,0]);
            //.origin([-71.03,42.37])
            //.mode("orthographic")
            //.translate([400, 400]);

        //projection = projection.rotate([0,180,0]);
        App.svgGlobe = d3.select("#map svg")
        var globe = { type: "Sphere" };

        App.path = d3.geo.path()
            .projection(App.projection);

        App.svgGlobe.append("path")
            .datum(globe)
            .attr("class", "foreground")
            .attr("d", App.path);

        App.svgGlobe.append("g")
            .selectAll("path")
            .data(geoJsonObj.features)
            .enter().append("path")
            .attr("id", function(d,i) { return geoJsonObj.features[i].id; })
            .attr("title", function(d,i) { return geoJsonObj.features[i].properties.name; })
            .attr("class", "country")
            .attr("d", App.path)
            .on('click',App.handleClick)
            .on('mouseover',function(d,i) {
                this.style.fill = "#F00";
            })
            .on('mouseout',function(d,i) {
                this.style.fill = "#48C";
            })
    },
    renderMap: function(angle) {
        App.projection.rotate([angle,0,0]);
        App.svgGlobe.selectAll("path")
            .attr("d", App.path.projection(App.projection));
    },
    handleClick: function(d,i) {
        this.style.fill = "#FFF";
        var str = "";
        $('#map path').each(function() {
            str += '{"name":"'+$(this).attr('title')+'","abbr":"'+$(this).attr('id')+'"},';
        });
        console.log(str);
    },
    init: function() {
        console.log("Init");
        App.angle = 0;
        App.deltaX = 0;
        $.get('/static/data/countries.geo.json',function(resp) {
            App.initMap(resp,App.angle / 3);
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
