import { Router } from 'express'
import { body, query } from 'express-validator'
import requestValidator from '../Middleware/requestValidator'
import sessionValidator from '../Middleware/sessionValidator'
import Groups from '../Models/Groups'

const router = Router()

router.get('/', query('id').notEmpty(), requestValidator, sessionValidator, (req, res) => new Groups(req, res).fetchGroups(req, res))

router.post(
    '/getGroupByID',
    query('id').notEmpty(),
    body('groupId').notEmpty(), 
    requestValidator, 
    sessionValidator, 
    (req, res) => new Groups(req, res).groupMetaData(req, res)
)

router.post(
    '/create',
    query('id').notEmpty(),
    body('subject').notEmpty(),
    // body('phones').isArray({ min: 1 }).notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Groups(req, res).createGroup(req, res)
)

router.post(
    '/updateGroupName',
    query('id').notEmpty(),
    body('groupId').notEmpty(),
    body('name').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Groups(req, res).updateGroupName(req, res)
)

router.post(
    '/updateGroupDescription',
    query('id').notEmpty(),
    body('groupId').notEmpty(),
    body('description').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Groups(req, res).updateGroupDescription(req, res)
)

router.post(
    '/updateGroupSettings',
    query('id').notEmpty(),
    body('groupId').notEmpty(),
    body('setting').isIn(['announcement', 'not_announcement', 'locked', 'unlocked']).notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Groups(req, res).updateGroupSettings(req, res)
)

router.post(
    '/getGroupParticipants',
    query('id').notEmpty(),
    body('groupId').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Groups(req, res).getGroupParticipants(req, res)
)

router.post(
    '/addGroupParticipant',
    query('id').notEmpty(),
    body('groupId').notEmpty(),
    body('phones').isArray({ min: 1 }).notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Groups(req, res).addGroupParticipant(req, res)
)

router.post(
    '/removeGroupParticipant',
    query('id').notEmpty(),
    body('groupId').notEmpty(),
    body('phones').isArray({ min: 1 }).notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Groups(req, res).removeGroupParticipant(req, res)
)

router.post(
    '/promoteGroupParticipant',
    query('id').notEmpty(),
    body('groupId').notEmpty(),
    body('phones').isArray({ min: 1 }).notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Groups(req, res).promoteGroupParticipant(req, res)
)

router.post(
    '/demoteGroupParticipant',
    query('id').notEmpty(),
    body('groupId').notEmpty(),
    body('phones').isArray({ min: 1 }).notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Groups(req, res).demoteGroupParticipant(req, res)
)

router.post(
    '/joinGroup',
    query('id').notEmpty(),
    body('code').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Groups(req, res).joinGroup(req, res)
)

router.post(
    '/leaveGroup',
    query('id').notEmpty(),
    body('groupId').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Groups(req, res).leaveGroup(req, res)
)

router.post(
    '/inviteCode',
    query('id').notEmpty(),
    body('groupId').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Groups(req, res).getInviteCode(req, res)
)

router.post(
    '/getGroupInviteInfo',
    query('id').notEmpty(),
    body('code').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Groups(req, res).getGroupInviteInfo(req, res)
)

router.post(
    '/acceptGroupInvite',
    query('id').notEmpty(),
    // body('groupId').notEmpty(),
    body('messageId').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Groups(req, res).acceptGroupInvite(req, res)
)

router.post(
    '/revokeGroupInvite',
    query('id').notEmpty(),
    // body('groupId').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Groups(req, res).revokeGroupInvite(req, res)
)

router.post(
    '/sendGroupInviteMessage',
    query('id').notEmpty(),
    body('phone').notEmpty(),
    body('group').notEmpty(),
    requestValidator,
    sessionValidator,
    (req, res) => new Groups(req, res).sendGroupInviteMessage(req, res)
)
export default router
