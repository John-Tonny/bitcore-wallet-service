export declare class Utils {
    static getMissingFields(obj: any, args: any): any;
    static strip(number: any): number;
    static hashMessage(text: any, noReverse: any): any;
    static verifyMessage(message: any, signature: any, publicKey: any): any;
    static _tryImportPublicKey(publicKey: any): any;
    static _tryImportSignature(signature: any): any;
    static _tryVerifyMessage(hash: any, sig: any, publicKeyBuffer: any): any;
    static formatAmount(satoshis: any, unit: any, opts: any): any;
    static formatAmountInBtc(amount: any): string;
    static formatAmountInVcl(amount: any): string;
    static formatUtxos(utxos: any): string;
    static formatRatio(ratio: any): string;
    static formatSize(size: any): string;
    static parseVersion(version: any): {
        agent?: string;
        major?: number;
        minor?: number;
        patch?: number;
    };
    static parseAppVersion(agent: any): {
        app?: string;
        major?: number;
        minor?: number;
        patch?: number;
    };
    static getIpFromReq(req: any): string;
    static checkValueInCollection(value: any, collection: any): boolean;
    static getAddressCoin(address: any): "bch" | "btc" | "vcl";
    static translateAddress(address: any, coin: any): any;
}
//# sourceMappingURL=utils.d.ts.map