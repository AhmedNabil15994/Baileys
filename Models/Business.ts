import { WA_DEFAULT_EPHEMERAL,generateMessageID,delay,generateThumbnail,extractImageThumb } from "@adiwajshing/baileys";
import Helper from "../helper/Helper";
import WLContactInterface from "../interfaces/WLContactInterface";
import WLConversationInterface from "../interfaces/WLConversationInterface";
import { getSession } from "../whatsapp";
import WLRedis from "./WLRedis";
import WLWebhook from './WLWebhook'
import axios from 'axios'
import {v4 as uuidv4} from 'uuid';

export default class Business extends Helper {

    private WLredis;
    private WLWebhook;
    private session;
    private session_id;
    private target;

    constructor(req, res) {
        super();
        // Connect to Redis
        this.WLredis = new WLRedis();
        this.WLWebhook = new WLWebhook();
        // set Session & target
        this.session = (res.locals.sessionId) ? getSession(res.locals.sessionId) : '';
        this.session_id = res.locals.sessionId
        if (req.body.phone || req.body.chat) {
            this.target = req.body.phone ? this.formatPhone(req.body.phone) : this.formatGroup(req.body.chat)
        }
    }

    async businessProfile(req, res) {
        try {
            const exists = await this.isBusiness(this.session, this.target)

            if (!exists) {
                return this.response(res, 400, true, "This profile isn't business account.",{
                    isBussines: 0,
                })
            }

            const profile = await this.session.getBusinessProfile(this.target)

            return this.response(res, 200, true, 'User Profile data generated Successfully', {
                isBussines: profile ? 1 : 0,
                profile
            })
        } catch {
            return this.response(res, 500, false, 'Failed to get user profile.')
        }
    }

    async getCollections(req, res) {
        try {
            let userId =  req.body.phone ? this.formatPhone(req.body.phone) : (this.session.user.id.indexOf(':') > 0 ?  this.session.user.id.split(':')[0]+'@s.whatsapp.net' : this.session.user.id)
            const exists = await this.isBusiness(this.session, userId)

            if (!exists) {
                return this.response(res, 400, true, "This profile isn't business account.")
            }
            const products = await this.session.getCollections(userId,10)

            return this.response(res, 200, true, 'User Collections Data Generated Successfully !!', products.collections)
        } catch (ex) {
            console.log(ex)
            return this.response(res, 500, false, 'Failed to get user collections or user doesnt have any collections.')
        }
    }

    async getOrder(req, res) {
        const { orderId, orderToken } = req.body
        try {
            let userId = this.session.user.id.indexOf(':') > 0 ?  this.session.user.id.split(':')[0]+'@s.whatsapp.net' : this.session.user.id
            const exists = await this.isBusiness(this.session, userId)

            if (!exists) {
                return this.response(res, 400, false, "This profile isn't business account.")
            }

            const order = await this.session.getOrderDetails(orderId, orderToken)
            if('price' in order){
                order.price.total = order.price.total / 1000 
            }

            if('products' in order){
                order.products.forEach( async (item) => {
                    item.price = item.price / 1000
                });
            }

            return this.response(res, 200, true, 'Order Data Generated Successfully !!', order)
        } catch (ex) {
            console.log(ex)
            return this.response(res, 500, false, 'Failed to get order or it doesnt exist.')
        }
    }

    async getProducts(req, res) {
        try {
            let userId =  req.body.phone ? this.formatPhone(req.body.phone) : (this.session.user.id.indexOf(':') > 0 ?  this.session.user.id.split(':')[0]+'@s.whatsapp.net' : this.session.user.id)
            const exists = await this.isBusiness(this.session, userId)

            if (!exists) {
                return this.response(res, 400, true, "This profile isn't business account.")
            }

            const products = await this.session.getCatalog(userId)
            await this.WLredis.setProducts(this.session_id, products.products);
            products.products.forEach( async (item) => {
                item.price = item.price / 1000
            });
            return this.response(res, 200, true, 'User Products Data Generated Successfully !!', products.products)
        } catch (ex) {
            console.log(ex)
            return this.response(res, 500, false, 'Failed to get user products.')
        }
    }

    async getProduct(req, res) {
        try {
            let userId = this.session.user.id.indexOf(':') > 0 ?  this.session.user.id.split(':')[0]+'@s.whatsapp.net' : this.session.user.id
            const exists = await this.isBusiness(this.session, userId)

            if (!exists) {
                return this.response(res, 400, false, "This profile isn't business account.")
            }

            let productObj = await this.WLredis.getProduct(this.session_id, req.body.productId);
            productObj.price = productObj.price / 1000
            return this.response(res, 200, true, 'Product Data Generated Successfully !!', productObj)
        } catch (ex) {
            console.log(ex)
            return this.response(res, 500, false, 'Failed to get product or it doesnt exist.')
        }
    }

    async productCreate(req, res) {
        try {
            let userId = this.session.user.id.indexOf(':') > 0 ?  this.session.user.id.split(':')[0]+'@s.whatsapp.net' : this.session.user.id
            const exists = await this.isBusiness(this.session, userId)

            if (!exists) {
                return this.response(res, 400, false, "This profile isn't business account.")
            }

            req.body.availability = "in stock"
            req.body.images = [{
                url: req.body.image
            }]
            delete req.body['image'];

            req.body.isHidden = req.body.isHidden
            req.body.price = Number(req.body.price) * 1000
            req.body.originCountryCode = undefined

            const order = await this.session.productCreate(req.body)
            await this.WLWebhook.setProduct(this.session_id, order);
            return this.response(res, 200, true, 'Product Created Successfully !!', order)
        } catch (ex) {
            console.log(ex)
            return this.response(res, 500, false, 'Failed to Create Product.')
        }
    }

    async productUpdate(req, res) {
        try {
            let userId = this.session.user.id.indexOf(':') > 0 ?  this.session.user.id.split(':')[0]+'@s.whatsapp.net' : this.session.user.id
            const exists = await this.isBusiness(this.session, userId)

            if (!exists) {
                return this.response(res, 400, false, "This profile isn't business account.")
            }

            let productObj = await this.WLredis.getProduct(this.session_id, req.body.productId);
            let imageObj = {}
            if(req.body.image){
                imageObj['url'] = req.body.image;
            }else{
                imageObj['url'] = productObj['imageUrls.original'];
            }

            if(productObj){
                let newObj = {
                    currency: productObj.currency,
                    price: productObj.price,
                    name: productObj.name,
                    description: productObj.description,
                    isHidden: productObj.isHidden,
                    images: [imageObj],
                }
                if(req.body.hasOwnProperty('isHidden')){
                    newObj.isHidden = req.body.isHidden
                }
                if(req.body.hasOwnProperty('name')){
                    newObj.name = req.body.name
                }
                if(req.body.hasOwnProperty('description')){
                    newObj.description = req.body.description
                }
                if(req.body.hasOwnProperty('price')){
                    newObj.price = req.body.price * 1000
                }
                if(req.body.hasOwnProperty('currency')){
                    newObj.currency = req.body.currency
                }
                const order = await this.session.productUpdate(req.body.productId,newObj)
                await this.WLWebhook.updateProduct(this.session_id, order);

                order.price = order.price / 1000
                return this.response(res, 200, true, 'Product Updated Successfully !!', order)
            }
        } catch (ex) {
            console.log(ex)
            return this.response(res, 500, false, 'Failed to Update Product.')
        }
    }

    async productDelete(req, res) {
        try {
            let userId = this.session.user.id.indexOf(':') > 0 ?  this.session.user.id.split(':')[0]+'@s.whatsapp.net' : this.session.user.id
            const exists = await this.isBusiness(this.session, userId)

            if (!exists) {
                return this.response(res, 400, false, "This profile isn't business account.")
            }

            let products = req.body.productIds;
            const order = await this.session.productDelete(products)
            products.forEach(async (product_id) =>{
                await this.WLWebhook.deleteProduct(this.session_id, product_id);
            })
            return this.response(res, 200, true, 'Products Deleted Successfully !!', order)
        } catch (ex) {
            console.log(ex)
            return this.response(res, 500, false, 'Failed to Delete Product.')
        }
    }

    async sendProduct(req, res) {
        try {
            let userId = this.session.user.id.indexOf(':') > 0 ?  this.session.user.id.split(':')[0]+'@s.whatsapp.net' : this.session.user.id
            const exists = await this.isBusiness(this.session, userId)

            if (!exists) {
                return this.response(res, 400, false, "This profile isn't business account.")
            }

            const found = await this.onWhatsApp(this.session, this.target)

            if (!found) {
                return this.response(res, 400, false, 'This chat does not exist.')
            }

            let productObj = await this.WLredis.getProduct(this.session_id, req.body.productId);
            if(productObj){
                const result = await this.session.sendMessage(this.target, {
                    product:{
                        productId: req.body.productId, 
                        title: productObj.name, 
                        description: productObj.description, 
                        priceAmount1000: Number(productObj.price) * 1000,
                        currencyCode: productObj.currency,
                        productImage:{
                            url:productObj['imageUrls.original'],
                        },
                    },
                    businessOwnerJid: this.session.user.id.indexOf(':') > 0 ?  this.session.user.id.split(':')[0]+'@s.whatsapp.net' : this.session.user.id ,
                }, {})
                return this.response(res, 200, true, 'Product has been Sent Successfully !!', result)
            }            
            return this.response(res, 500, false, 'Failed to Send Product.')
        } catch (ex) {
            console.log(ex)
            return this.response(res, 500, false, 'Failed to Send Product.')
        }
    }

    async sendCatalog(req, res) {
        try {
            let userId = this.session.user.id.indexOf(':') > 0 ?  this.session.user.id.split(':')[0]+'@s.whatsapp.net' : this.session.user.id
            const exists = await this.isBusiness(this.session, userId)

            if (!exists) {
                return this.response(res, 400, false, "This profile isn't business account.")
            }

            const found = await this.onWhatsApp(this.session, this.target)

            if (!found) {
                return this.response(res, 400, false, 'This chat does not exist.')
            }

            let products =  await this.WLredis.getProducts(this.session_id);
            let imageURL = products[0]['imageUrls.original'];

            let responseFile = await axios.get(imageURL, {responseType: 'arraybuffer'})
            let thumb = await generateThumbnail(responseFile.data,'image',{});

            let link = 'https://wa.me/c/'+ (this.session.user.id.indexOf(':') > 0 ?  this.session.user.id.split(':')[0] : this.session.user.id)
            const result = await this.session.sendMessage(this.target, {
                catalogText: 'Follow this link to view our catalog on WhatsApp: ' + link, 
                matchedText: link,
                title: this.session.user.name,
                canonicalUrl: '',
                description: '',
                inviteLinkGroupTypeV2: 0,
                jpegThumbnail:  thumb.thumbnail
            }, {})
            return this.response(res, 200, true, 'Catalog has been Sent Successfully !!', result)   
        } catch (ex) {
            console.log(ex)
            return this.response(res, 500, false, 'Failed to Send Catalog.')
        }
    }

    async getLabels(req, res) {
        try {
            let userId = this.session.user.id.indexOf(':') > 0 ?  this.session.user.id.split(':')[0]+'@s.whatsapp.net' : this.session.user.id
            const exists = await this.isBusiness(this.session, userId)

            if (!exists) {
                return this.response(res, 400, false, "This profile isn't business account.")
            }

            const labels = await this.WLredis.getLabels(this.session_id);
            return this.response(res, 200, true, 'User Labels Data Generated Successfully !!', labels)
        } catch (ex) {
            console.log(ex)
            return this.response(res, 500, false, 'Failed to get user labels.')
        }
    }

    async labelChat(req, res) {
        const labelId = req.body.labelId
        try {
            let userId = this.session.user.id.indexOf(':') > 0 ?  this.session.user.id.split(':')[0]+'@s.whatsapp.net' : this.session.user.id
            const exists = await this.isBusiness(this.session, userId)

            if (!exists) {
                return this.response(res, 400, false, "This profile isn't business account.")
            }

            const found = await this.onWhatsApp(this.session, this.target)

            if (!found) {
                return this.response(res, 400, false, 'This chat does not exist.')
            }


            const status = await this.session.chatModify(
                { 
                    labelAssociation:{labeled:true,label_id:labelId,jid:this.target,name:req.body.name,color:req.body.color,deleted:false} 
                }, this.target)

            return this.response(res, 200, true, 'Chat has been labeled Successfully !!', {
                labeled: true,
                remoteJid: this.target
            })
        } catch (error) {
            return this.response(res, 500, false, 'Failed to label chat. ' + error)
        }
    }

    async unlabelChat(req, res) {
        const labelId = req.body.labelId
        try {
            let userId = this.session.user.id.indexOf(':') > 0 ?  this.session.user.id.split(':')[0]+'@s.whatsapp.net' : this.session.user.id
            const exists = await this.isBusiness(this.session, userId)

            if (!exists) {
                return this.response(res, 400, false, "This profile isn't business account.")
            }

            const found = await this.onWhatsApp(this.session, this.target)

            if (!found) {
                return this.response(res, 400, false, 'This chat does not exist.')
            }

            const status = await this.session.chatModify(
                { 
                    labelAssociation:{labeled:false,label_id:labelId,jid:this.target,name:req.body.name,color:req.body.color,deleted:false} 
                }, this.target)

            return this.response(res, 200, true, 'Chat has been unlabeled Successfully !!', {
                labeled: false,
                remoteJid: this.target
            })
        } catch (error) {
            return this.response(res, 500, false, 'Failed to unlabel chat. ' + error)
        }
    }

    async labelMessage(req, res) {
        const labelId = req.body.labelId
        try {
            let userId = this.session.user.id.indexOf(':') > 0 ?  this.session.user.id.split(':')[0]+'@s.whatsapp.net' : this.session.user.id
            const exists = await this.isBusiness(this.session, userId)

            if (!exists) {
                return this.response(res, 400, false, "This profile isn't business account.")
            }

            const selected = await this.WLredis.getMessage(this.session_id, req.body.messageId)
            if (!selected) {
                return this.response(res, 400, false, 'This message does not exist.')
            }

            const status = await this.session.chatModify(
                { 
                    labelMessage:{
                        labeled:true,
                        label_id:labelId,
                        jid:selected.remoteJid,
                        fromMe:selected.fromMe,
                        messageId:req.body.messageId,
                    } 
                }, selected.remoteJid)

            return this.response(res, 200, true, 'Message has been labeled Successfully !!', {
                labeled: true,
                remoteJid: selected.remoteJid,
                messageId: req.body.messageId,
                label_id:labelId,
            })
        } catch (error) {
            return this.response(res, 500, false, 'Failed to label message. ' + error)
        }
    }

    async unlabelMessage(req, res) {
        const labelId = req.body.labelId
        try {
            let userId = this.session.user.id.indexOf(':') > 0 ?  this.session.user.id.split(':')[0]+'@s.whatsapp.net' : this.session.user.id
            const exists = await this.isBusiness(this.session, userId)

            if (!exists) {
                return this.response(res, 400, false, "This profile isn't business account.")
            }

            const selected = await this.WLredis.getMessage(this.session_id, req.body.messageId)
            if (!selected) {
                return this.response(res, 400, false, 'This message does not exist.')
            }

            const status = await this.session.chatModify(
                { 
                    labelMessage:{
                        labeled:false,
                        label_id:labelId,
                        jid:selected.remoteJid,
                        fromMe:selected.fromMe,
                        messageId:req.body.messageId,
                    } 
                }, selected.remoteJid)

            return this.response(res, 200, true, 'Message has been unlabeled Successfully !!', {
                labeled: false,
                remoteJid: selected.remoteJid,
                messageId: req.body.messageId,
                label_id:labelId,
            })
        } catch (error) {
            return this.response(res, 500, false, 'Failed to unlabel message. ' + error)
        }
    }
 
    async createLabel(req, res) {
        const target = this.session.user.id.indexOf(':') > 0 ?  this.session.user.id.split(':')[0]+'@s.whatsapp.net' : this.session.user.id 
        const label_id = req.body.labelId
        try {

            const status = await this.session.chatModify(
                { labelEdit:{label_id:label_id,name:req.body.name,color:req.body.color,deleted:false} 
            }, target)
            await this.WLWebhook.setLabel(this.session_id, {id:label_id,name:req.body.name,color:req.body.color,deleted:false});

            return this.response(res, 200, true, 'Label has been Created Successfully !!', status)
        } catch (error) {
            return this.response(res, 500, false, 'Failed to create label. ' + error)
        }
    }

    async updateLabel(req, res) {
        const target = this.session.user.id.indexOf(':') > 0 ?  this.session.user.id.split(':')[0]+'@s.whatsapp.net' : this.session.user.id 
        const label_id = req.body.labelId
        try {
            // const status = await this.session.labelUpdate(req.body.labelId,{
            //     name:req.body.name,color:req.body.color,deleted:false
            // })
            // console.log(status)
            const status = await this.session.chatModify(
                { labelEdit:{label_id:label_id,name:req.body.name,color:req.body.color,deleted:false} 
            }, target)
            // await this.WLWebhook.updateLabel(this.session_id, {id:label_id,name:req.body.name,color:req.body.color,deleted:false});

            return this.response(res, 200, true, 'Label has been updated Successfully !!', status)
        } catch (error) {
            return this.response(res, 500, false, 'Failed to update label. ' + error)
        }
    }

    async deleteLabel(req, res) {
        const target = this.session.user.id.indexOf(':') > 0 ?  this.session.user.id.split(':')[0]+'@s.whatsapp.net' : this.session.user.id 
        const label_id = req.body.labelId
        try {
            const status = await this.session.chatModify(
                { labelEdit:{label_id:label_id,name:req.body.name,color:req.body.color,deleted:true} 
            }, target)
            await this.WLWebhook.deleteLabel(this.session_id, label_id);

            return this.response(res, 200, true, 'Label has been deleted Successfully !!', status)
        } catch (error) {
            return this.response(res, 500, false, 'Failed to delete label. ' + error)
        }
    }

    async getQuickReplies(req, res) {
        try {
            const quickReplies = await this.WLredis.getReplies(this.session_id);
            return this.response(res, 200, true, 'User Quick Replies Data Generated Successfully !!', quickReplies)
        } catch (ex) {
            console.log(ex)
            return this.response(res, 500, false, 'Failed to get user quick replies.')
        }
    }

    async createQuickReply(req, res) {
        const target = this.session.user.id.indexOf(':') > 0 ?  this.session.user.id.split(':')[0]+'@s.whatsapp.net' : this.session.user.id 
        const reply_id = uuidv4()

        try {

            const status = await this.session.chatModify(
                { quickReply:{message:req.body.message,shortcut:req.body.shortcut,deleted:false} 
            }, target)
            // await this.WLWebhook.setReply(res.locals.sessionId, {id:reply_id,message:req.body.message,shortcut:req.body.shortcut,deleted:false});
            // let replyObj = await this.WLredis.getReply(this.session_id,reply_id)
            // if(replyObj){
            //     await this.WLWebhook.deleteReply(this.session_id, reply_id);
            // }
            return this.response(res, 200, true, 'Quick Reply has been Created Successfully !!', status)
        } catch (error) {
            return this.response(res, 500, false, 'Failed to create quick reply. ' + error)
        }
    }

    async updateQuickReply(req, res) {
        const target = this.session.user.id.indexOf(':') > 0 ?  this.session.user.id.split(':')[0]+'@s.whatsapp.net' : this.session.user.id 
        const reply_id = req.body.reply_id
        try {

            const status = await this.session.chatModify(
                { quickReply:{id:reply_id,message:req.body.message,shortcut:req.body.shortcut,deleted:false} 
            }, target)
            await this.WLWebhook.updateReply(this.session_id, {id:reply_id,message:req.body.message,shortcut:req.body.shortcut,deleted:false});

            return this.response(res, 200, true, 'Quick Reply has been Update Successfully !!', {
                id:reply_id,
                message:req.body.message,
                shortcut:req.body.shortcut,
            })
        } catch (error) {
            return this.response(res, 500, false, 'Failed to update quick reply. ' + error)
        }
    }

    async deleteQuickReply(req, res) {
        const target = this.session.user.id.indexOf(':') > 0 ?  this.session.user.id.split(':')[0]+'@s.whatsapp.net' : this.session.user.id 
        const reply_id = req.body.reply_id
        try {
            let replyObj = await this.WLredis.getReply(this.session_id,reply_id)
            if(replyObj){
                replyObj.deleted = true
                const status = await this.session.chatModify({ quickReply: replyObj }, target)
                await this.WLWebhook.deleteReply(this.session_id, reply_id);
                return this.response(res, 200, true, 'Quick Reply has been Deleted Successfully !!', {
                    deleted:true,
                })
            }
            return this.response(res, 500, false, 'Failed to delete quick reply. ')
        } catch (error) {
            return this.response(res, 500, false, 'Failed to delete quick reply. ' + error)
        }
    }
}