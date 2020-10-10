import moment from 'moment';
import * as mongodb from 'mongodb';
export declare class UpdateStats {
    from: moment.MomentFormatSpecification;
    to: moment.MomentFormatSpecification;
    db: mongodb.Db;
    client: mongodb.MongoClient;
    constructor();
    run(config: any, cb: any): any;
    updateStats(cb: any): void;
    _updateNewWallets(cb: any): Promise<void>;
    _updateFiatRates(cb: any): Promise<void>;
    lastRun(coll: any): Promise<string>;
    _updateTxProposals(cb: any): Promise<void>;
}
//# sourceMappingURL=updatestats.d.ts.map