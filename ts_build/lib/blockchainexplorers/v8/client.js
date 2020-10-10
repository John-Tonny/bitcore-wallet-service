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
var requestStream = __importStar(require("request"));
var request = __importStar(require("request-promise-native"));
var secp256k1 = __importStar(require("secp256k1"));
var url_1 = require("url");
var logger_1 = __importDefault(require("../../logger"));
var bitcoreLib = require('bitcore-lib');
var Client = (function () {
    function Client(params) {
        Object.assign(this, params);
    }
    Client.prototype.getMessage = function (params) {
        var method = params.method, url = params.url, _a = params.payload, payload = _a === void 0 ? {} : _a;
        var parsedUrl = new url_1.URL(url);
        return [method, parsedUrl.pathname + parsedUrl.search, JSON.stringify(payload)].join('|');
    };
    Client.prototype.sign = function (params) {
        var message = this.getMessage(params);
        var privateKey = this.authKey.bn.toBuffer({ size: 32 });
        var messageHash = bitcoreLib.crypto.Hash.sha256sha256(Buffer.from(message));
        return secp256k1.sign(messageHash, privateKey).signature.toString('hex');
    };
    Client.prototype.register = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var payload, _a, baseUrl, url, signature;
            return __generator(this, function (_b) {
                payload = params.payload;
                _a = payload.baseUrl, baseUrl = _a === void 0 ? this.baseUrl : _a;
                url = baseUrl + "/wallet";
                signature = this.sign({ method: 'POST', url: url, payload: payload });
                return [2, request.post(url, {
                        headers: { 'x-signature': signature },
                        body: payload,
                        json: true
                    })];
            });
        });
    };
    Client.prototype.getBalance = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var payload, pubKey, tokenAddress, multisigContractAddress, query, apiUrl, url, signature;
            return __generator(this, function (_a) {
                payload = params.payload, pubKey = params.pubKey, tokenAddress = params.tokenAddress, multisigContractAddress = params.multisigContractAddress;
                query = '';
                apiUrl = this.baseUrl + "/wallet/" + pubKey + "/balance";
                if (tokenAddress) {
                    query = "?tokenAddress=" + tokenAddress;
                }
                if (multisigContractAddress) {
                    apiUrl = this.baseUrl + "/address/" + multisigContractAddress + "/balance";
                }
                url = apiUrl + query;
                signature = this.sign({ method: 'GET', url: url, payload: payload });
                return [2, request.get(url, {
                        headers: { 'x-signature': signature },
                        body: payload,
                        json: true
                    })];
            });
        });
    };
    Client.prototype.getCheckData = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var payload, pubKey, url, signature;
            return __generator(this, function (_a) {
                payload = params.payload, pubKey = params.pubKey;
                url = this.baseUrl + "/wallet/" + pubKey + "/check";
                logger_1.default.debug('WALLET CHECK');
                signature = this.sign({ method: 'GET', url: url, payload: payload });
                return [2, request.get(url, {
                        headers: { 'x-signature': signature },
                        body: payload,
                        json: true
                    })];
            });
        });
    };
    Client.prototype.getAddressTxos = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var unspent, address, args, url;
            return __generator(this, function (_a) {
                unspent = params.unspent, address = params.address;
                args = unspent ? "?unspent=" + unspent : '';
                url = this.baseUrl + "/address/" + address + args;
                return [2, request.get(url, {
                        json: true
                    })];
            });
        });
    };
    Client.prototype.getTx = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var txid, url;
            return __generator(this, function (_a) {
                txid = params.txid;
                url = this.baseUrl + "/tx/" + txid;
                return [2, request.get(url, {
                        json: true
                    })];
            });
        });
    };
    Client.prototype.getCoins = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var payload, pubKey, includeSpent, extra, url, signature;
            return __generator(this, function (_a) {
                payload = params.payload, pubKey = params.pubKey, includeSpent = params.includeSpent;
                extra = '';
                if (includeSpent) {
                    extra = "?includeSpent=" + includeSpent;
                }
                url = this.baseUrl + "/wallet/" + pubKey + "/utxos" + extra;
                logger_1.default.debug('GET UTXOS:', url);
                signature = this.sign({ method: 'GET', url: url, payload: payload });
                return [2, request.get(url, {
                        headers: { 'x-signature': signature },
                        body: payload,
                        json: true
                    })];
            });
        });
    };
    Client.prototype.getCoinsForTx = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var txId, url;
            return __generator(this, function (_a) {
                txId = params.txId;
                url = this.baseUrl + "/tx/" + txId + "/coins";
                logger_1.default.debug('GET COINS FOR TX:', url);
                return [2, request.get(url, {
                        json: true
                    })];
            });
        });
    };
    Client.prototype.listTransactions = function (params) {
        var pubKey = params.pubKey, startBlock = params.startBlock, startDate = params.startDate, endBlock = params.endBlock, endDate = params.endDate, includeMempool = params.includeMempool, tokenAddress = params.tokenAddress, multisigContractAddress = params.multisigContractAddress;
        var query = '';
        var apiUrl = this.baseUrl + "/wallet/" + pubKey + "/transactions?";
        if (startBlock) {
            query += "startBlock=" + startBlock + "&";
        }
        if (endBlock) {
            query += "endBlock=" + endBlock + "&";
        }
        if (tokenAddress) {
            query += "tokenAddress=" + tokenAddress + "&";
        }
        if (multisigContractAddress) {
            apiUrl = this.baseUrl + "/ethmultisig/transactions/" + multisigContractAddress + "?";
        }
        if (includeMempool) {
            query += 'includeMempool=true';
        }
        var url = apiUrl + query;
        var signature = this.sign({ method: 'GET', url: url });
        logger_1.default.debug('List transactions', url);
        return requestStream.get(url, {
            headers: { 'x-signature': signature },
            json: true
        });
    };
    Client.prototype.importAddresses = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var payload, pubKey, url, signature, h;
            return __generator(this, function (_a) {
                payload = params.payload, pubKey = params.pubKey;
                url = this.baseUrl + "/wallet/" + pubKey;
                logger_1.default.debug('addAddresses:', url, payload);
                signature = this.sign({ method: 'POST', url: url, payload: payload });
                h = { 'x-signature': signature };
                return [2, request.post(url, {
                        headers: h,
                        body: payload,
                        json: true
                    })];
            });
        });
    };
    Client.prototype.broadcast = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var payload, url;
            return __generator(this, function (_a) {
                payload = params.payload;
                url = this.baseUrl + "/tx/send";
                logger_1.default.debug('Broadcast', url);
                return [2, request.post(url, { body: payload, json: true })];
            });
        });
    };
    Client.prototype.broadcastMasternode = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var payload, url;
            return __generator(this, function (_a) {
                payload = params.payload;
                url = this.baseUrl + "/masternode/send";
                logger_1.default.debug('[client.js.113:url:]', url);
                return [2, request.post(url, { body: payload, json: true })];
            });
        });
    };
    Client.prototype.getMasternodeStatus = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var txId, url;
            return __generator(this, function (_a) {
                txId = params.txId;
                url = this.baseUrl + "/masternode/status/" + txId;
                logger_1.default.debug('GET MASTERNODE STATUS:', url);
                return [2, request.get(url, {
                        json: true
                    })];
            });
        });
    };
    return Client;
}());
exports.Client = Client;
//# sourceMappingURL=client.js.map