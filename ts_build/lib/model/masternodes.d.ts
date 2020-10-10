export interface IMasternode {
    createdOn: number;
    walletId: string;
    txid: string;
    masternodeKey: string;
    coin: string;
    network: string;
    address: string;
    payee: string;
    status: string;
    protocol: number;
    daemonversion: string;
    sentinelversion: string;
    sentinelstate: string;
    lastseen: number;
    activeseconds: number;
    lastpaidtime: number;
    lastpaidblock: number;
    pingretries: number;
}
export declare class Masternodes {
    createdOn: number;
    walletId: string;
    txid: string;
    address: string;
    masternodeKey: string;
    coin: string;
    network: string;
    payee?: string;
    status: string;
    protocol?: number;
    daemonversion?: string;
    sentinelversion?: string;
    sentinelstate?: string;
    lastseen?: number;
    activeseconds?: number;
    lastpaidtime?: number;
    lastpaidblock?: number;
    pingretries?: number;
    static create(opts: any): Masternodes;
    static fromObj(obj: any): Masternodes;
}
//# sourceMappingURL=masternodes.d.ts.map