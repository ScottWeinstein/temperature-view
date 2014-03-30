'use strict';
var express = require('express');
var http = require('http');
var path = require('path');
var app = express();

var rootUrl = 'https://www.mytaglist.com/';
var mongoUrl = process.env.CUSTOMCONNSTR_MONGOLAB_URI || 'mongodb://127.0.0.1:27017/T';
var repo = require('./lib/repo')(mongoUrl);
var connTools = require('./lib/connectionTools')(rootUrl, repo);


// all environments
app.set('port', process.env.PORT || 3000);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);


if (app.get('env') === 'production') {
    app.use(express.static(path.join(__dirname + '/dist', '/')));
} else {
    app.use(express.errorHandler());
    app.use(express.static(path.join(__dirname + '/app', '/')));
}

app.get('/api/temps/:id', function(req, res) {
    repo.find({slaveId: +req.params.id}, {t:true,time:true, _id:false})
    .done(function(d) {
        res.json(d);
    }, function(err) {
        console.error(err);
        res.status(500);
    });
});

http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
    startTagWatcher();
    startNWSWatcher();
});


function pollAndPost() {
    return connTools.pollNextTagUpdate()
    .then(repo.upsertToMongo)
    .done(pollAndPost);
}

function startTagWatcher() {
    connTools.tagLogin()
    .done(pollAndPost);
}

function startNWSWatcher() {
    var min15 = 1000 * 60 * 15;
    connTools.updateNWS();
    setInterval(startNWSWatcher, min15);
}
