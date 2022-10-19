import { WA_DEFAULT_EPHEMERAL,generateMessageID,delay } from "@adiwajshing/baileys";
import Helper from "../helper/Helper";
import WLContactInterface from "../interfaces/WLContactInterface";
import WLConversationInterface from "../interfaces/WLConversationInterface";
import { getSession } from "../whatsapp";
import WLRedis from "./WLRedis";


export default class Chats extends Helper {

    private WLredis;
    private session;
    private session_id;
    private target;

    constructor(req, res) {
        super();
        // Connect to Redis
        this.WLredis = new WLRedis();
        // set Session & target
        this.session = (res.locals.sessionId) ? getSession(res.locals.sessionId) : '';
        this.session_id = res.locals.sessionId ? res.locals.sessionId : (req.query.id ?? req.params.id)
        if (req.body.phone || req.body.chat) {
            this.target = req.body.phone ? this.formatPhone(req.body.phone) : this.formatGroup(req.body.chat)
        }
    }

    async fetchDialogs(req, res) {
        try {
            let dialogs: WLConversationInterface[] = await this.WLredis.getChats(this.session_id);
            let dialogsArr: WLConversationInterface[] = []
            let image = '';
            if(dialogs.length){
                await Promise.all(Object.values(dialogs).map(async (dialog) => {
                    try {
                        image = await getSession(this.session_id).profilePictureUrl(dialog.id)
                    } catch (e) {
                        (process.env.DEBUG_MODE == 'true') ? console.log('fetching chat image error', dialog.id) : '';
                    }
                    dialogsArr.push({
                        'id': dialog.id,
                        'unreadCount': dialog.unreadCount,
                        'unreadMentionCount': dialog.unreadMentionCount,
                        'conversationTimestamp': dialog.conversationTimestamp,
                        'last_time': dialog.conversationTimestamp,
                        'notSpam': dialog.notSpam,
                        'readOnly': dialog.readOnly,
                        'archived': dialog.archived,
                        'pinned': dialog.pinned,
                        'disappearingMode': dialog.disappearingMode,
                        'muted': dialog.muted,
                        'mutedUntil': dialog.mutedUntil,
                        'image' : image,
                    })
                }));
            }
            let page = req.query.page ?? 1;
            let page_size = req.query.page_size ?? 100;
            let paginatedData = await this.paginateData(dialogsArr,page,page_size)
            this.response(res, 200, true, 'Dialogs Found !!!', paginatedData)
        } catch {
            this.response(res, 500, false, 'Failed to load Dialogs.')
        }
    }


    async myChats(req, res) {
        try {
            let dialogs: any[] = await this.WLredis.getChats(this.session_id);
            let pinned: any[] = []
            let notPinned: any[] = []
            let image = '';
            let messages = [];
            let contacts = [];
            if(dialogs.length){
                await Promise.all(Object.values(dialogs).map(async (dialog) => {
                    try {
                        messages =  await this.WLredis.getLastMessageInChat(this.session_id,dialog.id,2);
                        // image = await getSession(this.session_id).profilePictureUrl(dialog.id)
                    } catch (e) {
                        (process.env.DEBUG_MODE == 'true') ? console.log('fetching last message error', dialog.id) : '';
                    }

                    let dataObj = {
                        'id': dialog.id,
                        'unreadCount': dialog.unreadCount,
                        'unreadMentionCount': dialog.unreadMentionCount,
                        'conversationTimestamp': dialog.conversationTimestamp,
                        'last_time': dialog.conversationTimestamp,
                        'notSpam': dialog.notSpam,
                        'readOnly': dialog.readOnly,
                        'archived': dialog.archived,
                        'pinned': dialog.pinned,
                        'disappearingMode': dialog.disappearingMode,
                        'muted': dialog.muted,
                        'mutedUntil': dialog.mutedUntil,
                        'image': image,
                        'lastMessage':messages,
                        'contact': contacts,
                    };
                    if(Number(dialog.pinned) > 0){
                        pinned.push(dataObj)
                    }else{
                        notPinned.push(dataObj)
                    }
                }));
            }
            
            pinned.sort(function(a,b): any {
                return Number(a.pinned) > Number(b.pinned) ? -1 : 1
            });

            await Promise.all(Object.values(pinned).map(async (pinnedDialog) => {
                try {
                    pinnedDialog.image = await getSession(this.session_id).profilePictureUrl(pinnedDialog.id)
                } catch (e) {
                    (process.env.DEBUG_MODE == 'true') ? console.log('fetching last message error', pinnedDialog.id) : '';
                }
            }));    

            await Promise.all(Object.values(pinned).map(async (pinnedDialog) => {
                try {
                    pinnedDialog.contact = await this.WLredis.getContact(this.session_id,pinnedDialog.id);     
                } catch (e) {
                    (process.env.DEBUG_MODE == 'true') ? console.log('fetching last message error', pinnedDialog.id) : '';
                }
            }));    


            notPinned.sort(function(a,b) {
                let aHas: any = typeof a.lastMessage !== 'undefined';
                let bHas: any = typeof b.lastMessage !== 'undefined';
                return (bHas - aHas) || (aHas === true && Number(a.lastMessage.time) > Number(b.lastMessage.time) ? -1 : 1) || 0;
            });
            notPinned = notPinned.splice(0 , 50 - pinned.length)

            await Promise.all(Object.values(notPinned).map(async (notPinnedDialog) => {
                try {
                    notPinnedDialog.image = await getSession(this.session_id).profilePictureUrl(notPinnedDialog.id)
                } catch (e) {
                    (process.env.DEBUG_MODE == 'true') ? console.log('fetching last message error', notPinnedDialog.id) : '';
                }
            })); 

            await Promise.all(Object.values(notPinned).map(async (notPinnedDialog) => {
                try {
                    notPinnedDialog.contact = await this.WLredis.getContact(this.session_id,notPinnedDialog.id);     
                } catch (e) {
                    (process.env.DEBUG_MODE == 'true') ? console.log('fetching last message error', notPinnedDialog.id) : '';
                }
            }));    

            this.response(res, 200, true, 'Dialogs Found !!!', {
                pinned: pinned,
                notPinned: notPinned,
            })
        } catch {
            this.response(res, 500, false, 'Failed to load Dialogs.')
        }
    }

    async getChat(req, res) {
        try {
            let selected:WLConversationInterface[] = await this.WLredis.getChat(this.session_id, this.target)
            let image = '';
            let chatObj;
            if(selected.hasOwnProperty('id')){
                try {
                    image = await getSession(res.locals.sessionId).profilePictureUrl(selected['id'])
                } catch (e) {
                    (process.env.DEBUG_MODE == 'true') ? console.log('fetching chat image error', selected['id']) : '';
                }
                chatObj= {
                    'id': selected['id'],
                    'unreadCount': selected['unreadCount'],
                    'unreadMentionCount': selected['unreadMentionCount'],
                    'conversationTimestamp': selected['conversationTimestamp'],
                    'last_time': selected['conversationTimestamp'],
                    'notSpam': selected['notSpam'],
                    'readOnly': selected['readOnly'],
                    'archived': selected['archived'],
                    'pinned': selected['pinned'],
                    'disappearingMode': selected['disappearingMode'],
                    'muted': selected['muted'],
                    'mutedUntil': selected['mutedUntil'],
                    'image' : image,
                }
            }
            this.response(res, 200, true, 'Dialog Found !!!', chatObj)
        } catch (error) {
            this.response(res, 500, false, 'Failed to load Dialog : ' + error)
        }

    }

    async deleteChat(req, res) {
        try {
            const exists = await this.onWhatsApp(this.session, this.target)

            if (!exists) {
                return this.response(res, 400, false, 'This chat does not exist.')
            }
            const lastMsgInChat = await this.WLredis.getLastMessageInChat(this.session_id, this.target)
            const status = await this.session.chatModify({ delete: true, lastMessages: [lastMsgInChat] }, this.target)
            return this.response(res, 200, true, 'Chat Deleted Successfully !!', {
                deleted:true,
                remoteJid: this.target, 
            })
        } catch (error) {
            return this.response(res, 500, false, 'Failed to delete chat : ' + error)
        }
    }

    async clearChat(req, res) {
        try {
            const exists = await this.onWhatsApp(this.session, this.target)

            if (!exists) {
                return this.response(res, 400, false, 'This chat does not exist.')
            }
            const lastMsgInChat = await this.WLredis.getLastMessageInChat(this.session_id, this.target)
            const status = await this.session.chatModify({ clear: 'all', lastMessages: [lastMsgInChat] }, this.target)
            return this.response(res, 200, true, 'Chat Cleared Successfully !!', {
                cleared:true,
                remoteJid: this.target, 
            })
        } catch (error) {
            return this.response(res, 500, false, 'Failed to clear chat : ' + error)
        }
    }

    async readChat(req, res) {
        try {
            const exists = await this.onWhatsApp(this.session, this.target)

            if (!exists) {
                return this.response(res, 400, false, 'This chat does not exist.')
            }
            const lastMsgInChat = await this.WLredis.getLastMessageInChat(this.session_id, this.target)
            const status = await this.session.chatModify({ markRead: true, lastMessages: [lastMsgInChat] }, this.target)

            return this.response(res, 200, true, 'Chat Read Successfully !!', {
                read:true,
                remoteJid: this.target, 
            })
        } catch (error) {
            return this.response(res, 500, false, 'Failed to read chat. ' + error)
        }
    }

    async unreadChat(req, res) {
        try {
            const exists = await this.onWhatsApp(this.session, this.target)

            if (!exists) {
                return this.response(res, 400, false, 'This chat does not exist.')
            }
            const lastMsgInChat = await this.WLredis.getLastMessageInChat(this.session_id, this.target)             
            const status = await this.session.chatModify({ markRead: false, lastMessages: [lastMsgInChat] }, this.target)
            return this.response(res, 200, true, 'Chat UnRead Successfully !!', {
                read:false,
                remoteJid: this.target, 
            })
        } catch (error) {
            return this.response(res, 500, false, 'Failed to unread chat : ' + error)
        }
    }

    async archiveChat(req, res) {
        try {
            const exists = await this.onWhatsApp(this.session, this.target)

            if (!exists) {
                return this.response(res, 400, false, 'This chat does not exist.')
            }
            const lastMsgInChat = await this.WLredis.getLastMessageInChat(this.session_id, this.target)
            const status = await this.session.chatModify({ archive: true, lastMessages: [lastMsgInChat] }, this.target)
            return this.response(res, 200, true, 'Chat Archived Successfully !!', {
                archived:true,
                remoteJid: this.target, 
            })
        } catch (error) {
            return this.response(res, 500, false, 'Failed to archive chat : ' + error)
        }
    }

    async unarchiveChat(req, res) {
        try {
            const exists = await this.onWhatsApp(this.session, this.target)

            if (!exists) {
                return this.response(res, 400, false, 'This chat does not exist.')
            }
            const lastMsgInChat = await this.WLredis.getLastMessageInChat(this.session_id, this.target)
            const status = await this.session.chatModify({ archive: false, lastMessages: [lastMsgInChat] }, this.target)
            return this.response(res, 200, true, 'Chat UnArchived Successfully !!', {
                archived:false,
                remoteJid: this.target, 
            })
        } catch (error) {
            return this.response(res, 500, false, 'Failed to unarchive chat : ' + error)
        }
    }

    async muteChat(req, res) {
        const { duration } = req.body
        try {
            const exists = await this.onWhatsApp(this.session, this.target)

            if (!exists) {
                return this.response(res, 400, false, 'This chat does not exist.')
            }

            let now = Date.now()
            let myDuration = Number(duration) * 1000 ;
            const status = await this.session.chatModify({ mute:  now + myDuration }, this.target, [])

            return this.response(res, 200, true, 'Chat Muted Successfully !!', {
                muted: true,
                mutedUntil: new Date(now + myDuration).toUTCString(),
                remoteJid: this.target
            })
        } catch {
            return this.response(res, 500, false, 'Failed to mute chat.')
        }
    }

    async unmuteChat(req, res) {
        try {
            const exists = await this.onWhatsApp(this.session, this.target)

            if (!exists) {
                return this.response(res, 400, false, 'This chat does not exist.')
            }

            const status = await this.session.chatModify({ mute: null }, this.target, [])

            return this.response(res, 200, true, 'Chat UnMuted Successfully !!', {
                muted: false,
                remoteJid: this.target
            })
        } catch {
            return this.response(res, 500, false, 'Failed to unmute chat.')
        }
    }

    async pinChat(req, res) {
        try {
            const exists = await this.onWhatsApp(this.session, this.target)

            if (!exists) {
                return this.response(res, 400, false, 'This chat does not exist.')
            }

            const status = await this.session.chatModify({ pin: true }, this.target, [])

            return this.response(res, 200, true, 'Chat Pinned Successfully !!', {
                pinned: true,
                remoteJid: this.target
            })
        } catch {
            return this.response(res, 500, false, 'Failed to pin chat.')
        }
    }

    async unpinChat(req, res) {
        try {
            const exists = await this.onWhatsApp(this.session, this.target)

            if (!exists) {
                return this.response(res, 400, false, 'This chat does not exist.')
            }

            const status = await this.session.chatModify({ pin: false }, this.target, [])

            return this.response(res, 200, true, 'Chat UnPinned Successfully !!', {
                pinned: false,
                remoteJid: this.target
            })
        } catch {
            return this.response(res, 500, false, 'Failed to unpin chat.')
        }
    }

    //'unavailable' | 'available' | 'composing' | 'recording' | 'paused'
    async setTyping(req, res) {
        try {
            const exists = await this.onWhatsApp(this.session, this.target)

            if (!exists) {
                return this.response(res, 400, false, 'This chat does not exist.')
            }

            const updated = await this.session.sendPresenceUpdate('composing',this.target)

            return this.response(res, 200, true, 'User presence has been set to composing Successfully', {
                presence: 'typing',
                remoteJid: this.target
            })
        } catch {
            return this.response(res, 500, false, 'Failed to set user presence.')
        }
    }

    async setRecording(req, res) {
        try {
            const exists = await this.onWhatsApp(this.session, this.target)

            if (!exists) {
                return this.response(res, 400, false, 'This chat does not exist.')
            }

            const updated = await this.session.sendPresenceUpdate('recording',this.target)

            return this.response(res, 200, true, 'User presence has been set to recording Successfully', {
                presence: 'recording',
                remoteJid: this.target
            })
        } catch {
            return this.response(res, 500, false, 'Failed to set user presence.')
        }
    }
}