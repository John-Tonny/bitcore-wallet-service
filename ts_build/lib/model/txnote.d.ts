export interface ITxNote {
    version: number;
    createdOn: number;
    walletId: string;
    txid: string;
    body: string;
    editedOn: number;
    editedBy: string;
}
export declare class TxNote {
    version: number;
    createdOn: number;
    walletId: string;
    txid: string;
    body: string;
    editedOn: number;
    editedBy: string;
    static create(opts: any): TxNote;
    static fromObj(obj: any): TxNote;
    edit(body: any, copayerId: any): void;
    toObject(): this;
}
//# sourceMappingURL=txnote.d.ts.map