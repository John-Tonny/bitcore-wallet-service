"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var crypto_wallet_core_1 = require("crypto-wallet-core");
var lodash_1 = __importDefault(require("lodash"));
var clienterror_1 = require("../../errors/clienterror");
var model_1 = require("../../model");
var logger_1 = __importDefault(require("../../logger"));
var $ = require('preconditions').singleton();
var Common = require('../../common');
var Constants = Common.Constants;
var Utils = Common.Utils;
var Defaults = Common.Defaults;
var Errors = require('../../errors/errordefinitions');
var VclChain = (function () {
    function VclChain(bitcoreLib) {
        if (bitcoreLib === void 0) { bitcoreLib = crypto_wallet_core_1.VircleLib; }
        this.bitcoreLib = bitcoreLib;
        this.feeSafetyMargin = 0.02;
    }
    VclChain.prototype.getWalletBalance = function (server, wallet, opts, cb) {
        var _this = this;
        server.getUtxosForCurrentWallet({
            coin: opts.coin,
            addresses: opts.addresses
        }, function (err, utxos) {
            if (err)
                return cb(err);
            var balance = __assign(__assign({}, _this.totalizeUtxos(utxos)), { byAddress: [] });
            var byAddress = {};
            lodash_1.default.each(lodash_1.default.keyBy(lodash_1.default.sortBy(utxos, 'address'), 'address'), function (value, key) {
                byAddress[key] = {
                    address: key,
                    path: value.path,
                    amount: 0
                };
            });
            lodash_1.default.each(utxos, function (utxo) {
                byAddress[utxo.address].amount += utxo.satoshis;
            });
            balance.byAddress = lodash_1.default.values(byAddress);
            return cb(null, balance);
        });
    };
    VclChain.prototype.getWalletSendMaxInfo = function (server, wallet, opts, cb) {
        var _this = this;
        server.getUtxosForCurrentWallet({}, function (err, utxos) {
            if (err)
                return cb(err);
            var MAX_TX_SIZE_IN_KB = Defaults.MAX_TX_SIZE_IN_KB_VCL;
            var info = {
                size: 0,
                amount: 0,
                fee: 0,
                feePerKb: 0,
                inputs: [],
                utxosBelowFee: 0,
                amountBelowFee: 0,
                utxosAboveMaxSize: 0,
                amountAboveMaxSize: 0
            };
            var inputs = lodash_1.default.reject(utxos, 'locked');
            if (!!opts.excludeUnconfirmedUtxos) {
                inputs = lodash_1.default.filter(inputs, 'confirmations');
            }
            inputs = lodash_1.default.sortBy(inputs, function (input) {
                return -input.satoshis;
            });
            if (lodash_1.default.isEmpty(inputs))
                return cb(null, info);
            server._getFeePerKb(wallet, opts, function (err, feePerKb) {
                if (err)
                    return cb(err);
                info.feePerKb = feePerKb;
                var txp = model_1.TxProposal.create({
                    walletId: server.walletId,
                    coin: wallet.coin,
                    network: wallet.network,
                    walletM: wallet.m,
                    walletN: wallet.n,
                    feePerKb: feePerKb
                });
                var baseTxpSize = _this.getEstimatedSize(txp);
                var sizePerInput = _this.getEstimatedSizeForSingleInput(txp);
                var feePerInput = (sizePerInput * txp.feePerKb) / 1000;
                var partitionedByAmount = lodash_1.default.partition(inputs, function (input) {
                    return input.satoshis > feePerInput;
                });
                info.utxosBelowFee = partitionedByAmount[1].length;
                info.amountBelowFee = lodash_1.default.sumBy(partitionedByAmount[1], 'satoshis');
                inputs = partitionedByAmount[0];
                lodash_1.default.each(inputs, function (input, i) {
                    var sizeInKb = (baseTxpSize + (i + 1) * sizePerInput) / 1000;
                    if (sizeInKb > MAX_TX_SIZE_IN_KB) {
                        info.utxosAboveMaxSize = inputs.length - i;
                        info.amountAboveMaxSize = lodash_1.default.sumBy(lodash_1.default.slice(inputs, i), 'satoshis');
                        return false;
                    }
                    txp.inputs.push(input);
                });
                if (lodash_1.default.isEmpty(txp.inputs))
                    return cb(null, info);
                var fee = _this.getEstimatedFee(txp);
                var amount = lodash_1.default.sumBy(txp.inputs, 'satoshis') - fee;
                if (amount < Defaults.MIN_OUTPUT_AMOUNT)
                    return cb(null, info);
                info.size = _this.getEstimatedSize(txp);
                info.fee = fee;
                info.amount = amount;
                if (opts.returnInputs) {
                    info.inputs = lodash_1.default.shuffle(txp.inputs);
                }
                return cb(null, info);
            });
        });
    };
    VclChain.prototype.getDustAmountValue = function () {
        return this.bitcoreLib.Transaction.DUST_AMOUNT;
    };
    VclChain.prototype.getTransactionCount = function () {
        return null;
    };
    VclChain.prototype.getChangeAddress = function (server, wallet, opts) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var getChangeAddress = function (wallet, cb) {
                if (wallet.singleAddress) {
                    server.storage.fetchAddresses(server.walletId, function (err, addresses) {
                        if (err)
                            return cb(err);
                        if (lodash_1.default.isEmpty(addresses))
                            return cb(new clienterror_1.ClientError('The wallet has no addresses'));
                        return cb(null, lodash_1.default.head(addresses));
                    });
                }
                else {
                    if (opts.changeAddress) {
                        try {
                            _this.validateAddress(wallet, opts.changeAddress, opts);
                        }
                        catch (addrErr) {
                            return cb(addrErr);
                        }
                        server.storage.fetchAddressByWalletId(wallet.id, opts.changeAddress, function (err, address) {
                            if (err || !address)
                                return cb(Errors.INVALID_CHANGE_ADDRESS);
                            return cb(null, address);
                        });
                    }
                    else {
                        return cb(null, wallet.createAddress(true), true);
                    }
                }
            };
            getChangeAddress(wallet, function (err, address, isNew) {
                if (err)
                    return reject(err);
                return resolve(address);
            });
        });
    };
    VclChain.prototype.checkDust = function (output) {
        var dustThreshold = Math.max(Defaults.MIN_OUTPUT_AMOUNT, this.bitcoreLib.Transaction.DUST_AMOUNT);
        if (output.amount < dustThreshold) {
            return Errors.DUST_AMOUNT;
        }
    };
    VclChain.prototype.getEstimatedSizeForSingleInput = function (txp) {
        var SIGNATURE_SIZE = 72 + 1;
        var PUBKEY_SIZE = 33 + 1;
        switch (txp.addressType) {
            case Constants.SCRIPT_TYPES.P2PKH:
                return 147;
            case Constants.SCRIPT_TYPES.P2WPKH:
                return 69;
            case Constants.SCRIPT_TYPES.P2WSH:
                return 32 + 4 + 1 + (txp.requiredSignatures * 74 + txp.walletN * 34) / 4 + 4;
            case Constants.SCRIPT_TYPES.P2SH:
                return 46 + txp.requiredSignatures * SIGNATURE_SIZE + txp.walletN * PUBKEY_SIZE;
            default:
                logger_1.default.warn('Unknown address type at getEstimatedSizeForSingleInput:', txp.addressType);
                return 46 + txp.requiredSignatures * SIGNATURE_SIZE + txp.walletN * PUBKEY_SIZE;
        }
    };
    VclChain.prototype.getEstimatedSizeForSingleOutput = function (address) {
        var addressType = '';
        if (address) {
            var a = this.bitcoreLib.Address(address);
            addressType = a.type;
        }
        var scriptSize;
        switch (addressType) {
            case 'pubkeyhash':
                scriptSize = 25;
                break;
            case 'scripthash':
                scriptSize = 23;
                break;
            case 'witnesspubkeyhash':
                scriptSize = 22;
                break;
            case 'witnessscripthash':
                scriptSize = 34;
                break;
            default:
                scriptSize = 34;
                logger_1.default.warn('Unknown address type at getEstimatedSizeForSingleOutput:', addressType);
                break;
        }
        return scriptSize + 8 + 1;
    };
    VclChain.prototype.getEstimatedSize = function (txp) {
        var _this = this;
        var overhead = 4 + 4 + 1 + 1;
        var inputSize = this.getEstimatedSizeForSingleInput(txp);
        var nbInputs = txp.inputs.length;
        var outputsSize = 0;
        var outputs = lodash_1.default.isArray(txp.outputs) ? txp.outputs : [txp.toAddress];
        var addresses = outputs.map(function (x) { return x.toAddress; });
        if (txp.changeAddress) {
            addresses.push(txp.changeAddress.address);
        }
        lodash_1.default.each(addresses, function (x) {
            outputsSize += _this.getEstimatedSizeForSingleOutput(x);
        });
        if (!outputsSize) {
            outputsSize = this.getEstimatedSizeForSingleOutput();
        }
        var size = overhead + inputSize * nbInputs + outputsSize;
        return parseInt((size * (1 + this.feeSafetyMargin)).toFixed(0));
    };
    VclChain.prototype.getEstimatedFee = function (txp) {
        $.checkState(lodash_1.default.isNumber(txp.feePerKb));
        var fee;
        if (txp.inputs.length && !txp.changeAddress && txp.outputs.length) {
            var totalInputs = lodash_1.default.sumBy(txp.inputs, 'satoshis');
            var totalOutputs = lodash_1.default.sumBy(txp.outputs, 'amount');
            if (totalInputs && totalOutputs) {
                fee = totalInputs - totalOutputs;
            }
        }
        if (!fee) {
            fee = (txp.feePerKb * this.getEstimatedSize(txp)) / 1000;
        }
        return parseInt(fee.toFixed(0));
    };
    VclChain.prototype.getFee = function (server, wallet, opts) {
        return new Promise(function (resolve) {
            server._getFeePerKb(wallet, opts, function (err, feePerKb) {
                return resolve({ feePerKb: feePerKb });
            });
        });
    };
    VclChain.prototype.getBitcoreTx = function (txp, opts) {
        var _this = this;
        if (opts === void 0) { opts = { signed: true }; }
        var t = new this.bitcoreLib.Transaction();
        if (txp.version <= 3) {
            t.setVersion(1);
        }
        else {
            t.setVersion(2);
            if (txp.lockUntilBlockHeight)
                t.lockUntilBlockHeight(txp.lockUntilBlockHeight);
        }
        var inputs = txp.inputs.map(function (x) {
            return {
                address: x.address,
                txid: x.txid,
                vout: x.vout,
                outputIndex: x.outputIndex,
                scriptPubKey: x.scriptPubKey,
                satoshis: x.satoshis,
                publicKeys: x.publicKeys
            };
        });
        switch (txp.addressType) {
            case Constants.SCRIPT_TYPES.P2WSH:
            case Constants.SCRIPT_TYPES.P2SH:
                lodash_1.default.each(inputs, function (i) {
                    $.checkState(i.publicKeys, 'Inputs should include public keys');
                    t.from(i, i.publicKeys, txp.requiredSignatures);
                });
                break;
            case Constants.SCRIPT_TYPES.P2WPKH:
            case Constants.SCRIPT_TYPES.P2PKH:
                t.from(inputs);
                break;
        }
        lodash_1.default.each(txp.outputs, function (o) {
            $.checkState(o.script || o.toAddress, 'Output should have either toAddress or script specified');
            if (o.script) {
                t.addOutput(new _this.bitcoreLib.Transaction.Output({
                    script: o.script,
                    satoshis: o.amount
                }));
            }
            else {
                t.to(o.toAddress, o.amount);
            }
        });
        t.fee(txp.fee);
        if (txp.changeAddress) {
            t.change(txp.changeAddress.address);
        }
        if (t.outputs.length > 1) {
            var outputOrder_1 = lodash_1.default.reject(txp.outputOrder, function (order) {
                return order >= t.outputs.length;
            });
            $.checkState(t.outputs.length == outputOrder_1.length);
            t.sortOutputs(function (outputs) {
                return lodash_1.default.map(outputOrder_1, function (i) {
                    return outputs[i];
                });
            });
        }
        var totalInputs = lodash_1.default.sumBy(t.inputs, 'output.satoshis');
        var totalOutputs = lodash_1.default.sumBy(t.outputs, 'satoshis');
        $.checkState(totalInputs > 0 && totalOutputs > 0 && totalInputs >= totalOutputs, 'not-enough-inputs');
        $.checkState(totalInputs - totalOutputs <= Defaults.MAX_TX_FEE[txp.coin], 'fee-too-high');
        if (opts.signed) {
            var sigs = txp.getCurrentSignatures();
            lodash_1.default.each(sigs, function (x) {
                _this.addSignaturesToBitcoreTx(t, txp.inputs, txp.inputPaths, x.signatures, x.xpub, txp.signingMethod);
            });
        }
        return t;
    };
    VclChain.prototype.convertFeePerKb = function (p, feePerKb) {
        return [p, Utils.strip(feePerKb * 1e8)];
    };
    VclChain.prototype.checkTx = function (txp) {
        var bitcoreError;
        var MAX_TX_SIZE_IN_KB = Defaults.MAX_TX_SIZE_IN_KB_VCL;
        if (this.getEstimatedSize(txp) / 1000 > MAX_TX_SIZE_IN_KB)
            return Errors.TX_MAX_SIZE_EXCEEDED;
        var serializationOpts = {
            disableIsFullySigned: true,
            disableSmallFees: true,
            disableLargeFees: true
        };
        if (lodash_1.default.isEmpty(txp.inputPaths))
            return Errors.NO_INPUT_PATHS;
        try {
            var bitcoreTx = this.getBitcoreTx(txp);
            bitcoreError = bitcoreTx.getSerializationError(serializationOpts);
            if (!bitcoreError) {
                txp.fee = bitcoreTx.getFee();
            }
        }
        catch (ex) {
            logger_1.default.warn('Error building Bitcore transaction', ex);
            return ex;
        }
        if (bitcoreError instanceof this.bitcoreLib.errors.Transaction.FeeError)
            return Errors.INSUFFICIENT_FUNDS_FOR_FEE;
        if (bitcoreError instanceof this.bitcoreLib.errors.Transaction.DustOutputs)
            return Errors.DUST_AMOUNT;
        return bitcoreError;
    };
    VclChain.prototype.checkTxUTXOs = function (server, txp, opts, cb) {
        logger_1.default.debug('Rechecking UTXOs availability for publishTx');
        var utxoKey = function (utxo) {
            return utxo.txid + '|' + utxo.vout;
        };
        server.getUtxosForCurrentWallet({
            addresses: txp.inputs
        }, function (err, utxos) {
            if (err)
                return cb(err);
            var txpInputs = lodash_1.default.map(txp.inputs, utxoKey);
            var utxosIndex = lodash_1.default.keyBy(utxos, utxoKey);
            var unavailable = lodash_1.default.some(txpInputs, function (i) {
                var utxo = utxosIndex[i];
                return !utxo || utxo.locked;
            });
            if (unavailable)
                return cb(Errors.UNAVAILABLE_UTXOS);
            return cb();
        });
    };
    VclChain.prototype.totalizeUtxos = function (utxos) {
        var balance = {
            totalAmount: lodash_1.default.sumBy(utxos, 'satoshis'),
            lockedAmount: lodash_1.default.sumBy(lodash_1.default.filter(utxos, 'locked'), 'satoshis'),
            totalConfirmedAmount: lodash_1.default.sumBy(lodash_1.default.filter(utxos, 'confirmations'), 'satoshis'),
            lockedConfirmedAmount: lodash_1.default.sumBy(lodash_1.default.filter(lodash_1.default.filter(utxos, 'locked'), 'confirmations'), 'satoshis'),
            availableAmount: undefined,
            availableConfirmedAmount: undefined
        };
        balance.availableAmount = balance.totalAmount - balance.lockedAmount;
        balance.availableConfirmedAmount = balance.totalConfirmedAmount - balance.lockedConfirmedAmount;
        return balance;
    };
    VclChain.prototype.selectTxInputs = function (server, txp, wallet, opts, cb) {
        var _this = this;
        var MAX_TX_SIZE_IN_KB = Defaults.MAX_TX_SIZE_IN_KB_VCL;
        if (txp.inputs && !lodash_1.default.isEmpty(txp.inputs)) {
            if (!lodash_1.default.isNumber(txp.fee))
                txp.fee = this.getEstimatedFee(txp);
            return cb(this.checkTx(txp));
        }
        var txpAmount = txp.getTotalAmount();
        var baseTxpSize = this.getEstimatedSize(txp);
        var baseTxpFee = (baseTxpSize * txp.feePerKb) / 1000;
        var sizePerInput = this.getEstimatedSizeForSingleInput(txp);
        var feePerInput = (sizePerInput * txp.feePerKb) / 1000;
        var sanitizeUtxos = function (utxos) {
            var excludeIndex = lodash_1.default.reduce(opts.utxosToExclude, function (res, val) {
                res[val] = val;
                return res;
            }, {});
            return lodash_1.default.filter(utxos, function (utxo) {
                if (utxo.locked)
                    return false;
                if (utxo.satoshis <= feePerInput)
                    return false;
                if (txp.excludeUnconfirmedUtxos && !utxo.confirmations)
                    return false;
                if (excludeIndex[utxo.txid + ':' + utxo.vout])
                    return false;
                return true;
            });
        };
        var select = function (utxos, coin, cb) {
            var totalValueInUtxos = lodash_1.default.sumBy(utxos, 'satoshis');
            var netValueInUtxos = totalValueInUtxos - baseTxpFee - utxos.length * feePerInput;
            if (totalValueInUtxos < txpAmount) {
                logger_1.default.debug('Total value in all utxos (' +
                    Utils.formatAmountInVcl(totalValueInUtxos) +
                    ') is insufficient to cover for txp amount (' +
                    Utils.formatAmountInVcl(txpAmount) +
                    ')');
                return cb(Errors.INSUFFICIENT_FUNDS);
            }
            if (netValueInUtxos < txpAmount) {
                logger_1.default.debug('Value after fees in all utxos (' +
                    Utils.formatAmountInVcl(netValueInUtxos) +
                    ') is insufficient to cover for txp amount (' +
                    Utils.formatAmountInVcl(txpAmount) +
                    ')');
                return cb(Errors.INSUFFICIENT_FUNDS_FOR_FEE);
            }
            var bigInputThreshold = txpAmount * Defaults.UTXO_SELECTION_MAX_SINGLE_UTXO_FACTOR + (baseTxpFee + feePerInput);
            logger_1.default.debug('Big input threshold ' + Utils.formatAmountInVcl(bigInputThreshold));
            var partitions = lodash_1.default.partition(utxos, function (utxo) {
                return utxo.satoshis > bigInputThreshold;
            });
            var bigInputs = lodash_1.default.sortBy(partitions[0], 'satoshis');
            var smallInputs = lodash_1.default.sortBy(partitions[1], function (utxo) {
                return -utxo.satoshis;
            });
            var total = 0;
            var netTotal = -baseTxpFee;
            var selected = [];
            var fee;
            var error;
            lodash_1.default.each(smallInputs, function (input, i) {
                var netInputAmount = input.satoshis - feePerInput;
                selected.push(input);
                total += input.satoshis;
                netTotal += netInputAmount;
                var txpSize = baseTxpSize + selected.length * sizePerInput;
                fee = Math.round(baseTxpFee + selected.length * feePerInput);
                var feeVsAmountRatio = fee / txpAmount;
                var amountVsUtxoRatio = netInputAmount / txpAmount;
                if (txpSize / 1000 > MAX_TX_SIZE_IN_KB) {
                    error = Errors.TX_MAX_SIZE_EXCEEDED;
                    return false;
                }
                if (!lodash_1.default.isEmpty(bigInputs)) {
                    if (amountVsUtxoRatio < Defaults.UTXO_SELECTION_MIN_TX_AMOUNT_VS_UTXO_FACTOR) {
                        return false;
                    }
                    if (feeVsAmountRatio > Defaults.UTXO_SELECTION_MAX_FEE_VS_TX_AMOUNT_FACTOR) {
                        var feeVsSingleInputFeeRatio = fee / (baseTxpFee + feePerInput);
                        if (feeVsSingleInputFeeRatio > Defaults.UTXO_SELECTION_MAX_FEE_VS_SINGLE_UTXO_FEE_FACTOR) {
                            return false;
                        }
                    }
                }
                if (netTotal >= txpAmount) {
                    var changeAmount = Math.round(total - txpAmount - fee);
                    var dustThreshold = Math.max(Defaults.MIN_OUTPUT_AMOUNT, _this.bitcoreLib.Transaction.DUST_AMOUNT);
                    if (changeAmount > 0 && changeAmount <= dustThreshold) {
                        fee += changeAmount;
                    }
                    return false;
                }
            });
            if (netTotal < txpAmount) {
                selected = [];
                if (!lodash_1.default.isEmpty(bigInputs)) {
                    var input = lodash_1.default.head(bigInputs);
                    total = input.satoshis;
                    fee = Math.round(baseTxpFee + feePerInput);
                    netTotal = total - fee;
                    selected = [input];
                }
            }
            if (lodash_1.default.isEmpty(selected)) {
                return cb(error || Errors.INSUFFICIENT_FUNDS_FOR_FEE);
            }
            return cb(null, selected, fee);
        };
        server.getUtxosForCurrentWallet({ excludeMasternode: opts.excludeMasternode }, function (err, utxos) {
            if (err)
                return cb(err);
            var totalAmount;
            var availableAmount;
            var balance = _this.totalizeUtxos(utxos);
            if (txp.excludeUnconfirmedUtxos) {
                totalAmount = balance.totalConfirmedAmount;
                availableAmount = balance.availableConfirmedAmount;
            }
            else {
                totalAmount = balance.totalAmount;
                availableAmount = balance.availableAmount;
            }
            if (totalAmount < txp.getTotalAmount())
                return cb(Errors.INSUFFICIENT_FUNDS);
            if (availableAmount < txp.getTotalAmount())
                return cb(Errors.LOCKED_FUNDS);
            utxos = sanitizeUtxos(utxos);
            var groups = [6, 1];
            if (!txp.excludeUnconfirmedUtxos)
                groups.push(0);
            var inputs = [];
            var fee;
            var selectionError;
            var i = 0;
            var lastGroupLength;
            async.whilst(function () {
                return i < groups.length && lodash_1.default.isEmpty(inputs);
            }, function (next) {
                var group = groups[i++];
                var candidateUtxos = lodash_1.default.filter(utxos, function (utxo) {
                    return utxo.confirmations >= group;
                });
                if (lastGroupLength === candidateUtxos.length) {
                    return next();
                }
                lastGroupLength = candidateUtxos.length;
                select(candidateUtxos, txp.coin, function (err, selectedInputs, selectedFee) {
                    if (err) {
                        selectionError = err;
                        return next();
                    }
                    selectionError = null;
                    inputs = selectedInputs;
                    fee = selectedFee;
                    return next();
                });
            }, function (err) {
                if (err)
                    return cb(err);
                if (selectionError || lodash_1.default.isEmpty(inputs))
                    return cb(selectionError || new Error('Could not select tx inputs'));
                txp.setInputs(lodash_1.default.shuffle(inputs));
                txp.fee = fee;
                err = _this.checkTx(txp);
                if (!err) {
                    var change = lodash_1.default.sumBy(txp.inputs, 'satoshis') - lodash_1.default.sumBy(txp.outputs, 'amount') - txp.fee;
                    logger_1.default.debug('Successfully built transaction. Total fees: ' +
                        Utils.formatAmountInVcl(txp.fee) +
                        ', total change: ' +
                        Utils.formatAmountInVcl(change));
                }
                else {
                    logger_1.default.debug('Error building transaction', err);
                }
                return cb(err);
            });
        });
    };
    VclChain.prototype.checkUtxos = function (opts) {
        if (lodash_1.default.isNumber(opts.fee) && lodash_1.default.isEmpty(opts.inputs))
            return true;
    };
    VclChain.prototype.checkValidTxAmount = function (output) {
        if (!lodash_1.default.isNumber(output.amount) || lodash_1.default.isNaN(output.amount) || output.amount <= 0) {
            return false;
        }
        return true;
    };
    VclChain.prototype.supportsMultisig = function () {
        return true;
    };
    VclChain.prototype.notifyConfirmations = function (network) {
        if (network != 'livenet')
            return false;
        return true;
    };
    VclChain.prototype.isUTXOCoin = function () {
        return true;
    };
    VclChain.prototype.isSingleAddress = function () {
        return false;
    };
    VclChain.prototype.addressFromStorageTransform = function (network, address) { };
    VclChain.prototype.addressToStorageTransform = function (network, address) { };
    VclChain.prototype.addSignaturesToBitcoreTx = function (tx, inputs, inputPaths, signatures, xpub, signingMethod) {
        var _this = this;
        signingMethod = signingMethod || 'ecdsa';
        if (signatures.length != inputs.length)
            throw new Error('Number of signatures does not match number of inputs');
        var i = 0;
        var x = new this.bitcoreLib.HDPublicKey(xpub);
        lodash_1.default.each(signatures, function (signatureHex) {
            try {
                var signature = _this.bitcoreLib.crypto.Signature.fromString(signatureHex);
                var pub = x.deriveChild(inputPaths[i]).publicKey;
                var s = {
                    inputIndex: i,
                    signature: signature,
                    sigtype: _this.bitcoreLib.crypto.Signature.SIGHASH_ALL | _this.bitcoreLib.crypto.Signature.SIGHASH_FORKID,
                    publicKey: pub
                };
                tx.inputs[i].addSignature(tx, s, signingMethod);
                i++;
            }
            catch (e) { }
        });
        if (i != tx.inputs.length)
            throw new Error('Wrong signatures');
    };
    VclChain.prototype.validateAddress = function (wallet, inaddr, opts) {
        var A = this.bitcoreLib.Address;
        var addr = {};
        try {
            addr = new A(inaddr);
        }
        catch (ex) {
            throw Errors.INVALID_ADDRESS;
        }
        if (addr.network.toString() != wallet.network) {
            throw Errors.INCORRECT_ADDRESS_NETWORK;
        }
        return;
    };
    VclChain.prototype.onCoin = function (coin) {
        if (!coin || !coin.address)
            return;
        return {
            out: {
                address: coin.address,
                amount: coin.value
            },
            txid: coin.mintTxid
        };
    };
    VclChain.prototype.onTx = function (tx) {
        return null;
    };
    return VclChain;
}());
exports.VclChain = VclChain;
//# sourceMappingURL=index.js.map