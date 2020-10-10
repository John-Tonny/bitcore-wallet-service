"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var async = __importStar(require("async"));
var lodash_1 = __importDefault(require("lodash"));
var request = __importStar(require("request"));
var storage_1 = require("./storage");
var $ = require('preconditions').singleton();
var Common = require('./common');
var Defaults = Common.Defaults;
var logger_1 = __importDefault(require("./logger"));
var fiatCodes = {
    USD: 1,
    INR: 1,
    GBP: 1,
    EUR: 1,
    CAD: 1,
    COP: 1,
    NGN: 1,
    BRL: 1,
    ARS: 1,
    AUD: 1
};
var FiatRateService = (function () {
    function FiatRateService() {
    }
    FiatRateService.prototype.init = function (opts, cb) {
        var _this = this;
        opts = opts || {};
        this.request = opts.request || request;
        this.defaultProvider = opts.defaultProvider || Defaults.FIAT_RATE_PROVIDER;
        async.parallel([
            function (done) {
                if (opts.storage) {
                    _this.storage = opts.storage;
                    done();
                }
                else {
                    _this.storage = new storage_1.Storage();
                    _this.storage.connect(opts.storageOpts, done);
                }
            }
        ], function (err) {
            if (err) {
                logger_1.default.error(err);
            }
            return cb(err);
        });
    };
    FiatRateService.prototype.startCron = function (opts, cb) {
        var _this = this;
        opts = opts || {};
        this.providers = lodash_1.default.values(require('./fiatrateproviders'));
        var interval = opts.fetchInterval || Defaults.FIAT_RATE_FETCH_INTERVAL;
        if (interval) {
            this._fetch();
            setInterval(function () {
                _this._fetch();
            }, interval * 60 * 1000);
        }
        return cb();
    };
    FiatRateService.prototype._fetch = function (cb) {
        var _this = this;
        cb = cb || function () { };
        var coins = ['btc', 'bch', 'eth', 'vcl', 'xrp'];
        var provider = this.providers[0];
        async.each(coins, function (coin, next2) {
            _this._retrieve(provider, coin, function (err, res) {
                if (err) {
                    logger_1.default.warn('Error retrieving data for ' + provider.name + coin, err);
                    return next2();
                }
                _this.storage.storeFiatRate(coin, res, function (err) {
                    if (err) {
                        logger_1.default.warn('Error storing data for ' + provider.name, err);
                    }
                    return next2();
                });
            });
        }, cb);
    };
    FiatRateService.prototype._retrieve = function (provider, coin, cb) {
        logger_1.default.debug("Fetching data for " + provider.name + " / " + coin + " ");
        this.request.get({
            url: provider.url + coin.toUpperCase(),
            json: true
        }, function (err, res, body) {
            if (err || !body) {
                return cb(err);
            }
            logger_1.default.debug("Data for " + provider.name + " /  " + coin + " fetched successfully");
            if (!provider.parseFn) {
                return cb(new Error('No parse function for provider ' + provider.name));
            }
            try {
                var rates = lodash_1.default.filter(provider.parseFn(body), function (x) { return fiatCodes[x.code]; });
                return cb(null, rates);
            }
            catch (e) {
                return cb(e);
            }
        });
    };
    FiatRateService.prototype.getRate = function (opts, cb) {
        var _this = this;
        $.shouldBeFunction(cb);
        opts = opts || {};
        var now = Date.now();
        var coin = opts.coin || 'vcl';
        var ts = lodash_1.default.isNumber(opts.ts) || lodash_1.default.isArray(opts.ts) ? opts.ts : now;
        async.map([].concat(ts), function (ts, cb) {
            _this.storage.fetchFiatRate(coin, opts.code, ts, function (err, rate) {
                if (err)
                    return cb(err);
                if (rate && ts - rate.ts > Defaults.FIAT_RATE_MAX_LOOK_BACK_TIME * 60 * 1000)
                    rate = null;
                return cb(null, {
                    ts: +ts,
                    rate: rate ? rate.value : undefined,
                    fetchedOn: rate ? rate.ts : undefined
                });
            });
        }, function (err, res) {
            if (err)
                return cb(err);
            if (!lodash_1.default.isArray(ts))
                res = res[0];
            return cb(null, res);
        });
    };
    FiatRateService.prototype.getHistoricalRates = function (opts, cb) {
        var _this = this;
        $.shouldBeFunction(cb);
        opts = opts || {};
        var historicalRates = {};
        var now = Date.now() - Defaults.FIAT_RATE_FETCH_INTERVAL * 60 * 1000;
        var ts = lodash_1.default.isNumber(opts.ts) ? opts.ts : now;
        var coins = ['btc', 'bch', 'eth', 'vcl', 'xrp'];
        async.map(coins, function (coin, cb) {
            _this.storage.fetchHistoricalRates(coin, opts.code, ts, function (err, rates) {
                if (err)
                    return cb(err);
                if (!rates)
                    return cb();
                for (var _i = 0, rates_1 = rates; _i < rates_1.length; _i++) {
                    var rate = rates_1[_i];
                    rate.rate = rate.value;
                    delete rate['_id'];
                    delete rate['code'];
                    delete rate['value'];
                    delete rate['coin'];
                }
                historicalRates[coin] = rates;
                return cb(null, historicalRates);
            });
        }, function (err, res) {
            if (err)
                return cb(err);
            return cb(null, res[0]);
        });
    };
    return FiatRateService;
}());
exports.FiatRateService = FiatRateService;
//# sourceMappingURL=fiatrateservice.js.map