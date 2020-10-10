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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var lodash_1 = __importDefault(require("lodash"));
require("source-map-support/register");
var logger_1 = require("./logger");
var clienterror_1 = require("./errors/clienterror");
var middleware_1 = require("./middleware");
var server_1 = require("./server");
var stats_1 = require("./stats");
var bodyParser = require('body-parser');
var compression = require('compression');
var config = require('../config');
var RateLimit = require('express-rate-limit');
var Common = require('./common');
var rp = require('request-promise-native');
var Defaults = Common.Defaults;
var ExpressApp = (function () {
    function ExpressApp() {
        this.app = express_1.default();
    }
    ExpressApp.prototype.start = function (opts, cb) {
        var _this = this;
        opts = opts || {};
        this.app.use(compression());
        this.app.use(function (req, res, next) {
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
            res.setHeader('Access-Control-Allow-Headers', 'x-signature,x-identity,x-session,x-client-version,x-wallet-id,X-Requested-With,Content-Type,Authorization');
            res.setHeader('x-service-version', server_1.WalletService.getServiceVersion());
            next();
        });
        var allowCORS = function (req, res, next) {
            if ('OPTIONS' == req.method) {
                res.sendStatus(200);
                res.end();
                return;
            }
            next();
        };
        this.app.use(allowCORS);
        this.app.enable('trust proxy');
        this.app.use(function (req, res, next) {
            req.on('abort', function () {
                logger_1.logger.warn('Request aborted by the client');
            });
            next();
        });
        var POST_LIMIT = 1024 * 100;
        this.app.use(bodyParser.json({
            limit: POST_LIMIT
        }));
        this.app.use(function (req, res, next) {
            if (config.maintenanceOpts.maintenanceMode === true) {
                var errorCode = 503;
                var errorMessage = 'BWS down for maintenance';
                res.status(503).send({ code: errorCode, message: errorMessage });
            }
            else {
                next();
            }
        });
        if (opts.disableLogs) {
            logger_1.transport.level = 'error';
        }
        else {
            this.app.use(middleware_1.LogMiddleware());
        }
        var router = express_1.default.Router();
        var returnError = function (err, res, req) {
            if (err instanceof clienterror_1.ClientError) {
                var status = err.code == 'NOT_AUTHORIZED' ? 401 : 400;
                if (!opts.disableLogs)
                    logger_1.logger.info('Client Err: ' + status + ' ' + req.url + ' ' + JSON.stringify(err));
                res
                    .status(status)
                    .json({
                    code: err.code,
                    message: err.message
                })
                    .end();
            }
            else {
                var code = 500, message = void 0;
                if (err && ((err.code && lodash_1.default.isNumber(err.code)) || (err.statusCode && lodash_1.default.isNumber(err.statusCode)))) {
                    code = err.code || err.statusCode;
                    message = err.message || err.body;
                }
                var m = message || err.toString();
                if (!opts.disableLogs)
                    logger_1.logger.error(req.url + ' :' + code + ':' + m);
                res
                    .status(code || 500)
                    .json({
                    error: m
                })
                    .end();
            }
        };
        var logDeprecated = function (req) {
            logger_1.logger.warn('DEPRECATED', req.method, req.url, '(' + req.header('x-client-version') + ')');
        };
        var getCredentials = function (req) {
            var identity = req.header('x-identity');
            if (!identity)
                return;
            return {
                copayerId: identity,
                signature: req.header('x-signature'),
                session: req.header('x-session')
            };
        };
        var getServer = function (req, res) {
            var opts = {
                clientVersion: req.header('x-client-version'),
                userAgent: req.header('user-agent')
            };
            return server_1.WalletService.getInstance(opts);
        };
        var getServerWithAuth = function (req, res, opts, cb) {
            if (lodash_1.default.isFunction(opts)) {
                cb = opts;
                opts = {};
            }
            opts = opts || {};
            var credentials = getCredentials(req);
            if (!credentials)
                return returnError(new clienterror_1.ClientError({
                    code: 'NOT_AUTHORIZED'
                }), res, req);
            var auth = {
                copayerId: credentials.copayerId,
                message: req.method.toLowerCase() + '|' + req.url + '|' + JSON.stringify(req.body),
                signature: credentials.signature,
                clientVersion: req.header('x-client-version'),
                userAgent: req.header('user-agent'),
                walletId: req.header('x-wallet-id'),
                session: undefined
            };
            if (opts.allowSession) {
                auth.session = credentials.session;
            }
            server_1.WalletService.getInstanceWithAuth(auth, function (err, server) {
                if (err)
                    return returnError(err, res, req);
                if (opts.onlySupportStaff && !server.copayerIsSupportStaff) {
                    return returnError(new clienterror_1.ClientError({
                        code: 'NOT_AUTHORIZED'
                    }), res, req);
                }
                if (server.copayerIsSupportStaff) {
                    req.isSupportStaff = true;
                }
                if (opts.onlyMarketingStaff && !server.copayerIsMarketingStaff) {
                    return returnError(new clienterror_1.ClientError({
                        code: 'NOT_AUTHORIZED'
                    }), res, req);
                }
                req.walletId = server.walletId;
                req.copayerId = server.copayerId;
                return cb(server);
            });
        };
        var createWalletLimiter;
        if (Defaults.RateLimit.createWallet && !opts.ignoreRateLimiter) {
            logger_1.logger.info('', 'Limiting wallet creation per IP: %d req/h', ((Defaults.RateLimit.createWallet.max / Defaults.RateLimit.createWallet.windowMs) * 60 * 60 * 1000).toFixed(2));
            createWalletLimiter = new RateLimit(Defaults.RateLimit.createWallet);
        }
        else {
            createWalletLimiter = function (req, res, next) {
                next();
            };
        }
        var ONE_MINUTE = 60;
        function SetPublicCache(res, seconds) {
            res.setHeader('Cache-Control', "public, max-age=" + seconds + ", stale-if-error=" + 10 * seconds);
        }
        router.get('/latest-version', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var options, server_2;
            var _this = this;
            return __generator(this, function (_a) {
                SetPublicCache(res, 10 * ONE_MINUTE);
                try {
                    res.setHeader('User-Agent', 'copay');
                    options = {
                        uri: 'https://api.github.com/repos/bitpay/copay/releases/latest',
                        headers: {
                            'User-Agent': 'Copay'
                        },
                        json: true
                    };
                    try {
                        server_2 = getServer(req, res);
                    }
                    catch (ex) {
                        return [2, returnError(ex, res, req)];
                    }
                    server_2.storage.checkAndUseGlobalCache('latest-copay-version', Defaults.COPAY_VERSION_CACHE_DURATION, function (err, version) { return __awaiter(_this, void 0, void 0, function () {
                        var htmlString_1, err_1;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (err) {
                                        res.send(err);
                                    }
                                    if (!version) return [3, 1];
                                    res.json({ version: version });
                                    return [3, 4];
                                case 1:
                                    _a.trys.push([1, 3, , 4]);
                                    return [4, rp(options)];
                                case 2:
                                    htmlString_1 = _a.sent();
                                    if (htmlString_1['tag_name']) {
                                        server_2.storage.storeGlobalCache('latest-copay-version', htmlString_1['tag_name'], function (err) {
                                            res.json({ version: htmlString_1['tag_name'] });
                                        });
                                    }
                                    return [3, 4];
                                case 3:
                                    err_1 = _a.sent();
                                    res.send(err_1);
                                    return [3, 4];
                                case 4: return [2];
                            }
                        });
                    }); });
                }
                catch (err) {
                    res.send(err);
                }
                return [2];
            });
        }); });
        router.post('/v1/wallets/', createWalletLimiter, function (req, res) {
            logDeprecated(req);
            return returnError(new clienterror_1.ClientError('BIP45 wallet creation no longer supported'), res, req);
        });
        router.post('/v2/wallets/', createWalletLimiter, function (req, res) {
            var server;
            try {
                server = getServer(req, res);
            }
            catch (ex) {
                return returnError(ex, res, req);
            }
            server.createWallet(req.body, function (err, walletId) {
                if (err)
                    return returnError(err, res, req);
                res.json({
                    walletId: walletId
                });
            });
        });
        router.put('/v1/copayers/:id/', function (req, res) {
            req.body.copayerId = req.params['id'];
            var server;
            try {
                server = getServer(req, res);
            }
            catch (ex) {
                return returnError(ex, res, req);
            }
            server.addAccess(req.body, function (err, result) {
                if (err)
                    return returnError(err, res, req);
                res.json(result);
            });
        });
        router.post('/v1/wallets/:id/copayers/', function (req, res) {
            logDeprecated(req);
            return returnError(new clienterror_1.ClientError('BIP45 wallet creation no longer supported'), res, req);
        });
        router.post('/v2/wallets/:id/copayers/', function (req, res) {
            req.body.walletId = req.params['id'];
            var server;
            try {
                server = getServer(req, res);
            }
            catch (ex) {
                return returnError(ex, res, req);
            }
            server.joinWallet(req.body, function (err, result) {
                if (err)
                    return returnError(err, res, req);
                res.json(result);
            });
        });
        router.get('/v1/wallets/', function (req, res) {
            logDeprecated(req);
            getServerWithAuth(req, res, function (server) {
                server.getStatus({
                    includeExtendedInfo: true
                }, function (err, status) {
                    if (err)
                        return returnError(err, res, req);
                    res.json(status);
                });
            });
        });
        router.get('/v2/wallets/', function (req, res) {
            getServerWithAuth(req, res, function (server) {
                var opts = { includeExtendedInfo: false, twoStep: false };
                if (req.query.includeExtendedInfo == '1')
                    opts.includeExtendedInfo = true;
                if (req.query.twoStep == '1')
                    opts.twoStep = true;
                server.getStatus(opts, function (err, status) {
                    if (err)
                        return returnError(err, res, req);
                    res.json(status);
                });
            });
        });
        router.get('/v3/wallets/', function (req, res) {
            getServerWithAuth(req, res, function (server) {
                var opts = {
                    includeExtendedInfo: false,
                    twoStep: false,
                    includeServerMessages: false,
                    tokenAddress: req.query.tokenAddress,
                    multisigContractAddress: req.query.multisigContractAddress,
                    network: req.query.network
                };
                if (req.query.includeExtendedInfo == '1')
                    opts.includeExtendedInfo = true;
                if (req.query.twoStep == '1')
                    opts.twoStep = true;
                if (req.query.serverMessageArray == '1')
                    opts.includeServerMessages = true;
                server.getStatus(opts, function (err, status) {
                    if (err)
                        return returnError(err, res, req);
                    res.json(status);
                });
            });
        });
        router.get('/v1/wallets/:identifier/', function (req, res) {
            getServerWithAuth(req, res, {
                onlySupportStaff: true
            }, function (server) {
                var opts = {
                    identifier: req.params['identifier'],
                    walletCheck: req.params['walletCheck']
                };
                server.getWalletFromIdentifier(opts, function (err, wallet) {
                    if (err)
                        return returnError(err, res, req);
                    if (!wallet)
                        return res.end();
                    server.walletId = wallet.id;
                    var opts = { includeExtendedInfo: false };
                    if (req.query.includeExtendedInfo == '1')
                        opts.includeExtendedInfo = true;
                    server.getStatus(opts, function (err, status) {
                        if (err)
                            return returnError(err, res, req);
                        res.json(status);
                    });
                });
            });
        });
        router.get('/v1/preferences/', function (req, res) {
            getServerWithAuth(req, res, function (server) {
                server.getPreferences({}, function (err, preferences) {
                    if (err)
                        return returnError(err, res, req);
                    res.json(preferences);
                });
            });
        });
        router.put('/v1/preferences', function (req, res) {
            getServerWithAuth(req, res, function (server) {
                server.savePreferences(req.body, function (err, result) {
                    if (err)
                        return returnError(err, res, req);
                    res.json(result);
                });
            });
        });
        router.get('/v1/txproposals/', function (req, res) {
            getServerWithAuth(req, res, function (server) {
                server.getPendingTxs({ noCashAddr: true }, function (err, pendings) {
                    if (err)
                        return returnError(err, res, req);
                    res.json(pendings);
                });
            });
        });
        router.get('/v2/txproposals/', function (req, res) {
            getServerWithAuth(req, res, function (server) {
                server.getPendingTxs({}, function (err, pendings) {
                    if (err)
                        return returnError(err, res, req);
                    res.json(pendings);
                });
            });
        });
        router.post('/v1/txproposals/', function (req, res) {
            var Errors = require('./errors/errordefinitions');
            var err = Errors.UPGRADE_NEEDED;
            return returnError(err, res, req);
        });
        router.post('/v2/txproposals/', function (req, res) {
            getServerWithAuth(req, res, function (server) {
                req.body.noCashAddr = true;
                req.body.txpVersion = 3;
                server.createTx(req.body, function (err, txp) {
                    if (err)
                        return returnError(err, res, req);
                    res.json(txp);
                });
            });
        });
        router.post('/v3/txproposals/', function (req, res) {
            getServerWithAuth(req, res, function (server) {
                req.body.txpVersion = 3;
                server.createTx(req.body, function (err, txp) {
                    if (err)
                        return returnError(err, res, req);
                    res.json(txp);
                });
            });
        });
        router.post('/v1/advertisements/', function (req, res) {
            getServerWithAuth(req, res, {
                onlyMarketingStaff: true
            }, function (server) {
                server.createAdvert(req.body, function (err, advert) {
                    if (err) {
                        return returnError(err, res, req);
                    }
                    if (advert)
                        res.json(advert);
                });
            });
        });
        router.get('/v1/advertisements/', function (req, res) {
            var server;
            var testing = req.query.testing;
            try {
                server = getServer(req, res);
            }
            catch (ex) {
                return returnError(ex, res, req);
            }
            if (testing) {
                server.getTestingAdverts(req.body, function (err, ads) {
                    if (err)
                        returnError(err, res, req);
                    res.json(ads);
                });
            }
            else {
                SetPublicCache(res, 5 * ONE_MINUTE);
                server.getAdverts(req.body, function (err, ads) {
                    if (err)
                        returnError(err, res, req);
                    res.json(ads);
                });
            }
        });
        router.get('/v1/advertisements/:adId/', function (req, res) {
            var server;
            try {
                server = getServer(req, res);
            }
            catch (ex) {
                return returnError(ex, res, req);
            }
            var opts = { adId: req.params['adId'] };
            if (req.params['adId']) {
                server.getAdvert(opts, function (err, ad) {
                    if (err)
                        returnError(err, res, req);
                    res.json(ad);
                });
            }
        });
        router.get('/v1/advertisements/country/:country', function (req, res) {
            var server;
            var country = req.params['country'];
            var opts = { country: country };
            try {
                server = getServer(req, res);
            }
            catch (ex) {
                return returnError(ex, res, req);
            }
            server.getAdvertsByCountry(opts, function (err, ads) {
                if (err)
                    returnError(err, res, req);
                res.json(ads);
            });
        });
        router.post('/v1/advertisements/:adId/activate', function (req, res) {
            var opts = { adId: req.params['adId'] };
            getServerWithAuth(req, res, {
                onlyMarketingStaff: true
            }, function (server) {
                if (req.params['adId']) {
                    server.activateAdvert(opts, function (err, ad) {
                        if (err)
                            returnError(err, res, req);
                        res.json({ advertisementId: opts.adId, message: 'advert activated' });
                    });
                }
            });
        });
        router.post('/v1/advertisements/:adId/deactivate', function (req, res) {
            var opts = { adId: req.params['adId'] };
            getServerWithAuth(req, res, {
                onlyMarketingStaff: true
            }, function (server) {
                if (req.params['adId']) {
                    server.deactivateAdvert(opts, function (err, ad) {
                        if (err)
                            returnError(err, res, req);
                        res.json({ advertisementId: opts.adId, message: 'advert deactivated' });
                    });
                }
            });
        });
        router.delete('/v1/advertisements/:adId/', function (req, res) {
            getServerWithAuth(req, res, {
                onlyMarketingStaff: true
            }, function (server) {
                req.body.adId = req.params['adId'];
                server.removeAdvert(req.body, function (err, removedAd) {
                    if (err)
                        returnError(err, res, req);
                    if (removedAd) {
                        res.json(removedAd);
                    }
                });
            });
        });
        router.post('/v1/addresses/', function (req, res) {
            logDeprecated(req);
            getServerWithAuth(req, res, function (server) {
                server.createAddress({
                    ignoreMaxGap: true
                }, function (err, address) {
                    if (err)
                        return returnError(err, res, req);
                    res.json(address);
                });
            });
        });
        router.post('/v2/addresses/', function (req, res) {
            logDeprecated(req);
            getServerWithAuth(req, res, function (server) {
                server.createAddress({
                    ignoreMaxGap: true
                }, function (err, address) {
                    if (err)
                        return returnError(err, res, req);
                    res.json(address);
                });
            });
        });
        router.post('/v3/addresses/', function (req, res) {
            getServerWithAuth(req, res, function (server) {
                var opts = req.body;
                opts = opts || {};
                opts.noCashAddr = true;
                server.createAddress(opts, function (err, address) {
                    if (err)
                        return returnError(err, res, req);
                    res.json(address);
                });
            });
        });
        router.post('/v4/addresses/', function (req, res) {
            getServerWithAuth(req, res, function (server) {
                server.createAddress(req.body, function (err, address) {
                    if (err)
                        return returnError(err, res, req);
                    res.json(address);
                });
            });
        });
        router.get('/v1/addresses/', function (req, res) {
            getServerWithAuth(req, res, function (server) {
                var opts = {};
                if (req.query.limit)
                    opts.limit = +req.query.limit;
                opts.reverse = req.query.reverse == '1';
                server.getMainAddresses(opts, function (err, addresses) {
                    if (err)
                        return returnError(err, res, req);
                    res.json(addresses);
                });
            });
        });
        router.get('/v1/balance/', function (req, res) {
            getServerWithAuth(req, res, function (server) {
                var opts = {};
                if (req.query.coin)
                    opts.coin = req.query.coin;
                if (req.query.twoStep == '1')
                    opts.twoStep = true;
                if (req.query.tokenAddress)
                    opts.tokenAddress = req.query.tokenAddress;
                if (req.query.multisigContractAddress)
                    opts.multisigContractAddress = req.query.multisigContractAddress;
                server.getBalance(opts, function (err, balance) {
                    if (err)
                        return returnError(err, res, req);
                    res.json(balance);
                });
            });
        });
        var estimateFeeLimiter;
        if (Defaults.RateLimit.estimateFee && !opts.ignoreRateLimiter) {
            logger_1.logger.info('', 'Limiting estimate fee per IP: %d req/h', ((Defaults.RateLimit.estimateFee.max / Defaults.RateLimit.estimateFee.windowMs) * 60 * 60 * 1000).toFixed(2));
            estimateFeeLimiter = new RateLimit(Defaults.RateLimit.estimateFee);
        }
        else {
            estimateFeeLimiter = function (req, res, next) {
                next();
            };
        }
        router.get('/v1/feelevels/', estimateFeeLimiter, function (req, res) {
            SetPublicCache(res, 1 * ONE_MINUTE);
            logDeprecated(req);
            var opts = {};
            if (req.query.network)
                opts.network = req.query.network;
            var server;
            try {
                server = getServer(req, res);
            }
            catch (ex) {
                return returnError(ex, res, req);
            }
            server.getFeeLevels(opts, function (err, feeLevels) {
                if (err)
                    return returnError(err, res, req);
                lodash_1.default.each(feeLevels, function (feeLevel) {
                    feeLevel.feePerKB = feeLevel.feePerKb;
                    delete feeLevel.feePerKb;
                });
                res.json(feeLevels);
            });
        });
        router.get('/v2/feelevels/', function (req, res) {
            var opts = {};
            SetPublicCache(res, 1 * ONE_MINUTE);
            if (req.query.coin)
                opts.coin = req.query.coin;
            if (req.query.network)
                opts.network = req.query.network;
            var server;
            try {
                server = getServer(req, res);
            }
            catch (ex) {
                return returnError(ex, res, req);
            }
            server.getFeeLevels(opts, function (err, feeLevels) {
                if (err)
                    return returnError(err, res, req);
                res.json(feeLevels);
            });
        });
        router.post('/v3/estimateGas/', function (req, res) {
            getServerWithAuth(req, res, function (server) { return __awaiter(_this, void 0, void 0, function () {
                var gasLimit, err_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4, server.estimateGas(req.body)];
                        case 1:
                            gasLimit = _a.sent();
                            res.json(gasLimit);
                            return [3, 3];
                        case 2:
                            err_2 = _a.sent();
                            returnError(err_2, res, req);
                            return [3, 3];
                        case 3: return [2];
                    }
                });
            }); });
        });
        router.post('/v1/ethmultisig/', function (req, res) {
            getServerWithAuth(req, res, function (server) { return __awaiter(_this, void 0, void 0, function () {
                var multisigContractInstantiationInfo, err_3;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4, server.getMultisigContractInstantiationInfo(req.body)];
                        case 1:
                            multisigContractInstantiationInfo = _a.sent();
                            res.json(multisigContractInstantiationInfo);
                            return [3, 3];
                        case 2:
                            err_3 = _a.sent();
                            returnError(err_3, res, req);
                            return [3, 3];
                        case 3: return [2];
                    }
                });
            }); });
        });
        router.post('/v1/ethmultisig/info', function (req, res) {
            getServerWithAuth(req, res, function (server) { return __awaiter(_this, void 0, void 0, function () {
                var multisigContractInfo, err_4;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4, server.getMultisigContractInfo(req.body)];
                        case 1:
                            multisigContractInfo = _a.sent();
                            res.json(multisigContractInfo);
                            return [3, 3];
                        case 2:
                            err_4 = _a.sent();
                            returnError(err_4, res, req);
                            return [3, 3];
                        case 3: return [2];
                    }
                });
            }); });
        });
        router.get('/v1/sendmaxinfo/', function (req, res) {
            getServerWithAuth(req, res, function (server) {
                var q = req.query;
                var opts = {};
                if (q.feePerKb)
                    opts.feePerKb = +q.feePerKb;
                if (q.feeLevel)
                    opts.feeLevel = q.feeLevel;
                if (q.excludeUnconfirmedUtxos == '1')
                    opts.excludeUnconfirmedUtxos = true;
                if (q.returnInputs == '1')
                    opts.returnInputs = true;
                server.getSendMaxInfo(opts, function (err, info) {
                    if (err)
                        return returnError(err, res, req);
                    res.json(info);
                });
            });
        });
        router.get('/v1/utxos/', function (req, res) {
            var opts = {};
            var addresses = req.query.addresses;
            if (addresses && lodash_1.default.isString(addresses))
                opts.addresses = req.query.addresses.split(',');
            getServerWithAuth(req, res, function (server) {
                server.getUtxos(opts, function (err, utxos) {
                    if (err)
                        return returnError(err, res, req);
                    res.json(utxos);
                });
            });
        });
        router.get('/v1/txcoins/', function (req, res) {
            var txId = req.query.txId;
            getServerWithAuth(req, res, function (server) {
                server.getCoinsForTx({ txId: txId }, function (err, coins) {
                    if (err)
                        return returnError(err, res, req);
                    res.json(coins);
                });
            });
        });
        router.post('/v1/broadcast_raw/', function (req, res) {
            getServerWithAuth(req, res, function (server) {
                server.broadcastRawTx(req.body, function (err, txid) {
                    if (err)
                        return returnError(err, res, req);
                    res.json(txid);
                    res.end();
                });
            });
        });
        router.post('/v1/txproposals/:id/signatures/', function (req, res) {
            getServerWithAuth(req, res, function (server) {
                req.body.maxTxpVersion = 3;
                req.body.txProposalId = req.params['id'];
                server.signTx(req.body, function (err, txp) {
                    if (err)
                        return returnError(err, res, req);
                    res.json(txp);
                    res.end();
                });
            });
        });
        router.post('/v2/txproposals/:id/signatures/', function (req, res) {
            getServerWithAuth(req, res, function (server) {
                req.body.txProposalId = req.params['id'];
                req.body.maxTxpVersion = 3;
                req.body.supportBchSchnorr = true;
                server.signTx(req.body, function (err, txp) {
                    if (err)
                        return returnError(err, res, req);
                    res.json(txp);
                    res.end();
                });
            });
        });
        router.post('/v1/txproposals/:id/publish/', function (req, res) {
            getServerWithAuth(req, res, function (server) {
                req.body.txProposalId = req.params['id'];
                req.body.noCashAddr = true;
                server.publishTx(req.body, function (err, txp) {
                    if (err)
                        return returnError(err, res, req);
                    res.json(txp);
                    res.end();
                });
            });
        });
        router.post('/v2/txproposals/:id/publish/', function (req, res) {
            getServerWithAuth(req, res, function (server) {
                req.body.txProposalId = req.params['id'];
                server.publishTx(req.body, function (err, txp) {
                    if (err)
                        return returnError(err, res, req);
                    res.json(txp);
                    res.end();
                });
            });
        });
        router.post('/v1/txproposals/:id/broadcast/', function (req, res) {
            getServerWithAuth(req, res, function (server) {
                req.body.txProposalId = req.params['id'];
                server.broadcastTx(req.body, function (err, txp) {
                    if (err)
                        return returnError(err, res, req);
                    res.json(txp);
                    res.end();
                });
            });
        });
        router.post('/v1/txproposals/:id/rejections', function (req, res) {
            getServerWithAuth(req, res, function (server) {
                req.body.txProposalId = req.params['id'];
                server.rejectTx(req.body, function (err, txp) {
                    if (err)
                        return returnError(err, res, req);
                    res.json(txp);
                    res.end();
                });
            });
        });
        router.delete('/v1/txproposals/:id/', function (req, res) {
            getServerWithAuth(req, res, function (server) {
                req.body.txProposalId = req.params['id'];
                server.removePendingTx(req.body, function (err) {
                    if (err)
                        return returnError(err, res, req);
                    res.json({
                        success: true
                    });
                    res.end();
                });
            });
        });
        router.get('/v1/txproposals/:id/', function (req, res) {
            getServerWithAuth(req, res, function (server) {
                req.body.txProposalId = req.params['id'];
                server.getTx(req.body, function (err, tx) {
                    if (err)
                        return returnError(err, res, req);
                    res.json(tx);
                    res.end();
                });
            });
        });
        router.get('/v1/txhistory/', function (req, res) {
            getServerWithAuth(req, res, function (server) {
                var opts = {};
                if (req.query.skip)
                    opts.skip = +req.query.skip;
                if (req.query.limit)
                    opts.limit = +req.query.limit;
                if (req.query.tokenAddress)
                    opts.tokenAddress = req.query.tokenAddress;
                if (req.query.multisigContractAddress)
                    opts.multisigContractAddress = req.query.multisigContractAddress;
                if (req.query.includeExtendedInfo == '1')
                    opts.includeExtendedInfo = true;
                server.getTxHistory(opts, function (err, txs) {
                    if (err)
                        return returnError(err, res, req);
                    res.json(txs);
                    res.end();
                });
            });
        });
        router.post('/v1/addresses/scan/', function (req, res) {
            getServerWithAuth(req, res, function (server) {
                server.startScan(req.body, function (err, started) {
                    if (err)
                        return returnError(err, res, req);
                    res.json(started);
                    res.end();
                });
            });
        });
        router.get('/v1/stats/', function (req, res) {
            SetPublicCache(res, 1 * ONE_MINUTE);
            var opts = {};
            if (req.query.network)
                opts.network = req.query.network;
            if (req.query.coin)
                opts.coin = req.query.coin;
            if (req.query.from)
                opts.from = req.query.from;
            if (req.query.to)
                opts.to = req.query.to;
            var stats = new stats_1.Stats(opts);
            stats.run(function (err, data) {
                if (err)
                    return returnError(err, res, req);
                res.json(data);
                res.end();
            });
        });
        router.get('/v1/version/', function (req, res) {
            SetPublicCache(res, 1 * ONE_MINUTE);
            res.json({
                serviceVersion: server_1.WalletService.getServiceVersion()
            });
            res.end();
        });
        router.post('/v1/login/', function (req, res) {
            getServerWithAuth(req, res, function (server) {
                server.login({}, function (err, session) {
                    if (err)
                        return returnError(err, res, req);
                    res.json(session);
                });
            });
        });
        router.post('/v1/logout/', function (req, res) {
            getServerWithAuth(req, res, function (server) {
                server.logout({}, function (err) {
                    if (err)
                        return returnError(err, res, req);
                    res.end();
                });
            });
        });
        router.get('/v1/notifications/', function (req, res) {
            getServerWithAuth(req, res, {
                allowSession: true
            }, function (server) {
                var timeSpan = req.query.timeSpan
                    ? Math.min(+req.query.timeSpan || 0, Defaults.MAX_NOTIFICATIONS_TIMESPAN)
                    : Defaults.NOTIFICATIONS_TIMESPAN;
                var opts = {
                    minTs: +Date.now() - timeSpan * 1000,
                    notificationId: req.query.notificationId
                };
                server.getNotifications(opts, function (err, notifications) {
                    if (err)
                        return returnError(err, res, req);
                    res.json(notifications);
                });
            });
        });
        router.get('/v1/txnotes/:txid', function (req, res) {
            getServerWithAuth(req, res, function (server) {
                var opts = {
                    txid: req.params['txid']
                };
                server.getTxNote(opts, function (err, note) {
                    if (err)
                        return returnError(err, res, req);
                    res.json(note);
                });
            });
        });
        router.put('/v1/txnotes/:txid/', function (req, res) {
            req.body.txid = req.params['txid'];
            getServerWithAuth(req, res, function (server) {
                server.editTxNote(req.body, function (err, note) {
                    if (err)
                        return returnError(err, res, req);
                    res.json(note);
                });
            });
        });
        router.get('/v1/txnotes/', function (req, res) {
            getServerWithAuth(req, res, function (server) {
                var opts = {};
                if (req.query.minTs && lodash_1.default.isNumber(+req.query.minTs)) {
                    opts.minTs = +req.query.minTs;
                }
                server.getTxNotes(opts, function (err, notes) {
                    if (err)
                        return returnError(err, res, req);
                    res.json(notes);
                });
            });
        });
        router.get('/v1/fiatrates/:code/', function (req, res) {
            SetPublicCache(res, 5 * ONE_MINUTE);
            var server;
            var opts = {
                code: req.params['code'],
                coin: req.query.coin || 'btc',
                ts: req.query.ts ? +req.query.ts : null
            };
            try {
                server = getServer(req, res);
            }
            catch (ex) {
                return returnError(ex, res, req);
            }
            server.getFiatRate(opts, function (err, rates) {
                if (err)
                    return returnError(err, res, req);
                res.json(rates);
            });
        });
        router.get('/v2/fiatrates/:code/', function (req, res) {
            SetPublicCache(res, 5 * ONE_MINUTE);
            var server;
            var opts = {
                code: req.params['code'],
                ts: req.query.ts ? +req.query.ts : null
            };
            try {
                server = getServer(req, res);
            }
            catch (ex) {
                return returnError(ex, res, req);
            }
            server.getHistoricalRates(opts, function (err, rates) {
                if (err)
                    return returnError(err, res, req);
                res.json(rates);
            });
        });
        router.post('/v1/pushnotifications/subscriptions/', function (req, res) {
            getServerWithAuth(req, res, function (server) {
                server.pushNotificationsSubscribe(req.body, function (err, response) {
                    if (err)
                        return returnError(err, res, req);
                    res.json(response);
                });
            });
        });
        router.delete('/v1/pushnotifications/subscriptions/', function (req, res) {
            logDeprecated(req);
            getServerWithAuth(req, res, function (server) {
                server.pushNotificationsUnsubscribe({
                    token: 'dummy'
                }, function (err, response) {
                    if (err)
                        return returnError(err, res, req);
                    res.json(response);
                });
            });
        });
        router.delete('/v2/pushnotifications/subscriptions/:token', function (req, res) {
            var opts = {
                token: req.params['token']
            };
            getServerWithAuth(req, res, function (server) {
                server.pushNotificationsUnsubscribe(opts, function (err, response) {
                    if (err)
                        return returnError(err, res, req);
                    res.json(response);
                });
            });
        });
        router.post('/v1/txconfirmations/', function (req, res) {
            getServerWithAuth(req, res, function (server) {
                server.txConfirmationSubscribe(req.body, function (err, response) {
                    if (err)
                        return returnError(err, res, req);
                    res.json(response);
                });
            });
        });
        router.delete('/v1/txconfirmations/:txid', function (req, res) {
            var opts = {
                txid: req.params['txid']
            };
            getServerWithAuth(req, res, function (server) {
                server.txConfirmationUnsubscribe(opts, function (err, response) {
                    if (err)
                        return returnError(err, res, req);
                    res.json(response);
                });
            });
        });
        router.post('/v1/service/simplex/quote', function (req, res) {
            getServerWithAuth(req, res, function (server) {
                server
                    .simplexGetQuote(req)
                    .then(function (response) {
                    res.json(response);
                })
                    .catch(function (err) {
                    if (err)
                        return returnError(err, res, req);
                });
            });
        });
        router.post('/v1/service/simplex/paymentRequest', function (req, res) {
            getServerWithAuth(req, res, function (server) {
                server
                    .simplexPaymentRequest(req)
                    .then(function (response) {
                    res.json(response);
                })
                    .catch(function (err) {
                    if (err)
                        return returnError(err, res, req);
                });
            });
        });
        router.get('/v1/service/simplex/events', function (req, res) {
            getServerWithAuth(req, res, function (server) {
                var opts = { env: req.query.env };
                server
                    .simplexGetEvents(opts)
                    .then(function (response) {
                    res.json(response);
                })
                    .catch(function (err) {
                    if (err)
                        return returnError(err, res, req);
                });
            });
        });
        router.post('/v1/service/wyre/walletOrderQuotation', function (req, res) {
            getServerWithAuth(req, res, function (server) {
                server
                    .wyreWalletOrderQuotation(req)
                    .then(function (response) {
                    res.json(response);
                })
                    .catch(function (err) {
                    if (err)
                        return returnError(err, res, req);
                });
            });
        });
        router.post('/v1/service/wyre/walletOrderReservation', function (req, res) {
            getServerWithAuth(req, res, function (server) {
                server
                    .wyreWalletOrderReservation(req)
                    .then(function (response) {
                    res.json(response);
                })
                    .catch(function (err) {
                    if (err)
                        return returnError(err, res, req);
                });
            });
        });
        router.get('/v1/masternode/collateral/', function (req, res) {
            getServerWithAuth(req, res, function (server) {
                var opts = {};
                if (req.query.coin)
                    opts.coin = req.query.coin;
                server.getMasternodeCollateral(opts, function (err, tx) {
                    if (err)
                        return returnError(err, res, req);
                    res.json(tx);
                });
            });
        });
        router.get('/v1/masternode/', function (req, res) {
            getServerWithAuth(req, res, function (server) {
                var opts = {};
                if (req.query.coin)
                    opts.coin = req.query.coin;
                if (req.query.txid)
                    opts.txid = req.query.txid;
                server.getMasternodes(opts, function (err, ret) {
                    if (err)
                        return returnError(err, res, req);
                    res.json(ret);
                });
            });
        });
        router.get('/v1/masternode/status', function (req, res) {
            getServerWithAuth(req, res, function (server) {
                var opts = {};
                if (req.query.coin)
                    opts.coin = req.query.coin;
                if (req.query.txid)
                    opts.txid = req.query.txid;
                if (req.query.address)
                    opts.address = req.query.address;
                if (req.query.payee)
                    opts.payee = req.query.payee;
                server.getMasternodeStatus(opts, function (err, ret) {
                    if (err)
                        return returnError(err, res, req);
                    res.json(ret);
                });
            });
        });
        router.get('/v1/masternode/ping/', function (req, res) {
            getServerWithAuth(req, res, function (server) {
                var opts = {};
                if (req.query.coin)
                    opts.coin = req.query.coin;
                if (req.query.txid)
                    opts.txid = req.query.txid;
                if (req.query.vout)
                    opts.vout = req.query.vout;
                server.getMasternodePing(opts, function (err, result) {
                    if (err)
                        return returnError(err, res, req);
                    res.json(result);
                });
            });
        });
        router.post('/v1/masternode/broadcast/', function (req, res) {
            getServerWithAuth(req, res, function (server) {
                var opts = {};
                if (req.query.coin)
                    opts.coin = req.query.coin;
                server.broadcastMasternode(req.body, function (err, ret) {
                    if (err)
                        return returnError(err, res, req);
                    res.json(ret);
                });
            });
        });
        router.delete('/v1/masternode/', function (req, res) {
            getServerWithAuth(req, res, function (server) {
                var opts = {};
                if (req.query.coin)
                    opts.coin = req.query.coin;
                if (req.query.txid)
                    opts.txid = req.query.txid;
                server.removeMasternodes(opts, function (err, ret) {
                    if (err)
                        return returnError(err, res, req);
                    res.json(ret);
                });
            });
        });
        this.app.use(function (req, res, next) {
            res.setHeader('Cache-Control', 'no-store');
            next();
        });
        this.app.use(opts.basePath || '/bws/api', router);
        if (config.staticRoot) {
            logger_1.logger.debug("Serving static files from " + config.staticRoot);
            this.app.use('/static', express_1.default.static(config.staticRoot));
        }
        server_1.WalletService.initialize(opts, cb);
    };
    return ExpressApp;
}());
exports.ExpressApp = ExpressApp;
//# sourceMappingURL=expressapp.js.map