import { Router } from 'express'
import { body, query } from 'express-validator'
import requestValidator from '../Middleware/requestValidator'
import sessionValidator from '../Middleware/sessionValidator'
import Business from '../Models/Business'

const router = Router()



router.post(
    '/userBusinessProfile',
    query('id').notEmpty(),
    body('phone').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Business(req,res).businessProfile(req, res)
)

router.post(
    '/getCollections',
    query('id').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Business(req,res).getCollections(req, res)
)

router.post(
    '/getOrders',
    query('id').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Business(req,res).getOrders(req, res)
)

router.post(
    '/getOrder',
    query('id').notEmpty(),
    body('orderId').notEmpty(),
    body('orderToken').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Business(req,res).getOrder(req, res)
)

router.post(
    '/getProducts',
    query('id').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Business(req,res).getProducts(req, res)
)

router.post(
    '/getProduct',
    query('id').notEmpty(),
    body('productId').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Business(req,res).getProduct(req, res)
)

router.post(
    '/createProduct',
    query('id').notEmpty(),
    body('name').notEmpty(),
    body('price').notEmpty(),
    body('currency').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Business(req,res).productCreate(req, res)
)

router.post(
    '/updateProduct',
    query('id').notEmpty(),
    // body('name').notEmpty(),
    // body('price').notEmpty(),
    body('productId').notEmpty(),
    // body('currency').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Business(req,res).productUpdate(req, res)
)

router.post(
    '/deleteProducts',
    query('id').notEmpty(),
    body('productIds').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Business(req,res).productDelete(req, res)
)

router.post(
    '/sendProduct',
    query('id').notEmpty(),
    body('phone').notEmpty(),
    body('productId').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Business(req,res).sendProduct(req, res)
)

router.post(
    '/sendCatalog',
    query('id').notEmpty(),
    body('phone').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Business(req,res).sendCatalog(req, res)
)

router.post(
    '/labels',
    query('id').notEmpty(),
    requestValidator,
    (req, res) => new Business(req,res).getLabels(req, res)
)

router.post(
    '/labelChat',
    query('id').notEmpty(),
    body('phone'),
    body('chat').if(body('phone').not().exists()).notEmpty(),
    body('labelId').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Business(req,res).labelChat(req, res)
)

router.post(
    '/unlabelChat',
    query('id').notEmpty(),
    body('phone'),
    body('chat').if(body('phone').not().exists()).notEmpty(),
    body('labelId').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Business(req,res).unlabelChat(req, res)
)

router.post(
    '/labelMessage',
    query('id').notEmpty(),
    body('messageId').notEmpty(),
    body('labelId').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Business(req,res).labelMessage(req, res)
)

router.post(
    '/unlabelMessage',
    query('id').notEmpty(),
    body('messageId').notEmpty(),
    body('labelId').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Business(req,res).unlabelMessage(req, res)
)

router.post(
    '/createLabel',
    query('id').notEmpty(),
    body('name').notEmpty(),
    body('color').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Business(req,res).createLabel(req, res)
)

router.post(
    '/updateLabel',
    query('id').notEmpty(),
    body('name').notEmpty(),
    body('color').notEmpty(),
    body('labelId').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Business(req,res).updateLabel(req, res)
)
router.post(
    '/deleteLabel',
    query('id').notEmpty(),
    body('labelId').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Business(req,res).deleteLabel(req, res)
)

router.post(
    '/quickReplies',
    query('id').notEmpty(),
    requestValidator,
    (req, res) => new Business(req,res).getQuickReplies(req, res)
)

router.post(
    '/createQuickReply',
    query('id').notEmpty(),
    body('shortcut').notEmpty(),
    body('message').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Business(req,res).createQuickReply(req, res)
)

router.post(
    '/updateQuickReply',
    query('id').notEmpty(),
    body('reply_id').notEmpty(),
    body('shortcut').notEmpty(),
    body('message').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Business(req,res).updateQuickReply(req, res)
)

router.post(
    '/deleteQuickReply',
    query('id').notEmpty(),
    body('reply_id').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Business(req,res).deleteQuickReply(req, res)
)


export default router
