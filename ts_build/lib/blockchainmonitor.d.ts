import 'source-map-support/register';
import { Lock } from './lock';
import { MessageBroker } from './messagebroker';
import { Storage } from './storage';
export declare class BlockchainMonitor {
    explorers: any;
    storage: Storage;
    messageBroker: MessageBroker;
    lock: Lock;
    walletId: string;
    last: Array<string>;
    Ni: number;
    N: number;
    lastTx: Array<string>;
    Nix: number;
    start(opts: any, cb: any): void;
    _initExplorer(coin: any, network: any, explorer: any): void;
    _handleThirdPartyBroadcasts(coin: any, network: any, data: any, processIt: any): void;
    _handleIncomingPayments(coin: any, network: any, data: any): void;
    _notifyNewBlock(coin: any, network: any, hash: any): void;
    _handleTxConfirmations(coin: any, network: any, hash: any): void;
    _handleNewBlock(coin: any, network: any, hash: any): void;
    _storeAndBroadcastNotification(notification: any, cb?: () => void): void;
}
//# sourceMappingURL=blockchainmonitor.d.ts.map