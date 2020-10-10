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
var async = __importStar(require("async"));
var fs = __importStar(require("fs"));
var lodash_1 = __importDefault(require("lodash"));
require("source-map-support/register");
var logger_1 = __importDefault(require("./logger"));
var messagebroker_1 = require("./messagebroker");
var storage_1 = require("./storage");
var Mustache = require('mustache');
var defaultRequest = require('request');
var path = require('path');
var Utils = require('./common/utils');
var Defaults = require('./common/defaults');
var Constants = require('./common/constants');
var sjcl = require('sjcl');
var PUSHNOTIFICATIONS_TYPES = {
    NewCopayer: {
        filename: 'new_copayer'
    },
    WalletComplete: {
        filename: 'wallet_complete'
    },
    NewTxProposal: {
        filename: 'new_tx_proposal'
    },
    NewOutgoingTx: {
        filename: 'new_outgoing_tx'
    },
    NewIncomingTx: {
        filename: 'new_incoming_tx'
    },
    TxProposalFinallyRejected: {
        filename: 'txp_finally_rejected'
    },
    TxConfirmation: {
        filename: 'tx_confirmation',
        notifyCreatorOnly: true
    }
};
var PushNotificationsService = (function () {
    function PushNotificationsService() {
    }
    PushNotificationsService.prototype.start = function (opts, cb) {
        var _this = this;
        opts = opts || {};
        this.request = opts.request || defaultRequest;
        var _readDirectories = function (basePath, cb) {
            fs.readdir(basePath, function (err, files) {
                if (err)
                    return cb(err);
                async.filter(files, function (file, next) {
                    fs.stat(path.join(basePath, file), function (err, stats) {
                        return next(!err && stats.isDirectory());
                    });
                }, function (dirs) {
                    return cb(null, dirs);
                });
            });
        };
        this.templatePath = path.normalize((opts.pushNotificationsOpts.templatePath || __dirname + '../../templates') + '/');
        this.defaultLanguage = opts.pushNotificationsOpts.defaultLanguage || 'en';
        this.defaultUnit = opts.pushNotificationsOpts.defaultUnit || 'btc';
        this.subjectPrefix = opts.pushNotificationsOpts.subjectPrefix || '';
        this.pushServerUrl = opts.pushNotificationsOpts.pushServerUrl;
        this.authorizationKey = opts.pushNotificationsOpts.authorizationKey;
        if (!this.authorizationKey)
            return cb(new Error('Missing authorizationKey attribute in configuration.'));
        async.parallel([
            function (done) {
                _readDirectories(_this.templatePath, function (err, res) {
                    _this.availableLanguages = res;
                    done(err);
                });
            },
            function (done) {
                if (opts.storage) {
                    _this.storage = opts.storage;
                    done();
                }
                else {
                    _this.storage = new storage_1.Storage();
                    _this.storage.connect(opts.storageOpts, done);
                }
            },
            function (done) {
                _this.messageBroker = opts.messageBroker || new messagebroker_1.MessageBroker(opts.messageBrokerOpts);
                _this.messageBroker.onMessage(lodash_1.default.bind(_this._sendPushNotifications, _this));
                done();
            }
        ], function (err) {
            if (err) {
                logger_1.default.error(err);
            }
            return cb(err);
        });
    };
    PushNotificationsService.prototype._sendPushNotifications = function (notification, cb) {
        var _this = this;
        cb = cb || function () { };
        var notifType = PUSHNOTIFICATIONS_TYPES[notification.type];
        if (!notifType)
            return cb();
        logger_1.default.debug('Notification received: ' + notification.type);
        logger_1.default.debug(JSON.stringify(notification));
        this._checkShouldSendNotif(notification, function (err, should) {
            if (err)
                return cb(err);
            logger_1.default.debug('Should send notification: ', should);
            if (!should)
                return cb();
            _this._getRecipientsList(notification, notifType, function (err, recipientsList) {
                if (err)
                    return cb(err);
                async.waterfall([
                    function (next) {
                        _this._readAndApplyTemplates(notification, notifType, recipientsList, next);
                    },
                    function (contents, next) {
                        async.map(recipientsList, function (recipient, next) {
                            var content = contents[recipient.language];
                            _this.storage.fetchPushNotificationSubs(recipient.copayerId, function (err, subs) {
                                if (err)
                                    return next(err);
                                var notifications = lodash_1.default.map(subs, function (sub) {
                                    var tokenAddress = notification.data && notification.data.tokenAddress ? notification.data.tokenAddress : null;
                                    var multisigContractAddress = notification.data && notification.data.multisigContractAddress
                                        ? notification.data.multisigContractAddress
                                        : null;
                                    return {
                                        to: sub.token,
                                        priority: 'high',
                                        restricted_package_name: sub.packageName,
                                        notification: {
                                            title: content.plain.subject,
                                            body: content.plain.body,
                                            sound: 'default',
                                            click_action: 'FCM_PLUGIN_ACTIVITY',
                                            icon: 'fcm_push_icon'
                                        },
                                        data: {
                                            walletId: sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(notification.walletId)),
                                            tokenAddress: tokenAddress,
                                            multisigContractAddress: multisigContractAddress,
                                            copayerId: sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(recipient.copayerId)),
                                            title: content.plain.subject,
                                            body: content.plain.body,
                                            notification_type: notification.type
                                        }
                                    };
                                });
                                return next(err, notifications);
                            });
                        }, function (err, allNotifications) {
                            if (err)
                                return next(err);
                            return next(null, lodash_1.default.flatten(allNotifications));
                        });
                    },
                    function (notifications, next) {
                        async.each(notifications, function (notification, next) {
                            _this._makeRequest(notification, function (err, response) {
                                if (err)
                                    logger_1.default.error(err);
                                if (response) {
                                    logger_1.default.debug('Request status: ', response.statusCode);
                                    logger_1.default.debug('Request message: ', response.statusMessage);
                                    logger_1.default.debug('Request body: ', response.request.body);
                                }
                                next();
                            });
                        }, function (err) {
                            return next(err);
                        });
                    }
                ], function (err) {
                    if (err) {
                        logger_1.default.error('An error ocurred generating notification', err);
                    }
                    return cb(err);
                });
            });
        });
    };
    PushNotificationsService.prototype._checkShouldSendNotif = function (notification, cb) {
        if (notification.type != 'NewTxProposal')
            return cb(null, true);
        this.storage.fetchWallet(notification.walletId, function (err, wallet) {
            return cb(err, wallet && wallet.m > 1);
        });
    };
    PushNotificationsService.prototype._getRecipientsList = function (notification, notificationType, cb) {
        var _this = this;
        this.storage.fetchWallet(notification.walletId, function (err, wallet) {
            if (err)
                return cb(err);
            var unit;
            if (wallet.coin != Defaults.COIN) {
                unit = wallet.coin;
            }
            _this.storage.fetchPreferences(notification.walletId, null, function (err, preferences) {
                if (err)
                    logger_1.default.error(err);
                if (lodash_1.default.isEmpty(preferences))
                    preferences = [];
                var recipientPreferences = lodash_1.default.compact(lodash_1.default.map(preferences, function (p) {
                    if (!lodash_1.default.includes(_this.availableLanguages, p.language)) {
                        if (p.language)
                            logger_1.default.warn('Language for notifications "' + p.language + '" not available.');
                        p.language = _this.defaultLanguage;
                    }
                    return {
                        copayerId: p.copayerId,
                        language: p.language,
                        unit: unit || p.unit || _this.defaultUnit
                    };
                }));
                var copayers = lodash_1.default.keyBy(recipientPreferences, 'copayerId');
                var recipientsList = lodash_1.default.compact(lodash_1.default.map(wallet.copayers, function (copayer) {
                    if ((copayer.id == notification.creatorId && notificationType.notifyCreatorOnly) ||
                        (copayer.id != notification.creatorId && !notificationType.notifyCreatorOnly)) {
                        var p = copayers[copayer.id] || {
                            language: _this.defaultLanguage,
                            unit: _this.defaultUnit
                        };
                        return {
                            copayerId: copayer.id,
                            language: p.language || _this.defaultLanguage,
                            unit: unit || p.unit || _this.defaultUnit
                        };
                    }
                }));
                return cb(null, recipientsList);
            });
        });
    };
    PushNotificationsService.prototype._readAndApplyTemplates = function (notification, notifType, recipientsList, cb) {
        var _this = this;
        async.map(recipientsList, function (recipient, next) {
            async.waterfall([
                function (next) {
                    _this._getDataForTemplate(notification, recipient, next);
                },
                function (data, next) {
                    async.map(['plain', 'html'], function (type, next) {
                        _this._loadTemplate(notifType, recipient, '.' + type, function (err, template) {
                            if (err && type == 'html')
                                return next();
                            if (err)
                                return next(err);
                            _this._applyTemplate(template, data, function (err, res) {
                                return next(err, [type, res]);
                            });
                        });
                    }, function (err, res) {
                        return next(err, lodash_1.default.fromPairs(res.filter(Boolean)));
                    });
                },
                function (result, next) {
                    next(null, result);
                }
            ], function (err, res) {
                next(err, [recipient.language, res]);
            });
        }, function (err, res) {
            return cb(err, lodash_1.default.fromPairs(res.filter(Boolean)));
        });
    };
    PushNotificationsService.prototype._getDataForTemplate = function (notification, recipient, cb) {
        var UNIT_LABELS = {
            btc: 'BTC',
            bit: 'bits',
            bch: 'BCH',
            eth: 'ETH',
            xrp: 'XRP',
            usdc: 'USDC',
            pax: 'PAX',
            gusd: 'GUSD',
            busd: 'BUSD'
        };
        var data = lodash_1.default.cloneDeep(notification.data);
        data.subjectPrefix = lodash_1.default.trim(this.subjectPrefix + ' ');
        if (data.amount) {
            try {
                var unit = recipient.unit.toLowerCase();
                var label = UNIT_LABELS[unit];
                if (data.tokenAddress) {
                    var tokenAddress = data.tokenAddress.toLowerCase();
                    if (Constants.TOKEN_OPTS[tokenAddress]) {
                        unit = Constants.TOKEN_OPTS[tokenAddress].symbol.toLowerCase();
                        label = UNIT_LABELS[unit];
                    }
                    else {
                        label = 'tokens';
                        throw new Error('Notifications for unsupported token are not allowed');
                    }
                }
                data.amount = Utils.formatAmount(+data.amount, unit) + ' ' + label;
            }
            catch (ex) {
                return cb(new Error('Could not format amount' + ex));
            }
        }
        this.storage.fetchWallet(notification.walletId, function (err, wallet) {
            if (err || !wallet)
                return cb(err);
            data.walletId = wallet.id;
            data.walletName = wallet.name;
            data.walletM = wallet.m;
            data.walletN = wallet.n;
            var copayer = wallet.copayers.find(function (c) { return c.id === notification.creatorId; });
            if (copayer) {
                data.copayerId = copayer.id;
                data.copayerName = copayer.name;
            }
            if (notification.type == 'TxProposalFinallyRejected' && data.rejectedBy) {
                var rejectors = lodash_1.default.map(data.rejectedBy, function (copayerId) {
                    return wallet.copayers.find(function (c) { return c.id === copayerId; }).name;
                });
                data.rejectorsNames = rejectors.join(', ');
            }
            return cb(null, data);
        });
    };
    PushNotificationsService.prototype._applyTemplate = function (template, data, cb) {
        if (!data)
            return cb(new Error('Could not apply template to empty data'));
        var error;
        var result = lodash_1.default.mapValues(template, function (t) {
            try {
                return Mustache.render(t, data);
            }
            catch (e) {
                logger_1.default.error('Could not apply data to template', e);
                error = e;
            }
        });
        if (error)
            return cb(error);
        return cb(null, result);
    };
    PushNotificationsService.prototype._loadTemplate = function (notifType, recipient, extension, cb) {
        var _this = this;
        this._readTemplateFile(recipient.language, notifType.filename + extension, function (err, template) {
            if (err)
                return cb(err);
            return cb(null, _this._compileTemplate(template, extension));
        });
    };
    PushNotificationsService.prototype._readTemplateFile = function (language, filename, cb) {
        var fullFilename = path.join(this.templatePath, language, filename);
        fs.readFile(fullFilename, 'utf8', function (err, template) {
            if (err) {
                return cb(new Error('Could not read template file ' + fullFilename + err));
            }
            return cb(null, template);
        });
    };
    PushNotificationsService.prototype._compileTemplate = function (template, extension) {
        var lines = template.split('\n');
        if (extension == '.html') {
            lines.unshift('');
        }
        return {
            subject: lines[0],
            body: lodash_1.default.tail(lines).join('\n')
        };
    };
    PushNotificationsService.prototype._makeRequest = function (opts, cb) {
        this.request({
            url: this.pushServerUrl + '/send',
            method: 'POST',
            json: true,
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'key=' + this.authorizationKey
            },
            body: opts
        }, cb);
    };
    return PushNotificationsService;
}());
exports.PushNotificationsService = PushNotificationsService;
//# sourceMappingURL=pushnotificationsservice.js.map