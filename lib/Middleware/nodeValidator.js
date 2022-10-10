"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const whatsapp_1 = require("../whatsapp");
const response_1 = __importDefault(require("../response"));
const validator = (req, res, next) => {
    var _a;
    try {
        const sessionId = (_a = req.query.id) !== null && _a !== void 0 ? _a : req.params.id;
        if (!(0, whatsapp_1.getSession)(sessionId)) {
            return (0, response_1.default)(res, 404, false, 'Session not found.');
        }
        res.locals.sessionId = sessionId;
        next();
    }
    catch (error) {
        console.log('validator ' + error);
    }
};
exports.default = validator;
