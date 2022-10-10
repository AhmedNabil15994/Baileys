"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Helper_1 = __importDefault(require("../helper/Helper"));
const whatsapp_1 = require("../whatsapp");
class Users extends Helper_1.default {
    async userStatus(req, res) {
        const session = (0, whatsapp_1.getSession)(res.locals.sessionId);
        const phone = this.formatPhone(req.body.phone);
        try {
            const exists = await this.isExists(session, phone, (!req.body.phone ? true : false));
            if (!exists) {
                return this.response(res, 400, false, 'The phone number does not exist.');
            }
            const status = await session.fetchStatus(phone);
            return this.response(res, 200, true, '', status);
        }
        catch (_a) {
            return this.response(res, 500, false, 'Failed to get user status.');
        }
    }
    async userPresence(req, res) {
        const session = (0, whatsapp_1.getSession)(res.locals.sessionId);
        const phone = this.formatPhone(req.body.phone);
        try {
            const exists = await this.isExists(session, phone, (!req.body.phone ? true : false));
            if (!exists) {
                return this.response(res, 400, false, 'The phone number does not exist.');
            }
            const presence = await session.presenceSubscribe(phone);
            return this.response(res, 200, true, '', presence);
        }
        catch (_a) {
            return this.response(res, 500, false, 'Failed to get user presence.');
        }
    }
    async userDisplayPicture(req, res) {
        const session = (0, whatsapp_1.getSession)(res.locals.sessionId);
        const phone = this.formatPhone(req.body.phone);
        try {
            const exists = await this.isExists(session, phone, (!req.body.phone ? true : false));
            if (!exists) {
                return this.response(res, 400, false, 'The phone number does not exist.');
            }
            const image = await session.profilePictureUrl(phone, 'image');
            return this.response(res, 200, true, '', image);
        }
        catch (_a) {
            return this.response(res, 500, false, 'Failed to get user display picture.');
        }
    }
    async blockUser(req, res) {
        const session = (0, whatsapp_1.getSession)(res.locals.sessionId);
        const phone = this.formatPhone(req.body.phone);
        try {
            const exists = await this.isExists(session, phone, (!req.body.phone ? true : false));
            if (!exists) {
                return this.response(res, 400, false, 'The phone number does not exist.');
            }
            const status = await session.updateBlockStatus(phone, 'block');
            return this.response(res, 200, true, '', status);
        }
        catch (_a) {
            return this.response(res, 500, false, 'Failed to block user.');
        }
    }
    async unblockUser(req, res) {
        const session = (0, whatsapp_1.getSession)(res.locals.sessionId);
        const phone = this.formatPhone(req.body.phone);
        try {
            const exists = await this.isExists(session, phone, (!req.body.phone ? true : false));
            if (!exists) {
                return this.response(res, 400, false, 'The phone number does not exist.');
            }
            const status = await session.updateBlockStatus(phone, 'unblock');
            return this.response(res, 200, true, '', status);
        }
        catch (_a) {
            return this.response(res, 500, false, 'Failed to unblock user.');
        }
    }
    async businessProfile(req, res) {
        const session = (0, whatsapp_1.getSession)(res.locals.sessionId);
        const phone = this.formatPhone(req.body.phone);
        try {
            const exists = await this.isExists(session, phone, (!req.body.phone ? true : false));
            if (!exists) {
                return this.response(res, 400, false, 'The phone number does not exist.');
            }
            const profile = await session.getBusinessProfile(phone);
            return this.response(res, 200, true, '', profile);
        }
        catch (_a) {
            return this.response(res, 500, false, 'Failed to get user profile.');
        }
    }
    async getProducts(req, res) {
        const session = (0, whatsapp_1.getSession)(res.locals.sessionId);
        const phone = this.formatPhone(req.body.phone);
        try {
            const exists = await this.isExists(session, phone, (!req.body.phone ? true : false));
            if (!exists) {
                return this.response(res, 400, false, 'The phone number does not exist.');
            }
            const products = await session.getCatalog(phone);
            return this.response(res, 200, true, '', products);
        }
        catch (ex) {
            console.log(ex);
            return this.response(res, 500, false, 'Failed to get user products or user doesnt have any products.');
        }
    }
    async getProduct(req, res) {
        // TODO: Fix Here
        // const session = getSession(res.locals.sessionId)
        // const phone = this.formatPhone(req.body.phone)
        // const { productId } = req.body
        // try {
        //     const exists = await this.isExists(session, phone, (!req.body.phone ? true : false))
        //     if (!exists) {
        //         return this.response(res, 400, false, 'The phone number does not exist.')
        //     }
        //     const product = await getProductById(session, phone, productId)
        //     return this.response(res, 200, true, '', product)
        // } catch (ex) {
        //     console.log(ex)
        //     return this.response(res, 500, false, 'Failed to get product or it doesnt exist.')
        // }
    }
    async getOrder(req, res) {
        const session = (0, whatsapp_1.getSession)(res.locals.sessionId);
        const { orderId, orderToken } = req.body;
        try {
            const order = await session.getOrderDetails(orderId, orderToken);
            return this.response(res, 200, true, '', order);
        }
        catch (ex) {
            console.log(ex);
            return this.response(res, 500, false, 'Failed to get order or it doesnt exist.');
        }
    }
}
exports.default = Users;
