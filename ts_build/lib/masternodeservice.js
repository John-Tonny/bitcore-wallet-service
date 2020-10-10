"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
require("source-map-support/register");
var logger_1 = __importDefault(require("../lib/logger"));
var blockchainexplorer_1 = require("./blockchainexplorer");
var lock_1 = require("./lock");
var messagebroker_1 = require("./messagebroker");
var model_1 = require("./model");
var masternodes_1 = require("./model/masternodes");
var server_1 = require("./server");
var storage_1 = require("./storage");
var $ = require('preconditions').singleton();
var Mustache = require('mustache');
var fs = require('fs');
var path = require('path');
var Common = require('./common');
var Constants = Common.Constants;
var Utils = require('./common/utils');
var Defaults = require('./common/defaults');
var MasternodeService = (function () {
    function MasternodeService() {
    }
    MasternodeService.prototype.init = function (opts, cb) {
        var _this = this;
        opts = opts || {};
        async.parallel([
            function (done) {
                _this.explorers = {
                    vcl: {}
                };
                var coinNetworkPairs = [];
                _.each(_.values(Constants.COINS), function (coin) {
                    _.each(_.values(Constants.NETWORKS), function (network) {
                        coinNetworkPairs.push({
                            coin: coin,
                            network: network
                        });
                    });
                });
                _.each(coinNetworkPairs, function (pair) {
                    if (pair.coin == 'vcl') {
                        var explorer = void 0;
                        if (opts.blockchainExplorers &&
                            opts.blockchainExplorers[pair.coin] &&
                            opts.blockchainExplorers[pair.coin][pair.network]) {
                            explorer = opts.blockchainExplorers[pair.coin][pair.network];
                        }
                        else {
                            var config = {};
                            if (opts.blockchainExplorerOpts &&
                                opts.blockchainExplorerOpts[pair.coin] &&
                                opts.blockchainExplorerOpts[pair.coin][pair.network]) {
                                config = opts.blockchainExplorerOpts[pair.coin][pair.network];
                            }
                            else {
                                return;
                            }
                            explorer = blockchainexplorer_1.BlockChainExplorer({
                                provider: config.provider,
                                coin: pair.coin,
                                network: pair.network,
                                url: config.url,
                                userAgent: server_1.WalletService.getServiceVersion()
                            });
                        }
                        $.checkState(explorer);
                        _this.explorers[pair.coin][pair.network] = explorer;
                    }
                });
                done();
            },
            function (done) {
                if (opts.storage) {
                    _this.storage = opts.storage;
                    done();
                }
                else {
                    _this.storage = new storage_1.Storage();
                    _this.storage.connect(__assign(__assign({}, opts.storageOpts), { secondaryPreferred: true }), done);
                }
            },
            function (done) {
                _this.messageBroker = opts.messageBroker || new messagebroker_1.MessageBroker(opts.messageBrokerOpts);
                done();
            },
            function (done) {
                _this.lock = opts.lock || new lock_1.Lock(opts.lockOpts);
                done();
            }
        ], function (err) {
            if (err) {
                logger_1.default.error(err);
            }
            return cb(err);
        });
    };
    MasternodeService.prototype.startCron = function (opts, cb) {
        var _this = this;
        opts = opts || {};
        var interval = opts.fetchInterval || Defaults.MASTERNODE_STATUS_FETCH_INTERVAL;
        if (interval) {
            this._fetch();
            setInterval(function () {
                _this._fetch();
            }, interval * 60 * 1000);
        }
        return cb();
    };
    MasternodeService.prototype._fetch = function (cb) {
        var _this = this;
        cb = cb || function () { };
        var coins = ['vcl'];
        async.each(coins, function (coin, next2) {
            var explorer = _this.explorers[coin]['livenet'];
            var network = 'livenet';
            var opts = {
                coin: coin,
                network: network
            };
            explorer.getMasternodeStatus(opts, function (err, res) {
                if (err) {
                    logger_1.default.warn('Error retrieving masternode status for ' + coin, err);
                    return next2();
                }
                _this.updateMasternodes(coin, network, res, function (err) {
                    if (err) {
                        logger_1.default.warn('Error storing masternode status for ' + coin, err);
                    }
                    return next2();
                });
            });
        }, cb);
    };
    MasternodeService.prototype.updateMasternodes = function (coin, network, masternodes, cb) {
        var _this = this;
        var imasternodes = [];
        _.forEach(_.keys(masternodes), function (key) {
            var masternodeStatus = {};
            masternodeStatus.coin = coin;
            masternodeStatus.network = network;
            masternodeStatus.txid = key;
            masternodeStatus.address = masternodes[key].address;
            masternodeStatus.payee = masternodes[key].payee;
            masternodeStatus.status = masternodes[key].status;
            masternodeStatus.protocol = masternodes[key].protocol;
            masternodeStatus.daemonversion = masternodes[key].daemonversion;
            masternodeStatus.sentinelversion = masternodes[key].sentinelversion;
            masternodeStatus.sentinelstate = masternodes[key].sentinelstate;
            masternodeStatus.lastseen = masternodes[key].lastseen;
            masternodeStatus.activeseconds = masternodes[key].activeseconds;
            masternodeStatus.lastpaidtime = masternodes[key].lastpaidtime;
            masternodeStatus.lastpaidblock = masternodes[key].lastpaidblock;
            masternodeStatus.pingretries = masternodes[key].pingretries;
            var imasternode = masternodes_1.Masternodes.create(masternodeStatus);
            imasternodes.push(imasternode);
        });
        var _loop_1 = function (imasternode) {
            this_1.storage.fetchMasternodesFromTxId(imasternode.txid, function (err, res) {
                if (err) {
                    logger_1.default.warn('Error fetch masternode status for ' + coin + '-' + imasternode.txid, err);
                }
                else {
                    if (res) {
                        var oldStatus_1 = res.status;
                        _this.storage.updateMasternode(imasternode, function (err) {
                            if (err) {
                                logger_1.default.warn('Error update masternode status for ' + coin + '-' + imasternode.txid, err);
                            }
                            else {
                                if (oldStatus_1 != imasternode.status) {
                                    var args = {
                                        createdOn: imasternode.createdOn,
                                        txid: imasternode.txid,
                                        masternodeKey: res.masternodeKey,
                                        coin: res.coin,
                                        network: res.network,
                                        address: imasternode.address,
                                        payee: res.payee,
                                        status: imasternode.status,
                                        protocol: imasternode.protocol,
                                        daemonversion: imasternode.daemonversion,
                                        sentinelversion: imasternode.sentinelversion,
                                        sentinelstate: imasternode.sentinelstate,
                                        lastseen: imasternode.lastseen,
                                        activeseconds: imasternode.activeseconds,
                                        lastpaidtime: imasternode.lastpaidtime,
                                        lastpaidblock: imasternode.lastpaidblock,
                                        pingretries: imasternode.pingretries
                                    };
                                    var notification = model_1.Notification.create({
                                        type: 'UpdateMasternode',
                                        data: args,
                                        walletId: res.walletId
                                    });
                                    _this._storeAndBroadcastNotification(notification);
                                }
                            }
                        });
                    }
                }
            });
        };
        var this_1 = this;
        for (var _i = 0, imasternodes_1 = imasternodes; _i < imasternodes_1.length; _i++) {
            var imasternode = imasternodes_1[_i];
            _loop_1(imasternode);
        }
        return cb();
    };
    MasternodeService.prototype._storeAndBroadcastNotification = function (notification, cb) {
        var _this = this;
        this.storage.storeNotification(notification.walletId, notification, function () {
            _this.messageBroker.send(notification);
            if (cb)
                return cb();
        });
    };
    return MasternodeService;
}());
exports.MasternodeService = MasternodeService;
module.exports = MasternodeService;
//# sourceMappingURL=masternodeservice.js.map