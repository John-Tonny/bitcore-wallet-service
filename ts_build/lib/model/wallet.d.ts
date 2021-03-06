import { Address } from './address';
import { AddressManager } from './addressmanager';
import { Copayer } from './copayer';
export interface IWallet {
    version: string;
    createdOn: number;
    id: number;
    name: string;
    m: number;
    n: number;
    singleAddress: boolean;
    status: string;
    publicKeyRing: Array<{
        xPubKey: string;
        requestPubKey: string;
    }>;
    addressIndex: number;
    copayers: string[];
    pubKey: string;
    coin: string;
    network: string;
    derivationStrategy: string;
    addressType: string;
    addressManager: string;
    scanStatus: 'error' | 'success';
    beRegistered: boolean;
    beAuthPrivateKey2: string;
    beAuthPublicKey2: string;
    nativeCashAddr: boolean;
    isTestnet?: boolean;
    usePurpose48?: boolean;
}
export declare class Wallet {
    version: string;
    createdOn: number;
    id: number;
    name: string;
    m: number;
    n: number;
    singleAddress: boolean;
    status: string;
    publicKeyRing: Array<{
        xPubKey: string;
        requestPubKey: string;
    }>;
    addressIndex: number;
    copayers: Array<Copayer>;
    pubKey: string;
    coin: string;
    network: string;
    derivationStrategy: string;
    addressType: string;
    addressManager: AddressManager;
    scanStatus: 'error' | 'success';
    beRegistered: boolean;
    beAuthPrivateKey2: string;
    beAuthPublicKey2: string;
    nativeCashAddr: boolean;
    isTestnet?: boolean;
    usePurpose48?: boolean;
    scanning: boolean;
    static COPAYER_PAIR_LIMITS: {};
    static create(opts: any): Wallet;
    static fromObj(obj: IWallet): Wallet;
    toObject(): any;
    static getMaxRequiredCopayers(totalCopayers: any): any;
    static verifyCopayerLimits(m: any, n: any): boolean;
    isShared(): boolean;
    isUTXOCoin(): boolean;
    updateBEKeys(): void;
    _updatePublicKeyRing(): void;
    addCopayer(copayer: any): void;
    addCopayerRequestKey(copayerId: any, requestPubKey: any, signature: any, restrictions: any, name: any): void;
    getCopayer(copayerId: any): Copayer;
    isComplete(): boolean;
    isScanning(): boolean;
    createAddress(isChange: any, step: any): Address;
    getSkippedAddress(): Address;
}
//# sourceMappingURL=wallet.d.ts.map