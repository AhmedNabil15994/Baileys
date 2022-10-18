import { Router } from 'express'
import { body, query } from 'express-validator'
import requestValidator from '../Middleware/requestValidator'
import sessionValidator from '../Middleware/sessionValidator'
import Instance from '../Models/Instance'

const router = Router()

router.get(
    '/me',
    query('id').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Instance(req, res).me(req, res)
)

router.post(
    '/updateProfilePicture',
    query('id').notEmpty(),
    body('phone').notEmpty(),
    body('chat').if(body('phone').not().exists()).notEmpty(),
    body('imageURL').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Instance(req, res).updateProfilePicture(req, res)
)

router.post(
    '/updatePresence',
    query('id').notEmpty(),
    body('phone').notEmpty(),
    body('presence').isIn(['unavailable', 'available', 'composing', 'recording', 'paused']).notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Instance(req, res).updatePresence(req, res)
)

router.post(
    '/updateProfileName',
    query('id').notEmpty(),
    body('name').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Instance(req, res).updateProfileName(req, res)
)

router.post(
    '/updateProfileStatus',
    query('id').notEmpty(),
    body('status').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Instance(req, res).updateProfileStatus(req, res)
)

router.get('/contacts', query('id').notEmpty(), requestValidator, (req, res) => new Instance(req, res).fetchContacts(req, res))
router.post('/contacts/getContactByID', query('id').notEmpty(),body('phone').notEmpty(),body('chat').if(body('phone').not().exists()).notEmpty(), requestValidator, (req, res) => new Instance(req, res).getContactByID(req, res))

export default router
