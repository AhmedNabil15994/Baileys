import Helper from "../helper/Helper";
export default class Message extends Helper {
    private WLredis;
    private session;
    private session_id;
    private target;
    constructor(req: any, res: any);
    fetchDialogs(req: any, res: any): Promise<void>;
    fetchMessages(req: any, res: any): Promise<void>;
    getList(req: any, res: any): void;
    findMessage(req: any, res: any): Promise<void>;
    send(req: any, res: any): Promise<void>;
    sendDisappearing(req: any, res: any): Promise<void>;
    sendTemplates(req: any, res: any): Promise<void>;
    sendListMessage(req: any, res: any): Promise<void>;
    sendReaction(req: any, res: any): Promise<void>;
    sendReply(req: any, res: any): Promise<void>;
    sendMention(req: any, res: any): Promise<void>;
    /*********************************************************/
    sendButtons(req: any, res: any): Promise<void>;
    sendLocation(req: any, res: any): Promise<void>;
    sendContact(req: any, res: any): Promise<void>;
    sendAudio(req: any, res: any): Promise<void>;
    sendVideo(req: any, res: any): Promise<void>;
    sendFile(req: any, res: any): Promise<void>;
    sendImage(req: any, res: any): Promise<void>;
    /*********************************************************/
    checkPhone(req: any, res: any): Promise<void>;
    forwardMessage(req: any, res: any): Promise<void>;
    deleteMessage(req: any, res: any): Promise<void>;
    deleteMessageForMe(req: any, res: any): Promise<void>;
    sendPTT(req: any, res: any): Promise<void>;
    sendStiker(req: any, res: any): Promise<void>;
    sendGif(req: any, res: any): Promise<void>;
}
