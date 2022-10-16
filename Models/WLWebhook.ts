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
            await this.Redis.setMessage(sessionId, message);
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
            message.key.remoteJid = this.fixRemoteJid(message.key.remoteJid);
            await this.needle.post(
                this.base_url,
                {
                    messageStatus: {
                        id: message.key.id,
                        status: message.update.status,
                        statusText: this.formatStatusText(message.update.status),
                        fromMe: message.key.fromMe,
                        chatId: message.key.remoteJid,
                    },
                    sessionId,
                },
                (err, resp, body) => {
                    (process.env.DEBUG_MODE == 'true') ? console.log('WLWebhook MessageUpdates : ' + body) : '';
                }
            )
            await this.Redis.updateMessage(sessionId, message);
        } catch (error) {
            console.log('WLWebhook MessageUpdates : ' + error)
        }
    }

    async ChatsUpdate(sessionId, chat) {
        try {
            await this.Redis.updateChat(sessionId, chat);
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
        await this.Redis.deleteChat(sessionId, chat);
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
            await this.Redis.setContact(sessionId, contact);
        } catch (error) {
            console.log('WLWebhook SetContact : ' + error)
        }
    }

    async updateContact(sessionId, contact) {
        try {
            await this.Redis.updateContact(sessionId, contact);
        } catch (error) {
            console.log('WLWebhook SetContact : ' + error)
        }
    }

    async setProduct(sessionId, product) {
        try {
            await this.Redis.setProduct(sessionId, product);
        } catch (error) {
            console.log('WLWebhook SetProduct : ' + error)
        }
    }

    async updateProduct(sessionId, product) {
        try {
            await this.Redis.updateProduct(sessionId, product);
        } catch (error) {
            console.log('WLWebhook UpdateProduct : ' + error)
        }
    }

    async deleteProduct(sessionId, product_id) {
        try {
            await this.Redis.deleteProduct(sessionId, product_id);
        } catch (error) {
            console.log('WLWebhook DeleteProduct : ' + error)
        }
    }

    async setLabel(sessionId, label) {
        try {
            await this.Redis.setLabel(sessionId, label);
        } catch (error) {
            console.log('WLWebhook setLabel : ' + error)
        }
    }

    async updateLabel(sessionId, label) {
        try {
            await this.Redis.updateLabel(sessionId, label);
        } catch (error) {
            console.log('WLWebhook updateLabel : ' + error)
        }
    }

    async deleteLabel(sessionId, label_id) {
        try {
            await this.Redis.deleteLabel(sessionId, label_id);
        } catch (error) {
            console.log('WLWebhook deleteLabel : ' + error)
        }
    }

    async setReply(sessionId, reply) {
        try {
            await this.Redis.setReply(sessionId, reply);
        } catch (error) {
            console.log('WLWebhook setReply : ' + error)
        }
    }

    async updateReply(sessionId, reply) {
        try {
            await this.Redis.updateReply(sessionId, reply);
        } catch (error) {
            console.log('WLWebhook updateReply : ' + error)
        }
    }

    async deleteReply(sessionId, reply_id) {
        try {
            await this.Redis.deleteReply(sessionId, reply_id);
        } catch (error) {
            console.log('WLWebhook deleteReply : ' + error)
        }
    }
}
