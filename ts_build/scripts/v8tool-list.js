#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require('lodash');
var request = require('request');
var Bitcore = require('bitcore-lib');
var requestStream = require('request');
var client_1 = require("../lib//blockchainexplorers/v8/client");
var coin = process.argv[2];
if (!coin) {
    console.log(' Usage: coin authKey (extra: tokenAddress= )');
    process.exit(1);
}
var network = 'mainnet';
var authKey = process.argv[3];
var extra = process.argv[4] || '';
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
var client = new client_1.Client({
    baseUrl: baseUrl,
    authKey: authKeyObj
});
var url = baseUrl + "/wallet/" + pubKey + "/transactions?startBlock=0&includeMempool=true";
if (extra) {
    url = url + '&' + extra;
}
console.log('[v8tool.37:url:]', url);
var signature = client.sign({ method: 'GET', url: url });
var payload = {};
var acum = '';
var r = requestStream.get(url, {
    headers: { 'x-signature': signature },
    json: true
});
r.on('data', function (raw) {
    acum = acum + raw.toString();
});
r.on('end', function () {
    var txs = [], unconf = [], err;
    _.each(acum.split(/\r?\n/), function (rawTx) {
        if (!rawTx)
            return;
        var tx;
        try {
            tx = JSON.parse(rawTx);
        }
        catch (e) {
            console.log('v8 error at JSON.parse:' + e + ' Parsing:' + rawTx + ':');
        }
        if (tx.value)
            tx.amount = tx.satoshis / 1e8;
        if (tx.abiType)
            tx.abiType = JSON.stringify(tx.abiType);
        if (tx.height >= 0)
            txs.push(tx);
        else
            unconf.push(tx);
    });
    console.log('txs', _.flatten(_.orderBy(unconf, 'blockTime', 'desc').concat(txs.reverse())));
});
//# sourceMappingURL=v8tool-list.js.map