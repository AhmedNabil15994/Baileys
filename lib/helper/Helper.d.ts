export default class Helper {
    response(res: any, statusCode?: number, success?: boolean, message?: string, data?: {}): void;
    isSessionExists(sessionId: any): 1 | 0;
    sessionsDir(sessionId?: string): string;
    formatPhone: (phone: any) => any;
    fixRemoteJid(remoteJid: any): any;
    formatGroup: (group: any) => any;
    onWhatsApp(session: any, id: any): Promise<any>;
    sleep(ms: any): Promise<unknown>;
    isExists(session: any, jid: any, isGroup?: boolean): boolean;
    formatButtons: (buttons: any) => any;
    mimeType(url: any): any;
    fileName(url: any): string | undefined;
    reformatPhone(phone: any, checkGroup?: null): any;
    formatStatusText(status: any): string;
    formatButtonsResponse(buttons: any): any;
    formatTemplateButtonsResponse(buttons: any): any;
    formatSectionsResponse(sections: any): any;
    formatTemplateButtons(buttons: any): any;
    reformatMessageObj(sessionId: any, msg: any, messageType: any, sock: any): Promise<{
        id: any;
        body: any;
        caption: string;
        messageType: string;
        fileName: string;
        fromMe: any;
        author: any;
        chatName: any;
        pushName: any;
        time: any;
        timeFormatted: string;
        status: number;
        statusText: string;
        deviceSentFrom: "android" | "web" | "ios";
        expirationFormatted: string;
        expiration: string;
        remoteJid: any;
    }>;
}
