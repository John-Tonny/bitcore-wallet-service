#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var request = require('request');
var Bitcore = require('bitcore-lib');
var client_1 = require("../lib//blockchainexplorers/v8/client");
var coin = process.argv[2];
if (!coin) {
    console.log(' Usage: coin authKey (extra: tokenAddress= )');
    process.exit(1);
}
var network = 'mainnet';
var authKey = process.argv[3];
var path = process.argv[4] || 'addresses';
var extra = process.argv[5] || '';
console.log('COIN:', coin);
if (!authKey)
    throw new Error('provide authKey');
var authKeyObj = Bitcore.PrivateKey(authKey);
var tmp = authKeyObj.toObject();
tmp.compressed = false;
var pubKey = Bitcore.PrivateKey(tmp).toPublicKey();
var BASE = {
    BTC: "https://api.bitcore.io/api/" + coin + "/" + network,
    BCH: "https://api.bitcore.io/api/" + coin + "/" + network,
    ETH: "https://api-eth.bitcore.io/api/" + coin + "/" + network,
    XRP: "https://api-xrp.bitcore.io/api/" + coin + "/" + network,
    VCL: "https://bws.vircle.xyz:1443/api/" + coin + "/" + network
};
var baseUrl = BASE[coin];
console.log('[v8tool.ts.37:baseUrl:]', baseUrl);
var client = new client_1.Client({
    baseUrl: baseUrl,
    authKey: authKeyObj
});
var url = baseUrl + "/wallet/" + pubKey + "/" + path;
if (extra) {
    url = url + '?' + extra;
}
console.log('[v8tool.ts.38:url:]', url);
console.log('[v8tool.37:url:]', url);
var signature = client.sign({ method: 'GET', url: url });
var payload = {};
request.get(url, {
    headers: { 'x-signature': signature },
    body: payload,
    json: true
}, function (err, req, body) {
    if (err) {
        console.log('[v8tool.43:err:]', err);
    }
    else {
        try {
            console.log('[v8tool.50:body:]', body);
        }
        catch (e) {
            console.log('[v8tool.52]', e, body);
        }
    }
});
//# sourceMappingURL=v8tool.js.map