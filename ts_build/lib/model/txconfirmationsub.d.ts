export interface ITxConfirmationSub {
    version: number;
    createdOn: number;
    walletId: string;
    copayerId: string;
    txid: string;
    isActive: boolean;
}
export declare class TxConfirmationSub {
    version: number;
    createdOn: number;
    walletId: string;
    copayerId: string;
    txid: string;
    isActive: boolean;
    static create(opts: any): TxConfirmationSub;
    static fromObj(obj: any): TxConfirmationSub;
}
//# sourceMappingURL=txconfirmationsub.d.ts.map