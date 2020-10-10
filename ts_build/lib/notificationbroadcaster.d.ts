/// <reference types="node" />
import { EventEmitter } from 'events';
export declare class NotificationBroadcaster extends EventEmitter {
    broadcast(eventName: any, notification: any, walletService: any): void;
    static singleton(): any;
}
//# sourceMappingURL=notificationbroadcaster.d.ts.map