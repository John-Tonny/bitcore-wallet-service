/// <reference types="socket.io" />
/// <reference types="node" />
import { EventEmitter } from 'events';
import 'source-map-support/register';
export declare class MessageBroker extends EventEmitter {
    remote: boolean;
    mq: SocketIO.Socket;
    constructor(opts: any);
    send(data: any): void;
    onMessage(handler: any): void;
}
//# sourceMappingURL=messagebroker.d.ts.map