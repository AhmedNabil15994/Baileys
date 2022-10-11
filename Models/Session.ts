import Helper from "../helper/Helper";
import { createSession, deleteSession, getSession,sessionsDir } from "../whatsapp";
import WLRedis from './WLRedis';


export default class Session extends Helper {

    private statues = ['connecting', 'connected', 'disconnecting', 'disconnected'];
    private WLRedis;

    constructor() {
        super();
        this.WLRedis = new WLRedis();
    }

    find(res) {
        this.response(res, 200, true, 'Session found.')
    }

    status(res) {
        const session = getSession(res.locals.sessionId)
        let state;
        (session != null) ? state = this.statues[session.ws.readyState] : state = 'disconnected';
        state = (state === 'connected') ? 'connected' : state;
        this.response(res, 200, true, '', { status: state })
    }

    add(req, res) {
        // TODO: security session created without auth 
        (this.isSessionExists(req.body.id) == 1) ?
            this.response(res, 409, false, 'Session already exists, please use another id.') : createSession(req.body.id, res);
    }

    del(req, res) {
        
        this.clearInstance(req, res);
    }

    clearInstance(req, res) {
        (getSession(req.params.id)) ? getSession(req.params.id).logout() : "";
        deleteSession(req.params.id, true);
        this.WLRedis.deleteSession(req.params.id);
        createSession(req.params.id, res)
        this.response(res, 200, true, 'The session has been successfully deleted.');
    }

}




