var MongoClient = require('mongodb').MongoClient;
var Q = require('q');
var qMCConnect = Q.denodeify(MongoClient.connect);


module.exports = function(mongoUrl) {
    'use strict';

    var doUpsert = {upsert: true};
    function makeUpserKey(data) {
        return {
                time: data.time,
                source: data.source
            };
    }
    function makeErrorHandler(dbc) {
        return function(err) {
            if(err) {
                throw err;
            }
            if (dbc) {
                dbc.close();
            }
        };
    }

    function upsertToMongo(data) {
        var def = Q.defer();
        if (!data) {
            def.resolve();
            return def.promise;
        }

        process.stdout.write('.');
        return qMCConnect(mongoUrl)
        .then(function(db) {
            db.collection('temps').update(makeUpserKey(data), data, doUpsert, makeMongoQResolver);

            return def.promise.done(function() {
                db.close();
            });
        });
    }

    function upsertToMongoWithConnection(db, data) {
        return db.collection('temps').update(makeUpserKey(data), data, doUpsert, makeErrorHandler());
    }

    function connect() {
        return qMCConnect(mongoUrl);
    }
    function makeMongoQResolver(def) {
        return function(err, doc) {
            if (err) {
                def.reject(err);
            } else {
                def.resolve(doc);
            }
        };
    }

    function bulkInsert(db, rows) {
        var def = Q.defer();
        db.collection('temps').insert(rows, makeMongoQResolver(def));
        return def.promise;
    }

    function removeAll(db) {
        return db.collection('temps').remove(makeErrorHandler);
    }

    function findConnected(db, qry, projection) {
        var def = Q.defer();
        db.collection('temps').find(qry, projection).toArray(makeMongoQResolver(def));
        return def.promise;
    }

    function find(qry, projection) {
        return connect()
                .then(function(db) {
                    return findConnected(db, qry, projection)
                    .then(function(data) {
                            db.close();
                            return data;
                        });
                });
    }

    return {
        upsertToMongo: upsertToMongo,
        connect: connect,
        upsertToMongoWithConnection: upsertToMongoWithConnection,
        bulkInsert: bulkInsert,
        removeAll: removeAll,
        close: function(db) { db.close(); },
        find: find,
    };
};
