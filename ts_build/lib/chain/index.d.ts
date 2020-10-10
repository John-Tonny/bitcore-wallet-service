import { ITxProposal, IWallet, TxProposal } from '../model';
import { WalletService } from '../server';
export interface INotificationData {
    out: {
        address: any;
        amount: any;
        tokenAddress?: any;
    };
    txid: any;
}
export interface IChain {
    getWalletBalance(server: WalletService, wallet: IWallet, opts: {
        coin: string;
        addresses: string[];
    } & any, cb: any): any;
    getWalletSendMaxInfo(server: WalletService, wallet: IWallet, opts: {
        excludeUnconfirmedUtxos: string;
        returnInputs: string;
        from: string;
        feePerKb: number;
    } & any, cb: any): any;
    getDustAmountValue(): any;
    getTransactionCount(server: WalletService, wallet: IWallet, from: string): any;
    getChangeAddress(server: WalletService, wallet: IWallet, opts: {
        changeAddress: string;
    } & any): any;
    checkDust(output: {
        amount: number;
        toAddress: string;
        valid: boolean;
    }, opts: {
        outputs: any[];
    } & any): any;
    getFee(server: WalletService, wallet: IWallet, opts: {
        fee: number;
        feePerKb: number;
    } & any): any;
    getBitcoreTx(txp: TxProposal, opts: {
        signed: boolean;
    }): any;
    convertFeePerKb(p: number, feePerKb: number): any;
    checkTx(server: WalletService, txp: ITxProposal): any;
    checkTxUTXOs(server: WalletService, txp: ITxProposal, opts: {
        noCashAddr: boolean;
    } & any, cb: any): any;
    selectTxInputs(server: WalletService, txp: ITxProposal, wallet: IWallet, opts: {
        utxosToExclude: any[];
    } & any, cb: any): any;
    checkUtxos(opts: {
        fee: number;
        inputs: any[];
    }): any;
    checkValidTxAmount(output: any): boolean;
    isUTXOCoin(): boolean;
    isSingleAddress(): boolean;
    supportsMultisig(): boolean;
    notifyConfirmations(network: string): boolean;
    addSignaturesToBitcoreTx(tx: string, inputs: any[], inputPaths: any[], signatures: any[], xpub: string, signingMethod?: string): any;
    addressToStorageTransform(network: string, address: {}): void;
    addressFromStorageTransform(network: string, address: {}): void;
    validateAddress(wallet: IWallet, inaddr: string, opts: {
        noCashAddr: boolean;
    } & any): any;
    onCoin(coin: any): INotificationData | null;
    onTx(tx: any): INotificationData | null;
}
declare class ChainProxy {
    get(coin: string): IChain;
    getChain(coin: string): string;
    getWalletBalance(server: any, wallet: any, opts: any, cb: any): any;
    getWalletSendMaxInfo(server: any, wallet: any, opts: any, cb: any): any;
    getDustAmountValue(coin: any): any;
    getTransactionCount(server: any, wallet: any, from: any): any;
    getChangeAddress(server: any, wallet: any, opts: any): any;
    checkDust(coin: any, output: any, opts: any): any;
    getFee(server: any, wallet: any, opts: any): any;
    getBitcoreTx(txp: TxProposal, opts?: {
        signed: boolean;
    }): any;
    convertFeePerKb(coin: any, p: any, feePerKb: any): any;
    addressToStorageTransform(coin: any, network: any, address: any): void;
    addressFromStorageTransform(coin: any, network: any, address: any): void;
    checkTx(server: any, txp: any): any;
    checkTxUTXOs(server: any, txp: any, opts: any, cb: any): any;
    selectTxInputs(server: any, txp: any, wallet: any, opts: any, cb: any): any;
    checkUtxos(coin: any, opts: any): any;
    checkValidTxAmount(coin: string, output: any): boolean;
    isUTXOCoin(coin: string): boolean;
    isSingleAddress(coin: string): boolean;
    notifyConfirmations(coin: string, network: string): boolean;
    supportsMultisig(coin: string): boolean;
    addSignaturesToBitcoreTx(coin: any, tx: any, inputs: any, inputPaths: any, signatures: any, xpub: any, signingMethod: any): void;
    validateAddress(wallet: any, inaddr: any, opts: any): any;
    onCoin(coin: string, coinData: any): INotificationData;
    onTx(coin: string, tx: any): INotificationData;
}
export declare let ChainService: ChainProxy;
export {};
//# sourceMappingURL=index.d.ts.map