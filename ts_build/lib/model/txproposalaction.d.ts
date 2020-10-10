export interface ITxProposalAction {
    version: string;
    createdOn: number;
    copayerId: string;
    type: string;
    signatures: string[];
    xpub: string;
    comment: string;
}
export declare class TxProposalAction {
    version: string;
    createdOn: number;
    copayerId: string;
    type: string;
    signatures: string[];
    xpub: string;
    comment: string;
    static create(opts: any): TxProposalAction;
    static fromObj(obj: any): TxProposalAction;
}
//# sourceMappingURL=txproposalaction.d.ts.map