"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var winston = __importStar(require("winston"));
exports.transport = new winston.transports.Console({
    level: 'debug'
});
exports.logger = winston.createLogger({
    transports: [exports.transport]
});
var timezone = new Date()
    .toLocaleString('en-US', { timeZoneName: 'short' })
    .split(' ')
    .pop();
exports.formatTimestamp = function (date) {
    return date.getFullYear() + "-" + (date.getMonth() + 1).toString().padStart(2, '0') + "-" + date
        .getDate()
        .toString()
        .padStart(2, '0') + " " + date
        .getHours()
        .toString()
        .padStart(2, '0') + ":" + date
        .getMinutes()
        .toString()
        .padStart(2, '0') + ":" + date
        .getSeconds()
        .toString()
        .padStart(2, '0') + "." + date
        .getMilliseconds()
        .toString()
        .padEnd(3, '0');
};
exports.timestamp = function () { return exports.formatTimestamp(new Date()); };
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map