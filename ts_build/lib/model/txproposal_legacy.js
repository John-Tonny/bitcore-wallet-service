"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = __importDefault(require("lodash"));
var logger_1 = __importDefault(require("../logger"));
var $ = require('preconditions').singleton();
var Common = require('../common');
var Constants = Common.Constants;
var Defaults = Common.Defaults;
var txproposalaction_1 = require("./txproposalaction");
function throwUnsupportedError() {
    var msg = 'Unsupported operation on this transaction proposal';
    logger_1.default.warn('DEPRECATED: ' + msg);
    throw new Error(msg);
}
var TxProposalLegacy = (function () {
    function TxProposalLegacy() {
    }
    TxProposalLegacy.fromObj = function (obj) {
        var x = new TxProposalLegacy();
        x.version = obj.version;
        if (obj.version === '1.0.0') {
            x.type = TxProposalLegacy.Types.SIMPLE;
        }
        else {
            x.type = obj.type;
        }
        x.createdOn = obj.createdOn;
        x.id = obj.id;
        x.walletId = obj.walletId;
        x.creatorId = obj.creatorId;
        x.outputs = obj.outputs;
        x.toAddress = obj.toAddress;
        x.amount = obj.amount;
        x.message = obj.message;
        x.payProUrl = obj.payProUrl;
        x.proposalSignature = obj.proposalSignature;
        x.changeAddress = obj.changeAddress;
        x.inputs = obj.inputs;
        x.requiredSignatures = obj.requiredSignatures;
        x.requiredRejections = obj.requiredRejections;
        x.walletN = obj.walletN;
        x.status = obj.status;
        x.txid = obj.txid;
        x.broadcastedOn = obj.broadcastedOn;
        x.inputPaths = obj.inputPaths;
        x.actions = lodash_1.default.map(obj.actions, function (action) {
            return txproposalaction_1.TxProposalAction.fromObj(action);
        });
        x.outputOrder = obj.outputOrder;
        x.coin = obj.coin || Defaults.COIN;
        x.network = obj.network;
        x.fee = obj.fee;
        x.feePerKb = obj.feePerKb;
        x.excludeUnconfirmedUtxos = obj.excludeUnconfirmedUtxos;
        x.proposalSignaturePubKey = obj.proposalSignaturePubKey;
        x.proposalSignaturePubKeySig = obj.proposalSignaturePubKeySig;
        x.addressType = obj.addressType || Constants.SCRIPT_TYPES.P2SH;
        x.derivationStrategy = obj.derivationStrategy || Constants.DERIVATION_STRATEGIES.BIP45;
        x.customData = obj.customData;
        return x;
    };
    TxProposalLegacy.prototype.toObject = function () {
        var x = lodash_1.default.cloneDeep(this);
        x.isPending = this.isPending();
        return x;
    };
    TxProposalLegacy.prototype._updateStatus = function () {
        if (this.status != 'pending')
            return;
        if (this.isRejected()) {
            this.status = 'rejected';
        }
        else if (this.isAccepted()) {
            this.status = 'accepted';
        }
    };
    TxProposalLegacy.prototype.getBitcoreTx = function () {
        throwUnsupportedError();
    };
    TxProposalLegacy.prototype.getRawTx = function () {
        throwUnsupportedError();
    };
    TxProposalLegacy.prototype.getTotalAmount = function () {
        if (this.type == TxProposalLegacy.Types.MULTIPLEOUTPUTS || this.type == TxProposalLegacy.Types.EXTERNAL) {
            return lodash_1.default.map(this.outputs, 'amount').reduce(function (total, n) {
                return total + n;
            }, 0);
        }
        else {
            return this.amount;
        }
    };
    TxProposalLegacy.prototype.getActors = function () {
        return lodash_1.default.map(this.actions, 'copayerId');
    };
    TxProposalLegacy.prototype.getApprovers = function () {
        return lodash_1.default.map(lodash_1.default.filter(this.actions, function (a) {
            return a.type == 'accept';
        }), 'copayerId');
    };
    TxProposalLegacy.prototype.getActionBy = function (copayerId) {
        return lodash_1.default.find(this.actions, {
            copayerId: copayerId
        });
    };
    TxProposalLegacy.prototype.addAction = function (copayerId, type, comment, signatures, xpub) {
        var action = txproposalaction_1.TxProposalAction.create({
            copayerId: copayerId,
            type: type,
            signatures: signatures,
            xpub: xpub,
            comment: comment
        });
        this.actions.push(action);
        this._updateStatus();
    };
    TxProposalLegacy.prototype.sign = function () {
        throwUnsupportedError();
    };
    TxProposalLegacy.prototype.reject = function (copayerId, reason) {
        this.addAction(copayerId, 'reject', reason);
    };
    TxProposalLegacy.prototype.isPending = function () {
        return !lodash_1.default.includes(['broadcasted', 'rejected'], this.status);
    };
    TxProposalLegacy.prototype.isAccepted = function () {
        var votes = lodash_1.default.countBy(this.actions, 'type');
        return votes['accept'] >= this.requiredSignatures;
    };
    TxProposalLegacy.prototype.isRejected = function () {
        var votes = lodash_1.default.countBy(this.actions, 'type');
        return votes['reject'] >= this.requiredRejections;
    };
    TxProposalLegacy.prototype.isBroadcasted = function () {
        return this.status == 'broadcasted';
    };
    TxProposalLegacy.prototype.setBroadcasted = function () {
        $.checkState(this.txid);
        this.status = 'broadcasted';
        this.broadcastedOn = Math.floor(Date.now() / 1000);
    };
    TxProposalLegacy.Types = {
        SIMPLE: 'simple',
        MULTIPLEOUTPUTS: 'multiple_outputs',
        EXTERNAL: 'external'
    };
    return TxProposalLegacy;
}());
exports.TxProposalLegacy = TxProposalLegacy;
//# sourceMappingURL=txproposal_legacy.js.map