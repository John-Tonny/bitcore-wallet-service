"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Preferences = (function () {
    function Preferences() {
    }
    Preferences.create = function (opts) {
        opts = opts || {};
        var x = new Preferences();
        x.version = '1.0.0';
        x.createdOn = Math.floor(Date.now() / 1000);
        x.walletId = opts.walletId;
        x.copayerId = opts.copayerId;
        x.email = opts.email;
        x.language = opts.language;
        x.unit = opts.unit;
        x.tokenAddresses = opts.tokenAddresses;
        x.multisigEthInfo = opts.multisigEthInfo;
        return x;
    };
    Preferences.fromObj = function (obj) {
        var x = new Preferences();
        x.version = obj.version;
        x.createdOn = obj.createdOn;
        x.walletId = obj.walletId;
        x.copayerId = obj.copayerId;
        x.email = obj.email;
        x.language = obj.language;
        x.unit = obj.unit;
        x.tokenAddresses = obj.tokenAddresses;
        x.multisigEthInfo = obj.multisigEthInfo;
        return x;
    };
    return Preferences;
}());
exports.Preferences = Preferences;
//# sourceMappingURL=preferences.js.map