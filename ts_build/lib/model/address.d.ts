export interface IAddress {
    version: string;
    createdOn: number;
    address: string;
    walletId: string;
    isChange: boolean;
    path: string;
    publicKeys: string[];
    coin: string;
    network: string;
    type: string;
    hasActivity: boolean;
    beRegistered: boolean;
}
export declare class Address {
    version: string;
    createdOn: number;
    address: string;
    walletId: string;
    isChange: boolean;
    path: string;
    publicKeys: string[];
    coin: string;
    network: string;
    type: string;
    hasActivity: boolean;
    beRegistered: boolean;
    static Bitcore: {
        btc: any;
        bch: any;
        vcl: any;
    };
    static create(opts: any): Address;
    static fromObj(obj: any): Address;
    static _deriveAddress(scriptType: any, publicKeyRing: any, path: any, m: any, coin: any, network: any, noNativeCashAddr: any): {
        address: any;
        path: any;
        publicKeys: any[];
    };
    static derive(walletId: any, scriptType: any, publicKeyRing: any, path: any, m: any, coin: any, network: any, isChange: any, noNativeCashAddr?: boolean): Address;
}
//# sourceMappingURL=address.d.ts.map