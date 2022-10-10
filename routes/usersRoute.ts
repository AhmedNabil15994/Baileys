import { Router } from 'express'
import { body, query } from 'express-validator'
import requestValidator from '../Middleware/requestValidator'
import sessionValidator from '../Middleware/sessionValidator'
import Users from '../Models/Users'

const router = Router()

router.post(
    '/checkPhone',
    query('id').notEmpty(),
    body('phone').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Users(req,res).checkPhone(req, res)
)

router.post(
    '/status',
    query('id').notEmpty(),
    body('phone').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Users(req,res).userStatus(req, res)
)

router.post(
    '/presence',
    query('id').notEmpty(),
    body('phone').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Users(req,res).userPresence(req, res)
)

router.post(
    '/profilePicture',
    query('id').notEmpty(),
    body('phone').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Users(req,res).userProfilePicture(req, res)
)

router.get(
    '/blockList',
    query('id').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Users(req,res).getBlockList(req, res)
)

router.post(
    '/blockUser',
    query('id').notEmpty(),
    body('phone').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Users(req,res).blockUser(req, res)
)

router.post(
    '/unblockUser',
    query('id').notEmpty(),
    body('phone').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Users(req,res).unblockUser(req, res)
)

router.post(
    '/rejectCall',
    query('id').notEmpty(),
    body('phone').notEmpty(),
    body('callId').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Users(req,res).rejectCall(req, res)
)

// router.post(
//     '/sendReceipt',
//     query('id').notEmpty(),
//     body('phone').notEmpty(),
//     body('messageId').notEmpty(),
//     requestValidator,
//     sessionValidator,
//     (req, res) => new Users(req,res).sendReceipt(req, res)
// )

export default router
