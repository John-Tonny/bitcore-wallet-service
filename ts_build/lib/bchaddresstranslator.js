"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = __importDefault(require("lodash"));
var Bitcore_ = {
    btc: require('bitcore-lib'),
    bch: require('bitcore-lib-cash')
};
var BCHAddressTranslator = (function () {
    function BCHAddressTranslator() {
    }
    BCHAddressTranslator.getAddressCoin = function (address) {
        try {
            new Bitcore_['btc'].Address(address);
            return 'legacy';
        }
        catch (e) {
            try {
                var a = new Bitcore_['bch'].Address(address);
                if (a.toLegacyAddress() == address)
                    return 'copay';
                return 'cashaddr';
            }
            catch (e) {
                return;
            }
        }
    };
    BCHAddressTranslator.translate = function (addresses, to, from) {
        var wasArray = true;
        if (!lodash_1.default.isArray(addresses)) {
            wasArray = false;
            addresses = [addresses];
        }
        from = from || BCHAddressTranslator.getAddressCoin(addresses[0]);
        var ret;
        if (from == to) {
            ret = addresses;
        }
        else {
            ret = lodash_1.default.filter(lodash_1.default.map(addresses, function (x) {
                var bitcore = Bitcore_[from == 'legacy' ? 'btc' : 'bch'];
                var orig;
                try {
                    orig = new bitcore.Address(x).toObject();
                }
                catch (e) {
                    return null;
                }
                if (to == 'cashaddr') {
                    return Bitcore_['bch'].Address.fromObject(orig).toCashAddress(true);
                }
                else if (to == 'copay') {
                    return Bitcore_['bch'].Address.fromObject(orig).toLegacyAddress();
                }
                else if (to == 'legacy') {
                    return Bitcore_['btc'].Address.fromObject(orig).toString();
                }
            }));
        }
        if (wasArray)
            return ret;
        else
            return ret[0];
    };
    return BCHAddressTranslator;
}());
exports.BCHAddressTranslator = BCHAddressTranslator;
module.exports = BCHAddressTranslator;
//# sourceMappingURL=bchaddresstranslator.js.map