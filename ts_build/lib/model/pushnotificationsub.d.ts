export interface IPushNotificationSub {
    version: string;
    createdOn: number;
    copayerId: string;
    token: string;
    packageName: string;
    platform: string;
}
export declare class PushNotificationSub {
    version: string;
    createdOn: number;
    copayerId: string;
    token: string;
    packageName: string;
    platform: string;
    static create(opts: any): PushNotificationSub;
    static fromObj(obj: any): PushNotificationSub;
}
//# sourceMappingURL=pushnotificationsub.d.ts.map