"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const needle_1 = __importDefault(require("needle"));
const dotenv = __importStar(require("dotenv"));
const Helper_1 = __importDefault(require("../helper/Helper"));
const WLRedis_1 = __importDefault(require("./WLRedis"));
class WLWebhook extends Helper_1.default {
    constructor() {
        super();
        dotenv.config();
        this.needle = needle_1.default;
        this.base_url = process.env.BACKEND_URL;
        this.Redis = new WLRedis_1.default();
    }
    async MessageUpsert(sessionId, message) {
        try {
            await this.Redis.setMessage(sessionId, message);
            await this.needle.post(this.base_url + '/webhooks/messages-webhook', {
                conversation: {
                    id: message.remoteJid,
                    lastTime: message.time,
                    lastMessage: message,
                },
                sessionId,
            }, (err, resp, body) => {
                (process.env.DEBUG_MODE == 'true') ? console.log('WLWebhook MessageUpsert : ' + body) : '';
            });
        }
        catch (error) {
            console.log('WLWebhook MessageUpsert : ' + error);
        }
    }
    async appLogOut(sessionId) {
        try {
            await this.needle.post(this.base_url + '/webhooks/messages-webhook', {
                connectionStatus: {
                    type: 'removed',
                },
                sessionId,
            }, (err, resp, body) => {
                (process.env.DEBUG_MODE == 'true') ? console.log('WLWebhook appLogOut : ' + body) : '';
            });
        }
        catch (error) {
            console.log('WLWebhook appLogOut : ' + error);
        }
    }
    async connectionConnected(sessionId) {
        try {
            await this.needle.post(this.base_url + '/webhooks/messages-webhook', {
                connectionStatus: {
                    type: 'connected',
                },
                sessionId,
            }, (err, resp, body) => {
                (process.env.DEBUG_MODE == 'true') ? console.log('WLWebhook connectionConnected : ' + body) : '';
            });
        }
        catch (error) {
            console.log('WLWebhook connectionConnected : ' + error);
        }
    }
    async MessageUpdates(sessionId, message) {
        try {
            message[0].key.remoteJid = this.fixRemoteJid(message[0].key.remoteJid);
            await this.needle.post(this.base_url + '/webhooks/messages-webhook', {
                messageStatus: {
                    id: message[0].key.id,
                    status: message[0].update.status,
                    statusText: this.formatStatusText(message[0].update.status),
                    fromMe: message[0].key.fromMe,
                    chatId: message[0].key.remoteJid,
                },
                sessionId,
            }, (err, resp, body) => {
                (process.env.DEBUG_MODE == 'true') ? console.log('WLWebhook MessageUpdates : ' + body) : '';
            });
            await this.Redis.updateMessage(sessionId, message);
        }
        catch (error) {
            console.log('WLWebhook MessageUpdates : ' + error);
        }
    }
    async ChatsUpdate(sessionId, message) {
        try {
            await this.needle.post(this.base_url + '/webhooks/messages-webhook', {
                conversationStatus: {
                    data: message,
                },
                sessionId,
            }, (err, resp, body) => {
                (process.env.DEBUG_MODE == 'true') ? console.log('WLWebhook ChatsUpdate : ' + body) : '';
            });
            this.Redis.updateChat(sessionId, message);
            // TODO: Send Updates To Redis
            // M[0]['image'] = await getSession(sessionId).profilePictureUrl(m[0].id, 'image')
            // await processRedisData(sessionId, "conversations", m[0])
            // if(('pin' in m[0]) || ('archive' in m[0])){
            //     await addDataToFile(sessionId,m[0],'chatUpdated')
            // }
        }
        catch (error) {
            console.log('WLWebhook ChatsUpdate : ' + error);
        }
    }
    async ChatsDelete(sessionId, m) {
        // await this.needle.post(
        //     this.base_url + '/webhooks/messages-webhook',
        //     {
        //         chatDeleted: {
        //             id: m[0].id,
        //         },
        //         sessionId,
        //     },
        //     (err, resp, body) => {
        //         console.log('connectionConnected : ' + body);
        //     }
        // )
        // TODO: Send Delete To Redis
        // await processRedisData(client, sessionId + "_conversations", {
        // 	id: m[0].id,
        // 	deleted_by: 1,
        // 	deleted_at: Math.floor(Date.now() / 1000)
        // })
        // hide undefined function
        // await addDataToFile(sessionId, m[0], 'chatDeleted')
    }
}
exports.default = WLWebhook;
