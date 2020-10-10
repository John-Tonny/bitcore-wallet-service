"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = __importDefault(require("lodash"));
module.exports = {
    name: 'BitPay',
    url: 'https://bitpay.com/api/rates/',
    parseFn: function (raw) {
        var rates = lodash_1.default.compact(lodash_1.default.map(raw, function (d) {
            if (!d.code || !d.rate)
                return null;
            return {
                code: d.code,
                value: +d.rate
            };
        }));
        return rates;
    }
};
//# sourceMappingURL=bitpay.js.map