"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var bch_1 = require("./bch");
var btc_1 = require("./btc");
var eth_1 = require("./eth");
var vcl_1 = require("./vcl");
var xrp_1 = require("./xrp");
var Common = require('../common');
var Constants = Common.Constants;
var chain = {
    BTC: new btc_1.BtcChain(),
    BCH: new bch_1.BchChain(),
    ETH: new eth_1.EthChain(),
    VCL: new vcl_1.VclChain(),
    XRP: new xrp_1.XrpChain()
};
var ChainProxy = (function () {
    function ChainProxy() {
    }
    ChainProxy.prototype.get = function (coin) {
        var normalizedChain = this.getChain(coin);
        return chain[normalizedChain];
    };
    ChainProxy.prototype.getChain = function (coin) {
        var normalizedChain = coin.toUpperCase();
        if (Constants.ERC20[normalizedChain]) {
            normalizedChain = 'ETH';
        }
        return normalizedChain;
    };
    ChainProxy.prototype.getWalletBalance = function (server, wallet, opts, cb) {
        return this.get(wallet.coin).getWalletBalance(server, wallet, opts, cb);
    };
    ChainProxy.prototype.getWalletSendMaxInfo = function (server, wallet, opts, cb) {
        return this.get(wallet.coin).getWalletSendMaxInfo(server, wallet, opts, cb);
    };
    ChainProxy.prototype.getDustAmountValue = function (coin) {
        return this.get(coin).getDustAmountValue();
    };
    ChainProxy.prototype.getTransactionCount = function (server, wallet, from) {
        return this.get(wallet.coin).getTransactionCount(server, wallet, from);
    };
    ChainProxy.prototype.getChangeAddress = function (server, wallet, opts) {
        return this.get(wallet.coin).getChangeAddress(server, wallet, opts);
    };
    ChainProxy.prototype.checkDust = function (coin, output, opts) {
        return this.get(coin).checkDust(output, opts);
    };
    ChainProxy.prototype.getFee = function (server, wallet, opts) {
        return this.get(wallet.coin).getFee(server, wallet, opts);
    };
    ChainProxy.prototype.getBitcoreTx = function (txp, opts) {
        if (opts === void 0) { opts = { signed: true }; }
        return this.get(txp.coin).getBitcoreTx(txp, { signed: opts.signed });
    };
    ChainProxy.prototype.convertFeePerKb = function (coin, p, feePerKb) {
        return this.get(coin).convertFeePerKb(p, feePerKb);
    };
    ChainProxy.prototype.addressToStorageTransform = function (coin, network, address) {
        return this.get(coin).addressToStorageTransform(network, address);
    };
    ChainProxy.prototype.addressFromStorageTransform = function (coin, network, address) {
        return this.get(coin).addressFromStorageTransform(network, address);
    };
    ChainProxy.prototype.checkTx = function (server, txp) {
        return this.get(txp.coin).checkTx(server, txp);
    };
    ChainProxy.prototype.checkTxUTXOs = function (server, txp, opts, cb) {
        return this.get(txp.coin).checkTxUTXOs(server, txp, opts, cb);
    };
    ChainProxy.prototype.selectTxInputs = function (server, txp, wallet, opts, cb) {
        return this.get(txp.coin).selectTxInputs(server, txp, wallet, opts, cb);
    };
    ChainProxy.prototype.checkUtxos = function (coin, opts) {
        return this.get(coin).checkUtxos(opts);
    };
    ChainProxy.prototype.checkValidTxAmount = function (coin, output) {
        return this.get(coin).checkValidTxAmount(output);
    };
    ChainProxy.prototype.isUTXOCoin = function (coin) {
        return this.get(coin).isUTXOCoin();
    };
    ChainProxy.prototype.isSingleAddress = function (coin) {
        return this.get(coin).isSingleAddress();
    };
    ChainProxy.prototype.notifyConfirmations = function (coin, network) {
        return this.get(coin).notifyConfirmations(network);
    };
    ChainProxy.prototype.supportsMultisig = function (coin) {
        return this.get(coin).supportsMultisig();
    };
    ChainProxy.prototype.addSignaturesToBitcoreTx = function (coin, tx, inputs, inputPaths, signatures, xpub, signingMethod) {
        this.get(coin).addSignaturesToBitcoreTx(tx, inputs, inputPaths, signatures, xpub, signingMethod);
    };
    ChainProxy.prototype.validateAddress = function (wallet, inaddr, opts) {
        return this.get(wallet.coin).validateAddress(wallet, inaddr, opts);
    };
    ChainProxy.prototype.onCoin = function (coin, coinData) {
        return this.get(coin).onCoin(coinData);
    };
    ChainProxy.prototype.onTx = function (coin, tx) {
        return this.get(coin).onTx(tx);
    };
    return ChainProxy;
}());
exports.ChainService = new ChainProxy();
//# sourceMappingURL=index.js.map