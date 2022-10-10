import Helper from "../helper/Helper";
export default class Session extends Helper {
    private statues;
    private WLRedis;
    constructor();
    find(res: any): void;
    status(res: any): void;
    add(req: any, res: any): void;
    del(req: any, res: any): void;
    clearInstance(req: any, res: any): void;
}
