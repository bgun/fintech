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

    // DOM cache
    var $tooltip    = $('#tooltip');
    var $fps        = $('#fps');
    var $sidebar    = $('#sidebar');
    var $loader     = $('#loader');
    var $prevButton = $sidebar.find('#prev');
    var $nextButton = $sidebar.find('#next');
    var $playButton = $sidebar.find('#play');
    var $startDate  = $sidebar.find('#startdate');
    var $endDate    = $sidebar.find('#enddate');

    var width, height;
    var curIndex = 0;
    var curCountry;
    var curData;
    var playing = false;

    var datePickerOptions = {
      format: 'yyyy-mm-dd'
    }

    var color = {
      selected: "cyan",
      positive: "#22AA21",
      negative: "#AA2121"
    };

    function getSize() {
      width = $('#map').width();
      height = $('#map').height();
      init();
    }
    function log(message) {
      //console.log(message);
    }

    $startDate.datepicker(datePickerOptions);
    $startDate.focus(function(e) {
      e.preventDefault();
      pause();
      var $t = $(this);
      $t.datepicker('show').on('changeDate',function(e) {
        $t.datepicker('hide');
        $endDate.datepicker('show');
      });
    });
    $endDate.datepicker(datePickerOptions);
    $endDate.focus(function(e) {
      e.preventDefault();
      pause();
      var $t = $(this);
      $t.datepicker('show').on('changeDate',function(e) {
        $t.datepicker('hide');
      });
    });
    $prevButton.click(function(e) {
      e.preventDefault();
      pause();
      curIndex -= 1;
      renderData();
    });
    $nextButton.click(function(e) {
      e.preventDefault();
      pause();
      log("next: "+curIndex);
      curIndex += 1;
      renderData();
    });
    $playButton.click(function(e) {
      e.preventDefault();
      if(playing) {
        pause();
      } else {
        play();
      }
      renderData();
    });

    $(document).on('keyup',function(e) {
      if(e.keyCode == 32) {
        if(playing) {
          pause();
        } else {
          play();
        }
        renderData();
      }
    });

    function play() {
      log("play");
      playing = true;
      $playButton.find('span').text('pause');
      $playButton.find('i').removeClass('icon-play').addClass('icon-pause');
    }

    function pause() {
      log("pause");
      playing = false;
      $playButton.find('span').text('play');
      $playButton.find('i').removeClass('icon-pause').addClass('icon-play');
    }

    function handleClick(d,i) {
        //$sidebar.find('.content').append("<p>"+d.properties.currency+","+d.properties.name+"</p>");
        $('path').attr('style','');
        curCountry = d.properties;
        if(curCountry.currency) {
            d3.selectAll('.currency-'+curCountry.currency).transition().style('fill',color.selected);
        }
        log(d.properties);
        sd = $startDate.val();
        ed = $endDate.val();
        log(sd);
        log(ed);
        $loader.show();
        $.ajax({
            url: '/api/'+curCountry.currency,
            type: 'GET',
            data: {
                startdate: sd,
                enddate: ed
            },
            success: function(resp) {
                exploreCurrency(curCountry,resp.results.reverse());
                $loader.hide();
            },
            error: function(jqXhr, textStatus, errorThrown) {
                toastr.error(textStatus);
                $loader.hide();
            }
        });
    }

    function exploreCurrency(props,data) {
        log("Exploring "+data.length+" days: "+props.currency);
        curData = data;
        if(curData.length) {
            toastr.success("Loaded "+curData.length+" days for "+props.name+" ("+props.currency+")");
            $sidebar.find('h1').text(props.name+" ("+props.currency+")");
            curIndex = 0;
            // calculate deltas
            for(var d in curData) {
                //log(d);
                for(var f in curData[d].forex) {
                    if(d == 0) {
                        curData[d].forex[f].delta = 1;
                    } else {
                        curData[d].forex[f].delta = curData[d-1].forex[f].delta;
                        curData[d].forex[f].delta *= 1+((curData[d].forex[f].val - curData[d-1].forex[f].val) / curData[d-1].forex[f].val);
                    }
                }
            }
            renderData();
        } else {
            toastr.error("No data found for "+props.currency);
        }
    }

    function renderData(index) {
        if(index) {
            curIndex = index;
        }
        log("render: "+curIndex);
        if(curIndex < 0 || curIndex >= curData.length) {
          pause();
        } else {
            $sidebar.find('h3').text("Now showing: "+curData[curIndex].date);

            // animate
            if(playing) {
                setTimeout(function() {
                    renderData(curIndex+1);
                },300);
            }
            _.each(curData[curIndex].forex,function(item,i) {
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
                    d3.selectAll('.currency-'+item.curr).transition().style('fill',"rgb("+color/5+","+color+","+color/5+")");
                } else {
                    color = (1-item.delta) * 255;
                    color *= 10;
                    d3.selectAll('.currency-'+item.curr).transition().style('fill',"rgb("+color+","+color/5+","+color/5+")");
                }
            });
        }
    }

    function init() {

        log("Init");

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
        log(projection.origin());
        var zoom = d3.behavior.zoom(true)
            .translate(projection.origin())
            .scale(projection.scale())
            .scaleExtent([100, 800])
            .on("zoom", move);

        var circle = d3.geo.greatCircle();

        log(height);

        var svg = d3.select("#map").append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
                .call(zoom)
                .on("dblclick.zoom", null);

        log(svg);

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

            log("Loaded!");
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
                //log("Redrew "+count+" features");
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
