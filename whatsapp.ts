import makeWASocket, {
	Browsers,
	delay,
	DisconnectReason,
	fetchLatestBaileysVersion,
	MessageRetryMap,
	useMultiFileAuthState,
} from '@adiwajshing/baileys'
import getPollUpdateMessages from '@adiwajshing/baileys'
import { Boom } from '@hapi/boom'
import crypto from 'crypto';
import {
	readdir,
	rmSync,
} from 'fs'
import { join } from 'path'
import pino from 'pino'
import { toDataURL } from 'qrcode'
import response from './response'
import WLRedis from './Models/WLRedis'
import WLWebhook from './Models/WLWebhook'
import Helper from './helper/Helper'
// import { PollUpdateDecrypt } from './PollUpdateDecrypt'
import PollUpdateDecrypt from './PollUpdateDecrypt'
// External map to store retry counts of messages when decryption/encryption fails
// keep this out of the socket itself, so as to prevent a message decryption/encryption loop across socket restarts
const sessions = new Map()
const fs = require('fs');

const sessionsDir = (sessionId = '') => {
	return join('sessions', sessionId ? (sessionId.startsWith('md_') ? sessionId : sessionId + '.json') : '')
}

let Redis = new WLRedis();
let Webhook = new WLWebhook();
let WLHelper = new Helper();
const msgRetryCounterMap: MessageRetryMap = {}

const getSession = (sessionId) => {
	return sessions.get(sessionId) &&  fs.readdirSync(sessionsDir('md_' +sessionId)).length !== 0 ? sessions.get(sessionId) : null
}

const init = () => {
	readdir(sessionsDir(), (err, files) => {
		for (const file of files) {
			if (file.startsWith('md_')) {
				let sessionId = file.replace('md_', '');
				createSession(sessionId)
			}
		}
	})
}


const deleteSession = (sessionId, clearInstance = false) => {
	const sessionFile = 'md_' + sessionId;
	const rmOptions = { recursive: true }
	fs.rm(sessionsDir(sessionFile), rmOptions, ()=>{
		sessions.delete(sessionId)
	});
}


const createSession = async (sessionId, res = null) => {
	try {
		const sessionFile = 'md_' + sessionId

		const logger = pino({ level: 'error' });
		// Save every 10s
		const { state, saveCreds } = await useMultiFileAuthState(sessionsDir(sessionFile))

		// Fetch latest version of WA Web
		const { version } = await fetchLatestBaileysVersion()
		let browser;
		if ((process.env.BROWSER == 'Whatsloop')) {
			// browser = Browsers.Whatsloop('safari');
			browser = Browsers.appropriate('safari');
		} else {
			browser = Browsers.appropriate('safari');
		}

		const sock = makeWASocket({
			version,
			logger,
			printQRInTerminal: false,
			markOnlineOnConnect: true,
			auth: state,
			browser: Browsers.macOS('Desktop'),
			syncFullHistory: true,
			msgRetryCounterMap,
			getMessage: async key => {
				(process.env.DEBUG_MODE == 'true') ? console.log('getMessage Problem :', key) : '';
				const msg = await Redis.getOne(sessionId, key.id,'messages');
				if (msg) {
    				(process.env.DEBUG_MODE == 'true') ? console.log('getMessage Problem Fixed  Message is :', msg.body) : '';
					return {
						conversation: msg.body
					}
				}
				// only if store is present
				return {
					conversation: '  '
				}
			}
		})

		sessions.set(sessionId, { ...sock })
		sock.ev.process(
			// events is a map for event name => event data
			async (events) => {
				// something about the connection changed
				// maybe it closed, or we received all offline message or connection opened
				if (events['connection.update']) {
					const update = events['connection.update'];
					const { connection, lastDisconnect } = update;
					try {
						if (connection === 'close') {
							if ((lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut) {
								createSession(sessionId, res);
							} else {
								await Webhook.appLogOut(sessionId);
								deleteSession(sessionId, true)
							}
						}
					} catch (e) {
						(process.env.DEBUG_MODE == 'true') ? console.log('update data : ', update) : '';
						(process.env.DEBUG_MODE == 'true') ? console.log('connection.update error', e) : '';
					}
					try {
						if (update.qr && update.qr !== 'undefined' && res && res !== null) {
							if (res !== null) {
								const qr = await toDataURL(update.qr)
								response(res, 200, true, 'QR code received, please scan the QR code.', { qr })
							}
						}
					} catch (e) {
						// (process.env.DEBUG_MODE == 'true') ? console.log('Get QR Error : ', e) : '';
					}
				}

				// credentials updated -- save them
				if (events['creds.update']) {
					try {
						await saveCreds()
					} catch (e) {
						(process.env.DEBUG_MODE == 'true') ? console.log('creds.update error', e) : '';
					}
				}

				// message history received
				if (events['messages.set']) {
					const { messages } = events['messages.set']
					try {
						await Redis.setData(sessionId, messages,'messages',sock);
					} catch (e) {
						(process.env.DEBUG_MODE == 'true') ? console.log('messages.set error', e) : '';
					}
				}

				// chat history received
				if (events['chats.set']) {
					const { chats } = events['chats.set']
					try {
						await Redis.setData(sessionId, chats,'chats');
					} catch (e) {
						(process.env.DEBUG_MODE == 'true') ? console.log('chats.set error', e) : '';
					}
				}

				// contact history received
				if (events['contacts.set']) {
					const { contacts } = events['contacts.set']
					try {
						await Redis.setData(sessionId, contacts,'contacts');
					} catch (e) {
						(process.env.DEBUG_MODE == 'true') ? console.log('contacts.set error', e) : '';
					}
				}

				// received a new message
				if (events['messages.upsert']) {
					const m = events['messages.upsert']
					try {
						const msg = m.messages[0]
						let option: string[] = [];
						let options : any[] = []
						let selected;

						if (!msg.message) {
							return
						} // If there is no text or media message
						if(msg.message && msg.message.hasOwnProperty('pollUpdateMessage')){
							let msgId = msg.message.pollUpdateMessage?.pollCreationMessageKey?.id;	
							selected = await Redis.getOne(sessionId, msgId,'messages')				
							let encKey = selected['metadata/.encKey'] ? selected['metadata/.encKey'] : selected['metadata.encKey']
							let encPayload = msg.message?.pollUpdateMessage?.vote?.encPayload;
							let encIv = msg.message?.pollUpdateMessage?.vote?.encIv;
							let sessionVar = await getSession(sessionId);
							let myPhone = sessionVar.user.id.indexOf(':') > 0 ?  sessionVar.user.id.split(':')[0]+'@s.whatsapp.net' : sessionVar.user.id;
							let pollMsgSender = selected.fromMe == 'true' ? myPhone : selected.remoteJid;
							let voteMsgSender = msg.key.fromMe == true ? myPhone : msg.key.remoteJid;
							let encKeyBuffer:any = Buffer.from(encKey, 'base64')
							Object.keys(selected).forEach((item) =>{
								if(item.includes('metadata.options.')){
									options.push(selected[item]);
								}
							})

							if(msgId && voteMsgSender && encPayload && encIv && msgId){
								try{
									const hash = await new PollUpdateDecrypt().decryptPollMessageRaw(
								        encKeyBuffer,
								        encPayload,
								        encIv,
								        pollMsgSender,
								        msgId,
								        voteMsgSender, 
									);
									option = await new PollUpdateDecrypt().comparePollMessage(options, hash)
								}catch(e){
									(process.env.DEBUG_MODE == 'true') ? console.log('error on PollUpdateDecrypt', e.message) : '';
								}
							}	
						}

						if(msg.message.hasOwnProperty('senderKeyDistributionMessage')){
							delete msg.message['senderKeyDistributionMessage']
						}
						if(msg.message.hasOwnProperty('messageContextInfo')){
							delete msg.message['messageContextInfo']
						}

						let optionObj = {
							selectedOptions: option,
							pollOptions: options,
							pollMessage: selected,
						};

						const messageType = Object.keys(msg.message)[0] // Get what type of message it is -- text, image, video
						if (msg.key.remoteJid !== 'status@broadcast' && messageType != 'protocolMessage') {
							const messageObj = await WLHelper.reformatMessageObj(sessionId, msg, messageType, sock,optionObj)
							if (messageObj) {
								await Webhook.MessageUpsert(sessionId, messageObj);
							}
						}
					} catch (e) {
						(process.env.DEBUG_MODE == 'true') ? console.log('error on upsert Message: ', m.messages[0]) : '';
						(process.env.DEBUG_MODE == 'true') ? console.log('error on upsert', e.message) : '';
					}
				}

				// messages updated like status delivered, message deleted etc.
				if (events['messages.update']) {
					const m = events['messages.update'];
					console.log(m[0])
					try {
						(m[0].key.remoteJid !== 'status@broadcast') ? await Webhook.MessageUpdates(sessionId, m[0]) : '';
					} catch (e) {
						(process.env.DEBUG_MODE == 'true') ? console.log('messages.update error', e) : '';
					}
				}

				// Dialog Last updates
				if (events['chats.update']) {
					const m = events['chats.update'];
					m.forEach(async function(item){
						// try {
							console.log(m[0]);
						// 	(m[0].id !== 'status@broadcast') ? await Webhook.ChatsUpdate(sessionId, m[0]) : '';
						// } catch (e) {
						// 	(process.env.DEBUG_MODE == 'true') ? console.log('chats.update error', e) : '';
						// }
						try {
							(item.id !== 'status@broadcast') ? await Webhook.ChatsUpdate(sessionId, item) : '';
						} catch (e) {
							(process.env.DEBUG_MODE == 'true') ? console.log('chats.update error', e) : '';
						}
					});
					
				}

				if(events['labels.set']){
					const m = events['labels.set']
					try {
						await Webhook.setLabel(sessionId, m[0]);
					} catch (e) {
						(process.env.DEBUG_MODE == 'true') ? console.log('labels.set error', e) : '';
					}
				}

				if(events['labels.delete']){
					const m = events['labels.delete']
					try {
						await Webhook.deleteLabel(sessionId, m[0]);
					} catch (e) {
						(process.env.DEBUG_MODE == 'true') ? console.log('labels.set error', e) : '';
					}
					// console.log(m)
				}

				if(events['quick_reply.set']){
					const m = events['quick_reply.set']
					try {
					// console.log('quick_reply.set')
					// console.log(m)
						await Webhook.setReply(sessionId, m[0]);
					} catch (e) {
						(process.env.DEBUG_MODE == 'true') ? console.log('quick_reply.set error', e) : '';
					}
				}

				if(events['quick_reply.delete']){
					const m = events['quick_reply.delete']
					try {
						await Webhook.deleteReply(sessionId, m[0]);
					} catch (e) {
						(process.env.DEBUG_MODE == 'true') ? console.log('quick_reply.set error', e) : '';
					}
					// console.log(m)
				}

				if (events['chat.labeled']) {
					const m = events['chat.labeled']
					console.log(m)
				}

				// While Chats Deleted From API
				if (events['chats.delete']) {
					const m = events['chats.delete']
					// console.log(m[0])
					try {
						// await Webhook.ChatsDelete(sessionId, m[0])
					} catch (e) {
						(process.env.DEBUG_MODE == 'true') ? console.log('chats.delete error', e) : '';
					}
				}

				if (events['chats.deleted']) {
					const m = events['chats.deleted']
					console.log('deleted')
					console.log(m)
				}

				if (events['messages.delete']) {
					const m = events['messages.delete']
					console.log(m)
				}

				if (events['messages.labeled']) {
					const m = events['messages.labeled']
					try {
						await Webhook.MessageUpdates(sessionId, m[0]);
					} catch (e) {
						(process.env.DEBUG_MODE == 'true') ? console.log('messages.update error', e) : '';
					}
				}


				if (events['contacts.upsert']) {
					try {
						await Webhook.setNewContact(sessionId, events['contacts.upsert'][0]);
					} catch (e) {
						(process.env.DEBUG_MODE == 'true') ? console.log('contacts.upsert error', e) : '';
					}
				}

				if (events['contacts.update']) {
					try {
						await Webhook.updateContact(sessionId, events['contacts.update'][0]);
					} catch (e) {
						(process.env.DEBUG_MODE == 'true') ? console.log('contacts.update error', e) : '';
					}
				}

				if (events['message-receipt.update']) {
					// console.log(events['message-receipt.update'])
				}

				if (events['messages.media-update']) {
					// console.log(events['messages.media-update'])
				}

				if (events['messages.reaction']) {
					// console.log(events['messages.reaction'])
				}

				if (events['presence.update']) {
					// console.log(events['presence.update'])
				}

				if (events['groups.upsert']) {
					// console.log(events['groups.upsert'])
				}

				if (events['groups.update']) {
					// console.log(events['groups.update'])
				}

				if (events['group-participants.update']) {
					// console.log(events['group-participants.update'])
				}

				if (events['blocklist.set']) {
					// console.log(events['blocklist.set'])
				}

				if (events['blocklist.update']) {
					// console.log(events['blocklist.update'])
				}

				if (events['call']) {
					console.log('recv call event', events['call'])
				}



			}
		)
		// TODO: Send when any message or any action doing in whatsapp
		sock.ws.on('CB:iq,,pair-success', async (stanza) => {
			try {
				await Webhook.connectionConnected(sessionId);
			} catch (e) {
				(process.env.DEBUG_MODE == 'true') ? console.log('CB:iq,,pair-success error', e) : '';
			}
		})
	} catch (error) {
		console.log("createSession : " + error);
	}
}

export {
	createSession,
	getSession,
	deleteSession,
	init,
	sessionsDir
}