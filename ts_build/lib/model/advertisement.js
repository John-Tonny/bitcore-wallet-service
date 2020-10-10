"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var $ = require('preconditions').singleton();
var _ = require('lodash');
var Advertisement = (function () {
    function Advertisement() {
    }
    Advertisement.create = function (opts) {
        opts = opts || {};
        var x = new Advertisement();
        x.name = opts.name;
        x.title = opts.title;
        x.country = opts.country;
        x.type = opts.type;
        x.body = opts.body;
        x.imgUrl = opts.imgUrl;
        x.linkText = opts.linkText;
        x.linkUrl = opts.linkUrl;
        x.app = opts.app;
        x.dismissible = opts.dismissible;
        x.signature = opts.signature;
        x.isAdActive = opts.isAdActive;
        x.isTesting = opts.isTesting;
        x.appVersion = opts.appVersion;
        return x;
    };
    Advertisement.fromObj = function (obj) {
        var x = new Advertisement();
        x.name = obj.name;
        x.advertisementId = obj.advertisementId;
        x.title = obj.title;
        x.country = obj.country;
        x.type = obj.type;
        x.body = obj.body;
        x.imgUrl = obj.imgUrl;
        x.linkText = obj.linkText;
        x.linkUrl = obj.linkUrl;
        x.app = obj.app;
        x.dismissible = obj.dismissible;
        x.signature = obj.signature;
        x.isAdActive = obj.isAdActive;
        x.isTesting = obj.isTesting;
        x.appVersion = obj.appVersion;
        return x;
    };
    Advertisement.prototype.toObject = function () {
        var x = _.cloneDeep(this);
        return x;
    };
    return Advertisement;
}());
exports.Advertisement = Advertisement;
//# sourceMappingURL=advertisement.js.map