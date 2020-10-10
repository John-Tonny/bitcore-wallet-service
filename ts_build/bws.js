#!/usr/bin/env node
"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = __importStar(require("fs"));
require("source-map-support/register");
var logger_1 = __importDefault(require("./lib/logger"));
var expressapp_1 = require("./lib/expressapp");
var config = require('./config');
var port = process.env.BWS_PORT || config.port || 3232;
var cluster = require('cluster');
var serverModule = config.https ? require('https') : require('http');
var serverOpts = {};
if (config.https) {
    serverOpts.key = fs.readFileSync(config.privateKeyFile || './ssl/privatekey.pem');
    serverOpts.cert = fs.readFileSync(config.certificateFile || './ssl/certificate.pem');
    if (config.ciphers) {
        serverOpts.ciphers = config.ciphers;
        serverOpts.honorCipherOrder = true;
    }
    if (config.CAinter1 && config.CAinter2 && config.CAroot) {
        serverOpts.ca = [
            fs.readFileSync(config.CAinter1),
            fs.readFileSync(config.CAinter2),
            fs.readFileSync(config.CAroot)
        ];
    }
}
if (config.cluster && !config.lockOpts.lockerServer)
    throw new Error('When running in cluster mode, locker server need to be configured');
if (config.cluster && !config.messageBrokerOpts.messageBrokerServer)
    throw new Error('When running in cluster mode, message broker server need to be configured');
var expressApp = new expressapp_1.ExpressApp();
function startInstance() {
    var server = config.https
        ? serverModule.createServer(serverOpts, expressApp.app)
        : serverModule.Server(expressApp.app);
    expressApp.start(config, function (err) {
        if (err) {
            logger_1.default.error('Could not start BWS instance', err);
            return;
        }
        server.listen(port);
        var instanceInfo = cluster.worker ? ' [Instance:' + cluster.worker.id + ']' : '';
        logger_1.default.info('BWS running ' + instanceInfo);
        return;
    });
}
if (config.cluster && cluster.isMaster) {
    var instances = config.clusterInstances || require('os').cpus().length;
    logger_1.default.info('Starting ' + instances + ' instances');
    for (var i = 0; i < instances; i += 1) {
        cluster.fork();
    }
    cluster.on('exit', function (worker) {
        logger_1.default.error('Worker ' + worker.id + ' died :(');
        cluster.fork();
    });
}
else {
    logger_1.default.info('Listening on port: ' + port);
    startInstance();
}
//# sourceMappingURL=bws.js.map