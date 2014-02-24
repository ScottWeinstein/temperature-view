(function() {
    d3.spark = function () {

        var width = 100;
        var height = 25;
        //var parseDate = d3.time.format("%b %d, %Y").parse;

        function spark(selection) {
            selection.each(function(data, i) {
                var sel = d3.select(this);
                var x = d3.scale.linear().range([0, width - 2]).clamp(true);
                var y = d3.scale.linear().range([height - 4, 0]).clamp(true);
                var line = d3.svg.line()
                    //.interpolate("basis")
                    .x(function(d, i) { return x(i); })
                    .y(function(d) { return y(d); });

                  // data.forEach(function(d) {
                  //   d.date = parseDate(d.Date);
                  //   d.close = +d.Close;
                  // });
                  x.domain(d3.extent(data, function(d, i) { return i; }));
                  y.domain(d3.extent(data, function(d) { return d; }));

                  //console.log(y.domain())

                  var svg = sel
                              .append('svg')
                              .attr('width', width)
                              .attr('height', height)
                              .append('g')
                              .attr('transform', 'translate(0, 2)');
                  svg.append('path')
                     .attr('class', 'sparkline')
                     .attr('d', line);
                  svg.append('circle')
                     .attr('class', 'sparkcircle')
                     .attr('cx', x(0)) //data[0].date
                     .attr('cy', y(data[0]))
                     .attr('r', 1.5);

            })
        }
        spark.width = function(x) {
            if (!arguments.length) return width;
            width = x;
            return box;
        };

      spark.height = function(x) {
        if (!arguments.length) return height;
        height = x;
        return box;
      };

      return spark;
    };
})();
