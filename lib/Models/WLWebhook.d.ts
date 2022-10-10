import Helper from '../helper/Helper';
export default class WLWebhook extends Helper {
    private needle;
    private base_url;
    private Redis;
    constructor();
    MessageUpsert(sessionId: any, message: any): Promise<void>;
    appLogOut(sessionId: any): Promise<void>;
    connectionConnected(sessionId: any): Promise<void>;
    MessageUpdates(sessionId: any, message: any): Promise<void>;
    ChatsUpdate(sessionId: any, message: any): Promise<void>;
    ChatsDelete(sessionId: any, m: any): Promise<void>;
}
