import { Router } from 'express'
import { body, query } from 'express-validator'
import requestValidator from '../Middleware/requestValidator'
import sessionValidator from '../Middleware/sessionValidator'
import Chats from '../Models/Chats'

const router = Router()

router.get('/', query('id').notEmpty(), requestValidator, (req, res) => new Chats(req, res).fetchDialogs(req, res))
router.get('/myChats', query('id').notEmpty(), requestValidator, (req, res) => new Chats(req, res).myChats(req, res))
router.post('/getChatByID', query('id').notEmpty(),body('phone'),body('chat').if(body('phone').not().exists()).notEmpty(), requestValidator, (req, res) => new Chats(req, res).getChat(req, res))

router.post(
    '/deleteChat',
    query('id').notEmpty(),
    body('phone'),
    body('chat').if(body('phone').not().exists()).notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Chats(req, res).deleteChat(req, res)
)

router.post(
    '/clearChat',
    query('id').notEmpty(),
    body('phone'),
    body('chat').if(body('phone').not().exists()).notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Chats(req, res).clearChat(req, res)
)

router.post(
    '/readChat',
    query('id').notEmpty(),
    body('phone'),
    body('chat').if(body('phone').not().exists()).notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Chats(req, res).readChat(req, res)
)

router.post(
    '/unreadChat',
    query('id').notEmpty(),
    body('phone'),
    body('chat').if(body('phone').not().exists()).notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Chats(req, res).unreadChat(req, res)
)

router.post(
    '/archiveChat',
    query('id').notEmpty(),
    body('phone'),
    body('chat').if(body('phone').not().exists()).notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Chats(req, res).archiveChat(req, res)
)

router.post(
    '/unarchiveChat',
    query('id').notEmpty(),
    body('phone'),
    body('chat').if(body('phone').not().exists()).notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Chats(req, res).unarchiveChat(req, res)
)

router.post(
    '/muteChat',
    query('id').notEmpty(),
    body('phone'),
    body('chat').if(body('phone').not().exists()).notEmpty(),
    body('duration').isInt().notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Chats(req, res).muteChat(req, res)
)

router.post(
    '/unmuteChat',
    query('id').notEmpty(),
    body('phone'),
    body('chat').if(body('phone').not().exists()).notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Chats(req, res).unmuteChat(req, res)
)

router.post(
    '/pinChat',
    query('id').notEmpty(),
    body('phone'),
    body('chat').if(body('phone').not().exists()).notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Chats(req, res).pinChat(req, res)
)

router.post(
    '/unpinChat',
    query('id').notEmpty(),
    body('phone'),
    body('chat').if(body('phone').not().exists()).notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Chats(req, res).unpinChat(req, res)
)

router.post(
    '/typing',
    query('id').notEmpty(),
    body('phone'),
    body('chat').if(body('phone').not().exists()).notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Chats(req, res).setTyping(req, res)
)

router.post(
    '/recording',
    query('id').notEmpty(),
    body('phone'),
    body('chat').if(body('phone').not().exists()).notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Chats(req, res).setRecording(req, res)
)

export default router
