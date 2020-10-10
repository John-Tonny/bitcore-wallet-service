"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = __importDefault(require("lodash"));
var index_1 = require("../chain/index");
var logger_1 = __importDefault(require("../logger"));
var address_1 = require("./address");
var addressmanager_1 = require("./addressmanager");
var copayer_1 = require("./copayer");
var $ = require('preconditions').singleton();
var Uuid = require('uuid');
var config = require('../../config');
var Common = require('../common');
var Constants = Common.Constants, Defaults = Common.Defaults, Utils = Common.Utils;
var Bitcore = {
    btc: require('bitcore-lib'),
    bch: require('bitcore-lib-cash'),
    eth: require('bitcore-lib'),
    vcl: require('vircle-lib'),
    xrp: require('bitcore-lib')
};
var Wallet = (function () {
    function Wallet() {
    }
    Wallet.create = function (opts) {
        opts = opts || {};
        var x = new Wallet();
        $.shouldBeNumber(opts.m);
        $.shouldBeNumber(opts.n);
        $.checkArgument(Utils.checkValueInCollection(opts.coin, Constants.COINS));
        $.checkArgument(Utils.checkValueInCollection(opts.network, Constants.NETWORKS));
        x.version = '1.0.0';
        x.createdOn = Math.floor(Date.now() / 1000);
        x.id = opts.id || Uuid.v4();
        x.name = opts.name;
        x.m = opts.m;
        x.n = opts.n;
        x.singleAddress = !!opts.singleAddress;
        x.status = 'pending';
        x.publicKeyRing = [];
        x.addressIndex = 0;
        x.copayers = [];
        x.pubKey = opts.pubKey;
        x.coin = opts.coin;
        x.network = opts.network;
        x.derivationStrategy = opts.derivationStrategy || Constants.DERIVATION_STRATEGIES.BIP45;
        x.addressType = opts.addressType || Constants.SCRIPT_TYPES.P2SH;
        x.addressManager = addressmanager_1.AddressManager.create({
            derivationStrategy: x.derivationStrategy
        });
        x.usePurpose48 = opts.usePurpose48;
        x.scanStatus = null;
        x.beRegistered = false;
        x.beAuthPrivateKey2 = null;
        x.beAuthPublicKey2 = null;
        x.nativeCashAddr = lodash_1.default.isUndefined(opts.nativeCashAddr) ? (x.coin == 'bch' ? true : null) : opts.nativeCashAddr;
        return x;
    };
    Wallet.fromObj = function (obj) {
        var x = new Wallet();
        $.shouldBeNumber(obj.m);
        $.shouldBeNumber(obj.n);
        x.version = obj.version;
        x.createdOn = obj.createdOn;
        x.id = obj.id;
        x.name = obj.name;
        x.m = obj.m;
        x.n = obj.n;
        x.singleAddress = !!obj.singleAddress;
        x.status = obj.status;
        x.publicKeyRing = obj.publicKeyRing;
        x.copayers = lodash_1.default.map(obj.copayers, function (copayer) {
            return copayer_1.Copayer.fromObj(copayer);
        });
        x.pubKey = obj.pubKey;
        x.coin = obj.coin || Defaults.COIN;
        x.network = obj.network;
        if (!x.network) {
            x.network = obj.isTestnet ? 'testnet' : 'livenet';
        }
        x.derivationStrategy = obj.derivationStrategy || Constants.DERIVATION_STRATEGIES.BIP45;
        x.addressType = obj.addressType || Constants.SCRIPT_TYPES.P2SH;
        x.addressManager = addressmanager_1.AddressManager.fromObj(obj.addressManager);
        x.scanStatus = obj.scanStatus;
        x.beRegistered = obj.beRegistered;
        x.beAuthPrivateKey2 = obj.beAuthPrivateKey2;
        x.beAuthPublicKey2 = obj.beAuthPublicKey2;
        x.nativeCashAddr = obj.nativeCashAddr;
        x.usePurpose48 = obj.usePurpose48;
        return x;
    };
    Wallet.prototype.toObject = function () {
        var x = lodash_1.default.cloneDeep(this);
        x.isShared = this.isShared();
        return x;
    };
    Wallet.getMaxRequiredCopayers = function (totalCopayers) {
        return Wallet.COPAYER_PAIR_LIMITS[totalCopayers];
    };
    Wallet.verifyCopayerLimits = function (m, n) {
        return n >= 1 && n <= 15 && m >= 1 && m <= n;
    };
    Wallet.prototype.isShared = function () {
        return this.n > 1;
    };
    Wallet.prototype.isUTXOCoin = function () {
        return !!Constants.UTXO_COINS[this.coin.toUpperCase()];
    };
    Wallet.prototype.updateBEKeys = function () {
        $.checkState(this.isComplete());
        var chain = index_1.ChainService.getChain(this.coin).toLowerCase();
        var bitcore = Bitcore[chain];
        var salt = config.BE_KEY_SALT || Defaults.BE_KEY_SALT;
        var seed = lodash_1.default.map(this.copayers, 'xPubKey')
            .sort()
            .join('') +
            this.network +
            this.coin +
            salt;
        seed = bitcore.crypto.Hash.sha256(new Buffer(seed));
        var priv = bitcore.PrivateKey(seed, this.network);
        this.beAuthPrivateKey2 = priv.toString();
        this.beAuthPublicKey2 = priv.toPublicKey().toString();
    };
    Wallet.prototype._updatePublicKeyRing = function () {
        this.publicKeyRing = lodash_1.default.map(this.copayers, function (copayer) {
            return lodash_1.default.pick(copayer, ['xPubKey', 'requestPubKey']);
        });
    };
    Wallet.prototype.addCopayer = function (copayer) {
        $.checkState(copayer.coin == this.coin);
        this.copayers.push(copayer);
        if (this.copayers.length < this.n)
            return;
        this.status = 'complete';
        this._updatePublicKeyRing();
    };
    Wallet.prototype.addCopayerRequestKey = function (copayerId, requestPubKey, signature, restrictions, name) {
        $.checkState(this.copayers.length == this.n);
        var c = this.getCopayer(copayerId);
        c.requestPubKeys.unshift({
            key: requestPubKey.toString(),
            signature: signature,
            selfSigned: true,
            restrictions: restrictions || {},
            name: name || null
        });
    };
    Wallet.prototype.getCopayer = function (copayerId) {
        return this.copayers.find(function (c) { return c.id == copayerId; });
    };
    Wallet.prototype.isComplete = function () {
        return this.status == 'complete';
    };
    Wallet.prototype.isScanning = function () {
        return this.scanning;
    };
    Wallet.prototype.createAddress = function (isChange, step) {
        $.checkState(this.isComplete());
        var path = this.addressManager.getNewAddressPath(isChange, step);
        logger_1.default.debug('Deriving addr:' + path);
        var address = address_1.Address.derive(this.id, this.addressType, this.publicKeyRing, path, this.m, this.coin, this.network, isChange, !this.nativeCashAddr);
        return address;
    };
    Wallet.prototype.getSkippedAddress = function () {
        $.checkState(this.isComplete());
        var next = this.addressManager.getNextSkippedPath();
        if (!next)
            return;
        var address = address_1.Address.derive(this.id, this.addressType, this.publicKeyRing, next.path, this.m, this.coin, this.network, next.isChange);
        return address;
    };
    Wallet.COPAYER_PAIR_LIMITS = {};
    return Wallet;
}());
exports.Wallet = Wallet;
//# sourceMappingURL=wallet.js.map