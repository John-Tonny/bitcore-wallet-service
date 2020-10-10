"use strict";
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
var CWC = __importStar(require("crypto-wallet-core"));
var lodash_1 = __importDefault(require("lodash"));
var $ = require('preconditions').singleton();
var bitcore = require('bitcore-lib');
var crypto = bitcore.crypto;
var secp256k1 = require('secp256k1');
var Bitcore = require('bitcore-lib');
var Bitcore_ = {
    btc: Bitcore,
    bch: require('bitcore-lib-cash'),
    vcl: require('vircle-lib')
};
var Utils = (function () {
    function Utils() {
    }
    Utils.getMissingFields = function (obj, args) {
        args = [].concat(args);
        if (!lodash_1.default.isObject(obj))
            return args;
        var missing = lodash_1.default.filter(args, function (arg) {
            return !obj.hasOwnProperty(arg);
        });
        return missing;
    };
    Utils.strip = function (number) {
        return parseFloat(number.toPrecision(12));
    };
    Utils.hashMessage = function (text, noReverse) {
        $.checkArgument(text);
        var buf = new Buffer(text);
        var ret = crypto.Hash.sha256sha256(buf);
        if (!noReverse) {
            ret = new bitcore.encoding.BufferReader(ret).readReverse();
        }
        return ret;
    };
    Utils.verifyMessage = function (message, signature, publicKey) {
        $.checkArgument(message);
        var flattenedMessage = lodash_1.default.isArray(message) ? lodash_1.default.join(message) : message;
        var hash = Utils.hashMessage(flattenedMessage, true);
        var sig = this._tryImportSignature(signature);
        if (!sig) {
            return false;
        }
        var publicKeyBuffer = this._tryImportPublicKey(publicKey);
        if (!publicKeyBuffer) {
            return false;
        }
        return this._tryVerifyMessage(hash, sig, publicKeyBuffer);
    };
    Utils._tryImportPublicKey = function (publicKey) {
        var publicKeyBuffer = publicKey;
        try {
            if (!Buffer.isBuffer(publicKey)) {
                publicKeyBuffer = new Buffer(publicKey, 'hex');
            }
            return publicKeyBuffer;
        }
        catch (e) {
            return false;
        }
    };
    Utils._tryImportSignature = function (signature) {
        try {
            var signatureBuffer = signature;
            if (!Buffer.isBuffer(signature)) {
                signatureBuffer = new Buffer(signature, 'hex');
            }
            return secp256k1.signatureImport(signatureBuffer);
        }
        catch (e) {
            return false;
        }
    };
    Utils._tryVerifyMessage = function (hash, sig, publicKeyBuffer) {
        try {
            return secp256k1.verify(hash, sig, publicKeyBuffer);
        }
        catch (e) {
            return false;
        }
    };
    Utils.formatAmount = function (satoshis, unit, opts) {
        var UNITS = Object.entries(CWC.Constants.UNITS).reduce(function (units, _a) {
            var currency = _a[0], currencyConfig = _a[1];
            units[currency] = {
                toSatoshis: currencyConfig.toSatoshis,
                maxDecimals: currencyConfig.short.maxDecimals,
                minDecimals: currencyConfig.short.minDecimals
            };
            return units;
        }, {});
        $.shouldBeNumber(satoshis);
        $.checkArgument(lodash_1.default.includes(lodash_1.default.keys(UNITS), unit));
        function addSeparators(nStr, thousands, decimal, minDecimals) {
            nStr = nStr.replace('.', decimal);
            var x = nStr.split(decimal);
            var x0 = x[0];
            var x1 = x[1];
            x1 = lodash_1.default.dropRightWhile(x1, function (n, i) {
                return n == '0' && i >= minDecimals;
            }).join('');
            var x2 = x.length > 1 ? decimal + x1 : '';
            x0 = x0.replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
            return x0 + x2;
        }
        opts = opts || {};
        if (!UNITS[unit]) {
            return Number(satoshis).toLocaleString();
        }
        var u = lodash_1.default.assign(UNITS[unit], opts);
        var amount = (satoshis / u.toSatoshis).toFixed(u.maxDecimals);
        return addSeparators(amount, opts.thousandsSeparator || ',', opts.decimalSeparator || '.', u.minDecimals);
    };
    Utils.formatAmountInBtc = function (amount) {
        return (Utils.formatAmount(amount, 'btc', {
            minDecimals: 8,
            maxDecimals: 8
        }) + 'btc');
    };
    Utils.formatAmountInVcl = function (amount) {
        return (Utils.formatAmount(amount, 'vcl', {
            minDecimals: 8,
            maxDecimals: 8
        }) + 'vcl');
    };
    Utils.formatUtxos = function (utxos) {
        if (lodash_1.default.isEmpty(utxos))
            return 'none';
        return lodash_1.default.map([].concat(utxos), function (i) {
            var amount = Utils.formatAmountInBtc(i.satoshis);
            var confirmations = i.confirmations ? i.confirmations + 'c' : 'u';
            return amount + '/' + confirmations;
        }).join(', ');
    };
    Utils.formatRatio = function (ratio) {
        return (ratio * 100).toFixed(4) + '%';
    };
    Utils.formatSize = function (size) {
        return (size / 1000).toFixed(4) + 'kB';
    };
    Utils.parseVersion = function (version) {
        var v = {};
        if (!version)
            return null;
        var x = version.split('-');
        if (x.length != 2) {
            v.agent = version;
            return v;
        }
        v.agent = lodash_1.default.includes(['bwc', 'bws'], x[0]) ? 'bwc' : x[0];
        x = x[1].split('.');
        v.major = x[0] ? parseInt(x[0]) : null;
        v.minor = x[1] ? parseInt(x[1]) : null;
        v.patch = x[2] ? parseInt(x[2]) : null;
        return v;
    };
    Utils.parseAppVersion = function (agent) {
        var v = {};
        if (!agent)
            return null;
        agent = agent.toLowerCase();
        var w;
        w = agent.indexOf('copay');
        if (w >= 0) {
            v.app = 'copay';
        }
        else {
            w = agent.indexOf('bitpay');
            if (w >= 0) {
                v.app = 'bitpay';
            }
            else {
                v.app = 'other';
                return v;
            }
        }
        var version = agent.substr(w + v.app.length);
        var x = version.split('.');
        v.major = x[0] ? parseInt(x[0].replace(/\D/g, '')) : null;
        v.minor = x[1] ? parseInt(x[1]) : null;
        v.patch = x[2] ? parseInt(x[2]) : null;
        return v;
    };
    Utils.getIpFromReq = function (req) {
        if (req.headers) {
            if (req.headers['x-forwarded-for'])
                return req.headers['x-forwarded-for'].split(',')[0];
            if (req.headers['x-real-ip'])
                return req.headers['x-real-ip'].split(',')[0];
        }
        if (req.ip)
            return req.ip;
        if (req.connection && req.connection.remoteAddress)
            return req.connection.remoteAddress;
        return '';
    };
    Utils.checkValueInCollection = function (value, collection) {
        if (!value || !lodash_1.default.isString(value))
            return false;
        return lodash_1.default.includes(lodash_1.default.values(collection), value);
    };
    Utils.getAddressCoin = function (address) {
        try {
            new Bitcore_['btc'].Address(address);
            return 'btc';
        }
        catch (e) {
            try {
                new Bitcore_['bch'].Address(address);
                return 'bch';
            }
            catch (e) {
                try {
                    new Bitcore_['vcl'].Address(address);
                    return 'vcl';
                }
                catch (e) {
                    return;
                }
            }
        }
    };
    Utils.translateAddress = function (address, coin) {
        var origCoin = Utils.getAddressCoin(address);
        var origAddress = new Bitcore_[origCoin].Address(address);
        var origObj = origAddress.toObject();
        var result = Bitcore_[coin].Address.fromObject(origObj);
        return coin == 'bch' ? result.toLegacyAddress() : result.toString();
    };
    return Utils;
}());
exports.Utils = Utils;
module.exports = Utils;
//# sourceMappingURL=utils.js.map