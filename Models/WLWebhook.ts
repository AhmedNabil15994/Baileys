import needle from 'needle';
import * as dotenv from 'dotenv';
import Helper from '../helper/Helper';
import WLRedis from './WLRedis';
import rq from 'request-promise'

export default class WLWebhook extends Helper {
    private needle;
    private base_url;
    private Redis;
    constructor() {
        super();
        dotenv.config();
        this.needle = needle;
        this.base_url = process.env.WEBHOOK_URL;
        this.Redis = new WLRedis();
    }

    async appLogOut(sessionId) {
        try {
            var requestOptions = {
                method: 'GET',
                headers: {
                    SESSIONID: sessionId,
                },
                uri: process.env.BACKEND_URL+"/instances/status?status=disconnected",
            };
            await rq(requestOptions)
                .then(function (response) {})
                .catch(function (err) {
                    console.log('WLWebhook connectionConnected error: ' +err)
                });
        } catch (error) {
            console.log('WLWebhook connectionConnected : ' + error)
        }
    }

    async connectionConnected(sessionId) {
        try {
            var requestOptions = {
                method: 'GET',
                headers: {
                    SESSIONID: sessionId,
                },
                uri: process.env.BACKEND_URL+"/instances/status?status=connected",
            };
            await rq(requestOptions)
                .then(function (response) {})
                .catch(function (err) {
                    console.log('WLWebhook connectionConnected error: ' +err)
                });
        } catch (error) {
            console.log('WLWebhook connectionConnected : ' + error)
        }
    }

    async incomingCall(sessionId,call){
        try {
            let message = {
                id: call.id,
                body: 'Call From ' + call.from.replace('@s.whatsapp.net',''),
                messageType: 'call',
                remoteJid: call.from,
                fromMe: false,  
                author: call.from.replace('@s.whatsapp.net',''),
                chatName: call.from.replace('@s.whatsapp.net',''), 
                pushName: call.from.replace('@s.whatsapp.net',''), 
                status: 2,
                time: (new Date(call.date)).getTime() / 1000,
                timeFormatted: new Date(call.date).toUTCString(),
                statusText: "Sent",
                deviceSentFrom: "web",
                metadata: { 
                    offline: call.offline,
                    status: call.status,
                    isVideo: call.isVideo,
                    isGroup: call.isGroup,
                }
            }
            await this.Redis.setOne(sessionId, message,'messages');

            message.status = message.status - 1;
            let newMessage = JSON.stringify(message)
            await this.needle.post(
                this.base_url,
                {
                    conversation: {
                        id: message.remoteJid,
                        lastTime: message.time,
                        lastMessage: newMessage,
                    },
                    sessionId,
                },
                (err, resp, body) => {
                    (process.env.DEBUG_MODE == 'true') ? console.log('WLWebhook MessageUpsert : ' + body) : '';
                }
            )
        } catch (error) {
            console.log('WLWebhook MessageUpsert : ' + error)
        }
    }

    async MessageUpsert(sessionId, message) {
        try {
            await this.Redis.setOne(sessionId, message,'messages');
            message.status = message.status - 1;
            let newMessage = JSON.stringify(message)
            await this.needle.post(
                this.base_url,
                {
                    conversation: {
                        id: message.remoteJid,
                        lastTime: message.time,
                        lastMessage: newMessage,
                    },
                    sessionId,
                },
                (err, resp, body) => {
                    (process.env.DEBUG_MODE == 'true') ? console.log('WLWebhook MessageUpsert : ' + body) : '';
                }
            )
        } catch (error) {
            console.log('WLWebhook MessageUpsert : ' + error)
        }
    }

    async MessageUpdates(sessionId, message) {
        try {
            if(message.hasOwnProperty('key')){
                message.key.remoteJid = this.fixRemoteJid(message.key.remoteJid);
            }
            if(message.hasOwnProperty('labeled')){
                await this.needle.post(
                    this.base_url,
                    {
                        messageStatus: {
                            id: message.messageId,
                            status: message.labeled ? 'labelled' : 'unlabelled',
                            label_id: message.label_id,
                            chatId: this.fixRemoteJid(message.remoteJid),
                            fromMe: message.fromMe,
                        },
                        sessionId,
                    },
                    (err, resp, body) => {
                        (process.env.DEBUG_MODE == 'true') ? console.log('WLWebhook MessageUpdates : ' + body) : '';
                    }
                )
                await this.Redis.updateOne(sessionId, {id:message.messageId,labeled:message.labeled,label_id:message.label_id},'messages');
            }else if(message.update.hasOwnProperty('starred')){
                await this.needle.post(
                    this.base_url,
                    {
                        messageStatus: {
                            id: message.key.id,
                            status: message.update.starred ? 'starred' : 'unstarred',
                            fromMe: message.key.fromMe,
                            chatId: message.key.remoteJid,
                        },
                        sessionId,
                    },
                    (err, resp, body) => {
                        (process.env.DEBUG_MODE == 'true') ? console.log('WLWebhook MessageUpdates : ' + body) : '';
                    }
                )
                await this.Redis.updateOne(sessionId, message,'messages');
            }else{
                let msgStatus = message.update.hasOwnProperty('message') ? 6 : message.update.status;
                await this.needle.post(
                    this.base_url,
                    {
                        messageStatus: {
                            id: message.key.id,
                            status: msgStatus,
                            statusText: this.formatStatusText(msgStatus),
                            fromMe: message.key.fromMe,
                            chatId: message.key.remoteJid,
                        },
                        sessionId,
                    },
                    (err, resp, body) => {
                        (process.env.DEBUG_MODE == 'true') ? console.log('WLWebhook MessageUpdates : ' + body) : '';
                    }
                )
                await this.Redis.updateOne(sessionId, message,'messages');
            }
        } catch (error) {
            console.log('WLWebhook MessageUpdates : ' + error)
        }
    }

    async updatePresence(sessionId,presence){
        try {
            await this.needle.post(
                this.base_url,
                {
                    conversationPresence: {
                        data: presence,
                    },
                    sessionId,
                },
                (err, resp, body) => {
                    (process.env.DEBUG_MODE == 'true') ? console.log('WLWebhook Presence Update : ' + body) : '';
                }
            )
        } catch (error) {
            console.log('WLWebhook Presence Update : ' + error)
        }
    }

    async ChatsUpdate(sessionId, chat) {
        try {
            await this.Redis.updateOne(sessionId, chat,'chats');
            await this.needle.post(
                this.base_url,
                {
                    conversationStatus: {
                        data: chat,
                    },
                    sessionId,
                },
                (err, resp, body) => {
                    (process.env.DEBUG_MODE == 'true') ? console.log('WLWebhook ChatsUpdate : ' + body) : '';
                }
            )
            // TODO: Send Updates To Redis
            // M[0]['image'] = await getSession(sessionId).profilePictureUrl(m[0].id, 'image')
            // await processRedisData(sessionId, "conversations", m[0])
            // if(('pin' in m[0]) || ('archive' in m[0])){
            //     await addDataToFile(sessionId,m[0],'chatUpdated')
            // }
        } catch (error) {
            console.log('WLWebhook ChatsUpdate : ' + error)
        }
    }

    async ChatsDelete(sessionId, chat) {
        await this.Redis.deleteOne(sessionId, {id:chat},'chats');
        await this.needle.post(
            this.base_url,
            {
                conversationDelete: {
                    id: chat,
                    deleted:true,
                },
                sessionId,
            },
            (err, resp, body) => {
                (process.env.DEBUG_MODE == 'true') ? console.log('WLWebhook ChatsDelete : ' + body) : '';
            }
        )
    }

    async newGroup(sessionId, chat) {
        try {
            await this.needle.post(
                this.base_url,
                {
                    conversation: {
                        data: {
                            id: chat.id,
                            subject: chat.subject,
                            creation: chat.creation,
                            owner: chat.owner,
                            restrict: chat.restrict,
                            announce: chat.announce,
                            participants: chat.participants,
                        },
                    },
                    isGroup:1,
                    sessionId,
                },
                (err, resp, body) => {
                    (process.env.DEBUG_MODE == 'true') ? console.log('WLWebhook newGroup : ' + body) : '';
                }
            )
        } catch (error) {
            console.log('WLWebhook New Group : ' + error)
        }
    }

    async updateGroup(sessionId, chat) {
        try {
            await this.needle.post(
                this.base_url,
                {
                    conversationUpdate: {
                        data: chat,
                    },
                    sessionId,
                },
                (err, resp, body) => {
                    (process.env.DEBUG_MODE == 'true') ? console.log('WLWebhook updateGroup : ' + body) : '';
                }
            )
        } catch (error) {
            console.log('WLWebhook Update Group : ' + error)
        }
    }

    async setLabels(sessionId,labels){
        try{
            await this.Redis.setData(sessionId, labels,'labels');
            await this.needle.post(
                this.base_url,
                {
                    business: {
                        data: JSON.stringify(labels),
                        type: 'labels-set',
                    },
                    sessionId,
                },
                (err, resp, body) => {
                    (process.env.DEBUG_MODE == 'true') ? console.log('WLWebhook set labels : ' + body) : '';
                }
            )
        }catch(error){
            console.log('WLWebhook setLabels : ' + error)
        }
    }

    async deleteLabel(sessionId, label_id) {
        try {
            await this.Redis.deleteOne(sessionId, label_id,'labels');
            await this.needle.post(
                this.base_url,
                {
                    business: {
                        data: label_id,
                        type: 'labels-delete',
                    },
                    sessionId,
                },
                (err, resp, body) => {
                    (process.env.DEBUG_MODE == 'true') ? console.log('WLWebhook delete label : ' + body) : '';
                }
            )
        } catch (error) {
            console.log('WLWebhook deleteLabel : ' + error)
        }
    }

    async setReplies(sessionId,replies){
        try{
            await this.Redis.setData(sessionId, replies,'replies');
            await this.needle.post(
                this.base_url,
                {
                    business: {
                        data: JSON.stringify(replies),
                        type: 'replies-set',
                    },
                    sessionId,
                },
                (err, resp, body) => {
                    (process.env.DEBUG_MODE == 'true') ? console.log('WLWebhook set replies : ' + body) : '';
                }
            )
        }catch(error){
            console.log('WLWebhook setReplies : ' + error)
        }
    }

    async deleteReply(sessionId, reply_id) {
        try {
            await this.Redis.deleteOne(sessionId, reply_id,'replies');
            await this.needle.post(
                this.base_url,
                {
                    business: {
                        data: reply_id,
                        type: 'replies-delete',
                    },
                    sessionId,
                },
                (err, resp, body) => {
                    (process.env.DEBUG_MODE == 'true') ? console.log('WLWebhook delete reply : ' + body) : '';
                }
            )
        } catch (error) {
            console.log('WLWebhook deleteReply : ' + error)
        }
    }

    async setNewContact(sessionId, contact) {
        try {
            await this.Redis.setOne(sessionId, contact,'contacts');
        } catch (error) {
            console.log('WLWebhook SetContact : ' + error)
        }
    }

    async updateContact(sessionId, contact) {
        try {
            await this.Redis.updateOne(sessionId, contact,'contacts');
        } catch (error) {
            console.log('WLWebhook SetContact : ' + error)
        }
    }

    async setProduct(sessionId, product) {
        try {
            await this.Redis.setOne(sessionId, product,'products');
        } catch (error) {
            console.log('WLWebhook SetProduct : ' + error)
        }
    }

    async updateProduct(sessionId, product) {
        try {
            await this.Redis.updateOne(sessionId, product,'products');
        } catch (error) {
            console.log('WLWebhook UpdateProduct : ' + error)
        }
    }

    async deleteProduct(sessionId, product_id) {
        try {
            await this.Redis.deleteOne(sessionId, product_id,'products');
        } catch (error) {
            console.log('WLWebhook DeleteProduct : ' + error)
        }
    }

    async setLabel(sessionId, label) {
        try {
            await this.Redis.setOne(sessionId, label,'labels');
        } catch (error) {
            console.log('WLWebhook setLabel : ' + error)
        }
    }

    async updateLabel(sessionId, label) {
        try {
            await this.Redis.updateOne(sessionId, label,'labels');
        } catch (error) {
            console.log('WLWebhook updateLabel : ' + error)
        }
    }

    async setReply(sessionId, reply) {
        try {
            await this.Redis.setOne(sessionId, reply,'replies');
        } catch (error) {
            console.log('WLWebhook setReply : ' + error)
        }
    }

    async updateReply(sessionId, reply) {
        try {
            await this.Redis.updateOne(sessionId, reply,'replies');
        } catch (error) {
            console.log('WLWebhook updateReply : ' + error)
        }
    }
}
