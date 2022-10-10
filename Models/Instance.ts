import { existsSync, readFileSync } from "fs";
import Helper from "../helper/Helper";
import WLMeInterface from "../interfaces/WLMeInterface";
import WLContactInterface from "../interfaces/WLContactInterface";
import { getSession } from "../whatsapp";
import axios from 'axios'
import WLRedis from "./WLRedis";

export default class Instance extends Helper {

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


    async me(req, res) {
        try {
            let dataObj = {}
            let phone,image,presence,status,profile 

            if(this.session){
                dataObj['me'] = this.session.user
                phone = this.session.user.id.replace('@s.whatsapp.net','').split(':')[0]
                try{
                    presence = await this.session.presenceSubscribe(this.formatPhone(phone))
                    status = await this.session.fetchStatus(this.formatPhone(phone))
                    profile = await this.session.getBusinessProfile(this.formatPhone(phone))
                }catch{}
                try{
                    image = await this.session.profilePictureUrl(this.formatPhone(phone), 'image')
                }catch{}

            }else{
                if(existsSync('./sessions/md_'+this.session_id+'/creds.json')){
                    let dataStore =  await JSON.parse(readFileSync('./sessions/md_'+this.session_id+'/creds.json', 'utf8'))
                    if(dataStore.me){
                        dataObj['me'] = dataStore.me
                        phone = dataStore.me.id.replace('@s.whatsapp.net','').split(':')[0]
                    }
                }
            }
            
            if(dataObj.hasOwnProperty('me')){
                dataObj['me'] = {
                    phone: phone,
                    name: dataObj['me']['name']
                }
                dataObj['image'] = image;
                dataObj['presence'] = presence;
                dataObj['status'] = status;
                dataObj['isBussines'] = profile ? 1 : 0;
                dataObj['businessProfile'] = profile ? profile : null;
                if(profile){
                    delete dataObj['businessProfile']['wid']
                }        
            }
            
            return this.response(res, 200, true, 'User data has been generated Successfully', dataObj)
        } catch {
            return this.response(res, 500, false, 'Failed to get user Data.')
        }
    }

    async updateProfilePicture(req, res) {
        const imageURL = req.body.imageURL

        try {
            const exists = await this.onWhatsApp(this.session, this.target)

            if (!exists) {
                return this.response(res, 400, false, 'This chat does not exist.')
            }

            let responseFile = await axios.get(imageURL, {responseType: 'arraybuffer'})

            const updated = await this.session.updateProfilePicture(this.target, responseFile.data)

            return this.response(res, 200, true, 'User profile picture updated Successfully',{
                updated:true,
                url: imageURL
            })
        } catch {
            return this.response(res, 500, false, 'Failed to set user profile picture.')
        }
    }

    async updatePresence(req, res) {
        const presenceText = req.body.presence

        try {
            const exists = await this.onWhatsApp(this.session, this.target)

            if (!exists) {
                return this.response(res, 400, false, 'The phone number does not exist.')
            }

            const presence = await this.session.sendPresenceUpdate(presenceText,this.target)

            return this.response(res, 200, true, 'User presence updated Successfully', {
                updated:true,
                presence: presenceText == 'composing' ? 'typing' : presenceText
            })
        } catch {
            return this.response(res, 500, false, 'Failed to update user presence.')
        }
    }

    async updateProfileName(req, res) {
        const name = req.body.name

        try {
            const presence = await this.session.updateProfileName(name)
            return this.response(res, 200, true, 'User profile name updated Successfully', {
                updated:true,
                pushName: name
            })
        } catch {
            return this.response(res, 500, false, 'Failed to update user profile name.')
        }
    }

    async updateProfileStatus(req, res) {
        const status = req.body.status

        try {
            const presence = await this.session.updateProfileStatus(status)
            return this.response(res, 200, true, 'User profile status updated Successfully', {
                updated:true,
                status: status
            })
        } catch {
            return this.response(res, 500, false, 'Failed to update user profile status.')
        }
    }

    async fetchContacts(req, res) {
        try {
            let contacts: WLContactInterface[] = await this.WLredis.getContacts(this.session_id);
            let contactsArr: WLContactInterface[] = []
            await Promise.all(Object.values(contacts).map(async (contact) => {
                try {
                    contact.image = await this.session.profilePictureUrl(contact.id)
                } catch (e) {
                    (process.env.DEBUG_MODE == 'true') ? console.log('fetching contact image error', contact.id) : '';
                }
                contactsArr.push(contact)
            }));
            this.response(res, 200, true, 'User Contacts Found !!!', contactsArr)
        } catch {
            this.response(res, 500, false, 'Failed to load user contacts.')
        }
    }

    async getContactByID(req, res) {
        try {
            let selected:WLContactInterface[] = await this.WLredis.getContact(this.session_id,this.target)
            let image = '';
            let chatObj;
            if(selected.hasOwnProperty('id')){
                try {
                    image = await this.session.profilePictureUrl(selected['id'])
                } catch (e) {
                    (process.env.DEBUG_MODE == 'true') ? console.log('fetching contact image error', selected['id']) : '';
                }
                chatObj = selected
                chatObj['image'] = image;
            }
            this.response(res, 200, true, 'Contact Found !!!', chatObj)
        } catch (error) {
            this.response(res, 500, false, 'Failed to load Contact : ' + error)
        }

    }
}