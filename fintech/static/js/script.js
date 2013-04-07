// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

$(function() {

    var $fps = $('#fps');
    var $sidebar = $('#sidebar');
    var $prevButton = $sidebar.find('#prev');
    var $nextButton = $sidebar.find('#next');
    var width, height;
    var curIndex = 0;

    var color = {
        selected: "white",
        positive: "green",
        negative: "red"
    };

    function getSize(){
        width = $('#map').width();
        height = $('#map').height();
        init();
    }

    function handleClick(d,i) {
        $sidebar.find('.content').append("<p>"+d.properties.currency+","+d.properties.name+"</p>");
        $('path').attr('style','');
        if(d.properties.currency) {
            d3.selectAll('.currency-'+d.properties.currency).transition().style('fill','#FFF');
        }
        console.log(d.properties);
        $.ajax({
            url: '/api/'+d.properties.currency,
            type: 'GET',
            data: {
                startdate: '2012-03-05',
                enddate: '2012-04-05'
            },
            success: function(resp) {
                exploreCurrency(d.properties.currency,resp.results);
                toastr.success("Now showing "+d.properties.name+"("+d.properties.currency+")");
            },
            error: function(jqXhr, textStatus, errorThrown) {
                toastr.error(textStatus);
            }
        });
    }

    function exploreCurrency(curr,data) {
        console.log("Exploring: "+curr);
        console.log(data);
        $sidebar.find('h1').text(curr);
        curIndex = 1;
        renderDelta(data,curIndex);
        $prevButton.click(function(e) {
            e.preventDefault();
            console.log(curIndex);
            renderDelta(data,curIndex-1);
        });
        $nextButton.click(function(e) {
            e.preventDefault();
            console.log(curIndex);
            renderDelta(data,curIndex+1);
        });
    }

    function renderDelta(data, index) {
        curIndex = index;
        console.log(curIndex);
        $sidebar.find('h3').text(data[index-1].date+" to "+data[index].date);
        _.each(data[index].forex,function(item,i) {
            var delta = item.val - data[index-1].forex[i].val;
            if(delta > 0) {
                d3.selectAll('.currency-'+item.curr).transition().style('fill','#F00');
            } else {
                d3.selectAll('.currency-'+item.curr).transition().style('fill','#0F0');
            }
        });
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
            if(features) {
                var d = features.attr("d");
                var count = 0;
                features.attr("d", function(d){
                    var clip = path(circle.clip(d));
                    if(clip) {
                        count++;
                        return clip;
                    } else {
                        return "M 0 0";
                    }
                });
                //console.log("Redrew "+count+" features");
            }
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
                    autoangle = autoangle + (timedelta*10);
                    var origin = [autoangle, 15];// d3.event.translate[1]];
                    
                    circle.origin(origin);
                    projection.origin(origin).scale(autoscale);
                    //backgroundCircle.attr('r', autoscale);
                    //path.pointRadius(2 * autoscale / scale0);

                    redraw();
                }
            }
        }

        function randomLonLat(){
            return [Math.random() * 360 - 180, Math.random() * 180 - 90];
        }

        var lastCalledTime;
        var fps;
        var timedelta;

        function animloop() {
            window.requestAnimFrame(animloop);

            if(!lastCalledTime) {
                lastCalledTime = new Date().getTime();
                fps = 0;
                return;
            } else {
                timedelta = (new Date().getTime() - lastCalledTime)/1000;
                lastCalledTime = new Date().getTime();
                fps = 1/timedelta;
                $fps.text(Math.floor(fps));
            }

            if(autospin) {
                move();
            }
        }
        animloop();
    }

    toastr.options = {
      "positionClass": "toast-bottom-left",
      "fadeIn": 300,
      "fadeOut": 1000,
      "timeOut": 2000,
      "extendedTimeOut": 1000
    }

    getSize();

});
