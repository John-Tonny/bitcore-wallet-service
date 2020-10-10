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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = require("events");
require("source-map-support/register");
var logger_1 = __importDefault(require("./logger"));
var MessageBroker = (function (_super) {
    __extends(MessageBroker, _super);
    function MessageBroker(opts) {
        var _this = _super.call(this) || this;
        opts = opts || {};
        if (opts.messageBrokerServer) {
            var url_1 = opts.messageBrokerServer.url;
            _this.remote = true;
            _this.mq = require('socket.io-client').connect(url_1);
            _this.mq.on('connect', function () { });
            _this.mq.on('connect_error', function () {
                logger_1.default.warn('Error connecting to message broker server @ ' + url_1);
            });
            _this.mq.on('msg', function (data) {
                _this.emit('msg', data);
            });
            logger_1.default.info('Using message broker server at ' + url_1);
        }
        return _this;
    }
    MessageBroker.prototype.send = function (data) {
        if (this.remote) {
            this.mq.emit('msg', data);
        }
        else {
            this.emit('msg', data);
        }
    };
    MessageBroker.prototype.onMessage = function (handler) {
        this.on('msg', handler);
    };
    return MessageBroker;
}(events_1.EventEmitter));
exports.MessageBroker = MessageBroker;
//# sourceMappingURL=messagebroker.js.map