import Redis from 'ioredis';
import JSONCache from 'redis-json';
import Helper from '../helper/Helper';
import WLContactInterface from '../interfaces/WLContactInterface';
import WLConversationInterface from '../interfaces/WLConversationInterface';
import WLMessageInterface from '../interfaces/WLMessageInterface';
import WLProductInterface from '../interfaces/WLProductInterface';
import WLLabelInterface from '../interfaces/WLLabelInterface';
import WLReplyInterface from '../interfaces/WLReplyInterface';

export default class WLRedis extends Helper {
    private redis;
    constructor() {
        super();
        this.redis = new Redis({
            port: 6379, // Redis port
            host: "127.0.0.1", // Redis host
            // username: "default", // needs Redis >= 6
            // password: "my-top-secret",
            // db: 0, // Defaults to 0
        })
    }

    // instance = [
    //          contact,product,label,reply,chat,message
    //          (contacts,products,labels,replies,chats,messages)  => DB instances
    //]
    //
    //wlInterface = [WLContactInterface,WLProductInterface,WLLabelInterface,WLReplyInterface,WLConversationInterface,WLMessageInterface]
    
    // Determine Instance From DB
    getInstanceName(dbInstance,single=1){
        if(dbInstance == 'contacts'){
            return single ? 'contact' : dbInstance
        }else if(dbInstance == 'products'){
            return single ? 'product' : dbInstance
        }else if(dbInstance == 'labels'){
            return single ? 'label' : dbInstance
        }else if(dbInstance == 'replies'){
            return single ? 'reply' : dbInstance
        }else if(dbInstance == 'chats'){
            return single ? 'chat' : dbInstance
        }else if(dbInstance == 'messages'){
            return single ? 'message' : dbInstance
        } 
    }

    // Set One
    async setOne(session_id,data,dbInstance){
        try {
            let instance = this.getInstanceName(dbInstance,1);
            const jsonCache = new JSONCache<typeof instance>(this.redis, { prefix: `${session_id}:${dbInstance}:` });
            return jsonCache.set(data.id, data) ?? null;
        } catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log("WLRedis Set" + this.getInstanceName(dbInstance,1) + " " + error) : '';
        }   
    }

    // Get One
    async getOne(session_id,id,dbInstance) {
        try {
            let dataObj = await this.redis.hgetall(`${session_id}:${dbInstance}:${id}`);
            return dataObj ?? null;
        } catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log("WLRedis getOne of " + dbInstance + " " + error) : '';
        }
    }

    // Update One
    async updateOne(session_id,instanceData,dbInstance) {
        try {
            let dataObj = await this.getOne(session_id,instanceData.id,dbInstance)
            
            if(dbInstance == 'contacts' || dbInstance == 'contact'){
                 if(instanceData.hasOwnProperty('notify')){
                    dataObj['notify'] = instanceData.notify
                }
                if(instanceData.hasOwnProperty('image')){
                    dataObj['image'] = instanceData.image
                }
                if(instanceData.hasOwnProperty('name')){
                    dataObj['name'] = instanceData.name
                }
            }else if(dbInstance == 'messages' || dbInstance == 'message'){
                let statusInt = instanceData.hasOwnProperty('update') ?  instanceData.update.status :  instanceData.status
                let statusText = this.formatStatusText(statusInt)
                let message_id = instanceData.hasOwnProperty('key') ? instanceData.key.id : instanceData.id;
                let messageObj = await this.getOne(session_id,message_id,'messages');
                messageObj.status = statusInt;
                messageObj.statusText = statusText;
                instanceData = messageObj
            }else if(dbInstance == 'chats' || dbInstance == 'chat'){
                if(instanceData.hasOwnProperty('conversationTimestamp')){
                    dataObj['last_time'] = instanceData.conversationTimestamp
                }
                if(instanceData.hasOwnProperty('image')){
                    dataObj['image'] = instanceData.image
                }
                if(instanceData.hasOwnProperty('archive')){
                    dataObj['archived'] = instanceData.archive == true || instanceData.archive == "true"
                }
                if(instanceData.hasOwnProperty('pin')){
                    dataObj['pinned'] = instanceData.pin == null ? false : instanceData.pin
                }
                if(instanceData.hasOwnProperty('unreadCount')){
                    dataObj['unreadCount'] = Math.abs(instanceData.unreadCount)
                }
                if(instanceData.hasOwnProperty('mute')){
                    if(instanceData.mute == null){
                        dataObj['muted'] = false
                    }else{
                        dataObj['muted'] = true
                        dataObj['mutedUntil'] = new Date(instanceData.mute).toUTCString()
                    }
                }
            }            

            await this.setOne(session_id,dataObj,dbInstance)
            return dataObj ?? null;
        } catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log("WLRedis Update" + this.getInstanceName(dbInstance,1) + " " + error) : '';
        }   
    }

    // Delete One
    async deleteOne(session_id,id,dbInstance){
        try {
            let instance = this.getInstanceName(dbInstance,1);
            const jsonCache = new JSONCache<typeof instance>(this.redis, { prefix: `${session_id}:${dbInstance}:${id}` });
            return jsonCache.clearAll() ?? null;
        } catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log("WLRedis Delete" + this.getInstanceName(dbInstance,1) + " " + error) : '';
        }
    }

    // Set Data
    async setData(session_id,data,dbInstance,sock:any =null){
        try {
            let instance = this.getInstanceName(dbInstance,0);
            const jsonCache = new JSONCache<typeof instance[0]>(this.redis, { prefix: `${session_id}:${dbInstance}:` });

            if(dbInstance == 'messages'){
                if (data && data !== "undefined" && data !== null) {
                    data.forEach(async (element) => {
                        if(element.hasOwnProperty('message')){
                            const messageType = Object.keys(element.message)[0]
                            if (messageType != 'protocolMessage') {
                                element = await this.reformatMessageObj(session_id, element, messageType, sock);
                                await jsonCache.set(element.id, element)
                            }
                        }else{
                            await jsonCache.set(element.id, element)
                        }
                    });
                }
            }else{
                data.forEach(element => {
                    jsonCache.set(element.id, element)
                });
            }
            
            return jsonCache ? true : null;
        } catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log("WLRedis Set" + this.getInstanceName(dbInstance,0) + " " + error) : '';
        }
    }

    // Get Data
    async getData(session_id,dbInstance) {
        try {
            let dataArr: any[] = [];
            const keys = await this.getKeys(session_id, dbInstance);
            await Promise.all(Object.values(keys).map(async (element) => {
                dataArr.push(await this.redis.hgetall(element));
            }));
            return dataArr;
        } catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log("WLRedis Get" + dbInstance + " " + error) : '';
        }   
    }

    // Delete Data
    async deleteData(session_id,dbInstance) {
        try {
            const jsonCache = new JSONCache(this.redis, { prefix: `${session_id}:messages:` });
            return jsonCache.clearAll() ?? null;
        } catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log("WLRedis Delete" + dbInstance + " " + error) : '';
        }   
    }

    // get all  
    private async getKeys(session_id, key) {
        let returned_keys: string[] = [];
        try {
            let keys = await this.redis.keys(`${session_id}:${key}:*`);
            keys.forEach((element: string) => {
                if (!element.endsWith("_t")) {
                    returned_keys.push(element);
                }
            });
        } catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log("WLRedis getKeys" + error) : '';
        }
        return returned_keys;
    }

    async getLastMessageInChat(session_id, chatId, type=1) {
        let all_messages = await this.getData(session_id,'messages');
        let messages : any[] = [];
        if(all_messages){
            await Promise.all(Object.values(all_messages).map(async (element) => {
                if (element.remoteJid == chatId) {
                    messages.push(element)
                }
            }));

            await messages.sort(function(a,b): any {
                return Number(b.time) > Number(a.time) ? -1 : 1
            });
            messages.reverse()
         
            let message = messages[0];
            if(type == 2){
                return message
            }

            return {
                key: {
                    remoteJid: message.remoteJid,
                    fromMe: message.fromMe == 'true' ? true:false,
                    id: message.id,
                },
                messageTimestamp: Number(message.time),
            }
        }
    }

    async getLastMessagesInChat(session_id, chatId) {
        let all_messages = await this.getData(session_id,'messages');
        let messages : any[] = [];
        let time = 0;
        if(all_messages){
            await Promise.all(Object.values(all_messages).map(async (element) => {
                if (element.remoteJid == chatId) {
                    time = parseInt(element.time);
                    // message = element;
                    messages.push({
                        key: {
                            remoteJid: element.remoteJid,
                            fromMe: element.fromMe == 'true' ? true:false,
                            id: element.id,
                            participant: null,
                        },
                        messageTimestamp: time,
                    });
                }
            }));
            return messages
        }
    }

    async deleteSession(session_id) {
        const jsonCache = new JSONCache(this.redis, { prefix: `${session_id}:` });
        jsonCache.clearAll();
        (process.env.DEBUG_MODE == 'true') ? console.log('WLRedis deleteSession') : '';
    }
//---------------------------------------------------------------------------------------------------------------------//
    // Set One
    // async setContact(session_id, contact) {
    //     const jsonCache = new JSONCache<typeof contact>(this.redis, { prefix: `${session_id}:contacts:` });
    //     jsonCache.set(contact.id, contact);
    //     (process.env.DEBUG_MODE == 'true') ? console.log('WLRedis setContact') : '';
    // }

    // async setProduct(session_id, product) {
    //     const jsonCache = new JSONCache<typeof product>(this.redis, { prefix: `${session_id}:products:` });
    //     jsonCache.set(product.id, product);
    //     (process.env.DEBUG_MODE == 'true') ? console.log('WLRedis setProduct') : '';
    // }

    // async setLabel(session_id, label) {
    //     const jsonCache = new JSONCache<typeof label>(this.redis, { prefix: `${session_id}:labels:` });
    //     jsonCache.set(label.id, label);
    //     (process.env.DEBUG_MODE == 'true') ? console.log('WLRedis setLabel') : '';
    // }

    // async setReply(session_id, reply) {
    //     const jsonCache = new JSONCache<typeof reply>(this.redis, { prefix: `${session_id}:replies:` });
    //     jsonCache.set(reply.id, reply);
    //     (process.env.DEBUG_MODE == 'true') ? console.log('WLRedis setReply') : '';
    // }

    // async setChat(session_id, chat) {
    //     const jsonCache = new JSONCache<typeof chat>(this.redis, { prefix: `${session_id}:chats:` });
    //     jsonCache.set(chat.id, chat);
    //     (process.env.DEBUG_MODE == 'true') ? console.log('WLRedis setChat') : '';
    // }

    // async setMessage(session_id, message) {
    //     // this.setOne(session_id,message,'message','messages');
    //     const jsonCache = new JSONCache<typeof message>(this.redis, { prefix: `${session_id}:messages:` });
    //     jsonCache.set(message.id, message);
    //     (process.env.DEBUG_MODE == 'true') ? console.log('WLRedis setMessage') : '';
    // }

    // // Delete One
    // async deleteOneContact(session_id, contact) {
    //     const jsonCache = new JSONCache<typeof contact>(this.redis, { prefix: `${session_id}:contacts:${contact.id}` });
    //     jsonCache.clearAll();
    //     (process.env.DEBUG_MODE == 'true') ? console.log('WLRedis deleteContact') : '';
    // }

    // async deleteOneProduct(session_id, product_id) {
    //     const jsonCache = new JSONCache(this.redis, { prefix: `${session_id}:products:${product_id}` });
    //     jsonCache.clearAll();
    //     (process.env.DEBUG_MODE == 'true') ? console.log('WLRedis deleteProduct') : '';
    // }

    // async deleteOneLabel(session_id, label_id) {
    //     const jsonCache = new JSONCache(this.redis, { prefix: `${session_id}:labels:${label_id}` });
    //     jsonCache.clearAll();
    //     (process.env.DEBUG_MODE == 'true') ? console.log('WLRedis deleteOneLabel') : '';
    // }

    // async deleteOneReply(session_id, reply_id) {
    //     const jsonCache = new JSONCache(this.redis, { prefix: `${session_id}:replies:${reply_id}` });
    //     jsonCache.clearAll();
    //     (process.env.DEBUG_MODE == 'true') ? console.log('WLRedis deleteOneReply') : '';
    // }

    // async deleteOneChat(session_id, chat) {
    //     let chat_id = chat.id
    //     const jsonCache = new JSONCache<typeof chat>(this.redis, { prefix: `${session_id}:chats:${chat_id}` });
    //     jsonCache.clearAll();
    //     (process.env.DEBUG_MODE == 'true') ? console.log('WLRedis deleteChat') : '';
    // }

    // async deleteOneMessage(session_id, message) {
    //     const jsonCache = new JSONCache<typeof message>(this.redis, { prefix: `${session_id}:messages:` });
    //     jsonCache.clearAll();
    //     (process.env.DEBUG_MODE == 'true') ? console.log('WLRedis deleteMessage') : '';
    // }

    // async deleteMessages(session_id) {
    //     const jsonCache = new JSONCache(this.redis, { prefix: `${session_id}:messages:` });
    //     jsonCache.clearAll();
    //     (process.env.DEBUG_MODE == 'true') ? console.log('WLRedis deleteMessages') : '';
    // }

    // // Set Array
    // async setContacts(session_id, contacts) {
    //     const jsonCache = new JSONCache<typeof contacts[0]>(this.redis, { prefix: `${session_id}:contacts:` });
    //     contacts.forEach(element => {
    //         jsonCache.set(element.id, element)
    //     });
    //     (process.env.DEBUG_MODE == 'true') ? console.log('WLRedis setContacts') : '';
    // }

    // async setProducts(session_id, products) {
    //     const jsonCache = new JSONCache<typeof products[0]>(this.redis, { prefix: `${session_id}:products:` });
    //     products.forEach(element => {
    //         jsonCache.set(element.id, element)
    //     });
    //     (process.env.DEBUG_MODE == 'true') ? console.log('WLRedis setProducts') : '';
    // }

    // async setLabels(session_id, labels) {
    //     const jsonCache = new JSONCache<typeof labels[0]>(this.redis, { prefix: `${session_id}:labels:` });
    //     labels.forEach(element => {
    //         jsonCache.set(element.id, element)
    //     });
    //     (process.env.DEBUG_MODE == 'true') ? console.log('WLRedis setLabels') : '';
    // }

    // async setReplies(session_id, replies) {
    //     const jsonCache = new JSONCache<typeof replies[0]>(this.redis, { prefix: `${session_id}:replies:` });
    //     replies.forEach(element => {
    //         jsonCache.set(element.id, element)
    //     });
    //     (process.env.DEBUG_MODE == 'true') ? console.log('WLRedis setReplies') : '';
    // }

    // async setChats(session_id, chats) {
    //     const jsonCache = new JSONCache<typeof chats[0]>(this.redis, { prefix: `${session_id}:chats:` });
    //     chats.forEach(element => {
    //         jsonCache.set(element.id, element)
    //     });
    //     (process.env.DEBUG_MODE == 'true') ? console.log('WLRedis setChats') : '';
    // }

    // async setMessages(session_id, messages, sock) {
    //     const jsonCache = new JSONCache<typeof messages[0]>(this.redis, { prefix: `${session_id}:messages:` });
    //     try {
    //         if (messages && messages !== "undefined" && messages !== null) {
    //             messages.forEach(async (element) => {
    //                 if(element.hasOwnProperty('message')){//if (element.message && element.message !== "undefined" && element.message !== null) {
    //                     const messageType = Object.keys(element.message)[0] // Get what type of message it is -- text, image, video
    //                     if (messageType != 'protocolMessage') {
    //                         element = await this.reformatMessageObj(session_id, element, messageType, sock);
    //                         await jsonCache.set(element.id, element)
    //                     }
    //                 }else{
    //                     await jsonCache.set(element.id, element)
    //                 }
    //             });
    //         }
    //     } catch (error) {
    //         console.log(error);
    //     }

    //     (process.env.DEBUG_MODE == 'true') ? console.log('WLRedis setMessages') : '';
    // }

    



    // async getContacts(session_id) {
    //     let contacts: WLContactInterface[] = [];
    //     try {
    //         const keys = await this.getKeys(session_id, 'contacts');
    //         await Promise.all(Object.values(keys).map(async (element) => {
    //             contacts.push(await this.redis.hgetall(element));
    //         }));
    //         (process.env.DEBUG_MODE == 'true') ? console.log('WLRedis getContacts') : '';
    //     } catch (error) {
    //         (process.env.DEBUG_MODE == 'true') ? console.log("WLRedis getContacts" + error) : '';
    //     }
    //     return contacts;
    // }

    // async getProducts(session_id) {
    //     let products: WLProductInterface[] = [];
    //     try {
    //         const keys = await this.getKeys(session_id, 'products');
    //         await Promise.all(Object.values(keys).map(async (element) => {
    //             products.push(await this.redis.hgetall(element));
    //         }));
    //         (process.env.DEBUG_MODE == 'true') ? console.log('WLRedis getProducts') : '';
    //     } catch (error) {
    //         (process.env.DEBUG_MODE == 'true') ? console.log("WLRedis getProducts" + error) : '';
    //     }
    //     return products;
    // }

    // async getLabels(session_id) {
    //     let labels: WLLabelInterface[] = [];
    //     try {
    //         const keys = await this.getKeys(session_id, 'labels');
    //         await Promise.all(Object.values(keys).map(async (element) => {
    //             labels.push(await this.redis.hgetall(element));
    //         }));
    //         (process.env.DEBUG_MODE == 'true') ? console.log('WLRedis getLabels') : '';
    //     } catch (error) {
    //         (process.env.DEBUG_MODE == 'true') ? console.log("WLRedis getLabels" + error) : '';
    //     }
    //     return labels;
    // }

    // async getReplies(session_id) {
    //     let replies: WLReplyInterface[] = [];
    //     try {
    //         const keys = await this.getKeys(session_id, 'replies');
    //         await Promise.all(Object.values(keys).map(async (element) => {
    //             replies.push(await this.redis.hgetall(element));
    //         }));
    //         (process.env.DEBUG_MODE == 'true') ? console.log('WLRedis getReplies') : '';
    //     } catch (error) {
    //         (process.env.DEBUG_MODE == 'true') ? console.log("WLRedis getReplies" + error) : '';
    //     }
    //     return replies;
    // }

    // async getMessages(session_id) {
    //     let messages: WLMessageInterface[] = [];
    //     try {
    //         const keys = await this.getKeys(session_id, 'messages');
    //         await Promise.all(Object.values(keys).map(async (element) => {
    //             messages.push(await this.redis.hgetall(element));
    //         }));
    //         (process.env.DEBUG_MODE == 'true') ? console.log('WLRedis getMessages') : '';
    //     } catch (error) {
    //         (process.env.DEBUG_MODE == 'true') ? console.log("WLRedis getMessages" + error) : '';
    //     }
    //     return messages;
    // }

    // async getChats(session_id) {
    //     let chats: WLConversationInterface[] = [];
    //     try {
    //         const keys = await this.getKeys(session_id, 'chats');
    //         await Promise.all(Object.values(keys).map(async (element) => {
    //             chats.push(await this.redis.hgetall(element));
    //         }));
    //         (process.env.DEBUG_MODE == 'true') ? console.log('WLRedis getChats') : '';
    //     } catch (error) {
    //         (process.env.DEBUG_MODE == 'true') ? console.log("WLRedis getChats" + error) : '';
    //     }
    //     return chats;
    // }

    // // get one
    // async getContact(session_id, message_id) {
    //     try {
    //         let contact = await this.redis.hgetall(`${session_id}:contacts:${message_id}`);
    //         (process.env.DEBUG_MODE == 'true') ? console.log('WLRedis getContact') : '';
    //         return contact;
    //     } catch (error) {
    //         (process.env.DEBUG_MODE == 'true') ? console.log("WLRedis getContact" + error) : '';
    //     }
    // }

    // async getProduct(session_id, product_id) {
    //     try {
    //         let product = await this.redis.hgetall(`${session_id}:products:${product_id}`);
    //         (process.env.DEBUG_MODE == 'true') ? console.log('WLRedis getProduct') : '';
    //         return product;
    //     } catch (error) {
    //         (process.env.DEBUG_MODE == 'true') ? console.log("WLRedis getProduct" + error) : '';
    //     }
    // }

    // async getLabel(session_id, label_id) {
    //     try {
    //         let label = await this.redis.hgetall(`${session_id}:labels:${label_id}`);
    //         (process.env.DEBUG_MODE == 'true') ? console.log('WLRedis getLabel') : '';
    //         return label;
    //     } catch (error) {
    //         (process.env.DEBUG_MODE == 'true') ? console.log("WLRedis getLabel" + error) : '';
    //     }
    // }

    // async getReply(session_id, reply_id) {
    //     try {
    //         let reply = await this.redis.hgetall(`${session_id}:replies:${reply_id}`);
    //         (process.env.DEBUG_MODE == 'true') ? console.log('WLRedis getReply') : '';
    //         return reply;
    //     } catch (error) {
    //         (process.env.DEBUG_MODE == 'true') ? console.log("WLRedis getReply" + error) : '';
    //     }
    // }

    // async getMessage(session_id, message_id) {
    //     try {
    //         let message = await this.redis.hgetall(`${session_id}:messages:${message_id}`);
    //         (process.env.DEBUG_MODE == 'true') ? console.log('WLRedis getMessage') : '';
    //         return message;
    //     } catch (error) {
    //         (process.env.DEBUG_MODE == 'true') ? console.log("WLRedis getMessage" + error) : '';
    //     }
    // }

    // async getChat(session_id, chat_id) {
    //     try {
    //         let chat = await this.redis.hgetall(`${session_id}:chats:${chat_id}`);
    //         (process.env.DEBUG_MODE == 'true') ? console.log('WLRedis getChat') : '';
    //         return chat;
    //     } catch (error) {
    //         (process.env.DEBUG_MODE == 'true') ? console.log("WLRedis getChat" + error) : '';
    //     }
    // }

    

    // // Update One
    // async updateContact(session_id, contact) {
    //     let contact_id = contact.id;
    //     try {
    //         let contactObj = await this.redis.hgetall(`${session_id}:contacts:${contact_id}`);
    //         (process.env.DEBUG_MODE == 'true') ? console.log('WLRedis updateContact') : '';

    //         if(contact.hasOwnProperty('notify')){
    //             contactObj['notify'] = contact.notify
    //         }

    //         if(contact.hasOwnProperty('image')){
    //             contactObj['image'] = contact.image
    //         }

    //         if(contact.hasOwnProperty('name')){
    //             contactObj['name'] = contact.name
    //         }

    //         this.setContact(session_id,contactObj)
    //         return contactObj;
    //     } catch (error) {
    //         (process.env.DEBUG_MODE == 'true') ? console.log("WLRedis updateContact" + error) : '';
    //     }
    // }

    // async updateProduct(session_id, product) {
    //     let product_id = product.id;
    //     try {
    //         let productObj = await this.redis.hgetall(`${session_id}:products:${product_id}`);
    //         (process.env.DEBUG_MODE == 'true') ? console.log('WLRedis updateProduct') : '';

    //         this.setProduct(session_id,productObj)
    //         return productObj;
    //     } catch (error) {
    //         (process.env.DEBUG_MODE == 'true') ? console.log("WLRedis updateProduct" + error) : '';
    //     }
    // }

    // async updateLabel(session_id, label) {
    //     let label_id = label.id;
    //     try {
    //         let labelsObj = await this.redis.hgetall(`${session_id}:labels:${label_id}`);
    //         (process.env.DEBUG_MODE == 'true') ? console.log('WLRedis updateLabel') : '';

    //         this.setLabel(session_id,labelsObj)
    //         return labelsObj;
    //     } catch (error) {
    //         (process.env.DEBUG_MODE == 'true') ? console.log("WLRedis updateLabel" + error) : '';
    //     }
    // }

    // async updateReply(session_id, reply) {
    //     let reply_id = reply.id;
    //     try {
    //         let ReplyObj = await this.redis.hgetall(`${session_id}:replies:${reply_id}`);
    //         (process.env.DEBUG_MODE == 'true') ? console.log('WLRedis updateReply') : '';

    //         this.setReply(session_id,ReplyObj)
    //         return ReplyObj;
    //     } catch (error) {
    //         (process.env.DEBUG_MODE == 'true') ? console.log("WLRedis updateReply" + error) : '';
    //     }
    // }

    // async updateMessage(session_id, message) {
    //     let statusInt = message.hasOwnProperty('update') ?  message.update.status :  message.status
    //     let statusText = this.formatStatusText(statusInt)
    //     let message_id = message.hasOwnProperty('key') ? message.key.id : message.id;
    //     try {
    //         let messageObj = await this.redis.hgetall(`${session_id}:messages:${message_id}`);
    //         (process.env.DEBUG_MODE == 'true') ? console.log('WLRedis updateMessage') : '';
    //         messageObj.status = statusInt
    //         messageObj.statusText = statusText
    //         this.setMessage(session_id,messageObj)
    //         return messageObj;
    //     } catch (error) {
    //         (process.env.DEBUG_MODE == 'true') ? console.log("WLRedis updateMessage" + error) : '';
    //     }
    // }

    // async updateChat(session_id, chat) {
    //     let chat_id = chat.id;        
    //     try {
    //         let chatObj = await this.redis.hgetall(`${session_id}:chats:${chat_id}`);
    //         (process.env.DEBUG_MODE == 'true') ? console.log('WLRedis updateChat') : '';

    //         if(chat.hasOwnProperty('conversationTimestamp')){
    //             chatObj['last_time'] = chat.conversationTimestamp
    //         }
    //         if(chat.hasOwnProperty('image')){
    //             chatObj['image'] = chat.image
    //         }
    //         if(chat.hasOwnProperty('archive')){
    //             chatObj['archived'] = chat.archive == true || chat.archive == "true"
    //         }
    //         if(chat.hasOwnProperty('pin')){
    //             chatObj['pinned'] = chat.pin == null ? false : chat.pin
    //         }
    //         if(chat.hasOwnProperty('unreadCount')){
    //             chatObj['unreadCount'] = Math.abs(chat.unreadCount)
    //         }
    //         if(chat.hasOwnProperty('mute')){
    //             if(chat.mute == null){
    //                 chatObj['muted'] = false
    //             }else{
    //                 chatObj['muted'] = true
    //                 chatObj['mutedUntil'] = new Date(chat.mute).toUTCString()
    //             }
    //         }

    //         this.setChat(session_id,chatObj)
    //         return chatObj;
    //     } catch (error) {
    //         (process.env.DEBUG_MODE == 'true') ? console.log("WLRedis updateChat" + error) : '';
    //     }
    // }

    // // Delete One
    // async deleteChat(session_id, chat) {
    //     let chat_id = chat;        
    //     try {
    //         let chatObj = await this.redis.hgetall(`${session_id}:chats:${chat_id}`);
    //         (process.env.DEBUG_MODE == 'true') ? console.log('WLRedis deleteChat') : '';
    //         if(chatObj){
    //             return this.deleteOneChat(session_id,chatObj);
    //         }
    //         return 1;
    //     } catch (error) {
    //         (process.env.DEBUG_MODE == 'true') ? console.log("WLRedis deleteChat" + error) : '';
    //     }
    // }

    // async deleteProduct(session_id, product_id) {
    //     try {
    //         let productObj = await this.redis.hgetall(`${session_id}:products:${product_id}`);
    //         (process.env.DEBUG_MODE == 'true') ? console.log('WLRedis deleteProduct') : '';
    //         if(productObj){
    //             return this.deleteOneProduct(session_id,product_id);
    //         }
    //         return 1;
    //     } catch (error) {
    //         (process.env.DEBUG_MODE == 'true') ? console.log("WLRedis deleteProduct" + error) : '';
    //     }
    // }

    // async deleteLabel(session_id, label_id) {
    //     try {
    //         let labelObj = await this.redis.hgetall(`${session_id}:labels:${label_id}`);
    //         (process.env.DEBUG_MODE == 'true') ? console.log('WLRedis deleteLabel') : '';
    //         if(labelObj){
    //             return this.deleteOneLabel(session_id,label_id);
    //         }
    //         return 1;
    //     } catch (error) {
    //         (process.env.DEBUG_MODE == 'true') ? console.log("WLRedis deleteLabel" + error) : '';
    //     }
    // }

    // async deleteReply(session_id, reply_id) {
    //     try {
    //         let ReplyObj = await this.redis.hgetall(`${session_id}:replies:${reply_id}`);
    //         (process.env.DEBUG_MODE == 'true') ? console.log('WLRedis deleteReply') : '';
    //         if(ReplyObj){
    //             return this.deleteOneReply(session_id,reply_id);
    //         }
    //         return 1;
    //     } catch (error) {
    //         (process.env.DEBUG_MODE == 'true') ? console.log("WLRedis deleteReply" + error) : '';
    //     }
    // }
}
