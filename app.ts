import * as dotenv from 'dotenv';
import express from 'express'
import cluster from 'node:cluster'
import routes from './routes'
import { init } from './whatsapp'
// get env file data
dotenv.config();
let host: string = process.env.HOST ?? '127.0.0.1'
let port: string = process.env.PORT ?? '8881'
let NUMBER_CPU: string = process.env.NUMBER_CPU ?? '1'
// start express Configuration express & Use API Routes
let app = express()
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use('/', routes)

if (cluster.isPrimary) {
    console.log(`Primary ${process.pid} is running`);
    for (let i = 0; i < parseInt(NUMBER_CPU); i++) {
        cluster.fork();
    }
    cluster.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died`);
        cluster.fork();
    });
} else {
    app.listen(port, host, () => {
        init()
        console.log(`Server is listening on ${process.pid} https://${host}:${port}`)
    })
}

export default app
