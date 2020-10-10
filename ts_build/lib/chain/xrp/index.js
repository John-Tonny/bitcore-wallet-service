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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var crypto_wallet_core_1 = require("crypto-wallet-core");
var lodash_1 = __importDefault(require("lodash"));
var logger_1 = __importDefault(require("../../logger"));
var Common = require('../../common');
var Constants = Common.Constants;
var Defaults = Common.Defaults;
var Errors = require('../../errors/errordefinitions');
var XrpChain = (function () {
    function XrpChain() {
    }
    XrpChain.prototype.convertBitcoreBalance = function (bitcoreBalance, locked) {
        var unconfirmed = bitcoreBalance.unconfirmed, confirmed = bitcoreBalance.confirmed, balance = bitcoreBalance.balance;
        var activatedLocked = locked;
        if (balance > 0) {
            activatedLocked = locked + Defaults.MIN_XRP_BALANCE;
        }
        var convertedBalance = {
            totalAmount: balance,
            totalConfirmedAmount: confirmed,
            lockedAmount: activatedLocked,
            lockedConfirmedAmount: activatedLocked,
            availableAmount: balance - activatedLocked,
            availableConfirmedAmount: confirmed - activatedLocked,
            byAddress: []
        };
        return convertedBalance;
    };
    XrpChain.prototype.supportsMultisig = function () {
        return false;
    };
    XrpChain.prototype.getWalletBalance = function (server, wallet, opts, cb) {
        var _this = this;
        var bc = server._getBlockchainExplorer(wallet.coin, wallet.network);
        bc.getBalance(wallet, function (err, balance) {
            if (err) {
                return cb(err);
            }
            server.getPendingTxs(opts, function (err, txps) {
                if (err)
                    return cb(err);
                var lockedSum = lodash_1.default.sumBy(txps, 'amount') || 0;
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
    XrpChain.prototype.getWalletSendMaxInfo = function (server, wallet, opts, cb) {
        server.getBalance({}, function (err, balance) {
            if (err)
                return cb(err);
            var totalAmount = balance.totalAmount, availableAmount = balance.availableAmount;
            var fee = opts.feePerKb;
            return cb(null, {
                utxosBelowFee: 0,
                amountBelowFee: 0,
                amount: availableAmount - fee,
                feePerKb: opts.feePerKb,
                fee: fee
            });
        });
    };
    XrpChain.prototype.getDustAmountValue = function () {
        return 0;
    };
    XrpChain.prototype.getTransactionCount = function (server, wallet, from) {
        return new Promise(function (resolve, reject) {
            server._getTransactionCount(wallet, from, function (err, nonce) {
                if (err)
                    return reject(err);
                return resolve(nonce);
            });
        });
    };
    XrpChain.prototype.getChangeAddress = function () { };
    XrpChain.prototype.checkDust = function (output, opts) { };
    XrpChain.prototype.getFee = function (server, wallet, opts) {
        return new Promise(function (resolve, reject) {
            if (lodash_1.default.isNumber(opts.fee)) {
                return resolve({ feePerKb: opts.fee });
            }
            server._getFeePerKb(wallet, opts, function (err, inFeePerKb) {
                if (err) {
                    return reject(err);
                }
                var feePerKb = inFeePerKb;
                opts.fee = feePerKb;
                return resolve({ feePerKb: feePerKb });
            });
        });
    };
    XrpChain.prototype.getBitcoreTx = function (txp, opts) {
        var _this = this;
        if (opts === void 0) { opts = { signed: true }; }
        var destinationTag = txp.destinationTag, outputs = txp.outputs;
        var chain = 'XRP';
        var recipients = outputs.map(function (output) {
            return {
                amount: output.amount,
                address: output.toAddress
            };
        });
        var unsignedTxs = [];
        for (var index = 0; index < recipients.length; index++) {
            var rawTx = crypto_wallet_core_1.Transactions.create(__assign(__assign({}, txp), { tag: destinationTag ? Number(destinationTag) : undefined, chain: chain, nonce: Number(txp.nonce) + Number(index), recipients: [recipients[index]] }));
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
    XrpChain.prototype.convertFeePerKb = function (p, feePerKb) {
        return [p, feePerKb];
    };
    XrpChain.prototype.checkTx = function (txp) {
        try {
            this.getBitcoreTx(txp);
        }
        catch (ex) {
            logger_1.default.warn('Error building XRP  transaction', ex);
            return ex;
        }
    };
    XrpChain.prototype.checkTxUTXOs = function (server, txp, opts, cb) {
        return cb();
    };
    XrpChain.prototype.selectTxInputs = function (server, txp, wallet, opts, cb) {
        var _this = this;
        server.getBalance({ wallet: wallet }, function (err, balance) {
            if (err)
                return cb(err);
            var totalAmount = balance.totalAmount, availableAmount = balance.availableAmount;
            var minXrpBalance = 20000000;
            if (totalAmount - minXrpBalance < txp.getTotalAmount()) {
                return cb(Errors.INSUFFICIENT_FUNDS);
            }
            else if (availableAmount < txp.getTotalAmount()) {
                return cb(Errors.LOCKED_FUNDS);
            }
            else {
                return cb(_this.checkTx(txp));
            }
        });
    };
    XrpChain.prototype.checkUtxos = function (opts) { };
    XrpChain.prototype.checkValidTxAmount = function (output) {
        if (!lodash_1.default.isNumber(output.amount) || lodash_1.default.isNaN(output.amount) || output.amount < 0) {
            return false;
        }
        return true;
    };
    XrpChain.prototype.isUTXOCoin = function () {
        return false;
    };
    XrpChain.prototype.isSingleAddress = function () {
        return true;
    };
    XrpChain.prototype.addressFromStorageTransform = function (network, address) {
        if (network != 'livenet') {
            var x = address.address.indexOf(':' + network);
            if (x >= 0) {
                address.address = address.address.substr(0, x);
            }
        }
    };
    XrpChain.prototype.addressToStorageTransform = function (network, address) {
        if (network != 'livenet')
            address.address += ':' + network;
    };
    XrpChain.prototype.addSignaturesToBitcoreTx = function (tx, inputs, inputPaths, signatures, xpub) {
        if (signatures.length === 0) {
            throw new Error('Signatures Required');
        }
        var chain = 'XRP';
        var network = tx.network;
        var unsignedTxs = tx.uncheckedSerialize();
        var signedTxs = [];
        for (var index = 0; index < signatures.length; index++) {
            var signed = crypto_wallet_core_1.Transactions.applySignature({
                chain: chain,
                tx: unsignedTxs[index],
                signature: signatures[index]
            });
            signedTxs.push(signed);
            tx.id = crypto_wallet_core_1.Transactions.getHash({ tx: signed, chain: chain, network: network });
        }
        tx.uncheckedSerialize = function () { return signedTxs; };
    };
    XrpChain.prototype.notifyConfirmations = function () {
        return false;
    };
    XrpChain.prototype.validateAddress = function (wallet, inaddr, opts) {
        var chain = 'XRP';
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
    XrpChain.prototype.onCoin = function (coin) {
        return null;
    };
    XrpChain.prototype.onTx = function (tx) {
        return null;
    };
    return XrpChain;
}());
exports.XrpChain = XrpChain;
//# sourceMappingURL=index.js.map