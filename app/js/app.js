var app = (function() {

    'use strict';
    var useFakeData = 1;

    $.ajaxSetup({
        type: "POST",
        contentType: "application/json; charset=utf-8",
        data: "{}",
        dataType: "json",
        xhrFields: {
            withCredentials: true
        },
        error: function (xhr, textStatus, exception) {
            console.error(textStatus, exception, xhr.responseText);
        }
    });

    var margin = {top: 5, right: 20, bottom: 5, left: 20},
    width = 80 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

    var min = Infinity,
        max = -Infinity;

    var chart = d3.box()
        .whiskers(iqr(1.5))
        .width(width)
        .height(height);

    var spark = d3.spark();


    // Returns a function to compute the interquartile range.
    function iqr(k) {
      return function(d, i) {
        var q1 = d.quartiles[0],
            q3 = d.quartiles[2],
            iqr = (q3 - q1) * k,
            i = -1,
            j = d.length;
        while (d[++i] < q1 - iqr);
        while (d[--j] > q3 + iqr);
        return [i, j];
      };
    }

    return {
        signIn: function() {
            var loginData = {};
            return $.post('https://www.mytaglist.com/ethAccount.asmx/SignIn', JSON.stringify(loginData))
        },

        getData: function (id) {
            var dateFormat = d3.time.format("%Y%m%d");
            var timeFormat = d3.time.format("%H%M%S");
            var qry;
            if (useFakeData) {
                qry = $.get('/js/savedData.json');
            } else {
                qry = $.post('https://www.mytaglist.com/ethLogs.asmx/GetTemperatureRawData', JSON.stringify({id:id}));
            }

            return Q(qry)
                    .then(function(networkData) {
                        var csv = networkData.d.map(function(item) {
                            var date = new Date(item.date + ', 2014 ' + item.time);
                            var day = +dateFormat(date);
                            var time = +timeFormat(date);
                            return {
                                date: date,
                                day: day,
                                time: time,
                                t: (item.temp_degC * 9 /5) + 32,
                                nightDay: time < 63000
                            };
                        })
                        .filter(function(item) { return item.day != 20140216 || (item.t >= 60 && item.t <= 80); });
                        //.filter(function(item) { return item.day === 20140217; });
                        return csv;
                    });
        },

        plot: function() {
            this.getData(0)
            .done(function(csv) {
                var data = [];
                var start = csv[0].day;
                csv.forEach(function(x) {
                    var e = x.day - start,
                        r = x.time,
                        s = x.t,
                        d = data[e];
                    if (!d) {
                        d = data[e] = {
                            d: x,
                            box: [s],
                            all: [x]
                        };
                    } else {
                        d.box.push(s);
                        d.all.push(x);
                    }
                    if (s > max) max = s;
                    if (s < min) min = s;
                });
                chart.domain([min, max]);

                data.forEach(function(d) {
                    d.spark = [];
                    var qtr = [];
                    d.all.forEach(function(m) {
                        if (m.time % 15 === 0 && qtr.length > 0) {
                            d.spark.push(d3.mean(qtr));
                            qtr = [];
                        } else {
                            qtr.push(m.t);
                        }
                    });
                });

                //console.log(min, max, data)
                console.log(data[0].spark)

                var els = d3.select("ul").selectAll("li")
                .data(data.reverse())
                .enter()
                .append('li')
                .call(function addHeader(sel) {
                    var h6 = sel
                        .append('h6')
                    h6.append('span').text(function(di) { return di.d.day + ' (' + di.box.length + ')';})

                    h6.append('div').datum(function(d) { return (d.spark && d.spark.length > 5) ? d.spark : d.box; })
                    .call(spark)
                })
                .append("svg")
                .datum(function(di) { return di.box; })
                    .attr("class", "box")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.bottom + margin.top)
                .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                    .call(chart);

            });
        }
    }
})();

(function() {

    'use strict';
    $(document).foundation();
    app.plot();

})();
