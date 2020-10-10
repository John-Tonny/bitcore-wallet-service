"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = __importDefault(require("lodash"));
var $ = require('preconditions').singleton();
var Constants = require('../common/constants');
var Utils = require('../common/utils');
var AddressManager = (function () {
    function AddressManager() {
        this.receiveAddressIndex = 0;
        this.changeAddressIndex = 0;
    }
    AddressManager.create = function (opts) {
        opts = opts || {};
        var x = new AddressManager();
        x.version = 2;
        x.derivationStrategy = opts.derivationStrategy || Constants.DERIVATION_STRATEGIES.BIP45;
        $.checkState(Utils.checkValueInCollection(x.derivationStrategy, Constants.DERIVATION_STRATEGIES));
        x.receiveAddressIndex = 0;
        x.changeAddressIndex = 0;
        x.copayerIndex = lodash_1.default.isNumber(opts.copayerIndex) ? opts.copayerIndex : Constants.BIP45_SHARED_INDEX;
        x.skippedPaths = [];
        return x;
    };
    AddressManager.fromObj = function (obj) {
        var x = new AddressManager();
        x.version = obj.version;
        x.derivationStrategy = obj.derivationStrategy || Constants.DERIVATION_STRATEGIES.BIP45;
        x.receiveAddressIndex = obj.receiveAddressIndex || 0;
        x.changeAddressIndex = obj.changeAddressIndex || 0;
        x.copayerIndex = obj.copayerIndex;
        x.skippedPaths = [];
        return x;
    };
    AddressManager.supportsCopayerBranches = function (derivationStrategy) {
        return derivationStrategy == Constants.DERIVATION_STRATEGIES.BIP45;
    };
    AddressManager.prototype._incrementIndex = function (isChange) {
        if (isChange) {
            this.changeAddressIndex++;
        }
        else {
            this.receiveAddressIndex++;
        }
    };
    AddressManager.prototype.rewindIndex = function (isChange, step, n) {
        step = lodash_1.default.isUndefined(step) ? 1 : step;
        n = lodash_1.default.isUndefined(n) ? 1 : n;
        if (isChange) {
            this.changeAddressIndex = Math.max(0, this.changeAddressIndex - n * step);
        }
        else {
            this.receiveAddressIndex = Math.max(0, this.receiveAddressIndex - n * step);
        }
        this.skippedPaths = this.skippedPaths.splice(0, this.skippedPaths.length - step * n + n);
    };
    AddressManager.prototype.getCurrentIndex = function (isChange) {
        return isChange ? this.changeAddressIndex : this.receiveAddressIndex;
    };
    AddressManager.prototype.getBaseAddressPath = function (isChange) {
        return ('m/' +
            (this.derivationStrategy == Constants.DERIVATION_STRATEGIES.BIP45 ? this.copayerIndex + '/' : '') +
            (isChange ? 1 : 0) +
            '/' +
            0);
    };
    AddressManager.prototype.getCurrentAddressPath = function (isChange) {
        return ('m/' +
            (this.derivationStrategy == Constants.DERIVATION_STRATEGIES.BIP45 ? this.copayerIndex + '/' : '') +
            (isChange ? 1 : 0) +
            '/' +
            (isChange ? this.changeAddressIndex : this.receiveAddressIndex));
    };
    AddressManager.prototype.getNewAddressPath = function (isChange, step) {
        if (step === void 0) { step = 1; }
        var ret;
        var i = 0;
        step = step || 1;
        while (i++ < step) {
            if (ret) {
                this.skippedPaths.push({ path: ret, isChange: isChange });
            }
            ret = this.getCurrentAddressPath(isChange);
            this._incrementIndex(isChange);
        }
        return ret;
    };
    AddressManager.prototype.getNextSkippedPath = function () {
        if (lodash_1.default.isEmpty(this.skippedPaths))
            return null;
        var ret = this.skippedPaths.pop();
        return ret;
    };
    AddressManager.prototype.parseDerivationPath = function (path) {
        var pathIndex = /m\/([0-9]*)\/([0-9]*)/;
        var _a = path.match(pathIndex), _input = _a[0], changeIndex = _a[1], addressIndex = _a[2];
        var isChange = changeIndex > 0;
        return { _input: _input, addressIndex: addressIndex, isChange: isChange };
    };
    return AddressManager;
}());
exports.AddressManager = AddressManager;
//# sourceMappingURL=addressmanager.js.map