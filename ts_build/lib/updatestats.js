"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var async = __importStar(require("async"));
var mongodb = __importStar(require("mongodb"));
var ObjectID = mongodb.ObjectID;
var storage = require('./storage');
var LAST_DAY = '2019-12-01';
var objectIdFromDate = function (date) {
    return Math.floor(date.getTime() / 1000).toString(16) + '0000000000000000';
};
var UpdateStats = (function () {
    function UpdateStats() {
    }
    UpdateStats.prototype.run = function (config, cb) {
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
            _this.updateStats(function (err, stats) {
                if (err)
                    return cb(err);
                return cb(null, stats);
            });
        });
    };
    UpdateStats.prototype.updateStats = function (cb) {
        var _this = this;
        async.series([
            function (next) {
                console.log('## Updating new wallets stats...');
                _this._updateNewWallets(next);
            },
            function (next) {
                console.log('## Updating tx proposals stats...');
                _this._updateTxProposals(next);
            },
            function (next) {
                console.log('## Updating fiat rates stats...');
                _this._updateFiatRates(next);
            }
        ], function (err) {
            return _this.client.close(cb);
        });
    };
    UpdateStats.prototype._updateNewWallets = function (cb) {
        return __awaiter(this, void 0, void 0, function () {
            var lastDay, od;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.lastRun('stats_wallets')];
                    case 1:
                        lastDay = _a.sent();
                        od = objectIdFromDate(new Date(lastDay));
                        this.db
                            .collection(storage.Storage.collections.WALLETS)
                            .aggregate([
                            {
                                $match: {
                                    _id: { $gt: new ObjectID(od) }
                                }
                            },
                            {
                                $project: {
                                    date: { $add: [new Date(0), { $multiply: ['$createdOn', 1000] }] },
                                    network: '$network',
                                    coin: '$coin'
                                }
                            },
                            {
                                $group: {
                                    _id: {
                                        day: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                                        network: '$network',
                                        coin: '$coin'
                                    },
                                    count: { $sum: 1 }
                                }
                            }
                        ])
                            .toArray(function (err, res) { return __awaiter(_this, void 0, void 0, function () {
                            var err_1;
                            var _this = this;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (err) {
                                            console.log('Update wallet stats throws error:', err);
                                            return [2, cb(err)];
                                        }
                                        if (!(res.length !== 0)) return [3, 7];
                                        _a.label = 1;
                                    case 1:
                                        _a.trys.push([1, 5, , 6]);
                                        console.log('\tChecking if stats_wallets table exist.');
                                        if (!!this.db.collection('stats_wallets').find()) return [3, 3];
                                        console.log('\tstats_wallets table does not exist.');
                                        console.log('\tCreating stats_wallets table.');
                                        return [4, this.db.createCollection('stats_wallets')];
                                    case 2:
                                        _a.sent();
                                        _a.label = 3;
                                    case 3:
                                        console.log("\tRemoving entries from/after " + lastDay);
                                        return [4, this.db
                                                .collection('stats_wallets')
                                                .remove({ '_id.day': { $gte: lastDay } })
                                                .then(function (err) { return __awaiter(_this, void 0, void 0, function () {
                                                var opts;
                                                return __generator(this, function (_a) {
                                                    switch (_a.label) {
                                                        case 0:
                                                            res = res.filter(function (x) { return x._id.day; });
                                                            console.log("\tTrying to insert " + res.length + " entries");
                                                            opts = { ordered: false };
                                                            return [4, this.db.collection('stats_wallets').insert(res, opts)];
                                                        case 1:
                                                            _a.sent();
                                                            console.log(res.length + " entries inserted in stats_wallets");
                                                            return [2];
                                                    }
                                                });
                                            }); })];
                                    case 4:
                                        _a.sent();
                                        return [3, 6];
                                    case 5:
                                        err_1 = _a.sent();
                                        console.log('!! Cannot insert into stats_wallets:', err_1);
                                        return [3, 6];
                                    case 6: return [3, 8];
                                    case 7:
                                        console.log('\tNo data to update in stats_wallets');
                                        _a.label = 8;
                                    case 8: return [2, cb()];
                                }
                            });
                        }); });
                        return [2];
                }
            });
        });
    };
    UpdateStats.prototype._updateFiatRates = function (cb) {
        return __awaiter(this, void 0, void 0, function () {
            var lastDay, od;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.lastRun('stats_fiat_rates')];
                    case 1:
                        lastDay = _a.sent();
                        od = objectIdFromDate(new Date(lastDay));
                        this.db
                            .collection(storage.Storage.collections.FIAT_RATES2)
                            .aggregate([
                            {
                                $match: {
                                    _id: { $gt: new ObjectID(od) }
                                }
                            },
                            {
                                $match: {
                                    code: 'USD'
                                }
                            },
                            {
                                $project: {
                                    date: { $add: [new Date(0), '$ts'] },
                                    coin: '$coin',
                                    value: '$value'
                                }
                            },
                            {
                                $group: {
                                    _id: {
                                        day: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                                        coin: '$coin'
                                    },
                                    value: { $first: '$value' }
                                }
                            }
                        ])
                            .toArray(function (err, res) { return __awaiter(_this, void 0, void 0, function () {
                            var err_2;
                            var _this = this;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (err) {
                                            console.log('!! Update fiat rates stats throws error:', err);
                                            return [2, cb(err)];
                                        }
                                        if (!(res.length !== 0)) return [3, 7];
                                        _a.label = 1;
                                    case 1:
                                        _a.trys.push([1, 5, , 6]);
                                        console.log('\tChecking if stats_fiat_rates table exist.');
                                        if (!!this.db.collection('stats_fiat_rates').find()) return [3, 3];
                                        console.log('\tstats_fiat_rates table does not exist.');
                                        console.log('\tCreating stats_fiat_rates table.');
                                        return [4, this.db.createCollection('stats_fiat_rates')];
                                    case 2:
                                        _a.sent();
                                        _a.label = 3;
                                    case 3:
                                        console.log("\tRemoving entries from/after " + lastDay);
                                        return [4, this.db
                                                .collection('stats_fiat_rates')
                                                .remove({ '_id.day': { $gte: lastDay } })
                                                .then(function (err) { return __awaiter(_this, void 0, void 0, function () {
                                                var opts;
                                                return __generator(this, function (_a) {
                                                    switch (_a.label) {
                                                        case 0:
                                                            res = res.filter(function (x) { return x._id.day; });
                                                            console.log("Trying to insert " + res.length + " entries");
                                                            opts = { ordered: false };
                                                            return [4, this.db.collection('stats_fiat_rates').insert(res, opts)];
                                                        case 1:
                                                            _a.sent();
                                                            console.log(res.length + " entries inserted in stats_fiat_rates");
                                                            return [2];
                                                    }
                                                });
                                            }); })];
                                    case 4:
                                        _a.sent();
                                        return [3, 6];
                                    case 5:
                                        err_2 = _a.sent();
                                        console.log('!! Cannot insert into stats_fiat_rates:', err_2);
                                        return [3, 6];
                                    case 6: return [3, 8];
                                    case 7:
                                        console.log('\tNo data to update in stats_fiat_rates');
                                        _a.label = 8;
                                    case 8: return [2, cb()];
                                }
                            });
                        }); });
                        return [2];
                }
            });
        });
    };
    UpdateStats.prototype.lastRun = function (coll) {
        return __awaiter(this, void 0, void 0, function () {
            var cursor, last, lastDay;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.db
                            .collection(coll)
                            .find({})
                            .sort({ _id: -1 })
                            .limit(1)];
                    case 1:
                        cursor = _a.sent();
                        return [4, cursor.next()];
                    case 2:
                        last = _a.sent();
                        lastDay = LAST_DAY;
                        if (last && last._id) {
                            lastDay = last._id.day;
                            console.log("\tLast run is " + lastDay);
                        }
                        else {
                            console.log("\t" + coll + " NEVER UPDATED. Set date to " + lastDay);
                        }
                        return [2, lastDay];
                }
            });
        });
    };
    UpdateStats.prototype._updateTxProposals = function (cb) {
        return __awaiter(this, void 0, void 0, function () {
            var lastDay, od;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.lastRun('stats_txps')];
                    case 1:
                        lastDay = _a.sent();
                        od = objectIdFromDate(new Date(lastDay));
                        this.db
                            .collection(storage.Storage.collections.TXS)
                            .aggregate([
                            {
                                $match: {
                                    _id: { $gt: new ObjectID(od) }
                                }
                            },
                            {
                                $project: {
                                    date: { $add: [new Date(0), { $multiply: ['$createdOn', 1000] }] },
                                    network: '$network',
                                    coin: '$coin',
                                    amount: '$amount',
                                    id: '$_id'
                                }
                            },
                            {
                                $group: {
                                    _id: {
                                        day: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                                        network: '$network',
                                        coin: '$coin'
                                    },
                                    amount: { $sum: '$amount' },
                                    count: { $sum: 1 }
                                }
                            }
                        ])
                            .toArray(function (err, res) { return __awaiter(_this, void 0, void 0, function () {
                            var err_3;
                            var _this = this;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (err) {
                                            console.log('!! Update txps stats throws error:', err);
                                            return [2, cb(err)];
                                        }
                                        if (!(res.length !== 0)) return [3, 7];
                                        _a.label = 1;
                                    case 1:
                                        _a.trys.push([1, 5, , 6]);
                                        console.log('\tChecking if stats_txps table exist.');
                                        if (!!this.db.collection('stats_txps').find()) return [3, 3];
                                        console.log('\tstats_txps table does not exist.');
                                        console.log('\tCreating stats_txps table.');
                                        return [4, this.db.createCollection('stats_txps')];
                                    case 2:
                                        _a.sent();
                                        _a.label = 3;
                                    case 3:
                                        console.log("\tRemoving entries from/after " + lastDay);
                                        return [4, this.db
                                                .collection('stats_txps')
                                                .remove({ '_id.day': { $gte: lastDay } })
                                                .then(function (err) { return __awaiter(_this, void 0, void 0, function () {
                                                var opts;
                                                return __generator(this, function (_a) {
                                                    switch (_a.label) {
                                                        case 0:
                                                            res = res.filter(function (x) { return x._id.day; });
                                                            console.log("\tTrying to insert " + res.length + " entries");
                                                            opts = { ordered: false };
                                                            return [4, this.db.collection('stats_txps').insert(res, opts)];
                                                        case 1:
                                                            _a.sent();
                                                            console.log("\t" + res.length + " entries inserted in stats_txps");
                                                            return [2];
                                                    }
                                                });
                                            }); })];
                                    case 4:
                                        _a.sent();
                                        return [3, 6];
                                    case 5:
                                        err_3 = _a.sent();
                                        console.log('!! Cannot insert into stats_txps:', err_3);
                                        return [3, 6];
                                    case 6: return [3, 8];
                                    case 7:
                                        console.log('\tNo data to update in stats_txps');
                                        _a.label = 8;
                                    case 8: return [2, cb()];
                                }
                            });
                        }); });
                        return [2];
                }
            });
        });
    };
    return UpdateStats;
}());
exports.UpdateStats = UpdateStats;
//# sourceMappingURL=updatestats.js.map