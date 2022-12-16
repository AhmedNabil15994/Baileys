import { WA_DEFAULT_EPHEMERAL,generateMessageID,delay,generateThumbnail } from "@adiwajshing/baileys";
import Helper from "../helper/Helper";
import WLContactInterface from "../interfaces/WLContactInterface";
import WLConversationInterface from "../interfaces/WLConversationInterface";
import { getSession } from "../whatsapp";
import WLRedis from "./WLRedis";
import axios from 'axios'

export default class Message extends Helper {

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
    // ToDo 
    // Add 
    // GroupMessage ,ReplyMessage, ForwardMessage ,TemplateMessage , PreviewMessage, 
    // ProductMessage, GroupInviteMessage, CatalogMessage, 
    //  to be sent while there's no connection 
    
    async fetchMessages(req, res) {
        try {
            let messages = await this.WLredis.getData(this.session_id,'messages');
            await messages.sort(function(a,b): any {
                return Number(b.time) > Number(a.time) ? -1 : 1
            });
            messages.reverse();
            // Start Pagination
            let page = req.query.page ?? 1;
            let page_size = req.query.page_size ?? 100;
            let paginatedMessage = await this.paginateData(messages,page,page_size)
            this.response(res, 200, true, 'Messages Found !!!', paginatedMessage)
        } catch {
            this.response(res, 500, false, 'Failed to load the message.')
        }
    }

    async findMessage(req, res) {
        try {
            const selected = await this.WLredis.getOne(this.session_id, req.body.messageId,'messages')
            if (!selected) {
                return this.response(res, 400, false, 'This message does not exist.')
            }
            this.response(res, 200, true, 'Message Found !!!', selected)
        } catch {
            this.response(res, 500, false, 'Failed to load the message.')
        }
    }

    async sendOFFMessage (req , res){
        const message = this.isString(req.body.message) ? JSON.parse(req.body.message) : req.body.message

        try {
            const target = message.key.remoteJid
            const exists = await this.onWhatsApp(this.session, target)
            if (!exists) {
                this.response(res, 400, false, 'This chat does not exist.')
            }

            const result = await this.session.sendOFFMessage(target,message.message,{},message.key.id)

            this.response(res, 200, true, 'The message has been successfully sent.', result)
            
        } catch (error){
            this.response(res, 500, false, 'Failed to send the message.',error)
        }
    }

    async send(req, res,type) {
        let messageKeyData = await this.getMessageKeyData(this.target,this.session_id);
        let messageData = await this.formatWAMsgToBeSend(req.body,type);
        let optionObj = {};
        let selected ;

        // For Reaction Messages
        if(type == 12 && req.body.messageId){
            let selected = await this.WLredis.getOne(this.session_id, req.body.messageId,'messages')
            if(selected && selected.hasOwnProperty('id') && messageData.message.hasOwnProperty('react')){
                messageData.message['react']['key'] = {
                    remoteJid: selected.remoteJid,
                    fromMe: selected.fromMe == "true",
                    id: selected.id,
                }
            }
        }

        try {
            if(this.session){
                try {
                    let checkWhatsApp = await this.onWhatsApp(this.session, this.target);
                    if (checkWhatsApp.length == 0) {
                        (process.env.DEBUG_MODE == 'true') ? console.log('Chat Not Exist target : ' + this.target) : '';
                        return this.response(res, 200, false, 'Chat Not Exist ')
                    }
                } catch (error) {
                    (process.env.DEBUG_MODE == 'true') ? console.log('Error check onWhatsApp send : Error : ' + error + ' & Target : ' + this.target) : '';
                }

                // For Disappearing Messages
                if(type == 10){
                    optionObj = {
                        ephemeralExpiration: req.body.expiration ? req.body.expiration : WA_DEFAULT_EPHEMERAL
                    }
                }

                // For Template Messages Or Preview Messages
                // if(type == 14){
                //     const result = await this.session.relayMessage(this.target, messageData.message, {})
                //     this.response(res, 200, true, 'The message has been successfully sent.', result)
                // }else{
                //     const result = await this.session.sendMessage(this.target, messageData.message, optionObj)
                //     this.response(res, 200, true, 'The message has been successfully sent.', result)
                // }
                const result = await this.session.sendMessage(this.target, messageData.message, optionObj)
                if(type == 20 && result && result.hasOwnProperty('key')){
                    let encKey = result.message.messageContextInfo.messageSecret.toString('base64');
                    setTimeout(async() =>{
                        const selected = await this.WLredis.getOne(this.session_id, result.key.id,'messages')
                        if (!selected) {
                            return this.response(res, 400, false, 'This message does not exist.')
                        }
                        selected['metadata.encKey'] = encKey
                        await this.WLredis.setOne(this.session_id, selected,'messages');
                    }, 3000)   
                }
                this.response(res, 200, true, 'The message has been successfully sent.', result)
            }else{
                messageKeyData.key['id'] = await generateMessageID(); 
                let msgObj = {
                    ...messageKeyData,
                    ...messageData
                }
                this.response(res, 200, true, 'The message has been added to your queue.', msgObj)
            }

        } catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Failed to send the message target : ' + this.target + ' Message : ' + messageData.message + ': ' + error) : '';
            this.response(res, 500, false, 'Failed to send the message : ' + error)
        }
    }

    /*********************************************************/
    async sendReply(req, res) {

        try {
            let checkWhatsApp = await this.onWhatsApp(this.session, this.target);
            if (checkWhatsApp.length == 0) {
                (process.env.DEBUG_MODE == 'true') ? console.log('Chat Not Exist target : ' + this.target) : '';
                return this.response(res, 200, false, 'Chat Not Exist ')
            }
        } catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Error check onWhatsApp sendReply: ' + error + ' & Target : ' + this.target) : '';
        }

        const messageId = req.body.messageId
        const message = req.body.body
        const type = req.body.type
        const url = req.body.url

        const selected = await this.WLredis.getOne(this.session_id, messageId,'messages')
        if (!selected) {
            return this.response(res, 400, false, 'This message does not exist.')
        }


        let dataObj = await this.restoreMessageFormat(selected);
        let replyObj = await this.formatMsgToBeSendAsReply(req.body, selected)
        let quotedObj = {
            quoted:dataObj
        };

        if(req.body.messageType == 10 ){
            let newObj={
                ephemeralExpiration: req.body.messageData.expiration ? req.body.messageData.expiration * 1000 : WA_DEFAULT_EPHEMERAL
            }
            quotedObj={
                ...quotedObj,
                ...newObj
            }
        }

        try {
            if(req.body.messageType == 17){

                let imageURL = process.env.IMAGE_URL + '/groupImage.jpeg';
                let responseFile = await axios.get(imageURL, {responseType: 'arraybuffer'})
                let thumb = await generateThumbnail(responseFile.data,'image',{});

                let groupCode = await this.session.groupInviteCode(this.formatGroup(req.body.messageData.groupId));
                let link = 'https://chat.whatsapp.com/'+ groupCode;
                let codeResponse = await this.session.groupGetInviteInfo(groupCode)
                let groupName = codeResponse.subject ;
                let groupInvitaionMessage = {
                    groupText: 'Follow this link to join my WhatsApp group: ' + link, 
                    matchedText: link,
                    title: groupName,
                    description: 'WhatsApp Group Invite',
                    inviteLinkGroupTypeV2: 0,
                    jpegThumbnail:  thumb.thumbnail,
                }
                const result = await this.session.sendMessage(this.target, groupInvitaionMessage, quotedObj)
                this.response(res, 200, true, 'The message has been successfully replied.', result)
            }else if(req.body.messageType == 18){
                let productObj = await this.WLredis.getOne(this.session_id, req.body.messageData.productId,'products');
                let productMessage = {
                    product:{
                        productId: req.body.messageData.productId, 
                        title: productObj.name, 
                        description: productObj.description, 
                        priceAmount1000: Number(productObj.price) * 1000,
                        currencyCode: productObj.currency,
                        productImage:{
                            url:productObj['imageUrls.original'],
                        },
                    },
                    businessOwnerJid: this.session.user.id.indexOf(':') > 0 ?  this.session.user.id.split(':')[0]+'@s.whatsapp.net' : this.session.user.id ,
                }
                const result = await this.session.sendMessage(this.target, productMessage, quotedObj)
                this.response(res, 200, true, 'The message has been successfully replied.', result)
            }else if(req.body.messageType == 19){
                let products =  await this.WLredis.getData(this.session_id,'products');
                let imageURL = products[0]['imageUrls.original'];

                let responseFile = await axios.get(imageURL, {responseType: 'arraybuffer'})
                let thumb = await generateThumbnail(responseFile.data,'image',{});

                let link = 'https://wa.me/c/'+ (this.session.user.id.indexOf(':') > 0 ?  this.session.user.id.split(':')[0] : this.session.user.id)

                let catalogMessage = {
                    catalogText: 'Follow this link to view our catalog on WhatsApp: ' + link, 
                    matchedText: link,
                    title: this.session.user.name,
                    canonicalUrl: '',
                    description: '',
                    inviteLinkGroupTypeV2: 0,
                    jpegThumbnail:  thumb.thumbnail,
                }
                console.log(catalogMessage)
                const result = await this.session.sendMessage(this.target, catalogMessage, quotedObj)
                this.response(res, 200, true, 'The message has been successfully replied.', result)
            }else{
                const result = await this.session.sendMessage(this.target, replyObj, quotedObj)
                this.response(res, 200, true, 'The message has been successfully replied.', result)
            }
        } catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Failed to send a reply on the given message : sendReply ' + error) : '';
            this.response(res, 500, false, 'Failed to send a reply on the given message.')
        }
    }

    async forwardMessage(req, res) {
        try {
            let checkWhatsApp = await this.onWhatsApp(this.session, this.target);
            if (checkWhatsApp.length == 0) {
                (process.env.DEBUG_MODE == 'true') ? console.log('Chat Not Exist target : ' + this.target) : '';
                return this.response(res, 200, false, 'Chat Not Exist ')
            }
        } catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Error check onWhatsApp forwardMessage: ' + error + ' & Target : ' + this.target) : '';
        }


        const messageId = req.body.messageId
        const selected = await this.WLredis.getOne(this.session_id, messageId,'messages')
        if (!selected) {
            return this.response(res, 400, false, 'This message does not exist.')
        }
        let dataObj = await this.restoreMessageFormat(selected);

        try {
            const result = await this.session.sendMessage(this.target, { forward: dataObj })
            this.response(res, 200, true, 'The message has been successfully forwarded.', result)
        } catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Failed to forward the message : forwardMessage ' + error) : '';
            this.response(res, 500, false, 'Failed to forward the message.')
        }
    }

    async sendOneFromGroup(phone,input,res,loop){
        try {
            let checkWhatsApp = await this.onWhatsApp(this.session, this.formatPhone(phone));
            if (checkWhatsApp.length == 0) {
                (process.env.DEBUG_MODE == 'true') ? console.log('Chat Not Exist target : ' + this.formatPhone(phone)) : '';
                return this.response(res, 200, false, 'Chat Not Exist ')
            }
        } catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Error check onWhatsApp sendGroupMessage: ' + error + ' & Target : ' + this.formatPhone(phone)) : '';
        }

        const type = input.messageType
        let replyObj,newObj;
        if(Array.isArray(input.messageData)){
            let newGroupObj = input.messageData[loop];
            replyObj = await this.formatMsgToBeSendAsReply({messageData: newGroupObj,messageType:type}, {})
        }else{
            replyObj = await this.formatMsgToBeSendAsReply(input, {})
        }

        if(input.messageType == 10 ){
            newObj={
                ephemeralExpiration: input.messageData.expiration ? input.messageData.expiration * 1000 : WA_DEFAULT_EPHEMERAL
            }
        }

        try {
            if(input.messageType == 17){
                let imageURL = process.env.IMAGE_URL + '/groupImage.jpeg';
                let responseFile = await axios.get(imageURL, {responseType: 'arraybuffer'})
                let thumb = await generateThumbnail(responseFile.data,'image',{});

                let groupCode = await this.session.groupInviteCode(this.formatGroup(input.messageData.groupId));
                let link = 'https://chat.whatsapp.com/'+ groupCode;
                let codeResponse = await this.session.groupGetInviteInfo(groupCode)
                let groupName = codeResponse.subject ;
                let groupInvitaionMessage = {
                    groupText: 'Follow this link to join my WhatsApp group: ' + link, 
                    matchedText: link,
                    title: groupName,
                    description: 'WhatsApp Group Invite',
                    inviteLinkGroupTypeV2: 0,
                    jpegThumbnail:  thumb.thumbnail,
                }
                const result = await this.session.sendMessage(this.formatPhone(phone), groupInvitaionMessage, {})
            }else if(input.messageType == 18){
                let productObj = await this.WLredis.getOne(this.session_id, input.messageData.productId,'products');
                let productMessage = {
                    product:{
                        productId: input.messageData.productId, 
                        title: productObj.name, 
                        description: productObj.description, 
                        priceAmount1000: Number(productObj.price) * 1000,
                        currencyCode: productObj.currency,
                        productImage:{
                            url:productObj['imageUrls.original'],
                        },
                    },
                    businessOwnerJid: this.session.user.id.indexOf(':') > 0 ?  this.session.user.id.split(':')[0]+'@s.whatsapp.net' : this.session.user.id ,
                }
                const result = await this.session.sendMessage(this.formatPhone(phone), productMessage, {})
            }else if(input.messageType == 19){
                let products =  await this.WLredis.getData(this.session_id,'products');
                let imageURL = products[0]['imageUrls.original'];

                let responseFile = await axios.get(imageURL, {responseType: 'arraybuffer'})
                let thumb = await generateThumbnail(responseFile.data,'image',{});

                let link = 'https://wa.me/c/'+ (this.session.user.id.indexOf(':') > 0 ?  this.session.user.id.split(':')[0] : this.session.user.id)

                let catalogMessage = {
                    catalogText: 'Follow this link to view our catalog on WhatsApp: ' + link, 
                    matchedText: link,
                    title: this.session.user.name,
                    canonicalUrl: '',
                    description: '',
                    inviteLinkGroupTypeV2: 0,
                    jpegThumbnail:  thumb.thumbnail,
                }
                const result = await this.session.sendMessage(this.formatPhone(phone), catalogMessage, {})
            }else{
                const result = await this.session.sendMessage(this.formatPhone(phone), replyObj, newObj)
            }
        } catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Failed to send a message : sendGroupMessage ' + error) : '';
        }
    }

    async sendGroupMessage(req, res) {
        let phones = this.isString(req.body.phones) ? JSON.parse(req.body.phones) : req.body.phones
        let intervalSeconds = req.body.interval  ? req.body.interval * 1000 : 3000;    
        let i = 0
  
        let interval = setInterval(async() =>{
            await this.sendOneFromGroup(phones[i],req.body,res,i);
            if (i++ >= phones.length - 1){
                clearInterval(interval);
            }
        }, intervalSeconds)
          
        this.response(res, 200, true, 'The messages are going to be send in '+intervalSeconds/1000+' seconds.', {})
    }
    /*********************************************************/
    async deleteMessage(req, res) {
        const messageKey = req.body.messageId
        const selected = await this.WLredis.getOne(this.session_id, messageKey,'messages')
        if (!selected) {
            return this.response(res, 400, false, 'This message does not exist.')
        }

        let msgKey = {
            remoteJid: selected.remoteJid,
            fromMe: selected.fromMe == "true",
            id: selected.id,
        };

        try {
            const obj = await this.session.sendMessage(selected.remoteJid, { delete: msgKey })
            this.response(res, 200, true, 'Message Deleted For All successfully !!!', obj)
        } catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Failed to delete the message : deleteMessage ' + error) : '';
            this.response(res, 500, false, 'Failed to delete message.')
        }
    }

    async deleteMessageForMe(req, res) {
        const messageKey = req.body.messageId
        const selected = await this.WLredis.getOne(this.session_id, messageKey,'messages')
        if (!selected) {
            return this.response(res, 400, false, 'This message does not exist.')
        }

        let msgKey = {
            remoteJid: selected.remoteJid,
            fromMe: selected.fromMe != "" ? Boolean(JSON.parse(selected.fromMe)) : false,
            id: selected.id,
        };

        try {
            let deleteObj = { 
                clear: { 
                    messages: [{ id: messageKey, fromMe: msgKey.fromMe, timestamp: Math.floor(Date.now() / 1000) }]
                } 
            }
            const status = await this.session.chatModify(deleteObj, selected.remoteJid, [])
            this.response(res, 200, true, 'Message Deleted For Me successfully !!!', {key:msgKey})
        } catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Failed to delete the message : deleteMessageForMe ' + error) : '';
            this.response(res, 500, false, 'Failed to delete message.')
        }
    }

    async starMessage(req, res) {
        const messageId = req.body.messageId
        const selected = await this.WLredis.getOne(this.session_id, messageId,'messages')
        if (!selected) {
            return this.response(res, 400, false, 'This message does not exist.')
        }

        try {
            const result = await this.session.chatModify({ starMessage:{messageId:messageId,starred:true} }, selected.remoteJid)
            this.response(res, 200, true, 'The message has been successfully starred.', result)
        } catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Failed to star the message : starMessage ' + error) : '';
            this.response(res, 500, false, 'Failed to star the message.')
        }
    }

    async unstarMessage(req, res) {
        const messageId = req.body.messageId
        const selected = await this.WLredis.getOne(this.session_id, messageId,'messages')
        if (!selected) {
            return this.response(res, 400, false, 'This message does not exist.')
        }

        try {
            const result = await this.session.chatModify({ starMessage:{messageId:messageId,starred:false} }, selected.remoteJid)
            this.response(res, 200, true, 'The message has been successfully unstarred.', result)
        } catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Failed to star the message : unstarMessage ' + error) : '';
            this.response(res, 500, false, 'Failed to star the message.')
        }
    }    

}