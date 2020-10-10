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
var _ = __importStar(require("lodash"));
require("source-map-support/register");
var lock_1 = require("./lock");
var logger_1 = __importDefault(require("./logger"));
var messagebroker_1 = require("./messagebroker");
var model_1 = require("./model");
var storage_1 = require("./storage");
var Mustache = require('mustache');
var fs = require('fs');
var path = require('path');
var Utils = require('./common/utils');
var Defaults = require('./common/defaults');
var EMAIL_TYPES = {
    NewCopayer: {
        filename: 'new_copayer',
        notifyDoer: false,
        notifyOthers: true
    },
    WalletComplete: {
        filename: 'wallet_complete',
        notifyDoer: true,
        notifyOthers: true
    },
    NewTxProposal: {
        filename: 'new_tx_proposal',
        notifyDoer: false,
        notifyOthers: true
    },
    NewOutgoingTx: {
        filename: 'new_outgoing_tx',
        notifyDoer: true,
        notifyOthers: true
    },
    NewIncomingTx: {
        filename: 'new_incoming_tx',
        notifyDoer: true,
        notifyOthers: true
    },
    TxProposalFinallyRejected: {
        filename: 'txp_finally_rejected',
        notifyDoer: false,
        notifyOthers: true
    },
    TxConfirmation: {
        filename: 'tx_confirmation',
        notifyDoer: true,
        notifyOthers: false
    }
};
var EmailService = (function () {
    function EmailService() {
    }
    EmailService.prototype.start = function (opts, cb) {
        var _this = this;
        opts = opts || {};
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
        opts.emailOpts = opts.emailOpts || {};
        this.defaultLanguage = opts.emailOpts.defaultLanguage || 'en';
        this.defaultUnit = opts.emailOpts.defaultUnit || 'vcl';
        logger_1.default.info('Email templates at:' + (opts.emailOpts.templatePath || __dirname + '/../../templates') + '/');
        this.templatePath = path.normalize((opts.emailOpts.templatePath || __dirname + '/../../templates') + '/');
        this.publicTxUrlTemplate = opts.emailOpts.publicTxUrlTemplate || {};
        this.subjectPrefix = opts.emailOpts.subjectPrefix || '[Wallet service]';
        this.from = opts.emailOpts.from;
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
                _this.messageBroker.onMessage(_.bind(_this.sendEmail, _this));
                done();
            },
            function (done) {
                _this.lock = opts.lock || new lock_1.Lock(_this.storage, opts.lockOpts);
                done();
            },
            function (done) {
                _this.mailer = opts.mailer;
                done();
            }
        ], function (err) {
            if (err) {
                logger_1.default.error(err);
            }
            return cb(err);
        });
    };
    EmailService.prototype._compileTemplate = function (template, extension) {
        var lines = template.split('\n');
        if (extension == '.html') {
            lines.unshift('');
        }
        return {
            subject: lines[0],
            body: _.tail(lines).join('\n')
        };
    };
    EmailService.prototype._readTemplateFile = function (language, filename, cb) {
        var fullFilename = path.join(this.templatePath, language, filename);
        fs.readFile(fullFilename, 'utf8', function (err, template) {
            if (err) {
                return cb(new Error('Could not read template file ' + fullFilename + err));
            }
            return cb(null, template);
        });
    };
    EmailService.prototype._loadTemplate = function (emailType, recipient, extension, cb) {
        var _this = this;
        this._readTemplateFile(recipient.language, emailType.filename + extension, function (err, template) {
            if (err)
                return cb(err);
            return cb(null, _this._compileTemplate(template, extension));
        });
    };
    EmailService.prototype._applyTemplate = function (template, data, cb) {
        if (!data)
            return cb(new Error('Could not apply template to empty data'));
        var error;
        var result = _.mapValues(template, function (t) {
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
    EmailService.prototype._getRecipientsList = function (notification, emailType, cb) {
        var _this = this;
        this.storage.fetchWallet(notification.walletId, function (err, wallet) {
            if (err)
                return cb(err);
            _this.storage.fetchPreferences(notification.walletId, null, function (err, preferences) {
                if (err)
                    return cb(err);
                if (_.isEmpty(preferences))
                    return cb(null, []);
                var usedEmails = {};
                var recipients = _.compact(_.map(preferences, function (p) {
                    if (!p.email || usedEmails[p.email])
                        return;
                    usedEmails[p.email] = true;
                    if (notification.creatorId == p.copayerId && !emailType.notifyDoer)
                        return;
                    if (notification.creatorId != p.copayerId && !emailType.notifyOthers)
                        return;
                    if (!_.includes(_this.availableLanguages, p.language)) {
                        if (p.language) {
                            logger_1.default.warn('Language for email "' + p.language + '" not available.');
                        }
                        p.language = _this.defaultLanguage;
                    }
                    var unit;
                    if (wallet.coin != Defaults.COIN) {
                        unit = wallet.coin;
                    }
                    else {
                        unit = p.unit || _this.defaultUnit;
                    }
                    return {
                        copayerId: p.copayerId,
                        emailAddress: p.email,
                        language: p.language,
                        unit: unit
                    };
                }));
                return cb(null, recipients);
            });
        });
    };
    EmailService.prototype._getDataForTemplate = function (notification, recipient, cb) {
        var _this = this;
        var UNIT_LABELS = {
            btc: 'BTC',
            bit: 'bits',
            bch: 'BCH',
            eth: 'ETH',
            vcl: 'VCL',
            xrp: 'XRP'
        };
        var data = _.cloneDeep(notification.data);
        data.subjectPrefix = _.trim(this.subjectPrefix) + ' ';
        if (data.amount) {
            try {
                var unit = recipient.unit.toLowerCase();
                data.amount = Utils.formatAmount(+data.amount, unit) + ' ' + UNIT_LABELS[unit];
            }
            catch (ex) {
                return cb(new Error('Could not format amount' + ex));
            }
        }
        this.storage.fetchWallet(notification.walletId, function (err, wallet) {
            if (err)
                return cb(err);
            if (!wallet)
                return cb('no wallet');
            data.walletId = wallet.id;
            data.walletName = wallet.name;
            data.walletM = wallet.m;
            data.walletN = wallet.n;
            var copayer = wallet.copayers.find(function (c) { return c.id == notification.creatorId; });
            if (copayer) {
                data.copayerId = copayer.id;
                data.copayerName = copayer.name;
            }
            if (notification.type == 'TxProposalFinallyRejected' && data.rejectedBy) {
                var rejectors = _.map(data.rejectedBy, function (copayerId) {
                    var copayer = wallet.copayers.find(function (c) { return c.id == copayerId; });
                    return copayer.name;
                });
                data.rejectorsNames = rejectors.join(', ');
            }
            if (_.includes(['NewIncomingTx', 'NewOutgoingTx'], notification.type) && data.txid) {
                var urlTemplate = _this.publicTxUrlTemplate[wallet.coin][wallet.network];
                if (urlTemplate) {
                    try {
                        data.urlForTx = Mustache.render(urlTemplate, data);
                    }
                    catch (ex) {
                        logger_1.default.warn('Could not render public url for tx', ex);
                    }
                }
            }
            return cb(null, data);
        });
    };
    EmailService.prototype._send = function (email, cb) {
        var mailOptions = {
            from: email.from,
            to: email.to,
            subject: email.subject,
            text: email.bodyPlain,
            html: undefined
        };
        if (email.bodyHtml) {
            mailOptions.html = email.bodyHtml;
        }
        this.mailer
            .send(mailOptions)
            .then(function (result) {
            logger_1.default.debug('Message sent: ', result || '');
            return cb(null, result);
        })
            .catch(function (err) {
            var errStr;
            try {
                errStr = err.toString().substr(0, 100);
            }
            catch (e) { }
            logger_1.default.warn('An error occurred when trying to send email to ' + email.to, errStr || err);
            return cb(err);
        });
    };
    EmailService.prototype._readAndApplyTemplates = function (notification, emailType, recipientsList, cb) {
        var _this = this;
        async.map(recipientsList, function (recipient, next) {
            async.waterfall([
                function (next) {
                    _this._getDataForTemplate(notification, recipient, next);
                },
                function (data, next) {
                    async.map(['plain', 'html'], function (type, next) {
                        _this._loadTemplate(emailType, recipient, '.' + type, function (err, template) {
                            if (err && type == 'html')
                                return next();
                            if (err)
                                return next(err);
                            _this._applyTemplate(template, data, function (err, res) {
                                return next(err, [type, res]);
                            });
                        });
                    }, function (err, res) {
                        return next(err, _.fromPairs(res.filter(Boolean)));
                    });
                },
                function (result, next) {
                    next(null, result);
                }
            ], function (err, res) {
                next(err, [recipient.language, res]);
            });
        }, function (err, res) {
            return cb(err, _.fromPairs(res.filter(Boolean)));
        });
    };
    EmailService.prototype._checkShouldSendEmail = function (notification, cb) {
        if (notification.type != 'NewTxProposal')
            return cb(null, true);
        this.storage.fetchWallet(notification.walletId, function (err, wallet) {
            return cb(err, wallet.m > 1);
        });
    };
    EmailService.prototype.sendEmail = function (notification, cb) {
        var _this = this;
        cb = cb || function () { };
        var emailType = EMAIL_TYPES[notification.type];
        if (!emailType)
            return cb();
        this._checkShouldSendEmail(notification, function (err, should) {
            if (err)
                return cb(err);
            if (!should)
                return cb();
            _this._getRecipientsList(notification, emailType, function (err, recipientsList) {
                if (_.isEmpty(recipientsList))
                    return cb();
                _this.lock.runLocked('email-' + notification.id, {}, cb, function (cb) {
                    _this.storage.fetchEmailByNotification(notification.id, function (err, email) {
                        if (err)
                            return cb(err);
                        if (email)
                            return cb();
                        async.waterfall([
                            function (next) {
                                _this._readAndApplyTemplates(notification, emailType, recipientsList, next);
                            },
                            function (contents, next) {
                                async.map(recipientsList, function (recipient, next) {
                                    var content = contents[recipient.language];
                                    var email = model_1.Email.create({
                                        walletId: notification.walletId,
                                        copayerId: recipient.copayerId,
                                        from: _this.from,
                                        to: recipient.emailAddress,
                                        subject: content.plain.subject,
                                        bodyPlain: content.plain.body,
                                        bodyHtml: content.html ? content.html.body : null,
                                        notificationId: notification.id
                                    });
                                    _this.storage.storeEmail(email, function (err) {
                                        return next(err, email);
                                    });
                                }, next);
                            },
                            function (emails, next) {
                                async.each(emails, function (email, next) {
                                    _this._send(email, function (err) {
                                        if (err) {
                                            email.setFail();
                                        }
                                        else {
                                            email.setSent();
                                        }
                                        _this.storage.storeEmail(email, next);
                                    });
                                }, function (err) {
                                    return next();
                                });
                            }
                        ], function (err) {
                            if (err) {
                                var errStr = void 0;
                                try {
                                    errStr = err.toString().substr(0, 100);
                                }
                                catch (e) { }
                                logger_1.default.warn('An error ocurred generating email notification', errStr || err);
                            }
                            return cb(err);
                        });
                    });
                });
            });
        });
    };
    return EmailService;
}());
exports.EmailService = EmailService;
module.exports = EmailService;
//# sourceMappingURL=emailservice.js.map