"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const url_1 = require("url");
const mime_types_1 = require("mime-types");
const baileys_1 = require("@adiwajshing/baileys");
const promises_1 = require("fs/promises");
const mime_types_2 = __importDefault(require("mime-types"));
const pino_1 = __importDefault(require("pino"));
const console_1 = __importDefault(require("console"));
class Helper {
    constructor() {
        this.formatPhone = (phone) => {
            if (phone.endsWith('@s.whatsapp.net')) {
                return phone;
            }
            let formatted = phone.replace(/\D/g, '');
            return (formatted += '@s.whatsapp.net');
        };
        this.formatGroup = (group) => {
            if (group.endsWith('@g.us')) {
                return group;
            }
            let formatted = group.replace(/[^\d-]/g, '');
            return (formatted += '@g.us');
        };
        this.formatButtons = (buttons) => {
            return buttons.map((btn) => {
                return {
                    buttonId: 'id' + btn.id,
                    buttonText: {
                        displayText: btn.title,
                    },
                    type: 1,
                };
            });
        };
    }
    response(res, statusCode = 200, success = false, message = '', data = {}) {
        res.status(statusCode);
        res.json({
            success,
            message,
            data,
        });
        res.end();
    }
    isSessionExists(sessionId) {
        const sessionFile = 'md_' + sessionId;
        return ((0, fs_1.existsSync)(this.sessionsDir(sessionFile)) && (0, fs_1.existsSync)(this.sessionsDir(sessionFile) + "/creds.json")) ? 1 : 0;
    }
    sessionsDir(sessionId = '') {
        return (0, path_1.join)('sessions', sessionId ? (sessionId.startsWith('md_') ? sessionId : sessionId + '.json') : '');
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
    async onWhatsApp(session, id) {
        if (id.startsWith('0')) {
            return ''; // eslint-disable-line prefer-promise-reject-errors
        }
        try {
            return await session.onWhatsApp(id);
        }
        catch (_a) {
            return Promise.reject(null); // eslint-disable-line prefer-promise-reject-errors
        }
    }
    sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
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
    mimeType(url) {
        const pathObj = (0, url_1.parse)(url, true);
        const mimeType = (0, mime_types_1.lookup)(pathObj.pathname);
        return mimeType;
    }
    fileName(url) {
        var _a;
        const pathObj = (0, url_1.parse)(url, true);
        const fileName = (_a = pathObj.pathname) === null || _a === void 0 ? void 0 : _a.split('/').pop();
        return fileName;
    }
    reformatPhone(phone, checkGroup = null) {
        if (phone.endsWith('@s.whatsapp.net')) {
            return phone.replace('@s.whatsapp.net', '');
        }
        if (checkGroup) {
            return this.reformatPhone(checkGroup);
        }
        return phone;
    }
    formatStatusText(status) {
        let text = '';
        if (status == 1) {
            text = 'Pending';
        }
        else if (status == 2) {
            text = 'Sent';
        }
        else if (status == 3 || status == 'DELIVERED' || status == 'DELIVERY_ACK') {
            text = 'Delivered';
        }
        else if (status == 4 || status == 'READ') {
            text = 'Viewed';
        }
        return text;
    }
    formatButtonsResponse(buttons) {
        return buttons.map((btn) => {
            return {
                id: btn.buttonId,
                title: btn.buttonText.displayText,
                type: 1,
            };
        });
    }
    formatTemplateButtonsResponse(buttons) {
        return buttons.map((btn) => {
            const button = {
                index: btn.index,
                urlButton: {},
                callButton: {},
                normalButton: {}
            };
            if (Object.keys(btn)[1] === 'urlButton') {
                button.urlButton = {
                    title: btn.urlButton.displayText,
                    url: btn.urlButton.url,
                };
            }
            else if (Object.keys(btn)[1] === 'callButton') {
                button.callButton = {
                    title: btn.callButton.displayText,
                    phone: btn.callButton.phoneNumber,
                };
            }
            else if (Object.keys(btn)[1] === 'quickReplyButton') {
                button.normalButton = {
                    title: btn.quickReplyButton.displayText,
                    id: btn.quickReplyButton.id,
                };
            }
            return button;
        });
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
                    };
                }),
            };
        });
    }
    formatTemplateButtons(buttons) {
        return buttons.map((btn) => {
            const button = {
                index: btn.id,
                urlButton: {},
                callButton: {},
                quickReplyButton: {}
            };
            if (btn.type === 1) {
                button.urlButton = {
                    displayText: btn.title,
                    url: btn.extra_data,
                };
            }
            else if (btn.type === 2) {
                button.callButton = {
                    displayText: btn.title,
                    phoneNumber: btn.extra_data,
                };
            }
            else if (btn.type === 3) {
                button.quickReplyButton = {
                    displayText: btn.title,
                    id: btn.extra_data,
                };
            }
            return button;
        });
    }
    async reformatMessageObj(sessionId, msg, messageType, sock) {
        let body;
        let status = 2;
        let logger = (0, pino_1.default)({ level: 'error' }, pino_1.default.destination("./download-media.log"));
        require('events').EventEmitter.defaultMaxListeners = 100000;
        var newSessionId = sessionId.replace('wlChannel', '');
        if (msg.hasOwnProperty(status)) {
            if (msg.status == 'READ') {
                status = 4;
            }
            else {
                status = 3;
            }
        }
        else if (msg.message.hasOwnProperty(status)) {
            status = msg.message.status;
        }
        const deviceType = (0, baileys_1.getDevice)(msg.key.id);
        let time = msg.messageTimestamp;
        if (msg.messageTimestamp && msg.messageTimestamp.low) {
            time = msg.messageTimestamp.low;
        }
        else if (msg.messageTimestamp && msg.messageTimestamp.low === undefined) {
            time = msg.messageTimestamp;
        }
        else if (msg.time !== undefined && msg.time.low !== undefined) {
            time = msg.time.low;
        }
        else if (msg.body.contextInfo !== undefined &&
            msg.body.contextInfo.ephemeralSettingTimestamp !== undefined &&
            msg.body.contextInfo.ephemeralSettingTimestamp.low !== undefined) {
            time = msg.body.contextInfo.ephemeralSettingTimestamp.low;
        }
        let messageObj = {
            id: msg.key.id,
            body,
            caption: '',
            messageType: '',
            fileName: '',
            fromMe: msg.key.fromMe,
            author: msg.key.fromMe == 1 ? 'Me' : this.reformatPhone(msg.key.remoteJid, msg.participant),
            chatName: this.reformatPhone(msg.key.remoteJid),
            pushName: msg.pushName ? msg.pushName : msg.key.fromMe == true ? 'Me' : '',
            time,
            timeFormatted: new Date(time * 1000).toUTCString(),
            status,
            statusText: this.formatStatusText(status),
            deviceSentFrom: deviceType,
            expirationFormatted: '',
            expiration: '',
            remoteJid: msg.key.remoteJid
        };
        // If( messageType != 'senderKeyDistributionMessage' || messageType != 'protocolMessage'){
        const mediaMsgsType = ['imageMessage', 'documentMessage', 'videoMessage', 'audioMessage', 'stickerMessage'];
        let dataObj = {
            mimetype: ''
        };
        let messageTypeText = '';
        let fileName = '';
        if (mediaMsgsType.includes(messageType)) {
            let MediaType;
            if (messageType === 'imageMessage') {
                MediaType = 'image';
                dataObj = msg.message.imageMessage;
                fileName = msg.message.imageMessage.fileName;
                messageObj.caption = msg.message.imageMessage.caption;
            }
            else if (messageType === 'documentMessage') {
                MediaType = 'document';
                dataObj = msg.message.documentMessage;
                fileName = msg.message.documentMessage.fileName;
                messageObj.caption = msg.message.documentMessage.fileName;
            }
            else if (messageType === 'videoMessage') {
                MediaType = 'video';
                dataObj = msg.message.videoMessage;
                fileName = msg.message.videoMessage.fileName;
                messageObj.caption = msg.message.videoMessage.caption;
            }
            else if (messageType === 'audioMessage') {
                MediaType = 'audio';
                dataObj = msg.message.audioMessage;
                fileName = msg.message.audioMessage.fileName;
            }
            else if (messageType === 'stickerMessage') {
                MediaType = 'sticker';
                dataObj = msg.message.stickerMessage;
                fileName = msg.message.stickerMessage.fileName;
            }
            else {
                MediaType = 'sticker';
            }
            if (!(0, fs_1.existsSync)(process.env.UPLOAD_PATH + '/messages/' + newSessionId + '/')) {
                (0, fs_1.mkdirSync)(process.env.UPLOAD_PATH + '/messages/' + newSessionId + '/');
            }
            const extension = mime_types_2.default.extension(dataObj.mimetype);
            const path = process.env.UPLOAD_PATH + '/messages/' + newSessionId + '/' + msg.key.id + '.' + extension;
            if (messageType !== 'documentMessage') {
                fileName = msg.key.id + '.' + extension;
            }
            if (!(0, fs_1.existsSync)(path)) {
                // Download stream
                try {
                    const buffer = await (0, baileys_1.downloadMediaMessage)(msg, 'stream', {}, {
                        logger,
                        // pass this so that baileys can request a reupload of media
                        // that has been deleted
                        reuploadRequest: sock.updateMediaMessage
                    });
                    // Save to file
                    await (0, promises_1.writeFile)(path, buffer);
                }
                catch (error) {
                    (process.env.DEBUG_MODE == 'true') ? console_1.default.log("Download Media : " + error) : '';
                }
            }
            messageTypeText = MediaType;
            messageObj.body =
                process.env.IMAGE_URL + '/uploads/messages/' + newSessionId + '/' + msg.key.id + '.' + extension;
            messageObj.fileName = fileName;
            messageObj.messageType = extension == 'gif' ? 'gifMessage' : messageTypeText;
            if (msg.messageTimestamp && !msg.messageTimestamp.low) {
                messageObj.time = msg.messageTimestamp;
            }
            else if (msg.messageTimestamp && msg.messageTimestamp.low) {
                messageObj.time = msg.messageTimestamp.low;
            }
        }
        if (messageType == 'ephemeralMessage') {
            messageObj.body =
                msg.message.extendedTextMessage && msg.message.extendedTextMessage.text
                    ? msg.message.extendedTextMessage.text
                    : msg.message.ephemeralMessage.message.extendedTextMessage &&
                        msg.message.ephemeralMessage.message.extendedTextMessage.text
                        ? msg.message.ephemeralMessage.message.extendedTextMessage.text
                        : '';
            if (msg.message.ephemeralMessage.message.extendedTextMessage &&
                msg.message.ephemeralMessage.message.extendedTextMessage.contextInfo) {
                messageObj.expiration =
                    msg.message.ephemeralMessage.message.extendedTextMessage.contextInfo.expiration +
                        msg.messageTimestamp.low;
                // messageObj.expirationFormatted = new Date(messageObj.expiration * 1000).toUTCString()
                messageObj.expirationFormatted = new Date().toUTCString();
                messageObj.messageType = 'disappearingMessage';
            }
        }
        else if (messageType == 'conversation') {
            messageObj.body = msg.message.conversation;
            messageObj.messageType = 'text';
        }
        else if (messageType == 'locationMessage') {
            messageObj.messageType = 'locationMessage';
            messageObj.body = {
                latitude: msg.message.locationMessage.degreesLatitude,
                longitude: msg.message.locationMessage.degreesLongitude,
            };
        }
        else if (messageType == 'contactMessage') {
            messageObj.messageType = 'contactMessage';
            const dataArr = msg.message.contactMessage.vcard;
            let name = dataArr.split('FN:');
            if (name[1]) {
                name = name[1].split('\n')[0];
            }
            let org = dataArr.split('ORG:');
            if (org[1]) {
                org = org[1].split('\n')[0].replace(';', '');
            }
            let phone = dataArr.split('waid=');
            if (phone[1]) {
                phone = phone[1].split('\n')[0].split(':')[0];
            }
            messageObj.body = {
                name,
                phone,
                organization: org,
            };
        }
        else if (messageType == 'reactionMessage') {
            messageObj.messageType = 'reactionMessage';
            // Let selected = await getMessageById(sessionId,msg.message.reactionMessage.key.remoteJid,msg.message.reactionMessage.key.id)
            messageObj.body = {
                reaction: msg.message.reactionMessage.text,
                message: msg.message.reactionMessage.key,
            };
        }
        else if (messageType == 'extendedTextMessage') {
            messageTypeText =
                msg.message.extendedTextMessage.contextInfo != null &&
                    msg.message.extendedTextMessage.contextInfo.isForwarded != null
                    ? 'forwardMessage'
                    : 'text';
            messageObj.body =
                messageTypeText == 'text' ? msg.message.extendedTextMessage.text : msg.message.extendedTextMessage;
            messageObj.messageType = messageTypeText;
            if (messageObj.body.contextInfo &&
                messageObj.body.contextInfo.mentionedJid &&
                messageObj.body.contextInfo.mentionedJid.length > 0) {
                messageObj.messageType = 'mentionMessage';
                messageObj.body.mentions = messageObj.body.contextInfo.mentionedJid;
                delete messageObj.body.contextInfo;
            }
            if (messageObj.body.contextInfo && messageObj.body.contextInfo.quotedMessage) {
                messageTypeText = 'replyMessage';
                const quotedMessageType = Object.keys(messageObj.body.contextInfo.quotedMessage)[0];
                const oldMsgObj = messageObj.body.contextInfo.quotedMessage;
                const newMsgObj = {
                    key: {
                        remoteJid: messageObj.body.contextInfo.participant,
                        id: messageObj.body.contextInfo.stanzaId,
                    },
                    message: messageObj.body.contextInfo.quotedMessage,
                };
                delete messageObj.body.contextInfo;
                messageObj.messageType = messageTypeText;
                messageObj.body.quotedMessage = newMsgObj.key;
            }
        }
        else if (messageType == 'buttonsMessage') {
            messageObj.messageType = 'buttonsMessage';
            messageObj.body = {
                title: '',
                content: msg.message.buttonsMessage.contentText,
                footer: msg.message.buttonsMessage.footerText,
                buttons: this.formatButtonsResponse(msg.message.buttonsMessage.buttons),
                hasPreview: 0,
                image: '',
            };
            if (msg.message.buttonsMessage.headerType == 4) {
                const extension = mime_types_2.default.extension(msg.message.buttonsMessage.imageMessage.mimetype);
                const path = process.env.UPLOAD_PATH + '/messages/' + newSessionId + '/' + msg.key.id + '.' + extension;
                if (!(0, fs_1.existsSync)(path)) {
                    try {
                        // Download stream
                        const buffer = await (0, baileys_1.downloadMediaMessage)(msg, 'stream', {}, {
                            logger,
                            // pass this so that baileys can request a reupload of media
                            // that has been deleted
                            reuploadRequest: sock.updateMediaMessage
                        });
                        // Save to file
                        await (0, promises_1.writeFile)(path, buffer);
                    }
                    catch (error) {
                        (process.env.DEBUG_MODE == 'true') ? console_1.default.log("buttonsMessage Download Media : " + error) : '';
                    }
                }
                messageObj.body.hasPreview = 1;
                messageObj.body.image =
                    process.env.IMAGE_URL + '/uploads/messages/' + newSessionId + '/' + msg.key.id + '.' + extension;
            }
            if (messageObj.body.hasPreview == 0) {
                const btnData = msg.message.buttonsMessage.contentText.split(' \r\n \r\n ');
                messageObj.body.title = btnData[0];
                messageObj.body.content = btnData[1];
            }
        }
        else if (messageType == 'templateMessage') {
            messageObj.messageType = 'templateMessage';
            messageObj.body = {
                title: '',
                content: msg.message.templateMessage.hydratedTemplate &&
                    msg.message.templateMessage.hydratedTemplate.hydratedContentText
                    ? msg.message.templateMessage.hydratedTemplate.hydratedContentText
                    : '',
                footer: msg.message.templateMessage.hydratedTemplate &&
                    msg.message.templateMessage.hydratedTemplate.hydratedFooterText
                    ? msg.message.templateMessage.hydratedTemplate.hydratedFooterText
                    : '',
                buttons: this.formatTemplateButtonsResponse(msg.message.templateMessage.hydratedTemplate &&
                    msg.message.templateMessage.hydratedTemplate.hydratedButtons
                    ? msg.message.templateMessage.hydratedTemplate.hydratedButtons
                    : []),
                hasPreview: 0,
                image: '',
            };
            if (msg.message.templateMessage.hydratedTemplate && msg.message.templateMessage.hydratedTemplate.imageMessage) {
                const extension = mime_types_2.default.extension(msg.message.templateMessage.hydratedTemplate.imageMessage.mimetype);
                const path = process.env.UPLOAD_PATH + '/messages/' + newSessionId + '/' + msg.key.id + '.' + extension;
                if (!(0, fs_1.existsSync)(path)) {
                    try {
                        // Download stream
                        const buffer = await (0, baileys_1.downloadMediaMessage)(msg, 'stream', {}, {
                            logger,
                            // pass this so that baileys can request a reupload of media
                            // that has been deleted
                            reuploadRequest: sock.updateMediaMessage
                        });
                        // Save to file
                        await (0, promises_1.writeFile)(path, buffer);
                    }
                    catch (error) {
                        (process.env.DEBUG_MODE == 'true') ? console_1.default.log("templateMessage Download Media : " + error) : '';
                    }
                }
                messageObj.body.hasPreview = 1;
                messageObj.body.image =
                    process.env.IMAGE_URL + '/uploads/messages/' + newSessionId + '/' + msg.key.id + '.' + extension;
            }
            if (messageObj.body.hasPreview == 0) {
                const btnData = msg.message.templateMessage.hydratedTemplate &&
                    msg.message.templateMessage.hydratedTemplate.hydratedContentText
                    ? msg.message.templateMessage.hydratedTemplate.hydratedContentText.split(' \r\n \r\n ')
                    : [];
                messageObj.body.title = btnData[0];
                messageObj.body.content = btnData[1];
            }
        }
        else if (messageType == 'listMessage') {
            messageObj.messageType = 'listMessage';
            messageObj.body = {
                title: msg.message.listMessage.title,
                footer: msg.message.listMessage.footerText,
                buttonText: msg.message.listMessage.buttonText,
                description: msg.message.listMessage.description,
                sections: this.formatSectionsResponse(msg.message.listMessage.sections),
            };
        }
        else if (msg.message && msg.message.buttonsResponseMessage) {
            messageObj.messageType = 'buttons_response';
            messageObj.body = {
                selectedButtonID: msg.message.buttonsResponseMessage.selectedButtonId,
                selectedButtonText: msg.message.buttonsResponseMessage.selectedDisplayText,
                quotedMsgId: msg.message.buttonsResponseMessage.contextInfo.stanzaId,
                quotedChatId: msg.key.remoteJid,
                // QuotedMsgBody: msg.message.buttonsResponseMessage.contextInfo.quotedMessage.buttonsMessage ? msg.message.buttonsResponseMessage.contextInfo.quotedMessage.buttonsMessage.contentText : '',
                type: msg.message.buttonsResponseMessage.type,
            };
        }
        if (messageObj.body && messageObj.body.text) {
            messageObj.body = messageObj.body.text;
            messageObj.messageType = 'chat';
        }
        return messageObj;
    }
}
exports.default = Helper;
