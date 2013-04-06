$(function() {

var width = 960,
    height = 500;

var projection = d3.geo.orthographic()
    .scale(248)
    .clipAngle(90);

var canvas = d3.select("#map")
    .attr("width", width)
    .attr("height", height);
console.log(canvas);
var c = canvas.node().getContext("2d");

var path = d3.geo.path()
    .projection(projection)
    .context(c);

var title = d3.select("h1");

queue()
    .defer(d3.json, "/static/data/world-110m.json")
    .defer(d3.tsv, "/static/data/world-country-names.tsv")
    .await(ready);

function ready(error, world, names) {
  var globe = {type: "Sphere"},
      land = topojson.object(world, world.objects.land),
      countries = topojson.object(world, world.objects.countries).geometries,
      borders = topojson.mesh(world, world.objects.countries, function(a, b) { return a.id !== b.id; }),
      i = -1,
      n = countries.length;

  countries = countries.filter(function(d) {
    return names.some(function(n) {
      if (d.id == n.id) return d.name = n.name;
    });
  }).sort(function(a, b) {
    return a.name.localeCompare(b.name);
  });

  (function transition() {
    d3.transition()
        .duration(1250)
        .each("start", function() {
          title.text(countries[i = (i + 1) % n].name);
        })
        .tween("rotate", function() {
          var p = d3.geo.centroid(countries[i]),
              r = d3.interpolate(projection.rotate(), [-p[0], -p[1]]);
          return function(t) {
            projection.rotate(r(t));
            c.clearRect(0, 0, width, height);
            c.fillStyle = "#bbb", c.beginPath(), path(land), c.fill();
            c.fillStyle = "#f00", c.beginPath(), path(countries[i]), c.fill();
            c.strokeStyle = "#fff", c.lineWidth = .5, c.beginPath(), path(borders), c.stroke();
            c.strokeStyle = "#000", c.lineWidth = 2, c.beginPath(), path(globe), c.stroke();
          };
        })
      .transition()
        .each("end", transition);
  })();
}

});
