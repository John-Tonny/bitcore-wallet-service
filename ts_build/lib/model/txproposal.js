"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = __importDefault(require("lodash"));
var index_1 = require("../chain/index");
var logger_1 = __importDefault(require("../logger"));
var txproposal_legacy_1 = require("./txproposal_legacy");
var txproposalaction_1 = require("./txproposalaction");
var $ = require('preconditions').singleton();
var Uuid = require('uuid');
var Common = require('../common');
var Constants = Common.Constants, Defaults = Common.Defaults, Utils = Common.Utils;
var TxProposal = (function () {
    function TxProposal() {
        this.actions = [];
    }
    TxProposal.create = function (opts) {
        opts = opts || {};
        $.checkArgument(Utils.checkValueInCollection(opts.coin, Constants.COINS));
        $.checkArgument(Utils.checkValueInCollection(opts.network, Constants.NETWORKS));
        var x = new TxProposal();
        if (opts.version) {
            $.checkArgument(opts.version >= 3);
        }
        x.version = opts.version || 3;
        $.checkState(x.version <= 3, 'txp version 4 not allowed yet');
        var now = Date.now();
        x.createdOn = Math.floor(now / 1000);
        x.id = opts.id || Uuid.v4();
        x.walletId = opts.walletId;
        x.creatorId = opts.creatorId;
        x.coin = opts.coin;
        x.network = opts.network;
        x.signingMethod = opts.signingMethod;
        x.message = opts.message;
        x.payProUrl = opts.payProUrl;
        x.changeAddress = opts.changeAddress;
        x.outputs = lodash_1.default.map(opts.outputs, function (output) {
            return lodash_1.default.pick(output, ['amount', 'toAddress', 'message', 'data', 'gasLimit', 'script']);
        });
        x.outputOrder = lodash_1.default.range(x.outputs.length + 1);
        if (!opts.noShuffleOutputs) {
            x.outputOrder = lodash_1.default.shuffle(x.outputOrder);
        }
        x.walletM = opts.walletM;
        x.walletN = opts.walletN;
        x.requiredSignatures = x.walletM;
        (x.requiredRejections = Math.min(x.walletM, x.walletN - x.walletM + 1)), (x.status = 'temporary');
        x.actions = [];
        x.feeLevel = opts.feeLevel;
        x.feePerKb = opts.feePerKb;
        x.excludeUnconfirmedUtxos = opts.excludeUnconfirmedUtxos;
        x.addressType = opts.addressType || (x.walletN > 1 ? Constants.SCRIPT_TYPES.P2SH : Constants.SCRIPT_TYPES.P2PKH);
        $.checkState(Utils.checkValueInCollection(x.addressType, Constants.SCRIPT_TYPES));
        x.customData = opts.customData;
        x.amount = opts.amount ? opts.amount : x.getTotalAmount();
        x.setInputs(opts.inputs);
        x.fee = opts.fee;
        if (x.version === 4) {
            x.lockUntilBlockHeight = opts.lockUntilBlockHeight;
        }
        x.gasPrice = opts.gasPrice;
        x.from = opts.from;
        x.nonce = opts.nonce;
        x.gasLimit = opts.gasLimit;
        x.data = opts.data;
        x.tokenAddress = opts.tokenAddress;
        x.multisigContractAddress = opts.multisigContractAddress;
        x.destinationTag = opts.destinationTag;
        x.invoiceID = opts.invoiceID;
        return x;
    };
    TxProposal.fromObj = function (obj) {
        if (!(obj.version >= 3)) {
            return txproposal_legacy_1.TxProposalLegacy.fromObj(obj);
        }
        var x = new TxProposal();
        x.version = obj.version;
        x.createdOn = obj.createdOn;
        x.id = obj.id;
        x.walletId = obj.walletId;
        x.creatorId = obj.creatorId;
        x.coin = obj.coin || Defaults.COIN;
        x.network = obj.network;
        x.outputs = obj.outputs;
        x.amount = obj.amount;
        x.message = obj.message;
        x.payProUrl = obj.payProUrl;
        x.changeAddress = obj.changeAddress;
        x.inputs = obj.inputs;
        x.walletM = obj.walletM;
        x.walletN = obj.walletN;
        x.requiredSignatures = obj.requiredSignatures;
        x.requiredRejections = obj.requiredRejections;
        x.status = obj.status;
        x.txid = obj.txid;
        x.broadcastedOn = obj.broadcastedOn;
        x.inputPaths = obj.inputPaths;
        x.actions = lodash_1.default.map(obj.actions, function (action) {
            return txproposalaction_1.TxProposalAction.fromObj(action);
        });
        x.outputOrder = obj.outputOrder;
        x.fee = obj.fee;
        x.feeLevel = obj.feeLevel;
        x.feePerKb = obj.feePerKb;
        x.excludeUnconfirmedUtxos = obj.excludeUnconfirmedUtxos;
        x.addressType = obj.addressType;
        x.customData = obj.customData;
        x.proposalSignature = obj.proposalSignature;
        x.signingMethod = obj.signingMethod;
        x.proposalSignaturePubKey = obj.proposalSignaturePubKey;
        x.proposalSignaturePubKeySig = obj.proposalSignaturePubKeySig;
        x.lockUntilBlockHeight = obj.lockUntilBlockHeight;
        x.gasPrice = obj.gasPrice;
        x.from = obj.from;
        x.nonce = obj.nonce;
        x.gasLimit = obj.gasLimit;
        x.data = obj.data;
        x.tokenAddress = obj.tokenAddress;
        x.multisigContractAddress = obj.multisigContractAddress;
        x.multisigTxId = obj.multisigTxId;
        x.destinationTag = obj.destinationTag;
        x.invoiceID = obj.invoiceID;
        if (x.status == 'broadcasted') {
            x.raw = obj.raw;
        }
        return x;
    };
    TxProposal.prototype.toObject = function () {
        var x = lodash_1.default.cloneDeep(this);
        x.isPending = this.isPending();
        return x;
    };
    TxProposal.prototype.setInputs = function (inputs) {
        this.inputs = inputs || [];
        this.inputPaths = lodash_1.default.map(inputs, 'path') || [];
    };
    TxProposal.prototype._updateStatus = function () {
        if (this.status != 'pending')
            return;
        if (this.isRejected()) {
            this.status = 'rejected';
        }
        else if (this.isAccepted()) {
            this.status = 'accepted';
        }
    };
    TxProposal.prototype.getCurrentSignatures = function () {
        var acceptedActions = lodash_1.default.filter(this.actions, function (a) {
            return a.type == 'accept';
        });
        return lodash_1.default.map(acceptedActions, function (x) {
            return {
                signatures: x.signatures,
                xpub: x.xpub
            };
        });
    };
    TxProposal.prototype.getRawTx = function () {
        var t = index_1.ChainService.getBitcoreTx(this);
        return t.uncheckedSerialize();
    };
    TxProposal.prototype.getRawTx1 = function () {
        var t = index_1.ChainService.getBitcoreTx(this);
        return t.uncheckedSerialize1();
    };
    TxProposal.prototype.getTotalAmount = function () {
        return lodash_1.default.sumBy(this.outputs, 'amount');
    };
    TxProposal.prototype.getActors = function () {
        return lodash_1.default.map(this.actions, 'copayerId');
    };
    TxProposal.prototype.getApprovers = function () {
        return lodash_1.default.map(lodash_1.default.filter(this.actions, function (a) {
            return a.type == 'accept';
        }), 'copayerId');
    };
    TxProposal.prototype.getActionBy = function (copayerId) {
        return lodash_1.default.find(this.actions, {
            copayerId: copayerId
        });
    };
    TxProposal.prototype.addAction = function (copayerId, type, comment, signatures, xpub) {
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
    TxProposal.prototype.sign = function (copayerId, signatures, xpub) {
        try {
            var tx = index_1.ChainService.getBitcoreTx(this);
            index_1.ChainService.addSignaturesToBitcoreTx(this.coin, tx, this.inputs, this.inputPaths, signatures, xpub, this.signingMethod);
            this.addAction(copayerId, 'accept', null, signatures, xpub);
            if (this.status == 'accepted') {
                this.raw = tx.uncheckedSerialize();
                this.txid = tx.id;
            }
            return true;
        }
        catch (e) {
            logger_1.default.debug(e);
            return false;
        }
    };
    TxProposal.prototype.reject = function (copayerId, reason) {
        this.addAction(copayerId, 'reject', reason);
    };
    TxProposal.prototype.isTemporary = function () {
        return this.status == 'temporary';
    };
    TxProposal.prototype.isPending = function () {
        return !lodash_1.default.includes(['temporary', 'broadcasted', 'rejected'], this.status);
    };
    TxProposal.prototype.isAccepted = function () {
        var votes = lodash_1.default.countBy(this.actions, 'type');
        return votes['accept'] >= this.requiredSignatures;
    };
    TxProposal.prototype.isRejected = function () {
        var votes = lodash_1.default.countBy(this.actions, 'type');
        return votes['reject'] >= this.requiredRejections;
    };
    TxProposal.prototype.isBroadcasted = function () {
        return this.status == 'broadcasted';
    };
    TxProposal.prototype.setBroadcasted = function () {
        $.checkState(this.txid);
        this.status = 'broadcasted';
        this.broadcastedOn = Math.floor(Date.now() / 1000);
    };
    return TxProposal;
}());
exports.TxProposal = TxProposal;
//# sourceMappingURL=txproposal.js.map