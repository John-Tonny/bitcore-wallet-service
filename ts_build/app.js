#!/usr/bin/env node
var spawn = require('child_process').spawn;
var async = require('async');
var scripts = [
    'locker/locker.js',
    'messagebroker/messagebroker.js',
    'bcmonitor/bcmonitor.js',
    'emailservice/emailservice.js',
    'masternodeservice/masternodeservice.js',
    'pushnotificationsservice/pushnotificationsservice.js',
    'fiatrateservice/fiatrateservice.js',
    'bws.js'
];
async.eachSeries(scripts, function (script, callback) {
    console.log("Spawning " + script);
    var node = spawn('node', [script]);
    node.stdout.on('data', function (data) {
        console.log("" + data);
    });
    node.stderr.on('data', function (data) {
        console.error("" + data);
    });
    callback();
});
//# sourceMappingURL=app.js.map