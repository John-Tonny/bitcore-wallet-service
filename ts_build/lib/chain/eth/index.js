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
var crypto_wallet_core_1 = require("crypto-wallet-core");
var crypto_wallet_core_2 = require("crypto-wallet-core");
var lodash_1 = __importDefault(require("lodash"));
var logger_1 = __importDefault(require("../../logger"));
var Common = require('../../common');
var Constants = Common.Constants;
var Defaults = Common.Defaults;
var Errors = require('../../errors/errordefinitions');
var EthChain = (function () {
    function EthChain() {
    }
    EthChain.prototype.convertBitcoreBalance = function (bitcoreBalance, locked) {
        var unconfirmed = bitcoreBalance.unconfirmed, confirmed = bitcoreBalance.confirmed, balance = bitcoreBalance.balance;
        var convertedBalance = {
            totalAmount: balance,
            totalConfirmedAmount: confirmed,
            lockedAmount: locked,
            lockedConfirmedAmount: locked,
            availableAmount: balance - locked,
            availableConfirmedAmount: confirmed - locked,
            byAddress: []
        };
        return convertedBalance;
    };
    EthChain.prototype.notifyConfirmations = function () {
        return false;
    };
    EthChain.prototype.supportsMultisig = function () {
        return false;
    };
    EthChain.prototype.getWalletBalance = function (server, wallet, opts, cb) {
        var _this = this;
        var bc = server._getBlockchainExplorer(wallet.coin, wallet.network);
        if (opts.tokenAddress) {
            wallet.tokenAddress = opts.tokenAddress;
        }
        if (opts.multisigContractAddress) {
            wallet.multisigContractAddress = opts.multisigContractAddress;
            opts.network = wallet.network;
        }
        bc.getBalance(wallet, function (err, balance) {
            if (err) {
                return cb(err);
            }
            server.getPendingTxs(opts, function (err, txps) {
                if (err)
                    return cb(err);
                var lockedSum = opts.multisigContractAddress ? 0 : lodash_1.default.sumBy(txps, 'amount') || 0;
                var convertedBalance = _this.convertBitcoreBalance(balance, lockedSum);
                server.storage.fetchAddresses(server.walletId, function (err, addresses) {
                    if (err)
                        return cb(err);
                    if (addresses.length > 0) {
                        var byAddress = [
                            {
                                address: addresses[0].address,
                                path: addresses[0].path,
                                amount: convertedBalance.totalAmount
                            }
                        ];
                        convertedBalance.byAddress = byAddress;
                    }
                    return cb(null, convertedBalance);
                });
            });
        });
    };
    EthChain.prototype.getWalletSendMaxInfo = function (server, wallet, opts, cb) {
        server.getBalance({}, function (err, balance) {
            if (err)
                return cb(err);
            var totalAmount = balance.totalAmount, availableAmount = balance.availableAmount;
            var fee = opts.feePerKb * Defaults.MIN_GAS_LIMIT;
            return cb(null, {
                utxosBelowFee: 0,
                amountBelowFee: 0,
                amount: availableAmount - fee,
                feePerKb: opts.feePerKb,
                fee: fee
            });
        });
    };
    EthChain.prototype.getDustAmountValue = function () {
        return 0;
    };
    EthChain.prototype.getTransactionCount = function (server, wallet, from) {
        return new Promise(function (resolve, reject) {
            server._getTransactionCount(wallet, from, function (err, nonce) {
                if (err)
                    return reject(err);
                return resolve(nonce);
            });
        });
    };
    EthChain.prototype.getChangeAddress = function () { };
    EthChain.prototype.checkDust = function (output, opts) { };
    EthChain.prototype.getFee = function (server, wallet, opts) {
        var _this = this;
        return new Promise(function (resolve) {
            server._getFeePerKb(wallet, opts, function (err, inFeePerKb) { return __awaiter(_this, void 0, void 0, function () {
                var feePerKb, gasPrice, from, coin, network, inGasLimit, _i, _a, output, err_1, gasLimit, fee;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            feePerKb = inFeePerKb;
                            gasPrice = inFeePerKb;
                            from = opts.from;
                            coin = wallet.coin, network = wallet.network;
                            _i = 0, _a = opts.outputs;
                            _b.label = 1;
                        case 1:
                            if (!(_i < _a.length)) return [3, 6];
                            output = _a[_i];
                            _b.label = 2;
                        case 2:
                            _b.trys.push([2, 4, , 5]);
                            return [4, server.estimateGas({
                                    coin: coin,
                                    network: network,
                                    from: from,
                                    to: opts.multisigContractAddress || opts.tokenAddress || output.toAddress,
                                    value: opts.tokenAddress || opts.multisigContractAddress ? 0 : output.amount,
                                    data: output.data,
                                    gasPrice: gasPrice
                                })];
                        case 3:
                            inGasLimit = _b.sent();
                            output.gasLimit = inGasLimit || Defaults.DEFAULT_GAS_LIMIT;
                            return [3, 5];
                        case 4:
                            err_1 = _b.sent();
                            output.gasLimit = Defaults.DEFAULT_GAS_LIMIT;
                            return [3, 5];
                        case 5:
                            _i++;
                            return [3, 1];
                        case 6:
                            if (lodash_1.default.isNumber(opts.fee)) {
                                gasPrice = feePerKb = Number((opts.fee / (inGasLimit || Defaults.DEFAULT_GAS_LIMIT)).toFixed());
                            }
                            gasLimit = inGasLimit || Defaults.DEFAULT_GAS_LIMIT;
                            fee = feePerKb * gasLimit;
                            return [2, resolve({ feePerKb: feePerKb, gasPrice: gasPrice, gasLimit: gasLimit, fee: fee })];
                    }
                });
            }); });
        });
    };
    EthChain.prototype.getBitcoreTx = function (txp, opts) {
        var _this = this;
        if (opts === void 0) { opts = { signed: true }; }
        var data = txp.data, outputs = txp.outputs, payProUrl = txp.payProUrl, tokenAddress = txp.tokenAddress, multisigContractAddress = txp.multisigContractAddress;
        var isERC20 = tokenAddress && !payProUrl;
        var isETHMULTISIG = multisigContractAddress && !payProUrl;
        var chain = isETHMULTISIG ? 'ETHMULTISIG' : isERC20 ? 'ERC20' : 'ETH';
        var recipients = outputs.map(function (output) {
            return {
                amount: output.amount,
                address: output.toAddress,
                data: output.data,
                gasLimit: output.gasLimit
            };
        });
        if (data) {
            recipients[0].data = data;
        }
        var unsignedTxs = [];
        for (var index = 0; index < recipients.length; index++) {
            var rawTx = crypto_wallet_core_1.Transactions.create(__assign(__assign(__assign({}, txp), recipients[index]), { chain: chain, nonce: Number(txp.nonce) + Number(index), recipients: [recipients[index]] }));
            unsignedTxs.push(rawTx);
        }
        var tx = {
            uncheckedSerialize: function () { return unsignedTxs; },
            txid: function () { return txp.txid; },
            toObject: function () {
                var ret = lodash_1.default.clone(txp);
                ret.outputs[0].satoshis = ret.outputs[0].amount;
                return ret;
            },
            getFee: function () {
                return txp.fee;
            },
            getChangeOutput: function () { return null; }
        };
        if (opts.signed) {
            var sigs = txp.getCurrentSignatures();
            sigs.forEach(function (x) {
                _this.addSignaturesToBitcoreTx(tx, txp.inputs, txp.inputPaths, x.signatures, x.xpub);
            });
        }
        return tx;
    };
    EthChain.prototype.convertFeePerKb = function (p, feePerKb) {
        return [p, feePerKb];
    };
    EthChain.prototype.checkTx = function (txp) {
        try {
            var tx = this.getBitcoreTx(txp);
        }
        catch (ex) {
            logger_1.default.debug('Error building Bitcore transaction', ex);
            return ex;
        }
        return null;
    };
    EthChain.prototype.checkTxUTXOs = function (server, txp, opts, cb) {
        return cb();
    };
    EthChain.prototype.selectTxInputs = function (server, txp, wallet, opts, cb) {
        var _this = this;
        server.getBalance({ wallet: wallet, tokenAddress: opts.tokenAddress, multisigContractAddress: opts.multisigContractAddress }, function (err, balance) {
            if (err)
                return cb(err);
            var totalAmount = balance.totalAmount, availableAmount = balance.availableAmount;
            if (totalAmount < txp.getTotalAmount()) {
                return cb(Errors.INSUFFICIENT_FUNDS);
            }
            else if (availableAmount < txp.getTotalAmount()) {
                return cb(Errors.LOCKED_FUNDS);
            }
            else {
                if (opts.tokenAddress || opts.multisigContractAddress) {
                    server.getBalance({}, function (err, ethBalance) {
                        if (err)
                            return cb(err);
                        var totalAmount = ethBalance.totalAmount, availableAmount = ethBalance.availableAmount;
                        if (totalAmount < txp.fee) {
                            return cb(Errors.INSUFFICIENT_ETH_FEE);
                        }
                        else if (availableAmount < txp.fee) {
                            return cb(Errors.LOCKED_ETH_FEE);
                        }
                        else {
                            return cb(_this.checkTx(txp));
                        }
                    });
                }
                else {
                    return cb(_this.checkTx(txp));
                }
            }
        });
    };
    EthChain.prototype.checkUtxos = function (opts) { };
    EthChain.prototype.checkValidTxAmount = function (output) {
        if (!lodash_1.default.isNumber(output.amount) || lodash_1.default.isNaN(output.amount) || output.amount < 0) {
            return false;
        }
        return true;
    };
    EthChain.prototype.isUTXOCoin = function () {
        return false;
    };
    EthChain.prototype.isSingleAddress = function () {
        return true;
    };
    EthChain.prototype.addressFromStorageTransform = function (network, address) {
        if (network != 'livenet') {
            var x = address.address.indexOf(':' + network);
            if (x >= 0) {
                address.address = address.address.substr(0, x);
            }
        }
    };
    EthChain.prototype.addressToStorageTransform = function (network, address) {
        if (network != 'livenet')
            address.address += ':' + network;
    };
    EthChain.prototype.addSignaturesToBitcoreTx = function (tx, inputs, inputPaths, signatures, xpub) {
        if (signatures.length === 0) {
            throw new Error('Signatures Required');
        }
        var chain = 'ETH';
        var unsignedTxs = tx.uncheckedSerialize();
        var signedTxs = [];
        for (var index = 0; index < signatures.length; index++) {
            var signed = crypto_wallet_core_1.Transactions.applySignature({
                chain: chain,
                tx: unsignedTxs[index],
                signature: signatures[index]
            });
            signedTxs.push(signed);
            tx.id = crypto_wallet_core_1.Transactions.getHash({ tx: signed, chain: chain });
        }
        tx.uncheckedSerialize = function () { return signedTxs; };
    };
    EthChain.prototype.validateAddress = function (wallet, inaddr, opts) {
        var chain = 'ETH';
        var isValidTo = crypto_wallet_core_1.Validation.validateAddress(chain, wallet.network, inaddr);
        if (!isValidTo) {
            throw Errors.INVALID_ADDRESS;
        }
        var isValidFrom = crypto_wallet_core_1.Validation.validateAddress(chain, wallet.network, opts.from);
        if (!isValidFrom) {
            throw Errors.INVALID_ADDRESS;
        }
        return;
    };
    EthChain.prototype.onCoin = function (coin) {
        return null;
    };
    EthChain.prototype.onTx = function (tx) {
        var tokenAddress;
        var multisigContractAddress;
        var address;
        var amount;
        if (tx.abiType && tx.abiType.type === 'ERC20') {
            tokenAddress = tx.to;
            address = crypto_wallet_core_2.Web3.utils.toChecksumAddress(tx.abiType.params[0].value);
            amount = tx.abiType.params[1].value;
        }
        else if (tx.abiType && tx.abiType.type === 'MULTISIG' && tx.abiType.name === 'submitTransaction') {
            multisigContractAddress = tx.to;
            address = crypto_wallet_core_2.Web3.utils.toChecksumAddress(tx.abiType.params[0].value);
            amount = tx.abiType.params[1].value;
        }
        else if (tx.abiType && tx.abiType.type === 'MULTISIG' && tx.abiType.name === 'confirmTransaction') {
            multisigContractAddress = tx.to;
            address = crypto_wallet_core_2.Web3.utils.toChecksumAddress(tx.internal[0].action.to);
            amount = tx.internal[0].action.value;
        }
        else {
            address = tx.to;
            amount = tx.value;
        }
        return {
            txid: tx.txid,
            out: {
                address: address,
                amount: amount,
                tokenAddress: tokenAddress,
                multisigContractAddress: multisigContractAddress
            }
        };
    };
    return EthChain;
}());
exports.EthChain = EthChain;
//# sourceMappingURL=index.js.map