#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var logger_1 = __importDefault(require("../lib/logger"));
var config = require('../config');
var fiatrateservice_1 = require("../lib/fiatrateservice");
var service = new fiatrateservice_1.FiatRateService();
service.init(config, function (err) {
    if (err)
        throw err;
    service.startCron(config, function (err) {
        if (err)
            throw err;
        logger_1.default.info('Fiat rate service started');
    });
});
//# sourceMappingURL=fiatrateservice.js.map