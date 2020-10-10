export interface INotification {
    version: string;
    createdOn: number;
    id: number;
    type: string;
    data: any;
    walletId: string;
    creatorId: string;
}
export declare class Notification {
    version: string;
    createdOn: number;
    id: string | number;
    type: string;
    data: any;
    walletId: string;
    creatorId: string;
    static create(opts: any): Notification;
    static fromObj(obj: any): Notification;
}
//# sourceMappingURL=notification.d.ts.map