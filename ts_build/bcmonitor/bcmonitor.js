#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var blockchainmonitor_1 = require("../lib/blockchainmonitor");
var logger_1 = __importDefault(require("../lib/logger"));
var config = require('../config');
var bcm = new blockchainmonitor_1.BlockchainMonitor();
bcm.start(config, function (err) {
    if (err)
        throw err;
    logger_1.default.info('Blockchain monitor started');
});
//# sourceMappingURL=bcmonitor.js.map