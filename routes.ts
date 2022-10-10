import { Router } from 'express'
import instanceRoute from './routes/instanceRoute'
import sessionsRoute from './routes/sessionsRoute'
import chatsRoute from './routes/chatsRoute'
import groupsRoute from './routes/groupsRoute'
import messagesRoute from './routes/messagesRoute'
import usersRoute from './routes/usersRoute'
import businessRoute from './routes/businessRoute'
import response from './response'

let router = Router()

router.use('/instances', instanceRoute)
router.use('/sessions', sessionsRoute)
router.use('/chats', chatsRoute)
router.use('/groups', groupsRoute)
router.use('/messages', messagesRoute)
router.use('/users', usersRoute)
router.use('/business', businessRoute)

router.all('*', (req, res) => {
    response(res, 404, false, 'The requested url cannot be found.')
})

export default router
