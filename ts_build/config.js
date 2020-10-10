module.exports = {
    basePath: '/bws/api',
    disableLogs: false,
    port: 3232,
    storageOpts: {
        mongoDb: {
            uri: 'mongodb://localhost:27017/bws',
            dbname: 'bws'
        }
    },
    messageBrokerOpts: {
        messageBrokerServer: {
            url: 'http://localhost:3380'
        }
    },
    blockchainExplorerOpts: {
        btc: {
            livenet: {
                url: 'https://api.bitcore.io'
            },
            testnet: {
                url: 'https://api.bitcore.io',
                regtestEnabled: false
            }
        },
        bch: {
            livenet: {
                url: 'https://api.bitcore.io'
            },
            testnet: {
                url: 'https://api.bitcore.io'
            }
        },
        eth: {
            livenet: {
                url: 'https://api-eth.bitcore.io'
            },
            testnet: {
                url: 'http://localhost:3000'
            }
        },
        xrp: {
            livenet: {
                url: 'https://api-xrp.bitcore.io'
            },
            testnet: {
                url: 'https://api-xrp.bitcore.io'
            }
        },
        vcl: {
            livenet: {
                url: 'http://localhost:3000'
            },
            testnet: {
                url: 'http://localhost:3000'
            }
        },
        socketApiKey: 'L2mPTvucM9CNvUU6MaJwUpYiLEDN9TLa3g3Fv4Fu8CnZob4ADZdJ'
    },
    pushNotificationsOpts: {
        templatePath: 'templates',
        defaultLanguage: 'en',
        defaultUnit: 'vcl',
        subjectPrefix: '',
        pushServerUrl: 'https://fcm.googleapis.com/fcm',
        authorizationKey: 'You_have_to_put_something_here'
    },
    fiatRateServiceOpts: {
        defaultProvider: 'BitPay',
        fetchInterval: 60
    },
    maintenanceOpts: {
        maintenanceMode: false
    },
    staticRoot: '/tmp/static'
};
//# sourceMappingURL=config.js.map