"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = require("events");
var _instance;
var NotificationBroadcaster = (function (_super) {
    __extends(NotificationBroadcaster, _super);
    function NotificationBroadcaster() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    NotificationBroadcaster.prototype.broadcast = function (eventName, notification, walletService) {
        this.emit(eventName, notification, walletService);
    };
    NotificationBroadcaster.singleton = function () {
        if (!_instance) {
            _instance = new NotificationBroadcaster();
        }
        return _instance;
    };
    return NotificationBroadcaster;
}(events_1.EventEmitter));
exports.NotificationBroadcaster = NotificationBroadcaster;
module.exports = NotificationBroadcaster.singleton();
//# sourceMappingURL=notificationbroadcaster.js.map