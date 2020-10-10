export declare class Email {
    version: number;
    createdOn: number;
    id: string | number;
    walletId: string;
    copayerId: string;
    from: string;
    to: string;
    subject: string;
    bodyPlain: string;
    bodyHtml: string;
    status: string;
    attempts: number;
    lastAttemptOn?: number;
    notificationId: string;
    language: string;
    static create(opts: any): Email;
    static fromObj(obj: any): Email;
    _logAttempt(result: any): void;
    setSent(): void;
    setFail(): void;
}
//# sourceMappingURL=email.d.ts.map