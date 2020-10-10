import express from 'express';
declare type TimedRequest = {
    startTime?: Date;
    walletId?: string;
    isSupportStaff?: boolean;
} & express.Request;
export declare function LogMiddleware(): (req: TimedRequest, res: express.Response<any>, next: express.NextFunction) => void;
export {};
//# sourceMappingURL=middleware.d.ts.map