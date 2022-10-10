"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const baileys_1 = require("@adiwajshing/baileys");
const Helper_1 = __importDefault(require("../helper/Helper"));
const whatsapp_1 = require("../whatsapp");
const WLRedis_1 = __importDefault(require("./WLRedis"));
class Message extends Helper_1.default {
    constructor(req, res) {
        super();
        // Connect to Redis
        this.WLredis = new WLRedis_1.default();
        // set Session & target
        this.session = (res.locals.sessionId) ? (0, whatsapp_1.getSession)(res.locals.sessionId) : '';
        this.session_id = res.locals.sessionId;
        if (req.body.phone || req.body.chat) {
            this.target = req.body.phone ? this.formatPhone(req.body.phone) : this.formatGroup(req.body.chat);
        }
    }
    async fetchDialogs(req, res) {
        try {
            let contacts = await this.WLredis.getContacts(res.locals.sessionId);
            let dialogsArr = [];
            await Promise.all(Object.values(contacts).map(async (contact) => {
                try {
                    contact.image = await (0, whatsapp_1.getSession)(res.locals.sessionId).profilePictureUrl(contact.id);
                }
                catch (e) {
                    (process.env.DEBUG_MODE == 'true') ? console.log('fetching chat image error', contact.id) : '';
                }
                dialogsArr.push(contact);
            }));
            this.response(res, 200, true, 'Dialogs Found !!!', dialogsArr);
        }
        catch (_a) {
            this.response(res, 500, false, 'Failed to load Dialogs.');
        }
    }
    async fetchMessages(req, res) {
        var _a;
        const sessionId = (_a = req.query.id) !== null && _a !== void 0 ? _a : req.params.id;
        try {
            this.response(res, 200, true, 'Messages Found !!!', await this.WLredis.getMessages(sessionId));
        }
        catch (_b) {
            this.response(res, 500, false, 'Failed to load the message.');
        }
    }
    getList(req, res) {
        // return this.response(res, 200, true, '', getChatList(res.locals.sessionId))
    }
    async findMessage(req, res) {
        try {
            const selected = await this.WLredis.getMessage(this.session_id, req.body.messageId);
            if (!selected) {
                return this.response(res, 400, false, 'This message does not exist.');
            }
            // const msgObj =  reformatMessageObj(res.locals.sessionId,selected, Object.keys (selected.message)[0])
            this.response(res, 200, true, 'Message Found !!!', selected);
        }
        catch (_a) {
            this.response(res, 500, false, 'Failed to load the message.');
        }
    }
    async send(req, res) {
        const message = req.body.body;
        try {
            let checkWhatsApp = await this.onWhatsApp(this.session, this.target);
            if (checkWhatsApp.length == 0) {
                (process.env.DEBUG_MODE == 'true') ? console.log('Chat Not Exist target : ' + this.target) : '';
                return this.response(res, 200, false, 'Chat Not Exist ');
            }
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Error check onWhatsApp send : Error : ' + error + ' & Target : ' + this.target) : '';
        }
        try {
            const result = await this.session.sendMessage(this.target, { text: message, }, res.locals.sessionId);
            this.response(res, 200, true, 'The message has been successfully sent.', result);
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Failed to send the message target : ' + this.target + ' Message : ' + message + ': ' + error) : '';
            this.response(res, 500, false, 'Failed to send the message : ' + error);
        }
    }
    async sendDisappearing(req, res) {
        try {
            let checkWhatsApp = await this.onWhatsApp(this.session, this.target);
            if (checkWhatsApp.length == 0) {
                (process.env.DEBUG_MODE == 'true') ? console.log('Chat Not Exist target : ' + this.target) : '';
                return this.response(res, 200, false, 'Chat Not Exist ');
            }
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Error check onWhatsApp sendDisappearing: ' + error + ' & Target : ' + this.target) : '';
        }
        try {
            const result = await this.session.sendMessage(this.target, { text: req.body.body }, { ephemeralExpiration: baileys_1.WA_DEFAULT_EPHEMERAL });
            this.response(res, 200, true, 'The message has been successfully sent.', result);
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Failed to send the message : sendDisappearing ' + error) : '';
            this.response(res, 500, false, 'Failed to send the message sendDisappearing : ' + error);
        }
    }
    async sendTemplates(req, res) {
        try {
            let checkWhatsApp = await this.onWhatsApp(this.session, this.target);
            if (checkWhatsApp.length == 0) {
                (process.env.DEBUG_MODE == 'true') ? console.log('Chat Not Exist target : ' + this.target) : '';
                return this.response(res, 200, false, 'Chat Not Exist ');
            }
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Error check onWhatsApp sendTemplates: ' + error + ' & Target : ' + this.target) : '';
        }
        const { hasImage } = req.body;
        const templateButtons = this.formatTemplateButtons(req.body.buttons);
        const buttonMessage = {
            text: req.body.body,
            footer: req.body.footer,
            templateButtons,
            image: {},
            caption: '',
            headerType: '',
        };
        if (hasImage) {
            delete buttonMessage.text;
            buttonMessage.image = {
                url: req.body.imageURL,
            };
            buttonMessage.caption = req.body.body;
            buttonMessage.headerType = '4';
        }
        try {
            const result = await this.session.sendMessage(this.target, buttonMessage);
            this.response(res, 200, true, 'The message has been successfully sent.', result);
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Failed to send the message : sendTemplates ' + error) : '';
            this.response(res, 500, false, 'Failed to send the message.');
        }
    }
    async sendListMessage(req, res) {
        try {
            let checkWhatsApp = await this.onWhatsApp(this.session, this.target);
            if (checkWhatsApp.length == 0) {
                (process.env.DEBUG_MODE == 'true') ? console.log('Chat Not Exist target : ' + this.target) : '';
                return this.response(res, 200, false, 'Chat Not Exist ');
            }
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Error check onWhatsApp sendListMessage: ' + error + ' & Target : ' + this.target) : '';
        }
        const { sections } = req.body;
        const buttonMessage = {
            text: req.body.body,
            footer: req.body.footer,
            title: req.body.title,
            buttonText: req.body.buttonText,
            sections,
        };
        try {
            const result = await this.session.sendMessage(this.target, buttonMessage);
            this.response(res, 200, true, 'The message has been successfully sent.', result);
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Failed to send the message : sendListMessage ' + error) : '';
            this.response(res, 500, false, 'Failed to send the message.');
        }
    }
    async sendReaction(req, res) {
        try {
            let checkWhatsApp = await this.onWhatsApp(this.session, this.target);
            if (checkWhatsApp.length == 0) {
                (process.env.DEBUG_MODE == 'true') ? console.log('Chat Not Exist target : ' + this.target) : '';
                return this.response(res, 200, false, 'Chat Not Exist ');
            }
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Error check onWhatsApp sendReaction: ' + error + ' & Target : ' + this.target) : '';
        }
        let bodyText = '';
        if (req.body.body == 1) {
            bodyText = '👍';
        }
        else if (req.body.body == 2) {
            bodyText = '❤️';
        }
        else if (req.body.body == 3) {
            bodyText = '😂';
        }
        else if (req.body.body == 4) {
            bodyText = '😮';
        }
        else if (req.body.body == 5) {
            bodyText = '😢';
        }
        else if (req.body.body == 6) {
            bodyText = '🙏';
        }
        const buttonMessage = {
            react: {
                text: bodyText,
                key: req.body.messageId,
            },
        };
        try {
            const result = await this.session.sendMessage(this.target, buttonMessage);
            this.response(res, 200, true, 'The message has been successfully sent.', result);
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Failed to send the message : sendReaction ' + error) : '';
            this.response(res, 500, false, 'Failed to send the message.');
        }
    }
    async sendReply(req, res) {
        try {
            let checkWhatsApp = await this.onWhatsApp(this.session, this.target);
            if (checkWhatsApp.length == 0) {
                (process.env.DEBUG_MODE == 'true') ? console.log('Chat Not Exist target : ' + this.target) : '';
                return this.response(res, 200, false, 'Chat Not Exist ');
            }
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Error check onWhatsApp sendReply: ' + error + ' & Target : ' + this.target) : '';
        }
        const message = req.body.body;
        const { quoted } = req.body;
        try {
            const result = await this.session.sendMessage(this.target, { text: message }, { quoted });
            this.response(res, 200, true, 'The message has been successfully sent.', result);
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Failed to send the message : sendReply ' + error) : '';
            this.response(res, 500, false, 'Failed to send the message.');
        }
    }
    async sendMention(req, res) {
        try {
            let checkWhatsApp = await this.onWhatsApp(this.session, this.target);
            if (checkWhatsApp.length == 0) {
                (process.env.DEBUG_MODE == 'true') ? console.log('Chat Not Exist target : ' + this.target) : '';
                return this.response(res, 200, false, 'Chat Not Exist ');
            }
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Error check onWhatsApp sendMention: ' + error + ' & Target : ' + this.target) : '';
        }
        const { mention } = req.body;
        try {
            const result = await this.session.sendMessage(this.target, {
                text: '@' + mention,
                mentions: [mention + '@s.whatsapp.net'],
            });
            this.response(res, 200, true, 'The message has been successfully sent.', result);
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Failed to send the message : sendMention ' + error) : '';
            this.response(res, 500, false, 'Failed to send the message.');
        }
    }
    /*********************************************************/
    async sendButtons(req, res) {
        try {
            let checkWhatsApp = await this.onWhatsApp(this.session, this.target);
            if (checkWhatsApp.length == 0) {
                (process.env.DEBUG_MODE == 'true') ? console.log('Chat Not Exist target : ' + this.target) : '';
                return this.response(res, 200, false, 'Chat Not Exist ');
            }
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Error check onWhatsApp sendButtons: ' + error + ' & Target : ' + this.target) : '';
        }
        const { hasImage } = req.body;
        const buttons = this.formatButtons(req.body.buttons);
        const buttonMessage = {
            text: req.body.body,
            footer: req.body.footer,
            buttons,
            headerType: 1,
            image: {},
            caption: ''
        };
        if (hasImage) {
            delete buttonMessage.text;
            buttonMessage.image = {
                url: req.body.imageURL,
            };
            buttonMessage.caption = req.body.body;
            buttonMessage.headerType = 4;
        }
        try {
            const result = await this.session.sendMessage(this.target, buttonMessage);
            this.response(res, 200, true, 'The message has been successfully sent.', result);
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Failed to send the message : sendButtons ' + error) : '';
            this.response(res, 500, false, 'Failed to send the message.');
        }
    }
    async sendLocation(req, res) {
        try {
            let checkWhatsApp = await this.onWhatsApp(this.session, this.target);
            if (checkWhatsApp.length == 0) {
                (process.env.DEBUG_MODE == 'true') ? console.log('Chat Not Exist target : ' + this.target) : '';
                return this.response(res, 200, false, 'Chat Not Exist ');
            }
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Error check onWhatsApp sendLocation: ' + error + ' & Target : ' + this.target) : '';
        }
        const { lat, lng, address } = req.body;
        try {
            const result = await this.session.sendMessage(this.target, {
                location: { degreesLatitude: lat, degreesLongitude: lng, address: address },
            });
            this.response(res, 200, true, 'The message has been successfully sent.', result);
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Failed to send the message : sendLocation ' + error) : '';
            this.response(res, 500, false, 'Failed to send the message.');
        }
    }
    async sendContact(req, res) {
        try {
            let checkWhatsApp = await this.onWhatsApp(this.session, this.target);
            if (checkWhatsApp.length == 0) {
                (process.env.DEBUG_MODE == 'true') ? console.log('Chat Not Exist target : ' + this.target) : '';
                return this.response(res, 200, false, 'Chat Not Exist ');
            }
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Error check onWhatsApp sendContact: ' + error + ' & Target : ' + this.target) : '';
        }
        const { name, contact, organization } = req.body;
        const vcard = 'BEGIN:VCARD\n' + // Metadata of the contact card
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
        try {
            const result = await this.session.sendMessage(this.target, { contacts: { displayName: name, contacts: [{ vcard }] } });
            this.response(res, 200, true, 'The message has been successfully sent.', result);
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Failed to send the message : sendContact ' + error) : '';
            this.response(res, 500, false, 'Failed to send the message.');
        }
    }
    async sendAudio(req, res) {
        try {
            let checkWhatsApp = await this.onWhatsApp(this.session, this.target);
            if (checkWhatsApp.length == 0) {
                (process.env.DEBUG_MODE == 'true') ? console.log('Chat Not Exist target : ' + this.target) : '';
                return this.response(res, 200, false, 'Chat Not Exist ');
            }
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Error check onWhatsApp sendAudio: ' + error + ' & Target : ' + this.target) : '';
        }
        const { url } = req.body;
        try {
            const result = await this.session.sendMessage(this.target, {
                audio: { url },
            });
            this.response(res, 200, true, 'The message has been successfully sent.', result);
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Failed to send the message : sendAudio ' + error) : '';
            this.response(res, 500, false, 'Failed to send audio message. ' + error);
        }
    }
    async sendVideo(req, res) {
        try {
            let checkWhatsApp = await this.onWhatsApp(this.session, this.target);
            if (checkWhatsApp.length == 0) {
                (process.env.DEBUG_MODE == 'true') ? console.log('Chat Not Exist target : ' + this.target) : '';
                return this.response(res, 200, false, 'Chat Not Exist ');
            }
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Error check onWhatsApp sendVideo: ' + error + ' & Target : ' + this.target) : '';
        }
        const { url, caption } = req.body;
        try {
            const result = await this.session.sendMessage(this.target, {
                video: { url },
                caption: caption ? caption : '',
                mimetype: this.mimeType(url),
                gifPlayback: this.mimeType(url) === 'image/gif',
            });
            this.response(res, 200, true, 'The message has been successfully sent.', result);
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Failed to send the message : sendVideo ' + error) : '';
            this.response(res, 500, false, 'Failed to send the message.');
        }
    }
    async sendFile(req, res) {
        try {
            let checkWhatsApp = await this.onWhatsApp(this.session, this.target);
            if (checkWhatsApp.length == 0) {
                (process.env.DEBUG_MODE == 'true') ? console.log('Chat Not Exist target : ' + this.target) : '';
                return this.response(res, 200, false, 'Chat Not Exist ');
            }
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Error check onWhatsApp sendFile: ' + error + ' & Target : ' + this.target) : '';
        }
        const { url } = req.body;
        try {
            const result = await this.session.sendMessage(this.target, {
                document: { url },
                mimetype: this.mimeType(url),
                fileName: this.fileName(url),
            });
            this.response(res, 200, true, 'The message has been successfully sent.', result);
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Failed to send the message : sendFile ' + error) : '';
            this.response(res, 500, false, 'Failed to send the message.');
        }
    }
    async sendImage(req, res) {
        try {
            let checkWhatsApp = await this.onWhatsApp(this.session, this.target);
            if (checkWhatsApp.length == 0) {
                (process.env.DEBUG_MODE == 'true') ? console.log('Chat Not Exist target : ' + this.target) : '';
                return this.response(res, 200, false, 'Chat Not Exist ');
            }
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Error check onWhatsApp sendImage: ' + error + ' & Target : ' + this.target) : '';
        }
        const { url, caption } = req.body;
        try {
            const result = await this.session.sendMessage(this.target, {
                image: { url },
                mimetype: this.mimeType(url),
                caption,
            });
            this.response(res, 200, true, 'The message has been successfully sent.', result);
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Failed sendImage target: ' + this.target + ' url : ' + url + ' type: ' + this.mimeType(url) + ' caption: ' + caption + ' Error: ' + error) : '';
            this.response(res, 500, false, 'Failed to send the message.');
        }
    }
    /*********************************************************/
    async checkPhone(req, res) {
        try {
            const result = await this.onWhatsApp(this.session, this.formatPhone(req.body.receiver));
            this.response(res, 200, true, 'TThe receiver number exists.', result);
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Failed to send the message : checkPhone ' + error) : '';
            this.response(res, 500, false, 'Failed to send the message.');
        }
    }
    async forwardMessage(req, res) {
        try {
            let checkWhatsApp = await this.onWhatsApp(this.session, this.target);
            if (checkWhatsApp.length == 0) {
                (process.env.DEBUG_MODE == 'true') ? console.log('Chat Not Exist target : ' + this.target) : '';
                return this.response(res, 200, false, 'Chat Not Exist ');
            }
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Error check onWhatsApp forwardMessage: ' + error + ' & Target : ' + this.target) : '';
        }
        const { msg } = req.body;
        try {
            const result = await this.session.sendMessage(this.target, { forward: msg });
            this.response(res, 200, true, 'The message has been successfully sent.', result);
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Failed to send the message : forwardMessage ' + error) : '';
            this.response(res, 500, false, 'Failed to send the message.');
        }
    }
    async deleteMessage(req, res) {
        try {
            let checkWhatsApp = await this.onWhatsApp(this.session, this.target);
            if (checkWhatsApp.length == 0) {
                (process.env.DEBUG_MODE == 'true') ? console.log('Chat Not Exist target : ' + this.target) : '';
                return this.response(res, 200, false, 'Chat Not Exist ');
            }
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Error check onWhatsApp deleteMessage: ' + error + ' & Target : ' + this.target) : '';
        }
        const { messageKey } = req.body;
        try {
            const obj = await this.session.sendMessage(this.target, { delete: messageKey });
            this.response(res, 200, true, '', obj);
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Failed to send the message : deleteMessage ' + error) : '';
            this.response(res, 500, false, 'Failed to delete message.');
        }
    }
    async deleteMessageForMe(req, res) {
        try {
            let checkWhatsApp = await this.onWhatsApp(this.session, this.target);
            if (checkWhatsApp.length == 0) {
                (process.env.DEBUG_MODE == 'true') ? console.log('Chat Not Exist target : ' + this.target) : '';
                return this.response(res, 200, false, 'Chat Not Exist ');
            }
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Error check onWhatsApp deleteMessageForMe: ' + error + ' & Target : ' + this.target) : '';
        }
        const { messageKey } = req.body;
        try {
            const status = await this.session.chatModify({ clear: { message: { id: messageKey, fromMe: true } } }, this.target, []);
            this.response(res, 200, true, '', status);
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Failed to send the message : deleteMessageForMe ' + error) : '';
            this.response(res, 500, false, 'Failed to delete message.');
        }
    }
    async sendPTT(req, res) {
        try {
            let checkWhatsApp = await this.onWhatsApp(this.session, this.target);
            if (checkWhatsApp.length == 0) {
                (process.env.DEBUG_MODE == 'true') ? console.log('Chat Not Exist target : ' + this.target) : '';
                return this.response(res, 200, false, 'Chat Not Exist ');
            }
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Error check onWhatsApp sendPTT: ' + error + ' & Target : ' + this.target) : '';
        }
        const { url } = req.body;
        try {
            const result = await this.session.sendMessage(this.target, {
                audio: { url },
                ptt: true,
            });
            this.response(res, 200, true, 'The message has been successfully sent.', result);
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Failed to send the message : sendPTT ' + error) : '';
            this.response(res, 500, false, 'Failed to send the message.');
        }
    }
    async sendStiker(req, res) {
        try {
            let checkWhatsApp = await this.onWhatsApp(this.session, this.target);
            if (checkWhatsApp.length == 0) {
                (process.env.DEBUG_MODE == 'true') ? console.log('Chat Not Exist target : ' + this.target) : '';
                return this.response(res, 200, false, 'Chat Not Exist ');
            }
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Error check onWhatsApp sendStiker: ' + error + ' & Target : ' + this.target) : '';
        }
        const { url } = req.body;
        try {
            const result = await this.session.sendMessage(this.target, {
                sticker: { url },
                mimetype: this.mimeType(url),
            });
            this.response(res, 200, true, 'The message has been successfully sent.', result);
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Failed to send the message : sendStiker ' + error) : '';
            this.response(res, 500, false, 'Failed to send the message.');
        }
    }
    async sendGif(req, res) {
        try {
            let checkWhatsApp = await this.onWhatsApp(this.session, this.target);
            if (checkWhatsApp.length == 0) {
                (process.env.DEBUG_MODE == 'true') ? console.log('Chat Not Exist target : ' + this.target) : '';
                return this.response(res, 200, false, 'Chat Not Exist ');
            }
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Error check onWhatsApp sendGif: ' + error + ' & Target : ' + this.target) : '';
        }
        const { url, caption } = req.body;
        try {
            const result = await this.session.sendMessage(this.target, {
                video: { url },
                caption: caption ? caption : '',
                mimetype: this.mimeType(url),
                gifPlayback: true,
            });
            this.response(res, 200, true, 'The message has been successfully sent.', result);
        }
        catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Failed to send the message : sendGif ' + error) : '';
            this.response(res, 500, false, 'Failed to send the message.');
        }
    }
}
exports.default = Message;
