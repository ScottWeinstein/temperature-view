var request = require('request');
var fs = require('fs');
var Q = require('q');
var j = request.jar();
request = request.defaults({jar:j});
var xparse = Q.denodeify(require('xml2js').parseString);

module.exports = function(tagRoolUrl, repo) {
    'use strict';

    function qJSON(url, data) {
        var def = Q.defer();
        var opts = {
            url: url,
            json: true,
            body: data
        };
        request.post(opts, function(err, resp, body) {
            if (err) { def.reject(new Error(err)); } else { def.resolve(body); }
        });
        return def.promise;
    }

    function thenLog(x) {
        console.log(x);
        return x;
    }

    function qGet(url) {
        var def = Q.defer();
        request.get(url, function(err, resp, body) { def.resolve(body); });
        return def.promise;
    }
    function qPost(url) {
        var def = Q.defer();
        request.post(url, function(err, resp, body) { def.resolve(body); });
        return def.promise;
    }

    function getTempDataLogToMongo(ii, db) {
        return qJSON(tagRoolUrl + 'ethLogs.asmx/GetTemperatureRawData', {id: ii})
        .then(function(d) {
            return d.d.map(function(x) {
                return {
                    t: x.temp_degC,
                    time: new Date(x.date + ' 2014, ' + x.time),
                    cap: x.cap,
                    batteryVolt: x.battery_volts,
                    slaveId: ii,
                    kind: 'tagHistorical'
                };
            });
        })
        .then(function(rows) {
            console.log(ii, rows.length);
            return repo.bulkInsert(db, rows);
        });
    }

    function tagLogin() {
        var def = Q.defer();
        fs.createReadStream('tagPassword.json').pipe(request.post(tagRoolUrl + 'ethAccount.asmx/SignIn', function (e, r) {
            if (e) { def.reject(e); } else { def.resolve(r); }
        }));
        return def.promise;
    }

    function updateNWS() {
        qGet('http://w1.weather.gov/xml/current_obs/KNYC.xml')
        .then(xparse)
        .then(function(x) {
            var co = x.current_observation;
            var wc =  (co.windchill_c) ? co.windchill_c[0]: null;
            return {
                t: +co.temp_c[0],
                wc: +wc,
                time: new Date(co.observation_time_rfc822[0]),
                source: co.location[0],
                slaveId: 'nws',
                kind: 'nwsHistorical',
            };
        })
        .done(repo.upsertToMongo);
    }

    function pollNextTagUpdate() {
        var cometReqBody = '<?xml version="1.0" encoding="utf-8"?>' +
                            '<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">' +
                            '<soap:Body><GetNextUpdate xmlns="http://mytaglist.com/ethComet" /></soap:Body>' +
                            '</soap:Envelope>';

        return qPost({
            url: tagRoolUrl + 'ethComet.asmx?op=GetNextUpdate',
            headers: {
                'Content-Type': 'text/xml; charset="UTF-8"'
            },
            body: cometReqBody
        })
//        .then(thenLog)
        .then(xparse)
        .then(function(x) {
            return JSON.parse(x['soap:Envelope']['soap:Body'][0].GetNextUpdateResponse[0].GetNextUpdateResult);
        })
//        .then(thenLog)
        .then(function(d) {
            if (d.length) {
                var x = d[0];
                return {
                    t: x.temperature,
                    time: new Date(),
                    source: x.name,
                    tempCalOffset: x.tempCalOffset,
                    batteryRemaining: x.batteryRemaining,
                    slaveId: x.slaveId,
                    cap: x.cap,
                    batteryVolt: x.batteryVolt
                };
            }
        });
    }

    return {
        xparse: xparse,
        qJSON: qJSON,
        request: request,
        qGet: qGet,
        qPost: qPost,
        updateNWS: updateNWS,
        tagLogin: tagLogin,
        thenLog: thenLog,
        getTempDataLogToMongo: getTempDataLogToMongo,
        pollNextTagUpdate: pollNextTagUpdate
    };
};
