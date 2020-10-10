'use strict';
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var CWC = __importStar(require("crypto-wallet-core"));
module.exports = {
    COINS: {
        ETH: 'eth',
        VCL: 'vcl',
        USDC: 'usdc',
        PAX: 'pax',
        GUSD: 'gusd',
        BUSD: 'busd'
    },
    ERC20: {
        USDC: 'usdc',
        PAX: 'pax',
        GUSD: 'gusd',
        BUSD: 'busd'
    },
    UTXO_COINS: {
        VCL: 'vcl'
    },
    NETWORKS: {
        LIVENET: 'livenet',
        TESTNET: 'testnet'
    },
    ADDRESS_FORMATS: ['copay', 'cashaddr', 'legacy'],
    SCRIPT_TYPES: {
        P2SH: 'P2SH',
        P2WSH: 'P2WSH',
        P2PKH: 'P2PKH',
        P2WPKH: 'P2WPKH'
    },
    DERIVATION_STRATEGIES: {
        BIP44: 'BIP44',
        BIP45: 'BIP45'
    },
    PATHS: {
        SINGLE_ADDRESS: "m/0'/0",
        REQUEST_ELECTRUM_KEY: "m/0'",
        REQUEST_KEY: "m/1'/0",
        TXPROPOSAL_KEY: "m/1'/1",
        REQUEST_KEY_AUTH: 'm/2'
    },
    BIP45_SHARED_INDEX: 0x80000000 - 1,
    TOKEN_OPTS: CWC.Constants.TOKEN_OPTS
};
//# sourceMappingURL=constants.js.map