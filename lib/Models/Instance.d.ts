import Helper from "../helper/Helper";
export default class Instance extends Helper {
    setPresence(req: any, res: any): Promise<void>;
    setDisplayPicture(req: any, res: any): Promise<void>;
    createProduct(req: any, res: any): Promise<void>;
    updateProduct(req: any, res: any): Promise<void>;
    deleteProduct(req: any, res: any): Promise<void>;
    me(req: any, res: any): Promise<void>;
}
