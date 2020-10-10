"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var crypto_wallet_core_1 = require("crypto-wallet-core");
var lodash_1 = __importDefault(require("lodash"));
var addressmanager_1 = require("./addressmanager");
var $ = require('preconditions').singleton();
var Common = require('../common');
var Constants = Common.Constants, Defaults = Common.Defaults, Utils = Common.Utils;
var Address = (function () {
    function Address() {
    }
    Address.create = function (opts) {
        opts = opts || {};
        var x = new Address();
        $.checkArgument(Utils.checkValueInCollection(opts.coin, Constants.COINS));
        x.version = '1.0.0';
        x.createdOn = Math.floor(Date.now() / 1000);
        x.address = opts.address;
        x.walletId = opts.walletId;
        x.isChange = opts.isChange;
        x.path = opts.path;
        x.publicKeys = opts.publicKeys;
        x.coin = opts.coin;
        x.network = Address.Bitcore[opts.coin]
            ? Address.Bitcore[opts.coin].Address(x.address).toObject().network
            : opts.network;
        x.type = opts.type || Constants.SCRIPT_TYPES.P2SH;
        x.hasActivity = undefined;
        x.beRegistered = null;
        return x;
    };
    Address.fromObj = function (obj) {
        var x = new Address();
        x.version = obj.version;
        x.createdOn = obj.createdOn;
        x.address = obj.address;
        x.walletId = obj.walletId;
        x.coin = obj.coin || Defaults.COIN;
        x.network = obj.network;
        x.isChange = obj.isChange;
        x.path = obj.path;
        x.publicKeys = obj.publicKeys;
        x.type = obj.type || Constants.SCRIPT_TYPES.P2SH;
        x.hasActivity = obj.hasActivity;
        x.beRegistered = obj.beRegistered;
        return x;
    };
    Address._deriveAddress = function (scriptType, publicKeyRing, path, m, coin, network, noNativeCashAddr) {
        $.checkArgument(Utils.checkValueInCollection(scriptType, Constants.SCRIPT_TYPES));
        var publicKeys = lodash_1.default.map(publicKeyRing, function (item) {
            var xpub = Address.Bitcore[coin]
                ? new Address.Bitcore[coin].HDPublicKey(item.xPubKey)
                : new Address.Bitcore.btc.HDPublicKey(item.xPubKey);
            return xpub.deriveChild(path).publicKey;
        });
        var bitcoreAddress;
        switch (scriptType) {
            case Constants.SCRIPT_TYPES.P2WSH:
                var nestedWitness = false;
                bitcoreAddress = Address.Bitcore[coin].Address.createMultisig(publicKeys, m, network, nestedWitness, 'witnessscripthash');
                break;
            case Constants.SCRIPT_TYPES.P2SH:
                bitcoreAddress = Address.Bitcore[coin].Address.createMultisig(publicKeys, m, network);
                break;
            case Constants.SCRIPT_TYPES.P2WPKH:
                bitcoreAddress = Address.Bitcore.btc.Address.fromPublicKey(publicKeys[0], network, 'witnesspubkeyhash');
                break;
            case Constants.SCRIPT_TYPES.P2PKH:
                $.checkState(lodash_1.default.isArray(publicKeys) && publicKeys.length == 1);
                if (Address.Bitcore[coin]) {
                    bitcoreAddress = Address.Bitcore[coin].Address.fromPublicKey(publicKeys[0], network);
                }
                else {
                    var _a = new addressmanager_1.AddressManager().parseDerivationPath(path), addressIndex = _a.addressIndex, isChange = _a.isChange;
                    var xPubKey = publicKeyRing[0].xPubKey;
                    bitcoreAddress = crypto_wallet_core_1.Deriver.deriveAddress(coin.toUpperCase(), network, xPubKey, addressIndex, isChange);
                }
                break;
        }
        var addrStr = bitcoreAddress.toString(true);
        if (noNativeCashAddr && coin == 'bch') {
            addrStr = bitcoreAddress.toLegacyAddress();
        }
        return {
            address: addrStr,
            path: path,
            publicKeys: lodash_1.default.invokeMap(publicKeys, 'toString')
        };
    };
    Address.derive = function (walletId, scriptType, publicKeyRing, path, m, coin, network, isChange, noNativeCashAddr) {
        if (noNativeCashAddr === void 0) { noNativeCashAddr = false; }
        var raw = Address._deriveAddress(scriptType, publicKeyRing, path, m, coin, network, noNativeCashAddr);
        return Address.create(lodash_1.default.extend(raw, {
            coin: coin,
            network: network,
            walletId: walletId,
            type: scriptType,
            isChange: isChange
        }));
    };
    Address.Bitcore = {
        btc: require('bitcore-lib'),
        bch: require('bitcore-lib-cash'),
        vcl: require('vircle-lib')
    };
    return Address;
}());
exports.Address = Address;
//# sourceMappingURL=address.js.map