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
var _ = __importStar(require("lodash"));
require("source-map-support/register");
var logger_1 = __importDefault(require("./logger"));
var blockchainexplorer_1 = require("./blockchainexplorer");
var index_1 = require("./chain/index");
var clienterror_1 = require("./errors/clienterror");
var fiatrateservice_1 = require("./fiatrateservice");
var lock_1 = require("./lock");
var messagebroker_1 = require("./messagebroker");
var model_1 = require("./model");
var masternodes_1 = require("./model/masternodes");
var storage_1 = require("./storage");
var config = require('../config');
var Uuid = require('uuid');
var $ = require('preconditions').singleton();
var deprecatedServerMessage = require('../deprecated-serverMessages');
var serverMessages = require('../serverMessages');
var BCHAddressTranslator = require('./bchaddresstranslator');
var EmailValidator = require('email-validator');
var COLLATERAL_COIN = 100000000000;
var MASTERNODE_MIN_CONFIRMATIONS = 15;
var crypto_wallet_core_1 = require("crypto-wallet-core");
var Bitcore = require('bitcore-lib');
var Bitcore_ = {
    btc: Bitcore,
    bch: require('bitcore-lib-cash'),
    eth: Bitcore,
    vcl: require('vircle-lib'),
    xrp: Bitcore
};
var Common = require('./common');
var Utils = Common.Utils;
var Constants = Common.Constants;
var Defaults = Common.Defaults;
var Errors = require('./errors/errordefinitions');
var request = require('request');
var initialized = false;
var doNotCheckV8 = false;
var lock;
var storage;
var blockchainExplorer;
var blockchainExplorerOpts;
var messageBroker;
var fiatRateService;
var serviceVersion;
function boolToNum(x) {
    return x ? 1 : 0;
}
var WalletService = (function () {
    function WalletService() {
        if (!initialized) {
            throw new Error('Server not initialized');
        }
        this.lock = lock;
        this.storage = storage;
        this.blockchainExplorer = blockchainExplorer;
        this.blockchainExplorerOpts = blockchainExplorerOpts;
        this.messageBroker = messageBroker;
        this.fiatRateService = fiatRateService;
        this.notifyTicker = 0;
        this.request = request;
    }
    WalletService.getServiceVersion = function () {
        if (!serviceVersion) {
            serviceVersion = 'bws-' + require('../../package').version;
        }
        return serviceVersion;
    };
    WalletService.initialize = function (opts, cb) {
        $.shouldBeFunction(cb);
        opts = opts || {};
        blockchainExplorer = opts.blockchainExplorer;
        blockchainExplorerOpts = opts.blockchainExplorerOpts;
        doNotCheckV8 = opts.doNotCheckV8;
        if (opts.request) {
            request = opts.request;
        }
        var initStorage = function (cb) {
            if (opts.storage) {
                storage = opts.storage;
                return cb();
            }
            else {
                var newStorage_1 = new storage_1.Storage();
                newStorage_1.connect(opts.storageOpts, function (err) {
                    if (err) {
                        return cb(err);
                    }
                    storage = newStorage_1;
                    return cb();
                });
            }
        };
        var initMessageBroker = function (cb) {
            messageBroker = opts.messageBroker || new messagebroker_1.MessageBroker(opts.messageBrokerOpts);
            if (messageBroker) {
                messageBroker.onMessage(WalletService.handleIncomingNotifications);
            }
            return cb();
        };
        var initFiatRateService = function (cb) {
            if (opts.fiatRateService) {
                fiatRateService = opts.fiatRateService;
                return cb();
            }
            else {
                var newFiatRateService_1 = new fiatrateservice_1.FiatRateService();
                var opts2 = opts.fiatRateServiceOpts || {};
                opts2.storage = storage;
                newFiatRateService_1.init(opts2, function (err) {
                    if (err) {
                        return cb(err);
                    }
                    fiatRateService = newFiatRateService_1;
                    return cb();
                });
            }
        };
        async.series([
            function (next) {
                initStorage(next);
            },
            function (next) {
                initMessageBroker(next);
            },
            function (next) {
                initFiatRateService(next);
            }
        ], function (err) {
            lock = opts.lock || new lock_1.Lock(storage, opts.lockOpts);
            if (err) {
                logger_1.default.error('Could not initialize', err);
                throw err;
            }
            initialized = true;
            return cb();
        });
    };
    WalletService.handleIncomingNotifications = function (notification, cb) {
        cb = cb || function () { };
        return cb();
    };
    WalletService.shutDown = function (cb) {
        if (!initialized) {
            return cb();
        }
        storage.disconnect(function (err) {
            if (err) {
                return cb(err);
            }
            initialized = false;
            return cb();
        });
    };
    WalletService.getInstance = function (opts) {
        opts = opts || {};
        var version = Utils.parseVersion(opts.clientVersion);
        if (version && version.agent === 'bwc') {
            if (version.major === 0 || (version.major === 1 && version.minor < 2)) {
                throw new clienterror_1.ClientError(Errors.codes.UPGRADE_NEEDED, 'BWC clients < 1.2 are no longer supported.');
            }
        }
        var server = new WalletService();
        server._setClientVersion(opts.clientVersion);
        server._setAppVersion(opts.userAgent);
        server.userAgent = opts.userAgent;
        return server;
    };
    WalletService.getInstanceWithAuth = function (opts, cb) {
        var withSignature = function (cb) {
            if (!checkRequired(opts, ['copayerId', 'message', 'signature'], cb)) {
                return;
            }
            var server;
            try {
                server = WalletService.getInstance(opts);
            }
            catch (ex) {
                return cb(ex);
            }
            server.storage.fetchCopayerLookup(opts.copayerId, function (err, copayer) {
                if (err) {
                    return cb(err);
                }
                if (!copayer) {
                    return cb(new clienterror_1.ClientError(Errors.codes.NOT_AUTHORIZED, 'Copayer not found'));
                }
                var isValid = !!server._getSigningKey(opts.message, opts.signature, copayer.requestPubKeys);
                if (!isValid) {
                    return cb(new clienterror_1.ClientError(Errors.codes.NOT_AUTHORIZED, 'Invalid signature'));
                }
                server.walletId = copayer.walletId;
                if (copayer.isSupportStaff) {
                    server.walletId = opts.walletId || copayer.walletId;
                    server.copayerIsSupportStaff = true;
                }
                if (copayer.isMarketingStaff) {
                    server.copayerIsMarketingStaff = true;
                }
                server.copayerId = opts.copayerId;
                return cb(null, server);
            });
        };
        var withSession = function (cb) {
            if (!checkRequired(opts, ['copayerId', 'session'], cb)) {
                return;
            }
            var server;
            try {
                server = WalletService.getInstance(opts);
            }
            catch (ex) {
                return cb(ex);
            }
            server.storage.getSession(opts.copayerId, function (err, s) {
                if (err) {
                    return cb(err);
                }
                var isValid = s && s.id === opts.session && s.isValid();
                if (!isValid) {
                    return cb(new clienterror_1.ClientError(Errors.codes.NOT_AUTHORIZED, 'Session expired'));
                }
                server.storage.fetchCopayerLookup(opts.copayerId, function (err, copayer) {
                    if (err) {
                        return cb(err);
                    }
                    if (!copayer) {
                        return cb(new clienterror_1.ClientError(Errors.codes.NOT_AUTHORIZED, 'Copayer not found'));
                    }
                    server.copayerId = opts.copayerId;
                    server.walletId = copayer.walletId;
                    return cb(null, server);
                });
            });
        };
        var authFn = opts.session ? withSession : withSignature;
        return authFn(cb);
    };
    WalletService.prototype._runLocked = function (cb, task, waitTime) {
        $.checkState(this.walletId);
        this.lock.runLocked(this.walletId, { waitTime: waitTime }, cb, task);
    };
    WalletService.prototype.logi = function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (!this || !this.walletId) {
            return logger_1.default.warn.apply(logger_1.default, __spreadArrays([message], args));
        }
        message = '<' + this.walletId + '>' + message;
        return logger_1.default.info.apply(logger_1.default, __spreadArrays([message], args));
    };
    WalletService.prototype.logw = function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (!this || !this.walletId) {
            return logger_1.default.warn.apply(logger_1.default, __spreadArrays([message], args));
        }
        message = '<' + this.walletId + '>' + message;
        return logger_1.default.warn.apply(logger_1.default, __spreadArrays([message], args));
    };
    WalletService.prototype.logd = function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (!this || !this.walletId) {
            return logger_1.default.verbose.apply(logger_1.default, __spreadArrays([message], args));
        }
        message = '<' + this.walletId + '>' + message;
        return logger_1.default.verbose.apply(logger_1.default, __spreadArrays([message], args));
    };
    WalletService.prototype.login = function (opts, cb) {
        var _this = this;
        var session;
        async.series([
            function (next) {
                _this.storage.getSession(_this.copayerId, function (err, s) {
                    if (err) {
                        return next(err);
                    }
                    session = s;
                    next();
                });
            },
            function (next) {
                if (!session || !session.isValid()) {
                    session = model_1.Session.create({
                        copayerId: _this.copayerId,
                        walletId: _this.walletId
                    });
                }
                else {
                    session.touch();
                }
                next();
            },
            function (next) {
                _this.storage.storeSession(session, next);
            }
        ], function (err) {
            if (err) {
                return cb(err);
            }
            if (!session) {
                return cb(new Error('Could not get current session for this copayer'));
            }
            return cb(null, session.id);
        });
    };
    WalletService.prototype.logout = function (opts, cb) {
    };
    WalletService.prototype.createWallet = function (opts, cb) {
        var _this = this;
        var pubKey;
        if (opts.coin === 'bch' && opts.n > 1) {
            var version = Utils.parseVersion(this.clientVersion);
            if (version && version.agent === 'bwc') {
                if (version.major < 8 || (version.major === 8 && version.minor < 3)) {
                    return cb(new clienterror_1.ClientError(Errors.codes.UPGRADE_NEEDED, 'BWC clients < 8.3 are no longer supported for multisig BCH wallets.'));
                }
            }
        }
        if (!checkRequired(opts, ['name', 'm', 'n', 'pubKey'], cb)) {
            return;
        }
        if (_.isEmpty(opts.name)) {
            return cb(new clienterror_1.ClientError('Invalid wallet name'));
        }
        if (!model_1.Wallet.verifyCopayerLimits(opts.m, opts.n)) {
            return cb(new clienterror_1.ClientError('Invalid combination of required copayers / total copayers'));
        }
        opts.coin = opts.coin || Defaults.COIN;
        if (!Utils.checkValueInCollection(opts.coin, Constants.COINS)) {
            return cb(new clienterror_1.ClientError('Invalid coin'));
        }
        opts.network = opts.network || 'livenet';
        if (!Utils.checkValueInCollection(opts.network, Constants.NETWORKS)) {
            return cb(new clienterror_1.ClientError('Invalid network'));
        }
        var derivationStrategy = Constants.DERIVATION_STRATEGIES.BIP44;
        var addressType = opts.n === 1 ? Constants.SCRIPT_TYPES.P2PKH : Constants.SCRIPT_TYPES.P2SH;
        if (opts.useNativeSegwit) {
            addressType = opts.n === 1 ? Constants.SCRIPT_TYPES.P2WPKH : Constants.SCRIPT_TYPES.P2WSH;
        }
        try {
            pubKey = new Bitcore.PublicKey.fromString(opts.pubKey);
        }
        catch (ex) {
            return cb(new clienterror_1.ClientError('Invalid public key'));
        }
        if (opts.n > 1 && !index_1.ChainService.supportsMultisig(opts.coin)) {
            return cb(new clienterror_1.ClientError('Multisig wallets are not supported for this coin'));
        }
        if (index_1.ChainService.isSingleAddress(opts.coin)) {
            opts.singleAddress = true;
        }
        var newWallet;
        async.series([
            function (acb) {
                if (!opts.id) {
                    return acb();
                }
                _this.storage.fetchWallet(opts.id, function (err, wallet) {
                    if (wallet) {
                        return acb(Errors.WALLET_ALREADY_EXISTS);
                    }
                    return acb(err);
                });
            },
            function (acb) {
                var wallet = model_1.Wallet.create({
                    id: opts.id,
                    name: opts.name,
                    m: opts.m,
                    n: opts.n,
                    coin: opts.coin,
                    network: opts.network,
                    pubKey: pubKey.toString(),
                    singleAddress: !!opts.singleAddress,
                    derivationStrategy: derivationStrategy,
                    addressType: addressType,
                    nativeCashAddr: opts.nativeCashAddr,
                    usePurpose48: opts.n > 1 && !!opts.usePurpose48
                });
                _this.storage.storeWallet(wallet, function (err) {
                    _this.logd('Wallet created', wallet.id, opts.network);
                    newWallet = wallet;
                    return acb(err);
                });
            }
        ], function (err) {
            return cb(err, newWallet ? newWallet.id : null);
        });
    };
    WalletService.prototype.getWallet = function (opts, cb) {
        var _this = this;
        this.storage.fetchWallet(this.walletId, function (err, wallet) {
            if (err)
                return cb(err);
            if (!wallet)
                return cb(Errors.WALLET_NOT_FOUND);
            if (wallet.coin != 'bch' || wallet.nativeCashAddr)
                return cb(null, wallet);
            if (opts.doNotMigrate)
                return cb(null, wallet);
            logger_1.default.info("Migrating wallet " + wallet.id + " to cashAddr");
            _this.storage.migrateToCashAddr(_this.walletId, function (e) {
                if (e)
                    return cb(e);
                wallet.nativeCashAddr = true;
                return _this.storage.storeWallet(wallet, function (e) {
                    if (e)
                        return cb(e);
                    return cb(e, wallet);
                });
            });
        });
    };
    WalletService.prototype.getWalletFromIdentifier = function (opts, cb) {
        var _this = this;
        if (!opts.identifier)
            return cb();
        var end = function (err, ret) {
            if (opts.walletCheck && !err && ret) {
                return _this.syncWallet(ret, cb);
            }
            else {
                return cb(err, ret);
            }
        };
        var walletId;
        async.parallel([
            function (done) {
                _this.storage.fetchWallet(opts.identifier, function (err, wallet) {
                    if (wallet)
                        walletId = wallet.id;
                    return done(err);
                });
            },
            function (done) {
                _this.storage.fetchAddressByCoin(Defaults.COIN, opts.identifier, function (err, address) {
                    if (address)
                        walletId = address.walletId;
                    return done(err);
                });
            },
            function (done) {
                _this.storage.fetchTxByHash(opts.identifier, function (err, tx) {
                    if (tx)
                        walletId = tx.walletId;
                    return done(err);
                });
            }
        ], function (err) {
            if (err)
                return cb(err);
            if (walletId) {
                return _this.storage.fetchWallet(walletId, end);
            }
            return cb();
        });
    };
    WalletService.prototype.getStatus = function (opts, cb) {
        var _this = this;
        opts = opts || {};
        var status = {};
        async.parallel([
            function (next) {
                _this.getWallet({}, function (err, wallet) {
                    if (err)
                        return next(err);
                    var walletExtendedKeys = ['publicKeyRing', 'pubKey', 'addressManager'];
                    var copayerExtendedKeys = ['xPubKey', 'requestPubKey', 'signature', 'addressManager', 'customData'];
                    wallet.copayers = _.map(wallet.copayers, function (copayer) {
                        if (copayer.id == _this.copayerId)
                            return copayer;
                        return _.omit(copayer, 'customData');
                    });
                    if (!opts.includeExtendedInfo) {
                        wallet = _.omit(wallet, walletExtendedKeys);
                        wallet.copayers = _.map(wallet.copayers, function (copayer) {
                            return _.omit(copayer, copayerExtendedKeys);
                        });
                    }
                    status.wallet = wallet;
                    if (opts.includeServerMessages) {
                        status.serverMessages = serverMessages(wallet, _this.appName, _this.appVersion);
                    }
                    else {
                        status.serverMessage = deprecatedServerMessage(wallet, _this.appName, _this.appVersion);
                    }
                    next();
                });
            },
            function (next) {
                opts.wallet = status.wallet;
                _this.getBalance(opts, function (err, balance) {
                    if (opts.includeExtendedInfo) {
                        if (err && err.code != 'WALLET_NEED_SCAN') {
                            return next(err);
                        }
                    }
                    else if (err) {
                        return next(err);
                    }
                    status.balance = balance;
                    next();
                });
            },
            function (next) {
                _this.getPendingTxs(opts, function (err, pendingTxps) {
                    if (err)
                        return next(err);
                    status.pendingTxps = pendingTxps;
                    next();
                });
            },
            function (next) {
                _this.getPreferences({}, function (err, preferences) {
                    if (err)
                        return next(err);
                    status.preferences = preferences;
                    next();
                });
            }
        ], function (err) {
            if (err)
                return cb(err);
            return cb(null, status);
        });
    };
    WalletService.prototype._verifySignature = function (text, signature, pubkey) {
        return Utils.verifyMessage(text, signature, pubkey);
    };
    WalletService.prototype._verifyRequestPubKey = function (requestPubKey, signature, xPubKey) {
        var pub = new Bitcore.HDPublicKey(xPubKey).deriveChild(Constants.PATHS.REQUEST_KEY_AUTH).publicKey;
        return Utils.verifyMessage(requestPubKey, signature, pub.toString());
    };
    WalletService.prototype._getSigningKey = function (text, signature, pubKeys) {
        var _this = this;
        return _.find(pubKeys, function (item) {
            return _this._verifySignature(text, signature, item.key);
        });
    };
    WalletService.prototype._notify = function (type, data, opts, cb) {
        var _this = this;
        if (_.isFunction(opts)) {
            cb = opts;
            opts = {};
        }
        opts = opts || {};
        cb = cb || function () { };
        var walletId = this.walletId || data.walletId;
        var copayerId = this.copayerId || data.copayerId;
        $.checkState(walletId);
        var notification = model_1.Notification.create({
            type: type,
            data: data,
            ticker: this.notifyTicker++,
            creatorId: opts.isGlobal ? null : copayerId,
            walletId: walletId
        });
        this.storage.storeNotification(walletId, notification, function () {
            _this.messageBroker.send(notification);
            return cb();
        });
    };
    WalletService.prototype._notifyTxProposalAction = function (type, txp, extraArgs, cb) {
        if (_.isFunction(extraArgs)) {
            cb = extraArgs;
            extraArgs = {};
        }
        var data = _.assign({
            txProposalId: txp.id,
            creatorId: txp.creatorId,
            amount: txp.getTotalAmount(),
            message: txp.message
        }, extraArgs);
        this._notify(type, data, {}, cb);
    };
    WalletService.prototype._addCopayerToWallet = function (wallet, opts, cb) {
        var _this = this;
        var copayer = model_1.Copayer.create({
            coin: wallet.coin,
            name: opts.name,
            copayerIndex: wallet.copayers.length,
            xPubKey: opts.xPubKey,
            requestPubKey: opts.requestPubKey,
            signature: opts.copayerSignature,
            customData: opts.customData,
            derivationStrategy: wallet.derivationStrategy
        });
        this.storage.fetchCopayerLookup(copayer.id, function (err, res) {
            if (err)
                return cb(err);
            if (res)
                return cb(Errors.COPAYER_REGISTERED);
            if (opts.dryRun)
                return cb(null, {
                    copayerId: null,
                    wallet: wallet
                });
            wallet.addCopayer(copayer);
            _this.storage.storeWalletAndUpdateCopayersLookup(wallet, function (err) {
                if (err)
                    return cb(err);
                async.series([
                    function (next) {
                        _this._notify('NewCopayer', {
                            walletId: opts.walletId,
                            copayerId: copayer.id,
                            copayerName: copayer.name
                        }, {}, next);
                    },
                    function (next) {
                        if (wallet.isComplete() && wallet.isShared()) {
                            _this._notify('WalletComplete', {
                                walletId: opts.walletId
                            }, {
                                isGlobal: true
                            }, next);
                        }
                        else {
                            next();
                        }
                    }
                ], function () {
                    return cb(null, {
                        copayerId: copayer.id,
                        wallet: wallet
                    });
                });
            });
        });
    };
    WalletService.prototype._addKeyToCopayer = function (wallet, copayer, opts, cb) {
        wallet.addCopayerRequestKey(copayer.copayerId, opts.requestPubKey, opts.signature, opts.restrictions, opts.name);
        this.storage.storeWalletAndUpdateCopayersLookup(wallet, function (err) {
            if (err)
                return cb(err);
            return cb(null, {
                copayerId: copayer.id,
                wallet: wallet
            });
        });
    };
    WalletService.prototype.addAccess = function (opts, cb) {
        var _this = this;
        if (!checkRequired(opts, ['copayerId', 'requestPubKey', 'signature'], cb))
            return;
        this.storage.fetchCopayerLookup(opts.copayerId, function (err, copayer) {
            if (err)
                return cb(err);
            if (!copayer)
                return cb(Errors.NOT_AUTHORIZED);
            _this.storage.fetchWallet(copayer.walletId, function (err, wallet) {
                if (err)
                    return cb(err);
                if (!wallet)
                    return cb(Errors.NOT_AUTHORIZED);
                var xPubKey = wallet.copayers.find(function (c) { return c.id === opts.copayerId; }).xPubKey;
                if (!_this._verifyRequestPubKey(opts.requestPubKey, opts.signature, xPubKey)) {
                    return cb(Errors.NOT_AUTHORIZED);
                }
                if (copayer.requestPubKeys.length > Defaults.MAX_KEYS)
                    return cb(Errors.TOO_MANY_KEYS);
                _this._addKeyToCopayer(wallet, copayer, opts, cb);
            });
        });
    };
    WalletService.prototype._setClientVersion = function (version) {
        delete this.parsedClientVersion;
        this.clientVersion = version;
    };
    WalletService.prototype._setAppVersion = function (userAgent) {
        var parsed = Utils.parseAppVersion(userAgent);
        if (!parsed) {
            this.appName = this.appVersion = null;
        }
        else {
            this.appName = parsed.app;
            this.appVersion = parsed;
        }
    };
    WalletService.prototype._parseClientVersion = function () {
        if (_.isUndefined(this.parsedClientVersion)) {
            this.parsedClientVersion = Utils.parseVersion(this.clientVersion);
        }
        return this.parsedClientVersion;
    };
    WalletService.prototype._clientSupportsPayProRefund = function () {
        var version = this._parseClientVersion();
        if (!version)
            return false;
        if (version.agent != 'bwc')
            return true;
        if (version.major < 1 || (version.major == 1 && version.minor < 2))
            return false;
        return true;
    };
    WalletService._getCopayerHash = function (name, xPubKey, requestPubKey) {
        return [name, xPubKey, requestPubKey].join('|');
    };
    WalletService.prototype.joinWallet = function (opts, cb) {
        var _this = this;
        if (!checkRequired(opts, ['walletId', 'name', 'xPubKey', 'requestPubKey', 'copayerSignature'], cb))
            return;
        if (_.isEmpty(opts.name))
            return cb(new clienterror_1.ClientError('Invalid copayer name'));
        opts.coin = opts.coin || Defaults.COIN;
        if (!Utils.checkValueInCollection(opts.coin, Constants.COINS))
            return cb(new clienterror_1.ClientError('Invalid coin'));
        var xPubKey;
        try {
            xPubKey = Bitcore.HDPublicKey(opts.xPubKey);
        }
        catch (ex) {
            return cb(new clienterror_1.ClientError('Invalid extended public key'));
        }
        if (_.isUndefined(xPubKey.network)) {
            return cb(new clienterror_1.ClientError('Invalid extended public key'));
        }
        this.walletId = opts.walletId;
        this._runLocked(cb, function (cb) {
            _this.storage.fetchWallet(opts.walletId, function (err, wallet) {
                if (err)
                    return cb(err);
                if (!wallet)
                    return cb(Errors.WALLET_NOT_FOUND);
                if (opts.coin === 'bch' && wallet.n > 1) {
                    var version = Utils.parseVersion(_this.clientVersion);
                    if (version && version.agent === 'bwc') {
                        if (version.major < 8 || (version.major === 8 && version.minor < 3)) {
                            return cb(new clienterror_1.ClientError(Errors.codes.UPGRADE_NEEDED, 'BWC clients < 8.3 are no longer supported for multisig BCH wallets.'));
                        }
                    }
                }
                if (wallet.n > 1 && wallet.usePurpose48) {
                    var version = Utils.parseVersion(_this.clientVersion);
                    if (version && version.agent === 'bwc') {
                        if (version.major < 8 || (version.major === 8 && version.minor < 4)) {
                            return cb(new clienterror_1.ClientError(Errors.codes.UPGRADE_NEEDED, 'Please upgrade your client to join this multisig wallet'));
                        }
                    }
                }
                if (wallet.n > 1 && wallet.addressType === 'P2WSH') {
                    var version = Utils.parseVersion(_this.clientVersion);
                    if (version && version.agent === 'bwc') {
                        if (version.major < 8 || (version.major === 8 && version.minor < 17)) {
                            return cb(new clienterror_1.ClientError(Errors.codes.UPGRADE_NEEDED, 'Please upgrade your client to join this multisig wallet'));
                        }
                    }
                }
                if (opts.coin != wallet.coin) {
                    return cb(new clienterror_1.ClientError('The wallet you are trying to join was created for a different coin'));
                }
                if (wallet.network != xPubKey.network.name) {
                    return cb(new clienterror_1.ClientError('The wallet you are trying to join was created for a different network'));
                }
                if (wallet.derivationStrategy == Constants.DERIVATION_STRATEGIES.BIP45) {
                    return cb(new clienterror_1.ClientError('The wallet you are trying to join was created with an older version of the client app.'));
                }
                var hash = WalletService._getCopayerHash(opts.name, opts.xPubKey, opts.requestPubKey);
                if (!_this._verifySignature(hash, opts.copayerSignature, wallet.pubKey)) {
                    return cb(new clienterror_1.ClientError());
                }
                if (_.find(wallet.copayers, {
                    xPubKey: opts.xPubKey
                }))
                    return cb(Errors.COPAYER_IN_WALLET);
                if (wallet.copayers.length == wallet.n)
                    return cb(Errors.WALLET_FULL);
                _this._addCopayerToWallet(wallet, opts, cb);
            });
        });
    };
    WalletService.prototype.savePreferences = function (opts, cb) {
        var _this = this;
        opts = opts || {};
        var preferences = [
            {
                name: 'email',
                isValid: function (value) {
                    return EmailValidator.validate(value);
                }
            },
            {
                name: 'language',
                isValid: function (value) {
                    return _.isString(value) && value.length == 2;
                }
            },
            {
                name: 'unit',
                isValid: function (value) {
                    return _.isString(value) && _.includes(['btc', 'bit'], value.toLowerCase());
                }
            },
            {
                name: 'tokenAddresses',
                isValid: function (value) {
                    return _.isArray(value) && value.every(function (x) { return crypto_wallet_core_1.Validation.validateAddress('eth', 'mainnet', x); });
                }
            },
            {
                name: 'multisigEthInfo',
                isValid: function (value) {
                    return (_.isArray(value) &&
                        value.every(function (x) { return crypto_wallet_core_1.Validation.validateAddress('eth', 'mainnet', x.multisigContractAddress); }));
                }
            }
        ];
        opts = _.pick(opts, _.map(preferences, 'name'));
        try {
            _.each(preferences, function (preference) {
                var value = opts[preference.name];
                if (!value)
                    return;
                if (!preference.isValid(value)) {
                    throw new Error('Invalid ' + preference.name);
                }
            });
        }
        catch (ex) {
            return cb(new clienterror_1.ClientError(ex));
        }
        this.getWallet({}, function (err, wallet) {
            if (err)
                return cb(err);
            if (wallet.coin != 'eth') {
                opts.tokenAddresses = null;
                opts.multisigEthInfo = null;
            }
            _this._runLocked(cb, function (cb) {
                _this.storage.fetchPreferences(_this.walletId, _this.copayerId, function (err, oldPref) {
                    if (err)
                        return cb(err);
                    var newPref = model_1.Preferences.create({
                        walletId: _this.walletId,
                        copayerId: _this.copayerId
                    });
                    var preferences = model_1.Preferences.fromObj(_.defaults(newPref, opts, oldPref));
                    if (opts.tokenAddresses) {
                        oldPref = oldPref || {};
                        oldPref.tokenAddresses = oldPref.tokenAddresses || [];
                        preferences.tokenAddresses = _.uniq(oldPref.tokenAddresses.concat(opts.tokenAddresses));
                    }
                    if (opts.multisigEthInfo) {
                        oldPref = oldPref || {};
                        oldPref.multisigEthInfo = oldPref.multisigEthInfo || [];
                        preferences.multisigEthInfo = _.uniq(oldPref.multisigEthInfo.concat(opts.multisigEthInfo).reduce(function (x, y) {
                            var exists = false;
                            x.forEach(function (e) {
                                if (e.multisigContractAddress === y.multisigContractAddress) {
                                    e.tokenAddresses = e.tokenAddresses || [];
                                    y.tokenAddresses = _.uniq(e.tokenAddresses.concat(y.tokenAddresses));
                                    e = Object.assign(e, y);
                                    exists = true;
                                }
                            });
                            return exists ? x : __spreadArrays(x, [y]);
                        }, []));
                    }
                    _this.storage.storePreferences(preferences, function (err) {
                        return cb(err);
                    });
                });
            });
        });
    };
    WalletService.prototype.getPreferences = function (opts, cb) {
        this.storage.fetchPreferences(this.walletId, this.copayerId, function (err, preferences) {
            if (err)
                return cb(err);
            return cb(null, preferences || {});
        });
    };
    WalletService.prototype._canCreateAddress = function (ignoreMaxGap, cb) {
        var _this = this;
        if (ignoreMaxGap)
            return cb(null, true);
        this.storage.fetchAddresses(this.walletId, function (err, addresses) {
            if (err)
                return cb(err);
            var latestAddresses = addresses.filter(function (x) { return !x.isChange; }).slice(-Defaults.MAX_MAIN_ADDRESS_GAP);
            if (latestAddresses.length < Defaults.MAX_MAIN_ADDRESS_GAP ||
                _.some(latestAddresses, {
                    hasActivity: true
                }))
                return cb(null, true);
            var bc = _this._getBlockchainExplorer(latestAddresses[0].coin, latestAddresses[0].network);
            if (!bc)
                return cb(new Error('Could not get blockchain explorer instance'));
            var activityFound = false;
            var i = latestAddresses.length;
            async.whilst(function () {
                return i > 0 && !activityFound;
            }, function (next) {
                bc.getAddressActivity(latestAddresses[--i].address, function (err, res) {
                    if (err)
                        return next(err);
                    activityFound = !!res;
                    return next();
                });
            }, function (err) {
                if (err)
                    return cb(err);
                if (!activityFound)
                    return cb(null, false);
                var address = latestAddresses[i];
                address.hasActivity = true;
                _this.storage.storeAddress(address, function (err) {
                    return cb(err, true);
                });
            });
        });
    };
    WalletService.prototype._store = function (wallet, address, cb, checkSync) {
        var _this = this;
        if (checkSync === void 0) { checkSync = false; }
        var stoAddress = _.clone(address);
        index_1.ChainService.addressToStorageTransform(wallet.coin, wallet.network, stoAddress);
        this.storage.storeAddressAndWallet(wallet, stoAddress, function (err, isDuplicate) {
            if (err)
                return cb(err);
            _this.syncWallet(wallet, function (err2) {
                if (err2) {
                    _this.logw('Error syncing v8 addresses: ', err2);
                }
                return cb(null, isDuplicate);
            }, !checkSync);
        });
    };
    WalletService.prototype.createAddress = function (opts, cb) {
        var _this = this;
        opts = opts || {};
        var createNewAddress = function (wallet, cb) {
            var address;
            try {
                address = wallet.createAddress(false);
            }
            catch (e) {
                _this.logw('Error creating address', e);
                return cb('Bad xPub');
            }
            _this._store(wallet, address, function (err, duplicate) {
                if (err)
                    return cb(err);
                if (duplicate)
                    return cb(null, address);
                if (wallet.coin == 'bch' && opts.noCashAddr) {
                    address = _.cloneDeep(address);
                    address.address = BCHAddressTranslator.translate(address.address, 'copay');
                }
                _this._notify('NewAddress', {
                    address: address.address
                }, function () {
                    return cb(null, address);
                });
            }, true);
        };
        var getFirstAddress = function (wallet, cb) {
            _this.storage.fetchAddresses(_this.walletId, function (err, addresses) {
                if (err)
                    return cb(err);
                if (!_.isEmpty(addresses)) {
                    var x = _.head(addresses);
                    index_1.ChainService.addressFromStorageTransform(wallet.coin, wallet.network, x);
                    return cb(null, x);
                }
                return createNewAddress(wallet, cb);
            });
        };
        this.getWallet({ doNotMigrate: opts.doNotMigrate }, function (err, wallet) {
            if (err)
                return cb(err);
            if (index_1.ChainService.isSingleAddress(wallet.coin)) {
                opts.ignoreMaxGap = true;
                opts.singleAddress = true;
            }
            _this._canCreateAddress(opts.ignoreMaxGap || opts.singleAddress || wallet.singleAddress, function (err, canCreate) {
                if (err)
                    return cb(err);
                if (!canCreate)
                    return cb(Errors.MAIN_ADDRESS_GAP_REACHED);
                _this._runLocked(cb, function (cb) {
                    _this.getWallet({ doNotMigrate: opts.doNotMigrate }, function (err, wallet) {
                        if (err)
                            return cb(err);
                        if (!wallet.isComplete())
                            return cb(Errors.WALLET_NOT_COMPLETE);
                        if (wallet.scanStatus == 'error')
                            return cb(Errors.WALLET_NEED_SCAN);
                        var createFn = opts.singleAddress || wallet.singleAddress ? getFirstAddress : createNewAddress;
                        return createFn(wallet, function (err, address) {
                            if (err) {
                                return cb(err);
                            }
                            return cb(err, address);
                        });
                    });
                }, 10 * 1000);
            });
        });
    };
    WalletService.prototype.getMainAddresses = function (opts, cb) {
        var _this = this;
        opts = opts || {};
        this.storage.fetchAddresses(this.walletId, function (err, addresses) {
            if (err)
                return cb(err);
            var onlyMain = _.reject(addresses, {
                isChange: true
            });
            if (opts.reverse)
                onlyMain.reverse();
            if (opts.limit > 0)
                onlyMain = _.take(onlyMain, opts.limit);
            _this.getWallet({}, function (err, wallet) {
                _.each(onlyMain, function (x) {
                    index_1.ChainService.addressFromStorageTransform(wallet.coin, wallet.network, x);
                });
                return cb(null, onlyMain);
            });
        });
    };
    WalletService.prototype.verifyMessageSignature = function (opts, cb) {
        var _this = this;
        if (!checkRequired(opts, ['message', 'signature'], cb))
            return;
        this.getWallet({}, function (err, wallet) {
            if (err)
                return cb(err);
            var copayer = wallet.getCopayer(_this.copayerId);
            var isValid = !!_this._getSigningKey(opts.message, opts.signature, copayer.requestPubKeys);
            return cb(null, isValid);
        });
    };
    WalletService.prototype._getBlockchainExplorer = function (coin, network) {
        var opts = {};
        var provider;
        if (this.blockchainExplorer)
            return this.blockchainExplorer;
        if (this.blockchainExplorerOpts) {
            if (this.blockchainExplorerOpts[coin] && this.blockchainExplorerOpts[coin][network]) {
                opts = this.blockchainExplorerOpts[coin][network];
                provider = opts.provider;
            }
            else if (this.blockchainExplorerOpts[network]) {
                opts = this.blockchainExplorerOpts[network];
            }
        }
        opts.provider = provider;
        opts.coin = coin;
        opts.network = network;
        opts.userAgent = WalletService.getServiceVersion();
        var bc;
        try {
            bc = blockchainexplorer_1.BlockChainExplorer(opts);
        }
        catch (ex) {
            this.logw('Could not instantiate blockchain explorer', ex);
        }
        return bc;
    };
    WalletService.prototype.getUtxosForCurrentWallet = function (opts, cb) {
        var _this = this;
        opts = opts || {};
        var utxoKey = function (utxo) {
            return utxo.txid + '|' + utxo.vout;
        };
        var utxoKey1 = function (outpoint) {
            var xtxid = outpoint.split('-');
            return xtxid[0] + '|' + xtxid[1];
        };
        var coin, allAddresses, allUtxos, utxoIndex, addressStrs, bc, wallet;
        async.series([
            function (next) {
                _this.getWallet({}, function (err, w) {
                    if (err)
                        return next(err);
                    wallet = w;
                    if (wallet.scanStatus == 'error')
                        return cb(Errors.WALLET_NEED_SCAN);
                    coin = wallet.coin;
                    bc = _this._getBlockchainExplorer(coin, wallet.network);
                    if (!bc)
                        return cb(new Error('Could not get blockchain explorer instance'));
                    return next();
                });
            },
            function (next) {
                if (_.isArray(opts.addresses)) {
                    allAddresses = opts.addresses;
                    return next();
                }
                _this.storage.fetchAddresses(_this.walletId, function (err, addresses) {
                    _.each(addresses, function (x) {
                        index_1.ChainService.addressFromStorageTransform(wallet.coin, wallet.network, x);
                    });
                    allAddresses = addresses;
                    if (allAddresses.length == 0)
                        return cb(null, []);
                    return next();
                });
            },
            function (next) {
                addressStrs = _.map(allAddresses, 'address');
                return next();
            },
            function (next) {
                if (!wallet.isComplete())
                    return next();
                _this._getBlockchainHeight(wallet.coin, wallet.network, function (err, height, hash) {
                    if (err)
                        return next(err);
                    var dustThreshold = Bitcore_[wallet.coin].Transaction.DUST_AMOUNT;
                    bc.getUtxos(wallet, height, function (err, utxos) {
                        if (err)
                            return next(err);
                        if (utxos.length == 0)
                            return cb(null, []);
                        allUtxos = _.filter(utxos, function (x) {
                            return x.satoshis >= dustThreshold;
                        });
                        utxoIndex = _.keyBy(allUtxos, utxoKey);
                        return next();
                    });
                });
            },
            function (next) {
                _this.getPendingTxs({}, function (err, txps) {
                    if (err)
                        return next(err);
                    var lockedInputs = _.map(_.flatten(_.map(txps, 'inputs')), utxoKey);
                    _.each(lockedInputs, function (input) {
                        if (utxoIndex[input]) {
                            utxoIndex[input].locked = true;
                        }
                    });
                    logger_1.default.debug("Got  " + lockedInputs.length + " locked utxos");
                    return next();
                });
            },
            function (next) {
                var now = Math.floor(Date.now() / 1000);
                _this.storage.fetchBroadcastedTxs(_this.walletId, {
                    minTs: now - 24 * 3600,
                    limit: 100
                }, function (err, txs) {
                    if (err)
                        return next(err);
                    var spentInputs = _.map(_.flatten(_.map(txs, 'inputs')), utxoKey);
                    _.each(spentInputs, function (input) {
                        if (utxoIndex[input]) {
                            utxoIndex[input].spent = true;
                        }
                    });
                    allUtxos = _.reject(allUtxos, {
                        spent: true
                    });
                    logger_1.default.debug("Got " + allUtxos.length + " usable UTXOs");
                    return next();
                });
            },
            function (next) {
                if (!opts.excludeMasternode) {
                    return next();
                }
                _this.storage.fetchMasternodes(_this.walletId, undefined, function (err, masternodes) {
                    if (err)
                        return next(err);
                    var lockedInputs1 = _.map(_.flatten(_.map(masternodes, 'txid')), utxoKey1);
                    _.each(lockedInputs1, function (input) {
                        if (utxoIndex[input]) {
                            utxoIndex[input].locked = true;
                        }
                    });
                    logger_1.default.debug("Got  " + masternodes.length + " locked masternode utxos");
                    return next();
                });
            },
            function (next) {
                var addressToPath = _.keyBy(allAddresses, 'address');
                _.each(allUtxos, function (utxo) {
                    if (!addressToPath[utxo.address]) {
                        if (!opts.addresses)
                            _this.logw('Ignored UTXO!: ' + utxo.address);
                        return;
                    }
                    utxo.path = addressToPath[utxo.address].path;
                    utxo.publicKeys = addressToPath[utxo.address].publicKeys;
                });
                return next();
            }
        ], function (err) {
            if (err && err.statusCode == 404) {
                return _this.registerWalletV8(wallet, cb);
            }
            return cb(err, allUtxos);
        });
    };
    WalletService.prototype.getUtxos = function (opts, cb) {
        var _this = this;
        opts = opts || {};
        if (opts.coin) {
            return cb(new clienterror_1.ClientError('coins option no longer supported'));
        }
        if (opts.addresses) {
            if (opts.addresses.length > 1)
                return cb(new clienterror_1.ClientError('Addresses option only support 1 address'));
            this.getWallet({}, function (err, wallet) {
                if (err)
                    return cb(err);
                var bc = _this._getBlockchainExplorer(wallet.coin, wallet.network);
                if (!bc) {
                    return cb(new Error('Could not get blockchain explorer instance'));
                }
                var address = opts.addresses[0];
                var A = Bitcore_[wallet.coin].Address;
                var addrObj = {};
                try {
                    addrObj = new A(address);
                }
                catch (ex) {
                    return cb(null, []);
                }
                if (addrObj.network.name != wallet.network) {
                    return cb(null, []);
                }
                _this._getBlockchainHeight(wallet.coin, wallet.network, function (err, height, hash) {
                    if (err)
                        return cb(err);
                    bc.getAddressUtxos(address, height, function (err, utxos) {
                        if (err)
                            return cb(err);
                        return cb(null, utxos);
                    });
                });
            });
        }
        else {
            this.getUtxosForCurrentWallet({}, cb);
        }
    };
    WalletService.prototype.getCoinsForTx = function (opts, cb) {
        var _this = this;
        this.getWallet({}, function (err, wallet) {
            if (!index_1.ChainService.isUTXOCoin(wallet.coin)) {
                return cb(null, {
                    inputs: [],
                    outputs: []
                });
            }
            var bc = _this._getBlockchainExplorer(wallet.coin, wallet.network);
            if (!bc) {
                return cb(new Error('Could not get blockchain explorer instance'));
            }
            bc.getCoinsForTx(opts.txId, function (err, coins) {
                if (err)
                    return cb(err);
                return cb(null, coins);
            });
        });
    };
    WalletService.prototype.getBalance = function (opts, cb) {
        var _this = this;
        opts = opts || {};
        if (opts.coin) {
            return cb(new clienterror_1.ClientError('coin is not longer supported in getBalance'));
        }
        var wallet = opts.wallet;
        var setWallet = function (cb1) {
            if (wallet)
                return cb1();
            _this.getWallet({}, function (err, ret) {
                if (err)
                    return cb(err);
                wallet = ret;
                return cb1(null, wallet);
            });
        };
        setWallet(function () {
            if (!wallet.isComplete()) {
                var emptyBalance = {
                    totalAmount: 0,
                    lockedAmount: 0,
                    totalConfirmedAmount: 0,
                    lockedConfirmedAmount: 0,
                    availableAmount: 0,
                    availableConfirmedAmount: 0
                };
                return cb(null, emptyBalance);
            }
            _this.syncWallet(wallet, function (err) {
                if (err)
                    return cb(err);
                return index_1.ChainService.getWalletBalance(_this, wallet, opts, cb);
            });
        });
    };
    WalletService.prototype.getSendMaxInfo = function (opts, cb) {
        var _this = this;
        opts = opts || {};
        this.getWallet({}, function (err, wallet) {
            if (err)
                return cb(err);
            var feeArgs = boolToNum(!!opts.feeLevel) + boolToNum(_.isNumber(opts.feePerKb));
            if (feeArgs > 1)
                return cb(new clienterror_1.ClientError('Only one of feeLevel/feePerKb can be specified'));
            if (feeArgs == 0) {
                opts.feeLevel = 'normal';
            }
            var feeLevels = Defaults.FEE_LEVELS[wallet.coin];
            if (opts.feeLevel) {
                if (!_.some(feeLevels, {
                    name: opts.feeLevel
                }))
                    return cb(new clienterror_1.ClientError('Invalid fee level. Valid values are ' + _.map(feeLevels, 'name').join(', ')));
            }
            if (_.isNumber(opts.feePerKb)) {
                if (opts.feePerKb < Defaults.MIN_FEE_PER_KB || opts.feePerKb > Defaults.MAX_FEE_PER_KB[wallet.coin])
                    return cb(new clienterror_1.ClientError('Invalid fee per KB'));
            }
            return index_1.ChainService.getWalletSendMaxInfo(_this, wallet, opts, cb);
        });
    };
    WalletService.prototype._sampleFeeLevels = function (coin, network, points, cb) {
        var _this = this;
        var bc = this._getBlockchainExplorer(coin, network);
        if (!bc)
            return cb(new Error('Could not get blockchain explorer instance'));
        bc.estimateFee(points, function (err, result) {
            if (err) {
                _this.logw('Error estimating fee', err);
                return cb(err);
            }
            var failed = [];
            var levels = _.fromPairs(_.map(points, function (p) {
                var feePerKb = _.isObject(result) && result[p] && _.isNumber(result[p]) ? +result[p] : -1;
                if (feePerKb < 0)
                    failed.push(p);
                return index_1.ChainService.convertFeePerKb(coin, p, feePerKb);
            }));
            if (failed.length) {
                var logger_2 = network == 'livenet' ? _this.logw : _this.logi;
                logger_2('Could not compute fee estimation in ' + network + ': ' + failed.join(', ') + ' blocks.');
            }
            return cb(null, levels, failed.length);
        });
    };
    WalletService.prototype.getFeeLevels = function (opts, cb) {
        var _this = this;
        opts = opts || {};
        opts.coin = opts.coin || Defaults.COIN;
        if (!Utils.checkValueInCollection(opts.coin, Constants.COINS))
            return cb(new clienterror_1.ClientError('Invalid coin'));
        opts.network = opts.network || 'livenet';
        if (!Utils.checkValueInCollection(opts.network, Constants.NETWORKS))
            return cb(new clienterror_1.ClientError('Invalid network'));
        var cacheKey = 'feeLevel:' + opts.coin + ':' + opts.network;
        this.storage.checkAndUseGlobalCache(cacheKey, Defaults.FEE_LEVEL_CACHE_DURATION, function (err, values, oldvalues) {
            if (err)
                return cb(err);
            if (values)
                return cb(null, values, true);
            var feeLevels = Defaults.FEE_LEVELS[opts.coin];
            var samplePoints = function () {
                var definedPoints = _.uniq(_.map(feeLevels, 'nbBlocks'));
                return _.uniq(_.flatten(_.map(definedPoints, function (p) {
                    return _.range(p, p + Defaults.FEE_LEVELS_FALLBACK + 1);
                })));
            };
            var getFeeLevel = function (feeSamples, level, n, fallback) {
                var result;
                if (feeSamples[n] >= 0) {
                    result = {
                        nbBlocks: n,
                        feePerKb: feeSamples[n]
                    };
                }
                else {
                    if (fallback > 0) {
                        result = getFeeLevel(feeSamples, level, n + 1, fallback - 1);
                    }
                    else {
                        result = {
                            feePerKb: level.defaultValue,
                            nbBlocks: null
                        };
                    }
                }
                return result;
            };
            _this._sampleFeeLevels(opts.coin, opts.network, samplePoints(), function (err, feeSamples, failed) {
                if (err) {
                    if (oldvalues) {
                        _this.logw('##  There was an error estimating fees... using old cached values');
                        return cb(null, oldvalues, true);
                    }
                }
                var values = _.map(feeLevels, function (level) {
                    var result = {
                        level: level.name
                    };
                    if (err) {
                        result.feePerKb = level.defaultValue;
                        result.nbBlocks = null;
                    }
                    else {
                        var feeLevel = getFeeLevel(feeSamples, level, level.nbBlocks, Defaults.FEE_LEVELS_FALLBACK);
                        result.feePerKb = +(feeLevel.feePerKb * (level.multiplier || 1)).toFixed(0);
                        result.nbBlocks = feeLevel.nbBlocks;
                    }
                    return result;
                });
                for (var i = 1; i < values.length; i++) {
                    values[i].feePerKb = Math.min(values[i].feePerKb, values[i - 1].feePerKb);
                }
                if (failed > 0) {
                    _this.logw('Not caching default values. Failed:' + failed);
                    return cb(null, values);
                }
                _this.storage.storeGlobalCache(cacheKey, values, function (err) {
                    if (err) {
                        _this.logw('Could not store fee level cache');
                    }
                    return cb(null, values);
                });
            });
        });
    };
    WalletService.prototype._canCreateTx = function (cb) {
        var _this = this;
        this.storage.fetchLastTxs(this.walletId, this.copayerId, 5 + Defaults.BACKOFF_OFFSET, function (err, txs) {
            if (err)
                return cb(err);
            if (!txs.length)
                return cb(null, true);
            var lastRejections = _.takeWhile(txs, {
                status: 'rejected'
            });
            var exceededRejections = lastRejections.length - Defaults.BACKOFF_OFFSET;
            if (exceededRejections <= 0)
                return cb(null, true);
            var lastTxTs = txs[0].createdOn;
            var now = Math.floor(Date.now() / 1000);
            var timeSinceLastRejection = now - lastTxTs;
            var backoffTime = Defaults.BACKOFF_TIME;
            if (timeSinceLastRejection <= backoffTime)
                _this.logd('Not allowing to create TX: timeSinceLastRejection/backoffTime', timeSinceLastRejection, backoffTime);
            return cb(null, timeSinceLastRejection > backoffTime);
        });
    };
    WalletService.prototype._validateOutputs = function (opts, wallet, cb) {
        if (_.isEmpty(opts.outputs))
            return new clienterror_1.ClientError('No outputs were specified');
        for (var i = 0; i < opts.outputs.length; i++) {
            var output = opts.outputs[i];
            output.valid = false;
            try {
                index_1.ChainService.validateAddress(wallet, output.toAddress, opts);
            }
            catch (addrErr) {
                return addrErr;
            }
            if (!checkRequired(output, ['toAddress', 'amount'])) {
                return new clienterror_1.ClientError('Argument missing in output #' + (i + 1) + '.');
            }
            if (!index_1.ChainService.checkValidTxAmount(wallet.coin, output)) {
                return new clienterror_1.ClientError('Invalid amount');
            }
            var error = index_1.ChainService.checkDust(wallet.coin, output, opts);
            if (error)
                return error;
            output.valid = true;
        }
        return null;
    };
    WalletService.prototype._validateAndSanitizeTxOpts = function (wallet, opts, cb) {
        var _this = this;
        async.series([
            function (next) {
                var feeArgs = boolToNum(!!opts.feeLevel) + boolToNum(_.isNumber(opts.feePerKb)) + boolToNum(_.isNumber(opts.fee));
                if (feeArgs > 1)
                    return next(new clienterror_1.ClientError('Only one of feeLevel/feePerKb/fee can be specified'));
                if (feeArgs == 0) {
                    opts.feeLevel = 'normal';
                }
                var feeLevels = Defaults.FEE_LEVELS[wallet.coin];
                if (opts.feeLevel) {
                    if (!_.some(feeLevels, {
                        name: opts.feeLevel
                    }))
                        return next(new clienterror_1.ClientError('Invalid fee level. Valid values are ' + _.map(feeLevels, 'name').join(', ')));
                }
                var error = index_1.ChainService.checkUtxos(wallet.coin, opts);
                if (error) {
                    return next(new clienterror_1.ClientError('fee can only be set when inputs are specified'));
                }
                next();
            },
            function (next) {
                if (wallet.singleAddress && opts.changeAddress)
                    return next(new clienterror_1.ClientError('Cannot specify change address on single-address wallet'));
                next();
            },
            function (next) {
                if (!opts.sendMax)
                    return next();
                if (!_.isArray(opts.outputs) || opts.outputs.length > 1) {
                    return next(new clienterror_1.ClientError('Only one output allowed when sendMax is specified'));
                }
                if (_.isNumber(opts.outputs[0].amount))
                    return next(new clienterror_1.ClientError('Amount is not allowed when sendMax is specified'));
                if (_.isNumber(opts.fee))
                    return next(new clienterror_1.ClientError('Fee is not allowed when sendMax is specified (use feeLevel/feePerKb instead)'));
                _this.getSendMaxInfo({
                    feePerKb: opts.feePerKb,
                    excludeUnconfirmedUtxos: !!opts.excludeUnconfirmedUtxos,
                    returnInputs: true
                }, function (err, info) {
                    if (err)
                        return next(err);
                    opts.outputs[0].amount = info.amount;
                    opts.inputs = info.inputs;
                    return next();
                });
            },
            function (next) {
                if (opts.validateOutputs === false)
                    return next();
                var validationError = _this._validateOutputs(opts, wallet, next);
                if (validationError) {
                    return next(validationError);
                }
                next();
            },
            function (next) {
                if (wallet.coin != 'bch')
                    return next();
                if (!opts.noCashAddr)
                    return next();
                opts.origAddrOutputs = _.map(opts.outputs, function (x) {
                    var ret = {
                        toAddress: x.toAddress,
                        amount: x.amount
                    };
                    if (x.message)
                        ret.message = x.message;
                    return ret;
                });
                opts.returnOrigAddrOutputs = false;
                _.each(opts.outputs, function (x) {
                    if (!x.toAddress)
                        return;
                    var newAddr;
                    try {
                        newAddr = Bitcore_['bch'].Address(x.toAddress).toLegacyAddress();
                    }
                    catch (e) {
                        return next(e);
                    }
                    if (x.txAddress != newAddr) {
                        x.toAddress = newAddr;
                        opts.returnOrigAddrOutputs = true;
                    }
                });
                next();
            }
        ], cb);
    };
    WalletService.prototype._getFeePerKb = function (wallet, opts, cb) {
        var _this = this;
        if (_.isNumber(opts.feePerKb))
            return cb(null, opts.feePerKb);
        this.getFeeLevels({
            coin: wallet.coin,
            network: wallet.network
        }, function (err, levels) {
            if (err)
                return cb(err);
            var level = levels.find(function (l) { return l.level === opts.feeLevel; });
            if (!level) {
                var msg = 'Could not compute fee for "' + opts.feeLevel + '" level';
                _this.logw(msg);
                return cb(new clienterror_1.ClientError(msg));
            }
            return cb(null, level.feePerKb);
        });
    };
    WalletService.prototype._getTransactionCount = function (wallet, address, cb) {
        var _this = this;
        var bc = this._getBlockchainExplorer(wallet.coin, wallet.network);
        if (!bc)
            return cb(new Error('Could not get blockchain explorer instance'));
        bc.getTransactionCount(address, function (err, nonce) {
            if (err) {
                _this.logw('Error estimating nonce', err);
                return cb(err);
            }
            return cb(null, nonce);
        });
    };
    WalletService.prototype.estimateGas = function (opts) {
        var _this = this;
        var bc = this._getBlockchainExplorer(opts.coin, opts.network);
        return new Promise(function (resolve, reject) {
            if (!bc)
                return reject(new Error('Could not get blockchain explorer instance'));
            bc.estimateGas(opts, function (err, gasLimit) {
                if (err) {
                    _this.logw('Error estimating gas limit', err);
                    return reject(err);
                }
                return resolve(gasLimit);
            });
        });
    };
    WalletService.prototype.getMultisigContractInstantiationInfo = function (opts) {
        var _this = this;
        var bc = this._getBlockchainExplorer('eth', opts.network);
        return new Promise(function (resolve, reject) {
            if (!bc)
                return reject(new Error('Could not get blockchain explorer instance'));
            bc.getMultisigContractInstantiationInfo(opts, function (err, contractInstantiationInfo) {
                if (err) {
                    _this.logw('Error getting contract instantiation info', err);
                    return reject(err);
                }
                return resolve(contractInstantiationInfo);
            });
        });
    };
    WalletService.prototype.getMultisigContractInfo = function (opts) {
        var _this = this;
        var bc = this._getBlockchainExplorer('eth', opts.network);
        return new Promise(function (resolve, reject) {
            if (!bc)
                return reject(new Error('Could not get blockchain explorer instance'));
            bc.getMultisigContractInfo(opts, function (err, contractInfo) {
                if (err) {
                    _this.logw('Error getting contract instantiation info', err);
                    return reject(err);
                }
                return resolve(contractInfo);
            });
        });
    };
    WalletService.prototype.getMultisigTxpsInfo = function (opts) {
        var _this = this;
        var bc = this._getBlockchainExplorer('eth', opts.network);
        return new Promise(function (resolve, reject) {
            if (!bc)
                return reject(new Error('Could not get blockchain explorer instance'));
            bc.getMultisigTxpsInfo(opts, function (err, multisigTxpsInfo) {
                if (err) {
                    _this.logw('Error getting contract txps hash', err);
                    return reject(err);
                }
                return resolve(multisigTxpsInfo);
            });
        });
    };
    WalletService.prototype.createTx = function (opts, cb) {
        var _this = this;
        opts = opts ? _.clone(opts) : {};
        var checkTxpAlreadyExists = function (txProposalId, cb) {
            if (!txProposalId)
                return cb();
            _this.storage.fetchTx(_this.walletId, txProposalId, cb);
        };
        this._runLocked(cb, function (cb) {
            var changeAddress, feePerKb, gasPrice, gasLimit, fee;
            _this.getWallet({}, function (err, wallet) {
                if (err)
                    return cb(err);
                if (!wallet.isComplete())
                    return cb(Errors.WALLET_NOT_COMPLETE);
                if (wallet.scanStatus == 'error')
                    return cb(Errors.WALLET_NEED_SCAN);
                checkTxpAlreadyExists(opts.txProposalId, function (err, txp) {
                    if (err)
                        return cb(err);
                    if (txp)
                        return cb(null, txp);
                    async.series([
                        function (next) {
                            if (index_1.ChainService.isUTXOCoin(wallet.coin))
                                return next();
                            _this.getMainAddresses({ reverse: true, limit: 1 }, function (err, mainAddr) {
                                if (err)
                                    return next(err);
                                opts.from = mainAddr[0].address;
                                next();
                            });
                        },
                        function (next) {
                            _this._validateAndSanitizeTxOpts(wallet, opts, next);
                        },
                        function (next) {
                            _this._canCreateTx(function (err, canCreate) {
                                if (err)
                                    return next(err);
                                if (!canCreate)
                                    return next(Errors.TX_CANNOT_CREATE);
                                next();
                            });
                        },
                        function (next) { return __awaiter(_this, void 0, void 0, function () {
                            var error_1;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (opts.sendMax)
                                            return [2, next()];
                                        _a.label = 1;
                                    case 1:
                                        _a.trys.push([1, 3, , 4]);
                                        return [4, index_1.ChainService.getChangeAddress(this, wallet, opts)];
                                    case 2:
                                        changeAddress = _a.sent();
                                        return [3, 4];
                                    case 3:
                                        error_1 = _a.sent();
                                        return [2, next(error_1)];
                                    case 4: return [2, next()];
                                }
                            });
                        }); },
                        function (next) { return __awaiter(_this, void 0, void 0, function () {
                            var error_2;
                            var _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        if (_.isNumber(opts.fee) && !_.isEmpty(opts.inputs))
                                            return [2, next()];
                                        _b.label = 1;
                                    case 1:
                                        _b.trys.push([1, 3, , 4]);
                                        return [4, index_1.ChainService.getFee(this, wallet, opts)];
                                    case 2:
                                        (_a = _b.sent(), feePerKb = _a.feePerKb, gasPrice = _a.gasPrice, gasLimit = _a.gasLimit, fee = _a.fee);
                                        return [3, 4];
                                    case 3:
                                        error_2 = _b.sent();
                                        return [2, next(error_2)];
                                    case 4:
                                        next();
                                        return [2];
                                }
                            });
                        }); },
                        function (next) { return __awaiter(_this, void 0, void 0, function () {
                            var _a, error_3;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        _b.trys.push([0, 2, , 3]);
                                        _a = opts;
                                        return [4, index_1.ChainService.getTransactionCount(this, wallet, opts.from)];
                                    case 1:
                                        _a.nonce = _b.sent();
                                        return [3, 3];
                                    case 2:
                                        error_3 = _b.sent();
                                        return [2, next(error_3)];
                                    case 3: return [2, next()];
                                }
                            });
                        }); },
                        function (next) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                opts.signingMethod = opts.signingMethod || 'ecdsa';
                                opts.coin = opts.coin || wallet.coin;
                                if (!['ecdsa', 'schnorr'].includes(opts.signingMethod)) {
                                    return [2, next(Errors.WRONG_SIGNING_METHOD)];
                                }
                                if (opts.coin != 'bch' && opts.signingMethod == 'schnorr')
                                    return [2, next(Errors.WRONG_SIGNING_METHOD)];
                                return [2, next()];
                            });
                        }); },
                        function (next) {
                            var txOptsFee = fee;
                            if (!txOptsFee) {
                                var useInputFee = opts.inputs && !_.isNumber(opts.feePerKb);
                                var isNotUtxoCoin = !index_1.ChainService.isUTXOCoin(wallet.coin);
                                var shouldUseOptsFee = useInputFee || isNotUtxoCoin;
                                if (shouldUseOptsFee) {
                                    txOptsFee = opts.fee;
                                }
                            }
                            var txOpts = {
                                id: opts.txProposalId,
                                walletId: _this.walletId,
                                creatorId: _this.copayerId,
                                coin: opts.coin,
                                network: wallet.network,
                                outputs: opts.outputs,
                                message: opts.message,
                                from: opts.from,
                                changeAddress: changeAddress,
                                feeLevel: opts.feeLevel,
                                feePerKb: feePerKb,
                                payProUrl: opts.payProUrl,
                                walletM: wallet.m,
                                walletN: wallet.n,
                                excludeUnconfirmedUtxos: !!opts.excludeUnconfirmedUtxos,
                                validateOutputs: !opts.validateOutputs,
                                addressType: wallet.addressType,
                                customData: opts.customData,
                                inputs: opts.inputs,
                                version: opts.txpVersion,
                                fee: txOptsFee,
                                noShuffleOutputs: opts.noShuffleOutputs,
                                gasPrice: gasPrice,
                                nonce: opts.nonce,
                                gasLimit: gasLimit,
                                data: opts.data,
                                tokenAddress: opts.tokenAddress,
                                multisigContractAddress: opts.multisigContractAddress,
                                destinationTag: opts.destinationTag,
                                invoiceID: opts.invoiceID,
                                signingMethod: opts.signingMethod
                            };
                            txp = model_1.TxProposal.create(txOpts);
                            next();
                        },
                        function (next) {
                            return index_1.ChainService.selectTxInputs(_this, txp, wallet, opts, next);
                        },
                        function (next) {
                            if (!changeAddress || wallet.singleAddress || opts.dryRun || opts.changeAddress)
                                return next();
                            _this._store(wallet, txp.changeAddress, next, true);
                        },
                        function (next) {
                            if (opts.dryRun)
                                return next();
                            if (txp.coin == 'bch') {
                                if (opts.noCashAddr && txp.changeAddress) {
                                    txp.changeAddress.address = BCHAddressTranslator.translate(txp.changeAddress.address, 'copay');
                                }
                            }
                            _this.storage.storeTx(wallet.id, txp, next);
                        }
                    ], function (err) {
                        if (err)
                            return cb(err);
                        if (txp.coin == 'bch') {
                            if (opts.returnOrigAddrOutputs) {
                                logger_1.default.info('Returning Orig BCH address outputs for compat');
                                txp.outputs = opts.origAddrOutputs;
                            }
                        }
                        return cb(null, txp);
                    });
                });
            });
        }, 10 * 1000);
    };
    WalletService.prototype.publishTx = function (opts, cb) {
        var _this = this;
        if (!checkRequired(opts, ['txProposalId', 'proposalSignature'], cb))
            return;
        this._runLocked(cb, function (cb) {
            _this.getWallet({}, function (err, wallet) {
                if (err)
                    return cb(err);
                _this.storage.fetchTx(_this.walletId, opts.txProposalId, function (err, txp) {
                    if (err)
                        return cb(err);
                    if (!txp)
                        return cb(Errors.TX_NOT_FOUND);
                    if (!txp.isTemporary())
                        return cb(null, txp);
                    var copayer = wallet.getCopayer(_this.copayerId);
                    var raw;
                    try {
                        if (txp.coin == 'vcl') {
                            raw = txp.getRawTx1();
                        }
                        else {
                            raw = txp.getRawTx();
                        }
                    }
                    catch (ex) {
                        return cb(ex);
                    }
                    var signingKey = _this._getSigningKey(raw, opts.proposalSignature, copayer.requestPubKeys);
                    if (!signingKey) {
                        return cb(new clienterror_1.ClientError('Invalid proposal signature'));
                    }
                    txp.proposalSignature = opts.proposalSignature;
                    if (signingKey.selfSigned) {
                        txp.proposalSignaturePubKey = signingKey.key;
                        txp.proposalSignaturePubKeySig = signingKey.signature;
                    }
                    index_1.ChainService.checkTxUTXOs(_this, txp, opts, function (err) {
                        if (err)
                            return cb(err);
                        txp.status = 'pending';
                        _this.storage.storeTx(_this.walletId, txp, function (err) {
                            if (err)
                                return cb(err);
                            _this._notifyTxProposalAction('NewTxProposal', txp, function () {
                                if (opts.noCashAddr && txp.coin == 'bch') {
                                    if (txp.changeAddress) {
                                        txp.changeAddress.address = BCHAddressTranslator.translate(txp.changeAddress.address, 'copay');
                                    }
                                }
                                return cb(null, txp);
                            });
                        });
                    });
                });
            });
        });
    };
    WalletService.prototype.getTx = function (opts, cb) {
        var _this = this;
        this.storage.fetchTx(this.walletId, opts.txProposalId, function (err, txp) {
            if (err)
                return cb(err);
            if (!txp)
                return cb(Errors.TX_NOT_FOUND);
            if (!txp.txid)
                return cb(null, txp);
            _this.storage.fetchTxNote(_this.walletId, txp.txid, function (err, note) {
                if (err) {
                    _this.logw('Error fetching tx note for ' + txp.txid);
                }
                txp.note = note;
                return cb(null, txp);
            });
        });
    };
    WalletService.prototype.editTxNote = function (opts, cb) {
        var _this = this;
        if (!checkRequired(opts, 'txid', cb))
            return;
        this._runLocked(cb, function (cb) {
            _this.storage.fetchTxNote(_this.walletId, opts.txid, function (err, note) {
                if (err)
                    return cb(err);
                if (!note) {
                    note = model_1.TxNote.create({
                        walletId: _this.walletId,
                        txid: opts.txid,
                        copayerId: _this.copayerId,
                        body: opts.body
                    });
                }
                else {
                    note.edit(opts.body, _this.copayerId);
                }
                _this.storage.storeTxNote(note, function (err) {
                    if (err)
                        return cb(err);
                    _this.storage.fetchTxNote(_this.walletId, opts.txid, cb);
                });
            });
        });
    };
    WalletService.prototype.getTxNote = function (opts, cb) {
        if (!checkRequired(opts, 'txid', cb))
            return;
        this.storage.fetchTxNote(this.walletId, opts.txid, cb);
    };
    WalletService.prototype.getTxNotes = function (opts, cb) {
        opts = opts || {};
        this.storage.fetchTxNotes(this.walletId, opts, cb);
    };
    WalletService.prototype.removeWallet = function (opts, cb) {
        var _this = this;
        this._runLocked(cb, function (cb) {
            _this.storage.removeWallet(_this.walletId, cb);
        });
    };
    WalletService.prototype.getRemainingDeleteLockTime = function (txp) {
        var now = Math.floor(Date.now() / 1000);
        var lockTimeRemaining = txp.createdOn + Defaults.DELETE_LOCKTIME - now;
        if (lockTimeRemaining < 0)
            return 0;
        if (txp.creatorId !== this.copayerId)
            return lockTimeRemaining;
        var approvers = txp.getApprovers();
        if (approvers.length > 1 || (approvers.length == 1 && approvers[0] !== this.copayerId))
            return lockTimeRemaining;
        return 0;
    };
    WalletService.prototype.removePendingTx = function (opts, cb) {
        var _this = this;
        if (!checkRequired(opts, ['txProposalId'], cb))
            return;
        this._runLocked(cb, function (cb) {
            _this.getTx({
                txProposalId: opts.txProposalId
            }, function (err, txp) {
                if (err)
                    return cb(err);
                if (!txp.isPending())
                    return cb(Errors.TX_NOT_PENDING);
                var deleteLockTime = _this.getRemainingDeleteLockTime(txp);
                if (deleteLockTime > 0)
                    return cb(Errors.TX_CANNOT_REMOVE);
                _this.storage.removeTx(_this.walletId, txp.id, function () {
                    _this._notifyTxProposalAction('TxProposalRemoved', txp, cb);
                });
            });
        });
    };
    WalletService.prototype._broadcastRawTx = function (coin, network, raw, cb) {
        var bc = this._getBlockchainExplorer(coin, network);
        if (!bc)
            return cb(new Error('Could not get blockchain explorer instance'));
        bc.broadcast(raw, function (err, txid) {
            if (err)
                return cb(err);
            return cb(null, txid);
        });
    };
    WalletService.prototype.broadcastRawTx = function (opts, cb) {
        if (!checkRequired(opts, ['network', 'rawTx'], cb))
            return;
        opts.coin = opts.coin || Defaults.COIN;
        if (!Utils.checkValueInCollection(opts.coin, Constants.COINS))
            return cb(new clienterror_1.ClientError('Invalid coin'));
        opts.network = opts.network || 'livenet';
        if (!Utils.checkValueInCollection(opts.network, Constants.NETWORKS))
            return cb(new clienterror_1.ClientError('Invalid network'));
        this._broadcastRawTx(opts.coin, opts.network, opts.rawTx, cb);
    };
    WalletService.prototype._checkTxInBlockchain = function (txp, cb) {
        if (!txp.txid)
            return cb();
        var bc = this._getBlockchainExplorer(txp.coin, txp.network);
        if (!bc)
            return cb(new Error('Could not get blockchain explorer instance'));
        bc.getTransaction(txp.txid, function (err, tx) {
            if (err)
                return cb(err);
            return cb(null, !!tx);
        });
    };
    WalletService.prototype.signTx = function (opts, cb) {
        var _this = this;
        if (!checkRequired(opts, ['txProposalId', 'signatures'], cb))
            return;
        opts.maxTxpVersion = opts.maxTxpVersion || 3;
        this.getWallet({}, function (err, wallet) {
            if (err)
                return cb(err);
            _this.getTx({
                txProposalId: opts.txProposalId
            }, function (err, txp) {
                if (err)
                    return cb(err);
                if (opts.maxTxpVersion < txp.version) {
                    return cb(new clienterror_1.ClientError(Errors.codes.UPGRADE_NEEDED, 'Your client does not support signing this transaction. Please upgrade'));
                }
                var action = _.find(txp.actions, {
                    copayerId: _this.copayerId
                });
                if (action)
                    return cb(Errors.COPAYER_VOTED);
                if (!txp.isPending())
                    return cb(Errors.TX_NOT_PENDING);
                if (txp.signingMethod === 'schnorr' && !opts.supportBchSchnorr)
                    return cb(Errors.UPGRADE_NEEDED);
                var copayer = wallet.getCopayer(_this.copayerId);
                try {
                    if (!txp.sign(_this.copayerId, opts.signatures, copayer.xPubKey)) {
                        _this.logw('Error signing transaction (BAD_SIGNATURES)');
                        _this.logw('Client version:', _this.clientVersion);
                        _this.logw('Arguments:', JSON.stringify(opts));
                        _this.logw('Transaction proposal:', JSON.stringify(txp));
                        var raw = index_1.ChainService.getBitcoreTx(txp).uncheckedSerialize();
                        _this.logw('Raw tx:', raw);
                        return cb(Errors.BAD_SIGNATURES);
                    }
                }
                catch (ex) {
                    _this.logw('Error signing transaction proposal', ex);
                    return cb(ex);
                }
                _this.storage.storeTx(_this.walletId, txp, function (err) {
                    if (err)
                        return cb(err);
                    async.series([
                        function (next) {
                            _this._notifyTxProposalAction('TxProposalAcceptedBy', txp, {
                                copayerId: _this.copayerId
                            }, next);
                        },
                        function (next) {
                            if (txp.isAccepted()) {
                                _this._notifyTxProposalAction('TxProposalFinallyAccepted', txp, next);
                            }
                            else {
                                next();
                            }
                        }
                    ], function () {
                        return cb(null, txp);
                    });
                });
            });
        });
    };
    WalletService.prototype._processBroadcast = function (txp, opts, cb) {
        var _this = this;
        $.checkState(txp.txid);
        opts = opts || {};
        txp.setBroadcasted();
        this.storage.storeTx(this.walletId, txp, function (err) {
            if (err)
                return cb(err);
            var extraArgs = {
                txid: txp.txid
            };
            if (opts.byThirdParty) {
                _this._notifyTxProposalAction('NewOutgoingTxByThirdParty', txp, extraArgs);
            }
            else {
                _this._notifyTxProposalAction('NewOutgoingTx', txp, extraArgs);
            }
            return cb(null, txp);
        });
    };
    WalletService.prototype.broadcastTx = function (opts, cb) {
        var _this = this;
        if (!checkRequired(opts, ['txProposalId'], cb))
            return;
        this.getWallet({}, function (err, wallet) {
            if (err)
                return cb(err);
            _this.getTx({
                txProposalId: opts.txProposalId
            }, function (err, txp) {
                if (err)
                    return cb(err);
                if (txp.status == 'broadcasted')
                    return cb(Errors.TX_ALREADY_BROADCASTED);
                if (txp.status != 'accepted')
                    return cb(Errors.TX_NOT_ACCEPTED);
                var raw;
                try {
                    raw = txp.getRawTx();
                }
                catch (ex) {
                    return cb(ex);
                }
                _this._broadcastRawTx(wallet.coin, wallet.network, raw, function (err, txid) {
                    if (err || txid != txp.txid) {
                        if (!err || txp.txid != txid) {
                            logger_1.default.warn("Broadcast failed for: " + raw);
                        }
                        else {
                            logger_1.default.warn("Broadcast failed: " + err);
                        }
                        var broadcastErr_1 = err;
                        _this._checkTxInBlockchain(txp, function (err, isInBlockchain) {
                            if (err)
                                return cb(err);
                            if (!isInBlockchain)
                                return cb(broadcastErr_1 || 'broadcast error');
                            _this._processBroadcast(txp, {
                                byThirdParty: true
                            }, cb);
                        });
                    }
                    else {
                        _this._processBroadcast(txp, {
                            byThirdParty: false
                        }, function (err) {
                            if (err)
                                return cb(err);
                            return cb(null, txp);
                        });
                    }
                });
            });
        });
    };
    WalletService.prototype.rejectTx = function (opts, cb) {
        var _this = this;
        if (!checkRequired(opts, ['txProposalId'], cb))
            return;
        this.getTx({
            txProposalId: opts.txProposalId
        }, function (err, txp) {
            if (err)
                return cb(err);
            var action = _.find(txp.actions, {
                copayerId: _this.copayerId
            });
            if (action)
                return cb(Errors.COPAYER_VOTED);
            if (txp.status != 'pending')
                return cb(Errors.TX_NOT_PENDING);
            txp.reject(_this.copayerId, opts.reason);
            _this.storage.storeTx(_this.walletId, txp, function (err) {
                if (err)
                    return cb(err);
                async.series([
                    function (next) {
                        _this._notifyTxProposalAction('TxProposalRejectedBy', txp, {
                            copayerId: _this.copayerId
                        }, next);
                    },
                    function (next) {
                        if (txp.status == 'rejected') {
                            var rejectedBy = _.map(_.filter(txp.actions, {
                                type: 'reject'
                            }), 'copayerId');
                            _this._notifyTxProposalAction('TxProposalFinallyRejected', txp, {
                                rejectedBy: rejectedBy
                            }, next);
                        }
                        else {
                            next();
                        }
                    }
                ], function () {
                    return cb(null, txp);
                });
            });
        });
    };
    WalletService.prototype.getPendingTxs = function (opts, cb) {
        return __awaiter(this, void 0, void 0, function () {
            var multisigTxpsInfo, txps, error_4;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!opts.tokenAddress) return [3, 1];
                        return [2, cb()];
                    case 1:
                        if (!opts.multisigContractAddress) return [3, 7];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 5, , 6]);
                        return [4, this.getMultisigTxpsInfo(opts)];
                    case 3:
                        multisigTxpsInfo = _a.sent();
                        return [4, this.storage.fetchEthPendingTxs(multisigTxpsInfo)];
                    case 4:
                        txps = _a.sent();
                        return [2, cb(null, txps)];
                    case 5:
                        error_4 = _a.sent();
                        return [2, cb(error_4)];
                    case 6: return [3, 8];
                    case 7:
                        this.storage.fetchPendingTxs(this.walletId, function (err, txps) {
                            if (err)
                                return cb(err);
                            _.each(txps, function (txp) {
                                txp.deleteLockTime = _this.getRemainingDeleteLockTime(txp);
                            });
                            async.each(txps, function (txp, next) {
                                if (txp.status != 'accepted')
                                    return next();
                                _this._checkTxInBlockchain(txp, function (err, isInBlockchain) {
                                    if (err || !isInBlockchain)
                                        return next(err);
                                    _this._processBroadcast(txp, {
                                        byThirdParty: true
                                    }, next);
                                });
                            }, function (err) {
                                txps = _.reject(txps, function (txp) {
                                    return txp.status == 'broadcasted';
                                });
                                if (opts.noCashAddr && txps[0] && txps[0].coin == 'bch') {
                                    _.each(txps, function (x) {
                                        if (x.changeAddress) {
                                            x.changeAddress.address = BCHAddressTranslator.translate(x.changeAddress.address, 'copay');
                                        }
                                        _.each(x.outputs, function (x) {
                                            if (x.toAddress) {
                                                x.toAddress = BCHAddressTranslator.translate(x.toAddress, 'copay');
                                            }
                                        });
                                    });
                                }
                                return cb(err, txps);
                            });
                        });
                        _a.label = 8;
                    case 8: return [2];
                }
            });
        });
    };
    WalletService.prototype.getTxs = function (opts, cb) {
        this.storage.fetchTxs(this.walletId, opts, function (err, txps) {
            if (err)
                return cb(err);
            return cb(null, txps);
        });
    };
    WalletService.prototype.getNotifications = function (opts, cb) {
        var _this = this;
        opts = opts || {};
        this.getWallet({}, function (err, wallet) {
            if (err)
                return cb(err);
            async.map([wallet.coin + ":" + wallet.network, _this.walletId], function (walletId, next) {
                _this.storage.fetchNotifications(walletId, opts.notificationId, opts.minTs || 0, next);
            }, function (err, res) {
                if (err)
                    return cb(err);
                var notifications = _.sortBy(_.map(_.flatten(res), function (n) {
                    n.walletId = _this.walletId;
                    return n;
                }), 'id');
                return cb(null, notifications);
            });
        });
    };
    WalletService.prototype._normalizeTxHistory = function (walletId, txs, dustThreshold, bcHeight, cb) {
        var _this = this;
        if (_.isEmpty(txs))
            return cb(null, txs);
        var now = Math.floor(Date.now() / 1000);
        var indexedFee = _.keyBy(_.filter(txs, { category: 'fee' }), 'txid');
        var indexedSend = _.keyBy(_.filter(txs, { category: 'send' }), 'txid');
        var seenSend = {};
        var seenReceive = {};
        var moves = {};
        txs = _.filter(txs, function (tx) {
            if (tx.category == 'receive') {
                if (tx.satoshis < dustThreshold)
                    return false;
                var output = {
                    address: tx.address,
                    amount: Math.abs(tx.satoshis)
                };
                if (seenReceive[tx.txid]) {
                    seenReceive[tx.txid].outputs.push(output);
                    return false;
                }
                else {
                    tx.outputs = [output];
                    seenReceive[tx.txid] = tx;
                    return true;
                }
            }
            if (tx.category == 'send') {
                var output = {
                    address: tx.address,
                    amount: Math.abs(tx.satoshis)
                };
                if (seenSend[tx.txid]) {
                    seenSend[tx.txid].outputs.push(output);
                    return false;
                }
                else {
                    tx.outputs = [output];
                    seenSend[tx.txid] = tx;
                    return true;
                }
            }
            if (tx.category == 'move' && !indexedSend[tx.txid]) {
                var output = {
                    address: tx.address,
                    amount: Math.abs(tx.satoshis)
                };
                if (moves[tx.txid]) {
                    moves[tx.txid].outputs.push(output);
                    return false;
                }
                else {
                    moves[tx.txid] = tx;
                    tx.outputs = [output];
                    return true;
                }
            }
        });
        _.each(moves, function (v, k) {
            if (v.outputs.length <= 1) {
                delete moves[k];
            }
        });
        var fixMoves = function (cb2) {
            if (_.isEmpty(moves))
                return cb2();
            var moves3 = _.flatten(_.map(_.values(moves), 'outputs'));
            _this.storage.fetchAddressesByWalletId(walletId, _.map(moves3, 'address'), function (err, addrs) {
                if (err)
                    return cb(err);
                var isChangeAddress = _.countBy(_.filter(addrs, { isChange: true }), 'address');
                _.each(moves, function (x) {
                    _.remove(x.outputs, function (i) {
                        return isChangeAddress[i.address];
                    });
                });
                return cb2();
            });
        };
        fixMoves(function (err) {
            if (err)
                return cb(err);
            var ret = _.filter(_.map([].concat(txs), function (tx) {
                var t = new Date(tx.blockTime).getTime() / 1000;
                var c = tx.height >= 0 && bcHeight >= tx.height ? bcHeight - tx.height + 1 : 0;
                var ret = {
                    id: tx.id,
                    txid: tx.txid,
                    confirmations: c,
                    blockheight: tx.height > 0 ? tx.height : null,
                    fees: tx.fee || (indexedFee[tx.txid] ? Math.abs(indexedFee[tx.txid].satoshis) : null),
                    time: t,
                    size: tx.size,
                    amount: 0,
                    action: undefined,
                    addressTo: undefined,
                    outputs: undefined,
                    dust: false
                };
                switch (tx.category) {
                    case 'send':
                        ret.action = 'sent';
                        ret.amount = Math.abs(_.sumBy(tx.outputs, 'amount')) || Math.abs(tx.satoshis);
                        ret.addressTo = tx.outputs ? tx.outputs[0].address : null;
                        ret.outputs = tx.outputs;
                        break;
                    case 'receive':
                        ret.action = 'received';
                        ret.outputs = tx.outputs;
                        ret.amount = Math.abs(_.sumBy(tx.outputs, 'amount')) || Math.abs(tx.satoshis);
                        ret.dust = ret.amount < dustThreshold;
                        break;
                    case 'move':
                        ret.action = 'moved';
                        ret.amount = Math.abs(tx.satoshis);
                        ret.addressTo = tx.outputs && tx.outputs.length ? tx.outputs[0].address : null;
                        ret.outputs = tx.outputs;
                        break;
                    default:
                        ret.action = 'invalid';
                }
                return ret;
            }), function (x) {
                return !x.dust;
            });
            return cb(null, ret);
        });
    };
    WalletService.prototype._getBlockchainHeight = function (coin, network, cb) {
        var _this = this;
        var cacheKey = storage_1.Storage.BCHEIGHT_KEY + ':' + coin + ':' + network;
        this.storage.checkAndUseGlobalCache(cacheKey, Defaults.BLOCKHEIGHT_CACHE_TIME, function (err, values) {
            if (err)
                return cb(err);
            if (values)
                return cb(null, values.current, values.hash, true);
            values = {};
            var bc = _this._getBlockchainExplorer(coin, network);
            if (!bc)
                return cb(new Error('Could not get blockchain explorer instance'));
            bc.getBlockchainHeight(function (err, height, hash) {
                if (!err && height > 0) {
                    values.current = height;
                    values.hash = hash;
                }
                else {
                    return cb(err || 'wrong height');
                }
                _this.storage.storeGlobalCache(cacheKey, values, function (err) {
                    if (err) {
                        _this.logw('Could not store bc heigth cache');
                    }
                    return cb(null, values.current, values.hash);
                });
            });
        });
    };
    WalletService.prototype.updateWalletV8Keys = function (wallet) {
        if (!wallet.beAuthPrivateKey2) {
            this.logd('Adding wallet beAuthKey');
            wallet.updateBEKeys();
        }
    };
    WalletService.prototype.registerWalletV8 = function (wallet, cb) {
        var _this = this;
        if (wallet.beRegistered) {
            return cb();
        }
        var bc = this._getBlockchainExplorer(wallet.coin, wallet.network);
        this.logd('Registering wallet');
        bc.register(wallet, function (err) {
            if (err) {
                return cb(err);
            }
            wallet.beRegistered = true;
            return _this.storage.storeWallet(wallet, function (err) { return cb(err, true); });
        });
    };
    WalletService.prototype.checkWalletSync = function (bc, wallet, simpleRun, cb) {
        var _this = this;
        if (!wallet.addressManager && !wallet.addressManager.receiveAddressIndex)
            return cb(null, true);
        var totalAddresses = wallet.addressManager.receiveAddressIndex + wallet.addressManager.changeAddressIndex;
        this.storage.getWalletAddressChecked(wallet.id, function (err, checkedTotal) {
            if (checkedTotal == totalAddresses) {
                logger_1.default.debug('addresses checked already');
                return cb(null, true);
            }
            if (simpleRun)
                return cb();
            _this.storage.walletCheck({ walletId: wallet.id }).then(function (localCheck) {
                bc.getCheckData(wallet, function (err, serverCheck) {
                    if (err) {
                        _this.logw('Error at bitcore WalletCheck, ignoring' + err);
                        return cb();
                    }
                    var isOK = serverCheck.sum == localCheck.sum;
                    if (isOK) {
                        logger_1.default.debug('Wallet Sync Check OK');
                    }
                    else {
                        logger_1.default.warn('ERROR: Wallet check failed:', localCheck, serverCheck);
                        return cb(null, isOK);
                    }
                    _this.storage.setWalletAddressChecked(wallet.id, totalAddresses, function (err) {
                        return cb(null, isOK);
                    });
                });
            });
        });
    };
    WalletService.prototype.syncWallet = function (wallet, cb, skipCheck, count) {
        var _this = this;
        count = count || 0;
        var bc = this._getBlockchainExplorer(wallet.coin, wallet.network);
        if (!bc) {
            return cb(new Error('Could not get blockchain explorer instance'));
        }
        this.updateWalletV8Keys(wallet);
        this.registerWalletV8(wallet, function (err, justRegistered) {
            if (err) {
                return cb(err);
            }
            _this.checkWalletSync(bc, wallet, true, function (err, isOK) {
                if (isOK && !justRegistered)
                    return cb();
                _this.storage.fetchUnsyncAddresses(_this.walletId, function (err, addresses) {
                    if (err) {
                        return cb(err);
                    }
                    var syncAddr = function (addresses, icb) {
                        if (!addresses || _.isEmpty(addresses)) {
                            return icb();
                        }
                        var addressStr = _.map(addresses, function (x) {
                            index_1.ChainService.addressFromStorageTransform(wallet.coin, wallet.network, x);
                            return x.address;
                        });
                        _this.logd('Syncing addresses: ', addressStr.length);
                        bc.addAddresses(wallet, addressStr, function (err) {
                            if (err)
                                return cb(err);
                            _this.storage.markSyncedAddresses(addressStr, icb);
                        });
                    };
                    syncAddr(addresses, function (err) {
                        if (skipCheck || doNotCheckV8)
                            return cb();
                        _this.checkWalletSync(bc, wallet, false, function (err, isOK) {
                            if (err)
                                return cb();
                            if (isOK)
                                return cb();
                            if (count++ >= 1) {
                                logger_1.default.warn('## ERROR: TRIED TO SYNC WALLET AND FAILED. GIVING UP');
                                return cb();
                            }
                            logger_1.default.info('Trying to RESYNC wallet... count:' + count);
                            wallet.beRegistered = false;
                            _this.storage.deregisterWallet(wallet.id, function () {
                                _this.syncWallet(wallet, cb, false, count);
                            });
                        });
                    });
                });
            });
        });
    };
    WalletService._getResultTx = function (wallet, indexedAddresses, tx, opts) {
        var amountIn, amountOut, amountOutChange;
        var amount, action, addressTo;
        var inputs, outputs, foreignCrafted;
        var sum = function (items, isMine, isChange) {
            if (isChange === void 0) { isChange = false; }
            var filter = {};
            if (_.isBoolean(isMine))
                filter.isMine = isMine;
            if (_.isBoolean(isChange))
                filter.isChange = isChange;
            return _.sumBy(_.filter(items, filter), 'amount');
        };
        var classify = function (items) {
            return _.map(items, function (item) {
                var address = indexedAddresses[item.address];
                return {
                    address: item.address,
                    amount: item.amount,
                    isMine: !!address,
                    isChange: address ? address.isChange || wallet.singleAddress : false
                };
            });
        };
        if (tx.outputs.length || tx.inputs.length) {
            inputs = classify(tx.inputs);
            outputs = classify(tx.outputs);
            amountIn = sum(inputs, true);
            amountOut = sum(outputs, true, false);
            amountOutChange = sum(outputs, true, true);
            if (amountIn == amountOut + amountOutChange + (amountIn > 0 ? tx.fees : 0)) {
                amount = amountOut;
                action = 'moved';
            }
            else {
                amount = amountIn - amountOut - amountOutChange - (amountIn > 0 && amountOutChange > 0 ? tx.fees : 0);
                action = amount > 0 ? 'sent' : 'received';
            }
            amount = Math.abs(amount);
            if (action == 'sent' || action == 'moved') {
                var firstExternalOutput = outputs.find(function (o) { return o.isMine === false; });
                addressTo = firstExternalOutput ? firstExternalOutput.address : null;
            }
            if (action == 'sent' && inputs.length != _.filter(inputs, 'isMine').length) {
                foreignCrafted = true;
            }
        }
        else {
            action = 'invalid';
            amount = 0;
        }
        var formatOutput = function (o) {
            return {
                amount: o.amount,
                address: o.address
            };
        };
        var newTx = {
            txid: tx.txid,
            action: action,
            amount: amount,
            fees: tx.fees,
            time: tx.time,
            addressTo: addressTo,
            confirmations: tx.confirmations,
            foreignCrafted: foreignCrafted,
            outputs: undefined,
            feePerKb: undefined,
            inputs: undefined
        };
        if (_.isNumber(tx.size) && tx.size > 0) {
            newTx.feePerKb = +((tx.fees * 1000) / tx.size).toFixed();
        }
        if (opts.includeExtendedInfo) {
            newTx.inputs = _.map(inputs, function (input) {
                return _.pick(input, 'address', 'amount', 'isMine');
            });
            newTx.outputs = _.map(outputs, function (output) {
                return _.pick(output, 'address', 'amount', 'isMine');
            });
        }
        else {
            outputs = _.filter(outputs, {
                isChange: false
            });
            if (action == 'received') {
                outputs = _.filter(outputs, {
                    isMine: true
                });
            }
            newTx.outputs = _.map(outputs, formatOutput);
        }
        return newTx;
    };
    WalletService._addProposalInfo = function (tx, indexedProposals, opts) {
        opts = opts || {};
        var proposal = indexedProposals[tx.txid];
        if (proposal) {
            tx.createdOn = proposal.createdOn;
            tx.proposalId = proposal.id;
            tx.proposalType = proposal.type;
            tx.creatorName = proposal.creatorName;
            tx.message = proposal.message;
            tx.actions = _.map(proposal.actions, function (action) {
                return _.pick(action, ['createdOn', 'type', 'copayerId', 'copayerName', 'comment']);
            });
            _.each(tx.outputs, function (output) {
                var query = {
                    toAddress: output.address,
                    amount: output.amount
                };
                if (proposal.outputs) {
                    var txpOut = proposal.outputs.find(function (o) { return o.toAddress === output.address && o.amount === output.amount; });
                    output.message = txpOut ? txpOut.message : null;
                }
            });
            tx.customData = proposal.customData;
            tx.createdOn = proposal.createdOn;
            if (opts.includeExtendedInfo) {
                tx.raw = proposal.raw;
            }
        }
    };
    WalletService._addNotesInfo = function (tx, indexedNotes) {
        var note = indexedNotes[tx.txid];
        if (note) {
            tx.note = _.pick(note, ['body', 'editedBy', 'editedByName', 'editedOn']);
        }
    };
    WalletService.prototype.createAdvert = function (opts, cb) {
        var _this = this;
        opts = opts ? _.clone(opts) : {};
        if (!checkRequired(opts, ['title'], cb)) {
            return;
        }
        var checkIfAdvertExistsAlready = function (adId, cb) {
            _this.storage.fetchAdvert(opts.adId, function (err, result) {
                if (err)
                    return cb(err);
                if (result) {
                    return cb(Errors.AD_ALREADY_EXISTS);
                }
                if (!result) {
                    var x = new model_1.Advertisement();
                    x.advertisementId = opts.advertisementId || Uuid.v4();
                    x.name = opts.name;
                    x.title = opts.title;
                    x.country = opts.country;
                    x.type = opts.type;
                    x.body = opts.body;
                    x.imgUrl = opts.imgUrl;
                    x.linkText = opts.linkText;
                    x.linkUrl = opts.linkUrl;
                    x.isAdActive = opts.isAdActive;
                    x.dismissible = opts.dismissible;
                    x.signature = opts.signature;
                    x.app = opts.app;
                    x.isTesting = opts.isTesting;
                    return cb(null, x);
                }
            });
        };
        this._runLocked(cb, function (cb) {
            checkIfAdvertExistsAlready(opts.adId, function (err, advert) {
                if (err)
                    throw err;
                if (advert) {
                    try {
                        _this.storage.storeAdvert(advert, cb);
                    }
                    catch (err) {
                        throw err;
                    }
                }
            });
        }, 10 * 1000);
    };
    WalletService.prototype.getAdvert = function (opts, cb) {
        this.storage.fetchAdvert(opts.adId, function (err, advert) {
            if (err)
                return cb(err);
            return cb(null, advert);
        });
    };
    WalletService.prototype.getAdverts = function (opts, cb) {
        this.storage.fetchActiveAdverts(function (err, adverts) {
            if (err)
                return cb(err);
            return cb(null, adverts);
        });
    };
    WalletService.prototype.getAdvertsByCountry = function (opts, cb) {
        this.storage.fetchAdvertsByCountry(opts.country, function (err, adverts) {
            if (err)
                return cb(err);
            return cb(null, adverts);
        });
    };
    WalletService.prototype.getTestingAdverts = function (opts, cb) {
        this.storage.fetchTestingAdverts(function (err, adverts) {
            if (err)
                return cb(err);
            return cb(null, adverts);
        });
    };
    WalletService.prototype.getAllAdverts = function (opts, cb) {
        var _this = this;
        this._runLocked(cb, function (cb) {
            _this.getAllAdverts(opts, cb);
        });
    };
    WalletService.prototype.removeAdvert = function (opts, cb) {
        var _this = this;
        opts = opts ? _.clone(opts) : {};
        if (!checkRequired(opts, ['adId'], cb)) {
            throw new Error('adId is missing');
        }
        var checkIfAdvertExistsAlready = function (adId, cb) {
            _this.storage.fetchAdvert(opts.adId, function (err, result) {
                if (err)
                    return cb(err);
                if (!result) {
                    throw new Error('Advertisement does not exist: ' + opts.adId);
                }
                if (result) {
                    _this.logw('Advert already exists');
                    return cb(null, adId);
                }
            });
        };
        try {
            this._runLocked(cb, function (cb) {
                checkIfAdvertExistsAlready(opts.adId, function (err, adId) {
                    if (err)
                        throw err;
                    _this.storage.removeAdvert(adId, cb);
                });
            }, 10 * 1000);
        }
        catch (err) {
            throw err;
        }
    };
    WalletService.prototype.activateAdvert = function (opts, cb) {
        opts = opts ? _.clone(opts) : {};
        if (!checkRequired(opts, ['adId'], cb)) {
            throw new Error('adId is missing');
        }
        this.storage.activateAdvert(opts.adId, function (err, result) {
            if (err)
                return cb(err);
            return cb(null, result);
        });
    };
    WalletService.prototype.deactivateAdvert = function (opts, cb) {
        opts = opts ? _.clone(opts) : {};
        if (!checkRequired(opts, ['adId'], cb)) {
            throw new Error('adId is missing');
        }
        this.storage.deactivateAdvert(opts.adId, function (err, result) {
            if (err)
                return cb(err);
            return cb(null, result);
        });
    };
    WalletService.prototype.tagLowFeeTxs = function (wallet, txs, cb) {
        var _this = this;
        var unconfirmed = txs.filter(function (tx) { return tx.confirmations === 0; });
        if (_.isEmpty(unconfirmed))
            return cb();
        this.getFeeLevels({
            coin: wallet.coin,
            network: wallet.network
        }, function (err, levels) {
            if (err) {
                _this.logw('Could not fetch fee levels', err);
            }
            else {
                var level = levels.find(function (l) { return l.level === 'superEconomy'; });
                if (!level || !level.nbBlocks) {
                    _this.logi('Cannot compute super economy fee level from blockchain');
                }
                else {
                    var minFeePerKb_1 = level.feePerKb;
                    _.each(unconfirmed, function (tx) {
                        tx.lowFees = tx.feePerKb < minFeePerKb_1;
                    });
                }
            }
            return cb();
        });
    };
    WalletService.prototype.getTxHistoryV8 = function (bc, wallet, opts, skip, limit, cb) {
        var _this = this;
        var bcHeight, bcHash, sinceTx, lastTxs, cacheStatus, resultTxs = [], fromCache = false;
        var txsToCache = [], fromBc;
        var streamData;
        var streamKey;
        var walletCacheKey = wallet.id;
        if (opts.tokenAddress) {
            wallet.tokenAddress = opts.tokenAddress;
            walletCacheKey = wallet.id + "-" + opts.tokenAddress;
        }
        if (opts.multisigContractAddress) {
            wallet.multisigContractAddress = opts.multisigContractAddress;
            walletCacheKey = wallet.id + "-" + opts.multisigContractAddress;
        }
        async.series([
            function (next) {
                _this.syncWallet(wallet, next, true);
            },
            function (next) {
                _this._getBlockchainHeight(wallet.coin, wallet.network, function (err, height, hash) {
                    if (err)
                        return next(err);
                    bcHeight = height;
                    bcHash = hash;
                    streamKey = (_this.userAgent || '') + '-' + limit + '-' + bcHash;
                    return next();
                });
            },
            function (next) {
                _this.storage.getTxHistoryCacheStatusV8(walletCacheKey, function (err, inCacheStatus) {
                    if (err)
                        return cb(err);
                    cacheStatus = inCacheStatus;
                    return next();
                });
            },
            function (next) {
                if (skip == 0 || !streamKey)
                    return next();
                logger_1.default.debug('Checking streamKey/skip', streamKey, skip);
                _this.storage.getTxHistoryStreamV8(walletCacheKey, function (err, result) {
                    if (err)
                        return next(err);
                    if (!result)
                        return next();
                    if (result.streamKey != streamKey) {
                        logger_1.default.debug('Deleting old stream cache:' + result.streamKey);
                        return _this.storage.clearTxHistoryStreamV8(walletCacheKey, next);
                    }
                    streamData = result.items;
                    logger_1.default.debug("Using stream cache: " + streamData.length + " txs");
                    return next();
                });
            },
            function (next) {
                if (streamData) {
                    lastTxs = streamData;
                    return next();
                }
                var startBlock = cacheStatus.updatedHeight || 0;
                logger_1.default.debug(' ########### GET HISTORY v8 startBlock/bcH]', startBlock, bcHeight);
                bc.getTransactions(wallet, startBlock, function (err, txs) {
                    if (err)
                        return cb(err);
                    var dustThreshold = index_1.ChainService.getDustAmountValue(wallet.coin);
                    _this._normalizeTxHistory(walletCacheKey, txs, dustThreshold, bcHeight, function (err, inTxs) {
                        if (err)
                            return cb(err);
                        if (cacheStatus.tipTxId) {
                            lastTxs = _.takeWhile(inTxs, function (tx) {
                                return tx.txid != cacheStatus.tipTxId;
                            });
                            logger_1.default.info("Storing stream cache for " + walletCacheKey + ": " + lastTxs.length + " txs");
                            return _this.storage.storeTxHistoryStreamV8(walletCacheKey, streamKey, lastTxs, next);
                        }
                        lastTxs = inTxs;
                        return next();
                    });
                });
            },
            function (next) {
                if (lastTxs.length >= skip + limit) {
                    resultTxs = lastTxs.slice(skip, skip + limit);
                    fromCache = false;
                    fromBc = true;
                    return next();
                }
                if (lastTxs.length >= skip) {
                    resultTxs = lastTxs.slice(skip);
                    skip = 0;
                    limit -= resultTxs.length;
                    fromBc = resultTxs.length > 0;
                }
                else {
                    skip -= lastTxs.length;
                }
                _this.storage.getTxHistoryCacheV8(walletCacheKey, skip, limit, function (err, oldTxs) {
                    if (err) {
                        return next(err);
                    }
                    if (oldTxs.length) {
                        fromCache = true;
                    }
                    _.each(oldTxs, function (x) {
                        if (x.blockheight > 0 && bcHeight >= x.blockheight) {
                            x.confirmations = bcHeight - x.blockheight + 1;
                        }
                    });
                    resultTxs = resultTxs.concat(oldTxs);
                    return next();
                });
            },
            function (next) {
                if (streamData) {
                    return next();
                }
                txsToCache = _.filter(lastTxs, function (i) {
                    if (i.confirmations < Defaults.CONFIRMATIONS_TO_START_CACHING) {
                        return false;
                    }
                    if (!cacheStatus.tipHeight)
                        return true;
                    return i.blockheight > cacheStatus.tipHeight;
                });
                logger_1.default.debug("Found " + lastTxs.length + " new txs. Caching " + txsToCache.length);
                if (!txsToCache.length) {
                    return next();
                }
                var updateHeight = bcHeight - Defaults.CONFIRMATIONS_TO_START_CACHING;
                _this.storage.storeTxHistoryCacheV8(walletCacheKey, cacheStatus.tipIndex, txsToCache, updateHeight, next);
            }
        ], function (err) {
            if (err)
                return cb(err);
            return cb(null, {
                items: resultTxs,
                fromCache: fromCache,
                fromBc: fromBc,
                useStream: !!streamData
            });
        });
    };
    WalletService.prototype.getTxHistory = function (opts, cb) {
        var _this = this;
        var bc;
        opts = opts || {};
        opts.limit = _.isUndefined(opts.limit) ? 50 : opts.limit;
        if (opts.limit > Defaults.HISTORY_LIMIT)
            return cb(Errors.HISTORY_LIMIT_EXCEEDED);
        this.getWallet({}, function (err, wallet) {
            if (err)
                return cb(err);
            if (wallet.scanStatus == 'error')
                return cb(Errors.WALLET_NEED_SCAN);
            if (wallet.scanStatus == 'running')
                return cb(Errors.WALLET_BUSY);
            bc = _this._getBlockchainExplorer(wallet.coin, wallet.network);
            if (!bc)
                return cb(new Error('Could not get blockchain explorer instance'));
            var from = opts.skip || 0;
            var to = from + opts.limit;
            async.waterfall([
                function (next) {
                    _this.getTxHistoryV8(bc, wallet, opts, from, opts.limit, next);
                },
                function (txs, next) {
                    if (!txs || _.isEmpty(txs.items)) {
                        return next();
                    }
                    var minTs = _.minBy(txs.items, 'time').time - 7 * 24 * 3600;
                    var maxTs = _.maxBy(txs.items, 'time').time + 1 * 24 * 3600;
                    async.parallel([
                        function (done) {
                            _this.storage.fetchTxs(_this.walletId, {
                                minTs: minTs,
                                maxTs: maxTs
                            }, done);
                        },
                        function (done) {
                            _this.storage.fetchTxNotes(_this.walletId, {
                                minTs: minTs
                            }, done);
                        }
                    ], function (err, res) {
                        return next(err, {
                            txs: txs,
                            txps: res[0],
                            notes: res[1]
                        });
                    });
                }
            ], function (err, res) {
                if (err)
                    return cb(err);
                if (!res)
                    return cb(null, []);
                var indexedProposals = _.keyBy(res.txps, 'txid');
                var indexedNotes = _.keyBy(res.notes, 'txid');
                var finalTxs = _.map(res.txs.items, function (tx) {
                    WalletService._addProposalInfo(tx, indexedProposals, opts);
                    WalletService._addNotesInfo(tx, indexedNotes);
                    return tx;
                });
                _this.tagLowFeeTxs(wallet, finalTxs, function (err) {
                    if (err)
                        _this.logw('Failed to tag unconfirmed with low fee');
                    if (res.txs.fromCache) {
                        var p = '';
                        if (res.txs.fromBc) {
                            p = 'Partial';
                        }
                        _this.logd(p + " History from cache " + from + "/" + to + ": " + finalTxs.length + " txs");
                    }
                    else {
                        _this.logd("History from bc " + from + "/" + to + ": " + finalTxs.length + " txs");
                    }
                    return cb(null, finalTxs, !!res.txs.fromCache, !!res.txs.useStream);
                });
            });
        });
    };
    WalletService.prototype.scan = function (opts, cb) {
        var _this = this;
        opts = opts || {};
        opts.startingStep = opts.startingStep || 1000;
        this.getWallet({}, function (err, wallet) {
            if (err)
                return cb(err);
            if (!wallet.isComplete())
                return cb(Errors.WALLET_NOT_COMPLETE);
            if (wallet.derivationStrategy === Constants.DERIVATION_STRATEGIES.BIP44) {
                opts.includeCopayerBranches = false;
            }
            if (opts.includeCopayerBranches) {
                opts.startingStep = 1;
            }
            _this.storage.clearWalletCache(_this.walletId, function () {
                if (wallet.singleAddress)
                    return cb();
                if (!index_1.ChainService.isUTXOCoin(wallet.coin))
                    return cb();
                _this._runLocked(cb, function (cb) {
                    wallet.scanStatus = 'running';
                    _this.storage.storeWallet(wallet, function (err) {
                        if (err)
                            return cb(err);
                        var bc = _this._getBlockchainExplorer(wallet.coin, wallet.network);
                        if (!bc)
                            return cb(new Error('Could not get blockchain explorer instance'));
                        opts.bc = bc;
                        var step = opts.startingStep;
                        async.doWhilst(function (next) {
                            _this._runScan(wallet, step, opts, next);
                        }, function () {
                            step = step / 10;
                            return step >= 1;
                        }, cb);
                    });
                });
            });
        });
    };
    WalletService.prototype._runScan = function (wallet, step, opts, cb) {
        var _this = this;
        var scanBranch = function (wallet, derivator, cb) {
            var inactiveCounter = 0;
            var allAddresses = [];
            var gap = Defaults.SCAN_ADDRESS_GAP;
            if (step > 1) {
                gap = _.min([gap, 3]);
            }
            async.whilst(function () {
                return inactiveCounter < gap;
            }, function (next) {
                var address = derivator.derive();
                opts.bc.getAddressActivity(address.address, function (err, activity) {
                    if (err)
                        return next(err);
                    allAddresses.push(address);
                    inactiveCounter = activity ? 0 : inactiveCounter + 1;
                    return next();
                });
            }, function (err) {
                derivator.rewind(gap);
                return cb(err, _.dropRight(allAddresses, gap));
            });
        };
        var derivators = [];
        _.each([false, true], function (isChange) {
            derivators.push({
                id: wallet.addressManager.getBaseAddressPath(isChange),
                derive: _.bind(wallet.createAddress, wallet, isChange, step),
                index: _.bind(wallet.addressManager.getCurrentIndex, wallet.addressManager, isChange),
                rewind: _.bind(wallet.addressManager.rewindIndex, wallet.addressManager, isChange, step),
                getSkippedAddress: _.bind(wallet.getSkippedAddress, wallet)
            });
            if (opts.includeCopayerBranches) {
                _.each(wallet.copayers, function (copayer) {
                    if (copayer.addressManager) {
                        derivators.push({
                            id: copayer.addressManager.getBaseAddressPath(isChange),
                            derive: _.bind(copayer.createAddress, copayer, wallet, isChange),
                            index: _.bind(copayer.addressManager.getCurrentIndex, copayer.addressManager, isChange),
                            rewind: _.bind(copayer.addressManager.rewindIndex, copayer.addressManager, isChange, step)
                        });
                    }
                });
            }
        });
        async.eachSeries(derivators, function (derivator, next) {
            var addresses = [];
            scanBranch(wallet, derivator, function (err, scannedAddresses) {
                if (err)
                    return next(err);
                addresses = addresses.concat(scannedAddresses);
                if (step > 1) {
                    _this.logd('Deriving addresses for scan steps gaps DERIVATOR:' + derivator.id);
                    var addr = void 0, i = 0;
                    while ((addr = derivator.getSkippedAddress())) {
                        addresses.push(addr);
                        i++;
                    }
                }
                _this._store(wallet, addresses, next);
            });
        }, function (error) {
            _this.storage.fetchWallet(wallet.id, function (err, wallet) {
                if (err)
                    return cb(err);
                wallet.scanStatus = error ? 'error' : 'success';
                _this.storage.storeWallet(wallet, function (err) {
                    return cb(error || err);
                });
            });
        });
    };
    WalletService.prototype.startScan = function (opts, cb) {
        var _this = this;
        var scanFinished = function (err) {
            var data = {
                result: err ? 'error' : 'success',
                error: undefined
            };
            if (err)
                data.error = err;
            _this._notify('ScanFinished', data, {
                isGlobal: true
            });
        };
        this.getWallet({}, function (err, wallet) {
            if (err)
                return cb(err);
            if (!wallet.isComplete())
                return cb(Errors.WALLET_NOT_COMPLETE);
            if (wallet.singleAddress)
                return cb();
            if (!index_1.ChainService.isUTXOCoin(wallet.coin))
                return cb();
            setTimeout(function () {
                wallet.beRegistered = false;
                _this.storage.deregisterWallet(wallet.id, function () {
                    _this.scan(opts, scanFinished);
                });
            }, 100);
            return cb(null, {
                started: true
            });
        });
    };
    WalletService.prototype.getFiatRate = function (opts, cb) {
        if (!checkRequired(opts, ['code'], cb))
            return;
        this.fiatRateService.getRate(opts, function (err, rate) {
            if (err)
                return cb(err);
            return cb(null, rate);
        });
    };
    WalletService.prototype.getHistoricalRates = function (opts, cb) {
        if (!checkRequired(opts, ['code'], cb))
            return;
        this.fiatRateService.getHistoricalRates(opts, function (err, rates) {
            if (err)
                return cb(err);
            return cb(null, rates);
        });
    };
    WalletService.prototype.pushNotificationsSubscribe = function (opts, cb) {
        if (!checkRequired(opts, ['token'], cb))
            return;
        var sub = model_1.PushNotificationSub.create({
            copayerId: this.copayerId,
            token: opts.token,
            packageName: opts.packageName,
            platform: opts.platform
        });
        this.storage.storePushNotificationSub(sub, cb);
    };
    WalletService.prototype.pushNotificationsUnsubscribe = function (opts, cb) {
        if (!checkRequired(opts, ['token'], cb))
            return;
        this.storage.removePushNotificationSub(this.copayerId, opts.token, cb);
    };
    WalletService.prototype.txConfirmationSubscribe = function (opts, cb) {
        if (!checkRequired(opts, ['txid'], cb))
            return;
        var sub = model_1.TxConfirmationSub.create({
            copayerId: this.copayerId,
            walletId: this.walletId,
            txid: opts.txid
        });
        this.storage.storeTxConfirmationSub(sub, cb);
    };
    WalletService.prototype.txConfirmationUnsubscribe = function (opts, cb) {
        if (!checkRequired(opts, ['txid'], cb))
            return;
        this.storage.removeTxConfirmationSub(this.copayerId, opts.txid, cb);
    };
    WalletService.prototype.simplexGetKeys = function (req) {
        if (!config.simplex)
            throw new Error('Simplex missing credentials');
        var env = 'sandbox';
        if (req.body.env && req.body.env == 'production') {
            env = 'production';
        }
        delete req.body.env;
        var keys = {
            API: config.simplex[env].api,
            API_KEY: config.simplex[env].apiKey,
            APP_PROVIDER_ID: config.simplex[env].appProviderId
        };
        return keys;
    };
    WalletService.prototype.simplexGetQuote = function (req) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var keys = _this.simplexGetKeys(req);
            var API = keys.API;
            var API_KEY = keys.API_KEY;
            var ip = Utils.getIpFromReq(req);
            req.body.client_ip = ip;
            req.body.wallet_id = keys.APP_PROVIDER_ID;
            var headers = {
                'Content-Type': 'application/json',
                Authorization: 'ApiKey ' + API_KEY
            };
            _this.request.post(API + '/wallet/merchant/v2/quote', {
                headers: headers,
                body: req.body,
                json: true
            }, function (err, data) {
                if (err) {
                    return reject(err.body ? err.body : err);
                }
                else {
                    return resolve(data.body ? data.body : null);
                }
            });
        });
    };
    WalletService.prototype.simplexPaymentRequest = function (req) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var keys = _this.simplexGetKeys(req);
            var API = keys.API;
            var API_KEY = keys.API_KEY;
            var appProviderId = keys.APP_PROVIDER_ID;
            var paymentId = Uuid.v4();
            var orderId = Uuid.v4();
            var apiHost = keys.API;
            var ip = Utils.getIpFromReq(req);
            if (!checkRequired(req.body, ['account_details', 'transaction_details']) &&
                !checkRequired(req.body.transaction_details, ['payment_details'])) {
                return reject(new clienterror_1.ClientError("Simplex's request missing arguments"));
            }
            req.body.account_details.app_provider_id = appProviderId;
            req.body.account_details.signup_login = {
                ip: ip,
                location: '',
                uaid: '',
                accept_language: 'de,en-US;q=0.7,en;q=0.3',
                http_accept_language: 'de,en-US;q=0.7,en;q=0.3',
                user_agent: req.body.account_details.signup_login ? req.body.account_details.signup_login.user_agent : '',
                cookie_session_id: '',
                timestamp: req.body.account_details.signup_login ? req.body.account_details.signup_login.timestamp : ''
            };
            req.body.transaction_details.payment_details.payment_id = paymentId;
            req.body.transaction_details.payment_details.order_id = orderId;
            var headers = {
                'Content-Type': 'application/json',
                Authorization: 'ApiKey ' + API_KEY
            };
            _this.request.post(API + '/wallet/merchant/v2/payments/partner/data', {
                headers: headers,
                body: req.body,
                json: true
            }, function (err, data) {
                if (err) {
                    return reject(err.body ? err.body : err);
                }
                else {
                    data.body.payment_id = paymentId;
                    data.body.order_id = orderId;
                    data.body.app_provider_id = appProviderId;
                    data.body.api_host = apiHost;
                    return resolve(data.body);
                }
            });
        });
    };
    WalletService.prototype.simplexGetEvents = function (req) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!config.simplex)
                return reject(new Error('Simplex missing credentials'));
            if (!req.env || (req.env != 'sandbox' && req.env != 'production'))
                return reject(new Error("Simplex's request wrong environment"));
            var API = config.simplex[req.env].api;
            var API_KEY = config.simplex[req.env].apiKey;
            var headers = {
                'Content-Type': 'application/json',
                Authorization: 'ApiKey ' + API_KEY
            };
            _this.request.get(API + '/wallet/merchant/v2/events', {
                headers: headers,
                json: true
            }, function (err, data) {
                if (err) {
                    return reject(err.body ? err.body : null);
                }
                else {
                    return resolve(data.body ? data.body : null);
                }
            });
        });
    };
    WalletService.prototype.wyreGetKeys = function (req) {
        if (!config.wyre)
            throw new Error('Wyre missing credentials');
        var env = 'sandbox';
        if (req.body.env && req.body.env == 'production') {
            env = 'production';
        }
        delete req.body.env;
        var keys = {
            API: config.wyre[env].api,
            API_KEY: config.wyre[env].apiKey,
            SECRET_API_KEY: config.wyre[env].secretApiKey,
            ACCOUNT_ID: config.wyre[env].appProviderAccountId
        };
        return keys;
    };
    WalletService.prototype.wyreWalletOrderQuotation = function (req) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var keys = _this.wyreGetKeys(req);
            req.body.accountId = keys.ACCOUNT_ID;
            if (!checkRequired(req.body, ['amount', 'sourceCurrency', 'destCurrency', 'dest', 'country'])) {
                return reject(new clienterror_1.ClientError("Wyre's request missing arguments"));
            }
            var URL = keys.API + "/v3/orders/quote/partner?timestamp=" + Date.now().toString();
            var XApiSignature = URL + JSON.stringify(req.body);
            var XApiSignatureHash = Bitcore.crypto.Hash.sha256hmac(Buffer.from(XApiSignature), Buffer.from(keys.SECRET_API_KEY)).toString('hex');
            var headers = {
                'Content-Type': 'application/json',
                'X-Api-Key': keys.API_KEY,
                'X-Api-Signature': XApiSignatureHash
            };
            _this.request.post(URL, {
                headers: headers,
                body: req.body,
                json: true
            }, function (err, data) {
                if (err) {
                    return reject(err.body ? err.body : err);
                }
                else {
                    return resolve(data.body);
                }
            });
        });
    };
    WalletService.prototype.wyreWalletOrderReservation = function (req) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var keys = _this.wyreGetKeys(req);
            req.body.referrerAccountId = keys.ACCOUNT_ID;
            if (!checkRequired(req.body, ['amount', 'sourceCurrency', 'destCurrency', 'dest', 'paymentMethod'])) {
                return reject(new clienterror_1.ClientError("Wyre's request missing arguments"));
            }
            var URL = keys.API + "/v3/orders/reserve?timestamp=" + Date.now().toString();
            var XApiSignature = URL + JSON.stringify(req.body);
            var XApiSignatureHash = Bitcore.crypto.Hash.sha256hmac(Buffer.from(XApiSignature), Buffer.from(keys.SECRET_API_KEY)).toString('hex');
            var headers = {
                'Content-Type': 'application/json',
                'X-Api-Key': keys.API_KEY,
                'X-Api-Signature': XApiSignatureHash
            };
            _this.request.post(URL, {
                headers: headers,
                body: req.body,
                json: true
            }, function (err, data) {
                if (err) {
                    return reject(err.body ? err.body : err);
                }
                else {
                    return resolve(data.body);
                }
            });
        });
    };
    WalletService.prototype.getMasternodeCollateral = function (opts, cb) {
        var _this = this;
        opts = opts || {};
        if (opts.coin) {
            return cb(new clienterror_1.ClientError('coin is not longer supported in getMasternodeCollateral'));
        }
        this.getWallet({}, function (err, wallet) {
            if (err)
                return cb(err);
            if (!wallet.isComplete())
                return cb(Errors.WALLET_NOT_COMPLETE);
            if (wallet.scanStatus == 'error')
                return cb(Errors.WALLET_NEED_SCAN);
            if (wallet.n != 1 && wallet.m != 1)
                return cb(Errors.WALLET_NOT_MASTERNODE);
            if (wallet.addressType != Constants.SCRIPT_TYPES.P2PKH)
                return cb(Errors.WALLET_NOT_MASTERNODE);
            _this.getUtxosForCurrentWallet({
                coin: opts.coin
            }, function (err, utxos) {
                if (err)
                    return cb(err);
                var ret = new Array();
                _.each(utxos, function (utxo) {
                    if (utxo.satoshis == COLLATERAL_COIN) {
                        ret.push(utxo);
                    }
                });
                return cb(null, ret);
            });
        });
    };
    WalletService.prototype.removeMasternodes = function (opts, cb) {
        var _this = this;
        opts = opts || {};
        opts.coin = opts.coin || Defaults.COIN;
        if (!Utils.checkValueInCollection(opts.coin, Constants.COINS)) {
            return cb(new clienterror_1.ClientError('Invalid coin'));
        }
        if (opts.coin != 'vcl') {
            return cb(new clienterror_1.ClientError('coin is not longer supported in broadcastMasternode'));
        }
        opts.network = opts.network || 'livenet';
        if (!Utils.checkValueInCollection(opts.network, Constants.NETWORKS)) {
            return cb(new clienterror_1.ClientError('Invalid network'));
        }
        this.getWallet({}, function (err, wallet) {
            if (err)
                return cb(err);
            if (!wallet.isComplete())
                return cb(Errors.WALLET_NOT_COMPLETE);
            if (wallet.scanStatus == 'error')
                return cb(Errors.WALLET_NEED_SCAN);
            _this.storage.removeMasternodes(wallet.id, opts.txid, cb);
        });
    };
    WalletService.prototype.getMasternodes = function (opts, cb) {
        var _this = this;
        opts = opts || {};
        opts.coin = opts.coin || Defaults.COIN;
        if (!Utils.checkValueInCollection(opts.coin, Constants.COINS)) {
            return cb(new clienterror_1.ClientError('Invalid coin'));
        }
        if (opts.coin != 'vcl') {
            return cb(new clienterror_1.ClientError('coin is not longer supported in masternodes'));
        }
        opts.network = opts.network || 'livenet';
        if (!Utils.checkValueInCollection(opts.network, Constants.NETWORKS)) {
            return cb(new clienterror_1.ClientError('Invalid network'));
        }
        this.getWallet({}, function (err, wallet) {
            if (err)
                return cb(err);
            if (!wallet.isComplete())
                return cb(Errors.WALLET_NOT_COMPLETE);
            if (wallet.scanStatus == 'error')
                return cb(Errors.WALLET_NEED_SCAN);
            _this.storage.fetchMasternodes(wallet.id, opts.txid, cb);
        });
    };
    WalletService.prototype.getMasternodeStatus = function (opts, cb) {
        opts = opts || {};
        opts.coin = opts.coin || Defaults.COIN;
        if (!Utils.checkValueInCollection(opts.coin, Constants.COINS)) {
            return cb(new clienterror_1.ClientError('Invalid coin'));
        }
        if (opts.coin != 'vcl') {
            return cb(new clienterror_1.ClientError('coin is not longer supported in MasternodeStatus'));
        }
        opts.network = opts.network || 'livenet';
        if (!Utils.checkValueInCollection(opts.network, Constants.NETWORKS)) {
            return cb(new clienterror_1.ClientError('Invalid network'));
        }
        var bc = this._getBlockchainExplorer(opts.coin, opts.network);
        if (!bc)
            return cb(new Error('Could not get blockchain explorer instance'));
        bc.getMasternodeStatus(opts, function (err, ret) {
            if (err)
                return cb(err);
            return cb(null, ret);
        });
    };
    WalletService.prototype.broadcastMasternode = function (opts, cb) {
        var _this = this;
        opts = opts || {};
        opts.coin = opts.coin || Defaults.COIN;
        if (!Utils.checkValueInCollection(opts.coin, Constants.COINS)) {
            return cb(new clienterror_1.ClientError('Invalid coin'));
        }
        if (opts.coin != 'vcl') {
            return cb(new clienterror_1.ClientError('coin is not longer supported in broadcastMasternode'));
        }
        if (!opts.masternodeKey) {
            return cb(new clienterror_1.ClientError('Invalid masternode private key'));
        }
        opts.network = opts.network || 'livenet';
        if (!Utils.checkValueInCollection(opts.network, Constants.NETWORKS)) {
            return cb(new clienterror_1.ClientError('Invalid network'));
        }
        this.getWallet({}, function (err, wallet) {
            if (err)
                return cb(err);
            if (!wallet.isComplete())
                return cb(Errors.WALLET_NOT_COMPLETE);
            if (wallet.scanStatus == 'error')
                return cb(Errors.WALLET_NEED_SCAN);
            var bc = _this._getBlockchainExplorer(opts.coin, opts.network);
            if (!bc)
                return cb(new Error('Could not get blockchain explorer instance'));
            bc.broadcastMasternode(opts.rawTx, function (err, ret) {
                if (err)
                    return cb(err);
                var masternodeStatus = {};
                if (!ret.errorMessage) {
                    _.forEach(_.keys(ret), function (key) {
                        if (ret[key].outpoint && ret[key].addr) {
                            masternodeStatus.coin = wallet.coin;
                            masternodeStatus.network = wallet.network;
                            masternodeStatus.address = ret[key].addr;
                            masternodeStatus.txid = ret[key].outpoint;
                            masternodeStatus.masternodeKey = opts.masternodeKey;
                            masternodeStatus.status = 'PRE_ENABLED';
                            masternodeStatus.walletId = wallet.id;
                            return;
                        }
                    });
                    var masternodes_2 = masternodes_1.Masternodes.create(masternodeStatus);
                    _this.storage.storeMasternode(wallet.id, masternodes_2, function (err) {
                        if (!err) {
                            _this._notify('NewMasternode', {
                                coin: masternodes_2.coin,
                                network: masternodes_2.network,
                                address: masternodes_2.address,
                                txid: masternodes_2.txid,
                                masternodeKey: masternodes_2.masternodeKey,
                                status: masternodes_2.status
                            }, function () { });
                        }
                    });
                }
                return cb(null, ret);
            });
        });
    };
    WalletService.prototype.getMasternodePing = function (opts, cb) {
        var _this = this;
        opts = opts || {};
        opts.coin = opts.coin || Defaults.COIN;
        if (!Utils.checkValueInCollection(opts.coin, Constants.COINS)) {
            return cb(new clienterror_1.ClientError('Invalid coin'));
        }
        opts.network = opts.network || 'livenet';
        if (!Utils.checkValueInCollection(opts.network, Constants.NETWORKS)) {
            return cb(new clienterror_1.ClientError('Invalid network'));
        }
        if (!opts.txid) {
            return cb(new clienterror_1.ClientError('not utxo txid'));
        }
        if (!opts.vout) {
            return cb(new clienterror_1.ClientError('not utxo vout'));
        }
        async.series([
            function (next) {
                _this.getUtxosForCurrentWallet({
                    coin: opts.coin
                }, function (err, utxos) {
                    if (err)
                        return cb(err);
                    var bfind = false;
                    _.each(utxos, function (utxo) {
                        if (utxo.txid == opts.txid && utxo.vout == opts.vout && utxo.satoshis == COLLATERAL_COIN) {
                            opts.address = utxo.address;
                            opts.publicKeys = utxo.publicKeys;
                            opts.path = utxo.path;
                            opts.confirmations = utxo.confirmations;
                            bfind = true;
                            return false;
                        }
                    });
                    if (bfind) {
                        if (opts.confirmations >= MASTERNODE_MIN_CONFIRMATIONS) {
                            next();
                        }
                        else {
                            return cb('Collateral payment must have at least 15 confirmations');
                        }
                    }
                    else {
                        return cb('Invalid utxo');
                    }
                });
            },
            function (next) {
                _this._getBlockchainHeight(opts.coin, opts.network, function (err, height, hash) {
                    opts.currentHeight = height;
                    if (err)
                        return cb(err);
                    next();
                });
            },
            function (next) {
                var bc = _this._getBlockchainExplorer(opts.coin, opts.network);
                if (!bc)
                    return cb(new Error('Could not get blockchain explorer instance'));
                bc.getBlockHashInHeight(opts.currentHeight - 12, function (err, height, hash) {
                    if (!err && height > 0) {
                        opts.pingHeight = height;
                        opts.pingHash = hash;
                        return cb(null, opts);
                    }
                    else {
                        return cb(err || 'wrong height');
                    }
                });
            }
        ], function (err) {
            if (err)
                return cb(err);
        });
    };
    return WalletService;
}());
exports.WalletService = WalletService;
function checkRequired(obj, args, cb) {
    var missing = Utils.getMissingFields(obj, args);
    if (_.isEmpty(missing)) {
        return true;
    }
    if (_.isFunction(cb)) {
        return cb(new clienterror_1.ClientError('Required argument: ' + _.first(missing) + ' missing.'));
    }
    return false;
}
//# sourceMappingURL=server.js.map