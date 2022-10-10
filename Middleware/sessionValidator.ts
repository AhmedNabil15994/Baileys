import { getSession } from '../whatsapp'
import response from '../response'

const validate = (req, res, next) => {
    try {
        let semgentsArr = `${req.originalUrl}`.split('/');
        const sessionId = req.query.id ?? req.params.id;
        const states = ['connecting', 'connected', 'disconnecting', 'disconnected']
        if (!getSession(sessionId) && semgentsArr[1] != 'messages') {
            return response(res, 404, false, 'Session not found.')
        }
        let session = getSession(sessionId);
        let state;
        (session != null) ? state = states[session.ws.readyState] : state = 'disconnected';
        state = (state === 'connected' && typeof (session.isLegacy ? session.state.legacy.user : session.user) !== 'undefined') ? 'authenticated' : state;
        if (state !== "authenticated" && semgentsArr[1] != 'messages') {
            (process.env.DEBUG_MODE == 'true') ? console.log('sessionValidator sessionId : ' + sessionId + ' state: ' + state) : '';
            return response(res, 404, false, 'User Not authenticated.')
        }

        res.locals.sessionId = sessionId
        next()
    } catch (error) {
        console.log('sessionValidator ' + error)
    }
}

export default validate
