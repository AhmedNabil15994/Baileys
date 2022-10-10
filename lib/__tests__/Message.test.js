"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const createServer_1 = require("../createServer");
const supertest_1 = __importDefault(require("supertest"));
const app = (0, createServer_1.createServer)();
var channel_name = "test_channel";
describe("Check Messages Routes", () => {
    it("Send Message : should return success and Message id", async () => {
        let send = await (0, supertest_1.default)(app).post('/messages/sendMessage?id=wlChannel10425').send({ phone: '201016690106', body: 'Test Message From Testing' });
        expect(send.body.success).toEqual(true);
    });
});
