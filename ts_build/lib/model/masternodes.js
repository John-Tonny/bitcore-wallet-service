"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Uuid = require('uuid');
var Masternodes = (function () {
    function Masternodes() {
    }
    Masternodes.create = function (opts) {
        opts = opts || {};
        var x = new Masternodes();
        var now = Date.now();
        x.createdOn = Math.floor(now / 1000);
        x.walletId = opts.walletId;
        x.txid = opts.txid;
        x.address = opts.address;
        x.masternodeKey = opts.masternodeKey;
        x.coin = opts.coin;
        x.network = opts.network;
        x.payee = opts.payee;
        x.status = opts.status;
        x.protocol = opts.protocol;
        x.daemonversion = opts.daemonversion;
        x.sentinelversion = opts.sentinelversion;
        x.sentinelstate = opts.sentinelstate;
        x.lastseen = opts.lastseen;
        x.activeseconds = opts.activeseconds;
        x.lastpaidtime = opts.lastpaidtime;
        x.lastpaidblock = opts.lastpaidblock;
        x.pingretries = opts.pingretries;
        return x;
    };
    Masternodes.fromObj = function (obj) {
        var x = new Masternodes();
        x.createdOn = obj.createdOn;
        x.walletId = obj.walletId;
        x.txid = obj.txid;
        x.masternodeKey = obj.masternodeKey;
        x.coin = obj.coin;
        x.network = obj.network;
        x.address = obj.address;
        x.payee = obj.payee;
        x.status = obj.status;
        x.protocol = obj.protocol;
        x.daemonversion = obj.daemonversion;
        x.sentinelversion = obj.sentinelversion;
        x.sentinelstate = obj.sentinelstate;
        x.lastseen = obj.lastseen;
        x.activeseconds = obj.activeseconds;
        x.lastpaidtime = obj.lastpaidtime;
        x.lastpaidblock = obj.lastpaidblock;
        x.pingretries = obj.pingretries;
        return x;
    };
    return Masternodes;
}());
exports.Masternodes = Masternodes;
//# sourceMappingURL=masternodes.js.map