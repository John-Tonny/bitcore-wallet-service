"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var logger_1 = require("./logger");
function LogObj(logOut) {
    logger_1.logger.info("" + logOut.support + logOut.time + " | " + logOut.ip + " | " + (logOut.userAgent || 'na') + "  |  " + (logOut.walletId || '-') + "  | " + logOut.phase + " | " + logOut.took + " | " + logOut.method + " | " + logOut.status + " | " + logOut.url + " | " + logOut.openConnections + " open");
}
var openConnections = 0;
function LogPhase(req, res, phase) {
    var ip = req.header('CF-Connecting-IP') || req.socket.remoteAddress || req.hostname;
    var time = req.startTime ? req.startTime : new Date();
    var ua = req.headers['user-agent'] || '-';
    var ver = req.headers['x-client-version'] || '-';
    var support = req.isSupportStaff ? 'SUPPORT:' : '';
    var logOut = {
        support: support,
        time: logger_1.formatTimestamp(time),
        walletId: req.walletId,
        userAgent: ua + ':' + ver,
        ip: ip.padStart(22, ' '),
        phase: phase.padStart(8, ' '),
        method: req.method.padStart(6, ' '),
        status: '...'.padStart(5, ' '),
        url: "" + req.baseUrl + req.url,
        took: '...'.padStart(10, ' '),
        openConnections: openConnections.toString().padStart(6, ' ')
    };
    if (req.startTime && ['END', 'CLOSED'].includes(phase)) {
        var endTime = new Date();
        var startTime = req.startTime ? req.startTime : endTime;
        var totalTime = endTime.getTime() - startTime.getTime();
        var totalTimeMsg = (totalTime + " ms").padStart(10, ' ');
        logOut.took = totalTimeMsg.padStart(10, ' ');
        logOut.status = res.statusCode.toString().padStart(5, ' ');
    }
    LogObj(logOut);
}
function LogMiddleware() {
    return function (req, res, next) {
        req.startTime = new Date();
        openConnections++;
        res.on('finish', function () {
            openConnections--;
            LogPhase(req, res, 'END');
        });
        res.on('close', function () {
            openConnections--;
            LogPhase(req, res, 'CLOSED');
        });
        next();
    };
}
exports.LogMiddleware = LogMiddleware;
//# sourceMappingURL=middleware.js.map