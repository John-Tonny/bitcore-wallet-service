import { Address } from './address';
import { AddressManager } from './addressmanager';
export interface ICopayer {
    version: number;
    createdOn: number;
    coin: string;
    xPubKey: string;
    id: string;
    name: string;
    requestPubKey: string;
    signature: string;
    requestPubKeys: Array<{
        key: string;
        signature: string;
    }>;
    customData: any;
}
export declare class Copayer {
    version: number;
    createdOn: number;
    coin: string;
    xPubKey: string;
    id: string;
    name: string;
    requestPubKey: string;
    signature: string;
    requestPubKeys: Array<{
        key: string;
        signature: string;
    }>;
    customData: any;
    addressManager: AddressManager;
    static _xPubToCopayerId(coin: any, xpub: any): any;
    static create(opts: any): Copayer;
    static fromObj(obj: any): Copayer;
    createAddress(wallet: any, isChange: any): Address;
}
//# sourceMappingURL=copayer.d.ts.map