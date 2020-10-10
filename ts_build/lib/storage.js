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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
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
var mongodb = __importStar(require("mongodb"));
var logger_1 = __importDefault(require("./logger"));
var model_1 = require("./model");
var masternodes_1 = require("./model/masternodes");
var BCHAddressTranslator = require('./bchaddresstranslator');
var $ = require('preconditions').singleton();
var collections = {
    WALLETS: 'wallets',
    TXS: 'txs',
    ADDRESSES: 'addresses',
    ADVERTISEMENTS: 'advertisements',
    NOTIFICATIONS: 'notifications',
    COPAYERS_LOOKUP: 'copayers_lookup',
    PREFERENCES: 'preferences',
    EMAIL_QUEUE: 'email_queue',
    CACHE: 'cache',
    FIAT_RATES2: 'fiat_rates2',
    TX_NOTES: 'tx_notes',
    SESSIONS: 'sessions',
    PUSH_NOTIFICATION_SUBS: 'push_notification_subs',
    TX_CONFIRMATION_SUBS: 'tx_confirmation_subs',
    MASTERNODES: 'masternodes',
    LOCKS: 'locks'
};
var Common = require('./common');
var Constants = Common.Constants;
var Storage = (function () {
    function Storage(opts) {
        var _this = this;
        if (opts === void 0) { opts = {}; }
        this.walletCheck = function (params) { return __awaiter(_this, void 0, void 0, function () {
            var walletId;
            var _this = this;
            return __generator(this, function (_a) {
                walletId = params.walletId;
                return [2, new Promise(function (resolve) {
                        var addressStream = _this.db.collection(collections.ADDRESSES).find({ walletId: walletId });
                        var sum = 0;
                        var lastAddress;
                        addressStream.on('data', function (walletAddress) {
                            if (walletAddress.address) {
                                lastAddress = walletAddress.address.replace(/:.*$/, '');
                                var addressSum = Buffer.from(lastAddress).reduce(function (tot, cur) { return (tot + cur) % Number.MAX_SAFE_INTEGER; });
                                sum = (sum + addressSum) % Number.MAX_SAFE_INTEGER;
                            }
                        });
                        addressStream.on('end', function () {
                            resolve({ lastAddress: lastAddress, sum: sum });
                        });
                    })];
            });
        }); };
        opts = opts || {};
        this.db = opts.db;
    }
    Storage.createIndexes = function (db) {
        logger_1.default.info('Creating DB indexes');
        if (!db.collection) {
            console.log('[storage.ts.55] no db.collection');
            logger_1.default.error('DB not ready');
            return;
        }
        db.collection(collections.WALLETS).createIndex({
            id: 1
        });
        db.collection(collections.COPAYERS_LOOKUP).createIndex({
            copayerId: 1
        });
        db.collection(collections.COPAYERS_LOOKUP).createIndex({
            walletId: 1
        });
        db.collection(collections.TXS).createIndex({
            walletId: 1,
            id: 1
        });
        db.collection(collections.TXS).createIndex({
            walletId: 1,
            isPending: 1,
            txid: 1
        });
        db.collection(collections.TXS).createIndex({
            walletId: 1,
            createdOn: -1
        });
        db.collection(collections.TXS).createIndex({
            txid: 1
        });
        db.collection(collections.NOTIFICATIONS).createIndex({
            walletId: 1,
            id: 1
        });
        db.collection(collections.ADVERTISEMENTS).createIndex({
            advertisementId: 1,
            title: 1
        }, { unique: true });
        db.collection(collections.ADDRESSES).createIndex({
            walletId: 1,
            createdOn: 1
        });
        db.collection(collections.ADDRESSES).createIndex({
            address: 1
        }, { unique: true });
        db.collection(collections.ADDRESSES).createIndex({
            address: 1,
            beRegistered: 1
        });
        db.collection(collections.ADDRESSES).createIndex({
            walletId: 1,
            address: 1
        });
        db.collection(collections.EMAIL_QUEUE).createIndex({
            id: 1
        });
        db.collection(collections.EMAIL_QUEUE).createIndex({
            notificationId: 1
        });
        db.collection(collections.CACHE).createIndex({
            walletId: 1,
            type: 1,
            key: 1
        });
        db.collection(collections.TX_NOTES).createIndex({
            walletId: 1,
            txid: 1
        });
        db.collection(collections.PREFERENCES).createIndex({
            walletId: 1
        });
        db.collection(collections.FIAT_RATES2).createIndex({
            coin: 1,
            code: 1,
            ts: 1
        });
        db.collection(collections.PUSH_NOTIFICATION_SUBS).createIndex({
            copayerId: 1
        });
        db.collection(collections.TX_CONFIRMATION_SUBS).createIndex({
            copayerId: 1,
            txid: 1
        });
        db.collection(collections.TX_CONFIRMATION_SUBS).createIndex({
            isActive: 1,
            copayerId: 1
        });
        db.collection(collections.SESSIONS).createIndex({
            copayerId: 1
        });
        db.collection(collections.MASTERNODES).createIndex({
            walletId: 1
        });
        db.collection(collections.MASTERNODES).createIndex({
            walletId: 1,
            txid: 1
        });
    };
    Storage.prototype.connect = function (opts, cb) {
        var _this = this;
        opts = opts || {};
        if (this.db)
            return cb();
        var config = opts.mongoDb || {};
        if (opts.secondaryPreferred) {
            if (config.uri.indexOf('?') > 0) {
                config.uri = config.uri + '&';
            }
            else {
                config.uri = config.uri + '?';
            }
            config.uri = config.uri + 'readPreference=secondaryPreferred';
            logger_1.default.info('Read operations set to secondaryPreferred');
        }
        if (!config.dbname) {
            logger_1.default.error('No dbname at config.');
            return cb(new Error('No dbname at config.'));
        }
        mongodb.MongoClient.connect(config.uri, { useUnifiedTopology: true }, function (err, client) {
            if (err) {
                logger_1.default.error('Unable to connect to the mongoDB. Check the credentials.');
                return cb(err);
            }
            _this.db = client.db(config.dbname);
            _this.client = client;
            logger_1.default.info("Connection established to db: " + config.uri);
            Storage.createIndexes(_this.db);
            return cb();
        });
    };
    Storage.prototype.disconnect = function (cb) {
        var _this = this;
        if (this.client) {
            this.client.close(function (err) {
                if (err)
                    return cb(err);
                _this.db = null;
                _this.client = null;
                return cb();
            });
        }
        else {
            return cb();
        }
    };
    Storage.prototype.fetchWallet = function (id, cb) {
        if (!this.db)
            return cb('not ready');
        this.db.collection(collections.WALLETS).findOne({
            id: id
        }, function (err, result) {
            if (err)
                return cb(err);
            if (!result)
                return cb();
            return cb(null, model_1.Wallet.fromObj(result));
        });
    };
    Storage.prototype.storeWallet = function (wallet, cb) {
        this.db.collection(collections.WALLETS).replaceOne({
            id: wallet.id
        }, wallet.toObject(), {
            w: 1,
            upsert: true
        }, cb);
    };
    Storage.prototype.storeWalletAndUpdateCopayersLookup = function (wallet, cb) {
        var _this = this;
        var copayerLookups = lodash_1.default.map(wallet.copayers, function (copayer) {
            try {
                $.checkState(copayer.requestPubKeys);
            }
            catch (e) {
                return cb(e);
            }
            return {
                copayerId: copayer.id,
                walletId: wallet.id,
                requestPubKeys: copayer.requestPubKeys
            };
        });
        this.db.collection(collections.COPAYERS_LOOKUP).deleteMany({
            walletId: wallet.id
        }, {
            w: 1
        }, function (err) {
            if (err)
                return cb(err);
            _this.db.collection(collections.COPAYERS_LOOKUP).insertMany(copayerLookups, {
                w: 1
            }, function (err) {
                if (err)
                    return cb(err);
                return _this.storeWallet(wallet, cb);
            });
        });
    };
    Storage.prototype.fetchCopayerLookup = function (copayerId, cb) {
        this.db.collection(collections.COPAYERS_LOOKUP).findOne({
            copayerId: copayerId
        }, function (err, result) {
            if (err)
                return cb(err);
            if (!result)
                return cb();
            if (!result.requestPubKeys) {
                result.requestPubKeys = [
                    {
                        key: result.requestPubKey,
                        signature: result.signature
                    }
                ];
            }
            return cb(null, result);
        });
    };
    Storage.prototype._completeTxData = function (walletId, txs, cb) {
        this.fetchWallet(walletId, function (err, wallet) {
            if (err)
                return cb(err);
            lodash_1.default.each([].concat(txs), function (tx) {
                tx.derivationStrategy = wallet.derivationStrategy || 'BIP45';
                tx.creatorName = wallet.getCopayer(tx.creatorId).name;
                lodash_1.default.each(tx.actions, function (action) {
                    action.copayerName = wallet.getCopayer(action.copayerId).name;
                });
                if (tx.status == 'accepted')
                    tx.raw = tx.getRawTx();
            });
            return cb(null, txs);
        });
    };
    Storage.prototype.fetchTx = function (walletId, txProposalId, cb) {
        var _this = this;
        if (!this.db)
            return cb();
        this.db.collection(collections.TXS).findOne({
            id: txProposalId,
            walletId: walletId
        }, function (err, result) {
            if (err)
                return cb(err);
            if (!result)
                return cb();
            return _this._completeTxData(walletId, model_1.TxProposal.fromObj(result), cb);
        });
    };
    Storage.prototype.fetchTxByHash = function (hash, cb) {
        var _this = this;
        if (!this.db)
            return cb();
        this.db.collection(collections.TXS).findOne({
            txid: hash
        }, function (err, result) {
            if (err)
                return cb(err);
            if (!result)
                return cb();
            return _this._completeTxData(result.walletId, model_1.TxProposal.fromObj(result), cb);
        });
    };
    Storage.prototype.fetchLastTxs = function (walletId, creatorId, limit, cb) {
        this.db
            .collection(collections.TXS)
            .find({
            walletId: walletId,
            creatorId: creatorId
        }, {
            limit: limit || 5
        })
            .sort({
            createdOn: -1
        })
            .toArray(function (err, result) {
            if (err)
                return cb(err);
            if (!result)
                return cb();
            var txs = lodash_1.default.map(result, function (tx) {
                return model_1.TxProposal.fromObj(tx);
            });
            return cb(null, txs);
        });
    };
    Storage.prototype.fetchEthPendingTxs = function (multisigTxpsInfo) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.db
                .collection(collections.TXS)
                .find({
                txid: { $in: multisigTxpsInfo.map(function (txpInfo) { return txpInfo.transactionHash; }) }
            })
                .sort({
                createdOn: -1
            })
                .toArray(function (err, result) { return __awaiter(_this, void 0, void 0, function () {
                var multisigTxpsInfoByTransactionHash, actionsById, txs;
                return __generator(this, function (_a) {
                    if (err)
                        return [2, reject(err)];
                    if (!result)
                        return [2, reject()];
                    multisigTxpsInfoByTransactionHash = lodash_1.default.groupBy(multisigTxpsInfo, 'transactionHash');
                    actionsById = {};
                    txs = lodash_1.default.compact(lodash_1.default.map(result, function (tx) {
                        if (!tx.multisigContractAddress) {
                            return undefined;
                        }
                        tx.status = 'pending';
                        tx.multisigTxId = multisigTxpsInfoByTransactionHash[tx.txid][0].transactionId;
                        tx.actions.forEach(function (action) {
                            if (lodash_1.default.some(multisigTxpsInfoByTransactionHash[tx.txid], { event: 'ExecutionFailure' })) {
                                action.type = 'failed';
                            }
                        });
                        if (tx.amount === 0) {
                            actionsById[tx.multisigTxId] = __spreadArrays(tx.actions, (actionsById[tx.multisigTxId] || []));
                            return undefined;
                        }
                        return model_1.TxProposal.fromObj(tx);
                    }));
                    txs.forEach(function (tx) {
                        if (actionsById[tx.multisigTxId]) {
                            tx.actions = __spreadArrays(tx.actions, (actionsById[tx.multisigTxId] || []));
                        }
                    });
                    return [2, resolve(txs)];
                });
            }); });
        });
    };
    Storage.prototype.fetchPendingTxs = function (walletId, cb) {
        var _this = this;
        this.db
            .collection(collections.TXS)
            .find({
            walletId: walletId,
            isPending: true
        })
            .sort({
            createdOn: -1
        })
            .toArray(function (err, result) {
            if (err)
                return cb(err);
            if (!result)
                return cb();
            var txs = lodash_1.default.map(result, function (tx) {
                return model_1.TxProposal.fromObj(tx);
            });
            return _this._completeTxData(walletId, txs, cb);
        });
    };
    Storage.prototype.fetchTxs = function (walletId, opts, cb) {
        var _this = this;
        opts = opts || {};
        var tsFilter = {};
        if (lodash_1.default.isNumber(opts.minTs))
            tsFilter.$gte = opts.minTs;
        if (lodash_1.default.isNumber(opts.maxTs))
            tsFilter.$lte = opts.maxTs;
        var filter = {
            walletId: walletId
        };
        if (!lodash_1.default.isEmpty(tsFilter))
            filter.createdOn = tsFilter;
        var mods = {};
        if (lodash_1.default.isNumber(opts.limit))
            mods.limit = opts.limit;
        this.db
            .collection(collections.TXS)
            .find(filter, mods)
            .sort({
            createdOn: -1
        })
            .toArray(function (err, result) {
            if (err)
                return cb(err);
            if (!result)
                return cb();
            var txs = lodash_1.default.map(result, function (tx) {
                return model_1.TxProposal.fromObj(tx);
            });
            return _this._completeTxData(walletId, txs, cb);
        });
    };
    Storage.prototype.fetchBroadcastedTxs = function (walletId, opts, cb) {
        var _this = this;
        opts = opts || {};
        var tsFilter = {};
        if (lodash_1.default.isNumber(opts.minTs))
            tsFilter.$gte = opts.minTs;
        if (lodash_1.default.isNumber(opts.maxTs))
            tsFilter.$lte = opts.maxTs;
        var filter = {
            walletId: walletId,
            status: 'broadcasted'
        };
        if (!lodash_1.default.isEmpty(tsFilter))
            filter.broadcastedOn = tsFilter;
        var mods = {};
        if (lodash_1.default.isNumber(opts.limit))
            mods.limit = opts.limit;
        this.db
            .collection(collections.TXS)
            .find(filter, mods)
            .sort({
            createdOn: -1
        })
            .toArray(function (err, result) {
            if (err)
                return cb(err);
            if (!result)
                return cb();
            var txs = lodash_1.default.map(result, function (tx) {
                return model_1.TxProposal.fromObj(tx);
            });
            return _this._completeTxData(walletId, txs, cb);
        });
    };
    Storage.prototype.fetchNotifications = function (walletId, notificationId, minTs, cb) {
        function makeId(timestamp) {
            return lodash_1.default.padStart(timestamp, 14, '0') + lodash_1.default.repeat('0', 4);
        }
        var minId = makeId(minTs);
        if (notificationId) {
            minId = notificationId > minId ? notificationId : minId;
        }
        this.db
            .collection(collections.NOTIFICATIONS)
            .find({
            walletId: walletId,
            id: {
                $gt: minId
            }
        })
            .sort({
            id: 1
        })
            .toArray(function (err, result) {
            if (err)
                return cb(err);
            if (!result)
                return cb();
            var notifications = lodash_1.default.map(result, function (notification) {
                return model_1.Notification.fromObj(notification);
            });
            return cb(null, notifications);
        });
    };
    Storage.prototype.storeNotification = function (walletId, notification, cb) {
        if (!this.db) {
            logger_1.default.warn('Trying to store a notification with close DB', notification);
            return;
        }
        this.db.collection(collections.NOTIFICATIONS).insertOne(notification, {
            w: 1
        }, cb);
    };
    Storage.prototype.storeTx = function (walletId, txp, cb) {
        this.db.collection(collections.TXS).replaceOne({
            id: txp.id,
            walletId: walletId
        }, txp.toObject(), {
            w: 1,
            upsert: true
        }, cb);
    };
    Storage.prototype.removeTx = function (walletId, txProposalId, cb) {
        this.db.collection(collections.TXS).deleteOne({
            id: txProposalId,
            walletId: walletId
        }, {
            w: 1
        }, cb);
    };
    Storage.prototype.removeWallet = function (walletId, cb) {
        var _this = this;
        async.parallel([
            function (next) {
                _this.db.collection(collections.WALLETS).deleteOne({
                    id: walletId
                }, next);
            },
            function (next) {
                var otherCollections = lodash_1.default.without(lodash_1.default.values(collections), collections.WALLETS);
                async.each(otherCollections, function (col, next) {
                    _this.db.collection(col).deleteMany({
                        walletId: walletId
                    }, next);
                }, next);
            }
        ], cb);
    };
    Storage.prototype.fetchAddresses = function (walletId, cb) {
        this.db
            .collection(collections.ADDRESSES)
            .find({
            walletId: walletId
        })
            .sort({
            createdOn: 1
        })
            .toArray(function (err, result) {
            if (err)
                return cb(err);
            if (!result)
                return cb();
            return cb(null, result.map(model_1.Address.fromObj));
        });
    };
    Storage.prototype.migrateToCashAddr = function (walletId, cb) {
        var _this = this;
        var cursor = this.db.collection(collections.ADDRESSES).find({
            walletId: walletId
        });
        cursor.on('end', function () {
            console.log("Migration to cash address of " + walletId + " Finished");
            return _this.clearWalletCache(walletId, cb);
        });
        cursor.on('err', function (err) {
            return cb(err);
        });
        cursor.on('data', function (doc) {
            cursor.pause();
            var x;
            try {
                x = BCHAddressTranslator.translate(doc.address, 'cashaddr');
            }
            catch (e) {
                return cb(e);
            }
            _this.db.collection(collections.ADDRESSES).updateMany({ _id: doc._id }, { $set: { address: x } });
            cursor.resume();
        });
    };
    Storage.prototype.fetchUnsyncAddresses = function (walletId, cb) {
        this.db
            .collection(collections.ADDRESSES)
            .find({
            walletId: walletId,
            beRegistered: null
        })
            .toArray(function (err, result) {
            if (err)
                return cb(err);
            if (!result)
                return cb();
            return cb(null, result);
        });
    };
    Storage.prototype.fetchNewAddresses = function (walletId, fromTs, cb) {
        this.db
            .collection(collections.ADDRESSES)
            .find({
            walletId: walletId,
            createdOn: {
                $gte: fromTs
            }
        })
            .sort({
            createdOn: 1
        })
            .toArray(function (err, result) {
            if (err)
                return cb(err);
            if (!result)
                return cb();
            return cb(null, result.map(model_1.Address.fromObj));
        });
    };
    Storage.prototype.storeAddress = function (address, cb) {
        this.db.collection(collections.ADDRESSES).replaceOne({
            walletId: address.walletId,
            address: address.address
        }, address, {
            w: 1,
            upsert: false
        }, cb);
    };
    Storage.prototype.markSyncedAddresses = function (addresses, cb) {
        this.db.collection(collections.ADDRESSES).updateMany({
            address: { $in: addresses }
        }, { $set: { beRegistered: true } }, {
            w: 1,
            upsert: false
        }, cb);
    };
    Storage.prototype.deregisterWallet = function (walletId, cb) {
        var _this = this;
        this.db.collection(collections.WALLETS).updateOne({
            id: walletId
        }, { $set: { beRegistered: null } }, {
            w: 1,
            upsert: false
        }, function () {
            _this.db.collection(collections.ADDRESSES).updateMany({
                walletId: walletId
            }, { $set: { beRegistered: null } }, {
                w: 1,
                upsert: false
            }, function () {
                _this.clearWalletCache(walletId, cb);
            });
        });
    };
    Storage.prototype.storeAddressAndWallet = function (wallet, addresses, cb) {
        var _this = this;
        var clonedAddresses = [].concat(addresses);
        if (lodash_1.default.isEmpty(addresses))
            return cb();
        var duplicate;
        this.db.collection(collections.ADDRESSES).insertMany(clonedAddresses, {
            w: 1
        }, function (err) {
            if (err) {
                if (!err.toString().match(/E11000/)) {
                    return cb(err);
                }
                else {
                    duplicate = true;
                    logger_1.default.warn('Found duplicate address: ' + lodash_1.default.join(lodash_1.default.map(clonedAddresses, 'address'), ','));
                }
            }
            _this.storeWallet(wallet, function (err) {
                return cb(err, duplicate);
            });
        });
    };
    Storage.prototype.fetchAddressByWalletId = function (walletId, address, cb) {
        this.db.collection(collections.ADDRESSES).findOne({
            walletId: walletId,
            address: address
        }, function (err, result) {
            if (err)
                return cb(err);
            if (!result)
                return cb();
            return cb(null, model_1.Address.fromObj(result));
        });
    };
    Storage.prototype.fetchAddressesByWalletId = function (walletId, addresses, cb) {
        this.db
            .collection(collections.ADDRESSES)
            .find({
            walletId: walletId,
            address: { $in: addresses }
        }, {})
            .toArray(function (err, result) {
            if (err)
                return cb(err);
            if (!result)
                return cb();
            return cb(null, result);
        });
    };
    Storage.prototype.fetchAddressByCoin = function (coin, address, cb) {
        if (!this.db)
            return cb();
        this.db
            .collection(collections.ADDRESSES)
            .find({
            address: address
        })
            .toArray(function (err, result) {
            if (err)
                return cb(err);
            if (!result || lodash_1.default.isEmpty(result))
                return cb();
            if (result.length > 1) {
                result = lodash_1.default.find(result, function (address) {
                    return coin == (address.coin || 'btc');
                });
            }
            else {
                result = lodash_1.default.head(result);
            }
            if (!result)
                return cb();
            return cb(null, model_1.Address.fromObj(result));
        });
    };
    Storage.prototype.fetchPreferences = function (walletId, copayerId, cb) {
        this.db
            .collection(collections.PREFERENCES)
            .find({
            walletId: walletId
        })
            .toArray(function (err, result) {
            if (err)
                return cb(err);
            if (copayerId) {
                result = lodash_1.default.find(result, {
                    copayerId: copayerId
                });
            }
            if (!result)
                return cb();
            var preferences = lodash_1.default.map([].concat(result), function (r) {
                return model_1.Preferences.fromObj(r);
            });
            if (copayerId) {
                return cb(null, preferences[0]);
            }
            else {
                return cb(null, preferences);
            }
        });
    };
    Storage.prototype.storePreferences = function (preferences, cb) {
        this.db.collection(collections.PREFERENCES).replaceOne({
            walletId: preferences.walletId,
            copayerId: preferences.copayerId
        }, preferences, {
            w: 1,
            upsert: true
        }, cb);
    };
    Storage.prototype.storeEmail = function (email, cb) {
        this.db.collection(collections.EMAIL_QUEUE).replaceOne({
            id: email.id
        }, email, {
            w: 1,
            upsert: true
        }, cb);
    };
    Storage.prototype.fetchUnsentEmails = function (cb) {
        this.db
            .collection(collections.EMAIL_QUEUE)
            .find({
            status: 'fail'
        })
            .toArray(function (err, result) {
            if (err)
                return cb(err);
            if (!result || lodash_1.default.isEmpty(result))
                return cb(null, []);
            var emails = lodash_1.default.map(result, function (x) {
                return model_1.Email.fromObj(x);
            });
            return cb(null, emails);
        });
    };
    Storage.prototype.fetchEmailByNotification = function (notificationId, cb) {
        this.db.collection(collections.EMAIL_QUEUE).findOne({
            notificationId: notificationId
        }, function (err, result) {
            if (err)
                return cb(err);
            if (!result)
                return cb();
            return cb(null, model_1.Email.fromObj(result));
        });
    };
    Storage.prototype.getTxHistoryCacheStatusV8 = function (walletId, cb) {
        this.db.collection(collections.CACHE).findOne({
            walletId: walletId,
            type: 'historyCacheStatusV8',
            key: null
        }, function (err, result) {
            if (err)
                return cb(err);
            if (!result)
                return cb(null, {
                    tipId: null,
                    tipIndex: null
                });
            return cb(null, {
                updatedOn: result.updatedOn,
                updatedHeight: result.updatedHeight,
                tipIndex: result.tipIndex,
                tipTxId: result.tipTxId,
                tipHeight: result.tipHeight
            });
        });
    };
    Storage.prototype.getWalletAddressChecked = function (walletId, cb) {
        this.db.collection(collections.CACHE).findOne({
            walletId: walletId,
            type: 'addressChecked',
            key: null
        }, function (err, result) {
            if (err || !result)
                return cb(err);
            return cb(null, result.totalAddresses);
        });
    };
    Storage.prototype.setWalletAddressChecked = function (walletId, totalAddresses, cb) {
        this.db.collection(collections.CACHE).replaceOne({
            walletId: walletId,
            type: 'addressChecked',
            key: null
        }, {
            walletId: walletId,
            type: 'addressChecked',
            key: null,
            totalAddresses: totalAddresses
        }, {
            w: 1,
            upsert: true
        }, cb);
    };
    Storage.prototype.getTxHistoryCacheV8 = function (walletId, skip, limit, cb) {
        var _this = this;
        $.checkArgument(skip >= 0);
        $.checkArgument(limit >= 0);
        this.getTxHistoryCacheStatusV8(walletId, function (err, cacheStatus) {
            if (err)
                return cb(err);
            if (lodash_1.default.isNull(cacheStatus.tipId))
                return cb(null, []);
            var firstPosition = cacheStatus.tipIndex - skip - limit + 1;
            var lastPosition = cacheStatus.tipIndex - skip + 1;
            if (firstPosition < 0)
                firstPosition = 0;
            if (lastPosition <= 0)
                return cb(null, []);
            _this.db
                .collection(collections.CACHE)
                .find({
                walletId: walletId,
                type: 'historyCacheV8',
                key: {
                    $gte: firstPosition,
                    $lt: lastPosition
                }
            })
                .sort({
                key: -1
            })
                .toArray(function (err, result) {
                if (err)
                    return cb(err);
                if (!result)
                    return cb();
                var txs = lodash_1.default.map(result, 'tx');
                return cb(null, txs);
            });
        });
    };
    Storage.prototype.clearWalletCache = function (walletId, cb) {
        this.db.collection(collections.CACHE).deleteMany({
            walletId: walletId
        }, {}, cb);
    };
    Storage.prototype.storeTxHistoryStreamV8 = function (walletId, streamKey, items, cb) {
        this.db.collection(collections.CACHE).replaceOne({
            walletId: walletId,
            type: 'historyStream',
            key: null
        }, {
            walletId: walletId,
            type: 'historyStream',
            key: null,
            streamKey: streamKey,
            items: items
        }, {
            w: 1,
            upsert: true
        }, cb);
    };
    Storage.prototype.clearTxHistoryStreamV8 = function (walletId, cb) {
        this.db.collection(collections.CACHE).deleteMany({
            walletId: walletId,
            type: 'historyStream',
            key: null
        }, {}, cb);
    };
    Storage.prototype.getTxHistoryStreamV8 = function (walletId, cb) {
        this.db.collection(collections.CACHE).findOne({
            walletId: walletId,
            type: 'historyStream',
            key: null
        }, function (err, result) {
            if (err || !result)
                return cb(err);
            return cb(null, result);
        });
    };
    Storage.prototype.storeTxHistoryCacheV8 = function (walletId, tipIndex, items, updateHeight, cb) {
        var _this = this;
        var index = lodash_1.default.isNull(tipIndex) ? 0 : tipIndex + 1;
        var pos;
        lodash_1.default.each(items.reverse(), function (item) {
            item.position = index++;
        });
        async.each(items, function (item, next) {
            pos = item.position;
            delete item.position;
            _this.db.collection(collections.CACHE).insertOne({
                walletId: walletId,
                type: 'historyCacheV8',
                key: pos,
                tx: item
            }, next);
        }, function (err) {
            if (err)
                return cb(err);
            var first = lodash_1.default.first(items);
            var last = lodash_1.default.last(items);
            try {
                $.checkState(last.txid, 'missing txid in tx to be cached');
                $.checkState(last.blockheight, 'missing blockheight in tx to be cached');
                $.checkState(first.blockheight, 'missing blockheight in tx to be cached');
                $.checkState(last.blockheight >= 0, 'blockheight <=0 om tx to be cached');
                $.checkState(first.blockheight <= last.blockheight, 'tx to be cached are in wrong order (lastest should be first)');
            }
            catch (e) {
                return cb(e);
            }
            logger_1.default.debug("Cache Last Item: " + last.txid + " blockh: " + last.blockheight + " updatedh: " + updateHeight);
            _this.db.collection(collections.CACHE).replaceOne({
                walletId: walletId,
                type: 'historyCacheStatusV8',
                key: null
            }, {
                walletId: walletId,
                type: 'historyCacheStatusV8',
                key: null,
                updatedOn: Date.now(),
                updatedHeight: updateHeight,
                tipIndex: pos,
                tipTxId: last.txid,
                tipHeight: last.blockheight
            }, {
                w: 1,
                upsert: true
            }, cb);
        });
    };
    Storage.prototype.storeFiatRate = function (coin, rates, cb) {
        var _this = this;
        var now = Date.now();
        async.each(rates, function (rate, next) {
            var i = {
                ts: now,
                coin: coin,
                code: rate.code,
                value: rate.value
            };
            _this.db.collection(collections.FIAT_RATES2).insertOne(i, {
                w: 1
            }, next);
        }, cb);
    };
    Storage.prototype.fetchFiatRate = function (coin, code, ts, cb) {
        this.db
            .collection(collections.FIAT_RATES2)
            .find({
            coin: coin,
            code: code,
            ts: {
                $lte: ts
            }
        })
            .sort({
            ts: -1
        })
            .limit(1)
            .toArray(function (err, result) {
            if (err || lodash_1.default.isEmpty(result))
                return cb(err);
            return cb(null, result[0]);
        });
    };
    Storage.prototype.fetchHistoricalRates = function (coin, code, ts, cb) {
        this.db
            .collection(collections.FIAT_RATES2)
            .find({
            coin: coin,
            code: code,
            ts: {
                $gte: ts
            }
        })
            .sort({
            ts: -1
        })
            .toArray(function (err, result) {
            if (err || lodash_1.default.isEmpty(result))
                return cb(err);
            return cb(null, result);
        });
    };
    Storage.prototype.fetchTxNote = function (walletId, txid, cb) {
        var _this = this;
        this.db.collection(collections.TX_NOTES).findOne({
            walletId: walletId,
            txid: txid
        }, function (err, result) {
            if (err)
                return cb(err);
            if (!result)
                return cb();
            return _this._completeTxNotesData(walletId, model_1.TxNote.fromObj(result), cb);
        });
    };
    Storage.prototype._completeTxNotesData = function (walletId, notes, cb) {
        this.fetchWallet(walletId, function (err, wallet) {
            if (err)
                return cb(err);
            lodash_1.default.each([].concat(notes), function (note) {
                note.editedByName = wallet.getCopayer(note.editedBy).name;
            });
            return cb(null, notes);
        });
    };
    Storage.prototype.fetchTxNotes = function (walletId, opts, cb) {
        var _this = this;
        var filter = {
            walletId: walletId
        };
        if (lodash_1.default.isNumber(opts.minTs))
            filter.editedOn = {
                $gte: opts.minTs
            };
        this.db
            .collection(collections.TX_NOTES)
            .find(filter)
            .toArray(function (err, result) {
            if (err)
                return cb(err);
            var notes = lodash_1.default.compact(lodash_1.default.map(result, function (note) {
                return model_1.TxNote.fromObj(note);
            }));
            return _this._completeTxNotesData(walletId, notes, cb);
        });
    };
    Storage.prototype.storeTxNote = function (txNote, cb) {
        this.db.collection(collections.TX_NOTES).replaceOne({
            txid: txNote.txid,
            walletId: txNote.walletId
        }, txNote.toObject(), {
            w: 1,
            upsert: true
        }, cb);
    };
    Storage.prototype.getSession = function (copayerId, cb) {
        this.db.collection(collections.SESSIONS).findOne({
            copayerId: copayerId
        }, function (err, result) {
            if (err || !result)
                return cb(err);
            return cb(null, model_1.Session.fromObj(result));
        });
    };
    Storage.prototype.storeSession = function (session, cb) {
        this.db.collection(collections.SESSIONS).replaceOne({
            copayerId: session.copayerId
        }, session.toObject(), {
            w: 1,
            upsert: true
        }, cb);
    };
    Storage.prototype.fetchPushNotificationSubs = function (copayerId, cb) {
        this.db
            .collection(collections.PUSH_NOTIFICATION_SUBS)
            .find({
            copayerId: copayerId
        })
            .toArray(function (err, result) {
            if (err)
                return cb(err);
            if (!result)
                return cb();
            var tokens = lodash_1.default.map([].concat(result), function (r) {
                return model_1.PushNotificationSub.fromObj(r);
            });
            return cb(null, tokens);
        });
    };
    Storage.prototype.storePushNotificationSub = function (pushNotificationSub, cb) {
        this.db.collection(collections.PUSH_NOTIFICATION_SUBS).replaceOne({
            copayerId: pushNotificationSub.copayerId,
            token: pushNotificationSub.token
        }, pushNotificationSub, {
            w: 1,
            upsert: true
        }, cb);
    };
    Storage.prototype.removePushNotificationSub = function (copayerId, token, cb) {
        this.db.collection(collections.PUSH_NOTIFICATION_SUBS).deleteMany({
            copayerId: copayerId,
            token: token
        }, {
            w: 1
        }, cb);
    };
    Storage.prototype.fetchActiveTxConfirmationSubs = function (copayerId, cb) {
        if (!this.db) {
            logger_1.default.warn('Trying to fetch notifications with closed DB');
            return;
        }
        var filter = {
            isActive: true
        };
        if (copayerId)
            filter.copayerId = copayerId;
        this.db
            .collection(collections.TX_CONFIRMATION_SUBS)
            .find(filter)
            .toArray(function (err, result) {
            if (err)
                return cb(err);
            if (!result)
                return cb();
            var subs = lodash_1.default.map([].concat(result), function (r) {
                return model_1.TxConfirmationSub.fromObj(r);
            });
            return cb(null, subs);
        });
    };
    Storage.prototype.storeTxConfirmationSub = function (txConfirmationSub, cb) {
        this.db.collection(collections.TX_CONFIRMATION_SUBS).replaceOne({
            copayerId: txConfirmationSub.copayerId,
            txid: txConfirmationSub.txid
        }, txConfirmationSub, {
            w: 1,
            upsert: true
        }, cb);
    };
    Storage.prototype.removeTxConfirmationSub = function (copayerId, txid, cb) {
        this.db.collection(collections.TX_CONFIRMATION_SUBS).deleteMany({
            copayerId: copayerId,
            txid: txid
        }, {
            w: 1
        }, cb);
    };
    Storage.prototype._dump = function (cb, fn) {
        fn = fn || console.log;
        cb = cb || function () { };
        this.db.collections(function (err, collections) {
            if (err)
                return cb(err);
            async.eachSeries(collections, function (col, next) {
                col.find().toArray(function (err, items) {
                    fn('--------', col.s.name);
                    fn(items);
                    fn('------------------------------------------------------------------\n\n');
                    next(err);
                });
            }, cb);
        });
    };
    Storage.prototype.checkAndUseGlobalCache = function (key, duration, cb) {
        var now = Date.now();
        this.db.collection(collections.CACHE).findOne({
            key: key,
            walletId: null,
            type: null
        }, function (err, ret) {
            if (err)
                return cb(err);
            if (!ret)
                return cb();
            var validFor = ret.ts + duration - now;
            return cb(null, validFor > 0 ? ret.result : null, ret.result);
        });
    };
    Storage.prototype.storeGlobalCache = function (key, values, cb) {
        var now = Date.now();
        this.db.collection(collections.CACHE).replaceOne({
            key: key,
            walletId: null,
            type: null
        }, {
            $set: {
                ts: now,
                result: values
            }
        }, {
            w: 1,
            upsert: true
        }, cb);
    };
    Storage.prototype.clearGlobalCache = function (key, cb) {
        this.db.collection(collections.CACHE).deleteMany({
            key: key,
            walletId: null,
            type: null
        }, {
            w: 1
        }, cb);
    };
    Storage.prototype.acquireLock = function (key, expireTs, cb) {
        this.db.collection(collections.LOCKS).insertOne({
            _id: key,
            expireOn: expireTs
        }, {}, cb);
    };
    Storage.prototype.releaseLock = function (key, cb) {
        this.db.collection(collections.LOCKS).deleteMany({
            _id: key
        }, {}, cb);
    };
    Storage.prototype.clearExpiredLock = function (key, cb) {
        var _this = this;
        this.db.collection(collections.LOCKS).findOne({
            _id: key
        }, function (err, ret) {
            if (err || !ret)
                return;
            if (ret.expireOn < Date.now()) {
                logger_1.default.info('Releasing expired lock : ' + key);
                return _this.releaseLock(key, cb);
            }
            return cb();
        });
    };
    Storage.prototype.fetchTestingAdverts = function (cb) {
        this.db
            .collection(collections.ADVERTISEMENTS)
            .find({
            isTesting: true
        })
            .toArray(function (err, result) {
            if (err)
                return cb(err);
            if (!result)
                return cb();
            return cb(null, result.map(model_1.Advertisement.fromObj));
        });
    };
    Storage.prototype.fetchActiveAdverts = function (cb) {
        this.db
            .collection(collections.ADVERTISEMENTS)
            .find({
            isAdActive: true
        })
            .toArray(function (err, result) {
            if (err)
                return cb(err);
            if (!result)
                return cb();
            return cb(null, result.map(model_1.Advertisement.fromObj));
        });
    };
    Storage.prototype.fetchAdvertsByCountry = function (country, cb) {
        this.db
            .collection(collections.ADVERTISEMENTS)
            .find({
            country: country
        })
            .toArray(function (err, result) {
            if (err)
                return cb(err);
            if (!result)
                return cb();
            return cb(null, result.map(model_1.Advertisement.fromObj));
        });
    };
    Storage.prototype.fetchAllAdverts = function (cb) {
        this.db.collection(collections.ADVERTISEMENTS).find({});
    };
    Storage.prototype.removeAdvert = function (adId, cb) {
        this.db.collection(collections.ADVERTISEMENTS).deleteOne({
            advertisementId: adId
        }, {
            w: 1
        }, cb);
    };
    Storage.prototype.storeAdvert = function (advert, cb) {
        this.db.collection(collections.ADVERTISEMENTS).updateOne({
            advertisementId: advert.advertisementId
        }, { $set: advert }, {
            upsert: true
        }, cb);
    };
    Storage.prototype.fetchAdvert = function (adId, cb) {
        this.db.collection(collections.ADVERTISEMENTS).findOne({
            advertisementId: adId
        }, function (err, result) {
            if (err)
                return cb(err);
            if (!result)
                return cb();
            return cb(null, model_1.Advertisement.fromObj(result));
        });
    };
    Storage.prototype.activateAdvert = function (adId, cb) {
        this.db.collection(collections.ADVERTISEMENTS).updateOne({
            advertisementId: adId
        }, { $set: { isAdActive: true, isTesting: false } }, {
            upsert: true
        }, cb);
    };
    Storage.prototype.deactivateAdvert = function (adId, cb) {
        this.db.collection(collections.ADVERTISEMENTS).updateOne({
            advertisementId: adId
        }, {
            $set: { isAdActive: false, isTesting: true }
        }, {
            upsert: true
        }, cb);
    };
    Storage.prototype.storeMasternode = function (walletId, masternode, cb) {
        this.db.collection(collections.MASTERNODES).update({
            txid: masternode.txid,
            walletId: walletId
        }, masternode, {
            w: 1,
            upsert: true
        }, cb);
    };
    Storage.prototype.updateMasternode = function (masternode, cb) {
        this.db.collection(collections.MASTERNODES).update({
            txid: masternode.txid
        }, {
            $set: {
                createdOn: masternode.createdOn,
                address: masternode.address,
                payee: masternode.payee,
                status: masternode.status,
                protocol: masternode.protocol,
                daemonversion: masternode.daemonversion,
                sentinelversion: masternode.sentinelversion,
                sentinelstate: masternode.sentinelstate,
                lastseen: masternode.lastseen,
                activeseconds: masternode.activeseconds,
                lastpaidtime: masternode.lastpaidtime,
                lastpaidblock: masternode.lastpaidblock,
                pingretries: masternode.pingretries
            }
        }, {
            w: 1,
            upsert: false
        }, cb);
    };
    Storage.prototype.removeMasternodes = function (walletId, txid, cb) {
        if (!this.db)
            return cb();
        if (txid) {
            this.db.collection(collections.MASTERNODES).remove({
                txid: txid,
                walletId: walletId
            }, {
                w: 1
            }, cb);
        }
        else {
            this.db.collection(collections.MASTERNODES).remove({
                walletId: walletId
            }, {
                w: 1
            }, cb);
        }
    };
    Storage.prototype.fetchMasternodes = function (walletId, txid, cb) {
        if (!this.db)
            return cb();
        if (txid) {
            this.db.collection(collections.MASTERNODES).findOne({
                txid: txid,
                walletId: walletId
            }, function (err, result) {
                if (err)
                    return cb(err);
                if (!result)
                    return cb();
                return cb(null, masternodes_1.Masternodes.fromObj(result));
            });
        }
        else {
            this.db
                .collection(collections.MASTERNODES)
                .find({ walletId: walletId })
                .toArray(function (err, result) {
                if (err)
                    return cb(err);
                if (!result)
                    return cb();
                var masternodes = [];
                for (var i = 0; i < result.length; i++) {
                    masternodes.push(masternodes_1.Masternodes.fromObj(result[i]));
                }
                return cb(null, masternodes);
            });
        }
    };
    Storage.prototype.fetchMasternodesFromTxId = function (txid, cb) {
        if (!this.db)
            return cb();
        if (!txid)
            return cb();
        this.db.collection(collections.MASTERNODES).findOne({
            txid: txid
        }, function (err, result) {
            if (err)
                return cb(err);
            if (!result)
                return cb();
            return cb(null, masternodes_1.Masternodes.fromObj(result));
        });
    };
    Storage.BCHEIGHT_KEY = 'bcheight';
    Storage.collections = collections;
    return Storage;
}());
exports.Storage = Storage;
//# sourceMappingURL=storage.js.map