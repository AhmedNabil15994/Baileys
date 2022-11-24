import { Router } from 'express'
import { body, query } from 'express-validator'
import requestValidator from '../Middleware/requestValidator'
import sessionValidator from '../Middleware/sessionValidator'
import Message from '../Models/Message'
// import getMessages from '../controllers/getMessages';
const router = Router()


router.get('/', query('id').notEmpty(), requestValidator, (req, res) => new Message(req, res).fetchMessages(req, res))
router.post('/getMessageByID', query('id').notEmpty(), body('phone'), body('messageId').notEmpty(), requestValidator, (req, res) => new Message(req, res).findMessage(req, res))

router.post(
    '/sendOFFMessage',
    query('id').notEmpty(),
    body('message').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Message(req, res).sendOFFMessage(req, res)
)


router.post(
    '/sendMessage',
    query('id').notEmpty(),
    body('phone'),
    body('chat').if(body('phone').not().exists()).notEmpty(),
    body('body').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Message(req, res).send(req, res,1)
)

router.post(
    '/sendImage',
    query('id').notEmpty(),
    body('phone'),
    body('chat').if(body('phone').not().exists()).notEmpty(),
    body('url').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Message(req, res).send(req, res,2)
)

router.post(
    '/sendVideo',
    query('id').notEmpty(),
    body('phone'),
    body('chat').if(body('phone').not().exists()).notEmpty(),
    body('url').notEmpty(),
    body('caption'),
    requestValidator,
    sessionValidator,
    (req, res) => new Message(req, res).send(req, res,3)
)

router.post(
    '/sendAudio',
    query('id').notEmpty(),
    body('phone'),
    body('chat').if(body('phone').not().exists()).notEmpty(),
    body('url').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Message(req, res).send(req, res,4)
)

router.post(
    '/sendFile',
    query('id').notEmpty(),
    body('phone'),
    body('chat').if(body('phone').not().exists()).notEmpty(),
    body('url').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Message(req, res).send(req, res,5)
)

router.post(
    '/sendStiker',
    query('id').notEmpty(),
    body('phone'),
    body('chat').if(body('phone').not().exists()).notEmpty(),
    body('url').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Message(req, res).send(req, res,6)
)

router.post(
    '/sendGif',
    query('id').notEmpty(),
    body('phone'),
    body('chat').if(body('phone').not().exists()).notEmpty(),
    body('url').notEmpty(),
    body('caption'),
    requestValidator,
    sessionValidator,
    (req, res) => new Message(req, res).send(req, res,7)
)

router.post(
    '/sendLocation',
    query('id').notEmpty(),
    body('phone'),
    body('chat').if(body('phone').not().exists()).notEmpty(),
    body('lat').notEmpty(),
    body('lng').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Message(req, res).send(req, res,8)
)

router.post(
    '/sendContact',
    query('id').notEmpty(),
    body('phone'),
    body('chat').if(body('phone').not().exists()).notEmpty(),
    body('name').notEmpty(),
    body('contact').notEmpty(),
    body('organization'),
    requestValidator,
    sessionValidator,
    (req, res) => new Message(req, res).send(req, res,9)
)

router.post(
    '/sendDisappearingMessage',
    query('id').notEmpty(),
    body('phone'),
    body('chat').if(body('phone').not().exists()).notEmpty(),
    body('body').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Message(req, res).send(req, res,10)
)

router.post(
    '/sendMention',
    query('id').notEmpty(),
    body('phone'),
    body('chat').if(body('phone').not().exists()).notEmpty(),
    body('mention').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Message(req, res).send(req, res,11)
)

router.post(
    '/sendPoll',
    query('id').notEmpty(),
    body('phone'),
    body('chat').if(body('phone').not().exists()).notEmpty(),
    body('body').notEmpty(),
    body('options').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Message(req, res).send(req, res,20)
)

router.post(
    '/sendReaction',
    query('id').notEmpty(),
    body('phone'),
    body('chat').if(body('phone').not().exists()).notEmpty(),
    body('body').notEmpty(),
    body('messageId').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Message(req, res).send(req, res,12)
)

router.post(
    '/sendButtons',
    query('id').notEmpty(),
    body('phone'),
    body('chat').if(body('phone').not().exists()).notEmpty(),
    body('body').notEmpty(),
    body('footer').notEmpty(),
    body('buttons').notEmpty(),
    body('hasImage').notEmpty(),
    body('imageURL'),
    requestValidator,
    sessionValidator,
    (req, res) => new Message(req, res).send(req, res,13)
)
router.post(
    '/sendButtonsTemplate',
    query('id').notEmpty(),
    body('phone'),
    body('chat').if(body('phone').not().exists()).notEmpty(),
    body('body').notEmpty(),
    body('footer').notEmpty(),
    body('buttons').notEmpty(),
    body('hasImage').notEmpty(),
    body('imageURL'),
    requestValidator,
    sessionValidator,
    (req, res) => new Message(req, res).send(req, res,14)
)

router.post(
    '/sendListMessage',
    query('id').notEmpty(),
    body('phone'),
    body('chat').if(body('phone').not().exists()).notEmpty(),
    body('body').notEmpty(),
    body('footer').notEmpty(),
    body('sections').notEmpty(),
    body('title').notEmpty(),
    body('buttonText').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Message(req, res).send(req, res,15)
)

router.post(
    '/sendPreview',
    query('id').notEmpty(),
    body('body').notEmpty(),
    body('url').notEmpty(),
    body('title').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Message(req, res).send(req, res,16)
)

router.post(
    '/sendReply',
    query('id').notEmpty(),
    body('phone'),
    body('chat').if(body('phone').not().exists()).notEmpty(),
    body('messageType').notEmpty(),
    body('messageData').notEmpty(),
    body('messageId').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Message(req, res).sendReply(req, res)
)

router.post(
    '/sendGroupMessage',
    query('id').notEmpty(),
    body('phones'),
    body('chats').if(body('phones').not().exists()).notEmpty(),
    body('messageType').notEmpty(),
    body('messageData').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Message(req, res).sendGroupMessage(req, res)
)

router.post(
    '/forwardMessage',
    query('id').notEmpty(),
    body('phone'),
    body('chat').if(body('phone').not().exists()).notEmpty(),
    body('messageId').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Message(req, res).forwardMessage(req, res)
)

router.post(
    '/deleteMessage',
    query('id').notEmpty(),
    body('messageId').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Message(req, res).deleteMessage(req, res)
)

router.post(
    '/deleteMessageForMe',
    query('id').notEmpty(),
    body('messageId').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Message(req, res).deleteMessageForMe(req, res)
)

router.post(
    '/starMessage',
    query('id').notEmpty(),
    body('messageId').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Message(req, res).starMessage(req, res)
)

router.post(
    '/unstarMessage',
    query('id').notEmpty(),
    body('messageId').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Message(req, res).unstarMessage(req, res)
)

export default router
