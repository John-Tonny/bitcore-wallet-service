import 'source-map-support/register';
import request from 'request';
import { INotification } from './model';
import { Storage } from './storage';
export interface IPushNotificationService {
    templatePath: string;
    defaultLanguage: string;
    defaultUnit: string;
    subjectPrefix: string;
    pushServerUrl: string;
    availableLanguages: string;
    authorizationKey: string;
    messageBroker: any;
}
export declare class PushNotificationsService {
    request: request.RequestAPI<any, any, any>;
    templatePath: string;
    defaultLanguage: string;
    defaultUnit: string;
    subjectPrefix: string;
    pushServerUrl: string;
    availableLanguages: string;
    authorizationKey: string;
    storage: Storage;
    messageBroker: any;
    start(opts: any, cb: any): any;
    _sendPushNotifications(notification: any, cb: any): any;
    _checkShouldSendNotif(notification: any, cb: any): any;
    _getRecipientsList(notification: any, notificationType: any, cb: any): void;
    _readAndApplyTemplates(notification: any, notifType: any, recipientsList: any, cb: any): void;
    _getDataForTemplate(notification: INotification, recipient: any, cb: any): any;
    _applyTemplate(template: any, data: any, cb: any): any;
    _loadTemplate(notifType: any, recipient: any, extension: any, cb: any): void;
    _readTemplateFile(language: any, filename: any, cb: any): void;
    _compileTemplate(template: any, extension: any): {
        subject: any;
        body: string;
    };
    _makeRequest(opts: any, cb: any): void;
}
//# sourceMappingURL=pushnotificationsservice.d.ts.map