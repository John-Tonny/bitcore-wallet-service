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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var async = __importStar(require("async"));
var lodash_1 = __importDefault(require("lodash"));
var request = __importStar(require("request-promise-native"));
var io = require("socket.io-client");
var index_1 = require("../chain/index");
var logger_1 = __importDefault(require("../logger"));
var client_1 = require("./v8/client");
var $ = require('preconditions').singleton();
var Common = require('../common');
var Bitcore = require('bitcore-lib');
var Bitcore_ = {
    btc: Bitcore,
    bch: require('bitcore-lib-cash'),
    eth: Bitcore,
    xrp: Bitcore,
    vcl: require('vircle-lib')
};
var config = require('../../config');
var Constants = Common.Constants, Defaults = Common.Defaults, Utils = Common.Utils;
function v8network(bwsNetwork) {
    if (bwsNetwork == 'livenet')
        return 'mainnet';
    if (bwsNetwork == 'testnet' && config.blockchainExplorerOpts.btc.testnet.regtestEnabled) {
        return 'regtest';
    }
    return bwsNetwork;
}
var V8 = (function () {
    function V8(opts) {
        $.checkArgument(opts);
        $.checkArgument(Utils.checkValueInCollection(opts.network, Constants.NETWORKS));
        $.checkArgument(Utils.checkValueInCollection(opts.coin, Constants.COINS));
        $.checkArgument(opts.url);
        this.apiPrefix = lodash_1.default.isUndefined(opts.apiPrefix) ? '/api' : opts.apiPrefix;
        this.chain = index_1.ChainService.getChain(opts.coin || Defaults.COIN);
        this.coin = this.chain.toLowerCase();
        this.network = opts.network || 'livenet';
        this.v8network = v8network(this.network);
        this.addressFormat = this.coin == 'bch' ? 'cashaddr' : null;
        this.apiPrefix += "/" + this.chain + "/" + this.v8network;
        this.host = opts.url;
        this.userAgent = opts.userAgent || 'bws';
        this.baseUrl = this.host + this.apiPrefix;
        this.request = opts.request || request;
        this.Client = opts.client || client_1.Client || require('./v8/client');
    }
    V8.prototype._getClient = function () {
        return new this.Client({
            baseUrl: this.baseUrl
        });
    };
    V8.prototype._getAuthClient = function (wallet) {
        $.checkState(wallet.beAuthPrivateKey2);
        return new this.Client({
            baseUrl: this.baseUrl,
            authKey: Bitcore_[this.coin].PrivateKey(wallet.beAuthPrivateKey2)
        });
    };
    V8.prototype.addAddresses = function (wallet, addresses, cb) {
        var client = this._getAuthClient(wallet);
        var payload = lodash_1.default.map(addresses, function (a) {
            return {
                address: a
            };
        });
        var k = 'addAddresses' + addresses.length;
        console.time(k);
        client
            .importAddresses({
            payload: payload,
            pubKey: wallet.beAuthPublicKey2
        })
            .then(function (ret) {
            console.timeEnd(k);
            return cb(null, ret);
        })
            .catch(function (err) {
            return cb(err);
        });
    };
    V8.prototype.register = function (wallet, cb) {
        if (wallet.coin != this.coin || wallet.network != this.network) {
            return cb(new Error('Network coin or network mismatch'));
        }
        var client = this._getAuthClient(wallet);
        var payload = {
            name: wallet.id,
            pubKey: wallet.beAuthPublicKey2
        };
        client
            .register({
            authKey: wallet.beAuthPrivateKey2,
            payload: payload
        })
            .then(function (ret) {
            return cb(null, ret);
        })
            .catch(cb);
    };
    V8.prototype.getBalance = function (wallet, cb) {
        return __awaiter(this, void 0, void 0, function () {
            var client, tokenAddress, multisigContractAddress;
            return __generator(this, function (_a) {
                client = this._getAuthClient(wallet);
                tokenAddress = wallet.tokenAddress, multisigContractAddress = wallet.multisigContractAddress;
                client
                    .getBalance({ pubKey: wallet.beAuthPublicKey2, payload: {}, tokenAddress: tokenAddress, multisigContractAddress: multisigContractAddress })
                    .then(function (ret) {
                    return cb(null, ret);
                })
                    .catch(cb);
                return [2];
            });
        });
    };
    V8.prototype.getConnectionInfo = function () {
        return 'V8 (' + this.coin + '/' + this.v8network + ') @ ' + this.host;
    };
    V8.prototype._transformUtxos = function (unspent, bcheight) {
        $.checkState(bcheight > 0, 'No BC height passed to _transformUtxos');
        var ret = lodash_1.default.map(lodash_1.default.reject(unspent, function (x) {
            return x.spentHeight && x.spentHeight <= -3;
        }), function (x) {
            var u = {
                address: x.address,
                satoshis: x.value,
                amount: x.value / 1e8,
                scriptPubKey: x.script,
                txid: x.mintTxid,
                vout: x.mintIndex,
                locked: false,
                confirmations: x.mintHeight > 0 && bcheight >= x.mintHeight ? bcheight - x.mintHeight + 1 : 0
            };
            return u;
        });
        return ret;
    };
    V8.prototype.getUtxos = function (wallet, height, cb) {
        var _this = this;
        $.checkArgument(cb);
        var client = this._getAuthClient(wallet);
        console.time('V8getUtxos');
        client
            .getCoins({ pubKey: wallet.beAuthPublicKey2, payload: {} })
            .then(function (unspent) {
            console.timeEnd('V8getUtxos');
            return cb(null, _this._transformUtxos(unspent, height));
        })
            .catch(cb);
    };
    V8.prototype.getCoinsForTx = function (txId, cb) {
        $.checkArgument(cb);
        var client = this._getClient();
        console.time('V8getCoinsForTx');
        client
            .getCoinsForTx({ txId: txId, payload: {} })
            .then(function (coins) {
            console.timeEnd('V8getCoinsForTx');
            return cb(null, coins);
        })
            .catch(cb);
    };
    V8.prototype.getCheckData = function (wallet, cb) {
        var client = this._getAuthClient(wallet);
        console.time('WalletCheck');
        client
            .getCheckData({ pubKey: wallet.beAuthPublicKey2, payload: {} })
            .then(function (checkInfo) {
            console.timeEnd('WalletCheck');
            return cb(null, checkInfo);
        })
            .catch(cb);
    };
    V8.prototype.broadcast = function (rawTx, cb, count) {
        var _this = this;
        if (count === void 0) { count = 0; }
        var payload = {
            rawTx: rawTx,
            network: this.v8network,
            chain: this.chain
        };
        var client = this._getClient();
        client
            .broadcast({ payload: payload })
            .then(function (ret) {
            if (!ret.txid) {
                return cb(new Error('Error broadcasting'));
            }
            return cb(null, ret.txid);
        })
            .catch(function (err) {
            if (count > 3) {
                logger_1.default.error('FINAL Broadcast error:', err);
                return cb(err);
            }
            else {
                count++;
                setTimeout(function () {
                    logger_1.default.info('Retrying broadcast after', count * Defaults.BROADCAST_RETRY_TIME);
                    return _this.broadcast(rawTx, cb, count);
                }, count * Defaults.BROADCAST_RETRY_TIME);
            }
        });
    };
    V8.prototype.getTransaction = function (txid, cb) {
        console.log('[v8.js.207] GET TX', txid);
        var client = this._getClient();
        client
            .getTx({ txid: txid })
            .then(function (tx) {
            if (!tx || lodash_1.default.isEmpty(tx)) {
                return cb();
            }
            return cb(null, tx);
        })
            .catch(function (err) {
            if (err.statusCode == '404') {
                return cb();
            }
            else {
                return cb(err);
            }
        });
    };
    V8.prototype.getAddressUtxos = function (address, height, cb) {
        var _this = this;
        console.log(' GET ADDR UTXO', address, height);
        var client = this._getClient();
        client
            .getAddressTxos({ address: address, unspent: true })
            .then(function (utxos) {
            return cb(null, _this._transformUtxos(utxos, height));
        })
            .catch(cb);
    };
    V8.prototype.getTransactions = function (wallet, startBlock, cb) {
        console.time('V8 getTxs');
        if (startBlock) {
            logger_1.default.debug("getTxs: startBlock " + startBlock);
        }
        else {
            logger_1.default.debug('getTxs: from 0');
        }
        var client = this._getAuthClient(wallet);
        var acum = '', broken;
        var opts = {
            includeMempool: true,
            pubKey: wallet.beAuthPublicKey2,
            payload: {},
            startBlock: undefined,
            tokenAddress: wallet.tokenAddress,
            multisigContractAddress: wallet.multisigContractAddress
        };
        if (lodash_1.default.isNumber(startBlock))
            opts.startBlock = startBlock;
        var txStream = client.listTransactions(opts);
        txStream.on('data', function (raw) {
            acum = acum + raw.toString();
        });
        txStream.on('end', function () {
            if (broken) {
                return;
            }
            var txs = [], unconf = [];
            lodash_1.default.each(acum.split(/\r?\n/), function (rawTx) {
                if (!rawTx)
                    return;
                var tx;
                try {
                    tx = JSON.parse(rawTx);
                }
                catch (e) {
                    logger_1.default.error('v8 error at JSON.parse:' + e + ' Parsing:' + rawTx + ':');
                    return cb(e);
                }
                if (tx.value)
                    tx.amount = tx.satoshis / 1e8;
                if (tx.height >= 0)
                    txs.push(tx);
                else
                    unconf.push(tx);
            });
            console.timeEnd('V8 getTxs');
            return cb(null, lodash_1.default.flatten(lodash_1.default.orderBy(unconf, 'blockTime', 'desc').concat(txs.reverse())));
        });
        txStream.on('error', function (e) {
            logger_1.default.error('v8 error:' + e);
            broken = true;
            return cb(e);
        });
    };
    V8.prototype.getAddressActivity = function (address, cb) {
        var url = this.baseUrl + '/address/' + address + '/txs?limit=1';
        console.log('[v8.js.328:url:] CHECKING ADDRESS ACTIVITY', url);
        this.request
            .get(url, {})
            .then(function (ret) {
            return cb(null, ret !== '[]');
        })
            .catch(function (err) {
            return cb(err);
        });
    };
    V8.prototype.getTransactionCount = function (address, cb) {
        var url = this.baseUrl + '/address/' + address + '/txs/count';
        console.log('[v8.js.364:url:] CHECKING ADDRESS NONCE', url);
        this.request
            .get(url, {})
            .then(function (ret) {
            ret = JSON.parse(ret);
            return cb(null, ret.nonce);
        })
            .catch(function (err) {
            return cb(err);
        });
    };
    V8.prototype.estimateGas = function (opts, cb) {
        var url = this.baseUrl + '/gas';
        console.log('[v8.js.378:url:] CHECKING GAS LIMIT', url);
        this.request
            .post(url, { body: opts, json: true })
            .then(function (gasLimit) {
            gasLimit = JSON.parse(gasLimit);
            return cb(null, gasLimit);
        })
            .catch(function (err) {
            return cb(err);
        });
    };
    V8.prototype.getMultisigContractInstantiationInfo = function (opts, cb) {
        var url = this.baseUrl + "/ethmultisig/" + opts.sender + "/instantiation/" + opts.txId;
        console.log('[v8.js.378:url:] CHECKING CONTRACT INSTANTIATION INFO', url);
        this.request
            .get(url, {})
            .then(function (contractInstantiationInfo) {
            contractInstantiationInfo = JSON.parse(contractInstantiationInfo);
            return cb(null, contractInstantiationInfo);
        })
            .catch(function (err) {
            return cb(err);
        });
    };
    V8.prototype.getMultisigContractInfo = function (opts, cb) {
        var url = this.baseUrl + '/ethmultisig/info/' + opts.multisigContractAddress;
        console.log('[v8.js.378:url:] CHECKING CONTRACT INFO', url);
        this.request
            .get(url, {})
            .then(function (contractInfo) {
            contractInfo = JSON.parse(contractInfo);
            return cb(null, contractInfo);
        })
            .catch(function (err) {
            return cb(err);
        });
    };
    V8.prototype.getMultisigTxpsInfo = function (opts, cb) {
        var url = this.baseUrl + '/ethmultisig/txps/' + opts.multisigContractAddress;
        console.log('[v8.js.378:url:] CHECKING CONTRACT TXPS INFO', url);
        this.request
            .get(url, {})
            .then(function (multisigTxpsInfo) {
            multisigTxpsInfo = JSON.parse(multisigTxpsInfo);
            return cb(null, multisigTxpsInfo);
        })
            .catch(function (err) {
            return cb(err);
        });
    };
    V8.prototype.estimateFee = function (nbBlocks, cb) {
        var _this = this;
        nbBlocks = nbBlocks || [1, 2, 6, 24];
        var result = {};
        async.each(nbBlocks, function (x, icb) {
            var url = _this.baseUrl + '/fee/' + x;
            _this.request
                .get(url, {})
                .then(function (ret) {
                try {
                    ret = JSON.parse(ret);
                    if (!lodash_1.default.isUndefined(ret.blocks) && ret.blocks != x) {
                        logger_1.default.info("Ignoring response for " + x + ":" + JSON.stringify(ret));
                        return icb();
                    }
                    result[x] = ret.feerate;
                }
                catch (e) {
                    logger_1.default.warn('fee error:', e);
                }
                return icb();
            })
                .catch(function (err) {
                return icb(err);
            });
        }, function (err) {
            if (err) {
                return cb(err);
            }
            return cb(null, result);
        });
    };
    V8.prototype.getBlockchainHeight = function (cb) {
        var url = this.baseUrl + '/block/tip';
        this.request
            .get(url, {})
            .then(function (ret) {
            try {
                ret = JSON.parse(ret);
                return cb(null, ret.height, ret.hash);
            }
            catch (err) {
                return cb(new Error('Could not get height from block explorer'));
            }
        })
            .catch(cb);
    };
    V8.prototype.getTxidsInBlock = function (blockHash, cb) {
        var url = this.baseUrl + '/tx/?blockHash=' + blockHash;
        this.request
            .get(url, {})
            .then(function (ret) {
            try {
                ret = JSON.parse(ret);
                var res = lodash_1.default.map(ret, 'txid');
                return cb(null, res);
            }
            catch (err) {
                return cb(new Error('Could not get height from block explorer'));
            }
        })
            .catch(cb);
    };
    V8.prototype.getBlockHashInHeight = function (blockHeight, cb) {
        var url = this.baseUrl + '/tx/?blockHeight=' + blockHeight;
        this.request
            .get(url, {})
            .then(function (ret) {
            try {
                ret = JSON.parse(ret);
                return cb(null, ret[0].blockHeight, ret[0].blockHash);
            }
            catch (err) {
                return cb(new Error('Could not get height from block explorer'));
            }
        })
            .catch(cb);
    };
    V8.prototype.getMasternodeStatus = function (opts, cb) {
        var qs = '';
        if (typeof opts.txid !== 'undefined') {
            qs = '?txid=' + opts.txid;
        }
        else if (typeof opts.address !== 'undefined') {
            qs = '?address=' + opts.address;
        }
        else if (typeof opts.payee !== 'undefined') {
            qs = '?payee=' + opts.payee;
        }
        var url = this.baseUrl + '/masternode/status/' + qs;
        this.request
            .get(url, {})
            .then(function (ret) {
            try {
                ret = JSON.parse(ret);
                return cb(null, ret);
            }
            catch (err) {
                return cb(new Error('Could not get height from block explorer'));
            }
        })
            .catch(cb);
    };
    V8.prototype.broadcastMasternode = function (rawTx, cb, count) {
        var _this = this;
        if (count === void 0) { count = 0; }
        var payload = {
            rawTx: rawTx,
            network: this.v8network,
            chain: this.chain
        };
        var client = this._getClient();
        client
            .broadcastMasternode({ payload: payload })
            .then(function (infos) {
            var errMsg;
            lodash_1.default.forEach(lodash_1.default.keys(infos), function (key) {
                if (key == 'errorMessage') {
                    errMsg = infos[key];
                    return;
                }
            });
            if (errMsg) {
                return cb(new Error('Error broadcasting'));
            }
            return cb(null, infos);
        })
            .catch(function (err) {
            if (count > 3) {
                logger_1.default.error('FINAL Broadcast Masternode error:', err);
                return cb(err);
            }
            else {
                count++;
                setTimeout(function () {
                    logger_1.default.info('Retrying broadcast masternode after', count * Defaults.BROADCAST_MASTERNODE_RETRY_TIME);
                    return _this.broadcastMasternode(rawTx, cb, count);
                }, count * Defaults.BROADCAST_MASTERNODE_RETRY_TIME);
            }
        });
    };
    V8.prototype.initSocket = function (callbacks) {
        var _this = this;
        logger_1.default.info('V8 connecting socket at:' + this.host);
        var walletsSocket = io.connect(this.host, { transports: ['websocket'] });
        var blockSocket = io.connect(this.host, { transports: ['websocket'] });
        var getAuthPayload = function (host) {
            var authKey = config.blockchainExplorerOpts.socketApiKey;
            if (!authKey)
                throw new Error('provide authKey');
            var authKeyObj = new Bitcore.PrivateKey(authKey);
            var pubKey = authKeyObj.toPublicKey().toString();
            var authClient = new client_1.Client({ baseUrl: host, authKey: authKeyObj });
            var payload = { method: 'socket', url: host };
            var authPayload = { pubKey: pubKey, message: authClient.getMessage(payload), signature: authClient.sign(payload) };
            return authPayload;
        };
        blockSocket.on('connect', function () {
            logger_1.default.info("Connected to block " + _this.getConnectionInfo());
            blockSocket.emit('room', "/" + _this.chain + "/" + _this.v8network + "/inv");
        });
        blockSocket.on('connect_error', function () {
            logger_1.default.error("Error connecting to " + _this.getConnectionInfo());
        });
        blockSocket.on('block', function (data) {
            return callbacks.onBlock(data.hash);
        });
        walletsSocket.on('connect', function () {
            logger_1.default.info("Connected to wallets " + _this.getConnectionInfo());
            walletsSocket.emit('room', "/" + _this.chain + "/" + _this.v8network + "/wallets", getAuthPayload(_this.host));
        });
        walletsSocket.on('connect_error', function () {
            logger_1.default.error("Error connecting to " + _this.getConnectionInfo() + "  " + _this.chain + "/" + _this.v8network);
        });
        walletsSocket.on('failure', function (err) {
            logger_1.default.error("Error joining room " + err.message + " " + _this.chain + "/" + _this.v8network);
        });
        walletsSocket.on('coin', function (data) {
            if (!data || !data.coin)
                return;
            var notification = index_1.ChainService.onCoin(_this.coin, data.coin);
            if (!notification)
                return;
            return callbacks.onIncomingPayments(notification);
        });
        walletsSocket.on('tx', function (data) {
            if (!data || !data.tx)
                return;
            var notification = index_1.ChainService.onTx(_this.coin, data.tx);
            if (!notification)
                return;
            return callbacks.onIncomingPayments(notification);
        });
    };
    return V8;
}());
exports.V8 = V8;
var _parseErr = function (err, res) {
    if (err) {
        logger_1.default.warn('V8 error: ', err);
        return 'V8 Error';
    }
    logger_1.default.warn('V8 ' + res.request.href + ' Returned Status: ' + res.statusCode);
    return 'Error querying the blockchain';
};
//# sourceMappingURL=v8.js.map