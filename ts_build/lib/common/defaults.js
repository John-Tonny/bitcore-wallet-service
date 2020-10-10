'use strict';
module.exports = {
    MIN_FEE_PER_KB: 0,
    MAX_KEYS: 100,
    DELETE_LOCKTIME: 600,
    BACKOFF_OFFSET: 10,
    BACKOFF_TIME: 600,
    MAX_MAIN_ADDRESS_GAP: 20,
    SCAN_ADDRESS_GAP: 30,
    FEE_LEVELS: {
        btc: [
            {
                name: 'urgent',
                nbBlocks: 2,
                multiplier: 1.5,
                defaultValue: 75000
            },
            {
                name: 'priority',
                nbBlocks: 2,
                defaultValue: 50000
            },
            {
                name: 'normal',
                nbBlocks: 3,
                defaultValue: 30000
            },
            {
                name: 'economy',
                nbBlocks: 6,
                defaultValue: 25000
            },
            {
                name: 'superEconomy',
                nbBlocks: 24,
                defaultValue: 10000
            }
        ],
        bch: [
            {
                name: 'normal',
                nbBlocks: 2,
                multiplier: 1.05,
                defaultValue: 2000
            }
        ],
        eth: [
            {
                name: 'urgent',
                nbBlocks: 1,
                defaultValue: 10000000000
            },
            {
                name: 'priority',
                nbBlocks: 2,
                defaultValue: 5000000000
            },
            {
                name: 'normal',
                nbBlocks: 3,
                defaultValue: 1000000000
            },
            {
                name: 'economy',
                nbBlocks: 4,
                defaultValue: 1000000000
            },
            {
                name: 'superEconomy',
                nbBlocks: 4,
                defaultValue: 1000000000
            }
        ],
        vcl: [
            {
                name: 'urgent',
                nbBlocks: 2,
                multiplier: 1.5,
                defaultValue: 75000
            },
            {
                name: 'priority',
                nbBlocks: 2,
                defaultValue: 50000
            },
            {
                name: 'normal',
                nbBlocks: 3,
                defaultValue: 30000
            },
            {
                name: 'economy',
                nbBlocks: 6,
                defaultValue: 25000
            },
            {
                name: 'superEconomy',
                nbBlocks: 24,
                defaultValue: 10000
            }
        ],
        xrp: [
            {
                name: 'normal',
                nbBlocks: 1,
                defaultValue: 12
            }
        ]
    },
    MASTERNODE_STATUS_FETCH_INTERVAL: 5,
    FEE_LEVELS_FALLBACK: 2,
    FIAT_RATE_PROVIDER: 'BitPay',
    FIAT_RATE_FETCH_INTERVAL: 10,
    FIAT_RATE_MAX_LOOK_BACK_TIME: 120,
    HISTORY_LIMIT: 1001,
    UTXO_SELECTION_MAX_SINGLE_UTXO_FACTOR: 2,
    UTXO_SELECTION_MIN_TX_AMOUNT_VS_UTXO_FACTOR: 0.1,
    UTXO_SELECTION_MAX_FEE_VS_TX_AMOUNT_FACTOR: 0.05,
    UTXO_SELECTION_MAX_FEE_VS_SINGLE_UTXO_FEE_FACTOR: 5,
    MIN_OUTPUT_AMOUNT: 5000,
    CONFIRMATIONS_TO_START_CACHING: 6 * 6,
    HISTORY_CACHE_ADDRESS_THRESOLD: 100,
    BALANCE_CACHE_ADDRESS_THRESOLD: 100,
    BALANCE_CACHE_DURATION: 10,
    BLOCKHEIGHT_CACHE_TIME: 30 * 60 * 1000,
    FEE_LEVEL_CACHE_DURATION: 6 * 60 * 1000,
    COPAY_VERSION_CACHE_DURATION: 6 * 60 * 1000,
    MAX_NOTIFICATIONS_TIMESPAN: 60 * 60 * 24 * 14,
    NOTIFICATIONS_TIMESPAN: 60,
    SESSION_EXPIRATION: 1 * 60 * 60,
    RateLimit: {
        createWallet: {
            windowMs: 60 * 60 * 1000,
            delayAfter: 8,
            delayMs: 3000,
            max: 15,
            message: 'Too many wallets created from this IP, please try again after an hour'
        },
        estimateFee: {
            windowMs: 60 * 10 * 1000,
            delayAfter: 5,
            delayMs: 300,
            max: 10,
            message: 'Too many request'
        }
    },
    COIN: 'vcl',
    INSIGHT_REQUEST_POOL_SIZE: 10,
    INSIGHT_TIMEOUT: 30000,
    ADDRESS_SYNC_BATCH_SIZE: 500000,
    LOCK_WAIT_TIME: 5 * 1000,
    LOCK_EXE_TIME: 40 * 1000,
    SERVER_EXE_TIME: 40 * 1000 * 1.5,
    BE_KEY_SALT: 'bws-auth-keysalt',
    NEW_BLOCK_THROTTLE_TIME_MIN: 5,
    BROADCAST_RETRY_TIME: 350,
    BROADCAST_MASTERNODE_RETRY_TIME: 500,
    MAX_TX_SIZE_IN_KB_BTC: 100,
    MAX_TX_SIZE_IN_KB_BCH: 100,
    MAX_TX_SIZE_IN_KB_VCL: 100,
    MAX_FEE_PER_KB: {
        btc: 10000 * 1000,
        bch: 10000 * 1000,
        eth: 1000000000000,
        vcl: 10000 * 1000,
        xrp: 1000000000000
    },
    MIN_TX_FEE: {
        btc: 0,
        bch: 0,
        eth: 0,
        vcl: 0,
        xrp: 0
    },
    MAX_TX_FEE: {
        btc: 0.05 * 1e8,
        bch: 0.05 * 1e8,
        eth: 1 * 1e18,
        vcl: 0.05 * 1e8,
        xrp: 1 * 1e6
    },
    DEFAULT_GAS_LIMIT: 200000,
    MIN_GAS_LIMIT: 21000,
    MIN_XRP_BALANCE: 20000000
};
//# sourceMappingURL=defaults.js.map