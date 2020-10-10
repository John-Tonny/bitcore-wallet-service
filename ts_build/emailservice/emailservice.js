#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var logger_1 = __importDefault(require("../lib/logger"));
var config = require('../config');
var EmailService = require('../lib/emailservice');
var emailService = new EmailService();
emailService.start(config, function (err) {
    if (err)
        throw err;
    logger_1.default.info('Email service started');
});
//# sourceMappingURL=emailservice.js.map