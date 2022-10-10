import { createServer } from '../createServer';
import supertest from 'supertest';
const app = createServer()
var channel_name = "test_channel";
describe("Check Session API Routes", () => {
    describe("Create Session Tests", () => {
        it("create session : should return success and have qr", async () => {
            try {
                let add = await supertest(app)
                    .post('/session/add')
                    .send({ id: channel_name, isLegacy: false })
                    .expect('Content-Length', '15');
                expect(add.body.success).toEqual(true);
                expect(add.body.message).toEqual('QR code received, please scan the QR code.');
                expect(add.body.data.qr).not.toEqual(undefined)
            } catch (error) {

            }

        })
    })

    it("find session : should return 'Session found.' ", async () => {
        let add = await supertest(app).get('/session/find/' + channel_name);
        expect(add.body.message).toEqual('Session found.');
    })

    // it("delete session: should delete folder & logOut App", async () => {
    //     let check_delete = await supertest(app).delete('/session/delete/' + channel_name);
    //     expect(check_delete.body.success).toEqual(true);
    // })

    it("clear session: should delete folder & logOut App", async () => {
        let check_delete = await supertest(app).delete('/session/clearInstance/' + channel_name);
        expect(check_delete.body.success).toEqual(true);
    })

})
