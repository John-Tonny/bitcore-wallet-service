export interface ISession {
    id: number;
    version: number;
    createdOn: number;
    updatedOn: number;
    copayerId: string;
    walletId: string;
}
export declare class Session {
    id: number;
    version: number;
    createdOn: number;
    updatedOn: number;
    copayerId: string;
    walletId: string;
    static create(opts: any): Session;
    static fromObj(obj: any): Session;
    toObject(): this;
    isValid(): boolean;
    touch(): void;
}
//# sourceMappingURL=session.d.ts.map