import { createServer } from '../createServer';
import supertest from 'supertest';
import { createSession } from '../whatsapp';
const app = createServer()
var channel_name = "test_channel";
describe("Check Messages Routes", () => {
    it("Send Message : should return success and Message id", async () => {
        let send = await supertest(app).post('/messages/sendMessage?id=wlChannel10425').send({ phone: '201016690106', body: 'Test Message From Testing' });
        expect(send.body.success).toEqual(true);
    })
})
