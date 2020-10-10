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
var lodash_1 = __importDefault(require("lodash"));
require("source-map-support/register");
var blockchainexplorer_1 = require("./blockchainexplorer");
var index_1 = require("./chain/index");
var lock_1 = require("./lock");
var logger_1 = __importDefault(require("./logger"));
var messagebroker_1 = require("./messagebroker");
var model_1 = require("./model");
var server_1 = require("./server");
var storage_1 = require("./storage");
var $ = require('preconditions').singleton();
var Common = require('./common');
var Constants = Common.Constants;
var Utils = Common.Utils;
var Defaults = Common.Defaults;
var throttledNewBlocks = lodash_1.default.throttle(function (that, coin, network, hash) {
    that._notifyNewBlock(coin, network, hash);
    that._handleTxConfirmations(coin, network, hash);
}, Defaults.NEW_BLOCK_THROTTLE_TIME_MIN * 60 * 1000);
var BlockchainMonitor = (function () {
    function BlockchainMonitor() {
    }
    BlockchainMonitor.prototype.start = function (opts, cb) {
        var _this = this;
        opts = opts || {};
        this.N = opts.N || 100;
        this.Ni = this.Nix = 0;
        this.last = this.lastTx = [];
        async.parallel([
            function (done) {
                _this.explorers = {
                    eth: {},
                    vcl: {}
                };
                var coinNetworkPairs = [];
                lodash_1.default.each(lodash_1.default.values(Constants.COINS), function (coin) {
                    lodash_1.default.each(lodash_1.default.values(Constants.NETWORKS), function (network) {
                        coinNetworkPairs.push({
                            coin: coin,
                            network: network
                        });
                    });
                });
                lodash_1.default.each(coinNetworkPairs, function (pair) {
                    var explorer;
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
                    _this._initExplorer(pair.coin, pair.network, explorer);
                    _this.explorers[pair.coin][pair.network] = explorer;
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
    BlockchainMonitor.prototype._initExplorer = function (coin, network, explorer) {
        explorer.initSocket({
            onBlock: lodash_1.default.bind(this._handleNewBlock, this, coin, network),
            onIncomingPayments: lodash_1.default.bind(this._handleIncomingPayments, this, coin, network)
        });
    };
    BlockchainMonitor.prototype._handleThirdPartyBroadcasts = function (coin, network, data, processIt) {
        var _this = this;
        if (!data || !data.txid)
            return;
        if (!processIt) {
            if (this.lastTx.indexOf(data.txid) >= 0) {
                return;
            }
            this.lastTx[this.Nix++] = data.txid;
            if (this.Nix >= this.N)
                this.Nix = 0;
            logger_1.default.debug("\tChecking " + coin + "/" + network + " txid: " + data.txid);
        }
        this.storage.fetchTxByHash(data.txid, function (err, txp) {
            if (err) {
                logger_1.default.error('Could not fetch tx from the db');
                return;
            }
            if (!txp || txp.status != 'accepted')
                return;
            var walletId = txp.walletId;
            if (!processIt) {
                logger_1.default.debug('Detected broadcast ' +
                    data.txid +
                    ' of an accepted txp [' +
                    txp.id +
                    '] for wallet ' +
                    walletId +
                    ' [' +
                    txp.amount +
                    'sat ]');
                return setTimeout(_this._handleThirdPartyBroadcasts.bind(_this, coin, network, data, true), 20 * 1000);
            }
            logger_1.default.debug('Processing accepted txp [' + txp.id + '] for wallet ' + walletId + ' [' + txp.amount + 'sat ]');
            txp.setBroadcasted();
            _this.storage.storeTx(_this.walletId, txp, function (err) {
                if (err)
                    logger_1.default.error('Could not save TX');
                var args = {
                    txProposalId: txp.id,
                    txid: data.txid,
                    amount: txp.getTotalAmount()
                };
                var notification = model_1.Notification.create({
                    type: 'NewOutgoingTxByThirdParty',
                    data: args,
                    walletId: walletId
                });
                _this._storeAndBroadcastNotification(notification);
            });
        });
    };
    BlockchainMonitor.prototype._handleIncomingPayments = function (coin, network, data) {
        var _this = this;
        if (!data)
            return;
        var out = data.out;
        if (!out || !out.address || out.address.length < 10)
            return;
        if (coin != 'eth') {
            if (!(out.amount > 0))
                return;
            if (this.last.indexOf(out.address) >= 0) {
                logger_1.default.debug('The incoming tx"s out ' + out.address + ' was already processed');
                return;
            }
            this.last[this.Ni++] = out.address;
            if (this.Ni >= this.N)
                this.Ni = 0;
        }
        else if (coin == 'eth') {
            if (this.lastTx.indexOf(data.txid) >= 0) {
                logger_1.default.debug('The incoming tx ' + data.txid + ' was already processed');
                return;
            }
            this.lastTx[this.Nix++] = data.txid;
            if (this.Nix >= this.N)
                this.Nix = 0;
        }
        logger_1.default.debug("Checking " + coin + ":" + network + ":" + out.address + " " + out.amount);
        this.storage.fetchAddressByCoin(coin, out.address, function (err, address) {
            if (err) {
                logger_1.default.error('Could not fetch addresses from the db');
                return;
            }
            if (!address || address.isChange) {
                return _this._handleThirdPartyBroadcasts(coin, network, data, null);
            }
            var walletId = address.walletId;
            var fromTs = Date.now() - 24 * 3600 * 1000;
            _this.storage.fetchNotifications(walletId, null, fromTs, function (err, notifications) {
                if (err)
                    return;
                var alreadyNotified = lodash_1.default.some(notifications, function (n) {
                    return n.type == 'NewIncomingTx' && n.data && n.data.txid == data.txid;
                });
                if (alreadyNotified) {
                    logger_1.default.debug('The incoming tx ' + data.txid + ' was already notified');
                    return;
                }
                logger_1.default.debug('Incoming tx for wallet ' + walletId + ' [' + out.amount + 'amount -> ' + out.address + ']');
                var notification = model_1.Notification.create({
                    type: 'NewIncomingTx',
                    data: {
                        txid: data.txid,
                        address: out.address,
                        amount: out.amount,
                        tokenAddress: out.tokenAddress,
                        multisigContractAddress: out.multisigContractAddress
                    },
                    walletId: walletId
                });
                _this._storeAndBroadcastNotification(notification, function () {
                    return;
                });
            });
        });
    };
    BlockchainMonitor.prototype._notifyNewBlock = function (coin, network, hash) {
        logger_1.default.debug(" ** NOTIFY New " + coin + "/" + network + " block " + hash);
        var notification = model_1.Notification.create({
            type: 'NewBlock',
            walletId: coin + ":" + network,
            data: {
                hash: hash,
                coin: coin,
                network: network
            }
        });
        this._storeAndBroadcastNotification(notification, function () { });
    };
    BlockchainMonitor.prototype._handleTxConfirmations = function (coin, network, hash) {
        var _this = this;
        if (!index_1.ChainService.notifyConfirmations(coin, network))
            return;
        var processTriggeredSubs = function (subs, cb) {
            async.each(subs, function (sub) {
                logger_1.default.debug('New tx confirmation ' + sub.txid);
                sub.isActive = false;
                _this.storage.storeTxConfirmationSub(sub, function (err) {
                    if (err)
                        return cb(err);
                    var notification = model_1.Notification.create({
                        type: 'TxConfirmation',
                        walletId: sub.walletId,
                        creatorId: sub.copayerId,
                        data: {
                            txid: sub.txid,
                            coin: coin,
                            network: network
                        }
                    });
                    _this._storeAndBroadcastNotification(notification, cb);
                });
            });
        };
        var explorer = this.explorers[coin][network];
        if (!explorer)
            return;
        explorer.getTxidsInBlock(hash, function (err, txids) {
            if (err) {
                logger_1.default.error('Could not fetch txids from block ' + hash, err);
                return;
            }
            _this.storage.fetchActiveTxConfirmationSubs(null, function (err, subs) {
                if (err)
                    return;
                if (lodash_1.default.isEmpty(subs))
                    return;
                var indexedSubs = lodash_1.default.keyBy(subs, 'txid');
                var triggered = [];
                lodash_1.default.each(txids, function (txid) {
                    if (indexedSubs[txid])
                        triggered.push(indexedSubs[txid]);
                });
                processTriggeredSubs(triggered, function (err) {
                    if (err) {
                        logger_1.default.error('Could not process tx confirmations', err);
                    }
                    return;
                });
            });
        });
    };
    BlockchainMonitor.prototype._handleNewBlock = function (coin, network, hash) {
        logger_1.default.debug("New " + coin + "/" + network + " block " + hash);
        var cacheKey = storage_1.Storage.BCHEIGHT_KEY + ':' + coin + ':' + network;
        this.storage.clearGlobalCache(cacheKey, function () { });
        throttledNewBlocks(this, coin, network, hash);
    };
    BlockchainMonitor.prototype._storeAndBroadcastNotification = function (notification, cb) {
        var _this = this;
        this.storage.storeNotification(notification.walletId, notification, function () {
            _this.messageBroker.send(notification);
            if (cb)
                return cb();
        });
    };
    return BlockchainMonitor;
}());
exports.BlockchainMonitor = BlockchainMonitor;
//# sourceMappingURL=blockchainmonitor.js.map