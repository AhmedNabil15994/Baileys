"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const requestValidator_1 = __importDefault(require("../Middleware/requestValidator"));
const nodeValidator_1 = __importDefault(require("../Middleware/nodeValidator"));
const Session_1 = __importDefault(require("../Models/Session"));
let router = (0, express_1.Router)();
let WLSession = new Session_1.default();
router.get('/find/:id', nodeValidator_1.default, (req, res) => WLSession.find(res));
router.get('/status/:id', nodeValidator_1.default, (req, res) => WLSession.status(res));
router.post('/add', (0, express_validator_1.body)('id').notEmpty(), (0, express_validator_1.body)('isLegacy').notEmpty(), requestValidator_1.default, (req, res) => WLSession.add(req, res));
router.delete('/delete/:id', nodeValidator_1.default, (req, res) => WLSession.del(req, res));
router.delete('/clearInstance/:id', nodeValidator_1.default, (req, res) => WLSession.clearInstance(req, res));
exports.default = router;
