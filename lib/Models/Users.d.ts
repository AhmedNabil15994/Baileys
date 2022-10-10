import Helper from "../helper/Helper";
export default class Users extends Helper {
    userStatus(req: any, res: any): Promise<void>;
    userPresence(req: any, res: any): Promise<void>;
    userDisplayPicture(req: any, res: any): Promise<void>;
    blockUser(req: any, res: any): Promise<void>;
    unblockUser(req: any, res: any): Promise<void>;
    businessProfile(req: any, res: any): Promise<void>;
    getProducts(req: any, res: any): Promise<void>;
    getProduct(req: any, res: any): Promise<void>;
    getOrder(req: any, res: any): Promise<void>;
}
