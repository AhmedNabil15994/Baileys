"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const whatsapp_1 = require("../whatsapp");
const response_1 = __importDefault(require("../response"));
const validate = (req, res, next) => {
    var _a;
    try {
        const sessionId = (_a = req.query.id) !== null && _a !== void 0 ? _a : req.params.id;
        const states = ['connecting', 'connected', 'disconnecting', 'disconnected'];
        if (!(0, whatsapp_1.getSession)(sessionId)) {
            return (0, response_1.default)(res, 404, false, 'Session not found.');
        }
        let session = (0, whatsapp_1.getSession)(sessionId);
        let state;
        (session != null) ? state = states[session.ws.readyState] : state = 'disconnected';
        state = (state === 'connected' && typeof (session.isLegacy ? session.state.legacy.user : session.user) !== 'undefined') ? 'authenticated' : state;
        if (state !== "authenticated") {
            (process.env.DEBUG_MODE == 'true') ? console.log('sessionValidator sessionId : ' + sessionId + ' state: ' + state) : '';
            return (0, response_1.default)(res, 404, false, 'User Not authenticated.');
        }
        res.locals.sessionId = sessionId;
        next();
    }
    catch (error) {
        console.log('sessionValidator ' + error);
    }
};
exports.default = validate;
