import express from 'express'
import routes from './routes'
import { init } from './whatsapp'

export function createServer() {
    let app = express()
    app.use(express.urlencoded({ extended: true }))
    app.use(express.json())
    app.use('/', routes)
    init()
    return app;
} 