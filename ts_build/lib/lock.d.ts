import { Storage } from './storage';
export declare class Lock {
    storage: Storage;
    constructor(storage: Storage, opts?: {});
    acquire(token: any, opts: any, cb: any, timeLeft?: any): void;
    runLocked(token: any, opts: any, cb: any, task: any): void;
}
//# sourceMappingURL=lock.d.ts.map