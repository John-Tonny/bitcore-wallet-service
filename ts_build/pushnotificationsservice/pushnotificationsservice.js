#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var logger_1 = __importDefault(require("../lib/logger"));
var pushnotificationsservice_1 = require("../lib/pushnotificationsservice");
var config = require('../config');
var pushNotificationsService = new pushnotificationsservice_1.PushNotificationsService();
pushNotificationsService.start(config, function (err) {
    if (err)
        throw err;
    logger_1.default.info('Push Notification Service started');
});
//# sourceMappingURL=pushnotificationsservice.js.map