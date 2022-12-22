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
        await this.Redis.deleteOne(sessionId, chat,'chats');
        await this.needle.post(
            this.base_url,
            {
                chatDeleted: {
                    id: chat,
                    deleted:true,
                },
                sessionId,
            },
            (err, resp, body) => {
                    (process.env.DEBUG_MODE == 'true') ? console.log('WLWebhook ChatsDelete : ' + body) : '';
            }
        )
        // TODO: Send Delete To Redis
        // await processRedisData(client, sessionId + "_conversations", {
        //  id: m[0].id,
        //  deleted_by: 1,
        //  deleted_at: Math.floor(Date.now() / 1000)
        // })
        // hide undefined function
        // await addDataToFile(sessionId, m[0], 'chatDeleted')
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

    async deleteLabel(sessionId, label_id) {
        try {
            await this.Redis.deleteOne(sessionId, label_id,'labels');
        } catch (error) {
            console.log('WLWebhook deleteLabel : ' + error)
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

    async deleteReply(sessionId, reply_id) {
        try {
            await this.Redis.deleteOne(sessionId, reply_id,'replies');
        } catch (error) {
            console.log('WLWebhook deleteReply : ' + error)
        }
    }
}
