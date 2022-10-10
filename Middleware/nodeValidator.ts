import { getSession } from '../whatsapp'
import response from '../response'

const validator = (req, res, next) => {
    try {
        const sessionId = req.query.id ?? req.params.id
        if (!getSession(sessionId)) {
            return response(res, 404, false, 'Session not found.')
        }
        res.locals.sessionId = sessionId
        next()
    } catch (error) {
        console.log('validator ' + error)
    }
}

export default validator
