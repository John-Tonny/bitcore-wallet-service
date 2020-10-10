"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var crypto_wallet_core_1 = require("crypto-wallet-core");
var btc_1 = require("../btc");
var Errors = require('../../errors/errordefinitions');
var BchChain = (function (_super) {
    __extends(BchChain, _super);
    function BchChain() {
        var _this = _super.call(this, crypto_wallet_core_1.BitcoreLibCash) || this;
        _this.feeSafetyMargin = 0.1;
        return _this;
    }
    BchChain.prototype.validateAddress = function (wallet, inaddr, opts) {
        var A = crypto_wallet_core_1.BitcoreLibCash.Address;
        var addr = {};
        try {
            addr = new A(inaddr);
        }
        catch (ex) {
            throw Errors.INVALID_ADDRESS;
        }
        if (addr.network.toString() != wallet.network) {
            throw Errors.INCORRECT_ADDRESS_NETWORK;
        }
        if (!opts.noCashAddr) {
            if (addr.toString(true) != inaddr)
                throw Errors.ONLY_CASHADDR;
        }
        return;
    };
    return BchChain;
}(btc_1.BtcChain));
exports.BchChain = BchChain;
//# sourceMappingURL=index.js.map