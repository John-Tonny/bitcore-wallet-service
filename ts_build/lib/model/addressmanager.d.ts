export interface IAddressManager {
    version: number;
    derivationStrategy: string;
    receiveAddressIndex: number;
    changeAddressIndex: number;
    copayerIndex: number;
    skippedPaths: Array<{
        path: string;
        isChange: boolean;
    }>;
}
export declare class AddressManager {
    version: number;
    derivationStrategy: string;
    receiveAddressIndex: number;
    changeAddressIndex: number;
    copayerIndex: number;
    skippedPaths: Array<{
        path: string;
        isChange: boolean;
    }>;
    static create(opts: any): AddressManager;
    static fromObj(obj: any): AddressManager;
    static supportsCopayerBranches(derivationStrategy: any): boolean;
    _incrementIndex(isChange: any): void;
    rewindIndex(isChange: any, step: any, n: any): void;
    getCurrentIndex(isChange: any): number;
    getBaseAddressPath(isChange: any): string;
    getCurrentAddressPath(isChange: any): string;
    getNewAddressPath(isChange: any, step?: number): any;
    getNextSkippedPath(): {
        path: string;
        isChange: boolean;
    };
    parseDerivationPath(path: any): {
        _input: any;
        addressIndex: any;
        isChange: boolean;
    };
}
//# sourceMappingURL=addressmanager.d.ts.map