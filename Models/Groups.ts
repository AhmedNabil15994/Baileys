import { WA_DEFAULT_EPHEMERAL,generateMessageID,delay,generateThumbnail } from "@adiwajshing/baileys";
import Helper from "../helper/Helper";
import WLContactInterface from "../interfaces/WLContactInterface";
import WLConversationInterface from "../interfaces/WLConversationInterface";
import { getSession } from "../whatsapp";
import WLRedis from "./WLRedis";
import axios from 'axios'


export default class Groups extends Helper {

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
        if (req.body.phone || req.body.chat || req.body.groupId) {
            this.target = req.body.phone ? this.formatPhone(req.body.phone) : this.formatGroup(req.body.groupId ? req.body.groupId.replace('@g.us','') : req.body.chat)
        }
    }

    async fetchGroups(req, res) {
        try {
            const status = await this.session.groupFetchAllParticipating()
            return this.response(res, 200, true, 'User Groups generated Successfully', status)
        } catch {
            return this.response(res, 500, false, 'Failed to fetch user groups.')
        }
    }

    async groupMetaData(req, res) {
        let groupObj;
        try {
            const status = await this.session.groupFetchAllParticipating()
            Object.values(status).forEach(async (item:object) =>{
                if(item.hasOwnProperty('id') && item['id'] == this.target){
                    groupObj = item;
                }
            });
            if(groupObj.hasOwnProperty('desc')){
                delete groupObj['desc']
            }
            if(groupObj.hasOwnProperty('descId')){
                delete groupObj['descId']
            }
            this.response(res, 200, true, 'Group metadata has been generated Successfully', groupObj)
        } catch {
            this.response(res, 500, false, 'Failed to get group metadata.')
        }
    }

    async createGroup(req, res) {
        const { subject, phones } = req.body
        let dataArr: string[] = [];
        const checkPhones = await Promise.all(Object.values(phones).map(async (item: string)  => {
            if(item.includes('[')){
            }else{
                let exists = await this.onWhatsApp(this.session,this.formatPhone(item))
                if(exists){
                    let newData: string = this.formatPhone(item);
                    dataArr.push(newData)
                }
            }
        }));

        try {
            const group = await this.session.groupCreate(subject, dataArr)
            return this.response(res, 200, true, 'Group has been created Successfully', group)
        } catch {
            return this.response(res, 500, false, 'Failed to create group.')
        }
    }

    async updateGroupName(req, res) {
        const subject = req.body.name
        try {
            const status = await this.session.groupUpdateSubject(this.target, subject)
            return this.response(res, 200, true, 'Group name updated Successfully', {
                updated:true,
                name: subject,
                remoteJid: this.target,
            })
        } catch {
            return this.response(res, 500, false, 'Failed to update group name.')
        }
    }

    async updateGroupDescription(req, res) {
        const description = req.body.description

        try {

            const status = await this.session.groupUpdateDescription(this.target, description)

            return this.response(res, 200, true, 'Group description updated Successfully',  {
                updated:true,
                description: description,
                remoteJid: this.target,
            })
        } catch {
            return this.response(res, 500, false, 'Failed to update group description.')
        }
    }

    async updateGroupSettings(req, res) {
        const setting = req.body.setting

        try {
            let settingArr = ['announcement','not_announcement','locked','unlocked'];
            let settingTextArr = [
                'allow only admins to send messages to this group',
                'allow all to send messages to this group',
                'allow only admins to edit this group info',
                'allow all to edit this group info'
            ];
            
            const status = await this.session.groupSettingUpdate(this.target, setting)

            return this.response(res, 200, true, 'Group settings updated Successfully',  {
                updated:true,
                setting: setting,
                settingMsg: settingTextArr[settingArr.indexOf(setting)],
                remoteJid: this.target,
            })
        } catch {
            return this.response(res, 500, false, 'Failed to update group settings.')
        }
    }

    async getGroupParticipants(req, res) {
        let participants;

        try {
            const status = await this.session.groupFetchAllParticipating()
            Object.values(status).forEach(async (item:object) =>{
                if(item.hasOwnProperty('id') && item['id'] == this.target){
                    participants = item['participants'];
                }
            });
            return this.response(res, 200, true, 'Group participants generated Successfully', participants)
        } catch {
            return this.response(res, 500, false, 'Failed to fetch group participants.')
        }
    }

    async addGroupParticipant(req, res) {
        const phones = req.body.phones

        let dataArr: string[] = [];
        let dataArr2: string[] = [];
        const checkPhones = await Promise.all(Object.values(phones).map(async (item: string)  => {
            if(item.includes('[')){
            }else{
                let exists = await this.onWhatsApp(this.session,this.formatPhone(item))
                if(exists){
                    dataArr2.push(item)
                    let newData: string = this.formatPhone(item);
                    dataArr.push(newData)
                }
            }
        }));

        try {

            const status = await this.session.groupParticipantsUpdate(this.target, dataArr, 'add')

            return this.response(res, 200, true, 'Group participants added Successfully', {
                added:true,
                remoteJid: this.target,
                phones: dataArr2
            })
        } catch {
            return this.response(res, 500, false, 'Failed to add group participants beacause of not being the owner.')
        }
    }

    async removeGroupParticipant(req, res) {
        const phones = req.body.phones

        let dataArr: string[] = [];
        let dataArr2: string[] = [];
        const checkPhones = await Promise.all(Object.values(phones).map(async (item: string)  => {
            if(item.includes('[')){
            }else{
                let exists = await this.onWhatsApp(this.session,this.formatPhone(item))
                if(exists){
                    dataArr2.push(item)
                    let newData: string = this.formatPhone(item);
                    dataArr.push(newData)
                }
            }
        }));

        try {
            const status = await this.session.groupParticipantsUpdate(this.target, dataArr, 'remove')
            return this.response(res, 200, true, 'Group participants removed Successfully', {
                removed:true,
                remoteJid: this.target,
                phones: dataArr2
            })
        } catch {
            return this.response(res, 500, false, 'Failed to remove group participants beacause of not being the owner.')
        }
    }

    async promoteGroupParticipant(req, res) {
        const phones = req.body.phones

        let dataArr: string[] = [];
        let dataArr2: string[] = [];
        const checkPhones = await Promise.all(Object.values(phones).map(async (item: string)  => {
            if(item.includes('[')){
            }else{
                let exists = await this.onWhatsApp(this.session,this.formatPhone(item))
                if(exists){
                    dataArr2.push(item)
                    let newData: string = this.formatPhone(item);
                    dataArr.push(newData)
                }
            }
        }));
        try {
            const status = await this.session.groupParticipantsUpdate(this.target, dataArr, 'promote')

            return this.response(res, 200, true, 'Group participants promoted Successfully', {
                promoted:true,
                remoteJid: this.target,
                phones: dataArr2
            })
        } catch {
            return this.response(res, 500, false, 'Failed to remove promote participants beacause of not being the owner.')
        }
    }

    async demoteGroupParticipant(req, res) {
        const phones = req.body.phones

        let dataArr: string[] = [];
        let dataArr2: string[] = [];
        const checkPhones = await Promise.all(Object.values(phones).map(async (item: string)  => {
            if(item.includes('[')){
            }else{
                let exists = await this.onWhatsApp(this.session,this.formatPhone(item))
                if(exists){
                    dataArr2.push(item)
                    let newData: string = this.formatPhone(item);
                    dataArr.push(newData)
                }
            }
        }));

        try {
            const status = await this.session.groupParticipantsUpdate(this.target, dataArr, 'demote')

            return this.response(res, 200, true, 'Group participants demoted Successfully', {
                demoted:true,
                remoteJid: this.target,
                phones: dataArr2
            })
        } catch {
            return this.response(res, 500, false, 'Failed to remove demote participants beacause of not being the owner.')
        }
    }

    async joinGroup(req, res) {
        const code = req.body.code

        try {
            const response = await this.session.groupAcceptInvite(code)

            return this.response(res, 200, true, 'You had been joined group Successfully', {
                joinned: true,
                code: code,
            })
        } catch {
            return this.response(res, 500, false, 'Failed to join group via code.')
        }
    }

    async leaveGroup(req, res) {

        try {
            const status = await this.session.groupLeave(this.target)

            return this.response(res, 200, true, 'You had been left group', {
                left: true,
                remoteJid: this.target
            })
        } catch {
            return this.response(res, 500, false, 'Failed to leave group.')
        }
    }

    async getInviteCode(req, res) {

        try {
            const code = await this.session.groupInviteCode(this.target)

            return this.response(res, 200, true, 'Group invitation code has been generated Successfully', {
                code: code,
                remoteJid: this.target
            })
        } catch {
            return this.response(res, 500, false, 'Failed to get group invitation code.')
        }
    }

    async getGroupInviteInfo(req, res) {
        const code = req.body.code

        try {
            let codeResponse = await this.session.groupGetInviteInfo(code)

            if(codeResponse.hasOwnProperty('desc')){
                delete codeResponse['desc']
            }
            if(codeResponse.hasOwnProperty('descId')){
                delete codeResponse['descId']
            }
            return this.response(res, 200, true, 'Group invitation info has been generated Successfully', codeResponse)
        } catch {
            return this.response(res, 500, false, 'Failed to get group invitation info.')
        }
    }

    async acceptGroupInvite(req, res) {
        const messageId = req.body.messageId

        try {
            const selected = await this.WLredis.getOne(this.session_id, messageId,'messages')
            if (!selected) {
                return this.response(res, 400, false, 'This message does not exist.')
            }

            let code = selected['metadata.code']
            let caption = selected['body']
            let title = selected['metadata.title']
            let remoteJid = selected['remoteJid']
            let expiration = Number(selected['metadata.expiration'])
            let time = Number(selected['time'])
            let codeResponse = await this.session.groupGetInviteInfo(code)
            let target = codeResponse.id

            const resp = await this.session.groupAcceptInviteV4(selected.remoteJid,{
                groupJid: target,
                groupName: title,
                groupType:0,
                caption:caption,
                inviteCode:code,
                inviteExpiration: expiration,
            })

            return this.response(res, 200, true, 'Group invitation has been accepted Successfully', {
                joinned: true,
                code: resp,
                remoteJid: target
            })
        } catch {
            return this.response(res, 500, false, 'Failed to accept group invitation.')
        }
    }

    async revokeGroupInvite(req, res) {
        let groupIdentifier;
        if(req.body.groupId){
            groupIdentifier = req.body.groupId
        }

        if(req.body.messageId){
            const selected = await this.WLredis.getOne(this.session_id, req.body.messageId,'messages')
            if (!selected) {
                return this.response(res, 400, false, 'This message does not exist.')
            }
            req.body['code'] = selected['metadata.code'];
        }

        if(req.body.code){
            let codeResponse = await this.session.groupGetInviteInfo(req.body.code)
            groupIdentifier = codeResponse.id;
        }

        try {
            const code = await this.session.groupRevokeInvite(groupIdentifier)
            return this.response(res, 200, true, 'Group invitation has been revoked Successfully', {
                revoked: true,
                code: code,
            })
        } catch {
            return this.response(res, 500, false, 'Failed to revoke group invitation.')
        }
    }   

    async sendGroupInviteMessage(req, res) {
        try {

            let imageURL = process.env.IMAGE_URL + '/groupImage.jpeg';
            let responseFile = await axios.get(imageURL, {responseType: 'arraybuffer'})
            let thumb = await generateThumbnail(responseFile.data,'image',{});

            let groupCode = await this.session.groupInviteCode(this.formatGroup(req.body.group));
            let link = 'https://chat.whatsapp.com/'+ groupCode;
            let codeResponse = await this.session.groupGetInviteInfo(groupCode)
            let groupName = codeResponse.subject ;

            const result = await this.session.sendMessage(this.target, {
                groupText: 'Follow this link to join my WhatsApp group: ' + link, 
                matchedText: link,
                title: groupName,
                description: 'WhatsApp Group Invite',
                inviteLinkGroupTypeV2: 0,
                jpegThumbnail:  thumb.thumbnail
            }, {})
            return this.response(res, 200, true, 'Group invitation has been Sent Successfully !!', result)   
        } catch (ex) {
            console.log(ex)
            return this.response(res, 500, false, 'Failed to Send group invitation.')
        }
    }

}