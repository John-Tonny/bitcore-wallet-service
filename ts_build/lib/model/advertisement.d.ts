export interface IAdvertisement {
    name: string;
    advertisementId: string;
    type: string;
    title: string;
    country: string;
    body: string;
    imgUrl: string;
    linkText: string;
    linkUrl: string;
    app: string;
    dismissible: boolean;
    signature: boolean;
    isAdActive: boolean;
    isTesting: boolean;
    appVersion: string;
}
export declare class Advertisement {
    advertisementId: string;
    name: string;
    title: string;
    country: string;
    type: string;
    body: string;
    imgUrl: string;
    linkText: string;
    linkUrl: string;
    app: string;
    dismissible: boolean;
    signature: boolean;
    isAdActive: boolean;
    isTesting: boolean;
    appVersion: string;
    static create(opts: any): Advertisement;
    static fromObj(obj: any): Advertisement;
    toObject(): any;
}
//# sourceMappingURL=advertisement.d.ts.map