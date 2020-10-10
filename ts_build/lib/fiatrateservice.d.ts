import * as request from 'request';
import { Storage } from './storage';
export declare class FiatRateService {
    request: request.RequestAPI<any, any, any>;
    defaultProvider: any;
    providers: any[];
    storage: Storage;
    init(opts: any, cb: any): void;
    startCron(opts: any, cb: any): any;
    _fetch(cb?: any): void;
    _retrieve(provider: any, coin: any, cb: any): void;
    getRate(opts: any, cb: any): void;
    getHistoricalRates(opts: any, cb: any): void;
}
//# sourceMappingURL=fiatrateservice.d.ts.map