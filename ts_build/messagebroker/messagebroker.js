#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var socket_io_1 = __importDefault(require("socket.io"));
var logger_1 = __importDefault(require("../lib/logger"));
var DEFAULT_PORT = 3380;
var opts = {
    port: parseInt(process.argv[2]) || DEFAULT_PORT
};
var server = socket_io_1.default(opts.port.toString());
server.on('connection', function (socket) {
    socket.on('msg', function (data) {
        server.emit('msg', data);
    });
});
logger_1.default.info('Message broker server listening on port ' + opts.port);
//# sourceMappingURL=messagebroker.js.map