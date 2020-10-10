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
var _ = __importStar(require("lodash"));
var moment_1 = __importDefault(require("moment"));
var mongodb = __importStar(require("mongodb"));
var logger_1 = __importDefault(require("./logger"));
var config = require('../config');
var INITIAL_DATE = '2015-01-01';
var Stats = (function () {
    function Stats(opts) {
        opts = opts || {};
        this.network = opts.network || 'livenet';
        this.coin = opts.coin || 'btc';
        this.from = moment_1.default(opts.from || INITIAL_DATE).format('YYYY-MM-DD');
        this.to = moment_1.default(opts.to).format('YYYY-MM-DD');
    }
    Stats.prototype.run = function (cb) {
        var _this = this;
        var dbConfig = config.storageOpts.mongoDb;
        var uri = dbConfig.uri;
        uri = uri + 'readPreference=secondaryPreferred';
        console.log('Connected to ', uri);
        if (!dbConfig.dbname) {
            return cb(new Error('No dbname at config.'));
        }
        mongodb.MongoClient.connect(dbConfig.uri, { useUnifiedTopology: true }, function (err, client) {
            if (err) {
                return cb(err);
            }
            _this.db = client.db(dbConfig.dbname);
            _this.client = client;
            _this._getStats(function (err, stats) {
                if (err)
                    return cb(err);
                _this.client.close(function (err) {
                    if (err)
                        logger_1.default.error(err);
                    return cb(null, stats);
                });
            });
        });
    };
    Stats.prototype._getStats = function (cb) {
        var _this = this;
        var result = {};
        async.series([
            function (next) {
                _this._getNewWallets(next);
            },
            function (next) {
                _this._getTxProposals(next);
            },
            function (next) {
                _this._getFiatRates(next);
            }
        ], function (err, results) {
            if (err)
                return cb(err);
            result = { newWallets: results[0], txProposals: results[1], fiatRates: results[2] };
            return cb(null, result);
        });
    };
    Stats.prototype._getNewWallets = function (cb) {
        this.db
            .collection('stats_wallets')
            .find({
            '_id.network': this.network,
            '_id.coin': this.coin,
            '_id.day': {
                $gte: this.from,
                $lte: this.to
            }
        })
            .sort({
            '_id.day': 1
        })
            .toArray(function (err, results) {
            if (err)
                return cb(err);
            var stats = {
                byDay: _.map(results, function (record) {
                    var day = moment_1.default(record._id.day).format('YYYYMMDD');
                    return {
                        day: day,
                        coin: record._id.coin,
                        value: record._id.value,
                        count: record.count ? record.count : record.value.count
                    };
                })
            };
            return cb(null, stats);
        });
    };
    Stats.prototype._getFiatRates = function (cb) {
        this.db
            .collection('stats_fiat_rates')
            .find({
            '_id.coin': this.coin,
            '_id.day': {
                $gte: this.from,
                $lte: this.to
            }
        })
            .sort({
            '_id.day': 1
        })
            .toArray(function (err, results) {
            if (err)
                return cb(err);
            var stats = {
                byDay: _.map(results, function (record) {
                    var day = moment_1.default(record._id.day).format('YYYYMMDD');
                    return {
                        day: day,
                        coin: record._id.coin,
                        value: record.value
                    };
                })
            };
            return cb(null, stats);
        });
    };
    Stats.prototype._getTxProposals = function (cb) {
        this.db
            .collection('stats_txps')
            .find({
            '_id.network': this.network,
            '_id.coin': this.coin,
            '_id.day': {
                $gte: this.from,
                $lte: this.to
            }
        })
            .sort({
            '_id.day': 1
        })
            .toArray(function (err, results) {
            if (err)
                return cb(err);
            var stats = {
                nbByDay: [],
                amountByDay: []
            };
            _.each(results, function (record) {
                var day = moment_1.default(record._id.day).format('YYYYMMDD');
                stats.nbByDay.push({
                    day: day,
                    coin: record._id.coin,
                    count: record.count ? record.count : record.value.count
                });
                stats.amountByDay.push({
                    day: day,
                    amount: record.amount ? record.amount : record.value.amount
                });
            });
            return cb(null, stats);
        });
    };
    return Stats;
}());
exports.Stats = Stats;
//# sourceMappingURL=stats.js.map