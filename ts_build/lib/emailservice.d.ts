import 'source-map-support/register';
import { Lock } from './lock';
import { MessageBroker } from './messagebroker';
import { Storage } from './storage';
export interface Recipient {
    copayerId: string;
    emailAddress: string;
    language: string;
    unit: string;
}
export declare class EmailService {
    defaultLanguage: string;
    defaultUnit: string;
    templatePath: string;
    publicTxUrlTemplate: string;
    subjectPrefix: string;
    from: string;
    availableLanguages: string[];
    storage: Storage;
    messageBroker: MessageBroker;
    lock: Lock;
    mailer: any;
    start(opts: any, cb: any): void;
    _compileTemplate(template: any, extension: any): {
        subject: any;
        body: string;
    };
    _readTemplateFile(language: any, filename: any, cb: any): void;
    _loadTemplate(emailType: any, recipient: any, extension: any, cb: any): void;
    _applyTemplate(template: any, data: any, cb: any): any;
    _getRecipientsList(notification: any, emailType: any, cb: any): void;
    _getDataForTemplate(notification: any, recipient: any, cb: any): any;
    _send(email: any, cb: any): void;
    _readAndApplyTemplates(notification: any, emailType: any, recipientsList: Recipient[], cb: any): void;
    _checkShouldSendEmail(notification: any, cb: any): any;
    sendEmail(notification: any, cb: any): any;
}
//# sourceMappingURL=emailservice.d.ts.map