export interface IPreferences {
    version: string;
    createdOn: number;
    walletId: string;
    copayerId: string;
    email: string;
    language: string;
    unit: number;
    tokenAddresses?: string[];
    multisigEthInfo: object[];
}
export declare class Preferences {
    version: string;
    createdOn: number;
    walletId: string;
    copayerId: string;
    email: string;
    language: string;
    unit: number;
    tokenAddresses: string[];
    multisigEthInfo: object[];
    static create(opts: any): Preferences;
    static fromObj(obj: any): Preferences;
}
//# sourceMappingURL=preferences.d.ts.map