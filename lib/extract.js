'use strict';
var rootUrl = 'https://www.mytaglist.com/';
var mongoUrl = 'mongodb://127.0.0.1:27017/T';
var repo = require('./repo')(mongoUrl);
var connTools = require('./connectionTools')(rootUrl, repo);
var Q = require('q');

repo.connect()
    .then(function(db) {
        repo.removeAll(db);
        return connTools.tagLogin()
        .then(function() {
            var items = [];
            for (var ii = 0; ii < 6; ii++) {
                items.push(connTools.getTempDataLogToMongo(ii, db));
            }
            return Q.all(items);
        })
        .then(function() { db.close(); });
    })
    .done(console.log, console.error);
