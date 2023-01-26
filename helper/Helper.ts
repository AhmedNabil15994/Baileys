import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { parse } from 'url'
import { lookup } from 'mime-types'
import { delay, downloadMediaMessage, getDevice, MediaType } from '@adiwajshing/baileys';
import { writeFile } from 'fs/promises';
import mime from 'mime-types'
import pino from 'pino';
import console from 'console';
import WLRedis from "./../Models/WLRedis";

export default class Helper {

    response(res, statusCode = 200, success = false, message = '', data = {}) {
        res.status(statusCode)
        res.json({
            success,
            message,
            data,
        })
        res.end()
    }

    isSessionExists(sessionId) {
        const sessionFile = 'md_' + sessionId
        return (existsSync(this.sessionsDir(sessionFile)) && existsSync(this.sessionsDir(sessionFile) + "/creds.json")) ? 1 : 0;
    }

    sessionsDir(sessionId = '') {
        return join('sessions', sessionId ? (sessionId.startsWith('md_') ? sessionId : sessionId + '.json') : '')
    }

    formatPhone = (phone) => {
        if (phone.endsWith('@s.whatsapp.net')) {
            return phone
        }

        let formatted = phone.replace(/\D/g, '')
        return (formatted += '@s.whatsapp.net')
    }

    isString(value) {
        return typeof value === 'string' || value instanceof String;
    }

    sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }

    async sleeps(delay) {
        var start = new Date().getTime();
        while (new Date().getTime() < start + delay);
    }

    async delays(ms) {
        await new Promise(resolve => setTimeout(()=>resolve, ms)).then(()=>console.log("fired"));
    }

    fixRemoteJid(remoteJid) {
        let name = remoteJid.split(':');
        if (remoteJid.indexOf(':') > 0) {
            if (remoteJid.endsWith('@s.whatsapp.net')) {
                remoteJid = name[0] + '@s.whatsapp.net';
            }
            if (remoteJid.endsWith('@g.us')) {
                remoteJid = name[0] + '@g.us';
            }
        }
        return remoteJid;
    }

    formatGroup = (group) => {
        if (group.endsWith('@g.us')) {
            return group
        }

        let formatted = group.replace(/[^\d-]/g, '')
        return (formatted += '@g.us')
    }

    async onWhatsApp(session, id) {
        if (id.startsWith('0')) {
            return '' // eslint-disable-line prefer-promise-reject-errors
        }
        try {
            let check = await session.onWhatsApp(id);
            return check[0] && check[0].hasOwnProperty('exists') ? check : false;
        } catch {
            return Promise.reject(null) // eslint-disable-line prefer-promise-reject-errors
        }
    }
 
    isExists(session, jid, isGroup = false) {
        return true;
        // try {
        // 	let result;
        // 	if (isGroup) {
        // 		result = await session.groupMetadata(jid);
        // 		return Boolean(result.id);
        // 	}
        // 	console.log(await session.onWhatsApp(jid));
        // 	[result] = await session.onWhatsApp(jid);
        // 	return result.exists;
        // } catch {
        // 	return false;
        // }
    }

    async isBusiness(session, id) {
        let exists = await session.onWhatsApp(id)
        if(exists){
            let isBusiness = await session.getBusinessProfile(id)
            if(isBusiness){
                return true;
            }else{
                return false;
            }
        }
        return false;
    }

    mimeType(url) {
        const pathObj = parse(url, true)
        const mimeType = lookup(pathObj.pathname)

        return mimeType
    }

    fileName(url) {
        const pathObj = parse(url, true)
        const fileName = pathObj.pathname?.split('/').pop();
        return fileName
    }

    reformatPhone(phone, checkGroup = null) {
        if (phone.endsWith('@s.whatsapp.net')) {
            return phone.replace('@s.whatsapp.net', '')
        }

        if (checkGroup) {
            return this.reformatPhone(checkGroup)
        }

        return phone
    }

    formatStatusText(status) {
        let text = ''
        if (status == 1) {
            text = 'Pending'
        } else if (status == 2) {
            text = 'Sent'
        } else if (status == 3 || status == 'DELIVERED' || status == 'DELIVERY_ACK') {
            text = 'Delivered'
        } else if (status == 4 || status == 'READ') {
            text = 'Viewed'
        }else if (status == 6) {
            text = 'Deleted'
        }
        return text
    }

    formatButtons = (buttons) => {
        return buttons.map((btn) => {
            return {
                buttonId: 'id' + btn.id,
                buttonText: {
                    displayText: btn.title,
                },
                type: 1,
            }
        })
    }

    reformatOptions = (options) => {
        return options.map((option) => {
            return {
                optionName: option,
            }
        })
    }

    formatButtonsResponse(buttons) {
        return buttons.map((btn) => {
            if(btn.hasOwnProperty('buttonText') && btn.buttonText.hasOwnProperty('displayText')){
                return {
                    id: btn.buttonId,
                    title: btn.buttonText.displayText,
                    type: 1,
                }
            }else{
                return {}
            }
            
        })
    }

    formatOptionsResponse(options) {
        return options.map((option) => {
            if(option.hasOwnProperty('optionName')){
                return option.optionName
            }else{
                return '';
            }
        })
    }

    formatTemplateButtonsResponse(buttons) {
        return buttons.map((btn) => {
            const button = {
                index: btn.index,
            }

            if (Object.keys(btn)[1] === 'urlButton' || Object.keys(btn)[0] === 'urlButton') {
                button['urlButton'] = {
                    title: btn.urlButton.displayText,
                    url: btn.urlButton.url,
                }
            } else if (Object.keys(btn)[1] === 'callButton' || Object.keys(btn)[0] === 'callButton') {
                button['callButton'] = {
                    title: btn.callButton.displayText,
                    phone: btn.callButton.phoneNumber,
                }
            } else if (Object.keys(btn)[1] === 'quickReplyButton' || Object.keys(btn)[0] === 'quickReplyButton') {
                button['normalButton'] = {
                    title: btn.quickReplyButton.displayText,
                    id: btn.quickReplyButton.id,
                }
            }

            return button
        })
    }

    formatSectionsResponse(sections) {
        return sections.map((section) => {
            return {
                title: section.title,
                rows: section.rows.map((row) => {
                    return {
                        id: row.rowId,
                        title: row.title,
                        description: row.description,
                    }
                }),
            }
        })
    }

    formatTemplateButtons(buttons) {
        return buttons.map((btn) => {
            const button = {
                index: btn.id,
            }

            if (btn.type === 1) {
                button['urlButton'] = {
                    displayText: btn.title,
                    url: btn.extra_data,
                }
            } else if (btn.type === 2) {
                button['callButton'] = {
                    displayText: btn.title,
                    phoneNumber: btn.extra_data,
                }
            } else if (btn.type === 3) {
                button['quickReplyButton'] = {
                    displayText: btn.title,
                    id: btn.extra_data,
                }
            }

            return button
        })
    }

    getMessageStatus(msgObj){
        let status = 2;
        if (msgObj.hasOwnProperty(status)) {
            if (msgObj.status == 'READ') {
                status = 4
            } else {
                status = 3
            }
        } else if (msgObj.message.hasOwnProperty(status)) {
            status = msgObj.message.status
        }
        return status;
    }

    getMessageTime(msgObj){
        let time = msgObj.messageTimestamp
        if (msgObj.messageTimestamp && msgObj.messageTimestamp.low) {
            time = msgObj.messageTimestamp.low
        } else if (msgObj.messageTimestamp && msgObj.messageTimestamp.low === undefined) {
            time = msgObj.messageTimestamp
        } else if (msgObj.time !== undefined && msgObj.time.low !== undefined) {
            time = msgObj.time.low
        } else if (
            msgObj.body.contextInfo !== undefined &&
            msgObj.body.contextInfo.ephemeralSettingTimestamp !== undefined &&
            msgObj.body.contextInfo.ephemeralSettingTimestamp.low !== undefined
        ) {
            time = msgObj.body.contextInfo.ephemeralSettingTimestamp.low
        }
        return time;
    }

    async getMessageInfo(msgObj,messageType,time,newSessionId,sock){
        let fixedType = '';
        let dataObj ={
            messageType: this.getMessageTypeText(msgObj,messageType),
            metadata:{}
        };

        const mediaMsgsType = ['imageMessage', 'documentMessage', 'videoMessage', 'audioMessage', 'stickerMessage']
        if (mediaMsgsType.includes(messageType)) {
            let mediaDataObj = await this.getMediaMessageInfo(msgObj,messageType,time,newSessionId,sock)
            return {
                ...dataObj,
                ...mediaDataObj,
            }
        }

        let detailsObj = await this.getMessageTypeDetails(msgObj,messageType,time,newSessionId,sock);
        return {
            ...dataObj,
            ...detailsObj,
        }
    }

    async getMediaMessageInfo(msg,messageType,time,newSessionId,sock){
        let dataObj = {
            mimetype:'',
            metadata:{}
        }
        
        let MediaType: MediaType;
        MediaType = this.getMessageTypeText(msg,messageType)

        let fileName =  msg.message[messageType].fileName ? msg.message[messageType].fileName : ''
        let caption = msg.message[messageType].caption ? msg.message[messageType].caption  : ''
        let msgObj = msg.message[messageType];

        // Begin Working with File
        if (!existsSync(process.env.UPLOAD_PATH + '/messages/' + newSessionId + '/')) {
            mkdirSync(process.env.UPLOAD_PATH + '/messages/' + newSessionId + '/')
        }

        const extension = mime.extension(msgObj.mimetype)
        const path = process.env.UPLOAD_PATH + '/messages/' + newSessionId + '/' + msg.key.id + '.' + extension

        if (messageType !== 'documentMessage') {
            fileName = msg.key.id + '.' + extension;
        }

        if (messageType == 'audioMessage' || messageType == 'videoMessage' ) {
            dataObj.metadata['seconds'] = msg.message[messageType].seconds;
        }

        if (messageType == 'videoMessage' && msg.message[messageType].hasOwnProperty('gifPlayback') ) {
            dataObj.metadata['gifPlayback'] = msg.message[messageType].gifPlayback;
        }

        if (messageType == 'stickerMessage') {
            dataObj.metadata['isAnimated'] = msg.message[messageType].isAnimated;
        }

        let mediaTypeText = (extension == 'gif' ||( msg.message[messageType].hasOwnProperty('gifPlayback') && msg.message[messageType].gifPlayback == true ) ) ? 'gif' : MediaType;

        if (msg.message[messageType].hasOwnProperty('contextInfo') && msg.message[messageType].contextInfo.hasOwnProperty('quotedMessage')) {
            let quotedMessageType = Object.keys( msg.message[messageType].contextInfo.quotedMessage)[0];
            let newMsgObj = {
                key: {
                    remoteJid:  msg.message[messageType].contextInfo.participant,
                    fromMe: msg.message[messageType].contextInfo.quotedMessage.hasOwnProperty('fromMe') ?  msg.message[messageType].contextInfo.quotedMessage.fromMe : false ,
                    id:  msg.message[messageType].contextInfo.stanzaId
                },
                message: msg.message[messageType].contextInfo.quotedMessage,
            }
            dataObj.metadata['quotedMessageId']  = msg.message[messageType].contextInfo.stanzaId
            dataObj.metadata['remoteJid']  = msg.message[messageType].contextInfo.participant
            dataObj.metadata['quotedMessage']  = await this.getMessageInfo(newMsgObj,quotedMessageType,time,newSessionId,sock)            
            dataObj.metadata['type'] = 'reply'
        }

        if (msg.message[messageType].hasOwnProperty('contextInfo') && msg.message[messageType].contextInfo.hasOwnProperty('isForwarded') && msg.message[messageType].contextInfo.isForwarded == true) {
            dataObj.metadata['type'] = 'forward'
            dataObj.metadata['isForwarded'] = msg.message[messageType].contextInfo.isForwarded;
            dataObj.metadata['forwardingScore'] = msg.message[messageType].contextInfo.forwardingScore;
        }

        await this.downloadMessageFile(msg,path,sock);
        return {
            body: process.env.IMAGE_URL + '/messages/' + newSessionId + '/' + msg.key.id + '.' + extension,
            fileName: fileName,
            messageType: mediaTypeText,
            caption: caption,
            metadata: dataObj.metadata
        }
    }

    async downloadMessageFile(msg,path,sock){
        if (!existsSync(path)) {
            // Download stream
            try {
                let logger = pino({ level: 'error' }, pino.destination("./download-media.log"));
                const buffer = await downloadMediaMessage(msg, 'stream', {},
                    {
                        logger,
                        reuploadRequest: sock.updateMediaMessage
                    });
                // Save to file
                return await writeFile(path, buffer)
            } catch (error) {
                (process.env.DEBUG_MODE == 'true') ? console.log("Download Media : " + error) : '';
            }
        }
    }

    getMessageTypeText(msgObj,messageType){
        let text;
        if (messageType == 'conversation') {
            text = 'text'
        }else if(messageType == 'extendedTextMessage'){
            if (
                msgObj.message.extendedTextMessage.contextInfo &&
                msgObj.message.extendedTextMessage.contextInfo.mentionedJid &&
                msgObj.message.extendedTextMessage.contextInfo.mentionedJid.length > 0
            ) {
                text = 'mentionMessage'
            }else if (
                msgObj.message.extendedTextMessage.contextInfo && 
                msgObj.message.extendedTextMessage.contextInfo.quotedMessage
            ) {
                text = 'text'
            }else if(
                msgObj.message.extendedTextMessage.contextInfo != null &&
                msgObj.message.extendedTextMessage.contextInfo.hasOwnProperty('isForwarded') &&
                msgObj.message.extendedTextMessage.contextInfo.isForwarded >= 0
            ){
                text = 'text'
            }else if(
                msgObj.message.extendedTextMessage.matchedText.includes('https://chat.whatsapp.com')
                // Also don't have canonicalUrl
            ){
                text = 'groupInvitationMessage'
            }else if(
                msgObj.message.extendedTextMessage.matchedText.includes('https://wa.me/c')
                //  don't have previewType
            ){
                text = 'catalogMessage'
            }else if(
                !msgObj.message.extendedTextMessage.matchedText.includes('https://chat.whatsapp.com') &&
                !msgObj.message.extendedTextMessage.matchedText.includes('https://wa.me/c')
            ){
                text = 'linkWithPreview'
            }else{
                text = 'text'
            }
        }else if(messageType == 'ephemeralMessage'){
            text = 'disappearingMessage'
        }else if (messageType == 'locationMessage') {
            text = 'locationMessage'
        }else if (messageType == 'contactMessage') {
            text = 'contactMessage'
        }else if (messageType == 'reactionMessage') {
           text = 'reactionMessage'
        }else if (messageType === 'imageMessage') {
            text = 'image'
        } else if (messageType === 'documentMessage') {
            text = 'document'
        } else if (messageType === 'videoMessage') {
            text = 'video'
        } else if (messageType === 'gif' || messageType === 'gifMessage') {
            text = 'gif'
        } else if (messageType === 'audioMessage') {
            text = 'audio'
        } else if (messageType === 'stickerMessage') {
            text = 'sticker'
        }else if(messageType === 'buttonsMessage' || messageType === 'viewOnceMessage' && msgObj.message.viewOnceMessage.message && msgObj.message.viewOnceMessage.message.buttonsMessage) {
            text = 'buttonsMessage'
        }else if(messageType === 'templateMessage' || messageType === 'viewOnceMessage' && msgObj.message.viewOnceMessage.message && msgObj.message.viewOnceMessage.message.templateMessage) {
            text = 'templateMessage'
        }else if(messageType === 'listMessage' || messageType === 'viewOnceMessage' && msgObj.message.viewOnceMessage.message && msgObj.message.viewOnceMessage.message.listMessage) {
            text = 'listMessage'
        }else if (msgObj.message && msgObj.message.orderMessage) {
            text = 'order'
        }else if (msgObj.message && msgObj.message.productMessage) {
            text = 'product'
        }else if (msgObj.message && msgObj.message.buttonsResponseMessage){
            text = 'buttons_response'
        }else if (msgObj.message && msgObj.message.templateButtonReplyMessage) {
            text = 'template_buttons_response'
        }else if (msgObj.message && msgObj.message.listResponseMessage){
            text = 'list_response'
        }else if (msgObj.message && msgObj.message.pollCreationMessage){
            text = 'pollMessage'
        }else if (msgObj.message && msgObj.message.pollUpdateMessage){
            text = 'poll_vote'
        }else{
            text = 'text';
        }
        return text
    }

    async getMessageTypeDetails(msgObj,messageType,time,newSessionId,sock){
        let dataObj = {
            body:'',
            metadata:{},
            fromMe:msgObj.key.fromMe
        };

        if (messageType == 'conversation') {
            // Text Message Sent From ME
            dataObj.body = msgObj.message.conversation
        }else if(messageType == 'extendedTextMessage'){
            if (
                // Mention Message Sent From ME
                msgObj.message.extendedTextMessage.contextInfo &&
                msgObj.message.extendedTextMessage.contextInfo.mentionedJid &&
                msgObj.message.extendedTextMessage.contextInfo.mentionedJid.length > 0
            ) {
                dataObj.body = msgObj.message.extendedTextMessage.text
                dataObj['metadata'] = {
                    mentions: msgObj.message.extendedTextMessage.contextInfo.mentionedJid
                }
            }else if (
                // Reply Message
                msgObj.message.extendedTextMessage.contextInfo && 
                msgObj.message.extendedTextMessage.contextInfo.quotedMessage
            ) {
                let newMsgObj = {
                    key: {
                        remoteJid:  msgObj.message.extendedTextMessage.contextInfo.participant,
                        fromMe: msgObj.message.extendedTextMessage.contextInfo.stanzaId.length > 20 ? false:true,
                        id:  msgObj.message.extendedTextMessage.contextInfo.stanzaId,
                    },
                    message:  msgObj.message.extendedTextMessage.contextInfo.quotedMessage,
                }
                let quotedMessageType = Object.keys( msgObj.message.extendedTextMessage.contextInfo.quotedMessage)[0];

                dataObj.body = msgObj.message.extendedTextMessage.text;
                dataObj['metadata'] = {
                    type:'reply',
                    quotedMessageId: newMsgObj.key.id,
                    remoteJid: newMsgObj.key.remoteJid,
                    fromMe: newMsgObj.key.fromMe,
                    quotedMessage: await this.getMessageInfo(newMsgObj,quotedMessageType,time,newSessionId,sock),
                }
            }else if(
                // Forward Message
                msgObj.message.extendedTextMessage.contextInfo != null &&
                msgObj.message.extendedTextMessage.contextInfo.hasOwnProperty('isForwarded')
            ){
                dataObj.body =  msgObj.message.extendedTextMessage.text
                dataObj['metadata'] = {
                    type:'forward',
                    forwardingScore: msgObj.message.extendedTextMessage.contextInfo.forwardingScore,
                    isForwarded: msgObj.message.extendedTextMessage.contextInfo.isForwarded
                }
            }else if(
                // Group Invite
                msgObj.message.extendedTextMessage.matchedText.includes('https://chat.whatsapp.com')
            ){
                dataObj.body =  msgObj.message.extendedTextMessage.text
                dataObj['metadata'] = {
                    matchedText: msgObj.message.extendedTextMessage.matchedText,
                    title: msgObj.message.extendedTextMessage.title,
                    code: msgObj.message.extendedTextMessage.matchedText.replace('https://chat.whatsapp.com/',''),
                    expiration: 0,
                }
            }else if(
                // Catalog Message
                msgObj.message.extendedTextMessage.matchedText.includes('https://wa.me/c')
            ){
                dataObj.body =  msgObj.message.extendedTextMessage.text
                dataObj['metadata'] = {
                    matchedText: msgObj.message.extendedTextMessage.matchedText,
                    title: msgObj.message.extendedTextMessage.title,
                    description: msgObj.message.extendedTextMessage.description,
                }
            }else if(
                // Link with preview
                !msgObj.message.extendedTextMessage.matchedText.includes('https://chat.whatsapp.com') &&
                !msgObj.message.extendedTextMessage.matchedText.includes('https://wa.me/c')
            ){
                dataObj.body =  msgObj.message.extendedTextMessage.text
                dataObj['metadata'] = {
                    matchedText: msgObj.message.extendedTextMessage.canonicalUrl != '' ? msgObj.message.extendedTextMessage.canonicalUrl : msgObj.message.extendedTextMessage.matchedText ,
                    title: msgObj.message.extendedTextMessage.title,
                    description: msgObj.message.extendedTextMessage.description,
                }
            }
            else{
                // Text Message Received
                dataObj.body = msgObj.message.extendedTextMessage.text
            }
        }else if(messageType == 'ephemeralMessage'){
            // Disappearing Text Message Sent From Me
            dataObj.body =
                msgObj.message.extendedTextMessage && msgObj.message.extendedTextMessage.text
                    ? msgObj.message.extendedTextMessage.text
                    : msgObj.message.ephemeralMessage.message.extendedTextMessage &&
                        msgObj.message.ephemeralMessage.message.extendedTextMessage.text
                        ? msgObj.message.ephemeralMessage.message.extendedTextMessage.text
                        : ''
            if (
                msgObj.message.ephemeralMessage.message.extendedTextMessage &&
                msgObj.message.ephemeralMessage.message.extendedTextMessage.contextInfo
            ) {
                let expireTime = parseInt(msgObj.message.ephemeralMessage.message.extendedTextMessage.contextInfo.expiration) +
                    time;
                dataObj['metadata']['expiration'] = expireTime 
                dataObj['metadata']['expirationFormatted'] = new Date(expireTime * 1000).toUTCString()
            }
        }else if (messageType == 'locationMessage') {
            // Location Message Sent From ME
            dataObj.body = msgObj.message.locationMessage.address
            dataObj['metadata'] = {
                latitude: msgObj.message.locationMessage.degreesLatitude,
                longitude: msgObj.message.locationMessage.degreesLongitude,
            }
        }else if (messageType == 'contactMessage') {
            const dataArr = msgObj.message.contactMessage.vcard

            let name = dataArr.split('FN:')
            if (name[1]) {
                name = name[1].split('\n')[0]
            }

            let org = dataArr.split('ORG:')
            if (org[1]) {
                org = org[1].split('\n')[0].replace(';', '')
            }

            let phone = dataArr.split('waid=')
            if (phone[1]) {
                phone = phone[1].split('\n')[0].split(':')[0]
            }

            dataObj.body = dataArr
            dataObj['metadata']={
                name:name,
                phone:phone,
            }

            if(dataArr.indexOf('ORG:') > 0){
                dataObj['metadata']['organization'] = org
            }
        }else if (messageType == 'reactionMessage') {
            // Reaction Message Set By ME
            dataObj.body = msgObj.message.reactionMessage.text
            dataObj['metadata'] = {
                reaction: msgObj.message.reactionMessage.text,
                quotedMessageId: msgObj.message.reactionMessage.key.id,
                quotedMessage: {
                    'fromMe' : msgObj.message.reactionMessage.key.id.length > 20 ? false:true,
                    remoteJid: msgObj.message.reactionMessage.key.remoteJid,
                }
            }
        }else if (messageType == 'buttonsMessage' || (messageType == 'viewOnceMessage' && msgObj.message.viewOnceMessage.message && msgObj.message.viewOnceMessage.message.buttonsMessage)){
            let msgData = msgObj.message.viewOnceMessage ? msgObj.message.viewOnceMessage.message.buttonsMessage : msgObj.message.buttonsMessage;
            dataObj.body =  msgData.contentText
            dataObj.metadata['hasPreview'] = 0
            dataObj.metadata['content'] =  msgData.contentText;
            dataObj.metadata['footer'] =  msgData.footerText;
            dataObj.metadata['buttons'] = this.formatButtonsResponse( msgData.buttons);
           
            if ( msgData.headerType == 4) {
                const extension = mime.extension( msgData.imageMessage.mimetype)
                const path = process.env.UPLOAD_PATH + '/messages/' + newSessionId + '/' + msgObj.key.id + '.' + extension

                await this.downloadMessageFile(msgObj,path,sock);

                dataObj.metadata['hasPreview'] = 1
                dataObj.metadata['image'] = process.env.IMAGE_URL + '/messages/' + newSessionId + '/' + msgObj.key.id + '.' + extension
            }
        
            if (dataObj.metadata['hasPreview'] == 0 && msgData.contentText.indexOf(' \r\n \r\n ') > 0) {
                const btnData =  msgData.contentText.split(' \r\n \r\n ')
                dataObj.metadata['title'] = btnData[0]
                dataObj.metadata['content'] = btnData[1]
            }
        }else if (messageType == 'templateMessage' || (messageType == 'viewOnceMessage' && msgObj.message.viewOnceMessage.message && msgObj.message.viewOnceMessage.message.templateMessage)) {
            let msgData = msgObj.message.viewOnceMessage ? msgObj.message.viewOnceMessage.message.templateMessage : msgObj.message.templateMessage;
            dataObj.body = msgData.hydratedTemplate && msgData.hydratedTemplate.hydratedContentText
                ? msgData.hydratedTemplate.hydratedContentText
                : '';
            dataObj.metadata['hasPreview'] = 0
            dataObj.metadata['content'] =  dataObj.body;
            dataObj.metadata['footer'] =  msgData.hydratedTemplate && msgData.hydratedTemplate.hydratedFooterText
                ? msgData.hydratedTemplate.hydratedFooterText
                : '';
            dataObj.metadata['buttons'] = this.formatTemplateButtonsResponse( msgData.hydratedTemplate &&
                msgData.hydratedTemplate.hydratedButtons
                ? msgData.hydratedTemplate.hydratedButtons
                : []);


            if (msgData.hydratedTemplate && msgData.hydratedTemplate.imageMessage) {
                const extension = mime.extension(msgData.hydratedTemplate.imageMessage.mimetype)
                const path = process.env.UPLOAD_PATH + '/messages/' + newSessionId + '/' + msgObj.key.id + '.' + extension
               
                await this.downloadMessageFile(msgObj,path,sock);

                dataObj.metadata['hasPreview'] = 1
                dataObj.metadata['image'] = process.env.IMAGE_URL + '/messages/' + newSessionId + '/' + msgObj.key.id + '.' + extension
            }

            if (dataObj.metadata['hasPreview'] == 0 && msgData.hydratedTemplate && msgData.hydratedTemplate.hydratedContentText.indexOf(' \r\n \r\n ') > 0) {
                const btnData =
                    msgData.hydratedTemplate && msgData.hydratedTemplate.hydratedContentText
                        ? msgData.hydratedTemplate.hydratedContentText.split(' \r\n \r\n ')
                        : []
                dataObj.metadata['title'] = btnData[0]
                dataObj.metadata['content'] = btnData[1]
            }
        }else if (messageType == 'listMessage' || (messageType == 'viewOnceMessage' && msgObj.message.viewOnceMessage.message && msgObj.message.viewOnceMessage.message.listMessage)) {
            let msgData = msgObj.message.viewOnceMessage ? msgObj.message.viewOnceMessage.message.listMessage : msgObj.message.listMessage;
            dataObj.body =  msgData.title;
            dataObj.metadata['title'] = msgData.title
            dataObj.metadata['body'] = msgData.description
            dataObj.metadata['footer'] = msgData.footerText
            dataObj.metadata['buttonText'] = msgData.buttonText
            dataObj.metadata['sections'] = this.formatSectionsResponse(msgData.sections)
        }else if (msgObj.message && msgObj.message.buttonsResponseMessage) {
            dataObj.body = msgObj.message.buttonsResponseMessage.selectedDisplayText;
            dataObj.metadata['selectedButtonID'] = msgObj.message.buttonsResponseMessage.selectedButtonId;
            dataObj.metadata['selectedButtonText'] = msgObj.message.buttonsResponseMessage.selectedDisplayText;
            dataObj.metadata['quotedMessageId'] = msgObj.message.buttonsResponseMessage.contextInfo.stanzaId;

            let quotedMessageType = Object.keys( msgObj.message.buttonsResponseMessage.contextInfo.quotedMessage)[0];
            if(quotedMessageType == 'buttonsMessage'){
                let newMsgObj = {
                    key:{
                        id: msgObj.message.buttonsResponseMessage.contextInfo.stanzaId,
                        fromMe: true,
                        remoteJid: msgObj.key.remoteJid
                    },
                    message:{
                        viewOnceMessage:{
                            message:{
                                buttonsMessage:msgObj.message.buttonsResponseMessage.contextInfo.quotedMessage.buttonsMessage,
                            }
                        }
                    }
                }
                dataObj.metadata['quotedMessage'] = await this.getMessageInfo(newMsgObj,quotedMessageType,time,newSessionId,sock)
            }
        }else if (msgObj.message && msgObj.message.templateButtonReplyMessage) {
            dataObj.body = msgObj.message.templateButtonReplyMessage.selectedDisplayText;
            dataObj.metadata['selectedButtonID'] = msgObj.message.templateButtonReplyMessage.selectedId;
            dataObj.metadata['selectedButtonText'] = msgObj.message.templateButtonReplyMessage.selectedDisplayText
            dataObj.metadata['quotedMessageId'] = msgObj.message.templateButtonReplyMessage.contextInfo.stanzaId;       

            let quotedMessageType = Object.keys( msgObj.message.templateButtonReplyMessage.contextInfo.quotedMessage)[0];
            if(quotedMessageType == 'templateMessage'){
                let newMsgObj = {
                    key:{
                        id: msgObj.message.templateButtonReplyMessage.contextInfo.stanzaId,
                        fromMe: true,
                        remoteJid: msgObj.key.remoteJid
                    },
                    message:{
                        viewOnceMessage:{
                            message:{
                                templateMessage:msgObj.message.templateButtonReplyMessage.contextInfo.quotedMessage.templateMessage,
                            }
                        }
                    }
                }
                dataObj.metadata['quotedMessage'] = await this.getMessageInfo(newMsgObj,quotedMessageType,time,newSessionId,sock)
            } 
        }else if (msgObj.message && msgObj.message.listResponseMessage) {
            dataObj.body = msgObj.message.listResponseMessage.title;
            dataObj.metadata['selectedOptionText'] = msgObj.message.listResponseMessage.title;
            dataObj.metadata['selectedRowId'] = msgObj.message.listResponseMessage.singleSelectReply.selectedRowId;
            dataObj.metadata['selectedOptionDescription'] = msgObj.message.listResponseMessage.description;
            dataObj.metadata['quotedMessageId'] = msgObj.message.listResponseMessage.contextInfo.stanzaId;       
            dataObj.metadata['listType'] = msgObj.message.listResponseMessage.listType;

            let quotedMessageType = Object.keys( msgObj.message.listResponseMessage.contextInfo.quotedMessage)[0];
            if(quotedMessageType == 'listMessage'){
                let newMsgObj = {
                    key:{
                        id: msgObj.message.listResponseMessage.contextInfo.stanzaId,
                        fromMe: true,
                        remoteJid: msgObj.key.remoteJid
                    },
                    message:{
                        viewOnceMessage:{
                            message:{
                                listMessage:msgObj.message.listResponseMessage.contextInfo.quotedMessage.listMessage,
                            }
                        }
                    }
                }
                dataObj.metadata['quotedMessage'] = await this.getMessageInfo(newMsgObj,quotedMessageType,time,newSessionId,sock)
            }
        }else if (msgObj.message && msgObj.message.orderMessage) {
            dataObj.body = msgObj.message.orderMessage.message;
            dataObj.metadata['orderId'] = msgObj.message.orderMessage.orderId;    
            dataObj.metadata['token'] = msgObj.message.orderMessage.token;    
            dataObj.metadata['orderTitle'] = msgObj.message.orderMessage.orderTitle;    
            dataObj.metadata['sellerJid'] = msgObj.message.orderMessage.sellerJid;    
            dataObj.metadata['itemCount'] = msgObj.message.orderMessage.itemCount;    
            dataObj.metadata['price'] = Number(msgObj.message.orderMessage.totalAmount1000.low )/ 1000;    
            dataObj.metadata['currency'] = msgObj.message.orderMessage.totalCurrencyCode;
        }else if (msgObj.message && msgObj.message.productMessage && msgObj.message.productMessage.product) {
            dataObj.body = msgObj.message.productMessage.product.title;
            dataObj.metadata['productId'] = msgObj.message.productMessage.product.productId;    
            dataObj.metadata['title'] = msgObj.message.productMessage.product.title;    
            dataObj.metadata['description'] = msgObj.message.productMessage.product.description;    
            dataObj.metadata['sellerJid'] = msgObj.message.productMessage.businessOwnerJid ? msgObj.message.productMessage.businessOwnerJid : msgObj.key.remoteJid;    
            dataObj.metadata['price'] = Number(msgObj.message.productMessage.product.priceAmount1000.low )/ 1000;    
            dataObj.metadata['currency'] = msgObj.message.productMessage.product.currencyCode;
        }else if (msgObj.message && msgObj.message.pollCreationMessage && msgObj.message.pollCreationMessage.options) {
            dataObj.body = msgObj.message.pollCreationMessage.name;
            dataObj.metadata['options'] = this.formatOptionsResponse(msgObj.message.pollCreationMessage.options);    
            dataObj.metadata['selectableOptionsCount'] = msgObj.message.pollCreationMessage.selectableOptionsCount;    
        }

        if (msgObj.message[messageType] && msgObj.message[messageType].hasOwnProperty('contextInfo') && msgObj.message[messageType].contextInfo.hasOwnProperty('quotedMessage')) {
            let quotedMessageType = Object.keys( msgObj.message[messageType].contextInfo.quotedMessage)[0];
            let newMsgObj = {
                key: {
                    remoteJid:  msgObj.message[messageType].contextInfo.participant,
                    fromMe: msgObj.message[messageType].contextInfo.quotedMessage.hasOwnProperty('fromMe') ?  msgObj.message[messageType].contextInfo.quotedMessage.fromMe : false ,
                    id:  msgObj.message[messageType].contextInfo.stanzaId
                },
                message: msgObj.message[messageType].contextInfo.quotedMessage,
            }
            dataObj.metadata['quotedMessageId']  = msgObj.message[messageType].contextInfo.stanzaId
            dataObj.metadata['remoteJid']  = msgObj.message[messageType].contextInfo.participant
            dataObj.metadata['quotedMessage']  = await this.getMessageInfo(newMsgObj,quotedMessageType,time,newSessionId,sock)            
            dataObj.metadata['type'] = 'reply'
        }

        if (msgObj.message[messageType] && msgObj.message[messageType].hasOwnProperty('contextInfo') && msgObj.message[messageType].contextInfo.hasOwnProperty('isForwarded') && msgObj.message[messageType].contextInfo.isForwarded == true) {
            dataObj.metadata['type'] = 'forward'
            dataObj.metadata['isForwarded'] = msgObj.message[messageType].contextInfo.isForwarded;
            dataObj.metadata['forwardingScore'] = msgObj.message[messageType].contextInfo.forwardingScore;
        }
        return dataObj;
    }

    async restoreMessageFormat(msg){
        let dataObj = {
            key:{
                remoteJid: msg.remoteJid,
                fromMe: msg.fromMe != "" ? msg.fromMe : false,
                // fromMe: msg.fromMe != "" ? Boolean(JSON.parse(msg.fromMe)) : false,
                id: msg.id,
                participant: undefined
            }
        }

        let oldDetails = await this.formatMsgToOldState(msg);

        return {
            ...dataObj,
            ...oldDetails
        }
    }

    getReactionText(reaction){
        let bodyText;
        if (reaction == 1) {
            bodyText = '👍'
        } else if (reaction == 2) {
            bodyText = '❤️'
        } else if (reaction == 3) {
            bodyText = '😂'
        } else if (reaction == 4) {
            bodyText = '😮'
        } else if (reaction == 5) {
            bodyText = '😢'
        } else if (reaction == 6) {
            bodyText = '🙏'
        }else{
            bodyText = ''
        }
        return bodyText
    }

    async formatMsgToBeSendAsReply(input,selected){
        let replyObj = {}
        let type = input.messageType;

       // 1  == Text ,  2 == Image , 3 == Video , 4 == Audio , 5 == Document , 6 == Sticker , 7 == Gif , 8 == Location , 
       // 9  == Contact, 10 == Disappearing , 11 == Mention , 13 == Buttons , 14 == Template , 15 == List, 16 == Link With Preview,  
       // 17 == Group Invitation, 18 == Product , 19 == Catalog  , 20 == Poll
        
        if(type == 1){
            let message = input.messageData.body;
            replyObj = { text: message }
        }else if(type == 2){
            let url = input.messageData.url;
            let caption = input.messageData.caption;
            replyObj = { 
                image: {  url },
                mimetype: this.mimeType(url),
                caption: caption,
            }
        }else if(type == 3){
            let url = input.messageData.url;
            let caption = input.messageData.caption;
            replyObj = {
                video: { url },
                caption: caption ? caption : '',
                mimetype: this.mimeType(url),
                gifPlayback: this.mimeType(url) === 'image/gif',
            }
        }else if(type == 4){
            let url = input.messageData.url;
            replyObj = {
                audio: { url }
            }
        }else if(type == 5){
            let url = input.messageData.url;
            replyObj = {
                document: { url },
                mimetype: this.mimeType(url),
                fileName: this.fileName(url),
            }
        }else if(type == 6){
            let url = input.messageData.url;
            replyObj = {
                sticker: { url },
                mimetype: this.mimeType(url),
            }
        }else if(type == 7){
            let url = input.messageData.url;
            let caption = input.messageData.caption;
            replyObj = {
                video: { url },
                caption: caption ? caption : '',
                mimetype: this.mimeType(url),
                gifPlayback: true,
            }
        }else if(type == 8){
            let address = input.messageData.address;
            let lat = input.messageData.lat;
            let lng = input.messageData.lng;
            replyObj = {
                location: { degreesLatitude: lat, degreesLongitude: lng, address: address },
            }
        }else if(type == 9){
            let name = input.messageData.name;
            let contact = input.messageData.contact;
            let organization = input.messageData.organization ? input.messageData.organization : '' ;

            const vcard =
            'BEGIN:VCARD\n' + // Metadata of the contact card
            'VERSION:3.0\n' +
            'FN:' +
            name +
            '\n' + // Full name
            'ORG:' +
            organization +
            ';\n' + // The organization of the contact
            'TEL;type=CELL;type=VOICE;waid=' +
            contact +
            ':+' +
            contact +
            '\n' + // WhatsApp ID + phone number
            'END:VCARD';

            replyObj = {
                contacts: { displayName: name, contacts: [{ vcard }] }
            }
        }else if(type == 10){
            let message = input.messageData.body;
            replyObj = { text: message }
        }else if(type == 11){
            let phone = input.messageData.contact;
            replyObj = {
                text: '@' + phone,
                mentions: [phone + '@s.whatsapp.net'],
            }
        }else if(type == 12){
            let bodyText = input.messageData.reaction == 'unset' ? '' : input.messageData.reaction
            replyObj = {
                react: {
                    text: bodyText,
                    key: {
                        remoteJid: selected.remoteJid,
                        fromMe: selected.fromMe == "true",
                        id: selected.id,
                    }
                },
            }
        }else if(type == 13){
            let hasImage = input.messageData.hasImage
            let buttons = this.formatButtons(input.messageData.buttons)
            let buttonMessage = {
                text: input.messageData.body,
                footer: input.messageData.footer,
                buttons,
                headerType: 1,
                image: {},
                caption: ''
            }
            if (hasImage) {
                delete buttonMessage.text
                buttonMessage.image = {
                    url: input.messageData.imageURL,
                }
                buttonMessage.caption = input.messageData.body
                buttonMessage.headerType = 4
            }
            replyObj = buttonMessage
        }else if(type == 14){
            let templateButtons = this.formatTemplateButtons(input.messageData.buttons)
            let buttonMessage = {
                content: input.messageData.body,
                footer: input.messageData.footer,
                templateButtons:templateButtons,
            }
            if (input.messageData.hasImage) {
                buttonMessage['image'] = {
                    url: input.messageData.imageURL,
                }
            }

            replyObj = buttonMessage
        }else if(type == 15){
            const buttonMessage = {
                text: input.messageData.body,
                footer: input.messageData.footer,
                title: input.messageData.title,
                buttonText: input.messageData.buttonText,
                sections: input.messageData.sections,
            }
            replyObj = buttonMessage
        }else if(type == 16){
            replyObj = {
                linkText:input.messageData.body ? input.messageData.body + ' ' + input.messageData.url : input.messageData.url ,
                matchedText: input.messageData.url,
                title:input.messageData.title,
                previewType:2,
            }
        }else if(type == 20){
            replyObj = {
                poll:{
                    name:input.messageData.body,
                    values: this.reformatOptions(input.messageData.options),
                    selectableOptionsCount: input.messageData.selectableOptionsCount,                    
                }
            }
        }
        return replyObj;
    }

    async formatMsgToOldState(msg){
        let message ={};
        if(msg.messageType == 'text' ){
            message['extendedTextMessage'] = {text:msg.body};
        }else if(msg.messageType == 'mentionMessage'){
            const prop: keyof typeof msg = 'metadata.mentions';
            message['extendedTextMessage'] = {
                text: msg.body,
                contextInfo:{
                    mentionedJid: msg[prop]
                }
            }
        }else if(msg.messageType == 'image'){
            message['imageMessage'] = {
                url: msg.body,
                mimetype:this.mimeType(msg.body),
            }
            if(msg.caption != ''){
                message['imageMessage']['caption'] = msg.caption
            }
        }else if(msg.messageType == 'document'){
            message['documentMessage'] = {
                url: msg.body,
                mimetype:this.mimeType(msg.body),
                fileName: msg.fileName,
                title: msg.fileName,
            }
        }else if(msg.messageType == 'video'){
            message['videoMessage'] = {
                url: msg.body,
                mimetype:this.mimeType(msg.body),
                seconds: msg['metadata.seconds']
            }
            if(msg.caption != ''){
                message['videoMessage']['caption'] = msg.caption
            }
        }else if(msg.messageType == 'audio'){
            message['audioMessage'] = {
                url: msg.body,
                mimetype:this.mimeType(msg.body),
                seconds: msg['metadata.seconds']
            }
        }else if(msg.messageType == 'sticker'){
            message['stickerMessage'] = {
                url: msg.body,
                mimetype:this.mimeType(msg.body),
                isAnimated: msg['metadata.isAnimated']
            }
        }else if(msg.messageType == 'gif'){
            message['videoMessage'] = {
                url: msg.body,
                mimetype:this.mimeType(msg.body),
                seconds: msg['metadata.seconds'],
                gifPlayback: msg['metadata.gifPlayback'],
            }
            if(msg.caption != ''){
                message['videoMessage']['caption'] = msg.caption
            }
        }else if(msg.messageType == 'contactMessage'){
            message['contactMessage'] = {
                vcard: msg.body,
                displayName: msg['metadata.name'],
            }
        }else if(msg.messageType == 'locationMessage'){
            message['locationMessage'] = {
                address: msg.body,
                degreesLatitude: msg['metadata.latitude'],
                degreesLongitude: msg['metadata.longitude'],
            }
        }


        



        return {message:message,messageTimestamp:Number(msg.time)};
    }

    async reformatMessageObj(sessionId, msg, messageType, sock , options={}) {
        require('events').EventEmitter.defaultMaxListeners = 100000;
        var newSessionId = sessionId.replace('wlChannel', '')
        // console.log(msg.message)
        let status = this.getMessageStatus(msg);
        const deviceType = getDevice(msg.key.id)
        let time = this.getMessageTime(msg);
        let extraDataObj  = await this.getMessageInfo(msg,messageType,time,newSessionId,sock);
        let messageObj = {
            id: msg.key.id,
            body:'',
            messageType:'',
            fromMe: msg.key.fromMe,
            author: msg.key.fromMe == 1 ? 'Me' : (msg.key.remoteJid.endsWith('@g.us') ? this.reformatPhone(msg.key.participant) : this.reformatPhone(msg.key.remoteJid, msg.participant)),
            chatName: this.reformatPhone(msg.key.remoteJid),
            pushName: msg.pushName ? msg.pushName : this.reformatPhone(msg.key.remoteJid),     
            time,
            timeFormatted: new Date(time * 1000).toUTCString(),
            status,
            statusText: this.formatStatusText(status),
            deviceSentFrom: deviceType,
            remoteJid: msg.key.remoteJid
        };

        let dataObj= {
            ...messageObj,
            ...extraDataObj,
        }

        if(dataObj.messageType == 'linkWithPreview' && dataObj.metadata['description'] == ''){
            dataObj.metadata['description'] = dataObj.body.replace(dataObj.metadata['matchedText'],'')
        }
        if(msg.message && msg.message.hasOwnProperty('pollUpdateMessage')){
            let quotedMessageType = "pollMessage";
            if(options && options.hasOwnProperty('pollMessage') && options.hasOwnProperty('pollOptions')){
                let newMsgObj = {
                    key: {
                        remoteJid:  msg.message.pollUpdateMessage.pollCreationMessageKey.remoteJid,
                        fromMe: true,
                        id:  msg.message.pollUpdateMessage.pollCreationMessageKey.id,
                    },
                    message:  {
                        pollCreationMessage:{
                            name: options['pollMessage']['body'],
                            options: options['pollOptions'],
                            selectableOptionsCount: options['pollMessage']['metadata.selectableOptionsCount'],
                            contextInfo:{
                                disappearingMode:{
                                    initiator:0
                                }
                            }
                        }
                    },
                }
            
                dataObj['metadata'] = {
                    quotedMessageId: newMsgObj.key.id,
                    remoteJid: newMsgObj.key.remoteJid,
                    fromMe: newMsgObj.key.fromMe,
                    quotedMessage: await this.getMessageInfo(newMsgObj,'pollMessage',time,newSessionId,sock),
                }
                dataObj['metadata']['quotedMessage']['metadata']['options'] = options['pollOptions']
            }
            if(options && options.hasOwnProperty('selectedOptions') && options['selectedOptions'].length >= 1){
                dataObj.messageType = 'poll_vote';
                dataObj.body = options['selectedOptions'].toString();
                dataObj.metadata['selectedOptions'] = options['selectedOptions'];
            }else{
                dataObj.messageType = 'poll_unvote';
                dataObj.body = 'poll unvoted';
                dataObj.metadata['selectedOptions'] = options['selectedOptions'];
            }
        }

        // console.log('--------------------');
        // console.log(dataObj);

        return dataObj;        
    }

    async getMessageKeyData(receiver,sessionId){
        let obj = {
            key:{
                // id: msgId,
                remoteJid: receiver,
                fromMe: true
            },
            messageTimestamp:Math.floor(Date.now() / 1000),
            status: "PENDING",
            sessionId: sessionId,
        }
        return obj
    }

    async formatWAMsgToBeSend(input,type){
        let msgObj = {
            message:{},
        }

        if(type == 1){
            msgObj.message = {
                text: input.body
            }
        }else if(type == 2){
            let url = input.url;
            msgObj.message = {
                image: {  url },
                mimetype: this.mimeType(url),
                caption: input.caption,
            }
        }else if(type == 3){
            let url = input.url;
            let caption = input.caption;
            msgObj.message = {
                video: { url },
                caption: caption ? caption : '',
                mimetype: this.mimeType(url),
            }
        }else if(type == 4){
            let url = input.url;
            msgObj.message = {
                audio: { url }
            }
        }else if(type == 5){
            let url = input.url;
            msgObj.message = {
                document: { url },
                mimetype: this.mimeType(url),
                fileName: this.fileName(url),
            }
        }else if(type == 6){
            let url = input.url;
            msgObj.message = {
                sticker: { url },
                mimetype: this.mimeType(url),
            }
        }else if(type == 7){
            let url = input.url;
            let caption = input.caption;
            msgObj.message = {
                video: { url },
                caption: caption ? caption : '',
                mimetype: this.mimeType(url),
                gifPlayback: true,
            }
        }else if(type == 8){
            let address = input.address;
            let lat = input.lat;
            let lng = input.lng;
            msgObj.message = {
                location: { degreesLatitude: lat, degreesLongitude: lng, address: address },
            }
        }else if(type == 9){
            let name = input.name;
            let contact = input.contact;
            let organization = input.organization ? input.organization : '' ;

            const vcard =
            'BEGIN:VCARD\n' + // Metadata of the contact card
            'VERSION:3.0\n' +
            'FN:' +
            name +
            '\n' + // Full name
            'ORG:' +
            organization +
            ';\n' + // The organization of the contact
            'TEL;type=CELL;type=VOICE;waid=' +
            contact +
            ':+' +
            contact +
            '\n' + // WhatsApp ID + phone number
            'END:VCARD';

            msgObj.message = {
                contacts: { displayName: name, contacts: [{ vcard }] }
            }
        }else if(type == 10){
            let message = input.body;
            msgObj.message = { text: message }
        }else if(type == 11){
            let phone = input.mention;
            msgObj.message = {
                text: '@' + phone,
                mentions: [phone + '@s.whatsapp.net'],
            }
        }else if(type == 12){
            let bodyText = input.body == 'unset' ? '' : input.body
            msgObj.message = {
                react: {
                    text: bodyText,
                },
            }
        }else if(type == 13){
            let hasImage = input.hasImage
            let buttons = this.formatButtons(input.buttons)
            let buttonMessage = {
                text: input.body,
                footer: input.footer,
                buttons,
                headerType: 1,
                image: {},
                caption: ''
            }
            if (hasImage) {
                delete buttonMessage.text
                buttonMessage.image = {
                    url: input.imageURL,
                }
                buttonMessage.caption = input.body
                buttonMessage.headerType = 4
            }
            msgObj.message = buttonMessage
        }else if(type == 14){
            let templateButtons = this.formatTemplateButtons(input.buttons)
            let buttonMessage = {
                text: input.body,
                footer: input.footer,
                templateButtons:templateButtons,
            }
            
            // Images Not Working in new Update
            if (input.hasImage) {
                buttonMessage['image'] = {
                    url: input.imageURL,
                }
            }

            msgObj.message = {
                content: buttonMessage.text,
                footer: buttonMessage.footer,
                templateButtons: templateButtons,
            }
            
            // msgObj.message = {
            //     viewOnceMessage:{
            //         message:{
            //             templateMessage:{
            //                 hydratedTemplate:{
            //                     hydratedContentText: buttonMessage.text,
            //                     hydratedFooterText: buttonMessage.footer,
            //                     hydratedButtons: templateButtons
            //                 }
            //             }
            //         }
            //     }
            // }
            
        }else if(type == 15){
            const buttonMessage = {
                text: input.body,
                footer: input.footer,
                title: input.title,
                buttonText: input.buttonText,
                sections: input.sections,
            }
            msgObj.message = buttonMessage
        }else if(type == 16){
            // msgObj.message ={
            //     extendedTextMessage:{
            //         text:input.body,
            //         matchedText: input.url,
            //         title:input.title,
            //         previewType:2,
            //     }
            // }
            msgObj.message = {
                linkText:input.body ? input.body + ' ' + input.url : input.url ,
                matchedText: input.url,
                title:input.title,
                previewType:2,
            }
        }else if(type == 20){
            msgObj.message = {
                poll:{
                    name:input.body,
                    values: this.reformatOptions(input.options),
                    selectableOptionsCount: input.selectableOptionsCount,                    
                }
            }
        }
       

        return msgObj
    }

    async paginateData(data,page,size){
        let pageIndex = page - 1;
        const result = data.reduce((resultArray, item, index) => { 
            const chunkIndex = Math.floor(index/size)
            if(!resultArray[chunkIndex]) {
                resultArray[chunkIndex] = [] // start a new chunk
            }
            resultArray[chunkIndex].push(item)
            return resultArray
        }, [])
        return {
            data: result[pageIndex] ?? [],
            pagination:{
                currentPage: Number(page),
                nextPage: (result.length > Number(page) )  ? Number(page) + 1 : Number(page),
                lastPage: Number(result.length),
                pageLimit: Number(size),
                totalCount: Number(data.length),
            }
        }
    }
}