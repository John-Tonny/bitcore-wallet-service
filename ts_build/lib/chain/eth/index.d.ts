import { IChain } from '..';
export declare class EthChain implements IChain {
    private convertBitcoreBalance;
    notifyConfirmations(): boolean;
    supportsMultisig(): boolean;
    getWalletBalance(server: any, wallet: any, opts: any, cb: any): void;
    getWalletSendMaxInfo(server: any, wallet: any, opts: any, cb: any): void;
    getDustAmountValue(): number;
    getTransactionCount(server: any, wallet: any, from: any): Promise<unknown>;
    getChangeAddress(): void;
    checkDust(output: any, opts: any): void;
    getFee(server: any, wallet: any, opts: any): Promise<unknown>;
    getBitcoreTx(txp: any, opts?: {
        signed: boolean;
    }): {
        uncheckedSerialize: () => any[];
        txid: () => any;
        toObject: () => any;
        getFee: () => any;
        getChangeOutput: () => any;
    };
    convertFeePerKb(p: any, feePerKb: any): any[];
    checkTx(txp: any): any;
    checkTxUTXOs(server: any, txp: any, opts: any, cb: any): any;
    selectTxInputs(server: any, txp: any, wallet: any, opts: any, cb: any): void;
    checkUtxos(opts: any): void;
    checkValidTxAmount(output: any): boolean;
    isUTXOCoin(): boolean;
    isSingleAddress(): boolean;
    addressFromStorageTransform(network: any, address: any): void;
    addressToStorageTransform(network: any, address: any): void;
    addSignaturesToBitcoreTx(tx: any, inputs: any, inputPaths: any, signatures: any, xpub: any): void;
    validateAddress(wallet: any, inaddr: any, opts: any): void;
    onCoin(coin: any): any;
    onTx(tx: any): {
        txid: any;
        out: {
            address: any;
            amount: any;
            tokenAddress: any;
            multisigContractAddress: any;
        };
    };
}
//# sourceMappingURL=index.d.ts.map