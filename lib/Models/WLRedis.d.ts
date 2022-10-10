import Helper from '../helper/Helper';
import WLContactInterface from '../interfaces/WLContactInterface';
import WLConversationInterface from '../interfaces/WLConversationInterface';
import WLMessageInterface from '../interfaces/WLMessageInterface';
export default class WLRedis extends Helper {
    private redis;
    constructor();
    setContact(session_id: any, contact: any): Promise<void>;
    setChat(session_id: any, chat: any): Promise<void>;
    setMessage(session_id: any, message: any): Promise<void>;
    setContacts(session_id: any, contacts: any): Promise<void>;
    setChats(session_id: any, chats: any): Promise<void>;
    setMessages(session_id: any, messages: any, sock: any): Promise<void>;
    deleteSession(session_id: any): Promise<void>;
    private getKeys;
    getContacts(session_id: any): Promise<WLContactInterface[]>;
    getMessages(session_id: any): Promise<WLMessageInterface[]>;
    getChats(session_id: any): Promise<WLConversationInterface[]>;
    getContact(session_id: any, message_id: any): Promise<any>;
    getMessage(session_id: any, message_id: any): Promise<any>;
    getChat(session_id: any, message_id: any): Promise<any>;
    getLastMessageInChat(session_id: any, chatId: any): Promise<{
        key: {
            remoteJid: any;
            fromMe: string;
            id: any;
            participant: undefined;
        };
        messageTimestamp: any;
    }>;
    updateContact(session_id: any, message_id: any): Promise<any>;
    updateMessage(session_id: any, message_id: any): Promise<any>;
    updateChat(session_id: any, message_id: any): Promise<any>;
}
