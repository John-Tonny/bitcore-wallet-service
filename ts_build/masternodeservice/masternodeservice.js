#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var logger_1 = __importDefault(require("../lib/logger"));
var config = require('../config');
var MasternodeService = require('../lib/masternodeservice');
var masternodeService = new MasternodeService();
masternodeService.init(config, function (err) {
    if (err)
        throw err;
    masternodeService.startCron(config, function (err) {
        if (err)
            throw err;
        logger_1.default.info('masternode service started');
    });
});
//# sourceMappingURL=masternodeservice.js.map