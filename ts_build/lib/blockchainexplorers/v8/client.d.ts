/// <reference types="node" />
import * as requestStream from 'request';
export declare class Client {
    authKey: {
        bn: {
            toBuffer: (arg: any) => Buffer;
        };
    };
    baseUrl: string;
    constructor(params: any);
    getMessage(params: {
        method: string;
        url: string;
        payload?: any;
    }): string;
    sign(params: {
        method: string;
        url: string;
        payload?: any;
    }): any;
    register(params: any): Promise<any>;
    getBalance(params: any): Promise<any>;
    getCheckData(params: any): Promise<any>;
    getAddressTxos(params: any): Promise<any>;
    getTx(params: any): Promise<any>;
    getCoins(params: any): Promise<any>;
    getCoinsForTx(params: any): Promise<any>;
    listTransactions(params: any): requestStream.Request;
    importAddresses(params: any): Promise<any>;
    broadcast(params: any): Promise<any>;
    broadcastMasternode(params: any): Promise<any>;
    getMasternodeStatus(params: any): Promise<any>;
}
//# sourceMappingURL=client.d.ts.map