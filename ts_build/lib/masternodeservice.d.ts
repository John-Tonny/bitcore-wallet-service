import 'source-map-support/register';
import { Lock } from './lock';
import { MessageBroker } from './messagebroker';
import { Storage } from './storage';
export declare class MasternodeService {
    explorers: any;
    storage: Storage;
    messageBroker: MessageBroker;
    lock: Lock;
    init(opts: any, cb: any): void;
    startCron(opts: any, cb: any): any;
    _fetch(cb?: any): void;
    updateMasternodes(coin: any, network: any, masternodes: any, cb: any): any;
    _storeAndBroadcastNotification(notification: any, cb?: () => void): void;
}
//# sourceMappingURL=masternodeservice.d.ts.map