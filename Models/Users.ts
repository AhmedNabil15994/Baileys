import Helper from "../helper/Helper";
import {  getSession, } from "../whatsapp";
import WLRedis from './WLRedis'
import { generateThumbnail,extractImageThumb } from '@adiwajshing/baileys'
import axios from 'axios'
import {v4 as uuidv4} from 'uuid';


export default class Users extends Helper {

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
        this.session_id = res.locals.sessionId
        if (req.body.phone || req.body.chat) {
            this.target = req.body.phone ? this.formatPhone(req.body.phone) : this.formatGroup(req.body.chat)
        }
    }

    async checkPhone(req, res) {
        try {
            const result = await this.onWhatsApp(this.session,this.target)
            if(result[0] && result[0].hasOwnProperty('exists')){
                this.response(res, 200, true, 'The receiver number exists.', result)
            }else{
                this.response(res, 200, true, "The receiver number doesn't exist.", result)
            }
        } catch (error) {
            (process.env.DEBUG_MODE == 'true') ? console.log('Failed to Fetch Data : checkPhone ' + error) : '';
            this.response(res, 500, false, 'Failed to Fetch Data.')
        }
    }

    async userStatus(req, res) {

        try {
            const exists = await this.onWhatsApp(this.session,this.target)

            if (!exists) {
                return this.response(res, 400, false, 'The phone number does not exist.')
            }

            const status = await this.session.fetchStatus(this.target)

            return this.response(res, 200, true, 'User status data found', status)
        } catch {
            return this.response(res, 500, false, 'Failed to get user status.')
        }
    }

    async userPresence(req, res) {

        try {
            const exists = await this.onWhatsApp(this.session,this.target)

            if (!exists) {
                return this.response(res, 400, false, 'The phone number does not exist.')
            }

            const presence = await this.session.presenceSubscribe(this.target)

            return this.response(res, 200, true, 'User presence data found', presence)
        } catch {
            return this.response(res, 500, false, 'Failed to get user presence.')
        }
    }

    async userProfilePicture(req, res) {

        try {
            const exists = await this.onWhatsApp(this.session,this.target)

            if (!exists) {
                return this.response(res, 400, false, 'The phone number does not exist.')
            }

            const image = await this.session.profilePictureUrl(this.target, 'image')

            return this.response(res, 200, true, 'User profile picture url found', image)
        } catch {
            return this.response(res, 500, false, 'Failed to get user profile picture.')
        }
    }

    async getBlockList(req,res){
        try {
            const status = await this.session.fetchBlocklist()
            return this.response(res, 200, true, 'Block list generated Successfully',status)
        } catch {
            return this.response(res, 500, false, 'Failed to block user.')
        }
        
    }

    async blockUser(req, res) {

        try {
            const exists = await this.onWhatsApp(this.session,this.target)

            if (!exists) {
                return this.response(res, 400, false, 'The phone number does not exist.')
            }

            const status = await this.session.updateBlockStatus(this.target, 'block')

            return this.response(res, 200, true, 'User Has Been Blocked Successfully', {
                blocked:true,
                remoteJid: this.target, 
            })
        } catch {
            return this.response(res, 500, false, 'Failed to block user.')
        }
    }

    async unblockUser(req, res) {

        try {
            const exists = await this.onWhatsApp(this.session,this.target)

            if (!exists) {
                return this.response(res, 400, false, 'The phone number does not exist.')
            }

            const status = await this.session.updateBlockStatus(this.target, 'unblock')

            return this.response(res, 200, true, 'User Has Been UnBlocked Successfully',  {
                blocked:false,
                remoteJid: this.target, 
            })
        } catch {
            return this.response(res, 500, false, 'Failed to unblock user.')
        }
    }

    async rejectCall(req, res) {
        const callId = req.body.callId;

        try {
            const exists = await this.onWhatsApp(this.session,this.target)

            if (!exists) {
                return this.response(res, 400, false, 'The phone number does not exist.')
            }

            const status = await this.session.rejectCall(callId,this.target)

            return this.response(res, 200, true, 'Call Has Been Rejected Successfully',  {
                rejected:true,
                remoteJid: this.target, 
                callId: callId, 
            })
        } catch {
            return this.response(res, 500, false, 'Failed to reject call.')
        }
    }

    

    //sendReceipt
    //sendReceipts
    // async sendReceipt(req, res) {
    
    

    //     try {
    //         let messageId = req.body.messageId;
    //         // const order = await this.session.sendReceipt(phone,null,[messageId],req.body.type)
    //         return this.response(res, 200, true, 'Receipt has been Sent Successfully !!', {})
    //     } catch (ex) {
    //         console.log(ex)
    //         return this.response(res, 500, false, 'Failed to Sent Receipt.')
    //     }
    // }

}