import { IChain } from '..';
export declare class BtcChain implements IChain {
    private bitcoreLib;
    protected feeSafetyMargin: number;
    constructor(bitcoreLib?: any);
    getWalletBalance(server: any, wallet: any, opts: any, cb: any): void;
    getWalletSendMaxInfo(server: any, wallet: any, opts: any, cb: any): void;
    getDustAmountValue(): any;
    getTransactionCount(): any;
    getChangeAddress(server: any, wallet: any, opts: any): Promise<unknown>;
    checkDust(output: any): any;
    getEstimatedSizeForSingleInput(txp: any): number;
    getEstimatedSizeForSingleOutput(address?: string): any;
    getEstimatedSize(txp: any): number;
    getEstimatedFee(txp: any): number;
    getFee(server: any, wallet: any, opts: any): Promise<unknown>;
    getBitcoreTx(txp: any, opts?: {
        signed: boolean;
    }): any;
    convertFeePerKb(p: any, feePerKb: any): any[];
    checkTx(txp: any): any;
    checkTxUTXOs(server: any, txp: any, opts: any, cb: any): void;
    totalizeUtxos(utxos: any): {
        totalAmount: number;
        lockedAmount: number;
        totalConfirmedAmount: number;
        lockedConfirmedAmount: number;
        availableAmount: any;
        availableConfirmedAmount: any;
    };
    selectTxInputs(server: any, txp: any, wallet: any, opts: any, cb: any): any;
    checkUtxos(opts: any): boolean;
    checkValidTxAmount(output: any): boolean;
    supportsMultisig(): boolean;
    notifyConfirmations(network: string): boolean;
    isUTXOCoin(): boolean;
    isSingleAddress(): boolean;
    addressFromStorageTransform(network: any, address: any): void;
    addressToStorageTransform(network: any, address: any): void;
    addSignaturesToBitcoreTx(tx: any, inputs: any, inputPaths: any, signatures: any, xpub: any, signingMethod: any): void;
    validateAddress(wallet: any, inaddr: any, opts: any): void;
    onCoin(coin: any): {
        out: {
            address: any;
            amount: any;
        };
        txid: any;
    };
    onTx(tx: any): any;
}
//# sourceMappingURL=index.d.ts.map