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
    var $playButton = $sidebar.find('#play');
    var $tooltip = $('#tooltip');
    var width, height;
    var curIndex = 0;
    var curCountry;
    var curData;
    var playing = false;

    var color = {
        selected: "#2121BB",
        positive: "#22AA21",
        negative: "#AA2121"
    };

    function getSize() {
        width = $('#map').width();
        height = $('#map').height();
        init();
    }

    $prevButton.click(function(e) {
        e.preventDefault();
        curIndex -= 1;
        renderData();
    });
    $nextButton.click(function(e) {
        e.preventDefault();
        console.log("next: "+curIndex);
        curIndex += 1;
        renderData();
    });
    $playButton.click(function(e) {
        e.preventDefault();
        if(playing) {
            $(this).find('span').text('play');
            $(this).find('i').removeClass('icon-pause').addClass('icon-play');
            playing = false;
        } else {
            $(this).find('span').text('pause');
            $(this).find('i').removeClass('icon-play').addClass('icon-pause');
            playing = true;
        }
        renderData();
    });

    function handleClick(d,i) {
        //$sidebar.find('.content').append("<p>"+d.properties.currency+","+d.properties.name+"</p>");
        $('path').attr('style','');
        curCountry = d.properties;
        if(curCountry.currency) {
            d3.selectAll('.currency-'+curCountry.currency).transition().style('fill',color.selected);
        }
        console.log(d.properties);
        $.ajax({
            url: '/api/'+curCountry.currency,
            type: 'GET',
            data: {
                startdate: '2012-01-05',
                enddate: '2012-04-05'
            },
            success: function(resp) {
                exploreCurrency(curCountry,resp.results);
            },
            error: function(jqXhr, textStatus, errorThrown) {
                toastr.error(textStatus);
            }
        });
    }

    function exploreCurrency(props,data) {
        console.log("Exploring "+data.length+" days: "+props.currency);
        if(data.length) {
            toastr.success("Now showing "+props.name+" ("+props.currency+")");
            $sidebar.find('h1').text(props.name+" ("+props.currency+")");
            curIndex = data.length-1;
            curData = data;
            for(var d in curData) {
                console.log(d);
                d = data.length - 1 - d;
                for(var f in curData[d].forex) {
                    if(d == data.length-1) {
                        curData[d].forex[f].delta = 1;
                    } else {
                        curData[d].forex[f].delta = curData[d+1].forex[f].delta;
                        curData[d].forex[f].delta *= 1+((curData[d].forex[f].val - curData[d+1].forex[f].val) / curData[d+1].forex[f].val);
                    }
                }
            }
            renderData();
        } else {
            toastr.error("No data found for "+props.currency);
        }
    }

    function renderData(index) {
        console.log("render");
        var data = curData;
        if(index) {
            curIndex = index;
        }
        if(curIndex < 0 || curIndex >= curData.length) {
            $playButton.trigger('click');
        } else {
            console.log(curIndex);
            $sidebar.find('h3').text(curData[curIndex].date+" to "+curData[curIndex-1].date);

            if(playing) {
                setTimeout(function() {
                    renderData(curIndex-1);
                },300);
            }
            _.each(data[curIndex].forex,function(item,i) {
                /*
                // show red/green for positive or negative change since previous day
                var delta = item.val - curData[curIndex-1].forex[i].val;
                if(delta > 0) {
                    d3.selectAll('.currency-'+item.curr).transition().style('fill',color.negative);
                } else {
                    d3.selectAll('.currency-'+item.curr).transition().style('fill',color.positive);
                }
                */
                var color = "";
                if(item.delta >= 1) {
                    color = (item.delta-1) * 255;
                    color *= 10;
                    d3.selectAll('.currency-'+item.curr).transition().style('fill',"rgb(0,"+color+",0)");
                } else {
                    color = (1-item.delta) * 255;
                    color *= 10;
                    d3.selectAll('.currency-'+item.curr).transition().style('fill',"rgb("+color+",0,0)");
                }
            });
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
                .on('mouseover',function(d,i) {
                    autospin = false;
                    $tooltip.html(d.properties.name+" ("+d.properties.currency+")").show();
                })
                .on('mouseout',function(d,i) {
                    autospin = true;
                    $tooltip.hide();
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
                    autoangle = autoangle + (timedelta*15);
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
                $fps.text("fps: "+Math.floor(fps));
            }

            if(autospin) {
                move();
            }
        }
        animloop();

        $('#map').on('mousemove',function(e) {
            $tooltip.css({
                top: e.clientY-15,
                left: e.clientX+5,
            });
        });
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
