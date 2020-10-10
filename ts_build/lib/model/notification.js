"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = __importDefault(require("lodash"));
var Notification = (function () {
    function Notification() {
    }
    Notification.create = function (opts) {
        opts = opts || {};
        var x = new Notification();
        x.version = '1.0.0';
        var now = Date.now();
        x.createdOn = Math.floor(now / 1000);
        x.id = lodash_1.default.padStart(now.toString(), 14, '0') + lodash_1.default.padStart(opts.ticker || 0, 4, '0');
        x.type = opts.type || 'general';
        x.data = opts.data;
        x.walletId = opts.walletId;
        x.creatorId = opts.creatorId;
        return x;
    };
    Notification.fromObj = function (obj) {
        var x = new Notification();
        x.version = obj.version;
        x.createdOn = obj.createdOn;
        x.id = obj.id;
        (x.type = obj.type), (x.data = obj.data);
        x.walletId = obj.walletId;
        x.creatorId = obj.creatorId;
        return x;
    };
    return Notification;
}());
exports.Notification = Notification;
//# sourceMappingURL=notification.js.map