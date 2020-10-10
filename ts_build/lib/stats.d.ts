import moment from 'moment';
import * as mongodb from 'mongodb';
export declare class Stats {
    network: string;
    coin: string;
    from: moment.MomentFormatSpecification;
    to: moment.MomentFormatSpecification;
    db: mongodb.Db;
    client: mongodb.MongoClient;
    constructor(opts: any);
    run(cb: any): any;
    _getStats(cb: any): void;
    _getNewWallets(cb: any): void;
    _getFiatRates(cb: any): void;
    _getTxProposals(cb: any): void;
}
//# sourceMappingURL=stats.d.ts.map