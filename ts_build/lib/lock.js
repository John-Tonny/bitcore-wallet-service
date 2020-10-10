"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = __importDefault(require("lodash"));
var $ = require('preconditions').singleton();
var Common = require('./common');
var Defaults = Common.Defaults;
var Errors = require('./errors/errordefinitions');
var ACQUIRE_RETRY_STEP = 50;
var Lock = (function () {
    function Lock(storage, opts) {
        if (opts === void 0) { opts = {}; }
        opts = opts || {};
        this.storage = storage;
    }
    Lock.prototype.acquire = function (token, opts, cb, timeLeft) {
        var _this = this;
        opts = opts || {};
        opts.lockTime = opts.lockTime || Defaults.LOCK_EXE_TIME;
        this.storage.acquireLock(token, Date.now() + opts.lockTime, function (err) {
            if (err && err.message && err.message.indexOf('E11000 ') !== -1) {
                _this.storage.clearExpiredLock(token, function () { });
                if (timeLeft < 0) {
                    return cb('LOCKED');
                }
                if (!lodash_1.default.isUndefined(opts.waitTime)) {
                    if (lodash_1.default.isUndefined(timeLeft)) {
                        timeLeft = opts.waitTime;
                    }
                    else {
                        timeLeft -= ACQUIRE_RETRY_STEP;
                    }
                }
                return setTimeout(_this.acquire.bind(_this, token, opts, cb, timeLeft), ACQUIRE_RETRY_STEP);
            }
            else if (err) {
                return cb(err);
            }
            else {
                return cb(null, function (icb) {
                    if (!icb)
                        icb = function () { };
                    _this.storage.releaseLock(token, icb);
                });
            }
        });
    };
    Lock.prototype.runLocked = function (token, opts, cb, task) {
        $.shouldBeDefined(token);
        this.acquire(token, opts, function (err, release) {
            if (err == 'LOCKED')
                return cb(Errors.WALLET_BUSY);
            if (err)
                return cb(err);
            var _cb = function () {
                cb.apply(null, arguments);
                release();
            };
            task(_cb);
        });
    };
    return Lock;
}());
exports.Lock = Lock;
//# sourceMappingURL=lock.js.map