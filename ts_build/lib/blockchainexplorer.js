"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = __importDefault(require("lodash"));
var v8_1 = require("./blockchainexplorers/v8");
var index_1 = require("./chain/index");
var $ = require('preconditions').singleton();
var Common = require('./common');
var Defaults = Common.Defaults;
var PROVIDERS = {
    v8: {
        btc: {
            livenet: 'https://api.bitpay.com',
            testnet: 'https://api.bitpay.com'
        },
        bch: {
            livenet: 'https://api.bitpay.com',
            testnet: 'https://api.bitpay.com'
        },
        eth: {
            livenet: 'https://api-eth.bitcore.io',
            testnet: 'https://api-eth.bitcore.io'
        },
        xrp: {
            livenet: 'https://api-xrp.bitcore.io',
            testnet: 'https://api-xrp.bitcore.io'
        },
        vcl: {
            livenet: 'https://bws.vircle.xyz',
            testnet: 'https://bws.vircle.xyz'
        }
    }
};
function BlockChainExplorer(opts) {
    $.checkArgument(opts);
    var provider = opts.provider || 'v8';
    var coin = index_1.ChainService.getChain(opts.coin || Defaults.COIN).toLowerCase();
    var network = opts.network || 'livenet';
    $.checkState(PROVIDERS[provider], 'Provider ' + provider + ' not supported');
    $.checkState(lodash_1.default.includes(lodash_1.default.keys(PROVIDERS[provider]), coin), 'Coin ' + coin + ' not supported by this provider');
    $.checkState(lodash_1.default.includes(lodash_1.default.keys(PROVIDERS[provider][coin]), network), 'Network ' + network + ' not supported by this provider for coin ' + coin);
    var url = opts.url || PROVIDERS[provider][coin][network];
    if (coin != 'bch' && opts.addressFormat)
        throw new Error('addressFormat only supported for bch');
    if (coin == 'bch' && !opts.addressFormat)
        opts.addressFormat = 'cashaddr';
    switch (provider) {
        case 'v8':
            return new v8_1.V8({
                coin: coin,
                network: network,
                url: url,
                apiPrefix: opts.apiPrefix,
                userAgent: opts.userAgent,
                addressFormat: opts.addressFormat
            });
        default:
            throw new Error('Provider ' + provider + ' not supported.');
    }
}
exports.BlockChainExplorer = BlockChainExplorer;
//# sourceMappingURL=blockchainexplorer.js.map